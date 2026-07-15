# FRONTEND_AUDIT.md — Vastu Arya

**Auditor:** E1 (frontend production update)
**Date:** Jan 2026
**Scope:** Frontend repository only. Backend logic, DB, and API contracts are **not** modified.

## 1. Stack detected

| Item              | Value                                    |
|-------------------|------------------------------------------|
| Framework         | **Next.js 14.2.5 (App Router)**          |
| Language          | TypeScript (strict off, ignore build errors on) |
| Styling           | Tailwind CSS 3.4                         |
| State             | Zustand                                  |
| HTTP              | Axios (`lib/api.ts`, 25s timeout, cold-start retry) |
| Motion            | framer-motion                            |
| Icons             | lucide-react                             |
| i18n              | Custom (`lib/i18n.ts`, `en` / `hi`)      |
| Backend           | Render-hosted, `NEXT_PUBLIC_API_URL` env |

## 2. Directory layout

```
/app
├── app/                # App Router
│   ├── (auth)/         # authenticated group (only /dashboard stub)
│   ├── (public)/       # public routes (services, payment-*, vastu-ai …)
│   ├── account/        # customer dashboard (this update expands it)
│   ├── admin/          # admin panel
│   ├── api/            # server actions & proxy routes (upi-payment, products)
│   └── layout.tsx      # root layout + <head> metadata
├── components/         # UI components (payment/, account/, common/, layout/, …)
├── config/             # payment.config.ts (single source of UPI truth)
├── hooks/              # useUpiPayment
├── lib/                # api.ts, accountAPI.ts, razorpay.ts, seo.ts, i18n
├── store/              # zustand (auth/cart/ui)
├── public/             # brand assets (logo.jpg, /images/qr/*)
└── layout.tsx          # DUPLICATE of app/layout.tsx (see §4)
```

## 3. Routing map (public)

`/`, `/about`, `/contact`, `/privacy`, `/terms`, `/blog`, `/blog/[slug]`,
`/services`, `/services/[slug]`, `/vastu-store`, `/vastu-store/[category]`,
`/vastu-store/product/[slug]`, `/vastu-ai`, `/vastu-feed`, `/search`,
`/book-appointment`, `/booking-confirm`, `/checkout`, `/order-status`,
`/payment-success`, `/payment-failed`, `/payment-failure`, `/payment-pending`,
`/payment-submitted`, `/status/[bookingId]`, `/login`, `/dashboard`,
`/account`, `/account/bookings`, `/account/bookings/[bookingId]`,
`/account/orders`, `/account/orders/[orderId]`, `/account/payments`,
`/account/activity`, `/account/profile`.

Middleware normalises casing for a small set of legacy paths (Vastu-Store → vastu-store, etc.).

## 4. Findings (frontend)

| # | Severity | Area          | Finding |
|---|----------|---------------|---------|
| 1 | High     | Favicon       | Only `/logo.jpg` is referenced as favicon in `metadata.icons`. No `.ico`, no PWA icons, no manifest. Browsers, iOS home-screen, Android install banners all render a raw JPEG. (fixed — see FAVICON_AUDIT.md) |
| 2 | High     | Payment UX    | `/payment-success` is a 20-line stub with no timeline, no share, no next-steps. `/payment-failure` (older path) is a bare stub. See PAYMENT_UI_AUDIT.md. |
| 3 | Medium   | Payment UX    | Two duplicate failure pages (`/payment-failed` and `/payment-failure`) — inconsistent copy. |
| 4 | Medium   | Payment UX    | Razorpay outage / script-load fail toasts but does NOT auto-open the UPI fallback (requirement). |
| 5 | Medium   | Payment UX    | No visible payment progress indicator during Razorpay → verify → success handshake. |
| 6 | High     | AI Vastu UI   | The floating `VastuAIGuide` and the `/vastu-ai` page render the whole response at once. Feels static, not conversational. See AI_UI_AUDIT.md. |
| 7 | Medium   | AI Vastu UI   | No conversation history, no follow-up suggestions, no retry, no copy/share/download, no new-chat / clear-conversation controls. |
| 8 | Medium   | Navbar        | User dropdown only links to `/admin` (if admin) and `/dashboard`. Does NOT surface Orders / Bookings / Payments / Activity / Profile per requirement. |
| 9 | Low      | Duplicate     | `/app/layout.tsx` (root) and `/app/app/layout.tsx` (App Router) are near-duplicates. Only `app/app/layout.tsx` is actually used by Next.js. The root-level file is dead code and confusing. |
| 10| Low      | Duplicate     | `components/common/UPIPaymentModal.tsx` is unused; the live modal is `components/payment/UpiPaymentModal.tsx`. |
| 11| Medium   | Booking-confirm | Hardcoded `vastuarya@ybl` label in the fallback card contradicts `config/payment.config.ts` (primary = aryavartguna@ybl). |
| 12| Low      | Loading        | Several pages use ad-hoc `🕉️` spinners. Skeletons exist in `AccountStates.tsx` — reuse across app. |
| 13| Low      | Booking / Order detail | `/account/bookings/[bookingId]` and `/account/orders/[orderId]` exist but lack a **timeline** view. |

## 5. Build & tooling

- `next build` completes clean (`Done in 43s`, all pages compiled).
- `next.config.js` currently sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` — kept as-is to avoid altering deploy behaviour; we run a separate lint pass in TESTING_REPORT.md.
- All backend routes are consumed via `lib/api.ts` (axios) or `config/payment.config.ts`. No route strings are duplicated inside pages.

## 6. What this update changes vs. leaves alone

**Changed (frontend files only):**

- `app/app/layout.tsx` — favicon/manifest metadata, viewport metadata.
- `public/*` — new favicons (`favicon.ico`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`, `android-192.png`, `android-512.png`, `android-512-maskable.png`) and `site.webmanifest`.
- `app/(public)/payment-success/*`, `/payment-failed/*`, `/payment-failure/*`, `/payment-pending/*`, `/payment-submitted/*` — upgraded UX + timeline + retry / continue actions.
- `components/payment/PaymentTimeline.tsx`, `components/payment/PaymentProgress.tsx` — new reusable primitives.
- `components/common/VastuAIGuide.tsx` — chat interface with history, typing animation, thinking indicator, retry, new-chat.
- `app/(public)/vastu-ai/VastuAIClient.tsx` — full AI conversation UI with follow-ups, image uploads, copy / share / download.
- `components/layout/Navbar.tsx` — account dropdown surfacing every dashboard section.
- `app/account/bookings/[bookingId]/page.tsx`, `app/account/orders/[orderId]/page.tsx` — timeline + detail cards.

**Untouched:**

- All API calls, endpoints, request/response shapes.
- Existing branding (colors, fonts, layout, spacing).
- Backend, admin panel, i18n dictionaries, auth flow, cart flow.
- Razorpay integration (`lib/razorpay.ts`) — only its **error path** in the checkout page now falls back to UPI.
