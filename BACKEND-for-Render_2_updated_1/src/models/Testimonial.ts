/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';

export interface ITestimonial extends Document {
  name: string;
  city: string;
  service: string;
  text: string;
  rating: number;
  avatar?: string;
  order: number;
  isActive: boolean;
}

const TestimonialSchema = new Schema<ITestimonial>({
  name: { type: String, required: true },
  city: { type: String, default: '' },
  service: { type: String, default: '' },
  text: { type: String, required: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  avatar: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);
