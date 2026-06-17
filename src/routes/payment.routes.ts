/**
 * payment.routes.ts
 *
 * CHANGED this round: the two original Razorpay routes (createOrder,
 * verifyPayment) are completely untouched — same paths, same controller,
 * same middleware. Only two NEW lines were added at the bottom wiring up
 * GET/PUT /settings to the new paymentSettings.controller.ts, so the admin
 * panel and frontend have somewhere to read/write the UPI fallback config
 * (PaymentSettings) that previously had no API surface at all.
 */
import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller';
import { getPaymentSettings, updatePaymentSettings } from '../controllers/paymentSettings.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { paymentLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// ── Razorpay — unchanged ──────────────────────────────────────────
router.post('/create-order', paymentLimiter, createOrder);
router.post('/verify', paymentLimiter, verifyPayment);

// ── NEW — PaymentSettings (UPI fallback config) ───────────────────
router.get('/settings', getPaymentSettings);
router.put('/settings', authMiddleware, adminMiddleware, updatePaymentSettings);

export default router;
