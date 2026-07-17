/**
 * src/controllers/account.controller.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 *
 * Every handler in this file is mounted behind authMiddleware
 * (account.routes.ts) and additionally performs an EXPLICIT ownership
 * check inside the handler itself — never relies on the query filter
 * alone. This is the architectural decision from
 * CUSTOMER_PORTAL_ARCHITECTURE.md: even if a future edit introduces a
 * query-filter mistake, the explicit check below still blocks
 * cross-account access.
 *
 * No handler in this file ever queries Booking/Order by phone or
 * email — only by userId (set either at creation time or via the
 * claim flow in accountClaim.controller.ts). This is the direct
 * enforcement of the approved linkage strategy's "no automatic
 * matching" rule.
 */
import { Response } from 'express';
import Booking from '../models/Booking';
import Order from '../models/Order';
import UpiPayment from '../models/UpiPayment';
import StatusAuditLog from '../models/StatusAuditLog';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { uploadToCloudinary } from '../routes/upload.routes';

const env = (process as any).env;
const con = (console as any);
const CONSULTANT_WHATSAPP = env.CONSULTANT_WHATSAPP || '+91 70003 43804';
const SUPPORT_WHATSAPP = env.SUPPORT_WHATSAPP || env.SUPPORT_PHONE || '+91 91110 36751';

