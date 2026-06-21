/**
 * src/models/Booking.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 9 — Phase C Part 1):
 * two new enum values added to the existing two-axis status fields
 * introduced in Phase B — 'refunded' on paymentStatus, 'in_progress'
 * on bookingStatus. Per the approved Phase C audit (Blocker 2), no
 * existing enum value is renamed or removed: payment.controller.ts and
 * upiPayment.controller.ts both already write 'verified'/'confirmed'
 * etc. in production, and renaming those would be a breaking change to
 * already-live code for a purely cosmetic match to Phase C's brief
 * vocabulary (which is instead handled at the UI display-label layer,
 * not the stored-value layer).
 *
 * The pre-save derivation hook (Phase B) is unchanged — it still only
 * ever derives the ORIGINAL five `status` values into the original
 * paymentStatus/bookingStatus values; it never derives into 'refunded'
 * or 'in_progress', since those are exclusively admin-driven
 * transitions with no equivalent in the legacy single-axis `status`
 * field. This is intentional: the hook's job is backward-compatible
 * inference for documents that predate the two-axis model, not
 * forward-looking guesses about new states it can't actually observe
 * from the old field.
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
  paymentMethod?: 'razorpay' | 'upi_manual';

  // EXISTING — untouched, remains the single source of truth for every
  // pre-Phase-B read/write path in this codebase.
  status: string;

  // Phase B — now with two new additive values each (see file header).
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;

  notes?: string;
  whatsappSent: boolean;

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
  paymentMethod: { type: String, enum: ['razorpay', 'upi_manual'], default: 'razorpay' },
  status: { type: String, enum: ['pending','paid','called','completed','cancelled'], default: 'pending' },

  paymentStatus: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'rejected', 'refunded'], // 'refunded' NEW this round
    default: 'pending',
  },
  bookingStatus: {
    type: String,
    enum: ['pending_payment', 'payment_submitted', 'confirmed', 'consultation_scheduled', 'in_progress', 'completed', 'cancelled'], // 'in_progress' NEW this round
    default: 'pending_payment',
  },

  notes: { type: String },
  whatsappSent: { type: Boolean, default: false },
}, { timestamps: true });

/**
 * UNCHANGED from Phase B — see that round's notes for full rationale.
 * Still only fires when paymentStatus/bookingStatus weren't explicitly
 * set on this save, and still only ever derives the original five
 * legacy `status` values — never 'refunded' or 'in_progress', which
 * have no legacy equivalent and are only ever set explicitly by the
 * new updateBookingStatus() logic (Phase C Part 1).
 */
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
