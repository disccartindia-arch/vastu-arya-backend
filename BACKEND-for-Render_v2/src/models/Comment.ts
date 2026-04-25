/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  post: mongoose.Types.ObjectId;
  name: string;
  text: string;
  parentId?: mongoose.Types.ObjectId;
  likes: number;
  isApproved: boolean;
  sessionId?: string;
}

const CommentSchema = new Schema<IComment>({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  name: { type: String, required: true, maxlength: 60 },
  text: { type: String, required: true, maxlength: 500 },
  parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  likes: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: true },
  sessionId: { type: String },
}, { timestamps: true });

CommentSchema.index({ post: 1, createdAt: 1 });
CommentSchema.index({ parentId: 1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
