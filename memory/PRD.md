# PRD — Vastu Arya Frontend Production Update

## Original problem statement (verbatim)

> VASTU ARYA FRONTEND – PRODUCTION UPDATE. You are working ONLY on the Frontend
> Repository. Do NOT modify backend logic. Do NOT redesign the website. Maintain
> the current premium UI and branding. Your task is to audit the frontend first,
> then implement all required frontend improvements. Tasks: (1) Payment
> experience overhaul with loading / progress / retry / continue / animations /
> failed / pending / verification-pending / timeline / Razorpay unavailable →
> UPI auto-fallback. (2) Customer dashboard with My Orders / Bookings /
> Payments / Activity / Profile / Booking-Order-Payment Timeline surfaced in
> the Navbar, responsive on desktop/tablet/mobile. (3) Favicon replacement
> (favicon.ico + 16/32 + apple 180 + android 192/512) wired via Next.js
> metadata + manifest + PWA icons + browser tabs. (4) AI Vastu UI: chat, typing
> animation, thinking indicator, conversation history, image upload previews +
> multiple, retry, clear, new-chat, suggested questions, follow-ups, better
> error handling, responsive mobile — no hardcoded responses. (5) AI Analysis
> screen: image upload, progress, analysis loading, confidence indicator (if
> backend provides), section cards (Summary/Recommendations/Warnings/Next
> Steps), Export to PDF (if backend supports), Share, Copy, Download. (6)
> Performance: lazy loading, image loading, loading skeletons, caching,
> animations, a11y, SEO, Core Web Vitals. (7) Testing: no TS errors, no ESLint
> errors, no build errors, no broken imports, no broken routes, no console
> errors. Deliverables: updated repo + IMPLEMENTATION_REPORT.md +
> FILE_CHANGE_REPORT.md + TESTING_REPORT.md + DEPLOYMENT_GUIDE.md.

## Stack

- Next.js 14.2.5 (App Router) · TypeScript · Tailwind · Zustand · framer-motion · axios
- Backend URL supplied via `NEXT_PUBLIC_API_URL`; not modified in this update.

## User personas

1. **Paying customer** — books a Vastu consultation or buys a product, pays via Razorpay or UPI.
2. **Repeat customer** — uses the /account dashboard to track bookings, orders, payments and status changes.
3. **AI-first visitor** — describes a concern and receives an AI Vastu analysis, may then book.

## Core requirements (static)

- Preserve premium brand: saffron/gold palette, Playfair Display + DM Sans, luxury feel.
- Consume existing backend endpoints via `lib/api.ts` / `config/payment.config.ts`.
- No hardcoded AI responses; render only what the backend returns.
- Every interactive / info element has a `data-testid`.
- Fully responsive (375px → 1440px).

## What's been implemented (this session — Jan 2026)

- **Payment result screens**: `/payment-success`, `/payment-failed`, `/payment-pending`, `/payment-submitted` all rewritten with a shared `PaymentTimeline`, decoded error copy, animation and CTAs.
- **Checkout**: `PaymentProgress` inline tracker + Razorpay-unavailable auto-fallback to UPI + dedicated `Pay via UPI QR` button.
- **AppointmentPopup**: passes real captured lead name/phone to Razorpay; falls back to UPI on gateway failures.
- **AI Vastu**: new shared engine `useVastuChat` + `ChatUI` primitives used by both the floating `VastuAIGuide` bubble and the `/vastu-ai` page. Chat log with thinking dots, typewriter reveal, per-message copy/share/download/retry, follow-up chips, multi-image upload previews, room+direction selects.
- **Favicons**: multi-size PNGs + `.ico` + Apple + Android + maskable, PWA manifest wired through `metadata.icons` + `metadata.manifest`.
- **Navbar**: desktop dropdown + mobile menu expose Overview / My Bookings / My Orders / My Payments / Activity / Profile.
- **Account detail pages**: booking + order pages use `PaymentTimeline` for a real customer-visible status arc.
- **Print stylesheet** for `/vastu-ai` PDF-save fallback.
- **Docs delivered**: `FRONTEND_AUDIT.md`, `PAYMENT_UI_AUDIT.md`, `AI_UI_AUDIT.md`, `FAVICON_AUDIT.md`, `IMPLEMENTATION_REPORT.md`, `FILE_CHANGE_REPORT.md`, `TESTING_REPORT.md`, `DEPLOYMENT_GUIDE.md`.

## Backlog / P1 candidates

- **Streaming AI responses** — when the backend adds SSE / `text/event-stream`, only `useVastuChat.send()` needs to change; the UI is already ready.
- **Backend image analysis** — the composer already accepts up to 4 images and passes a `File[]` to `send()`. When the backend accepts multipart Vastu-analysis requests, wire the array into the request body.
- **Confidence indicator from backend** — the `ConfidencePill` renders only when `payload.confidence` is present; ask the backend team to populate it.
- **PDF export via backend** — the UI checks for `payload.pdfUrl` first; ask the backend team to generate signed URLs, otherwise the client-side print fallback continues.
- **Lighthouse pass on production** — Core Web Vitals numbers not measurable in this sandbox.

## Non-goals

- Backend changes.
- Design system changes (colours / fonts / layout / spacing).
- Admin panel changes.
- i18n dictionary expansion.
