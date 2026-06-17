/**
 * paymentSettings.controller.ts
 *
 * NEW — exposes PaymentSettings (UPI fallback config) through the API.
 * Previously the PaymentSettings model existed with no controller/route at
 * all, so the only way to change the UPI ID was editing the model default
 * and redeploying. This closes that gap.
 *
 * Does NOT touch Razorpay in any way — razorpayEnabled here is purely a
 * display/feature toggle the frontend can read; the actual Razorpay
 * create-order/verify flow in payment.controller.ts is untouched and remains
 * the primary payment method regardless of this file.
 */
import { Request, Response } from 'express';
import PaymentSettings from '../models/PaymentSettings';

// Public — frontend needs this to know which UPI ID/QR to display and which
// payment methods are currently enabled. Nothing returned here is sensitive.
export const getPaymentSettings = async (req: Request, res: Response) => {
  try {
    let settings = await PaymentSettings.findOne();
    if (!settings) settings = await PaymentSettings.create({});
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin — update UPI IDs / toggle payment methods.
export const updatePaymentSettings = async (req: Request, res: Response) => {
  try {
    const ALLOWED = ['primaryUPI', 'fallbackUPI', 'payeeName', 'upiEnabled', 'fallbackEnabled', 'razorpayEnabled', 'codEnabled'];
    const update: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (!Object.keys(update).length) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }
    const settings = await PaymentSettings.findOneAndUpdate({}, update, { new: true, upsert: true, runValidators: true });
    res.json({ success: true, message: 'Payment settings updated', data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
