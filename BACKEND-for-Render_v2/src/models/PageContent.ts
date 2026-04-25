/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';

export interface IPageContent extends Document {
  page: string;
  section: string;
  key: string;
  value: string;
  type: 'text' | 'image' | 'color' | 'boolean' | 'number' | 'html';
  label: string;
  updatedAt: Date;
}

const PageContentSchema = new Schema<IPageContent>({
  page: { type: String, required: true },
  section: { type: String, required: true },
  key: { type: String, required: true },
  value: { type: String, default: '' },
  type: { type: String, enum: ['text', 'image', 'color', 'boolean', 'number', 'html'], default: 'text' },
  label: { type: String, default: '' },
}, { timestamps: true });

PageContentSchema.index({ page: 1, section: 1, key: 1 }, { unique: true });

export default mongoose.model<IPageContent>('PageContent', PageContentSchema);
