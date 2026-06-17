/**
 * adminUpiPayments.routes.ts — NEW
 *
 * Admin-only review queue for UPI fallback payments. Mounted at
 * /api/admin/upi-payments in server.ts. This is the proper, wired-up
 * replacement for the previously-uploaded standalone routes/adminUpiRoutes.ts,
 * which referenced a non-existent `adminAuthMiddleware` and was never
 * registered in server.ts at all.
 */
import { Router } from 'express';
import { listUpiPayments, getUpiPaymentById, verifyUpiPayment, rejectUpiPayment } from '../controllers/upiPayment.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', listUpiPayments);
router.get('/:id', getUpiPaymentById);
router.post('/:id/verify', verifyUpiPayment);
router.post('/:id/reject', rejectUpiPayment);

export default router;
