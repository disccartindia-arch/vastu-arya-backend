import mongoose, { Document, Schema } from 'mongoose';

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
  // NEW — additive, defaults to 'razorpay' so every existing document is
  // unaffected. Lets the admin dashboard / reports distinguish Razorpay
  // payments from UPI-fallback (manually verified) payments without
  // inventing fields that didn't exist on this schema before.
  paymentMethod?: 'razorpay' | 'upi_manual';
  status: string;
  notes?: string;
  whatsappSent: boolean;
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
  notes: { type: String },
  whatsappSent: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IBooking>('Booking', BookingSchema);
