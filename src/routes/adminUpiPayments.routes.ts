/**
 * adminUpiPayments.routes.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 8, Phase A, Item 6):
 * added GET /:id/audit-log, wired to the new getUpiPaymentAuditLog
 * controller. Every other route in this file is byte-for-byte
 * unchanged from the prior round.
 */
import { Router } from 'express';
import { listUpiPayments, getUpiPaymentById, getUpiPaymentAuditLog, verifyUpiPayment, rejectUpiPayment } from '../controllers/upiPayment.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', listUpiPayments);
router.get('/:id', getUpiPaymentById);
router.get('/:id/audit-log', getUpiPaymentAuditLog);
router.post('/:id/verify', verifyUpiPayment);
router.post('/:id/reject', rejectUpiPayment);

export default router;
