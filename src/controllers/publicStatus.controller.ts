/**
 * src/controllers/publicStatus.controller.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 9 — Phase C Part 1, Feature 2 (Customer
 * Status Page) + Blocker 3 resolution.
 *
 * Public, unauthenticated, read-only. Deliberately a NEW endpoint
 * rather than loosening Phase B's existing GET /api/bookings/status/:id
 * (bookingStatus.controller.ts, untouched by this round) — that
 * endpoint's narrow 4-field contract stays intact for whatever else
 * may already depend on its minimal shape.
 *
 * SECURITY — explicit allowlist, not a denylist:
 * The response below is built field-by-field from values already
 * fetched, not by taking a Mongoose document and stripping fields after
 * the fact. This means a future field added to Booking or
 * StatusAuditLog can NEVER silently leak through this endpoint just
 * because someone forgot to exclude it — it has to be explicitly added
 * to the object literal below to ever appear in the response.
 *
 * NEVER included, per your explicit instruction:
 *   - StatusAuditLog.adminUser  (who made each change)
 *   - StatusAuditLog.adminNotes (admin-only notes)
 *   - Booking.phone / Booking.email (not needed for this public page;
 *     the customer already has these, no reason to echo them back to
 *     anyone holding just the bookingId)
 *   - Any payment screenshot URL or UTR (these live on UpiPayment, not
 *     Booking, and this endpoint never queries UpiPayment at all)
 *
 * Future phone/email+OTP lookup (your Feature 1 addition — explicitly
 * NOT built this round): this endpoint takes bookingId as a route
 * param today. A future POST /api/bookings/status/lookup endpoint,
 * accepting phone+OTP or email+OTP and returning the SAME response
 * shape this function builds, can be added as a sibling export in this
 * same file later — it would resolve to a bookingId via Booking.findOne
 * ({phone, ...}) after verifying the (separately-built) OTP, then call
 * this exact same response-building logic. No redesign of this
 * function or its response shape is needed to support that later; only
 * a new resolution path feeding into the same field-allowlist.
 */
import { Request, Response } from 'express';
import Booking from '../models/Booking';
import StatusAuditLog from '../models/StatusAuditLog';

export const getPublicBookingStatus = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required.' });
    }

    // Select only the fields this endpoint is allowed to ever touch —
    // mirrors bookingStatus.controller.ts's existing pattern of
    // restricting the MongoDB projection itself, not just the response.
    const booking = await Booking.findOne({ bookingId })
      .select('bookingId name serviceName amount paymentStatus bookingStatus createdAt updatedAt');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Timeline: StatusAuditLog entries for this booking, with adminUser
    // and adminNotes explicitly stripped — built field-by-field per
    // entry, not by spreading the Mongoose document.
    const auditEntries = await (StatusAuditLog as any)
      .find({ bookingId: booking._id.toString() })
      .sort('createdAt')
      .select('field newValue createdAt'); // adminUser, adminNotes, previousValue deliberately NOT selected

    const timeline = auditEntries.map((entry: any) => ({
      field: entry.field as 'paymentStatus' | 'bookingStatus',
      newValue: entry.newValue as string,
      timestamp: entry.createdAt as Date,
    }));

    res.json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        customerName: booking.name,
        serviceName: booking.serviceName,
        amount: booking.amount,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        timeline,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Could not fetch booking status.' });
  }
};
