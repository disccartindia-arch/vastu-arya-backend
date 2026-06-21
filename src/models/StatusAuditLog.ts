/**
 * src/models/StatusAuditLog.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 9 — Phase C Part 1, Feature 1 (Booking Status
 * Engine).
 *
 * Append-only audit trail for Booking status transitions — one document
 * per field change (paymentStatus OR bookingStatus), never updated,
 * never deleted. This is a sibling to Phase A's PaymentAuditLog, not a
 * reuse of it: PaymentAuditLog's `action` field is a fixed enum
 * describing payment-submission lifecycle events (SUBMITTED/VERIFIED/
 * REJECTED); this model instead captures arbitrary before/after value
 * pairs on a named Booking field, which is a different shape entirely.
 *
 * `adminNotes` (added per your Phase C revision) is optional, free-text,
 * and ADMIN-ONLY. The public status endpoint
 * (publicStatus.controller.ts) explicitly never selects this field —
 * not just omits it from the response shape, but never pulls it out of
 * MongoDB in the first place for that query path. Grep this codebase
 * for `adminNotes` before changing the public controller's `.select()`
 * projection if extending it later — that's the one place this field
 * must never leak.
 */
import mongoose, { Document, Schema } from 'mongoose';

export type StatusAuditField = 'paymentStatus' | 'bookingStatus';

export interface IStatusAuditLog extends Document {
  bookingId: string;       // Booking._id
  bookingRef: string;      // Booking.bookingId — denormalized for fast display
  field: StatusAuditField;
  previousValue: string;
  newValue: string;
  adminUser: string;       // from req.user — never client-supplied
  adminNotes?: string | null; // ADMIN-ONLY — never exposed publicly
  createdAt: Date;
}

const StatusAuditLogSchema = new Schema<IStatusAuditLog>(
  {
    bookingId:     { type: String, required: true, index: true },
    bookingRef:    { type: String, required: true, index: true },
    field:         { type: String, enum: ['paymentStatus', 'bookingStatus'], required: true },
    previousValue: { type: String, required: true },
    newValue:      { type: String, required: true },
    adminUser:     { type: String, required: true },
    adminNotes:    { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // append-only
    collection: 'status_audit_logs',
  }
);

StatusAuditLogSchema.index({ bookingId: 1, createdAt: 1 });

const StatusAuditLog =
  mongoose.models.StatusAuditLog ??
  mongoose.model<IStatusAuditLog>('StatusAuditLog', StatusAuditLogSchema);

export default StatusAuditLog;
