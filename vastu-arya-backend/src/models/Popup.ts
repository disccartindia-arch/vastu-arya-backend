import mongoose, { Document, Schema } from 'mongoose';

export interface IPopup extends Document {
  title: string;
  content: string;
  image?: string;
  ctaText: string;
  ctaLink: string;
  delay: number;
  showOnPages: string[];
  isActive: boolean;
  type: 'appointment' | 'offer' | 'general';
}

const PopupSchema = new Schema<IPopup>({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  image: { type: String },
  ctaText: { type: String, default: 'Book Now' },
  ctaLink: { type: String, default: '/book-appointment' },
  delay: { type: Number, default: 3 },
  showOnPages: [{ type: String }],
  isActive: { type: Boolean, default: true },
  type: { type: String, enum: ['appointment', 'offer', 'general'], default: 'general' },
}, { timestamps: true });

export default mongoose.model<IPopup>('Popup', PopupSchema);
