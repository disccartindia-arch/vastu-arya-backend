import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  product?: mongoose.Types.ObjectId;
  service?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  name: string;
  rating: number;
  comment: string;
  isApproved: boolean;
}

const ReviewSchema = new Schema<IReview>({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  service: { type: Schema.Types.ObjectId, ref: 'Service' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
