/**
 * upiPayment.routes.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 11 — Phase D): added
 * `optionalAuth` ahead of the existing `upload.single('screenshot')`
 * + `submitUpiPayment` chain — same rationale as payment.routes.ts.
 * Guest UPI submission is unaffected; a logged-in customer's
 * submission now gets verified-identity linkage.
 *
 * GET /status/:referenceId is unchanged.
 */
import { Router } from 'express';
import { submitUpiPayment, getUpiPaymentStatus } from '../controllers/upiPayment.controller';
import { upload } from './upload.routes';
import { paymentLimiter } from '../middleware/rateLimit.middleware';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/submit', paymentLimiter, optionalAuth, upload.single('screenshot'), submitUpiPayment); // NEW — optionalAuth added
router.get('/status/:referenceId', getUpiPaymentStatus);

export default router;
