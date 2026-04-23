/// <reference types="node" />
import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order';
import Booking from '../models/Booking';
import { sendEmail, bookingConfirmationEmail } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';

const env = (process as any).env;

const getRazorpay = () => new Razorpay({
  key_id: env.RAZORPAY_KEY_ID as string,
  key_secret: env.RAZORPAY_KEY_SECRET as string,
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR' } = req.body as any;
    if (!amount || amount < 1) return res.status(400).json({ success: false, message: 'Invalid amount' });
    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: `rcpt_${uuidv4().replace(/-/g, '').substr(0, 16)}`,
    });
    res.json({ success: true, data: { orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency } });
  } catch (error: any) {
    (console as any).error('Razorpay create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData, type } = req.body as any;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
    if (type === 'booking' || type === 'service') {
      const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await Booking.create({
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
          subject: 'Vastu Arya - Booking Confirmed!',
          html: bookingConfirmationEmail(orderData.name, orderData.serviceName, bookingId, orderData.amount)
        });
      }
      return res.json({ success: true, message: 'Booking confirmed!', data: { bookingId, paymentId: razorpay_payment_id } });
    }
    if (type === 'product') {
      const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await Order.create({
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
      return res.json({ success: true, message: 'Order placed!', data: { orderId, paymentId: razorpay_payment_id } });
    }
    res.json({ success: true, message: 'Payment verified', data: { paymentId: razorpay_payment_id } });
  } catch (error: any) {
    (console as any).error('Payment verify error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};
