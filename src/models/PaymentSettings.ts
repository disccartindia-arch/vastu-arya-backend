import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentSettings extends Document {
  primaryUPI: string;
  fallbackUPI: string;
  payeeName: string;
  upiEnabled: boolean;
  fallbackEnabled: boolean;
  razorpayEnabled: boolean;
  codEnabled: boolean;
}

const PaymentSettingsSchema = new Schema<IPaymentSettings>({
  primaryUPI:      { type: String, default: 'VASTUARYA@ybl' },
  fallbackUPI:     { type: String, default: 'ARYAVAR@ybl' },
  payeeName:       { type: String, default: 'Vastu Arya' },
  upiEnabled:      { type: Boolean, default: true },
  fallbackEnabled: { type: Boolean, default: true },
  razorpayEnabled: { type: Boolean, default: true },
  codEnabled:      { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IPaymentSettings>('PaymentSettings', PaymentSettingsSchema);
