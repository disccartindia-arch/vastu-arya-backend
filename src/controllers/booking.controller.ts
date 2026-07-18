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
import Booking, { PaymentStatus, BookingStatus, MeetingType } from '../models/Booking';
import StatusAuditLog from '../models/StatusAuditLog';
import { notificationService } from '../utils/notificationService';
import { AuthRequest } from '../middleware/auth.middleware';
import { combineISTDateTime, APP_TIMEZONE } from '../utils/tz';

const con = (console as any);

const VALID_PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'submitted', 'verified', 'rejected', 'refunded'];
const VALID_BOOKING_STATUSES: BookingStatus[] = ['pending_payment', 'payment_submitted', 'confirmed', 'consultation_scheduled', 'in_progress', 'completed', 'cancelled'];
const VALID_MEETING_TYPES: MeetingType[] = ['google_meet', 'whatsapp', 'phone', 'offline'];

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
    const {
      status, notes, paymentStatus, bookingStatus, adminNotes,
      // Consultation-scheduling fields — all optional. If any of the
      // required trio (consultationDate + consultationTime + meetingType)
      // is present, treated as a consultation-save request. adminNote
      // stays admin-only; customerNote is customer-visible.
      consultationDate, consultationTime, meetingType, meetingLink, customerNote, adminNote,
    } = req.body;

    if (paymentStatus !== undefined && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: `Invalid paymentStatus. Allowed: ${VALID_PAYMENT_STATUSES.join(', ')}` });
    }
    if (bookingStatus !== undefined && !VALID_BOOKING_STATUSES.includes(bookingStatus)) {
      return res.status(400).json({ success: false, message: `Invalid bookingStatus. Allowed: ${VALID_BOOKING_STATUSES.join(', ')}` });
    }

    // Consultation validation — only when scheduling is being attempted
    // (any of the three core scheduling fields present). Partial
    // consultation submissions are rejected outright to keep the DB
    // shape consistent: either you save all three (date/time/type), or
    // you save none.
    const isConsultationSave =
      consultationDate !== undefined ||
      consultationTime !== undefined ||
      meetingType     !== undefined;

    let parsedConsultationDate: Date | null = null;
    if (isConsultationSave) {
      if (!consultationDate || !consultationTime || !meetingType) {
        return res.status(400).json({ success: false, message: 'consultationDate, consultationTime and meetingType are all required to schedule a consultation.' });
      }
      if (!VALID_MEETING_TYPES.includes(meetingType)) {
        return res.status(400).json({ success: false, message: `Invalid meetingType. Allowed: ${VALID_MEETING_TYPES.join(', ')}` });
      }
      parsedConsultationDate = combineISTDateTime(consultationDate, consultationTime);
      if (isNaN(parsedConsultationDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid consultationDate/consultationTime.' });
      }
      if (meetingType === 'google_meet' && !meetingLink) {
        return res.status(400).json({ success: false, message: 'meetingLink is required when meetingType is google_meet.' });
      }
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const adminIdentity = req.user?.name || req.user?.email || 'admin';

    // EXISTING behavior — legacy field, unchanged for every caller that
    // sends only {status, notes}.
    if (status !== undefined) booking.status = status;
    if (notes !== undefined) booking.notes = notes;

    // Dual-axis status updates, each independently audited and notified.
    const changedFields: { field: 'paymentStatus' | 'bookingStatus'; previousValue: string; newValue: string }[] = [];

    if (paymentStatus !== undefined && paymentStatus !== booking.paymentStatus) {
      changedFields.push({ field: 'paymentStatus', previousValue: booking.paymentStatus, newValue: paymentStatus });
      booking.paymentStatus = paymentStatus;
    }
    if (bookingStatus !== undefined && bookingStatus !== booking.bookingStatus) {
      changedFields.push({ field: 'bookingStatus', previousValue: booking.bookingStatus, newValue: bookingStatus });
      booking.bookingStatus = bookingStatus;
    }

    // Consultation scheduling — save details, capture scheduledBy/At,
    // increment rescheduledCount if already scheduled, auto-advance
    // bookingStatus to consultation_scheduled the first time (if the
    // client didn't already send one).
    let consultationDispatched = false;
    let wasRescheduled = false;
    if (isConsultationSave && parsedConsultationDate) {
      wasRescheduled = booking.consultationStatus === 'scheduled';

      booking.consultationDate      = parsedConsultationDate;
      booking.consultationTime      = consultationTime;
      booking.timezone              = APP_TIMEZONE;
      booking.meetingType           = meetingType;
      booking.meetingLink           = meetingLink ?? null;
      booking.customerNote          = customerNote ?? null;
      booking.consultationAdminNote = adminNote ?? booking.consultationAdminNote ?? null;
      booking.consultationStatus    = 'scheduled';
      booking.scheduledBy           = adminIdentity;
      booking.scheduledAt           = new Date();
      if (wasRescheduled) {
        booking.rescheduledCount = (booking.rescheduledCount || 0) + 1;
      }

      // Auto-advance bookingStatus once, only if the client didn't
      // explicitly send one AND the current status is 'confirmed'.
      if (bookingStatus === undefined && booking.bookingStatus === 'confirmed') {
        changedFields.push({ field: 'bookingStatus', previousValue: booking.bookingStatus, newValue: 'consultation_scheduled' });
        booking.bookingStatus = 'consultation_scheduled';
      }

      consultationDispatched = true;
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

    // Fire the multi-channel consultation notification (email + SMS +
    // push) via the reusable NotificationService. Fire-and-forget — a
    // channel failure never fails the HTTP response.
    if (consultationDispatched && parsedConsultationDate) {
      notificationService.sendConsultationNotifications({
        userId:        booking.userId || null,
        bookingId:     booking.bookingId,
        customerName:  booking.name,
        customerEmail: booking.email || null,
        customerPhone: booking.phone || null,
        serviceName:   booking.serviceName,
        amount:        booking.amount,
        date:          parsedConsultationDate,
        time:          consultationTime,
        meetingType:   meetingType,
        meetingLink:   meetingLink || null,
        customerNote:  customerNote || null,
        rescheduled:   wasRescheduled,
      }).catch((err: any) => {
        con.error('[Consultation] notification dispatch failed:', err.message);
      });
      con.log(`[Consultation] ${wasRescheduled ? 'rescheduled' : 'scheduled'} for booking=${booking.bookingId} by=${adminIdentity} type=${meetingType} tz=${APP_TIMEZONE}`);
    }

    res.json({ success: true, message: 'Booking updated', data: booking });
  } catch (error: any) {
    con.error('[Booking] updateBookingStatus error:', error.message);
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
