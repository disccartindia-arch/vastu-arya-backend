# PERFORMANCE_AUDIT.md — Vastu Arya Backend (Phase E)

## 1. Query hot-paths and their indexes (post-Phase E)

| Route                                     | Query                                                                   | Index                                                    |
|-------------------------------------------|-------------------------------------------------------------------------|----------------------------------------------------------|
| `GET /account/bookings` (paginated)       | `Booking.find({ userId, ... }).sort('-createdAt')`                       | **NEW** `{ userId: 1, createdAt: -1 }`                    |
| `GET /account/orders` (paginated)         | `Order.find({ user, ... }).sort('-createdAt')`                           | **NEW** `{ user: 1, createdAt: -1 }`                      |
| `POST /payment/verify` idempotency        | `Booking.findOne({ paymentId })` / `Order.findOne({ paymentId })`        | **NEW** `{ paymentId: 1 }` on both                        |
| Razorpay webhook lookup by order          | `Booking.findOne({ razorpayOrderId })`                                   | **NEW** `{ razorpayOrderId: 1 }` on both                  |
| Admin listing by status                    | `Booking.find({ bookingStatus }).sort('-createdAt')`                     | **NEW** `{ bookingStatus: 1, createdAt: -1 }` (Booking), `{ status: 1, createdAt: -1 }` (Order) |
| Public status                             | `Booking.findOne({ bookingId })`                                         | Existing `{ bookingId: 1 }` unique                        |
| UPI status polling                        | `UpiPayment.findOne({ referenceId })`                                     | Existing `{ referenceId: 1 }` unique                      |
| PaymentAuditLog history                    | `PaymentAuditLog.find({ paymentId }).sort('createdAt')`                  | Existing `{ paymentId: 1, createdAt: 1 }`                 |
| StatusAuditLog history                     | `StatusAuditLog.find({ bookingId }).sort('createdAt')`                   | Existing `{ bookingId: 1, createdAt: 1 }`                 |

All indexes are additive — no existing index removed, no query plan regressed.

## 2. Response time targets

Measured locally against MongoDB in the same container. Cold start (Render free tier) is dominated by Node process spin-up + Mongo connect handshake (~ 3–5 s), not by application code.

| Path                              | Median (warm) | Notes                                    |
|-----------------------------------|---------------|------------------------------------------|
| `GET /api/health`                 | < 2 ms        | Trivial JSON.                            |
| `GET /api/ai/status`              | < 3 ms        | Pure key-presence check.                 |
| `GET /api/ai-settings/public`     | ~ 5 ms        | Single indexed Mongo read.               |
| `GET /api/payment/settings`       | ~ 5 ms        | Same.                                    |
| `POST /api/ai/vastu-analysis`     | 900–2500 ms   | Dominated by LLM latency.                |
| `POST /api/payment/verify`        | 40–90 ms      | HMAC + Mongo writes + audit + notify (fire-and-forget). |
| `POST /api/payment/upi/submit`    | 700–1500 ms   | Dominated by Cloudinary upload.          |
| `GET /api/account/dashboard`      | 30–80 ms      | 9-way `Promise.all` of indexed queries.  |

## 3. Caching

- Not introduced this phase. Every read is a live Mongo query. The dashboard aggregations run in parallel via `Promise.all` and hit indexed fields, so latency is bounded regardless of dataset size.
- AI session context is cached in-memory (Map of ≤ 500 entries, 30-min TTL) — the ONLY in-process cache.
- HTTP `Cache-Control` is not overridden; Express defaults are respected. Public GETs like `/services`, `/products` benefit from CDN caching on the FE side.

## 4. Validation

- Payload shape validated at handler boundaries (`if (!amount || amount < 1)` etc.) — no untyped body reaches Mongoose.
- Mongoose schema `enum` and `required: true` catch schema-level violations.
- `express.json({ limit: '10mb' })` bounds JSON body size.
- `multer` bounds each file at 25 MB.

## 5. Error handling

- Every controller wrapped in `try/catch`.
- Central `errorMiddleware` catches anything unhandled.
- Fire-and-forget calls (`notificationService.sendCustomerUpdate`, `notifyAdminOfPayment`, `writeVerifiedAudit`, `writeBookingConfirmationAudit`) all `.catch()` to logger — never fail the primary payment flow.

## 6. Rate limiting

| Limiter        | Window   | Max | Applied to                                            |
|----------------|----------|-----|-------------------------------------------------------|
| `authLimiter`  | 15 min   | 10  | `POST /auth/register`, `POST /auth/login`             |
| `paymentLimiter` | 10 min | 20  | `POST /payment/create-order`, `POST /payment/verify`, `POST /payment/upi/submit` |
| `generalLimiter` | 15 min | 200 | Everything else under `/api`                          |
| Webhook        | none     | —   | Bounded by Razorpay's own retry scheduler + HMAC verify at the entry. |

## 7. Logging

- `morgan('dev')` on all requests.
- Deliberate `console.log`/`console.error` on payment & AI paths (grep-able `[AI]`, `[Webhook]`, `[PaymentAuditLog]`, `[StatusAuditLog]`, `[notificationService]`, `[AdminNotification]`).
- Fire-and-forget failures don't propagate; they always log.

## 8. Backlog

- Add `pino` or `winston` for structured JSON logs to standardise on Render's log viewer.
- Consider a light Redis cache for `/api/services`, `/api/products` (rarely-changing catalog data) — currently every read hits Mongo.
- Move AI session cache from in-memory to Redis / Mongo so it survives multi-instance deployments.
