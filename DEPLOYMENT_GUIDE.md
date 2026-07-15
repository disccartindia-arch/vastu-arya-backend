# DEPLOYMENT_GUIDE.md — Vastu Arya Frontend

## Prerequisites

- Node.js 18+ (18.17 or later — Next.js 14 requirement)
- Yarn 1.22+ (or npm 9+, but the repo uses yarn.lock)
- Backend API deployed and reachable (Render / your host)

## Environment variables

Create a `.env.local` (or set at your host) with:

| Key                                     | Purpose                                       | Example                                                       |
|-----------------------------------------|-----------------------------------------------|---------------------------------------------------------------|
| `NEXT_PUBLIC_API_URL`                   | Backend REST base URL (must end with `/api`)  | `https://vastu-arya-backend.your-host.com/api`                |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`           | Razorpay public key                           | `rzp_live_XXXXXXXX` (production) or `rzp_test_XXXXXXXX` (staging) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`  | (optional) Search Console verification token  | `A1b2C3d4E5F6…`                                               |

**Never** put `RAZORPAY_KEY_SECRET` in the frontend — only the backend uses it (see `lib/razorpay.ts` for the HMAC verification handoff).

## Install & build

```bash
yarn install
yarn build   # produces the .next/ directory
yarn start   # serves the production build on :3000
```

For hosts like Vercel / Netlify / Render Static, use their default Next.js buildpack — no custom command required.

## Verify after deploy

1. Hit `/` — homepage should load in < 3 s.
2. Hit `/favicon.ico` and `/site.webmanifest` — both should return HTTP 200.
3. Hit `/vastu-ai` — the two-pane layout should render, "Ask AI" floating button should be visible on the homepage.
4. Send a test message on `/vastu-ai` — you should see the thinking dots, then the typewriter reveal.
5. Trigger checkout with a test cart:
   - Enter valid delivery info → Pay button opens Razorpay in Test Mode.
   - Close the Razorpay popup → we detect `user_dismissed` and reset the button (no failure page).
   - Test in an incognito with the Razorpay script blocked (Chrome DevTools → Network → block `checkout.razorpay.com`) → UPI modal opens automatically as the fallback.
6. Try `/payment-failed?reason=script_load_failed&ref=X&amount=299&service=Test` — verify the decoded reason text, timeline, and 3 CTAs.

## Cache-busting favicons

The new favicons live at fixed paths (`/favicon.ico`, `/favicon-16.png`, …). Browsers aggressively cache the old JPEG-based favicon — for public visitors this update takes effect the next time the browser refreshes its favicon cache (usually within a few page loads, or immediately on hard-reload).

If you want to force an update for logged-in / power users, append a version query in the metadata (edit `app/layout.tsx`):

```ts
icon: [{ url: '/favicon.ico?v=2', sizes: 'any', type: 'image/x-icon' }, …]
```

## Rollback

The change is fully additive except for these five behavioural swaps:

- `/payment-failure` now renders the enhanced `/payment-failed` UI.
- Razorpay `script_load_failed` / `create_order_failed` now auto-open the UPI fallback (silent).
- Booking-confirm no longer shows the hardcoded `vastuarya@ybl` — it now opens the UPI modal (which pulls the live UPI id from `GET /api/payment/settings`).
- The dead `layout.tsx` at the repo root is removed; only `/app/app/layout.tsx` is used (unchanged behaviour, only cleanup).
- The dead `components/common/UPIPaymentModal.tsx` is removed; the live modal is `components/payment/UpiPaymentModal.tsx` (unchanged).

To roll back, restore the branch/commit prior to this update. No database migration or backend redeploy is required.

## Support

- Backend contract: unchanged in this update. See `lib/api.ts`, `lib/accountAPI.ts`, `config/payment.config.ts`.
- Design tokens: unchanged in this update. See `tailwind.config.js`.
