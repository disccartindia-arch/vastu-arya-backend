/**
 * src/controllers/booking.controller.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 9 — Phase C Part 1,
 * Blocker 1 resolution): updateBookingStatus() extended to be the
 * single, unified write path for booking status, per the approved
 * audit's "Option A" — the existing admin Bookings page already calls
 * this endpoint, so extending it (rather than building a parallel
 * endpoint) means the existing live admin page benefits immediately
 * with no risk of silently desyncing from the new status-audit /
 * customer-notification system.
 *
 * NEW request body fields (both optional, additive — existing callers
 * sending only {status, notes} continue to work byte-for-byte
 * unchanged):
 *   paymentStatus?: PaymentStatus
 *   bookingStatus?: BookingStatus
 *   adminNotes?: string   // admin-only, written to StatusAuditLog,
 *                          // NEVER exposed on the public status page
 *
 * For each of paymentStatus/bookingStatus present in the body AND
 * different from the booking's current value: write one StatusAuditLog
 * entry (admin identity from req.user, never client-supplied — same
 * security pattern as Phase A's PaymentAuditLog), then call
 * notificationService.sendCustomerUpdate() for that field — which
 * internally no-ops for transitions that aren't notification-worthy
 * (see customerNotification.ts's NOTIFICATION_COPY table). A single
 * request changing BOTH axes writes two audit entries and may send up
 * to two customer notifications — these are independently meaningful
 * events, not collapsed into one.
 *
 * getAllBookings() is unchanged. getBookingById() is unchanged.
 */
import { Request, Response } from 'express';
import Booking, { PaymentStatus, BookingStatus } from '../models/Booking';
import StatusAuditLog from '../models/StatusAuditLog';
import { notificationService } from '../utils/notificationService';
import { AuthRequest } from '../middleware/auth.middleware';

const con = (console as any);

const VALID_PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'submitted', 'verified', 'rejected', 'refunded'];
const VALID_BOOKING_STATUSES: BookingStatus[] = ['pending_payment', 'payment_submitted', 'confirmed', 'consultation_scheduled', 'in_progress', 'completed', 'cancelled'];

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    const bookings = await Booking.find(filter).sort('-createdAt').limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await Booking.countDocuments(filter);
    res.json({ success: true, data: bookings, total });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes, paymentStatus, bookingStatus, adminNotes } = req.body;

    if (paymentStatus !== undefined && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: `Invalid paymentStatus. Allowed: ${VALID_PAYMENT_STATUSES.join(', ')}` });
    }
    if (bookingStatus !== undefined && !VALID_BOOKING_STATUSES.includes(bookingStatus)) {
      return res.status(400).json({ success: false, message: `Invalid bookingStatus. Allowed: ${VALID_BOOKING_STATUSES.join(', ')}` });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const adminIdentity = req.user?.name || req.user?.email || 'admin';

    // EXISTING behavior — legacy field, unchanged for every caller that
    // sends only {status, notes}.
    if (status !== undefined) booking.status = status;
    if (notes !== undefined) booking.notes = notes;

    // NEW — dual-axis updates, each independently audited and notified.
    const changedFields: { field: 'paymentStatus' | 'bookingStatus'; previousValue: string; newValue: string }[] = [];

    if (paymentStatus !== undefined && paymentStatus !== booking.paymentStatus) {
      changedFields.push({ field: 'paymentStatus', previousValue: booking.paymentStatus, newValue: paymentStatus });
      booking.paymentStatus = paymentStatus;
    }
    if (bookingStatus !== undefined && bookingStatus !== booking.bookingStatus) {
      changedFields.push({ field: 'bookingStatus', previousValue: booking.bookingStatus, newValue: bookingStatus });
      booking.bookingStatus = bookingStatus;
    }

    await booking.save();

    // Write one StatusAuditLog entry per changed field, then dispatch
    // one customer-notification attempt per changed field. Both are
    // fire-and-forget relative to the HTTP response — a notification
    // or audit-write failure must never fail the actual status update
    // that already succeeded in the database.
    for (const change of changedFields) {
      try {
        await (StatusAuditLog as any).create({
          bookingId: booking._id.toString(),
          bookingRef: booking.bookingId,
          field: change.field,
          previousValue: change.previousValue,
          newValue: change.newValue,
          adminUser: adminIdentity,
          adminNotes: adminNotes || null,
        });
      } catch (err: any) {
        con.error('[StatusAuditLog] failed to write entry:', err.message, change);
      }

      notificationService
        .sendCustomerUpdate({
          bookingId: booking.bookingId,
          customerName: booking.name,
          customerEmail: booking.email || null,
          serviceName: booking.serviceName,
          amount: booking.amount,
          field: change.field,
          newValue: change.newValue,
        })
        .catch((err: any) => {
          con.error('[notificationService] sendCustomerUpdate failed:', err.message);
        });
    }

    res.json({ success: true, message: 'Booking updated', data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * NEW — GET /api/bookings/:id/history
 * Admin-only (route-level authMiddleware/adminMiddleware, same as
 * every other booking.routes.ts route). Returns the full
 * StatusAuditLog trail for one booking, INCLUDING adminUser and
 * adminNotes — this is the admin-facing equivalent of the public
 * timeline, deliberately not field-restricted, since this route is
 * behind admin auth.
 */
export const getBookingStatusHistory = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id).select('_id');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const history = await (StatusAuditLog as any)
      .find({ bookingId: booking._id.toString() })
      .sort('createdAt');

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
