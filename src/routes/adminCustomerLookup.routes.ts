/**
 * src/routes/adminCustomerLookup.routes.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 11 — Phase D. Admin-only (authMiddleware +
 * adminMiddleware, identical pattern to every other admin route in
 * this codebase). Mounted at /api/admin/customers in server.ts.
 */
import { Router } from 'express';
import { searchCustomers, getCustomerBookingDetail } from '../controllers/adminCustomerLookup.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/search', searchCustomers);
router.get('/booking/:bookingId', getCustomerBookingDetail);

export default router;
