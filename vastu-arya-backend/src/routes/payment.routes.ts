import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller';
import { paymentLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
router.post('/create-order', paymentLimiter, createOrder);
router.post('/verify', paymentLimiter, verifyPayment);
export default router;
