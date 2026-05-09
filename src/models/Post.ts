/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  type: 'image' | 'video' | 'text' | 'tip' | 'transformation';
  caption: string;
  hashtags: string[];
  location?: string;
  media: { url: string; type: 'image' | 'video'; thumbnail?: string }[];
  likes: number;
  likedBy: string[]; // session IDs or user IDs
  commentCount: number;
  isFeatured: boolean;
  isPublished: boolean;
  author: string;
  category: string;
  sortOrder: number;
}

const PostSchema = new Schema<IPost>({
  type: { type: String, enum: ['image','video','text','tip','transformation'], default: 'image' },
  caption: { type: String, required: true },
  hashtags: [{ type: String }],
  location: { type: String },
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image','video'], default: 'image' },
    thumbnail: { type: String },
  }],
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  commentCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  author: { type: String, default: 'Dr. PPS Tomar' },
  category: { type: String, default: 'vastu-tip' },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

PostSchema.index({ isPublished: 1, createdAt: -1 });
PostSchema.index({ category: 1 });
PostSchema.index({ hashtags: 1 });

export default mongoose.model<IPost>('Post', PostSchema);
