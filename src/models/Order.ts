import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  user?: mongoose.Types.ObjectId;
  customerInfo: { name: string; email: string; phone: string; address: string; city: string; pincode: string };
  items: { product?: mongoose.Types.ObjectId; name: string; price: number; qty: number; image: string }[];
  totalAmount: number;
  amountPaid: number;
  status: 'pending' | 'awaiting_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending';
  paymentMethod: 'razorpay' | 'upi' | 'cod' | 'manual' | 'unknown';
  paymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  upiRef?: string;
  transactionReference?: string;
  verifiedAt?: Date;
  retryCount: number;
  notes?: string;
  type: 'product' | 'service' | 'booking';
}

const OrderSchema = new Schema<IOrder>({
  orderId:              { type: String, unique: true, required: true },
  user:                 { type: Schema.Types.ObjectId, ref: 'User' },
  customerInfo: {
    name:    { type: String, required: true },
    email:   { type: String, required: true },
    phone:   { type: String, required: true },
    address: { type: String, default: '' },
    city:    { type: String, default: '' },
    pincode: { type: String, default: '' },
  },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    name:    { type: String, required: true },
    price:   { type: Number, required: true },
    qty:     { type: Number, required: true, default: 1 },
    image:   { type: String, default: '' },
  }],
  totalAmount:          { type: Number, required: true },
  amountPaid:           { type: Number, default: 0 },
  status:               { type: String, enum: ['pending','awaiting_payment','paid','processing','shipped','delivered','cancelled','failed'], default: 'awaiting_payment' },
  paymentStatus:        { type: String, enum: ['pending','paid','failed','refunded','cod_pending'], default: 'pending' },
  paymentMethod:        { type: String, enum: ['razorpay','upi','cod','manual','unknown'], default: 'unknown' },
  paymentId:            { type: String },
  razorpayOrderId:      { type: String },
  razorpaySignature:    { type: String },
  upiRef:               { type: String },
  transactionReference: { type: String },
  verifiedAt:           { type: Date },
  retryCount:           { type: Number, default: 0 },
  notes:                { type: String },
  type:                 { type: String, enum: ['product','service','booking'], default: 'product' },
}, { timestamps: true });

OrderSchema.index({ orderId: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ 'customerInfo.phone': 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
