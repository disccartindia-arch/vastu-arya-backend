DROP-IN INSTRUCTIONS — BACKEND-for-Render_v2_6.zip
====================================================

This zip contains ONLY the files that changed this round, in the same
relative path as your repo, so you can drop them straight in:

  src/controllers/payment.controller.ts   <- REPLACES your existing file

WHAT CHANGED:
  Added `paymentStatus: 'paid'` to 3 success-response objects in
  verifyPayment(). Nothing else in this file was touched. See
  CHANGELOG.md / REPORT.md in this zip for full detail and reasoning.

HOW TO APPLY:
  1. Copy src/controllers/payment.controller.ts into your backend repo,
     overwriting the existing file at the same path.
  2. Commit, push, let Render redeploy.
  3. No environment variables, no new dependencies, no DB migration
     needed.

NOT INCLUDED (per your audit instructions — destructive/flagged, not
auto-applied):
  - Deletion of the 4 dead-code UPI files (see REPORT.md "Issue 7")
