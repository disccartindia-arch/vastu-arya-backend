DROP-IN INSTRUCTIONS — FRONTEND_FIXED.zip (Round 2)
=====================================================

Files in this zip, at the same relative path as your repo:

  components/payment/UpiPaymentModal.tsx          QR un-crop fix + Open in UPI App
  app/(public)/services/ServicesClient.tsx         Book Appointment UPI button added
  components/store/ProductCard.tsx                 Buy Now + UPI buttons, next/image
  app/(public)/vastu-store/product/[slug]/page.tsx next/image migration
  lib/imageOptimize.ts                             NEW FILE — Cloudinary transform helper
  components/home/HeroSection.tsx                  (Round 1, carried forward unchanged)
  components/common/AppointmentPopup.tsx           (Round 1, carried forward unchanged)
  app/(public)/vastu-store/[category]/CategoryClient.tsx  (Round 1, carried forward unchanged)

Copy each into your frontend repo at the same path, overwriting
existing files (lib/imageOptimize.ts is new — just add it).

No new dependencies needed. No next.config.js changes needed (already
verified compatible — see REPORT.md "Issue #8").

See REPORT.md, CHANGELOG.md, DEPLOYMENT_CHECKLIST.md,
PAYMENT_FLOW_DIAGRAM.md, PERFORMANCE_REPORT.md in the parent delivery
for full detail.
