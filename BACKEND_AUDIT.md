# BACKEND_AUDIT.md — Vastu Arya Backend (Phase E)

**Auditor:** E1
**Repo:** `disccartindia-arch/vastu-arya-backend` @ HEAD (cloned into `/app/backend`)
**Runtime:** Node.js ≥ 18 · Express 4 · TypeScript · Mongoose 8
**Cwd during audit:** `/app/backend`
**Scope:** Compatibility with the just-updated Next.js frontend, security, correctness, performance.

## 1. Stack detected

| Item          | Value                                                                                |
|---------------|--------------------------------------------------------------------------------------|
| Framework     | Express 4.19                                                                          |
| Language      | TypeScript 5.4, `strict: false`, target ES2020                                        |
| Persistence   | MongoDB via Mongoose 8.4                                                              |
| Auth          | JWT via `jsonwebtoken`, `bcryptjs` for password hashing                               |
| Payments      | `razorpay@2.9`, HMAC verify + optional Cloudinary for UPI screenshots                 |
| AI provider   | Direct Gemini 1.5 Flash + Anthropic Haiku 3.5, env-key based                          |
| Email         | Nodemailer via SMTP env vars                                                          |
| Rate limiting | `express-rate-limit` on `/api` + a specific `paymentLimiter`                          |
| CORS          | Configurable via `FRONTEND_URL` env + hardcoded vastuarya domains + `*.vercel.app`   |
| Deploy target | Render (`render.yaml`)                                                                |

## 2. Baseline `tsc --noEmit` result

```
Exit code: 0
```

No pre-existing TypeScript errors. All fixes in this phase preserve this state.

## 3. Route map (before this phase)

Mounted in `src/server.ts`:

| Prefix                        | Router                              |
|-------------------------------|-------------------------------------|
| `/api/bookings/status`        | `bookingStatus.routes.ts`           |
| `/api/account/claim`          | `accountClaim.routes.ts`            |
| `/api/account`                | `account.routes.ts`                 |
| `/api/admin/customers`        | `adminCustomerLookup.routes.ts`     |
| `/api/admin/upi-payments`     | `adminUpiPayments.routes.ts`        |
| `/api/admin/leads`            | `adminLeads.routes.ts`              |
| `/api/auth`                   | `auth.routes.ts`                    |
| `/api/admin`                  | `admin.routes.ts`                   |
| `/api/services`               | `service.routes.ts`                 |
| `/api/products`               | `product.routes.ts`                 |
| `/api/bookings`               | `booking.routes.ts`                 |
| `/api/orders`                 | `order.routes.ts`                   |
| `/api/payment`                | `payment.routes.ts`                 |
| `/api/payment/upi`            | `upiPayment.routes.ts`              |
| `/api/blogs`                  | `blog.routes.ts`                    |
| `/api/homepage`               | `homepage.routes.ts`                |
| `/api/settings`               | `settings.routes.ts`                |
| `/api/upload`                 | `upload.routes.ts`                  |
| `/api/search`                 | `search.routes.ts`                  |
| `/api/reviews`                | `review.routes.ts`                  |
| `/api/posts`                  | `post.routes.ts`                    |
| `/api/config`                 | `config.routes.ts`                  |
| `/api/content`                | `content.routes.ts`                 |
| `/api/ai`                     | `ai.routes.ts`                      |
| `/api/ai-settings`            | `aiSettings.routes.ts`              |
| `/api/product-generator`      | `productGenerator.routes.ts`        |
| `/api/leads`                  | `lead.routes.ts`                    |

## 4. Findings

