/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';
export interface ISiteSettings extends Document { siteName: string; tagline: { en: string; hi: string }; logo?: string; phone: string; whatsappNumber: string; email: string; address: string; socialLinks: { instagram?: string; facebook?: string; youtube?: string; twitter?: string }; razorpayKeyId?: string; seo: { defaultTitle: string; defaultDescription: string; ogImage?: string }; enableHindi: boolean; maintenanceMode: boolean; }
const SiteSettingsSchema = new Schema<ISiteSettings>({
  siteName: { type: String, default: 'Vastu Arya' },
  tagline: { en: { type: String, default: 'Transform Your Space, Transform Your Life' }, hi: { type: String, default: 'अपना जीवन बदलें' } },
  logo: { type: String }, phone: { type: String, default: '+91-9999999999' },
  whatsappNumber: { type: String, default: '919999999999' },
  email: { type: String, default: 'contact@vastuarya.com' },
  address: { type: String, default: 'New Delhi, India' },
  socialLinks: { instagram: { type: String, default: '' }, facebook: { type: String, default: '' }, youtube: { type: String, default: '' }, twitter: { type: String, default: '' } },
  razorpayKeyId: { type: String },
  seo: { defaultTitle: { type: String, default: 'Vastu Arya - Premium Vastu & Astrology' }, defaultDescription: { type: String, default: "India's premier Vastu platform by Dr. PPS" }, ogImage: { type: String } },
  enableHindi: { type: Boolean, default: true }, maintenanceMode: { type: Boolean, default: false }
}, { timestamps: true });
export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
