/// <reference types="node" />
/**
 * upiPayment.controller.ts
 *
 * NEW — replaces the previously-uploaded controllers/upiVerificationController.ts.
 * That file is superseded because it:
 *   - imported a `../lib/mongodb` connectDB() helper that doesn't exist in this
 *     Express/Render backend (that pattern is from Next.js serverless functions)
 *   - referenced an `adminAuthMiddleware` that was never defined anywhere
 *   - wrote `paymentStatus`, `upiReferenceId`, and `status: "confirmed"/"active"`
 *     onto Booking/Order — none of which exist on those schemas, and
 *     "confirmed" isn't a valid Booking status, so those writes would have
 *     silently no-op'd or failed validation even if it had been wired up.
 *
 * This version is self-contained: it creates its own pending Booking/Order at
 * submission time (so it doesn't depend on the separate manual-booking
 * endpoints that are out of scope for this round), and on verification it
 * only ever writes fields that already exist on Booking/Order — status
 * ('paid'/'cancelled', both valid enum values), paymentId, paymentMethod,
 * notes — so every existing endpoint that reads those models (admin
 * dashboard, order/booking lookups) keeps working unmodified.
 *
 * Razorpay is completely untouched by this file — this is the UPI *fallback*
 * path only, used when a customer pays via their own UPI app and uploads
 * proof instead of going through Razorpay checkout.
 */
import { Request, Response } from 'express';
import UpiPayment from '../models/UpiPayment';
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

const BOOKING_TYPES = ['service', 'booking', 'consultation'];
const ORDER_TYPES   = ['product', 'order'];
const VALID_TYPES    = [...BOOKING_TYPES, ...ORDER_TYPES];

// ── PUBLIC: POST /api/payment/upi/submit ──────────────────────────────────────
// Customer has already paid via their own UPI app using the QR/ID shown on the
// site, and is uploading proof now. Creates a pending Booking/Order PLUS a
// UPI_PENDING verification record. Nothing is marked paid until an admin
// reviews the screenshot and verifies it.
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
// Read-only, returns only status — no screenshot/admin data exposed.
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
    if (status) filter.status = status;
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

// ── ADMIN: POST /api/admin/upi-payments/:id/verify ────────────────────────────
// The ONLY path that can mark a UPI-fallback payment as paid.
export const verifyUpiPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const payment = await UpiPayment.findById(id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Payment already verified.' });
    }

    payment.status = 'PAID';
    payment.verifiedAt = new Date();
    payment.verifiedBy = req.user?.name || req.user?.email || 'admin';
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

    payment.status = 'REJECTED';
    payment.verifiedAt = new Date();
    payment.verifiedBy = req.user?.name || req.user?.email || 'admin';
    payment.adminNotes = adminNotes ?? 'Rejected by admin — screenshot did not match.';
    await payment.save();

    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, { status: 'cancelled', notes: adminNotes || 'UPI payment rejected by admin.' });
    } else if (payment.orderId) {
      await Order.findByIdAndUpdate(payment.orderId, { status: 'cancelled', notes: adminNotes || 'UPI payment rejected by admin.' });
    }

    res.json({ success: true, message: 'Payment marked as rejected.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Rejection failed.' });
  }
};
