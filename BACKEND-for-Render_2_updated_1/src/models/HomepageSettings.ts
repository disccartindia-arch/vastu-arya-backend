/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';

export interface ITrustBadge {
  label: string;
  order: number;
}

export interface IHomepageStat {
  value: string;
  label: string;
  order: number;
}

export interface IHomepageSettings extends Document {
  contactNumber: string;
  heroHeading: string;
  heroSubheading: string;
  cta1Text: string;
  cta1Link: string;
  cta2Text: string;
  cta2Link: string;
  trustBadges: ITrustBadge[];
  stats: IHomepageStat[];
}

const TrustBadgeSchema = new Schema<ITrustBadge>({
  label: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const HomepageStatSchema = new Schema<IHomepageStat>({
  value: { type: String, required: true },
  label: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const HomepageSettingsSchema = new Schema<IHomepageSettings>({
  contactNumber: { type: String, default: '+91-9999999999' },
  heroHeading: { type: String, default: 'Transform Your Space, Transform Your Life' },
  heroSubheading: { type: String, default: "India's Premier Vastu Shastra & Astrology Platform by Dr. PPS" },
  cta1Text: { type: String, default: 'Book Appointment @ ₹11' },
  cta1Link: { type: String, default: '/book-appointment' },
  cta2Text: { type: String, default: 'Explore Vastu Store' },
  cta2Link: { type: String, default: '/vastu-store' },
  trustBadges: {
    type: [TrustBadgeSchema],
    default: [
      { label: 'IVAF Awarded', order: 0 },
      { label: '10,000+ Consultations', order: 1 },
      { label: 'New Delhi Recognized', order: 2 },
    ],
  },
  stats: {
    type: [HomepageStatSchema],
    default: [
      { value: '10,000+', label: 'Happy Clients', order: 0 },
      { value: '15+', label: 'Years Experience', order: 1 },
      { value: '100+', label: 'Services', order: 2 },
      { value: '50+', label: 'Cities Served', order: 3 },
    ],
  },
}, { timestamps: true });

export default mongoose.model<IHomepageSettings>('HomepageSettings', HomepageSettingsSchema);