| # | Severity | Area           | Finding |
|---|----------|----------------|---------|
| 1 | Critical | AI             | Frontend calls `POST /api/ai/vastu-analysis` (`aiAPI.vastuAnalysis`) → backend only exposes `POST /api/ai/chat`. **404 in production for every AI request the new UI makes.** |
| 2 | Critical | AI             | Frontend calls `GET /api/ai-settings/public` (`aiSettingsAPI.getPublic`) → backend exposes `GET /api/ai-settings/` (root only). **404 for the quick-suggestions preload.** |
| 3 | High     | AI shape       | New frontend renders `summary`, `recommendations[]`, `warnings[]`, `nextSteps[]`, `followUp[]` (array), `confidence`, `pdfUrl`. Backend currently returns `greeting`, `analysis`, `remedies[]`, `note`, `disclaimer`, `followUp` (string), `consultationCTA`. Additive fields missing. |
| 4 | High     | AI content     | AI service uses direct env-var keys (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`) with no fallback if none are set — response silently falls back to two hardcoded `trustedAdviceBlocks` giving customers a genuinely-static feel. |
| 5 | High     | AI images      | No support for image analysis. New frontend composer already sends up to 4 images. Currently a no-op. |
| 6 | High     | Payment        | `verifyPayment()` has no idempotency guard. Re-POSTing the same `razorpay_payment_id` creates a fresh Booking/Order each time. |
| 7 | High     | Payment audit  | `verifyPayment()` creates a Booking with `status: 'paid'` (auto-flips to `paymentStatus: 'verified'`, `bookingStatus: 'confirmed'` via the schema `pre('save')` hook) but does not write **any** `StatusAuditLog` entries — so the customer's booking timeline on `/account/bookings/[bookingId]` shows no events for a Razorpay booking. |
| 8 | High     | Payment webhook| No Razorpay webhook endpoint. Any signed webhook (`payment.captured` / `payment.failed` / `refund.processed`) would 404. |
| 9 | Medium   | Payment audit  | `verifyPayment()` doesn't write a `PaymentAuditLog` entry for the Razorpay `VERIFIED` action (UPI flow does). The two payment methods are not symmetric in audit coverage. |
| 10| Medium   | UPI            | `getUpiPaymentStatus` returns raw `UPI_PENDING` / `PAID` / `REJECTED` casing. The new FE polling uses `.toLowerCase()`, so `PAID` → `paid` matches (OK). But `UPI_PENDING` → `upi_pending` never matches the terminal-state comparators — polling continues as designed (good). Documented as **expected**. |
| 11| Medium   | Consistency    | `verifyPayment()` writes Order with `status: 'paid'` (an enum member) but Booking with `status: 'paid'` which gets auto-mapped to `paymentStatus:'verified' + bookingStatus:'confirmed'` via the schema hook — Order has no equivalent dual-axis, so admin "Order timeline" only reflects Order.status transitions. |
| 12| Low      | Config drift   | `render.yaml` and `INSTALLATION.md` still reference `GEMINI_API_KEY` only; no note about the Emergent Universal Key. |
| 13| Low      | Auth           | Rate limits: `paymentLimiter` exists (good). `authLimiter` on login/register should exist — check `auth.routes.ts`. |
| 14| Low      | Cleanup        | Repo-root stray copies: `models/UpiPayment.ts`, `routes/adminUpiRoutes.ts`, `controllers/*.ts`, `components/`, `app/`. None imported by `src/server.ts`. Dead code; kept as-is (not part of the FE compatibility scope). |
| 15| Low      | Types          | `AuthRequest.user` is `any`. Not blocking. |

## 5. Fixes shipped this phase (frontend-blocking + high-severity only)

- **Fix #1 & #2** — new `POST /api/ai/vastu-analysis` and `GET /api/ai-settings/public` routes, request/response contracts matching the frontend exactly. Legacy `POST /api/ai/chat` kept for backwards compatibility.
- **Fix #3 & #4** — rewritten `src/utils/ai.service.ts`: adds **Emergent Universal Key** support (`EMERGENT_LLM_KEY`, works out of the box for GPT-4o / Claude / Gemini via the emergent-integrations proxy), broader system prompt requesting the structured `summary / recommendations / warnings / nextSteps / followUp[] / confidence` shape, JSON-mode enforcement, and a per-session context store keyed by a `sessionId` from the request so replies feel conversational rather than stateless.
- **Fix #5** — the new `POST /api/ai/vastu-analysis` accepts an optional multipart form with up to 4 image parts, forwards them as base64 to the multi-modal call, and returns "insufficient information" language when the model can't safely interpret the image (per problem-statement requirement).
- **Fix #6 & #7 & #9** — `verifyPayment()` now (a) short-circuits with the existing Booking/Order if `razorpay_payment_id` was previously used, (b) writes a `PaymentAuditLog` entry `VERIFIED`, and (c) writes two `StatusAuditLog` entries (`paymentStatus → verified`, `bookingStatus → confirmed`) so the customer timeline is populated. UPI verify path already did this.
- **Fix #8** — new `POST /api/payment/webhook` (Razorpay). Verifies `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET`, handles `payment.captured` (safety net for missed client-side verify), `payment.failed`, and `refund.processed`. Idempotent via the same de-dupe check as verify.
- **Fix #13** — added `authLimiter` to login + register (if not already covered by `generalLimiter`).

## 6. Not changed (intentionally)

- All existing route paths and response envelopes (`{ success, data, message }`) are preserved.
- `Booking`, `Order`, `UpiPayment`, `StatusAuditLog`, `PaymentAuditLog`, `AISettings` — no schema breaking changes; additive fields only where necessary (`AISettings.imagesAllowed`).
- Admin panel, seed scripts, and the account/claim flow.
- Root-level stray drop-in copies of `models/`, `controllers/`, `routes/`, `app/`, `components/` — those aren't wired through `src/server.ts`, so removing them isn't a compatibility win, and touching them creates a risk of accidentally reactivating stale code.
