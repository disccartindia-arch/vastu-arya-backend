DROP-IN INSTRUCTIONS — FRONTEND-for-Vercel_v9_3.zip
=====================================================

This zip contains ONLY the files that changed this round, in the same
relative path as your repo:

  components/payment/UpiPaymentModal.tsx
  components/home/HeroSection.tsx
  components/common/AppointmentPopup.tsx
  app/(public)/vastu-store/[category]/CategoryClient.tsx

WHAT CHANGED — see REPORT.md / CHANGELOG.md in this zip for full
reasoning per file. Summary:

  UpiPaymentModal.tsx   QR auto-crop/zoom fix, larger QR, both UPI IDs
                        visible + copyable. Shared by Service AND
                        Product payment flows — one fix, both covered.
  HeroSection.tsx       Book Appointment button: replaced fragile
                        substring matching with explicit allowlist.
  AppointmentPopup.tsx  Added visible Retry button if services fail to
                        load, instead of a silently empty popup.
  CategoryClient.tsx    Explicit pagination limit on store category
                        product fetch (performance).

HOW TO APPLY:
  Copy each file into your frontend repo at the same relative path,
  overwriting the existing files. Commit, push, let Vercel redeploy.
  No new dependencies, no env var changes.

IMPORTANT — QR images:
  The QR fix is a CSS-only crop/zoom of your EXISTING screenshot
  images. It works with the images you already have deployed. If you
  later want to replace them with cleaner, pre-cropped square QR
  images, see REPORT.md "Issue 1" for exact crop dimensions, then set
  QR_IMAGES_ARE_PRECROPPED = true near the top of UpiPaymentModal.tsx.

NOT INCLUDED (flagged, not auto-applied):
  - Deletion of components/common/UPIPaymentModal.tsx (dead code)
  - next/image migration for product listings
