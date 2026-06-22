/**
 * src/controllers/payment.controller.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 11 — Phase D, User
 * Linkage Strategy Part 1 — verified login-time linkage):
 *
 * Both the booking/service and product success branches of
 * verifyPayment() now set `userId`/`user` directly from `req.user?._id`
 * — but ONLY if a real, JWT-verified session is present on the
 * request. This requires the route to run through `optionalAuth`
 * (added in payment.routes.ts this round) rather than no auth
 * middleware at all — `optionalAuth` populates `req.user` if a valid
 * token is present, but does NOT reject the request if one isn't
 * (existing guest checkout, which this codebase has always supported,
 * continues to work completely unchanged).
 *
 * This is NOT phone/email matching of any kind — it is the verified-
 * identity path from the approved User Linkage Strategy: if a
 * customer happens to be logged in at the moment they complete a
 * payment, the link is established directly from their authenticated
 * session, with zero ambiguity. If they are not logged in (guest
 * checkout, the existing default), no linkage is attempted here at
 * all — that booking remains unclaimed until the customer uses the
 * claim flow (accountClaim.controller.ts) later.
 *
 * The Razorpay HMAC signature verification, createOrder(), and every
 * other line in this file are completely unchanged.
 */
import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order';
import Booking from '../models/Booking';
import { sendEmail, bookingConfirmationEmail } from '../utils/email';
import { notifyAdminOfPayment } from '../utils/adminNotification';
import { AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const getRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  });
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', type = 'product' } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: `rcpt_${uuidv4().replace(/-/g, '').substr(0, 16)}`,
    });
    res.json({ success: true, data: { orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency } });
  } catch (error: any) {
    console.error('Razorpay create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData, type } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string).update(body).digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // NEW (Phase D) — only set if a real authenticated session exists
    // on this request (via optionalAuth). undefined otherwise, which
    // Mongoose treats identically to the field being omitted.
    const loggedInUserId: string | undefined = req.user?._id?.toString();

    if (type === 'booking' || type === 'service') {
      const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const booking = await Booking.create({
        bookingId,
        name: orderData.name,
        phone: orderData.phone,
        email: orderData.email,
        serviceName: orderData.serviceName,
        amount: orderData.amount,
        formData: orderData.formData || {},
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        status: 'paid',
        paymentStatus: 'verified',
        bookingStatus: 'confirmed',
        userId: loggedInUserId || null, // NEW — verified login-time linkage only
      });
      if (orderData.email) {
        await sendEmail({
          to: orderData.email,
          subject: '🕉️ Vastu Arya - Booking Confirmed!',
          html: bookingConfirmationEmail(orderData.name, orderData.serviceName, bookingId, orderData.amount)
        });
      }

      notifyAdminOfPayment({
        bookingId,
        customerName: orderData.name,
        phone: orderData.phone,
        email: orderData.email || null,
        itemName: orderData.serviceName,
        amount: orderData.amount,
        paymentMethod: 'razorpay',
        screenshotUrl: null,
      }).catch(() => {});

      return res.json({ success: true, paymentStatus: 'paid', message: 'Booking confirmed!', data: { bookingId, paymentId: razorpay_payment_id } });
    }

    if (type === 'product') {
      const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const order = await Order.create({
        orderId,
        customerInfo: orderData.customerInfo,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        status: 'paid',
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        type: 'product',
        user: loggedInUserId || undefined, // NEW — verified login-time linkage only; Order.user is a true ObjectId field, undefined (not null) so Mongoose leaves it genuinely unset rather than storing a null ObjectId
      });

      const itemSummary = Array.isArray(orderData.items) && orderData.items.length
        ? orderData.items.map((i: any) => i.name).join(', ')
        : 'Product order';
      notifyAdminOfPayment({
        bookingId: orderId,
        customerName: orderData.customerInfo?.name || 'Unknown',
        phone: orderData.customerInfo?.phone || 'N/A',
        email: orderData.customerInfo?.email || null,
        itemName: itemSummary,
        amount: orderData.totalAmount,
        paymentMethod: 'razorpay',
        screenshotUrl: null,
      }).catch(() => {});

      return res.json({ success: true, paymentStatus: 'paid', message: 'Order placed successfully!', data: { orderId, paymentId: razorpay_payment_id } });
    }

    res.json({ success: true, paymentStatus: 'paid', message: 'Payment verified', data: { paymentId: razorpay_payment_id } });
  } catch (error: any) {
    console.error('Payment verify error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};
