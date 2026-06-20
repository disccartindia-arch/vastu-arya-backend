DROP-IN — FRONTEND_FIXED.zip (Round 7 — Issues 1, 2, 5)
==========================================================

OVERWRITE:
  components/payment/UpiPaymentModal.tsx
  app/admin/upi-verifications/page.tsx

NEW:
  app/(public)/payment-submitted/PaymentSubmittedClient.tsx
  app/(public)/payment-submitted/page.tsx

NO BACKEND CHANGES THIS ROUND — every backend file involved (Cloudinary
upload, UpiPayment model, admin verify/reject controllers, route
registration) was traced and confirmed already correct. The bugs were
entirely in the frontend's upload reliability, the admin panel calling a
dead route, and the UPI intent link's character encoding.

See ROOT_CAUSE_REPORT.md, FIX_REPORT.md, TESTING_REPORT.md (delivered
alongside this zip) for full evidence and a device-testing checklist —
please run that checklist on real phones before considering this closed,
since live UPI-app behavior can't be verified from this environment.
