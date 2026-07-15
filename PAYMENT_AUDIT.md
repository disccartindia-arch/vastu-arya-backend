# PAYMENT_AUDIT.md — Vastu Arya Backend (Phase E)

## 1. Architecture snapshot

```
┌─────────── Razorpay (auto) ───────────┐   ┌────────── UPI Manual ─────────────┐
│                                       │   │                                   │
│ POST /payment/create-order            │   │ POST /payment/upi/submit          │
│   ↳ razorpay.orders.create()          │   │   ↳ Cloudinary upload             │
│                                       │   │   ↳ UpiPayment(UPI_PENDING)       │
│ POST /payment/verify                  │   │   ↳ Booking/Order(pending)        │
│   ↳ HMAC verify                        │   │   ↳ PaymentAuditLog(SUBMITTED)    │
│   ↳ Idempotency check (paymentId)     │   │   ↳ Admin email                   │
│   ↳ Booking/Order(status=paid)        │   │                                   │
│   ↳ pre-save hook → paymentStatus     │   │ Admin POST /admin/upi-payments/:id/{verify,reject}
│     :verified + bookingStatus:conf    │   │   ↳ UpiPayment(PAID or REJECTED)  │
│   ↳ StatusAuditLog×2 (Phase E new)    │   │   ↳ Booking/Order flip            │
│   ↳ PaymentAuditLog(VERIFIED, Phase E)│   │   ↳ PaymentAuditLog(V/R)          │
│   ↳ Customer notification email       │   │   ↳ StatusAuditLog (via booking.  │
│   ↳ Admin notification email          │   │        controller.ts extension)    │
│                                       │   │   ↳ Customer notification email   │
│ POST /payment/webhook (Phase E new)   │   │                                   │
│   ↳ HMAC verify (webhook secret)      │   │                                   │
│   ↳ payment.captured  → safety-net    │   │                                   │
│   ↳ payment.failed    → audit         │   │                                   │
│   ↳ refund.processed  → refund flow   │   │                                   │
└───────────────────────────────────────┘   └───────────────────────────────────┘
```

## 2. Requirement × implementation matrix

| Requirement                              | Implementation                                                                                    |
|------------------------------------------|---------------------------------------------------------------------------------------------------|
| Razorpay Order Creation                  | `createOrder` in `payment.controller.ts` — creates via `razorpay.orders.create` with `notes.type`. |
| Razorpay Signature Verification          | `hmacSha256(secret, "${orderId}|${paymentId}")` matched against `razorpay_signature` header value. |
| Webhooks                                 | **NEW**: `POST /api/payment/webhook`. Verifies `X-Razorpay-Signature` against re-serialised body with `RAZORPAY_WEBHOOK_SECRET`. Handles `payment.captured` / `payment.failed` / `refund.processed`. |
| Payment Verification                     | HMAC + optional server-side idempotency + `PaymentAuditLog` entry.                                |
| Duplicate Payment Protection             | **NEW**: `Booking.findOne({paymentId})` and `Order.findOne({paymentId})` short-circuits.          |
| Booking Creation                         | Only on the `booking`/`service` branch of `verifyPayment` (or via UPI verify).                    |
| Order Creation                           | Only on the `product` branch of `verifyPayment` (or via UPI verify).                              |
| Customer Dashboard Sync                  | Every write goes through the same `Booking`/`Order` models the customer dashboard reads from — no cache invalidation needed. `userId`/`user` is set at write-time (verified login) or later via the claim flow. |
| Admin Dashboard Sync                     | Same models; admin panel already queries these directly via `/api/bookings`, `/api/orders`, `/api/admin/upi-payments`. |
| Audit Logs                               | `PaymentAuditLog` (payment-lifecycle SUBMITTED/VERIFIED/REJECTED) + `StatusAuditLog` (per-field paymentStatus/bookingStatus transitions). Both append-only. **Phase E** extends `PaymentAuditLog` and `StatusAuditLog` coverage to Razorpay success — they were UPI-only before. |
| Email Notifications                      | `sendEmail` for the branded booking confirmation + `notificationService` for status-transition emails + `notifyAdminOfPayment` for admin. Every call is fire-and-forget so an email failure never fails the payment response. |

## 3. Prevented failure modes

| Failure mode           | Prevention                                                                                                                                        |
|------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| Duplicate payments     | `paymentId` lookup on both `Booking` and `Order` before creating a new document. Idempotent response includes `idempotent: true` marker.          |
| Duplicate bookings     | Same as above — `paymentId` is unique-ish per Razorpay payment. `bookingId` field already `unique: true`.                                          |
| Duplicate orders       | Same as above.                                                                                                                                     |
| Webhook replay         | Idempotency check on `paymentId` covers replayed `payment.captured`. `payment.failed` and `refund.processed` are additive audit rows, safe to replay. |
| Tampered requests      | HMAC `sha256(secret, "${orderId}|${paymentId}")` for verify. `sha256(webhookSecret, rawBody)` for webhook. Constant-time compare via Node's built-in string equality is *sufficient* here — see SECURITY_AUDIT.md §3. |
| Invalid booking IDs    | `Booking.findById` / `findOne({bookingId})` returns 404 with the same body shape as "exists but not yours" — no enumeration signal.               |
| Race conditions        | Mongo unique index on `Booking.bookingId` + `paymentId` lookup means concurrent `verifyPayment` calls for the same Razorpay payment can only produce one Booking. Second caller sees the idempotency short-circuit. |

## 4. Follow-ups (not shipped this phase)

- Store `razorpay_signature` on Booking too (currently only on Order). Additive.
- Move idempotency into a database-level unique index on `paymentId` for absolute concurrency safety instead of check-then-insert. Currently the small window between `findOne` and `create` is closed only by unique constraints on `bookingId`/`orderId` — good enough for typical loads but tightenable.
- Persist AI session context in Mongo instead of in-memory (currently multi-process deployments won't share context).
