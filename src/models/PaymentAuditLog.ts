/**
 * src/models/PaymentAuditLog.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 8 — Phase A, Item 6 (Audit Logging).
 *
 * WHY A SEPARATE COLLECTION INSTEAD OF EXTENDING UpiPayment:
 * UpiPayment.ts already has submittedAt/verifiedAt/verifiedBy/adminNotes
 * — a basic, single-state audit trail. But those are fields on the
 * payment record itself, meaning they only ever hold the LATEST action's
 * data. If a payment is ever reviewed more than once (e.g. rejected,
 * then the customer disputes and an admin re-verifies it after manual
 * confirmation), the existing schema has no way to show that history —
 * the first rejection's timestamp/admin would simply be overwritten.
 *
 * This is a genuine gap given the explicit ask for "audit logging" with
 * a defined list of event types — an append-only log, where every
 * action creates a NEW document and nothing is ever updated or deleted,
 * is the correct pattern for this requirement. It does not replace
 * UpiPayment's own status field (which remains the source of truth for
 * "what is this payment's CURRENT state" — unchanged, still read by
 * every existing query) — it is purely additive, recording the full
 * history alongside it.
 *
 * Each log entry captures exactly what Phase A Item 6 asked for:
 * action type, timestamp, and the admin user responsible (null for the
 * customer-initiated SUBMITTED action, since no admin is involved at
 * that point).
 */
import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction = 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export interface IPaymentAuditLog extends Document {
  paymentId: string;        // references UpiPayment._id (string, loose
                             // reference — consistent with how the rest
                             // of this codebase references across
                             // collections, e.g. Lead.bookingId)
  referenceId: string;      // denormalized for fast admin-UI display
                             // without a join/populate
  action: AuditAction;
  adminUser?: string | null; // null for SUBMITTED; name/email of the
                              // admin for VERIFIED/REJECTED
  adminNotes?: string | null;
  metadata?: Record<string, any>; // optional snapshot (amount, customer
                                   // name, etc.) at the time of the
                                   // action, for a self-contained audit
                                   // record even if the underlying
                                   // UpiPayment document is later
                                   // modified
  createdAt: Date; // the action's own timestamp — distinct from
                    // Mongoose's own timestamps which would describe
                    // when the LOG ROW was created (same value in
                    // practice, but createdAt is the semantically
                    // correct field name for "when did this happen")
}

const PaymentAuditLogSchema = new Schema<IPaymentAuditLog>(
  {
    paymentId:   { type: String, required: true, index: true },
    referenceId: { type: String, required: true, index: true },
    action: {
      type: String,
      enum: ['SUBMITTED', 'VERIFIED', 'REJECTED'],
      required: true,
    },
    adminUser:  { type: String, default: null },
    adminNotes: { type: String, default: null },
    metadata:   { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // append-only — no updatedAt needed, entries are never modified
    collection: 'payment_audit_logs',
  }
);

// Fast lookup of "every action for this payment, in order" — the
// primary admin-UI query pattern for a payment's history.
PaymentAuditLogSchema.index({ paymentId: 1, createdAt: 1 });

const PaymentAuditLog =
  mongoose.models.PaymentAuditLog ??
  mongoose.model<IPaymentAuditLog>('PaymentAuditLog', PaymentAuditLogSchema);

export default PaymentAuditLog;
