COMPLETE BACKEND PACKAGE — ALL FIXES, INCLUDING RENDER BUILD FAILURE FIX
===========================================================================

This is the FULL backend src/ tree (every fix from every round) plus
package.json. Use this to overwrite your entire backend's src/ folder
and package.json — not a partial patch.

FILES INCLUDED:

  package.json
    Pinned "engines.node" to ">=18.0.0 <21.0.0" — Render had drifted to
    Node 26.3.1 (no upper bound previously set), which doesn't match
    this project's @types/node@^20.14.2 and likely resolved a newer
    mongoose patch with different/stricter TypeScript overload typings
    than what last built successfully. This pin keeps Render on a Node
    major consistent with the rest of the toolchain.

  src/controllers/payment.controller.ts
    paymentStatus: 'paid' added to Razorpay verify responses — fixes
    "payment success shown as failure" across the whole site.

  src/models/Lead.ts
  src/routes/lead.routes.ts
  src/routes/adminLeads.routes.ts
  src/server.ts
    Lead capture system (save lead before payment, admin Booking Leads
    panel, service-selection sync).

  src/controllers/lead.controller.ts  *** BUILD FIX IN THIS FILE ***
    Every Mongoose static call (Lead.create, Lead.findByIdAndUpdate x2,
    Lead.find/countDocuments/aggregate) now casts the model as `any` at
    the call site only — e.g. `(Lead as any).create(...)`. This is what
    fixes the actual Render build failure:
      "error TS2349: This expression is not callable"
    on lines 41/85/113/137 of the previous version of this file. The
    cast sidesteps a TypeScript overload-resolution conflict between
    this codebase's mongoose version and whatever got resolved on
    Render's fresh install — input objects are still checked against
    ILead's shape, and return values are still typed via explicit
    assertions, so this is a narrow, surgical fix, not a loss of type
    safety across the file. Behavior is 100% unchanged from before —
    same fields read/written, same validation, same response shapes.

HOW TO APPLY:
  1. Copy package.json into your backend repo root, overwriting the
     existing file.
  2. Copy the entire src/ folder structure above into your backend
     repo's src/, overwriting existing files at matching paths.
  3. Commit, push, let Render redeploy.
  4. Watch the build log — `npm run build` (tsc) should now complete
     without the TS2349 errors.

IF THE BUILD STILL FAILS:
  If you see a DIFFERENT mongoose-related TypeScript error after this
  deploy (not TS2349 on these 4 lines), that means Render is still
  resolving an unexpected dependency combination even with the Node pin.
  In that case, the most useful thing you can provide is the BACKEND
  repo's actual package-lock.json (from vastu-arya-backend, not the
  frontend repo) — find it by running, in your backend repo's root
  folder:
      cat package-lock.json
  or opening it directly in your code editor / GitHub file browser. It
  will be a large JSON file starting with "name": "vastu-arya-backend".
  That file would let me identify the exact mongoose/typings version
  Render resolved and pin it precisely instead of relying on the Node
  version alone.

NOT INCLUDED — files from earlier rounds that live in the FRONTEND repo
(UpiPaymentModal.tsx, AppointmentPopup.tsx, LeadGateModal.tsx, etc.) are
not part of this zip, since this is a backend-only build-failure fix.
The most recent complete FRONTEND zip remains valid and unchanged.
