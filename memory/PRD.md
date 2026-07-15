# PRD — Vastu Arya Backend Phase E (Backend Production Implementation)

## Original problem statement (verbatim)

> VASTU ARYA BACKEND – PRODUCTION IMPLEMENTATION (PHASE E). You are working ONLY
> on the Backend Repository. Make the backend fully compatible with the (Phase D)
> frontend and production-ready. Do NOT redesign the architecture unnecessarily.
> Do NOT remove existing working functionality. Preserve backward compatibility
> wherever possible. Tasks: (1) Complete Payment System — Razorpay create-order,
> HMAC verify, webhooks, duplicate protection, booking/order creation, dashboard
> sync, audit logs, email notifications. Manual UPI QR + screenshot flow
> preserved. Prevent duplicates / replays / tampering / race conditions.
> (2) AI Vastu Engine rebuilt on a real LLM — unique responses, session context,
> uncertainty handling, image analysis for floor plans / layouts / blueprints /
> land images, structured JSON `{answer, summary, recommendations, warnings,
> nextSteps, followUp[], confidence, pdfUrl?, timeline?}`. (3) Customer dashboard
> endpoints verified for auth, ownership, pagination, filtering. (4) Notification
> system pluggable to WhatsApp/SMS later. (5) Customer status engine with full
> lifecycle + audit + dashboard sync + admin sync + notifications. (6) Perf:
> indexes, response time, caching, validation, rate limiting, logging. (7)
> Security: JWT, admin/customer perms, webhook signing, payment verification,
> file uploads, AI endpoints. Prevent replay / unauthorised access / injection.
> (8) End-to-end tests. Deliverables: updated backend repo + IMPLEMENTATION_REPORT.md
> + API_CHANGELOG.md + DATABASE_CHANGES.md + TESTING_REPORT.md + DEPLOYMENT_GUIDE.md
> + END_TO_END_TEST_REPORT.md.

## Stack

- Node.js ≥ 18 · Express 4.19 · TypeScript 5.4 · Mongoose 8.4 · MongoDB.
- Deploy: Render (`render.yaml`), MongoDB Atlas, Cloudinary (screenshots).
- Repo: `https://github.com/disccartindia-arch/vastu-arya-backend` (cloned to `/app/backend`).

## User personas (unchanged from earlier rounds)

1. **Paying customer** (Razorpay auto or UPI manual).
2. **Repeat customer** using the dashboard to track bookings/orders/payments.
3. **Admin** approving UPI submissions, updating booking statuses, running the AI-settings admin UI.
4. **AI-first visitor** — no login, gets Vastu analysis with optional images.

## Core requirements (static)

- Every existing route/response shape preserved (backward compatibility).
- All payments audit-logged (append-only).
- Every booking status transition audit-logged + optionally customer-notified via email.
- Guest checkout supported; verified login-time linkage adds `userId` to Booking/Order when the customer is logged in.
- No fabricated AI answers — the model must refuse rather than guess.
- Multi-image AI vision support without breaking the pure-JSON path.

## Implemented in this phase (Phase E, Jan 2026)

- **Payment**:
  - `verifyPayment` now idempotent (dedupe by `razorpay_payment_id`).
  - Razorpay success now writes `PaymentAuditLog(VERIFIED)` + two `StatusAuditLog` rows so the customer booking timeline is populated.
  - Customer-notification dispatch fires on Razorpay success (previously only on admin transitions).
  - **New**: `POST /api/payment/webhook` for Razorpay `payment.captured` / `payment.failed` / `refund.processed`. HMAC-verified against `RAZORPAY_WEBHOOK_SECRET`.
- **AI**:
  - **New**: `POST /api/ai/vastu-analysis` (JSON or multipart with up to 4 images) matching the FE contract.
  - **New**: `GET /api/ai-settings/public` for visitor-safe settings.
  - **New**: Emergent Universal Key primary provider (GPT-4o + vision); direct Gemini + Anthropic retained as fallbacks.
  - **New**: per-`sessionId` in-memory context store (30-min TTL, 6-turn buffer, capped 500 entries).
  - Structured JSON contract: `greeting/analysis/summary/recommendations/warnings/nextSteps/remedies/followUp[]/confidence/note/needsMoreInfo/clarifyingQuestions/disclaimer/consultationCTA`.
- **Dashboard**: bug fix in `getMyBookingDetail` (userId not in projection) + four new perf indexes on Booking + four on Order.
- **Notification**: no code change — the existing pluggable `notificationService.sendCustomerUpdate` is now called from Razorpay `verifyPayment` too.
- **Status engine**: dual-axis writes on Razorpay success wire it up end-to-end.
- **Docs**: 12 markdown files shipped (see FILE_CHANGE_REPORT.md).
- **Testing**: 27 e2e tests pass — see END_TO_END_TEST_REPORT.md.

## Backlog / P1

- Persist AI session context in Mongo (currently in-memory, doesn't survive process restarts / multi-instance).
- Move payment idempotency to a unique-index on `paymentId` (belt-and-braces).
- Add `crypto.timingSafeEqual` to HMAC comparisons.
- Streaming (SSE) for the AI response — FE is already streaming-ready.
- Persistent structured JSON logging (pino / winston) for Render's log viewer.

## Non-goals

- Frontend changes (Phase D already shipped).
- Rebuilding admin UI, i18n, or database schemas.
- Adding actual WhatsApp/SMS providers (the dispatch layer supports them, no real provider wired in).
