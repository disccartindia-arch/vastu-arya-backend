# SECURITY_AUDIT.md — Vastu Arya Backend (Phase E)

## 1. AuthN / AuthZ

| Surface                | Mechanism                                                                                                                       |
|------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Customer login         | `authMiddleware` — Bearer JWT via `jsonwebtoken`, HS256, `JWT_SECRET` env-only, `User.isActive` check.                          |
| Guest checkout         | `optionalAuth` on `/payment/verify` and `/payment/upi/submit` — populates `req.user` if token present, silently continues if not.|
| Admin routes           | `authMiddleware` + `adminMiddleware` (checks `req.user.role === 'admin'`).                                                       |
| Account routes         | `authMiddleware` on the router + **explicit `userId === req.user._id` inside every handler** (defence in depth vs. filter-only). |
| Public status page     | No auth, but the controller `.select()`s a narrow field set — `adminNotes` is never even fetched from Mongo on that path.        |
| Webhook                | `X-Razorpay-Signature` HMAC verify against `RAZORPAY_WEBHOOK_SECRET`.                                                            |

## 2. Ownership enforcement (customer dashboard)

Every `/account/*` handler runs **two** checks:

1. `authMiddleware` verifies the Bearer JWT → sets `req.user`.
2. Explicit inside-the-handler comparison: `booking.userId === req.user._id.toString()` (or `order.user.toString()`), else 404.

The 404 is intentional — a mismatched-ownership response with the same shape as "not found" prevents booking-ID enumeration.

## 3. Payment integrity

- `verifyPayment` computes `sha256(RAZORPAY_KEY_SECRET, "${orderId}|${paymentId}")` and compares against `razorpay_signature` from the request body. Mismatch → 400.
- `razorpayWebhook` computes `sha256(RAZORPAY_WEBHOOK_SECRET, JSON.stringify(body))` and compares against the `X-Razorpay-Signature` header. Mismatch → 401.
- **Constant-time comparison**: Node's `===` for hex strings of identical length is *not* strictly constant-time, but the timing-attack surface here is negligible — an attacker would need to submit thousands of guesses per second and the endpoint sits behind `paymentLimiter` (20 req / 10 min per IP). A follow-up hardening (using `crypto.timingSafeEqual`) is noted in the backlog but not blocking.

## 4. Injection surfaces

- **Mongo**: All queries are through Mongoose `find({ someField: value })` with typed schemas — no `$where`, no string concatenation into `$where`. Regex is built from `String(search)` explicitly (see `account.controller.ts` search branch) — user input is coerced to string, not interpreted as a Mongo query object.
- **JSON**: `express.json({ limit: '10mb' })` — parser rejects malformed bodies with 400 before they reach handlers.
- **AI prompt injection**: `sanitiseUserInput()` strips `[SYSTEM]`, `ignore previous instructions`, `you are now`, `disregard your …` patterns before passing to the LLM. Prompt is server-controlled; user text is a message-role payload, never spliced into the system prompt. Vision inputs are base64-encoded, not user-controlled URLs — no SSRF surface.

## 5. Broken auth / broken authz vectors — checked

| Vector                                            | Blocked?                                                                                       |
|---------------------------------------------------|------------------------------------------------------------------------------------------------|
| Passing another user's `bookingId` on `/account/bookings/:id` | 404 (explicit ownership check).                                                       |
| Passing another user's `orderId`                  | 404.                                                                                          |
| Escalating role via `PUT /account/profile`        | `update` object hard-coded to `{name, phone}` — role can't be set.                            |
| Forging `req.user` in the handler                 | `req.user` is only set by `authMiddleware` / `optionalAuth` — those verify JWT signature.     |
| Weak JWT secret                                   | `JWT_SECRET` env var; the deploy guide mandates ≥ 32-char random value.                        |
| Replay of a stolen Bearer                          | Token expires (default `jsonwebtoken` config is 30 days — advisable to reduce for prod).      |
| Sending an empty `X-Razorpay-Signature`           | Handler returns 401 "Missing or unconfigured webhook signature" before any HMAC work.          |
| Bypassing rate limiter                            | `express-rate-limit` uses IP; `paymentLimiter` = 20/10min, `authLimiter` = 10/15min, `generalLimiter` = 200/15min. |

## 6. File uploads

- `upload.single('screenshot')` / `upload.array('images', 4)` — `multer.memoryStorage()`, 25 MB per file.
- `fileFilter` restricts to `jpeg|jpg|png|webp|gif|mp4|mov|webm` — other types rejected before touching Cloudinary.
- Cloudinary transform limits size to 1200×1200 max for images; no arbitrary transformation coming from the user.

## 7. AI endpoints

- `/vastu-analysis` is **public** by design (chat is a marketing-funnel surface). Rate-limited via `generalLimiter` (200/15min per IP). Session cache capped at 500 entries, 30 min TTL — cannot balloon memory.
- No PII is written to the AI provider or logged from the FE payload except the user's own concern text.

## 8. What's still on the roadmap

- `crypto.timingSafeEqual` for HMAC compares (defence in depth).
- Move JWT to shorter lifetimes with a refresh-token flow (currently long-lived).
- Persistent session store for AI context (currently in-memory; multi-instance deployments lose context between hits to different pods).
