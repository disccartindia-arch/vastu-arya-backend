# VASTUARYA PRODUCTION FORENSIC AUDIT — REPORT (FINAL)

**Date:** June 19, 2026
**Scope:** Frontend (Next.js 14, Vercel) + Backend (Express/Mongoose, Render)
**Method:** Static trace of provided source files — call-path tracing from UI trigger → API route → controller → model write. Two QR screenshot files (716×1600px) were pixel-measured directly to confirm the QR cropping root cause.

---

## EXECUTIVE SUMMARY

| Item | Status | Severity | Fixed this round? |
|---|---|---|---|
| A/B/E/G/H — paymentStatus missing → success shown as failure | **ROOT CAUSE CONFIRMED, FIXED** | 🔴 Critical | Yes |
| C — Book Appointment @ ₹11 button fragility | **Two latent bugs found, FIXED** | 🟡 Medium | Yes |
| D — Service Book Now button | **Same root cause as A/B** | 🔴 Critical | Yes (shared fix) |
| F — Slow page loads / Cloudinary | **Confirmed (Image 1), partially fixed** | 🟡 Medium | Partial (1 of 4 factors) |
| 1 — UPI QR too small / hard to scan | **ROOT CAUSE CONFIRMED via pixel measurement, FIXED** | 🟡 Medium | Yes |
| 7 — Duplicate UPI systems | **Confirmed, classified, NOT deleted (destructive — awaiting approval)** | 🟢 Cleanup | No — pending sign-off |
| 8 — Don't break Razorpay | **Respected — zero Razorpay logic touched** | OK | n/a |

---

## A, B, E, G, H — PAYMENT SUCCESS WITHOUT BUSINESS SUCCESS (the core bug)

### Root cause

**`lib/razorpay.ts`**, inside the Razorpay `handler` callback, gates success on:

```js
if (verifyRes.data.success && verifyRes.data.paymentStatus === 'paid') {
  options.onSuccess({ ... });
} else {
  toast.error('Payment could not be verified. Please contact support.');
  options.onFailure('verification_failed');
}
```

**`src/controllers/payment.controller.ts`**, `verifyPayment()` — the actual response objects, in the version supplied before this fix:

```js
// booking branch — no paymentStatus field
return res.json({ success: true, message: 'Booking confirmed!', data: { bookingId, paymentId } });

// product branch — no paymentStatus field
return res.json({ success: true, message: 'Order placed successfully!', data: { orderId, paymentId } });
```

