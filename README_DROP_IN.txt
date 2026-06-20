DROP-IN INSTRUCTIONS — FRONTEND_FIXED.zip (Round 3 — CRITICAL HOTFIX)
========================================================================

  components/common/AppointmentPopup.tsx   <- CRITICAL FIX, deploy ASAP
  components/home/HeroSection.tsx          <- secondary hardening

WHAT HAPPENED:
Round 1 rewrote AppointmentPopup.tsx to require isOpen/onClose props,
but every page that renders <AppointmentPopup /> across the entire
site does so with NO props (as the ORIGINAL component required). This
meant the popup could never open, anywhere, regardless of how correctly
every button's own click handler was written. See BUTTON_AUDIT.md and
CHANGELOG.md for full root cause.

THE FIX:
AppointmentPopup.tsx reverted to self-managed visibility via the
existing useUIStore (showAppointmentPopup / setShowAppointmentPopup),
matching what every single call site in your codebase already expects.
ZERO other files need to change — copy this one file in and every
Book Appointment / Book Now / Book @ ₹11 / Book Consultation button
across the whole site is fixed simultaneously.

HOW TO APPLY:
1. Copy both files into your frontend repo at the same relative path,
   overwriting the existing files.
2. Commit, push, let Vercel redeploy.
3. Test on a real phone (not just desktop) per DEPLOYMENT_NOTES.md
   before considering this closed — given the severity, don't skip
   this step.

No backend changes this round. No new dependencies. No env var changes.
