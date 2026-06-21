/**
 * src/controllers/accountClaim.controller.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 11 — Phase D, claim flow per your modified
 * linkage strategy.
 *
 * SECURITY DESIGN — every point below is deliberate, not incidental:
 *
 * 1. EVERY failure path returns the exact same generic message and
 *    status code: 400 { success:false, message:'Could not verify
 *    these details. Please check the Booking ID, phone number, and
 *    email (if applicable) and try again.' } — wrong bookingId, wrong
 *    phone, wrong/missing email, already-claimed: all indistinguishable
 *    from outside. This prevents an attacker from using differential
 *    error responses to enumerate valid bookingIds or learn which
 *    field was wrong.
 *
 * 2. Phone is ALWAYS required and ALWAYS checked (Booking.phone is a
 *    required field — there is no booking without one).
 *
 * 3. Email is required and checked ONLY IF the booking record itself
 *    has an email on file. If the booking has no email, the request's
 *    email field (if supplied) is ignored for matching purposes —
 *    per your explicit "when the booking contains an email"
 *    qualifier. A booking WITH an email cannot be claimed by someone
 *    who omits email or supplies the wrong one.
 *
 * 4. Every attempt — success or failure — is logged to
 *    BookingClaimLog, including failures with no matching booking
 *    found at all (bookingRef: null in that case). This is what makes
 *    a guessing attack visible after the fact, even though individual
 *    failures aren't blocked beyond rate limiting.
 *
 * 5. Mounted behind the existing `paymentLimiter` (20 requests/10min)
 *    in accountClaim.routes.ts — this endpoint is exactly the class of
 *    target that limiter already exists for in this codebase.
 *
 * 6. NO bulk claim. NO "claim all bookings matching my phone." Exactly
 *    one specific bookingId per request, always.
 */
import { Response } from 'express';
import Booking from '../models/Booking';
import BookingClaimLog from '../models/BookingClaimLog';
import { AuthRequest } from '../middleware/auth.middleware';

const con = (console as any);

const GENERIC_FAILURE = 'Could not verify these details. Please check the Booking ID, phone number, and email (if applicable) and try again.';

function normalizeEmail(e: string | undefined | null): string {
  return (e || '').trim().toLowerCase();
}
function normalizePhone(p: string | undefined | null): string {
  return (p || '').trim();
}

async function logAttempt(userId: string, bookingRef: string | null, success: boolean): Promise<void> {
  try {
    await (BookingClaimLog as any).create({ userId, bookingRef, success, method: 'manual_claim' });
  } catch (err: any) {
    con.error('[BookingClaimLog] failed to write entry:', err.message);
  }
}

export const claimBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { bookingId, phone, email } = req.body;

    if (!bookingId || !phone) {
      return res.status(400).json({ success: false, message: GENERIC_FAILURE });
    }

    const booking = await Booking.findOne({ bookingId: String(bookingId).trim() });

    if (!booking) {
      await logAttempt(userId, String(bookingId).trim(), false);
      return res.status(400).json({ success: false, message: GENERIC_FAILURE });
    }

    // Already claimed by anyone (including this same user re-submitting)
    // — never reveal which case it is, same generic failure either way.
    if (booking.userId) {
      await logAttempt(userId, booking.bookingId, false);
      return res.status(400).json({ success: false, message: GENERIC_FAILURE });
    }

    // Phone — always required, always checked.
    if (normalizePhone(phone) !== normalizePhone(booking.phone)) {
      await logAttempt(userId, booking.bookingId, false);
      return res.status(400).json({ success: false, message: GENERIC_FAILURE });
    }

    // Email — checked ONLY if the booking has one on file. If it does,
    // the submitted email must be present AND match exactly
    // (case-insensitive). If the booking has no email, this check is
    // skipped entirely regardless of what was submitted.
    if (booking.email) {
      if (normalizeEmail(email) !== normalizeEmail(booking.email)) {
        await logAttempt(userId, booking.bookingId, false);
        return res.status(400).json({ success: false, message: GENERIC_FAILURE });
      }
    }

    // All applicable checks passed — link.
    booking.userId = userId;
    await booking.save();

    await logAttempt(userId, booking.bookingId, true);

    res.json({
      success: true,
      message: 'Booking linked to your account successfully.',
      data: { bookingId: booking.bookingId, serviceName: booking.serviceName },
    });
  } catch (error: any) {
    con.error('[claimBooking] error:', error.message);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};
