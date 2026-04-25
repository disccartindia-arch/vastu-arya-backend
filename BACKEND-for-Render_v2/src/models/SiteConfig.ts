/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteConfig extends Document {
  key: string;
  value: any;
  category: string;
  label: string;
}

const SiteConfigSchema = new Schema<ISiteConfig>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  category: { type: String, default: 'general' },
  label: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);
