# PAYMENT_UI_AUDIT.md — Vastu Arya

Focus: Every screen a paying customer can land on, from checkout → verification → success/failure/pending.

## Screens inventory (before this update)

| Route                         | Purpose                        | State before update                                                                 |
|-------------------------------|--------------------------------|-------------------------------------------------------------------------------------|
| `/checkout`                   | Cart → Razorpay                | Working, but "Opening Payment…" is the only loading feedback. No progress bar.      |
| `/book-appointment`           | Opens AppointmentPopup         | Loading placeholder OK.                                                             |
| `/booking-confirm`            | Booking summary + UPI QR link  | Hardcoded UPI id (`vastuarya@ybl`) contradicts `payment.config.ts`. Fixed here.     |
| `/payment-success`            | After Razorpay verify → paid   | 20 lines, no timeline, no share, no next steps. Rebuilt.                            |
| `/payment-failed`             | After Razorpay explicit fail   | Good copy, no timeline, no auto-fallback trigger. Enhanced.                         |
| `/payment-failure`            | Legacy duplicate of above      | Bare stub. Unified with `/payment-failed`.                                          |
| `/payment-pending`            | Verification pending (UPI)     | OK, missing timeline + status auto-refresh. Enhanced.                               |
| `/payment-submitted`          | Just-submitted UPI reference   | OK, missing timeline. Enhanced.                                                     |
| `AppointmentPopup`            | Service picker → Razorpay/UPI  | Falls back to UPI only on user-click. Auto-fallback added on Razorpay script load. |
| `UpiPaymentModal`             | UPI QR + screenshot + txnId    | Working (Round 7 fixes intact).                                                     |
| `ServicePaymentButtons`       | Razorpay + UPI buttons on service pages | Working. No progress feedback. Enhanced with inline progress.               |

## Concrete gaps → fixes

1. **No payment progress indicator between "Pay" click and "Success/Fail".**
   Added `components/payment/PaymentProgress.tsx` — a 4-step animated tracker
   (Order → Gateway → Verifying → Done) that the checkout / booking flows can show
   inline. Non-blocking, non-modal.

2. **No payment timeline on result screens.**
   Added `components/payment/PaymentTimeline.tsx` — a compact vertical timeline
   used by every result screen (`/payment-success`, `/payment-pending`,
   `/payment-submitted`, `/payment-failed`). Renders steps with their current
   status (done / active / pending / failed).

3. **Razorpay unavailability did not auto-fallback to UPI.**
   `lib/razorpay.ts` already reports `script_load_failed` and `create_order_failed`.
   `CheckoutClient.tsx` now catches those cases and opens the UPI modal automatically
   with the same amount + item context. The `AppointmentPopup` behaves the same way.

4. **`/payment-failure` was a bare stub.**
   Replaced with a redirect to the enhanced `/payment-failed` page (single source
   of truth), so any legacy back-end return URL still lands on a proper failure UX.

5. **No "retry payment" affordance on failure.**
   Failure page now has three explicit CTAs:
   - **Try Again** (opens same payment flow) — primary.
   - **Pay via UPI Instead** — secondary, sends the user to the UPI QR modal
     with the failed order's amount/item preserved via `?amount=` / `?item=` query.
   - **Get Help on WhatsApp** with pre-filled context.

6. **Payment success felt anticlimactic.**
   Success screen now uses a scaled-in check icon + a subtle framer-motion "burst"
   animation, followed by a payment timeline and "Continue" CTAs (View Booking /
   Track Order / Continue Shopping).

7. **No verification-pending polling.**
   `/payment-pending` and `/payment-submitted` now poll `GET /api/payment/upi/status/:ref`
   every 8 seconds (up to 3 minutes). If backend confirms `verified`, they auto-redirect
   to `/payment-success`. If backend confirms `rejected`, they auto-redirect to
   `/payment-failed?ref=...&reason=...`. Otherwise they keep displaying "pending".

8. **Better error messages.**
   Failure screen now decodes common error codes returned by `initiateRazorpayPayment`
   (`user_dismissed`, `script_load_failed`, `verification_failed`, `verification_error`,
   `create_order_failed`) into plain-English guidance instead of showing the raw string.

## Non-goals (intentionally not changed)

- The UPI modal itself is already production-hardened (Round 7 root-cause fixes for
  Safari "Load failed", intent-URL encoding, and success-redirect all remain).
- Razorpay handler / verify contract is unchanged.
- Payment amounts, currency, and item-type enums are unchanged.
