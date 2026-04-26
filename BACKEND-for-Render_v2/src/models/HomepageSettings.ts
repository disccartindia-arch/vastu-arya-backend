import mongoose, { Document, Schema } from 'mongoose';

export interface IHomepageSettings extends Document {
  contactNumber: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactWhatsapp: string;
  brandName: string;
  brandSubtitle: string;
  brandFontSize: string;
  heroHeading: string;
  heroSubheading: string;
  cta1Text: string;
  cta1Link: string;
  cta2Text: string;
  cta2Link: string;
  servicesButtonText: string;
  trustBadges: { label: string; order: number }[];
  stats: { value: string; label: string; order: number }[];
  themeSettings: Record<string, any>;
}

const HomepageSettingsSchema = new Schema<IHomepageSettings>({
  contactNumber:      { type: String, default: '+91-9999999999' },
  contactPhone:       { type: String, default: '+91-9999999999' },
  contactEmail:       { type: String, default: 'contact@vastuarya.com' },
  contactAddress:     { type: String, default: 'New Delhi, India' },
  contactWhatsapp:    { type: String, default: '919999999999' },
  brandName:          { type: String, default: 'Vastu Arya' },
  brandSubtitle:      { type: String, default: 'IVAF Certified' },
  brandFontSize:      { type: String, default: '18' },
  heroHeading:        { type: String, default: 'Transform Your Space, Transform Your Life' },
  heroSubheading:     { type: String, default: "India's Premier Vastu Shastra & Astrology Platform by Dr. PPS Tomar" },
  cta1Text:           { type: String, default: 'Book Appointment @ ₹11' },
  cta1Link:           { type: String, default: '/book-appointment' },
  cta2Text:           { type: String, default: 'Explore Vastu Store' },
  cta2Link:           { type: String, default: '/vastu-store' },
  servicesButtonText: { type: String, default: 'View All 100+ Services' },
  trustBadges: [{
    label: { type: String },
    order: { type: Number, default: 0 },
  }],
  stats: [{
    value: { type: String },
    label: { type: String },
    order: { type: Number, default: 0 },
  }],
  themeSettings: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model<IHomepageSettings>('HomepageSettings', HomepageSettingsSchema);
