import { Router } from 'express';
import {
  createOrder, verifyPayment, getPaymentSettings, getUPIConfig,
  updateUPIConfig, createUPIIntent, recordUPIPayment, getPaymentStatus,
  razorpayWebhook, adminConfirmUPI,
} from '../controllers/payment.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { paymentLimiter } from '../middleware/rateLimit.middleware';
import express from 'express';

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/settings',           getPaymentSettings);
router.get('/status/:ref',        getPaymentStatus);
router.post('/create-order',      paymentLimiter, createOrder);
router.post('/verify',            paymentLimiter, verifyPayment);
router.post('/upi-intent',        paymentLimiter, createUPIIntent);
router.post('/record-upi',        paymentLimiter, recordUPIPayment);

// Razorpay webhook — raw body needed for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/upi-config',         authMiddleware, adminMiddleware, getUPIConfig);
router.put('/upi-config',         authMiddleware, adminMiddleware, updateUPIConfig);
router.post('/admin/confirm-upi', authMiddleware, adminMiddleware, adminConfirmUPI);

export default router;
