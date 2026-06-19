/**
 * src/controllers/payment.controller.ts
 *
 * FIXED (June 2026 forensic trace — see REPORT.md "Issue 6 & 2"):
 * verifyPayment()'s success responses never included a top-level
 * `paymentStatus` field, but lib/razorpay.ts's frontend handler gates
 * options.onSuccess() on `verifyRes.data.paymentStatus === 'paid'`.
 * Since that field was always undefined, the frontend ALWAYS fell into
 * its failure branch — showing "Payment could not be verified" and
 * never clearing the cart / redirecting — even though the Order or
 * Booking document was already correctly created here with a valid
 * Razorpay signature. This is the root cause of "payment success
 * without business success" (Issue 6) and "product orders not
 * appearing to be created" (Issue 2): the order WAS created, the
 * frontend just never found out.
 *
 * The only change in this file vs the previously-uploaded version is
 * the addition of `paymentStatus: 'paid'` to both success response
 * objects below. Razorpay order-creation, signature verification (HMAC
 * check), and all database writes are completely untouched, per the
 * "do not break Razorpay" requirement.
 */
import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order';
import Booking from '../models/Booking';
import { sendEmail, bookingConfirmationEmail } from '../utils/email';
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

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData, type } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string).update(body).digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

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
      });
      if (orderData.email) {
        await sendEmail({
          to: orderData.email,
          subject: '🕉️ Vastu Arya - Booking Confirmed!',
          html: bookingConfirmationEmail(orderData.name, orderData.serviceName, bookingId, orderData.amount)
        });
      }
      // FIXED: added paymentStatus so frontend's onSuccess() actually fires.
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
      });
      // FIXED: added paymentStatus so frontend's onSuccess() actually fires.
      return res.json({ success: true, paymentStatus: 'paid', message: 'Order placed successfully!', data: { orderId, paymentId: razorpay_payment_id } });
    }

    // FIXED: also added here for the generic/unspecified type branch, for consistency.
    res.json({ success: true, paymentStatus: 'paid', message: 'Payment verified', data: { paymentId: razorpay_payment_id } });
  } catch (error: any) {
    console.error('Payment verify error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};
