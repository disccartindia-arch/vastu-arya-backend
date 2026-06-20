/// <reference types="node" />
/**
 * upiPayment.controller.ts
 *
 * UNCHANGED FROM PRIOR ROUNDS: everything in submitUpiPayment's Booking/
 * Order creation, Cloudinary upload call, and the core verify/reject
 * status-transition logic for Booking/Order is byte-for-byte identical
 * to the version this replaces. See original file header (preserved
 * below) for that history.
 *
 * CHANGED THIS ROUND — PRODUCTION HOTFIX ROUND 8, Phase A:
 *
 * (1) AUDIT LOGGING (Item 6) — added three PaymentAuditLog.create() calls:
 *     - in submitUpiPayment(), after the UpiPayment document is
 *       successfully created -> logs action 'SUBMITTED', adminUser: null
 *     - in verifyUpiPayment(), after payment.save() -> logs 'VERIFIED',
 *       adminUser: the actual authenticated admin's name/email
 *     - in rejectUpiPayment(), after payment.save() -> logs 'REJECTED',
 *       same adminUser sourcing
 *     Each call is wrapped so a logging failure can NEVER block or roll
 *     back the actual payment action — audit logging is observability,
 *     not a transactional requirement, and making it block real payment
 *     verification would be a worse failure mode than an occasionally
 *     missing log row. Logged with .catch() + console.error, fire-and-
 *     forget is NOT used though — it's awaited so log entries are
 *     ordered correctly relative to the action that produced them, just
 *     not allowed to throw past its own try/catch.
 *
 * (2) BUG FOUND DURING TRACE (Phase A Item 2) — listUpiPayments() 'all'
 *     filter was broken: the admin UI's "All" tab sends status=all as a
 *     literal query string, but the old code did
 *     `if (status) filter.status = status` — making the Mongo query
 *     { status: 'all' }, which matches zero documents (no UpiPayment
 *     document has the literal status value "all"). Fixed by excluding
 *     the sentinel value 'all' from the filter, so that tab now
 *     correctly returns every payment regardless of status. This is a
 *     real pre-existing bug, not something introduced this round — see
 *     DATABASE_RECORD_TRACE.md for the full evidence trail.
 *
 * Nothing else in this file changed. Razorpay is still completely
 * untouched by this file, as before.
 */
import { Request, Response } from 'express';
import UpiPayment from '../models/UpiPayment';
import PaymentAuditLog from '../models/PaymentAuditLog';
import Booking from '../models/Booking';
import Order from '../models/Order';
import Service from '../models/Service';
import Product from '../models/Product';
import PaymentSettings from '../models/PaymentSettings';
import { AuthRequest } from '../middleware/auth.middleware';
import { uploadToCloudinary } from '../routes/upload.routes';

const con = (console as any);

