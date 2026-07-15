# FRONTEND_BACKEND_COMPATIBILITY_REPORT.md

Every request the new Vastu Arya frontend can make, checked against the
backend as it stood at start-of-phase and as it stands after this phase.

Legend: **OK** = works as-is · **FIX** = fixed this phase · **N/C** = not needed.

## Public / customer

| # | Frontend caller                                        | Method + path                                | Request                                      | Response shape expected                                                                        | Before | After |
|---|--------------------------------------------------------|----------------------------------------------|----------------------------------------------|-------------------------------------------------------------------------------------------------|--------|-------|
| 1 | `authAPI.login`                                        | POST /auth/login                             | `{email,password}`                           | `{success,data:{token,user}}`                                                                   | OK     | OK    |
| 2 | `authAPI.register`                                     | POST /auth/register                          | `{name,email,phone,password}`                | `{success,data:{token,user}}`                                                                   | OK     | OK    |
| 3 | `authAPI.getMe`                                        | GET /auth/me                                 | -                                            | `{success,data:user}`                                                                            | OK     | OK    |
| 4 | `authAPI.updateProfile`                                | PUT /auth/profile                            | `{name?,phone?}`                             | `{success,data:user}`                                                                            | OK     | OK    |
| 5 | `servicesAPI.getAll` / `getBySlug`                     | GET /services · GET /services/:slug          | -                                            | `{success,data:service[] / service}`                                                             | OK     | OK    |
| 6 | `productsAPI.*`                                        | GET/POST/PUT/DELETE /products                | product body                                  | product envelopes                                                                                | OK     | OK    |
| 7 | `paymentAPI.createOrder`                               | POST /payment/create-order                   | `{amount,type,currency?}`                    | `{success,data:{orderId,amount,currency}}`                                                       | OK     | OK    |
| 8 | `paymentAPI.verifyPayment`                             | POST /payment/verify                         | `{razorpay_*,type,orderData}`                | `{success,data:{orderId or bookingId,paymentId}}`                                                | OK     | **FIX** (idempotency + audit + timeline) |
| 9 | `fetch PAYMENT_ROUTES.settings`                        | GET /payment/settings                        | -                                            | `{success,data:{primaryUPI,fallbackUPI,payeeName,...}}`                                          | OK     | OK    |
| 10| UPI modal `PAYMENT_ROUTES.upiSubmit`                   | POST /payment/upi/submit                     | multipart with `screenshot` + form fields    | `{success,data:{referenceId,status,bookingId?,orderId?}}`                                        | OK     | OK    |
| 11| Payment-pending/submitted polling                      | GET /payment/upi/status/:ref                 | -                                            | `{success,data:{referenceId,status,submittedAt,verifiedAt?}}`                                    | OK     | OK    |
| 12| `bookingStatusAPI.getPublicStatus`                     | GET /bookings/status/:bookingId/public       | -                                            | `{success,data:PublicBookingStatus}` (with `timeline[]`)                                         | OK     | OK    |
| 13| `accountAPI.getDashboard`                              | GET /account/dashboard                       | Bearer JWT                                    | `{success,data:{stats,latestBooking,latestOrder,latestStatusUpdate}}`                            | OK     | OK    |
| 14| `accountAPI.getBookings`                               | GET /account/bookings                        | Bearer + query `search/filter/page/limit`     | `{success,data:booking[],total,page,pages}`                                                      | OK     | OK    |
| 15| `accountAPI.getBookingDetail`                          | GET /account/bookings/:id                    | Bearer                                        | `{success,data:booking + timeline[]}`                                                            | OK     | OK    |
| 16| `accountAPI.getOrders` / `getOrderDetail`              | GET /account/orders(:id)                     | Bearer                                        | order list / detail                                                                              | OK     | OK    |
| 17| `accountAPI.getPayments`                               | GET /account/payments                        | Bearer + `filter`                             | `{success,data:payment[]}` unified                                                               | OK     | OK    |
| 18| `accountAPI.getProfile` / `updateProfile`              | GET/PUT /account/profile                     | Bearer                                        | `{success,data:profile}`                                                                          | OK     | OK    |
| 19| `accountAPI.getActivity`                               | GET /account/activity                        | Bearer + `page/limit`                         | `{success,data:event[],total,page,pages}`                                                        | OK     | OK    |
| 20| `accountAPI.claimBooking`                              | POST /account/claim                          | Bearer + `{bookingId,phone,email?}`           | `{success,message}`                                                                              | OK     | OK    |
| 21| `aiAPI.vastuAnalysis`                                  | POST /ai/vastu-analysis                      | `{concern,roomType?,direction?}` (+ optional multipart images) | `{success,data:{greeting,analysis,summary?,recommendations?[],warnings?[],nextSteps?[],remedies[],followUp[],confidence?,pdfUrl?,disclaimer?}}` | **404** | **FIX** |
| 22| `aiSettingsAPI.getPublic`                              | GET /ai-settings/public                      | -                                            | `{success,data:{quickSuggestions,ctaText,...}}`                                                  | **404** | **FIX** |
| 23| `aiSettingsAPI.get` (admin)                            | GET /ai-settings                             | Bearer                                        | full AISettings doc                                                                              | OK     | OK    |
| 24| `aiStatusAPI.check`                                    | GET /ai/status                               | -                                            | `{success,data:{provider,mode}}`                                                                 | OK     | OK    |
| 25| `productGeneratorAPI.generate`                         | POST /product-generator/generate             | `{input,category}`                            | `{success,data:{name,description,...}}`                                                          | OK     | OK    |

## Admin (used by admin panel — same domain, same JWT)

| # | Caller                          | Method + path                     | Before | After |
|---|---------------------------------|-----------------------------------|--------|-------|
| A1| `adminAPI.getDashboard`         | GET /admin/dashboard              | OK     | OK    |
| A2| `adminAPI.getUsers`/`updateUser`| GET /admin/users · PUT /admin/users/:id | OK  | OK    |
| A3| `adminAPI.seedProducts`/`Services`| POST /admin/seed-products · seed-services | OK | OK |
| A4| `bookingsAPI.*` (admin)         | GET/PUT /bookings                 | OK     | OK    |
| A5| Admin booking history           | GET /bookings/:id/history         | OK     | OK    |
| A6| Admin UPI list/verify/reject    | /admin/upi-payments/*             | OK     | OK    |
| A7| Admin leads                     | /admin/leads/*                    | OK     | OK    |
| A8| Admin customer lookup           | /admin/customers/*                | OK     | OK    |
| A9| Content, settings, sliders, popups, homepage, testimonials, theme | various | OK | OK |

## Webhooks (new)

| # | Caller           | Method + path                | Before  | After   |
|---|------------------|------------------------------|---------|---------|
| W1| Razorpay webhook | POST /payment/webhook        | **404** | **FIX** |

## Notes

- **Auth**: every `/account/*` route is behind `authMiddleware` and additionally does an explicit ownership check inside the handler (verified in `account.controller.ts`). Bearer token attached by the frontend `api.ts` interceptor from `localStorage.vastu_token`.
- **CORS**: the FE production domain is `https://vastuarya.com` — already whitelisted in `server.ts`. `*.vercel.app` and `localhost:3000` are also whitelisted for preview + local development. No change needed.
- **Cold-start retry**: frontend already handles Render cold-starts with a single 3-second retry (`api.ts` interceptor). Backend needs no change.
- **JSON envelope**: every response is `{success, data|message, ...}`; the frontend does not depend on additional top-level keys.
