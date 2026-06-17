/**
 * UpiPayment.ts
 *
 * NEW — adapted from the standalone models/UpiPayment.ts that was uploaded
 * alongside CHANGELOG.md/INSTALLATION.md. The model itself was already
 * framework-agnostic and didn't need the lib/mongodb fix that its
 * controller needed; this version just aligns its style with the rest of
 * this codebase's models and adds an `orderId` field (the original only had
 * `bookingId`, which left product/order-type UPI payments with nowhere to
 * record which Order they belong to).
 *
 * Status lifecycle: UPI_PENDING -> PAID (or REJECTED). Only
 * upiPayment.controller.ts's verifyUpiPayment/rejectUpiPayment may change
 * `status` away from UPI_PENDING.
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IUpiPayment extends Document {
  referenceId: string;
  itemId?: string | null;
  itemType: 'service' | 'product' | 'consultation' | 'booking' | 'order';
  bookingId?: string | null;
  orderId?: string | null;
  amount: number;
  upiId: string;
  transactionId?: string | null;
  screenshotUrl: string;
  uploaderName: string;
  uploaderPhone: string;
  status: 'UPI_PENDING' | 'PAID' | 'REJECTED';
  submittedAt: Date;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  adminNotes?: string | null;
}

const UpiPaymentSchema = new Schema<IUpiPayment>({
  referenceId:    { type: String, required: true, unique: true, index: true },
  itemId:         { type: String, default: null },
  itemType:       { type: String, enum: ['service', 'product', 'consultation', 'booking', 'order'], required: true },
  bookingId:      { type: String, default: null },
  orderId:        { type: String, default: null },
  amount:         { type: Number, required: true, min: 1 },
  upiId:          { type: String, required: true },
  transactionId:  { type: String, default: null },
  screenshotUrl:  { type: String, required: true },
  uploaderName:   { type: String, required: true },
  uploaderPhone:  { type: String, required: true },
  status:         { type: String, enum: ['UPI_PENDING', 'PAID', 'REJECTED'], default: 'UPI_PENDING', index: true },
  submittedAt:    { type: Date, default: Date.now },
  verifiedAt:     { type: Date, default: null },
  verifiedBy:     { type: String, default: null },
  adminNotes:     { type: String, default: null },
}, { timestamps: true, collection: 'upi_payments' });

UpiPaymentSchema.index({ status: 1, submittedAt: -1 });
UpiPaymentSchema.index({ uploaderPhone: 1 });

export default mongoose.model<IUpiPayment>('UpiPayment', UpiPaymentSchema);
