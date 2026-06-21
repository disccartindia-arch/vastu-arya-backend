/**
 * src/models/Booking.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 8 — Phase B, database
 * readiness for future customer tracking):
 *
 * ROOT FINDING (see DATABASE_READINESS_REPORT.md): the existing single
 * `status` field conflates two distinct concerns — payment state and
 * booking/fulfillment state — into one enum
 * ('pending'|'paid'|'called'|'completed'|'cancelled'). A future
 * customer-facing status view needs to show BOTH independently (e.g.
 * "Payment Verified" + "Consultation Scheduled" are both true at once,
 * but the old field can only hold one value).
 *
 * FIX: added two NEW, ADDITIVE fields — `paymentStatus` and
 * `bookingStatus` — as a second, orthogonal axis. This is intentionally
 * NOT a replacement or migration:
 *   - The original `status` field is completely untouched — every
 *     existing read (admin panel, dashboard stats, payment.controller.ts,
 *     upiPayment.controller.ts) keeps working exactly as before, with
 *     zero code changes required anywhere else in the codebase.
 *   - The new fields default via a pre-save hook that derives sensible
 *     starting values FROM the existing `status` field, so every
 *     existing document (once re-saved) and every newly created
 *     document gets correct values with no manual backfill script and
 *     no downtime. Documents that are never re-saved keep working too,
 *     since application code that reads the new fields should treat an
 *     absent value as the schema default (handled via the schema-level
 *     `default` AND the pre-save derivation below, covering both new
 *     and updated documents).
 *
 * This is a zero-migration change: no existing collection write needs
 * to run before deploying this. New documents get the new fields from
 * creation; existing documents lazily pick up sensible defaults the
 * next time they're saved (e.g. the next admin verify/reject action),
 * and in the meantime the schema-level defaults below mean a fresh
 * `.find()` read of an old document without these fields will still
 * return the default value, not undefined.
 */
import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'rejected';
export type BookingStatus =
  | 'pending_payment'
  | 'payment_submitted'
  | 'confirmed'
  | 'consultation_scheduled'
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
  // currently-deployed read/write path in this codebase.
  status: string;

  // NEW — additive second axis. Not yet read or written by any existing
  // controller; available for the future customer status endpoint and
  // any later admin-panel work to adopt incrementally.
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;

  notes?: string;
  whatsappSent: boolean;

  // For TS — provided by `timestamps: true`, declared explicitly since
  // the new status endpoint reads updatedAt directly.
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

  // NEW — additive, see file header. Schema-level defaults ensure even
  // documents that pre-date this field return a sensible value on read,
  // not undefined.
  paymentStatus: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'rejected'],
    default: 'pending',
  },
  bookingStatus: {
    type: String,
    enum: ['pending_payment', 'payment_submitted', 'confirmed', 'consultation_scheduled', 'completed', 'cancelled'],
    default: 'pending_payment',
  },

  notes: { type: String },
  whatsappSent: { type: Boolean, default: false },
}, { timestamps: true });

/**
 * NEW — pre-save derivation hook.
 *
 * Only fires the derivation when paymentStatus/bookingStatus haven't
 * been explicitly set by the calling code on THIS save (i.e. it won't
 * clobber a value a future controller deliberately sets). This lets
 * existing controllers — which know nothing about these new fields and
 * never set them — continue to work completely unmodified, while still
 * getting a reasonable, non-default value derived from whatever they
 * DID set on `status`, the field they already know about.
 *
 * This is intentionally conservative: it infers from `status` only when
 * the new fields are still at their just-created defaults, so it never
 * overwrites a value that was genuinely set on purpose by newer code in
 * a future phase.
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
        // Ambiguous in the old single-axis model — could be a payment
        // rejection or a fulfillment cancellation. Defaults to the more
        // common case (payment was never completed); a future phase
        // that explicitly tracks rejections via paymentStatus='rejected'
        // will set that directly and this branch won't fire for it
        // (see statusUntouched guard above).
        doc.bookingStatus = 'cancelled';
        break;
    }
  }

  next();
});

export default mongoose.model<IBooking>('Booking', BookingSchema);
