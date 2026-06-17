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
  // FIXED (June 2026 UPI forensic trace): the previous defaults —
  // 'VASTUARYA@ybl' (wrong casing) and 'ARYAVAR@ybl' (typo, missing letters)
  // — are both invalid VPAs. These are the verified, working accounts:
  //   primary  -> aryavartguna@ybl  (SBI, account ending 3356)
  //   fallback -> vastuarya@ybl     (IDBI, account ending 9553)
  // Note: this only fixes the UPI ID used by this app's own UPI-fallback
  // flow. The separate "Invalid UPI ID" error seen inside Razorpay's own
  // checkout/QR is controlled by the VPA registered in the Razorpay
  // merchant dashboard (Settings → Bank Accounts), not by this file —
  // that still needs to be corrected directly on dashboard.razorpay.com.
  primaryUPI:      { type: String, default: 'aryavartguna@ybl' },
  fallbackUPI:     { type: String, default: 'vastuarya@ybl' },
  payeeName:       { type: String, default: 'Vastu Arya' },
  upiEnabled:      { type: Boolean, default: true },
  fallbackEnabled: { type: Boolean, default: true },
  razorpayEnabled: { type: Boolean, default: true },
  codEnabled:      { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IPaymentSettings>('PaymentSettings', PaymentSettingsSchema);
