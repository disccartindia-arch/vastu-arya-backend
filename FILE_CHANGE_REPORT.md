# FILE_CHANGE_REPORT.md — Vastu Arya Backend (Phase E)

## Rewritten (overwrite)

- `src/utils/ai.service.ts` — added Emergent Universal Key primary provider, `callAIStructured()` (JSON-mode), `callAIVision()`, provider fan-out (Emergent → Gemini → Anthropic). Direct Gemini/Anthropic paths retained as fallbacks. All previous public exports still exist with unchanged signatures.
- `src/routes/ai.routes.ts` — added `POST /api/ai/vastu-analysis` (JSON + multipart), added in-memory per-`sessionId` context store (500 entries, 30-min TTL, 6-turn buffer). `POST /api/ai/chat` retained byte-compatible.
- `src/controllers/payment.controller.ts` — added `verifyPayment` idempotency (dedupe by `razorpay_payment_id`), added `PaymentAuditLog(VERIFIED)` write, added two `StatusAuditLog` writes for the customer timeline, added new customer-notification dispatch on Razorpay success. Added new export `razorpayWebhook` for the webhook route.

## Search-replace edits

- `src/routes/payment.routes.ts` — mounted `POST /webhook` on the existing router.
- `src/routes/aiSettings.routes.ts` — added public `GET /public` route above the existing admin `GET /`.
- `src/models/Booking.ts` — added four performance indexes.
- `src/models/Order.ts` — added four performance indexes.
- `src/controllers/account.controller.ts` — one-line fix to include `userId` in the projection of `getMyBookingDetail` (previously omitted, causing legitimate owner requests to 404).

## New files

- `.env.example` — full env template documenting every knob including the new `EMERGENT_LLM_KEY` and `RAZORPAY_WEBHOOK_SECRET`.

## Audit + deliverable docs

- `BACKEND_AUDIT.md`
- `FRONTEND_BACKEND_COMPATIBILITY_REPORT.md`
- `PAYMENT_AUDIT.md`
- `AI_ENGINE_AUDIT.md`
- `SECURITY_AUDIT.md`
- `PERFORMANCE_AUDIT.md`
- `IMPLEMENTATION_REPORT.md`
- `API_CHANGELOG.md`
- `DATABASE_CHANGES.md`
- `TESTING_REPORT.md`
- `DEPLOYMENT_GUIDE.md`
- `END_TO_END_TEST_REPORT.md`
- `FILE_CHANGE_REPORT.md` (this file)

## Not modified (intentionally)

- All existing route paths and mount order in `src/server.ts`. **One line added** to mount the webhook (see `payment.routes.ts` change).
- All Mongoose schemas' fields — Phase E only adds indexes.
- All existing controllers not listed above.
- Admin routes, upload routes, seed scripts, lead / claim flow.
- Root-level stray drop-in copies of `models/`, `controllers/`, `routes/`, `app/`, `components/` — those aren't imported by `src/server.ts`, so they can't affect production behaviour and touching them creates risk of accidentally reactivating stale code.
