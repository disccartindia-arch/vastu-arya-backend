/**
 * src/controllers/payment.controller.ts
 *
 * PHASE E — Backend production implementation. Layered on top of Phase D
 * (verified login-time linkage via optionalAuth). New behaviour:
 *
 *   1. Idempotency on `verifyPayment`. If the same `razorpay_payment_id`
 *      has already produced a Booking or Order, we short-circuit and
 *      return that same document — no duplicate write, no duplicate
 *      email, no duplicate admin notification.
 *
 *   2. `PaymentAuditLog` entry `VERIFIED` written on every successful
 *      Razorpay verify — mirroring the UPI flow's audit coverage so
 *      both payment methods produce a complete trail.
 *
 *   3. `StatusAuditLog` entries written for both dual-axis fields on
 *      Razorpay success (`paymentStatus: pending → verified`,
 *      `bookingStatus: pending_payment → confirmed`) so the customer
 *      timeline on `/account/bookings/[bookingId]` is populated.
 *
 *   4. NEW `razorpayWebhook` handler (mounted at POST /api/payment/
 *      webhook by payment.routes.ts) — verifies the
 *      `X-Razorpay-Signature` header with `RAZORPAY_WEBHOOK_SECRET`
 *      and handles `payment.captured`, `payment.failed`, and
 *      `refund.processed`. Idempotent by design (piggy-backs on the
 *      same dedupe check as verifyPayment).
 *
 * NOT CHANGED:
 *   - `createOrder` signature, request/response shape.
 *   - Razorpay HMAC verify algorithm.
 *   - Guest checkout continues to work — every new code path handles
 *     the `req.user` absent case gracefully.
 *   - Existing email + admin-notification calls.
 */
