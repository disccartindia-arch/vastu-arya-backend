/**
 * src/routes/booking.routes.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 9 — Phase C Part 1):
 * added GET /:id/history, admin-only (same authMiddleware/
 * adminMiddleware as every other route in this file), returning the
 * full StatusAuditLog trail for one booking including adminUser/
 * adminNotes — the admin-facing counterpart to the public timeline,
 * which deliberately strips those same fields.
 *
 * Every other route in this file — GET /, GET /:id, PUT /:id — is
 * unchanged. PUT /:id now calls the EXTENDED updateBookingStatus()
 * controller (see booking.controller.ts), but the route registration
 * itself, its path, and its middleware are byte-for-byte identical to
 * before.
 */
import { Router } from 'express';
import { getAllBookings, updateBookingStatus, getBookingById, getBookingStatusHistory, updateConsultation } from '../controllers/booking.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/', authMiddleware, adminMiddleware, getAllBookings);
router.get('/:id/history', authMiddleware, adminMiddleware, getBookingStatusHistory); // NEW
router.put('/:id/consultation', authMiddleware, adminMiddleware, updateConsultation);   // NEW — consultation scheduler
router.get('/:id', authMiddleware, adminMiddleware, getBookingById);
router.put('/:id', authMiddleware, adminMiddleware, updateBookingStatus);
export default router;