function generateReferenceId(): string {
  return `UPI-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Audit logging helper — deliberately swallows its own errors so a
// logging failure can never block or corrupt the real payment action
// it's attached to. See file header.
async function logAudit(entry: {
  paymentId: string;
  referenceId: string;
  action: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  adminUser?: string | null;
  adminNotes?: string | null;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await PaymentAuditLog.create(entry);
  } catch (err: any) {
    con.error('[PaymentAuditLog] failed to write audit entry:', err.message, entry);
  }
}

const BOOKING_TYPES = ['service', 'booking', 'consultation'];
const ORDER_TYPES   = ['product', 'order'];
const VALID_TYPES    = [...BOOKING_TYPES, ...ORDER_TYPES];

// ── PUBLIC: POST /api/payment/upi/submit ──────────────────────────────────────
export const submitUpiPayment = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Payment screenshot is required.' });
    }

    const { itemId, itemType, amount, transactionId, uploaderName, uploaderPhone, upiId, itemName, email, formData } = req.body;

    if (!itemType || !amount || !uploaderName || !uploaderPhone) {
      return res.status(400).json({ success: false, message: 'itemType, amount, uploaderName and uploaderPhone are required.' });
    }
    if (!VALID_TYPES.includes(itemType)) {
      return res.status(400).json({ success: false, message: `Invalid itemType. Allowed: ${VALID_TYPES.join(', ')}` });
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount.' });
    }

    const uploaded = await uploadToCloudinary(req.file.buffer, req.file.mimetype, req.file.originalname, 'vastuarya/upi-screenshots');

    let resolvedUpiId = upiId;
    if (!resolvedUpiId) {
      const settings = await PaymentSettings.findOne();
      resolvedUpiId = settings?.primaryUPI || 'aryavartguna@ybl';
    }

    let parsedFormData: Record<string, any> = {};
    if (formData) {
      try { parsedFormData = typeof formData === 'string' ? JSON.parse(formData) : formData; } catch { parsedFormData = {}; }
    }

    let createdBookingId: string | null = null;
    let createdOrderId: string | null = null;

    if (BOOKING_TYPES.includes(itemType)) {
      let resolvedServiceName = itemName;
      if (!resolvedServiceName && itemId) {
        const service = await Service.findById(itemId).select('title').catch(() => null);
        resolvedServiceName = service?.title?.en;
      }
      const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const booking = await Booking.create({
        bookingId,
        name: uploaderName,
        phone: uploaderPhone,
        email: email || undefined,
        service: itemId || undefined,
        serviceName: resolvedServiceName || 'Vastu Consultation',
        amount: numericAmount,
        formData: parsedFormData,
        status: 'pending',
        paymentMethod: 'upi_manual',
      });
      createdBookingId = booking._id.toString();
    } else {
      let resolvedName = itemName;
      if (!resolvedName && itemId) {
        const product = await Product.findById(itemId).select('name').catch(() => null);
        resolvedName = product?.name?.en;
      }
      const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const order = await Order.create({
        orderId,
        customerInfo: { name: uploaderName, email: email || '', phone: uploaderPhone, address: '', city: '', pincode: '' },
        items: [{ product: itemId || undefined, name: resolvedName || 'Vastu Arya order', price: numericAmount, qty: 1, image: '' }],
        totalAmount: numericAmount,
        status: 'pending',
        type: 'product',
        paymentMethod: 'upi_manual',
      });
      createdOrderId = order._id.toString();
    }

    const referenceId = generateReferenceId();
    const payment = await UpiPayment.create({
      referenceId,
      itemId: itemId || null,
      itemType,
      bookingId: createdBookingId,
      orderId: createdOrderId,
      amount: numericAmount,
      upiId: resolvedUpiId,
      transactionId: transactionId || null,
      screenshotUrl: uploaded.url,
      uploaderName,
      uploaderPhone,
      status: 'UPI_PENDING',
    });

    // NEW (Phase A, Item 6) — audit log entry for the submission event.
    // adminUser is null: no admin is involved at submission time, this
    // is a customer-initiated action.
    await logAudit({
      paymentId: payment._id.toString(),
      referenceId: payment.referenceId,
      action: 'SUBMITTED',
      adminUser: null,
      metadata: {
        amount: numericAmount,
        itemType,
        uploaderName,
        uploaderPhone,
        upiId: resolvedUpiId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Payment submitted. Our team will verify it shortly.',
      data: { referenceId: payment.referenceId, status: payment.status, bookingId: createdBookingId, orderId: createdOrderId },
    });
  } catch (error: any) {
    con.error('[UpiPayment] submit error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Submission failed.' });
  }
};

// ── PUBLIC: GET /api/payment/upi/status/:referenceId ──────────────────────────
export const getUpiPaymentStatus = async (req: Request, res: Response) => {
  try {
    const payment = await UpiPayment.findOne({ referenceId: req.params.referenceId }).select('referenceId status submittedAt verifiedAt');
    if (!payment) return res.status(404).json({ success: false, message: 'Reference ID not found.' });
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN: GET /api/admin/upi-payments ────────────────────────────────────────
export const listUpiPayments = async (req: Request, res: Response) => {
  try {
    const { status = 'UPI_PENDING', page = 1, limit = 20 } = req.query;
    const filter: any = {};
    // FIXED (Phase A, Item 2 trace finding): the admin UI's "All" tab
    // sends status=all literally. Previously this set filter.status =
    // 'all', a value no document ever has, silently returning zero
    // results for that tab. 'all' (and empty string) now correctly
    // means "no status filter" instead of being treated as a real
    // status value.
    if (status && status !== 'all') filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      UpiPayment.find(filter).sort('-submittedAt').skip(skip).limit(Number(limit)),
      UpiPayment.countDocuments(filter),
    ]);
    res.json({ success: true, data: payments, total, page: Number(page) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN: GET /api/admin/upi-payments/:id ────────────────────────────────────
export const getUpiPaymentById = async (req: Request, res: Response) => {
  try {
    const payment = await UpiPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW — ADMIN: GET /api/admin/upi-payments/:id/audit-log
// Returns the full append-only audit history for a single payment, in
// chronological order. Additive endpoint — does not affect any existing
// caller.
export const getUpiPaymentAuditLog = async (req: Request, res: Response) => {
  try {
    const logs = await PaymentAuditLog.find({ paymentId: req.params.id }).sort('createdAt');
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN: POST /api/admin/upi-payments/:id/verify ────────────────────────────
export const verifyUpiPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const payment = await UpiPayment.findById(id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Payment already verified.' });
    }

    const adminIdentity = req.user?.name || req.user?.email || 'admin';

    payment.status = 'PAID';
    payment.verifiedAt = new Date();
    payment.verifiedBy = adminIdentity;
    payment.adminNotes = adminNotes ?? null;
    await payment.save();

    const noteSuffix = ` [UPI verified — ref ${payment.referenceId}]`;

    if (payment.bookingId) {
      const booking = await Booking.findById(payment.bookingId);
      if (booking) {
        booking.status = 'paid';
        booking.paymentId = payment.referenceId;
        booking.paymentMethod = 'upi_manual';
        booking.notes = `${booking.notes || ''}${noteSuffix}`.trim();
        await booking.save();
      }
    } else if (payment.orderId) {
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.status = 'paid';
        order.paymentId = payment.referenceId;
        order.paymentMethod = 'upi_manual';
        order.notes = `${order.notes || ''}${noteSuffix}`.trim();
        await order.save();
      }
    }

    // NEW (Phase A, Item 6) — audit log entry for the verification event.
    await logAudit({
      paymentId: payment._id.toString(),
      referenceId: payment.referenceId,
      action: 'VERIFIED',
      adminUser: adminIdentity,
      adminNotes: adminNotes ?? null,
      metadata: { amount: payment.amount, bookingId: payment.bookingId, orderId: payment.orderId },
    });

    res.json({ success: true, message: 'Payment verified and order/booking marked paid.', referenceId: payment.referenceId });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Verification failed.' });
  }
};

// ── ADMIN: POST /api/admin/upi-payments/:id/reject ────────────────────────────
export const rejectUpiPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const payment = await UpiPayment.findById(id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.status !== 'UPI_PENDING') {
      return res.status(400).json({ success: false, message: `Cannot reject a payment with status: ${payment.status}` });
    }

    const adminIdentity = req.user?.name || req.user?.email || 'admin';
    const resolvedNotes = adminNotes ?? 'Rejected by admin — screenshot did not match.';

    payment.status = 'REJECTED';
    payment.verifiedAt = new Date();
    payment.verifiedBy = adminIdentity;
    payment.adminNotes = resolvedNotes;
    await payment.save();

    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, { status: 'cancelled', notes: adminNotes || 'UPI payment rejected by admin.' });
    } else if (payment.orderId) {
      await Order.findByIdAndUpdate(payment.orderId, { status: 'cancelled', notes: adminNotes || 'UPI payment rejected by admin.' });
    }

    // NEW (Phase A, Item 6) — audit log entry for the rejection event.
    await logAudit({
      paymentId: payment._id.toString(),
      referenceId: payment.referenceId,
      action: 'REJECTED',
      adminUser: adminIdentity,
      adminNotes: resolvedNotes,
      metadata: { amount: payment.amount, bookingId: payment.bookingId, orderId: payment.orderId },
    });

    res.json({ success: true, message: 'Payment marked as rejected.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Rejection failed.' });
  }
};
