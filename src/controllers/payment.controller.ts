/**
 * src/controllers/payment.controller.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 8 — Phase B, Feature 5 +
 * database readiness):
 *
 * (1) Added notifyAdminOfPayment() calls in both the booking/service and
 *     product success branches of verifyPayment() — fire-and-forget,
 *     same pattern as upiPayment.controller.ts, never blocks or affects
 *     the response.
 *
 * (2) The booking branch now also sets the new paymentStatus:'verified'
 *     and bookingStatus:'confirmed' fields on the created Booking
 *     document directly (rather than relying solely on the pre-save
 *     derivation hook in Booking.ts) — since this is a NEW document
 *     being created with status:'paid' already known at creation time,
 *     setting the new fields explicitly here is more precise than
 *     leaning on the hook's status->fields inference, though the hook
 *     would derive the same result if these were omitted.
 *
 * The Razorpay HMAC signature verification, createOrder(), and the
 * `paymentStatus: 'paid'` field on the JSON response (added in an
 * earlier round, NOT to be confused with the new Booking-document-level
 * paymentStatus field of the same name — different things, see note
 * inline below) are completely untouched.
 */
import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order';
import Booking from '../models/Booking';
import { sendEmail, bookingConfirmationEmail } from '../utils/email';
import { notifyAdminOfPayment } from '../utils/adminNotification';
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
        // NEW (Phase B) — explicit set on the new two-axis fields. See
        // file header note: this is the Booking-document field, distinct
        // from the unrelated `paymentStatus: 'paid'` key in the JSON
        // response below, which has existed since an earlier round and
        // serves a different purpose (telling the FRONTEND the Razorpay
        // call succeeded, not a database field).
        paymentStatus: 'verified',
        bookingStatus: 'confirmed',
      });
      if (orderData.email) {
        await sendEmail({
          to: orderData.email,
          subject: '🕉️ Vastu Arya - Booking Confirmed!',
          html: bookingConfirmationEmail(orderData.name, orderData.serviceName, bookingId, orderData.amount)
        });
      }

      // NEW (Phase B, Feature 5) — admin notification for a Razorpay
      // booking/service payment. Fire-and-forget, never blocks the
      // response below.
      notifyAdminOfPayment({
        bookingId,
        customerName: orderData.name,
        phone: orderData.phone,
        email: orderData.email || null,
        itemName: orderData.serviceName,
        amount: orderData.amount,
        paymentMethod: 'razorpay',
        screenshotUrl: null,
      }).catch(() => { /* already logged internally */ });

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

      // NEW (Phase B, Feature 5) — admin notification for a Razorpay
      // product order.
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
      }).catch(() => { /* already logged internally */ });

      return res.json({ success: true, paymentStatus: 'paid', message: 'Order placed successfully!', data: { orderId, paymentId: razorpay_payment_id } });
    }

    res.json({ success: true, paymentStatus: 'paid', message: 'Payment verified', data: { paymentId: razorpay_payment_id } });
  } catch (error: any) {
    console.error('Payment verify error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};