`verifyRes.data.paymentStatus` was always `undefined`. `undefined === 'paid'` is always `false`. **The frontend unconditionally fell into the failure branch on every single successful payment**, regardless of how many times Razorpay itself displayed "Payment Successful" (as seen in your earlier-provided screenshot evidence — ₹849, redirecting in 4 seconds, fully successful on Razorpay's side).

### What actually happened on each "broken" payment

1. Razorpay signature (HMAC) verification — succeeds.
2. Backend **creates** the `Order` or `Booking` document with `status: 'paid'` — this write happens before the response is sent, so the database record is real and correct.
3. Response sent back missing `paymentStatus`.
4. Frontend's `else` branch fires: error toast, `onFailure()` called.
5. In `CheckoutClient.tsx`: `onFailure` only resets `loading` — cart is never cleared, no redirect to `/payment-success`.
6. In service detail pages: `onSuccess` (which would show "Booking confirmed!") never fires.

This single bug explains A (product), B (service), D (service Book Now appearing to do nothing after a real charge), E (product flow "broken"), and is exactly what G/H asked to be verified.

### Fix (shipped this round)

`src/controllers/payment.controller.ts` — added `paymentStatus: 'paid'` to:
- the booking/service success response
- the product success response
- the generic fallback success response

No other line in this file changed. `createOrder()`, the HMAC check, and both `Booking.create()`/`Order.create()` calls are untouched.

### H — verifying all success states are backend-gated

Traced both consuming pages (`CheckoutClient.tsx`, `app/(public)/services/[slug]/page.tsx`) end to end: neither has any client-only success path. Both `onSuccess` callbacks are only reachable through `lib/razorpay.ts`'s `paymentStatus === 'paid'` check, which only evaluates true once the backend has actually verified the signature and written the database record. No fake/frontend-only success screens exist in this codebase. The fix in `payment.controller.ts` is sufficient to make this already-correct architecture actually work.

---

## C — BOOK APPOINTMENT @ ₹11 BUTTON

Two distinct latent bugs found and fixed, neither of which is the literal explanation for what's visible in the earlier-provided screenshot (the button renders correctly there), but both are real, reproducible failure modes:

### Bug 1 — fragile CTA-type detection

`components/home/HeroSection.tsx`:
```js
const cta1IsBook = cta1Link === '/book-appointment' || cta1Link.includes('book');
```

`cta1Link` is admin-editable (`HomepageSettings.cta1Link` via the Website Editor, no validation on that field). Any saved link that doesn't contain the literal substring "book" silently degrades the primary CTA from "opens the booking popup" to "navigates to a plain link" — with zero error or warning anywhere.

**Fix:** Replaced the substring match with an explicit `Set`-based allowlist (`BOOKING_POPUP_LINKS`), so behavior is deterministic and can't drift based on what text happens to appear in an admin-typed URL.

### Bug 2 — silent permanently-empty popup on fetch failure

`components/common/AppointmentPopup.tsx` previously had no recoverable error state — if `GET /services` failed (cold start, network blip), the popup opened but stayed empty forever, with only a toast that disappears after a few seconds. From a user's perspective this looks exactly like "the button does nothing."

**Fix:** Added an explicit `loadError` state with a visible in-modal "Retry" button, so a failed fetch is recoverable without closing/reopening.

---

## D — SERVICE BOOK NOW BUTTON

Same root cause as A/B — `app/(public)/services/[slug]/page.tsx`'s `handleRazorpay()` uses the identical `initiateRazorpayPayment` path. Fixed by the same `payment.controller.ts` change; no separate code change needed in this file.

---

## F — SLOW PAGE LOADS / CLOUDINARY

Four contributing factors identified. One fixed this round (lowest-risk, highest-immediate-value); three documented for a separate, lower-urgency pass since they involve broader surface area (image pipeline migration, infra/billing decisions):

| Factor | Status |
|---|---|
| No explicit `limit` on category/store product fetches — relied on implicit backend default | Fixed — `CategoryClient.tsx` now passes `limit: 24` explicitly |
| Render free-tier cold starts (confirmed by `lib/api.ts`'s 25s timeout + retry-once logic) | Documented — this is a billing/infra decision, not a code fix |
| Seed-data product images are raw Unsplash URLs with manual `?w=600&h=600` params, not run through Cloudinary's `f_auto,q_auto` pipeline | Documented — would require a data migration, out of scope for a code-only round |
| No `next/image` usage in `ProductCard.tsx` / category listing — raw `<img loading="lazy">`, no responsive `srcset`, no Vercel image optimization | Documented — touches every product image render path, recommend as its own focused PR |

---

## ISSUE 1 — UPI QR CODE TOO SMALL / HARD TO SCAN

### Root cause — confirmed by direct pixel measurement, not assumption

The two QR source images uploaded measure **716×1600px** — a tall phone-screenshot aspect ratio, not a square crop. The actual scannable QR pattern occupies only the vertical band from **y=35.9% to y=70.6%** of the image (verified by cropping that exact region and visually confirming a clean, isolated QR code with no other UI chrome).

The component (`components/payment/UpiPaymentModal.tsx`) rendered this with:
```jsx
<div className="h-48 w-48 ...">
  <Image src={upi.qr} fill className="object-contain" />
</div>
```

`object-contain` on a 192×192px square box correctly shrinks the entire 716×1600 image to fit — meaning the actual QR pattern (only ~35% of the image's height) renders at roughly **75×75px**, far too small to scan reliably. This is not a CSS bug; `object-contain` did exactly what it's specified to do. The bug is that the box was sized for a pre-cropped square asset, but the supplied assets are full uncropped screenshots.

### Fix (shipped this round, applies to BOTH product and service flows)

`UpiPaymentModal.tsx` is the single shared component used by:
- `ServicePaymentButtons.tsx` (services)
- `AppointmentPopup.tsx` (₹11 booking)
- The product detail page's UPI button

So one fix covers all flows simultaneously. Changes:

1. Switched `object-contain` → `object-cover` + computed `object-position` + CSS `scale()` transform, tuned to the exact measured crop region of the current images, so the QR pattern fills the container edge-to-edge with no further asset changes needed.
2. Increased QR container size from fixed 192×192px to responsive `min(78vw, 320px)` — meaningfully larger and properly mobile-first.
3. Both UPI IDs always visible and independently tappable-to-copy below the QR, with a clear visual indicator of which one is currently selected for the displayed code.
4. Centered layout throughout the payment step.

### Exact crop coordinates, for clean re-exports

If you later supply pre-cropped square QR images (recommended for image quality — the current zoom-transform necessarily upscales/interpolates), use these measured fractions of the original 716×1600 screenshots:

```
left:   11.2%   (≈80px  of 716px width)
right:  88.7%   (≈635px of 716px width)
top:    35.9%   (≈575px of 1600px height)
bottom: 70.6%   (≈1130px of 1600px height)
```

This yields a clean 555×555px square in the original resolution. Any square export (600×600, 800×800, etc.) cropped to just the QR pattern plus its white quiet-zone border — excluding the bank icon, account name text, page indicator dots, UPI ID line, and Download/Share buttons — will work. Once you have clean assets, set `QR_IMAGES_ARE_PRECROPPED = true` at the top of `UpiPaymentModal.tsx` to skip the zoom-transform (one-line change, already wired up).

---

## ISSUE 7 — DUPLICATE UPI SYSTEMS

| File | Status |
|---|---|
| `controllers/upiVerificationController.ts` (root) | DEAD CODE — imports nonexistent `../lib/mongodb`, references undefined `adminAuthMiddleware` |
| `models/UpiPayment.ts` (root) | DEAD CODE — only consumed by the dead controller above |
| `routes/adminUpiRoutes.ts` (root) | DEAD CODE — never registered in `server.ts` |
| `components/common/UPIPaymentModal.tsx` | DEAD CODE — different architecture (qrserver.com), not imported by any page in this upload |
| `src/controllers/upiPayment.controller.ts` | PRODUCTION READY — registered, correctly wired |
| `src/models/UpiPayment.ts` | PRODUCTION READY |
| `src/routes/upiPayment.routes.ts` | PRODUCTION READY — registered |
| `src/routes/adminUpiPayments.routes.ts` | PRODUCTION READY — registered |
| `components/payment/UpiPaymentModal.tsx` | PRODUCTION READY — the one fixed this round |

**Not deleted this round** — deletion is destructive and irreversible from my side; flagging for explicit go-ahead in a follow-up pass.

---

## ISSUE 8 — RAZORPAY INTEGRITY

Confirmed untouched across both rounds:
- `createOrder()` — byte-for-byte identical
- HMAC signature verification logic — byte-for-byte identical
- `Booking.create()` / `Order.create()` calls — byte-for-byte identical
- The only backend change anywhere is the additive `paymentStatus` field

---

## FILES CHANGED THIS ROUND

| File | Change | Risk |
|---|---|---|
| `src/controllers/payment.controller.ts` | Added `paymentStatus: 'paid'` to 3 response objects | Low — additive only |
| `components/payment/UpiPaymentModal.tsx` | QR crop/zoom fix, larger size, both UPI IDs visible | Low — visual/layout only, submission logic untouched |
| `components/home/HeroSection.tsx` | Replaced substring CTA matching with explicit allowlist | Low — behaviorally identical for the default/common case |
| `components/common/AppointmentPopup.tsx` | Added retry UI for failed service fetch | Low — additive UI state only |
| `app/(public)/vastu-store/[category]/CategoryClient.tsx` | Added explicit `limit`/`sort` params to product fetch | Low — additive query params only |

## FILES FLAGGED FOR FUTURE CLEANUP (no action taken — destructive or broad-scope)

- Delete 4 dead-code UPI files (see Issue 7 table)
- Migrate `ProductCard.tsx` and listing pages to `next/image`
- Re-run product image seeding through Cloudinary `f_auto,q_auto` pipeline
- Consider Render paid tier to eliminate cold-start latency

## RISK ASSESSMENT / DEPLOYMENT RECOMMENDATION

All five changes this round are additive — no deletions, no schema changes, no Razorpay logic touched. They can be deployed together safely. Recommend deploying, then watching real payment traffic for 24–48 hours specifically to confirm `paymentStatus` now flows correctly end-to-end — this is the single highest-value fix, since it directly affects whether customers who paid see success or a false failure. The QR fix and the two button-hardening fixes are independent and lower-stakes.
