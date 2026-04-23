import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: { en: string; hi: string };
  slug: string;
  content: { en: string; hi: string };
  excerpt: { en: string; hi: string };
  coverImage?: string;
  category: string;
  tags: string[];
  author: string;
  isPublished: boolean;
  publishedAt?: Date;
  seo: { title: string; description: string };
  views: number;
}

const BlogSchema = new Schema<IBlog>({
  title: { en: { type: String, required: true }, hi: { type: String, default: '' } },
  slug: { type: String, unique: true, required: true },
  content: { en: { type: String, default: '' }, hi: { type: String, default: '' } },
  excerpt: { en: { type: String, default: '' }, hi: { type: String, default: '' } },
  coverImage: { type: String },
  category: { type: String, default: 'vastu' },
  tags: [{ type: String }],
  author: { type: String, default: 'Dr. PPS' },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  seo: { title: { type: String, default: '' }, description: { type: String, default: '' } },
  views: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IBlog>('Blog', BlogSchema);
