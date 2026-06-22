/**
 * payment.routes.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 11 — Phase D): added
 * `optionalAuth` middleware ahead of `verifyPayment` only. This is the
 * EXISTING `optionalAuth` from auth.middleware.ts (unmodified since
 * the original upload) — it populates `req.user` if a valid token is
 * present, and silently continues as a guest request otherwise. Guest
 * checkout (the existing default behavior) is completely unaffected;
 * a logged-in customer's payment now gets verified-identity linkage
 * (see payment.controller.ts's header comment).
 *
 * `createOrder` is unchanged — it doesn't need to know about identity,
 * only `verifyPayment` (where the Booking/Order document is actually
 * created) does.
 *
 * Razorpay create-order/verify paths, rate limiting, and the
 * PaymentSettings routes below are otherwise byte-for-byte unchanged
 * from before this round.
 */
import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller';
import { getPaymentSettings, updatePaymentSettings } from '../controllers/paymentSettings.controller';
import { authMiddleware, adminMiddleware, optionalAuth } from '../middleware/auth.middleware';
import { paymentLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/create-order', paymentLimiter, createOrder);
router.post('/verify', paymentLimiter, optionalAuth, verifyPayment); // NEW — optionalAuth added

router.get('/settings', getPaymentSettings);
router.put('/settings', authMiddleware, adminMiddleware, updatePaymentSettings);

export default router;
