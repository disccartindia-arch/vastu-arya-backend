import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteSettings extends Document {
  siteName: string;
  tagline: { en: string; hi: string };
  logo?: string;
  favicon?: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  socialLinks: { instagram?: string; facebook?: string; youtube?: string; twitter?: string };
  razorpayKeyId?: string;
  seo: { defaultTitle: string; defaultDescription: string; ogImage?: string };
  enableHindi: boolean;
  maintenanceMode: boolean;
  smtpConfig?: { host: string; port: number; user: string; pass: string };
}

const SiteSettingsSchema = new Schema<ISiteSettings>({
  siteName: { type: String, default: 'Vastu Arya' },
  tagline: { en: { type: String, default: 'Transform Your Space, Transform Your Life' }, hi: { type: String, default: 'अपना जीवन बदलें, अपना वास्तु बदलें' } },
  logo: { type: String },
  favicon: { type: String },
  phone: { type: String, default: '+91-XXXXXXXXXX' },
  whatsappNumber: { type: String, default: '91XXXXXXXXXX' },
  email: { type: String, default: 'contact@vastuarya.com' },
  address: { type: String, default: 'New Delhi, India' },
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    youtube: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  razorpayKeyId: { type: String },
  seo: {
    defaultTitle: { type: String, default: 'Vastu Arya - Premium Vastu & Astrology Consultancy' },
    defaultDescription: { type: String, default: 'India\'s premier Vastu Shastra, Astrology, Numerology and Gemology consultation platform by Dr. PPS Tomar - IVAF Certified Expert.' },
    ogImage: { type: String }
  },
  enableHindi: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  smtpConfig: { host: String, port: Number, user: String, pass: String }
}, { timestamps: true });

export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
