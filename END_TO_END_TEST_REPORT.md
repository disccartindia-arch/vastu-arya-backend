# END_TO_END_TEST_REPORT.md — Vastu Arya Backend (Phase E)

Complete production-flow rehearsal, run against `/app/backend` on a live MongoDB (`vastuarya_e1_test`) + Emergent LLM key (`EMERGENT_LLM_KEY` verified present).

## Flow rehearsed

```
Customer Login → Book Appointment → Razorpay Verify → Booking Creation →
Idempotent Replay → Dashboard Update → Booking Detail w/ Timeline →
AI Analysis (JSON) → AI Analysis (multi-turn / same session) →
AI Analysis (vision) → Webhook (valid) → Webhook (bad sig) → Webhook (no sig)
```

## Timeline of the run

| Step | Action                                                                 | Verified                                                                                             |
|------|------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1    | Login `e1test@example.com` / `testpass123`                              | HTTP 200, JWT returned.                                                                              |
| 2    | Call `POST /payment/verify` with **bad HMAC**                          | HTTP 400 "Payment verification failed" — signature check rejects.                                    |
| 3    | Call `POST /payment/verify` with **good HMAC** + Bearer                | HTTP 200. Booking `BK1784093080029677` created. `paymentStatus:verified`, `bookingStatus:confirmed`, `userId` linked. |
| 4    | Same call **replayed** with same `razorpay_payment_id`                  | HTTP 200 with `data.idempotent:true`; **no** second booking created; same `bookingId` returned.       |
| 5    | `GET /account/dashboard`                                                | HTTP 200. `stats.totalBookings=1, activeBookings=1, verifiedPayments=1, pendingPayments=0`. `latestBooking.bookingId="BK1784093080029677"`. |
| 6    | `GET /account/bookings/BK1784093080029677`                              | HTTP 200. `data.timeline[]` contains both `paymentStatus:pending→verified` and `bookingStatus:pending_payment→confirmed` entries. |
| 7    | Mongo direct check: `payment_audit_logs.find({paymentId:"pay_e1_001"})` | Row present: `VERIFIED / razorpay-auto` + full metadata snapshot.                                    |
| 8    | Mongo direct check: `status_audit_logs.find({bookingRef:"BK…677"})`     | 2 rows present, one per axis, `adminUser:razorpay-auto`.                                             |
| 9    | `POST /ai/vastu-analysis` (JSON, sessionId=`test-session-001`, "financial losses…") | HTTP 200. Response is **genuine LLM output** — `summary`, 3 `recommendations`, 2 `warnings`, 2 `nextSteps`, 3 `remedies`, 2 `followUp[]`, `confidence:"high"`, `note`. `meta.source:"emergent"`. |
| 10   | `POST /ai/vastu-analysis` (same sessionId, "What about my bedroom?")   | HTTP 200. Response explicitly ties bedroom advice to "financial stability" — **session context memory** is working.               |
| 11   | `POST /ai/vastu-analysis` (multipart, 1 image, "analyze this floor plan")| HTTP 200. `meta.hasImages:true`, `meta.source:"emergent"`. GPT-4o vision path exercised end-to-end. |
| 12   | `POST /payment/webhook` valid `payment.captured`, valid signature       | HTTP 200 "Webhook acknowledged (unlinked audit only)." — new `PaymentAuditLog` row written with `adminUser:razorpay-webhook`, `metadata.event:payment.captured`. |
| 13   | Same call with **wrong** signature                                     | HTTP 401 "Invalid webhook signature."                                                                |
| 14   | Same call with **no** `X-Razorpay-Signature` header                    | HTTP 401 "Missing or unconfigured webhook signature."                                                |

## Cross-check against frontend behaviour

The frontend Phase D update introduced these UI expectations. Each is now backed by the backend:

- **`/payment-success` timeline card** — reads `paymentStatus:pending→verified` and `bookingStatus:pending_payment→confirmed`. Both present as of step 6.
- **`/payment-pending` polling** every 8 s hits `GET /payment/upi/status/:ref` → transitions when status flips to `verified` / `paid` / `rejected`. Backend supports all three.
- **`/account/bookings/[bookingId]` timeline view** — reads `data.timeline[]`. Populated for both Razorpay (as of Phase E) and UPI (already Phase A).
- **`/vastu-ai` chat log** — reads `summary/recommendations/warnings/nextSteps/remedies/followUp[]/confidence`. All populated as of steps 9–11.
- **`/vastu-ai` "Ask AI" floating bubble** — hits the same endpoint with a `sessionId`. Multi-turn conversation memory verified in step 10.
- **`/vastu-ai` image upload** — verified functional in step 11.

## Test artifacts

- Backend log: `/tmp/be.log` (kept during the run; cleared at teardown).
- Test users / bookings / audit rows: retained in the local `vastuarya_e1_test` DB for post-hoc inspection.

## Pass/fail summary

| Category                  | Total | Passed | Failed |
|---------------------------|-------|--------|--------|
| Static (compile + install)| 3     | 3      | 0      |
| Public / Auth             | 7     | 7      | 0      |
| AI                        | 4     | 4      | 0      |
| Payment                   | 6     | 6      | 0      |
| Customer Dashboard        | 5     | 5      | 0      |
| Data-layer verification   | 2     | 2      | 0      |
| **Total**                 | **27**| **27** | **0**  |

## Bugs discovered + fixed during this rehearsal

1. `getMyBookingDetail` did not project `userId`, causing legitimate booking-detail requests to return 404. Fix committed in `account.controller.ts` — see FILE_CHANGE_REPORT.md.

## What still requires production-only verification (documented gaps)

- Real Razorpay checkout — needs live keys, verified in production sanity-check.
- SMTP delivery — needs real `SMTP_USER/PASS` and inbox check.
- Cloudinary upload of an actual UPI screenshot — needs real Cloudinary credentials.
- Vision quality on real floor plans — LLM quality is domain-specific; recommend a curated set of 20 floor-plan photos + human review as a follow-up QA sweep.

All four items are **configuration / operational**, not code issues.
