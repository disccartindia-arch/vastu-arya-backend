import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  title: { en: string; hi: string };
  slug: string;
  category: string;
  description: { en: string; hi: string };
  shortDesc: { en: string; hi: string };
  originalPrice: number;
  offerPrice: number;
  icon: string;
  image?: string;
  features: { en: string; hi: string }[];
  formFields: string[];
  redirectType: 'razorpay' | 'whatsapp' | 'form';
  whatsappMessage?: string;
  isActive: boolean;
  showOnHome: boolean;
  sortOrder: number;
  seo: { title: string; description: string; keywords: string };
  totalBookings: number;
}

const ServiceSchema = new Schema<IService>({
  title: { en: { type: String, required: true }, hi: { type: String, default: '' } },
  slug: { type: String, unique: true, required: true },
  category: { type: String, default: 'general' },
  description: { en: { type: String, default: '' }, hi: { type: String, default: '' } },
  shortDesc: { en: { type: String, default: '' }, hi: { type: String, default: '' } },
  originalPrice: { type: Number, required: true, default: 0 },
  offerPrice: { type: Number, required: true, default: 0 },
  icon: { type: String, default: '🕉️' },
  image: { type: String },
  features: [{ en: { type: String }, hi: { type: String } }],
  formFields: [{ type: String }],
  redirectType: { type: String, enum: ['razorpay', 'whatsapp', 'form'], default: 'razorpay' },
  whatsappMessage: { type: String },
  isActive: { type: Boolean, default: true },
  showOnHome: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  seo: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    keywords: { type: String, default: '' }
  },
  totalBookings: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IService>('Service', ServiceSchema);