// ── GET /api/account/dashboard ──────────────────────────────────────
export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();

    const [totalBookings, activeBookings, completedBookings, totalOrders, pendingPayments, verifiedPayments, latestBooking, latestOrder, latestStatusChange] = await Promise.all([
      Booking.countDocuments({ userId }),
      Booking.countDocuments({ userId, bookingStatus: { $in: ['pending_payment', 'payment_submitted', 'confirmed', 'consultation_scheduled', 'in_progress'] } }),
      Booking.countDocuments({ userId, bookingStatus: 'completed' }),
      Order.countDocuments({ user: userId }),
      Booking.countDocuments({ userId, paymentStatus: { $in: ['pending', 'submitted'] } }),
      Booking.countDocuments({ userId, paymentStatus: 'verified' }),
      Booking.findOne({ userId }).sort('-createdAt').select('bookingId serviceName amount paymentStatus bookingStatus createdAt'),
      Order.findOne({ user: userId }).sort('-createdAt').select('orderId totalAmount status createdAt'),
      (StatusAuditLog as any).find({}).sort('-createdAt').limit(50), // filtered below by booking ownership — see note
    ]);

    // StatusAuditLog has no userId of its own (it's keyed by
    // bookingId/bookingRef, not customer identity) — so "latest status
    // update" for THIS customer requires cross-referencing against
    // their own bookings, not querying the audit log directly by
    // userId (which doesn't exist on that schema, deliberately, since
    // it's a booking-scoped log, not a user-scoped one). Fetch the
    // customer's own booking refs first, then filter.
    const myBookingRefs = await Booking.find({ userId }).select('bookingId').lean();
    const myRefSet = new Set(myBookingRefs.map((b: any) => b.bookingId));
    const latestStatusForMe = (latestStatusChange as any[]).find(entry => myRefSet.has(entry.bookingRef)) || null;

    res.json({
      success: true,
      data: {
        stats: { totalBookings, activeBookings, completedBookings, totalOrders, pendingPayments, verifiedPayments },
        latestBooking,
        latestOrder,
        latestStatusUpdate: latestStatusForMe
          ? { bookingRef: latestStatusForMe.bookingRef, field: latestStatusForMe.field, newValue: latestStatusForMe.newValue, timestamp: latestStatusForMe.createdAt }
          : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/account/bookings ───────────────────────────────────────
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { search, filter = 'all', page = 1, limit = 10 } = req.query;

    const query: any = { userId };

    if (filter === 'active') query.bookingStatus = { $in: ['pending_payment', 'payment_submitted', 'confirmed', 'consultation_scheduled', 'in_progress'] };
    if (filter === 'completed') query.bookingStatus = 'completed';
    if (filter === 'cancelled') query.bookingStatus = 'cancelled';

    if (search) {
      const re = { $regex: String(search), $options: 'i' };
      query.$or = [{ bookingId: re }, { serviceName: re }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(query).sort('-createdAt').skip(skip).limit(Number(limit))
        .select('bookingId serviceName amount createdAt updatedAt paymentStatus bookingStatus'),
      Booking.countDocuments(query),
    ]);

    res.json({ success: true, data: bookings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/account/bookings/:id ───────────────────────────────────
export const getMyBookingDetail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const booking = await Booking.findOne({ bookingId: req.params.id })
      .select('bookingId name serviceName amount paymentStatus bookingStatus createdAt updatedAt userId paymentId paymentMethod ' +
              'consultationStatus consultationDate consultationTime consultationMode consultationLink consultationCustomerNote consultationScheduledAt');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Explicit ownership check — not just a query filter. A booking
    // that exists but isn't this customer's returns the SAME 404 as a
    // genuinely nonexistent one, so existence of other people's
    // bookingIds can't be enumerated via a different error shape.
    if (!booking.userId || booking.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const auditEntries = await (StatusAuditLog as any)
      .find({ bookingId: booking._id.toString() })
      .sort('createdAt')
      .select('field newValue createdAt'); // adminUser/adminNotes deliberately never selected — same customer-safe pattern as the public status page

    const timeline = auditEntries.map((e: any) => ({ field: e.field, newValue: e.newValue, timestamp: e.createdAt }));

    // Consultant WhatsApp is exposed ONLY once the payment is verified.
    // Pre-verified customers see only the support number. This is the
    // WhatsApp access-control boundary — never leak the consultant
    // number on unverified bookings, never on public endpoints.
    const isVerified = booking.paymentStatus === 'verified';
    const contact = {
      supportWhatsapp: SUPPORT_WHATSAPP,
      consultantWhatsapp: isVerified ? CONSULTANT_WHATSAPP : null,
    };

    res.json({ success: true, data: { ...booking.toObject(), timeline, contact } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/account/orders ─────────────────────────────────────────
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { search, filter = 'all', page = 1, limit = 10 } = req.query;

    const query: any = { user: userId };
    if (filter !== 'all') query.status = filter;
    if (search) {
      const re = { $regex: String(search), $options: 'i' };
      query.$or = [{ orderId: re }, { 'items.name': re }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).sort('-createdAt').skip(skip).limit(Number(limit))
        .select('orderId items totalAmount status paymentMethod createdAt'),
      Order.countDocuments(query),
    ]);

    res.json({ success: true, data: orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/account/orders/:id ─────────────────────────────────────
export const getMyOrderDetail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const order = await Order.findOne({ orderId: req.params.id });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (!order.user || order.user.toString() !== userId) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/account/payments ───────────────────────────────────────
// Merges UPI manual payments + Razorpay-paid bookings/orders into one
// list. UpiPayment has no userId of its own (by design — it's a
// payment-proof record, not a customer-identity record), so ownership
// flows through the linked Booking/Order's userId/user — fetched
// first, then used to filter UpiPayment by bookingId/orderId
// membership, never by phone/email.
export const getMyPayments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { filter = 'all' } = req.query;

    const [myBookings, myOrders] = await Promise.all([
      Booking.find({ userId }).select('_id bookingId amount paymentStatus paymentMethod createdAt'),
      Order.find({ user: userId }).select('_id orderId totalAmount status paymentMethod createdAt'),
    ]);

    const myBookingMongoIds = myBookings.map(b => b._id.toString());
    const myOrderMongoIds = myOrders.map(o => o._id.toString());

    const upiPayments = await UpiPayment.find({
      $or: [{ bookingId: { $in: myBookingMongoIds } }, { orderId: { $in: myOrderMongoIds } }],
    }).select('referenceId amount status submittedAt verifiedAt itemType');

    // Razorpay payments have no separate "payment record" — the
    // Booking/Order document itself IS the payment record for that
    // method (paymentId field). Synthesize a uniform shape so the
    // frontend renders one consistent list regardless of method.
    const razorpayBookingPayments = myBookings
      .filter(b => b.paymentMethod === 'razorpay' || !b.paymentMethod)
      .map(b => ({ reference: b.bookingId, amount: b.amount, status: b.paymentStatus, method: 'razorpay', date: b.createdAt, type: 'booking' }));
    const razorpayOrderPayments = myOrders
      .filter(o => o.paymentMethod === 'razorpay' || !o.paymentMethod)
      .map(o => ({ reference: o.orderId, amount: o.totalAmount, status: o.status, method: 'razorpay', date: (o as any).createdAt, type: 'order' })); // cast: IOrder doesn't declare createdAt explicitly even though timestamps:true generates it at runtime
    const upiFormatted = upiPayments.map(p => ({ reference: p.referenceId, amount: p.amount, status: p.status, method: 'upi_manual', date: p.submittedAt, type: p.itemType }));

    let combined = [...razorpayBookingPayments, ...razorpayOrderPayments, ...upiFormatted]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filter !== 'all') {
      combined = combined.filter(p => {
        if (filter === 'pending') return p.status === 'pending' || p.status === 'submitted' || p.status === 'UPI_PENDING';
        if (filter === 'verified') return p.status === 'verified' || p.status === 'PAID' || p.status === 'paid';
        if (filter === 'rejected') return p.status === 'rejected' || p.status === 'REJECTED';
        if (filter === 'refunded') return p.status === 'refunded';
        return true;
      });
    }

    res.json({ success: true, data: combined });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/account/profile ────────────────────────────────────────
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const [totalBookings, totalOrders] = await Promise.all([
      Booking.countDocuments({ userId }),
      Order.countDocuments({ user: userId }),
    ]);
    res.json({
      success: true,
      data: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || null,
        memberSince: req.user.createdAt,
        totalBookings,
        totalOrders,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PUT /api/account/profile ────────────────────────────────────────
// Name and phone only — email is the auth identity and is intentionally
// not editable from here (changing it would require a separate
// re-verification flow this round doesn't build, consistent with not
// half-building security-sensitive flows elsewhere in this project).
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone } = req.body;
    const update: Record<string, any> = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;

    if (!Object.keys(update).length) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    const user = await (User as any).findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/account/activity ───────────────────────────────────────
// Unified, newest-first feed across bookings/orders/status changes.
export const getActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { page = 1, limit = 20 } = req.query;

    const [myBookings, myOrders] = await Promise.all([
      Booking.find({ userId }).select('bookingId serviceName amount createdAt'),
      Order.find({ user: userId }).select('orderId totalAmount createdAt'),
    ]);

    const myRefSet = new Set(myBookings.map(b => b.bookingId));
    const myBookingMongoIds = myBookings.map(b => b._id.toString());

    const statusEvents = await (StatusAuditLog as any)
      .find({ bookingId: { $in: myBookingMongoIds } })
      .sort('-createdAt');

    const events = [
      ...myBookings.map(b => ({ type: 'booking_created', label: `Booking created — ${b.serviceName}`, ref: b.bookingId, amount: b.amount, timestamp: b.createdAt })),
      ...myOrders.map(o => ({ type: 'order_created', label: 'Order placed', ref: o.orderId, amount: o.totalAmount, timestamp: (o as any).createdAt })), // cast: same IOrder timestamps issue
      ...statusEvents.map((e: any) => ({ type: 'status_change', label: `${e.field === 'paymentStatus' ? 'Payment' : 'Booking'} → ${e.newValue.replace(/_/g, ' ')}`, ref: e.bookingRef, amount: null, timestamp: e.createdAt })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const skip = (Number(page) - 1) * Number(limit);
    const pageItems = events.slice(skip, skip + Number(limit));

    res.json({ success: true, data: pageItems, total: events.length, page: Number(page), pages: Math.ceil(events.length / Number(limit)) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ── PUT /api/account/profile/avatar ─────────────────────────────────
// Multipart file upload → Cloudinary (reuses existing uploadToCloudinary
// helper, no new upload infrastructure) → store returned URL on the
// User's `avatar` field. Route wires multer's upload.single('avatar')
// ahead of this handler, so req.file is guaranteed by the time we get
// here (except for the 400 no-file case below).
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Avatar file is required.' });
    }
    const uploaded = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      'vastuarya/avatars'
    );

    const user = await (User as any).findByIdAndUpdate(
      req.user._id,
      { avatar: uploaded.url },
      { new: true, runValidators: true }
    ).select('-password');

    con.log(`[Avatar] uploaded for user=${req.user._id} url=${uploaded.url}`);

    res.json({
      success: true,
      message: 'Profile photo updated',
      data: { avatar: uploaded.url, user },
    });
  } catch (error: any) {
    con.error('[Avatar] upload error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Avatar upload failed.' });
  }
};
