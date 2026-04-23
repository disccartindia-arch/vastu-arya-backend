/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: { en: string; hi: string }; slug: string; category: string;
  description: { en: string; hi: string }; benefits: string[];
  price: number; offerPrice: number; images: string[]; stock: number; sku?: string;
  isFeatured: boolean; isNewLaunch: boolean; isActive: boolean;
  totalSold: number; rating: number; reviewCount: number;
}

const ProductSchema = new Schema<IProduct>({
  name: { en: { type: String, required: true }, hi: { type: String, default: '' } },
  slug: { type: String, unique: true, required: true },
  category: { type: String, required: true },
  description: { en: { type: String, default: '' }, hi: { type: String, default: '' } },
  benefits: [{ type: String }], price: { type: Number, required: true },
  offerPrice: { type: Number, required: true }, images: [{ type: String }],
  stock: { type: Number, default: 0 }, sku: { type: String },
  isFeatured: { type: Boolean, default: false }, isNewLaunch: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }, totalSold: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }, reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
