/**
 * src/models/Lead.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 4 — Task 1 (Lead Capture Before Payment).
 *
 * A Lead is created the moment a customer submits the pre-payment form,
 * BEFORE any Razorpay order is created or any UPI flow is opened. This
 * is deliberately a separate collection from Booking/Order — a Lead can
 * exist with no corresponding Booking/Order at all (customer abandoned
 * before paying), which is the entire point: the admin panel needs to
 * see and contact people who never completed payment, and Booking/Order
 * documents are only ever created on/after a real payment event (Razorpay
 * verified, or UPI submitted-pending-review) per the existing, unmodified
 * payment architecture — see PAYMENT_FLOW_DIAGRAM.md from Round 2.
 *
 * Status lifecycle:
 *   PENDING_PAYMENT  — form submitted, payment UI now shown, no payment yet
 *   PAID             — linked Booking confirmed PAID (Razorpay verified or
 *                       UPI admin-approved)
 *   FAILED           — Razorpay attempt failed / was abandoned mid-payment
 *   CANCELLED        — customer explicitly closed the payment modal without
 *                       paying (best-effort detection — see leadGate.ts hook)
 *
 * This model does NOT replace or modify Booking/Order/UpiPayment in any
 * way. It is purely additive — a new collection, a new set of endpoints,
 * referenced loosely by serviceId/bookingId/orderId once payment occurs,
 * with no foreign-key enforcement (consistent with how Booking/Order
 * already reference each other loosely elsewhere in this codebase).
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  name: string;
  phone: string;
  city: string;
  state: string;
  email?: string;
  message?: string;

  serviceName: string;
  serviceId?: string;
  price: number;
  sourcePage: string;

  status: 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED';

  // Populated once a payment attempt resolves, so admin can cross-reference
  // without this model needing to know anything about Razorpay/UPI internals.
  bookingId?: string | null;
  paymentMethod?: 'razorpay' | 'upi_manual' | null;

  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name:  { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city:  { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    email:   { type: String, trim: true },
    message: { type: String, trim: true },

    serviceName: { type: String, required: true },
    serviceId:   { type: String, default: null },
    price:       { type: Number, required: true },
    sourcePage:  { type: String, required: true },

    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING_PAYMENT',
      index: true,
    },

    bookingId:     { type: String, default: null },
    paymentMethod: { type: String, enum: ['razorpay', 'upi_manual', null], default: null },
  },
  { timestamps: true, collection: 'leads' }
);

LeadSchema.index({ status: 1, createdAt: -1 });
LeadSchema.index({ phone: 1 });
LeadSchema.index({ name: 'text', phone: 'text', city: 'text' });

const Lead = mongoose.models.Lead ?? mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
