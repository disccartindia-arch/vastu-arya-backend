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
  status: { type: String, enum: ['pending','paid','called','completed','cancelled'], default: 'pending' },
  notes: { type: String },
  whatsappSent: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IBooking>('Booking', BookingSchema);
