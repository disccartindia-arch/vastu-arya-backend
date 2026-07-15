# FILE_CHANGE_REPORT.md — Vastu Arya Frontend Production Update

## New files (created this update)

### Favicons & PWA
- `public/favicon.ico` — multi-resolution (16, 32, 48)
- `public/favicon-16.png`
- `public/favicon-32.png`
- `public/apple-touch-icon.png`
- `public/android-192.png`
- `public/android-512.png`
- `public/android-512-maskable.png`
- `public/site.webmanifest`

### Payment
- `components/payment/PaymentTimeline.tsx` — reusable vertical timeline (done/active/pending/failed/skipped states).
- `components/payment/PaymentProgress.tsx` — 4-stage inline progress bar for Checkout.

### AI Vastu
- `components/vastu-ai/useVastuChat.ts` — shared chat engine (thinking → typewriter → done/error, retry, clear).
- `components/vastu-ai/ChatUI.tsx` — presentational pieces (ThinkingIndicator, AssistantMessage, UserMessage, EmptyChat) with copy/share/download/retry/pdf actions.

### Audit deliverables
- `FRONTEND_AUDIT.md`
- `PAYMENT_UI_AUDIT.md`
- `AI_UI_AUDIT.md`
- `FAVICON_AUDIT.md`
- `IMPLEMENTATION_REPORT.md`
- `FILE_CHANGE_REPORT.md` (this file)
- `TESTING_REPORT.md`
- `DEPLOYMENT_GUIDE.md`

## Rewritten files (overwrite)

- `app/layout.tsx` — `metadata.icons` (multi-format), `metadata.manifest`, `metadata.appleWebApp`. Removed `{ icon: '/logo.jpg', apple: '/logo.jpg' }`.
- `app/(public)/payment-success/PaymentSuccessClient.tsx` — animation, meta card, timeline, next-step CTAs, copy/share/WA.
- `app/(public)/payment-failed/PaymentFailureClient.tsx` — decoded errors, timeline, retry, UPI-fallback, WA help.
- `app/(public)/payment-failure/PaymentFailureClient.tsx` — delegates to enhanced `/payment-failed` client (legacy path preserved).
- `app/(public)/payment-pending/PaymentPendingClient.tsx` — timeline + 8s status polling with auto-forward.
- `app/(public)/payment-submitted/PaymentSubmittedClient.tsx` — timeline + 10s status polling with auto-forward.
- `app/(public)/checkout/CheckoutClient.tsx` — `PaymentProgress` inline, UPI-fallback CTA, Razorpay auto-fallback on `script_load_failed` / `create_order_failed`.
- `app/(public)/vastu-ai/VastuAIClient.tsx` — two-pane chat, image upload, follow-ups, retry, copy/share/download/print.
- `app/(public)/booking-confirm/BookingConfirmClient.tsx` — removed hardcoded `vastuarya@ybl` label; UPI action now opens the modal directly.
- `components/common/VastuAIGuide.tsx` — rebuilt as a real chat sheet with header actions and shared engine.
- `components/common/AppointmentPopup.tsx` — Razorpay `onFailure` now auto-opens UPI on gateway-unavailable errors; passes name/phone/email/description to `initiateRazorpayPayment`.
- `components/layout/Navbar.tsx` — desktop user dropdown expanded to all account sections; mobile menu adds an "My Account" group.
- `app/account/bookings/[bookingId]/page.tsx` — proper `PaymentTimeline` view + status history table.
- `app/account/orders/[orderId]/page.tsx` — Order timeline (Placed → Prepared → Shipped → Delivered).
- `app/globals.css` — added print stylesheet block for the `/vastu-ai` Print/Save-as-PDF feature.

## Deleted files

- `layout.tsx` (repo-root) — dead code, never referenced by the App Router. The active layout is `app/layout.tsx`.
- `components/common/UPIPaymentModal.tsx` — dead code (not imported anywhere). Live modal is `components/payment/UpiPaymentModal.tsx` and remains unchanged.

## Untouched (explicitly)

- `lib/api.ts`, `lib/accountAPI.ts`, `lib/razorpay.ts`, `lib/seo.ts`, `lib/i18n.ts`, `lib/utils.ts`, `lib/bookingStatusAPI.ts`
- `config/payment.config.ts`
- `hooks/useUpiPayment.ts`
- `components/payment/UpiPaymentModal.tsx` (Round 7 fixes preserved)
- `components/payment/ServicePaymentButtons.tsx`
- `store/*`, `types/*`, `middleware.ts`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`
- All backend endpoints in `app/api/*` (server routes — untouched)
- Admin panel (`app/admin/*`)
- `public/logo.jpg` — preserved as-is for OG/Twitter share images and navbar avatar
