/**
 * src/models/Booking.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 11 — Phase D, approved
 * User Linkage Strategy): one new additive field, `userId`.
 *
 * Set in exactly two ways, both verified-identity paths — never by
 * automatic phone/email matching, per your explicit modification to
 * the linkage strategy:
 *   1. At creation time, if the request carries a valid logged-in
 *      session (payment.controller.ts / upiPayment.controller.ts, both
 *      patched this round to pass req.user?._id through if present).
 *   2. Via the new POST /api/account/claim endpoint
 *      (accountClaim.controller.ts), which requires the customer to
 *      supply the exact bookingId, phone, and (if the booking has one)
 *      email — never inferred, never bulk-matched.
 *
 * Every existing Booking document has this field unset
 * (undefined/null) until one of the above two paths explicitly sets
 * it. No migration, no backfill — exactly the same additive pattern
 * used for paymentStatus/bookingStatus in Phase B.
 */
import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'rejected' | 'refunded';
export type BookingStatus =
  | 'pending_payment'
  | 'payment_submitted'
  | 'confirmed'
  | 'consultation_scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type MeetingType = 'google_meet' | 'whatsapp' | 'phone' | 'offline';
export type ConsultationStatus = 'not_scheduled' | 'scheduled' | 'completed' | 'cancelled';

export interface IBooking extends Document {
  bookingId: string;
  name: string;
  phone: string;
  email?: string;
  service?: mongoose.Types.ObjectId;
  serviceName: string;
  amount: number;
  formData?: Record<string, any>;
  paymentId?: string;
  razorpayOrderId?: string;
  transactionId?: string | null;
  paymentMethod?: 'razorpay' | 'upi_manual';
  status: string;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  // Consultation scheduling — populated by the admin scheduler flow
  // (booking.controller.ts updateBookingStatus). consultationAdminNote
  // is admin-only, never exposed on customer routes.
  consultationStatus: ConsultationStatus;
  consultationDate?: Date | null;
  consultationTime?: string | null;
  timezone?: string | null;
  meetingType?: MeetingType | null;
  meetingLink?: string | null;
  customerNote?: string | null;
  consultationAdminNote?: string | null;
  scheduledBy?: string | null;
  scheduledAt?: Date | null;
  rescheduledCount?: number;
  notes?: string;
  whatsappSent: boolean;

  // NEW — Phase D. Optional, unset by default. ObjectId of the linked
  // User, stored as a string for consistency with how this codebase
  // already stores other Mongo references as strings elsewhere
  // (UpiPayment.bookingId, StatusAuditLog.bookingId, etc.) rather than
  // a true Mongoose ref — this matches the existing project convention
  // rather than introducing a new pattern.
  userId?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  bookingId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  service: { type: Schema.Types.ObjectId, ref: 'Service' },
  serviceName: { type: String, required: true },
  amount: { type: Number, required: true },
  formData: { type: Schema.Types.Mixed },
  paymentId: { type: String },
  razorpayOrderId: { type: String },
  transactionId: { type: String, default: null, index: true },
  paymentMethod: { type: String, enum: ['razorpay', 'upi_manual'], default: 'razorpay' },
  status: { type: String, enum: ['pending','paid','called','completed','cancelled'], default: 'pending' },

  paymentStatus: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'rejected', 'refunded'],
    default: 'pending',
  },
  bookingStatus: {
    type: String,
    enum: ['pending_payment', 'payment_submitted', 'confirmed', 'consultation_scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'pending_payment',
  },

  // Consultation scheduling — additive fields, all default-null. See
  // IBooking header comment above for why these replace the free-text
  // `notes` field for consultation info.
  consultationStatus: {
    type: String,
    enum: ['not_scheduled', 'scheduled', 'completed', 'cancelled'],
    default: 'not_scheduled',
  },
  consultationDate:      { type: Date,   default: null },
  consultationTime:      { type: String, default: null },
  timezone:              { type: String, default: 'Asia/Kolkata' },
  meetingType:           { type: String, enum: ['google_meet', 'whatsapp', 'phone', 'offline', null], default: null },
  meetingLink:           { type: String, default: null },
  customerNote:          { type: String, default: null },
  consultationAdminNote: { type: String, default: null },
  scheduledBy:           { type: String, default: null },
  scheduledAt:           { type: Date,   default: null },
  rescheduledCount:      { type: Number, default: 0 },

  notes: { type: String },
  whatsappSent: { type: Boolean, default: false },

  // NEW — Phase D
  userId: { type: String, default: null, index: true },
}, { timestamps: true });

// NEW — Phase E: performance indexes to keep the customer dashboard
// snappy even at production scale. Every query in account.controller.ts
// / booking.controller.ts already filters on one of these — the index
// is what turns those from collection scans into O(log n) lookups.
BookingSchema.index({ userId: 1, createdAt: -1 });      // /account/bookings list
BookingSchema.index({ paymentId: 1 });                   // Razorpay idempotency
BookingSchema.index({ razorpayOrderId: 1 });             // webhook lookup
BookingSchema.index({ bookingStatus: 1, createdAt: -1 }); // admin filter

BookingSchema.pre('save', function (next) {
  const doc = this as unknown as IBooking;
  const statusUntouched =
    !doc.isModified('paymentStatus') && !doc.isModified('bookingStatus');
  if (statusUntouched) {
    switch (doc.status) {
      case 'pending':
        doc.paymentStatus = 'pending';
        doc.bookingStatus = 'pending_payment';
        break;
      case 'paid':
        doc.paymentStatus = 'verified';
        doc.bookingStatus = 'confirmed';
        break;
      case 'called':
        doc.paymentStatus = 'verified';
        doc.bookingStatus = 'consultation_scheduled';
        break;
      case 'completed':
        doc.paymentStatus = 'verified';
        doc.bookingStatus = 'completed';
        break;
      case 'cancelled':
        doc.bookingStatus = 'cancelled';
        break;
    }
  }
  next();
});

export default mongoose.model<IBooking>('Booking', BookingSchema);
