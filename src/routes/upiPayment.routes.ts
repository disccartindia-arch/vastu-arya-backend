/**
 * upiPayment.routes.ts — NEW
 *
 * Public-facing UPI fallback submission flow. Mounted at /api/payment/upi
 * in server.ts. Submission is rate-limited the same way Razorpay's
 * create-order/verify are (paymentLimiter), since it's also a
 * payment-adjacent, screenshot-upload endpoint that's a reasonable abuse
 * target.
 */
import { Router } from 'express';
import { submitUpiPayment, getUpiPaymentStatus } from '../controllers/upiPayment.controller';
import { upload } from './upload.routes';
import { paymentLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/submit', paymentLimiter, upload.single('screenshot'), submitUpiPayment);
router.get('/status/:referenceId', getUpiPaymentStatus);

export default router;
