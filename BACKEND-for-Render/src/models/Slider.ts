/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';
export interface ISlider extends Document { title: string; subtitle: string; image: string; ctaText: string; ctaLink: string; isActive: boolean; sortOrder: number; }
const SliderSchema = new Schema<ISlider>({ title: { type: String, required: true }, subtitle: { type: String, default: '' }, image: { type: String, required: true }, ctaText: { type: String, default: 'Book Now' }, ctaLink: { type: String, default: '/book-appointment' }, isActive: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 } }, { timestamps: true });
export default mongoose.model<ISlider>('Slider', SliderSchema);
