/**
 * src/models/BookingClaimLog.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 *
 * Append-only. Records every claim ATTEMPT (success or failure), not
 * just successes — this is what makes basic abuse visibility possible
 * (a burst of failed attempts against many bookingId+phone
 * combinations from one account is the signature of a guessing
 * attack). Per the linkage strategy's security finding, this endpoint
 * is a realistic target, so logging failures is not optional polish.
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingClaimLog extends Document {
  bookingRef?: string | null;  // human-readable Booking.bookingId attempted — null if the lookup itself found nothing
  userId: string;               // who attempted the claim (always known — this endpoint requires login)
  success: boolean;
  method: 'login_time' | 'manual_claim';
  createdAt: Date;
}

const BookingClaimLogSchema = new Schema<IBookingClaimLog>(
  {
    bookingRef: { type: String, default: null },
    userId:     { type: String, required: true, index: true },
    success:    { type: Boolean, required: true },
    method:     { type: String, enum: ['login_time', 'manual_claim'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'booking_claim_logs' }
);

BookingClaimLogSchema.index({ userId: 1, createdAt: 1 });

const BookingClaimLog =
  mongoose.models.BookingClaimLog ??
  mongoose.model<IBookingClaimLog>('BookingClaimLog', BookingClaimLogSchema);

export default BookingClaimLog;
