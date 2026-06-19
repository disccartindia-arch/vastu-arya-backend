# CHANGELOG — June 19, 2026 forensic fix round (final)

## Backend files changed

### `src/controllers/payment.controller.ts`
**What changed:** Added `paymentStatus: 'paid'` to three response objects inside `verifyPayment()` — the booking/service success branch, the product success branch, and the generic fallback branch.

**What did NOT change:** `createOrder()`, Razorpay HMAC signature verification, `Booking.create()`/`Order.create()` write logic, email sending logic. No imports added or removed. No new endpoints.

## Frontend files changed

### `components/payment/UpiPaymentModal.tsx`
**What changed:**
- Switched QR image rendering from `object-contain` to `object-cover` + a computed `object-position` and CSS `scale()` transform, tuned to the measured crop region (left 11.2% / right 88.7% / top 35.9% / bottom 70.6%) of the current 716×1600px source screenshots.
- Increased the QR container from a fixed 192×192px to a responsive `min(78vw, 320px)` square.
- Both primary and secondary UPI IDs are now always visible and independently copyable, with a visual indicator of which is active.
- Added a `QR_IMAGES_ARE_PRECROPPED` flag (currently `false`) — a one-line switch to disable the zoom-transform once clean, pre-cropped square QR images are supplied.
- Submission logic (`handleSubmit`, field names, endpoint, response parsing) is byte-for-byte unchanged from the prior round.

### `components/home/HeroSection.tsx`
**What changed:** Replaced `cta1Link.includes('book')` substring matching with an explicit `BOOKING_POPUP_LINKS` Set containing only `/book-appointment`. Default/common-case behavior (admin never edits the CTA link) is unchanged.

### `components/common/AppointmentPopup.tsx`
**What changed:** Added a `loadError` state and a visible in-modal "Retry" button shown when `GET /services` fails, replacing the previous toast-only (and effectively unrecoverable) failure UI. Razorpay handler and UPI hook usage are unchanged from the prior round.

### `app/(public)/vastu-store/[category]/CategoryClient.tsx`
**What changed:** Added explicit `limit: 24` and `sort: '-createdAt'` query params to the product fetch, replacing reliance on the backend's implicit default limit.

## Database schema changes
None.

## Endpoints changed
None added or removed. `POST /api/payment/verify` response body gained one new field (`paymentStatus`); all other fields unchanged in shape and meaning. `GET /products` now receives explicit `limit`/`sort` query params from the category page where it previously sent none — the endpoint itself is unmodified and already supported these params.

## Performance optimizations implemented
- Explicit pagination limit on category page product fetch (see above).

## Performance items identified but NOT implemented this round (see REPORT.md "Issue F")
- Render free-tier cold-start latency — infrastructure/billing decision, not a code fix
- Seed-data product images not run through Cloudinary's automatic format/quality pipeline
- No `next/image` usage in product card / listing components

## Items identified but NOT deleted this round (destructive — see REPORT.md "Issue 7")
- `controllers/upiVerificationController.ts` (dead code)
- `models/UpiPayment.ts` at repo root (dead code)
- `routes/adminUpiRoutes.ts` (dead code, never registered)
- `components/common/UPIPaymentModal.tsx` (dead code, different architecture, unused)

## Deployment notes
- The `payment.controller.ts` fix is backend-only and is the highest-priority item — it unblocks the core revenue/booking confirmation path.
- All frontend changes in this round are additive (new state, new query params, new CSS) — no breaking changes to existing component props or page behavior.
- No environment variables, secrets, or Razorpay configuration were touched.
