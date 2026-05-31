import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  bookingId: string;
  name: string;
  phone: string;
  email?: string;
  service?: mongoose.Types.ObjectId;
  serviceName: string;
  amount: number;
  amountPaid: number;
  formData?: Record<string, any>;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  upiRef?: string;
  paymentMethod: 'razorpay' | 'upi' | 'cod' | 'manual' | 'unknown';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending';
  status: 'pending' | 'paid' | 'called' | 'completed' | 'cancelled';
  verifiedAt?: Date;
  notes?: string;
  whatsappSent: boolean;
  retryCount: number;
  transactionReference?: string;
  user?: mongoose.Types.ObjectId;
}

const BookingSchema = new Schema<IBooking>({
  bookingId:            { type: String, unique: true, required: true },
  name:                 { type: String, required: true },
  phone:                { type: String, required: true },
  email:                { type: String },
  service:              { type: Schema.Types.ObjectId, ref: 'Service' },
  serviceName:          { type: String, required: true },
  amount:               { type: Number, required: true },
  amountPaid:           { type: Number, default: 0 },
  formData:             { type: Schema.Types.Mixed },
  paymentId:            { type: String },
  razorpayOrderId:      { type: String },
  razorpaySignature:    { type: String },
  upiRef:               { type: String },
  paymentMethod:        { type: String, enum: ['razorpay','upi','cod','manual','unknown'], default: 'unknown' },
  paymentStatus:        { type: String, enum: ['pending','paid','failed','refunded','cod_pending'], default: 'pending' },
  status:               { type: String, enum: ['pending','paid','called','completed','cancelled'], default: 'pending' },
  verifiedAt:           { type: Date },
  notes:                { type: String },
  whatsappSent:         { type: Boolean, default: false },
  retryCount:           { type: Number, default: 0 },
  transactionReference: { type: String },
  user:                 { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

BookingSchema.index({ bookingId: 1 });
BookingSchema.index({ phone: 1 });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ status: 1 });

export default mongoose.model<IBooking>('Booking', BookingSchema);
