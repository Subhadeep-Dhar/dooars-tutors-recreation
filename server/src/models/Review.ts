import mongoose, { Document, Schema } from 'mongoose';

export interface IReviewDocument extends Document {
  profileId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  rating: number;
  text: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One review per student per profile
ReviewSchema.index({ profileId: 1, reviewerId: 1 }, { unique: true });
ReviewSchema.index({ profileId: 1, isVisible: 1 });

export const Review = mongoose.model<IReviewDocument>('Review', ReviewSchema);