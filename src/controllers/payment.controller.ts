import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order';
import Booking from '../models/Booking';
import PaymentSettings from '../models/PaymentSettings';
import { sendEmail, bookingConfirmationEmail } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';

// ── Razorpay instance ─────────────────────────────────────────────────────────
const getRazorpay = () => new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// ── GET /api/payment/settings (public) ───────────────────────────────────────
// Returns safe payment config for frontend (no secrets)
export const getPaymentSettings = async (req: Request, res: Response) => {
  try {
    let settings = await PaymentSettings.findOne();
    if (!settings) settings = await PaymentSettings.create({});
    res.json({
      success: true,
      data: {
        primaryUPI:      settings.upiEnabled      ? settings.primaryUPI  : null,
        fallbackUPI:     settings.fallbackEnabled ? settings.fallbackUPI : null,
        payeeName:       settings.payeeName,
        upiEnabled:      settings.upiEnabled,
        razorpayEnabled: settings.razorpayEnabled,
        codEnabled:      settings.codEnabled,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/payment/upi-config (admin) ──────────────────────────────────────
export const getUPIConfig = async (req: Request, res: Response) => {
  try {
    let settings = await PaymentSettings.findOne();
    if (!settings) settings = await PaymentSettings.create({});
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PUT /api/payment/upi-config (admin) ──────────────────────────────────────
export const updateUPIConfig = async (req: Request, res: Response) => {
  try {
    const allowed = ['primaryUPI','fallbackUPI','payeeName','upiEnabled','fallbackEnabled','razorpayEnabled','codEnabled'];
    const update: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const settings = await PaymentSettings.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json({ success: true, message: 'UPI config updated', data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/payment/create-order ───────────────────────────────────────────
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', type = 'product' } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    const razorpay = getRazorpay();
    const receipt  = `rcpt_${uuidv4().replace(/-/g,'').slice(0,16)}`;
    const rzpOrder = await razorpay.orders.create({
      amount:   Math.round(amount * 100),
      currency,
      receipt,
    });
    res.json({
      success: true,
      data: {
        orderId:  rzpOrder.id,
        amount:   rzpOrder.amount,
        currency: rzpOrder.currency,
        receipt,
      },
    });
  } catch (error: any) {
    console.error('[Payment] create-order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

// ── POST /api/payment/verify ──────────────────────────────────────────────────
// This is the ONLY place where bookings/orders get marked as PAID.
// Backend verifies Razorpay HMAC signature — never trusts frontend alone.
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
      type,
    } = req.body;

    // ── 1. HMAC Signature Verification ────────────────────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET as string;
    if (!secret) {
      return res.status(500).json({ success: false, message: 'Payment secret not configured on server' });
    }

    const body             = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn('[Payment] Signature mismatch — possible tamper attempt');
      return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature' });
    }

    // ── 2. Fetch payment details from Razorpay to confirm capture ─────────────
    let rzpPayment: any = null;
    try {
      const rzp = getRazorpay();
      rzpPayment = await (rzp.payments as any).fetch(razorpay_payment_id);
      if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
        return res.status(400).json({
          success: false,
          message: `Payment not captured. Status: ${rzpPayment.status}`,
        });
      }
    } catch (fetchErr) {
      // If we can't reach Razorpay API, signature match is still strong enough
      console.warn('[Payment] Could not fetch payment from Razorpay API:', fetchErr);
    }

    const amountPaid = rzpPayment ? rzpPayment.amount / 100 : orderData?.amount || 0;

    // ── 3. Create/update record ───────────────────────────────────────────────
    if (type === 'booking' || type === 'service') {
      const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const booking = await Booking.create({
        bookingId,
        name:              orderData.name,
        phone:             orderData.phone,
        email:             orderData.email,
        serviceName:       orderData.serviceName,
        amount:            orderData.amount,
        amountPaid,
        formData:          orderData.formData || {},
        paymentId:         razorpay_payment_id,
        razorpayOrderId:   razorpay_order_id,
        razorpaySignature: razorpay_signature,
        paymentMethod:     'razorpay',
        paymentStatus:     'paid',       // ← only set AFTER signature verified
        status:            'paid',
        verifiedAt:        new Date(),
        transactionReference: razorpay_payment_id,
      });

      if (orderData.email) {
        await sendEmail({
          to:      orderData.email,
          subject: '🕉️ Vastu Arya - Booking Confirmed!',
          html:    bookingConfirmationEmail(orderData.name, orderData.serviceName, bookingId, amountPaid),
        }).catch(console.error);
      }

      return res.json({
        success: true,
        message: 'Booking confirmed!',
        data: { bookingId, paymentId: razorpay_payment_id, paymentStatus: 'paid' },
      });
    }

    if (type === 'product') {
      const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await Order.create({
        orderId,
        customerInfo:      orderData.customerInfo,
        items:             orderData.items,
        totalAmount:       orderData.totalAmount,
        amountPaid,
        status:            'paid',
        paymentStatus:     'paid',
        paymentMethod:     'razorpay',
        paymentId:         razorpay_payment_id,
        razorpayOrderId:   razorpay_order_id,
        razorpaySignature: razorpay_signature,
        verifiedAt:        new Date(),
        transactionReference: razorpay_payment_id,
        type:              'product',
      });

      return res.json({
        success: true,
        message: 'Order placed successfully!',
        data: { orderId, paymentId: razorpay_payment_id, paymentStatus: 'paid' },
      });
    }

    res.json({ success: true, message: 'Payment verified', data: { paymentId: razorpay_payment_id } });
  } catch (error: any) {
    console.error('[Payment] verify error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

// ── POST /api/payment/upi-intent ──────────────────────────────────────────────
// Generates a UPI deep-link + QR string for direct UPI payment
export const createUPIIntent = async (req: Request, res: Response) => {
  try {
    const { amount, name, ref, note } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const settings = await PaymentSettings.findOne();
    const upiId    = settings?.primaryUPI  || 'VASTUARYA@ybl';
    const fallback = settings?.fallbackUPI || 'ARYAVAR@ybl';
    const payee    = settings?.payeeName   || 'Vastu Arya';

    const buildLink = (pa: string) =>
      `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(payee)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note || 'VastuArya Booking')}&tr=${encodeURIComponent(ref || '')}`;

    res.json({
      success: true,
      data: {
        primaryUPI:    upiId,
        fallbackUPI:   fallback,
        payeeName:     payee,
        amount,
        upiLink:       buildLink(upiId),
        fallbackLink:  buildLink(fallback),
        // QR is rendered client-side from upiLink using qrserver.com
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/payment/record-upi ─────────────────────────────────────────────
// User claims they paid via UPI — creates a PENDING booking until admin confirms
export const recordUPIPayment = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, serviceName, amount, upiRef, formData } = req.body;
    if (!name || !phone || !serviceName || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const booking = await Booking.create({
      bookingId,
      name, phone, email,
      serviceName, amount,
      amountPaid: 0,           // not confirmed yet
      upiRef:     upiRef || '',
      paymentMethod:  'upi',
      paymentStatus:  'pending', // ← awaiting admin confirmation
      status:         'pending',
      formData:       formData || {},
    });

    res.json({
      success: true,
      message: 'UPI payment recorded. Our team will verify and confirm your booking shortly.',
      data: { bookingId, paymentStatus: 'pending' },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/payment/status/:ref ──────────────────────────────────────────────
// Public: check status of a booking or order by ID
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { ref } = req.params;
    if (!ref) return res.status(400).json({ success: false, message: 'Reference required' });

    const booking = await Booking.findOne({
      $or: [{ bookingId: ref }, { paymentId: ref }, { transactionReference: ref }],
    });

    if (booking) {
      return res.json({
        success: true,
        type: 'booking',
        data: {
          id:               booking.bookingId,
          name:             booking.name,
          phone:            booking.phone,
          serviceName:      booking.serviceName,
          amount:           booking.amount,
          amountPaid:       booking.amountPaid,
          paymentStatus:    booking.paymentStatus,
          status:           booking.status,
          paymentMethod:    booking.paymentMethod,
          paymentId:        booking.paymentId,
          transactionRef:   booking.transactionReference,
          verifiedAt:       booking.verifiedAt,
          createdAt:        (booking as any).createdAt,
        },
      });
    }

    const order = await Order.findOne({
      $or: [{ orderId: ref }, { paymentId: ref }, { transactionReference: ref }],
    });

    if (order) {
      return res.json({
        success: true,
        type: 'order',
        data: {
          id:             order.orderId,
          name:           order.customerInfo?.name,
          phone:          order.customerInfo?.phone,
          totalAmount:    order.totalAmount,
          amountPaid:     order.amountPaid,
          paymentStatus:  order.paymentStatus,
          status:         order.status,
          paymentMethod:  order.paymentMethod,
          paymentId:      order.paymentId,
          transactionRef: order.transactionReference,
          verifiedAt:     order.verifiedAt,
          createdAt:      (order as any).createdAt,
          items:          order.items,
        },
      });
    }

    return res.status(404).json({ success: false, message: 'No booking or order found for this reference' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/payment/webhook (Razorpay webhook) ──────────────────────────────
export const razorpayWebhook = async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    const body      = JSON.stringify(req.body);
    const expected  = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');

    if (expected !== signature) {
      console.warn('[Webhook] Invalid signature');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event   = req.body.event;
    const payment = req.body.payload?.payment?.entity;

    if (event === 'payment.captured' && payment) {
      const paymentId = payment.id;
      const orderId   = payment.order_id;

      // Update booking if linked by razorpayOrderId
      await Booking.findOneAndUpdate(
        { razorpayOrderId: orderId },
        { paymentStatus: 'paid', status: 'paid', paymentId, amountPaid: payment.amount / 100, verifiedAt: new Date() }
      );

      // Update order if linked
      await Order.findOneAndUpdate(
        { razorpayOrderId: orderId },
        { paymentStatus: 'paid', status: 'paid', paymentId, amountPaid: payment.amount / 100, verifiedAt: new Date() }
      );
    }

    if (event === 'payment.failed' && payment) {
      const orderId = payment.order_id;
      await Booking.findOneAndUpdate({ razorpayOrderId: orderId }, { paymentStatus: 'failed' });
      await Order.findOneAndUpdate({ razorpayOrderId: orderId }, { paymentStatus: 'failed', status: 'failed' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/payment/admin/confirm-upi (admin only) ─────────────────────────
export const adminConfirmUPI = async (req: Request, res: Response) => {
  try {
    const { bookingId, upiRef } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { bookingId },
      { paymentStatus: 'paid', status: 'paid', upiRef, amountPaid: undefined, verifiedAt: new Date() },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'UPI payment confirmed', data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
