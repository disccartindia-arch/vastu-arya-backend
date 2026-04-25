/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';

export interface ISearchLog extends Document {
  query: string;
  results: number;
  clickedSlug?: string;
  clickedType?: string;
  sessionId?: string;
}

const SearchLogSchema = new Schema<ISearchLog>({
  query: { type: String, required: true, lowercase: true, trim: true },
  results: { type: Number, default: 0 },
  clickedSlug: { type: String },
  clickedType: { type: String },
  sessionId: { type: String },
}, { timestamps: true });

SearchLogSchema.index({ query: 1 });
SearchLogSchema.index({ createdAt: -1 });

export default mongoose.model<ISearchLog>('SearchLog', SearchLogSchema);
