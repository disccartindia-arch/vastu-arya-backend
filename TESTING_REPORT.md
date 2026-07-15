# TESTING_REPORT.md — Vastu Arya Backend (Phase E)

## 1. Static checks

| Check                    | Command                    | Result |
|--------------------------|----------------------------|--------|
| TypeScript compile       | `npx tsc --noEmit`         | ✅ **Exit code 0**, 0 errors |
| Dependency install       | `npm install`              | ✅ 219 packages, 0 errors    |
| Node engine constraint   | `"node": ">=18.0.0 <21.0.0"` in `package.json` | ✅ satisfied by current runtime |

## 2. Runtime smoke matrix

Backend was started with `npx ts-node src/server.ts` against a local MongoDB. All requests below returned the expected status + JSON shape.

### Public / Auth

| # | Test                                                                  | Method + Path                           | Expectation                                 | Result |
|---|-----------------------------------------------------------------------|-----------------------------------------|---------------------------------------------|--------|
| 1 | Health                                                                | GET  /api/health                        | 200 `{success:true,status:"ok"}`             | ✅ |
| 2 | AI provider status                                                    | GET  /api/ai/status                     | 200 `{success:true,data:{emergent,mode:"live"}}` | ✅ |
| 3 | AI settings public                                                    | GET  /api/ai-settings/public            | 200 with `quickSuggestions[]`               | ✅ |
| 4 | Payment settings                                                      | GET  /api/payment/settings              | 200 with `primaryUPI` etc.                  | ✅ |
| 5 | Login existing user                                                   | POST /api/auth/login                    | 200 with `token`                            | ✅ |
| 6 | Login invalid password                                                | POST /api/auth/login                    | 401                                          | ✅ |
| 7 | Register duplicate email                                              | POST /api/auth/register                 | 4xx "already registered"                    | ✅ |

### AI

| # | Test                                                                  | Method + Path                           | Expectation                                 | Result |
|---|-----------------------------------------------------------------------|-----------------------------------------|---------------------------------------------|--------|
| 8 | JSON call — financial concern                                          | POST /api/ai/vastu-analysis (JSON)      | 200 with `summary/recommendations/warnings/nextSteps/remedies/followUp[]/confidence` populated from **real** LLM. | ✅ |
| 9 | Session context — 2nd turn references 1st                             | POST /api/ai/vastu-analysis (sessionId reused) | 2nd response references topic of 1st (financial → bedroom financial-stability reference) | ✅ |
| 10| Multipart with 1 image                                                | POST /api/ai/vastu-analysis (multipart) | 200 with `meta.hasImages:true` and `meta.source:emergent` | ✅ |
| 11| Missing `concern`                                                     | POST /api/ai/vastu-analysis             | 400 with "concern is required."             | ✅ |

### Payment (Razorpay)

| # | Test                                                                  | Method + Path                           | Expectation                                 | Result |
|---|-----------------------------------------------------------------------|-----------------------------------------|---------------------------------------------|--------|
| 12| Verify with bad signature                                             | POST /api/payment/verify                | 400 "Payment verification failed"           | ✅ |
| 13| Verify with valid HMAC + Bearer                                       | POST /api/payment/verify                | 200; Booking created; `userId` linked; `paymentStatus:verified`; `bookingStatus:confirmed`; 2 StatusAuditLog rows + 1 PaymentAuditLog row written | ✅ |
| 14| Verify replay (same razorpay_payment_id)                              | POST /api/payment/verify                | 200 with `data.idempotent:true`, SAME bookingId, no duplicate document written | ✅ |
| 15| Webhook — valid signature `payment.captured`                          | POST /api/payment/webhook               | 200 "Webhook acknowledged"; PaymentAuditLog VERIFIED entry with `adminUser:razorpay-webhook` | ✅ |
| 16| Webhook — invalid signature                                           | POST /api/payment/webhook               | 401 "Invalid webhook signature."            | ✅ |
| 17| Webhook — missing signature header                                    | POST /api/payment/webhook               | 401 "Missing or unconfigured webhook signature." | ✅ |

### Customer Dashboard

| # | Test                                                                  | Method + Path                           | Expectation                                 | Result |
|---|-----------------------------------------------------------------------|-----------------------------------------|---------------------------------------------|--------|
| 18| Dashboard without auth                                                 | GET  /api/account/dashboard             | 401 "Access denied. No token provided."     | ✅ |
| 19| Dashboard after 1 verified Razorpay booking                            | GET  /api/account/dashboard             | 200 `{stats:{totalBookings:1,activeBookings:1,verifiedPayments:1,...},latestBooking:{bookingId:"BK…",serviceName:"Home Vastu",…}}` | ✅ |
| 20| Booking detail (with timeline)                                         | GET  /api/account/bookings/:id          | 200; `data.timeline[]` has both `paymentStatus:pending→verified` and `bookingStatus:pending_payment→confirmed` entries | ✅ |
| 21| Booking detail of another user's bookingId                             | GET  /api/account/bookings/:id          | 404 "Booking not found." (enumeration-safe) | ✅ |
| 22| Profile                                                                | GET  /api/account/profile               | 200 with `name/email/phone/memberSince/totalBookings/totalOrders` | ✅ |

## 3. Bugs found + fixed during testing

- **Bug** (pre-existing, uncovered by this phase's E2E): `account.controller.ts::getMyBookingDetail` `.select()` omitted `userId`, so the explicit ownership check always failed → 404 for the legitimate owner. **Fix**: added `userId` to the projection. Verified test #20 now returns 200 with the full timeline.

No other bugs found.

## 4. Not tested here (documented follow-up)

- Live Razorpay `create-order` calls require valid live/test Razorpay keys (env `RAZORPAY_KEY_ID/SECRET`). Local test uses placeholder secrets, so `POST /api/payment/create-order` was skipped (would 500). This is a **key-configuration** issue at deploy-time, not a code issue — production sets real keys via Render env vars.
- Real Razorpay webhook end-to-end against live dashboard — the HMAC verify was proven correct with a locally computed signature (tests 15–17), which is exactly what Razorpay's real signature is.
- SMTP send — `SMTP_USER/SMTP_PASS` unset locally; `notifyAdminOfPayment` logs `[AdminNotification] No ADMIN_NOTIFICATION_EMAIL or SMTP_USER configured — skipping admin email.` and the payment flow proceeds normally. Test the actual email delivery post-deploy.
- Vision model quality — GPT-4o accepted a logo image and produced a reply. Real floor plan quality is a domain-specific tuning task documented as follow-up.

## 5. Test data left in the local DB

- `users.e1test@example.com` (password `testpass123`)
- `bookings.BK1784093080029677` (Home Vastu, ₹11, verified)
- `payment_audit_logs`: 2 entries (`pay_TEST123`, `pay_e1_001`)
- `status_audit_logs`: 2 entries for `BK1784093080029677`

These are local-only test artifacts; production DB is untouched.
