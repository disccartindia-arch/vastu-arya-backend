/**
 * src/controllers/bookingStatus.controller.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 8 — Phase B, Feature 4 (API foundation only,
 * per explicit instruction: no frontend pages this round).
 *
 * Public, read-only, minimal-exposure endpoint. Deliberately returns
 * ONLY the four fields specified in the brief — not the customer's
 * name, phone, email, admin notes, or any other field on the Booking
 * document. This is intentional: bookingId values are not secret or
 * hard to guess (they're sequential timestamp-based strings,
 * `BK${Date.now()}${random}`), so this endpoint must not leak personal
 * data to anyone who happens to know or guesses a bookingId. A future
 * phase building the actual /my-bookings authenticated page can add a
 * separate, auth-gated endpoint that returns full detail — this one is
 * intentionally the minimal "is my payment through yet" check the brief
 * asked for.
 *
 * Does not require authentication (per the brief's example), but is
 * scoped to read-only and minimal-field-only specifically because of
 * that. If a future phase decides this needs to be auth-gated instead,
 * that's a route-level change (adding authMiddleware) with no change
 * needed to this controller.
 */
import { Request, Response } from 'express';
import Booking from '../models/Booking';

export const getBookingStatus = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required.' });
    }

    // Select ONLY the fields this endpoint is meant to expose — see
    // file header. Mongoose's .select() with a space-separated
    // inclusion list means every other field (name, phone, email,
    // formData, notes, etc.) is never even pulled out of MongoDB, not
    // just hidden in the response.
    const booking = await Booking.findOne({ bookingId })
      .select('bookingId paymentStatus bookingStatus updatedAt');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    res.json({
      bookingId: booking.bookingId,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      lastUpdated: booking.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Could not fetch booking status.' });
  }
};