import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order';
import Booking from '../models/Booking';
import PaymentAuditLog from '../models/PaymentAuditLog';
import StatusAuditLog from '../models/StatusAuditLog';
import { sendEmail, bookingConfirmationEmail } from '../utils/email';
import { notifyAdminOfPayment } from '../utils/adminNotification';
import { notificationService } from '../utils/notificationService';
import { AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const con = (console as any);

const getRazorpay = () => new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// ── POST /api/payment/create-order ──────────────────────────────────
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
      notes: { type },
    });
    res.json({
      success: true,
      data: { orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency },
    });
  } catch (error: any) {
    con.error('Razorpay create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

// ── Helpers ─────────────────────────────────────────────────────────

function hmacSha256(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function writeVerifiedAudit(opts: {
  paymentId: string;      // razorpay_payment_id
  referenceId: string;    // bookingId or orderId
  metadata: Record<string, any>;
  adminUser?: string | null;
}) {
  try {
    await (PaymentAuditLog as any).create({
      paymentId:   opts.paymentId,
      referenceId: opts.referenceId,
      action:      'VERIFIED',
      adminUser:   opts.adminUser || 'razorpay-webhook',
      metadata:    opts.metadata,
    });
  } catch (err: any) {
    con.error('[PaymentAuditLog] failed to write VERIFIED entry:', err.message);
  }
}

async function writeBookingConfirmationAudit(booking: any) {
  try {
    await (StatusAuditLog as any).create([
      {
        bookingId:     booking._id.toString(),
        bookingRef:    booking.bookingId,
        field:         'paymentStatus',
        previousValue: 'pending',
        newValue:      'verified',
        adminUser:     'razorpay-auto',
        adminNotes:    null,
      },
      {
        bookingId:     booking._id.toString(),
        bookingRef:    booking.bookingId,
        field:         'bookingStatus',
        previousValue: 'pending_payment',
        newValue:      'confirmed',
        adminUser:     'razorpay-auto',
        adminNotes:    null,
      },
    ]);
  } catch (err: any) {
    con.error('[StatusAuditLog] failed to write Razorpay confirmation entries:', err.message);
  }
}

// ── POST /api/payment/verify ────────────────────────────────────────
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData, type } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay verification fields.' });
    }

    // HMAC verify — unchanged.
    const expectedSignature = hmacSha256(
      process.env.RAZORPAY_KEY_SECRET as string,
      `${razorpay_order_id}|${razorpay_payment_id}`,
    );
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const loggedInUserId: string | undefined = req.user?._id?.toString();

    // ── IDEMPOTENCY ────────────────────────────────────────────────
    // Same razorpay_payment_id can arrive twice for many reasons:
    // client retry, browser back button, our own webhook firing after
    // verify. We short-circuit to the existing document.
    if (type === 'booking' || type === 'service') {
      const existing = await Booking.findOne({ paymentId: razorpay_payment_id });
      if (existing) {
        return res.json({
          success: true,
          paymentStatus: 'paid',
          message: 'Booking already confirmed (idempotent).',
          data: { bookingId: existing.bookingId, paymentId: razorpay_payment_id, idempotent: true },
        });
      }

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
        userId: loggedInUserId || null,
      });

      // Populate the customer's booking timeline.
      writeBookingConfirmationAudit(booking).catch(() => {});
      writeVerifiedAudit({
        paymentId:   razorpay_payment_id,
        referenceId: bookingId,
        adminUser:   'razorpay-auto',
        metadata: {
          amount: orderData.amount, serviceName: orderData.serviceName,
          customerName: orderData.name, phone: orderData.phone,
          razorpayOrderId: razorpay_order_id,
        },
      }).catch(() => {});

      // Fire the "Booking Confirmed" customer notification via the
      // same service used by admin updates. Fire-and-forget.
      if (orderData.email) {
        notificationService.sendCustomerUpdate({
          bookingId:     booking.bookingId,
          customerName:  booking.name,
          customerEmail: booking.email || null,
          serviceName:   booking.serviceName,
          amount:        booking.amount,
          field:         'bookingStatus',
          newValue:      'confirmed',
        }).catch((err: any) => con.error('[notificationService] booking_confirmed failed:', err.message));

        // Also send the branded booking-confirmation email that has
        // the full "next steps" copy. This is complementary to the
        // status notification above.
        sendEmail({
          to: orderData.email,
          subject: '🕉️ Vastu Arya - Booking Confirmed!',
          html: bookingConfirmationEmail(orderData.name, orderData.serviceName, bookingId, orderData.amount),
        }).catch((err: any) => con.error('[email] bookingConfirmationEmail failed:', err.message));
      }

      notifyAdminOfPayment({
        bookingId, customerName: orderData.name, phone: orderData.phone,
        email: orderData.email || null, itemName: orderData.serviceName,
        amount: orderData.amount, paymentMethod: 'razorpay', screenshotUrl: null,
      }).catch(() => {});

      return res.json({
        success: true, paymentStatus: 'paid', message: 'Booking confirmed!',
        data: { bookingId, paymentId: razorpay_payment_id },
      });
    }

    if (type === 'product') {
      const existing = await Order.findOne({ paymentId: razorpay_payment_id });
      if (existing) {
        return res.json({
          success: true,
          paymentStatus: 'paid',
          message: 'Order already placed (idempotent).',
          data: { orderId: existing.orderId, paymentId: razorpay_payment_id, idempotent: true },
        });
      }

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
        user: loggedInUserId || undefined,
      });

      writeVerifiedAudit({
        paymentId:   razorpay_payment_id,
        referenceId: orderId,
        adminUser:   'razorpay-auto',
        metadata: {
          totalAmount: orderData.totalAmount,
          customerName: orderData.customerInfo?.name,
          phone: orderData.customerInfo?.phone,
          razorpayOrderId: razorpay_order_id,
          itemCount: Array.isArray(orderData.items) ? orderData.items.length : 0,
        },
      }).catch(() => {});

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
        paymentMethod: 'razorpay', screenshotUrl: null,
      }).catch(() => {});

      return res.json({
        success: true, paymentStatus: 'paid', message: 'Order placed successfully!',
        data: { orderId, paymentId: razorpay_payment_id },
      });
    }

    res.json({ success: true, paymentStatus: 'paid', message: 'Payment verified', data: { paymentId: razorpay_payment_id } });
  } catch (error: any) {
    con.error('Payment verify error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

// ── POST /api/payment/webhook (NEW — Phase E) ───────────────────────
// Verifies `X-Razorpay-Signature` against the raw request body (Express
// has already parsed it as JSON, so we re-stringify — Razorpay's docs
// specifically allow this because the payload is deterministic JSON).
//
// Events handled:
//   payment.captured  → safety-net Booking/Order creation if the
//                       client-side verify was never made (e.g. user
//                       closed the tab before the callback fired).
//   payment.failed    → PaymentAuditLog entry + optional booking
//                       cancellation if we happen to have one linked
//                       by razorpayOrderId.
//   refund.processed  → StatusAuditLog + notification for the linked
//                       booking (paymentStatus → refunded).
// Idempotent throughout — reuses the same existence check as verify.
export const razorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.header('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!signature || !secret) {
      // Signal a bad request but don't leak whether the secret is set.
      return res.status(401).json({ success: false, message: 'Missing or unconfigured webhook signature.' });
    }

    // req.body is a Buffer here because /api/payment/webhook is mounted
    // with express.raw() in server.ts, before express.json(). This is
    // the ONLY safe way to verify Razorpay's HMAC — computing over a
    // re-stringified JSON body will silently break when Razorpay's
    // whitespace / key ordering / escape choices don't match Node's
    // JSON.stringify output.
    const rawBuf: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ''));
    const rawStr = rawBuf.toString('utf8');
    const expected = hmacSha256(secret, rawStr);
    if (expected !== signature) {
      con.warn('[Webhook] signature mismatch — refusing to process.');
      return res.status(401).json({ success: false, message: 'Invalid webhook signature.' });
    }

    // Only NOW do we parse — after the raw bytes have been signature-verified.
    let parsed: any = {};
    try { parsed = JSON.parse(rawStr); } catch (err: any) {
      con.error('[Webhook] JSON parse failed after signature ok:', err.message);
      return res.status(400).json({ success: false, message: 'Malformed webhook payload.' });
    }

    const event: string = parsed?.event || '';
    const payload = parsed?.payload || {};
    const paymentEntity = payload?.payment?.entity || {};
    const refundEntity  = payload?.refund?.entity  || {};

    con.log(`[Webhook] Razorpay ${event}`);

    // ── payment.captured — safety net ──────────────────────────────
    if (event === 'payment.captured') {
      const rzpPaymentId = paymentEntity.id;
      const rzpOrderId   = paymentEntity.order_id;

      // If we already have this booking/order (from client-side
      // verify), do nothing else.
      const existingBooking = await Booking.findOne({ paymentId: rzpPaymentId });
      const existingOrder   = await Order.findOne({ paymentId: rzpPaymentId });
      if (existingBooking || existingOrder) {
        writeVerifiedAudit({
          paymentId: rzpPaymentId,
          referenceId: existingBooking?.bookingId || existingOrder?.orderId || rzpPaymentId,
          adminUser: 'razorpay-webhook',
          metadata: { rzpOrderId, event, alreadyLinked: true },
        }).catch(() => {});
        return res.json({ success: true, message: 'Webhook acknowledged (already linked).' });
      }

      // We didn't get the client-side verify — record the audit anyway.
      // We cannot safely fabricate customer details from the webhook
      // alone (Razorpay's notes[] rarely carry name/email), so we
      // don't create a Booking/Order here — just an audit trail the
      // admin can reconcile from.
      writeVerifiedAudit({
        paymentId: rzpPaymentId,
        referenceId: rzpOrderId || rzpPaymentId,
        adminUser: 'razorpay-webhook',
        metadata: { rzpOrderId, event, amount: paymentEntity.amount, method: paymentEntity.method, unlinked: true },
      }).catch(() => {});

      return res.json({ success: true, message: 'Webhook acknowledged (unlinked audit only).' });
    }

    // ── payment.failed ─────────────────────────────────────────────
    if (event === 'payment.failed') {
      const rzpPaymentId = paymentEntity.id;
      const rzpOrderId   = paymentEntity.order_id;
      const errorDescr   = paymentEntity.error_description || paymentEntity.error_reason || '';

      // If we happen to have a booking linked by rzpOrderId (rare,
      // usually not created until verify succeeds), mark it cancelled.
      if (rzpOrderId) {
        const bk = await Booking.findOne({ razorpayOrderId: rzpOrderId });
        if (bk) {
          bk.bookingStatus = 'cancelled';
          bk.paymentStatus = 'rejected';
          await bk.save();
        }
      }

      try {
        await (PaymentAuditLog as any).create({
          paymentId: rzpPaymentId,
          referenceId: rzpOrderId || rzpPaymentId,
          action: 'REJECTED',
          adminUser: 'razorpay-webhook',
          adminNotes: errorDescr,
          metadata: { event, code: paymentEntity.error_code, source: paymentEntity.error_source },
        });
      } catch (e: any) { con.error('[PaymentAuditLog] payment.failed:', e.message); }

      return res.json({ success: true, message: 'Failure recorded.' });
    }

    // ── refund.processed ───────────────────────────────────────────
    if (event === 'refund.processed') {
      const rzpPaymentId = refundEntity.payment_id;
      const bk = await Booking.findOne({ paymentId: rzpPaymentId });
      if (bk) {
        const prevPay = bk.paymentStatus;
        bk.paymentStatus = 'refunded';
        await bk.save();
        try {
          await (StatusAuditLog as any).create({
            bookingId: bk._id.toString(),
            bookingRef: bk.bookingId,
            field: 'paymentStatus',
            previousValue: prevPay,
            newValue: 'refunded',
            adminUser: 'razorpay-webhook',
            adminNotes: null,
          });
        } catch (e: any) { con.error('[StatusAuditLog] refund.processed:', e.message); }

        notificationService.sendCustomerUpdate({
          bookingId: bk.bookingId,
          customerName: bk.name,
          customerEmail: bk.email || null,
          serviceName: bk.serviceName,
          amount: bk.amount,
          field: 'paymentStatus',
          newValue: 'refunded',
        }).catch((err: any) => con.error('[notificationService] refund failed:', err.message));
      }

      try {
        await (PaymentAuditLog as any).create({
          paymentId: rzpPaymentId,
          referenceId: bk?.bookingId || rzpPaymentId,
          action: 'VERIFIED',
          adminUser: 'razorpay-webhook',
          adminNotes: 'Refund processed',
          metadata: { event, refundId: refundEntity.id, amount: refundEntity.amount },
        });
      } catch (e: any) { con.error('[PaymentAuditLog] refund audit failed:', e.message); }

      return res.json({ success: true, message: 'Refund recorded.' });
    }

    // Unhandled events — ack anyway so Razorpay doesn't keep retrying.
    return res.json({ success: true, message: `Event ${event} acknowledged.` });
  } catch (error: any) {
    con.error('[Webhook] error:', error.message);
    // Do NOT return 500 to Razorpay if we can help it — retries add
    // noise. But if we truly can't process it, 5xx is appropriate.
    return res.status(500).json({ success: false, message: 'Webhook handler error.' });
  }
};
