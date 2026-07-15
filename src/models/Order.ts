import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  user?: mongoose.Types.ObjectId;
  customerInfo: { name: string; email: string; phone: string; address: string; city: string; pincode: string };
  items: { product?: mongoose.Types.ObjectId; name: string; price: number; qty: number; image: string }[];
  totalAmount: number;
  status: string;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  // NEW — additive, defaults to 'razorpay'. See Booking.ts for rationale.
  paymentMethod?: 'razorpay' | 'upi_manual';
  type: 'product' | 'service' | 'booking';
  notes?: string;
}

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, unique: true, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, default: 1 },
    image: { type: String, default: '' }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending','paid','processing','shipped','delivered','cancelled'], default: 'pending' },
  paymentId: { type: String },
  razorpayOrderId: { type: String },
  razorpaySignature: { type: String },
  paymentMethod: { type: String, enum: ['razorpay', 'upi_manual'], default: 'razorpay' },
  type: { type: String, enum: ['product', 'service', 'booking'], default: 'product' },
  notes: { type: String },
}, { timestamps: true });

// NEW — Phase E: performance indexes matching account.controller.ts's
// query patterns.
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ paymentId: 1 });
OrderSchema.index({ razorpayOrderId: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
