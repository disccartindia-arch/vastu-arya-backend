/**
 * routes/adminUpiRoutes.ts (Backend)
 * ─────────────────────────────────────────────────────────────────
 * Admin routes for UPI payment verification.
 * Register in your Express app:
 *   app.use("/admin", adminAuthMiddleware, adminUpiRouter);
 * ─────────────────────────────────────────────────────────────────
 */

import { Router } from "express";
import {
  listUpiPending,
  getUpiPayment,
  verifyUpiPayment,
  rejectUpiPayment,
} from "../controllers/upiVerificationController";

const router = Router();

// GET  /admin/upi-payments?status=UPI_PENDING&page=1&limit=20
router.get("/upi-payments", listUpiPending);

// GET  /admin/upi-payments/:id
router.get("/upi-payments/:id", getUpiPayment);

// POST /admin/upi-payments/:id/verify  { adminNotes, verifiedBy }
router.post("/upi-payments/:id/verify", verifyUpiPayment);

// POST /admin/upi-payments/:id/reject  { adminNotes, rejectedBy }
router.post("/upi-payments/:id/reject", rejectUpiPayment);

export default router;
