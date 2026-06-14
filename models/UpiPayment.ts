/**
 * models/UpiPayment.ts (Backend)
 * ─────────────────────────────────────────────────────────────────
 * Mongoose model for UPI payment submissions.
 * Status lifecycle: UPI_PENDING → PAID (or REJECTED)
 * Admin must verify screenshot before marking PAID.
 * ─────────────────────────────────────────────────────────────────
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUpiPayment extends Document {
  referenceId: string;          // Human-readable: UPI-ABC123-XYZ
  itemId: string;               // Service/product/booking ID
  itemType: "service" | "product" | "consultation" | "booking" | "order";
  bookingId?: string | null;    // Linked booking if applicable
  amount: number;               // ₹ amount
  upiId: string;                // Which UPI ID was used (aryavartguna@ybl etc.)
  transactionId?: string | null; // UPI transaction ID from user
  screenshotUrl: string;        // Path to stored screenshot
  uploaderName: string;
  uploaderPhone: string;
  status: "UPI_PENDING" | "PAID" | "REJECTED";
  submittedAt: Date;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;   // Admin user ID/name who verified
  adminNotes?: string | null;
}

const UpiPaymentSchema = new Schema<IUpiPayment>(
  {
    referenceId: { type: String, required: true, unique: true, index: true },
    itemId: { type: String, required: true, index: true },
    itemType: {
      type: String,
      enum: ["service", "product", "consultation", "booking", "order"],
      required: true,
    },
    bookingId: { type: String, default: null },
    amount: { type: Number, required: true, min: 1 },
    upiId: { type: String, required: true },
    transactionId: { type: String, default: null },
    screenshotUrl: { type: String, required: true },
    uploaderName: { type: String, required: true },
    uploaderPhone: { type: String, required: true },
    status: {
      type: String,
      enum: ["UPI_PENDING", "PAID", "REJECTED"],
      default: "UPI_PENDING",
      index: true,
    },
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: String, default: null },
    adminNotes: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "upi_payments",
  }
);

// Compound index for admin panel queries
UpiPaymentSchema.index({ status: 1, submittedAt: -1 });
UpiPaymentSchema.index({ uploaderPhone: 1 });

const UpiPayment: Model<IUpiPayment> =
  mongoose.models.UpiPayment ??
  mongoose.model<IUpiPayment>("UpiPayment", UpiPaymentSchema);

export default UpiPayment;
