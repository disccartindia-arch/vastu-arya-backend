/// <reference types="node" />
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many attempts.' }, standardHeaders: true, legacyHeaders: false });
export const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, message: 'Too many requests.' } });
export const paymentLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, message: { success: false, message: 'Too many payment requests.' } });
