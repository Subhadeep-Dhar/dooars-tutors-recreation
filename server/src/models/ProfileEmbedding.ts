import mongoose, { Document, Schema } from 'mongoose';
import { ProfileType, GenderType, BoardType, ServiceModeType } from '@dooars/shared';

export interface IProfileEmbeddingDocument {
  profileId: mongoose.Types.ObjectId;
  embedding: number[];
  contentHash: string;
  schemaVersion: number;
  model: string;
  dimensions: number;
  generatedAt: Date;

  // Denormalized fields for Vector Search Pre-Filtering
  type: ProfileType;
  providerKind?: 'individual' | 'organisation' | 'unknown';
  isActive: boolean;
  verificationStatus: string;
  gender?: GenderType;
  subjects?: string[];
  activities?: string[];
  classes?: string[];
  boards?: BoardType[];
  languages?: string[];
  serviceModes?: ServiceModeType[];
  minFee?: number;
  maxFee?: number;
  experience?: number;
  ratingAverage?: number;
}

const ProfileEmbeddingSchema = new Schema<IProfileEmbeddingDocument>({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  embedding: { type: [Number], required: true },
  contentHash: { type: String, required: true, index: true },
  schemaVersion: { type: Number, required: true },
  model: { type: String, required: true },
  dimensions: { type: Number, required: true },
  generatedAt: { type: Date, required: true, default: Date.now },
  type: { type: String, required: true },
  providerKind: { type: String, enum: ['individual', 'organisation', 'unknown'] },
  isActive: { type: Boolean, required: true },
  verificationStatus: { type: String, required: true },
  gender: { type: String },
  subjects: { type: [String], default: undefined },
  activities: { type: [String], default: undefined },
  classes: { type: [String], default: undefined },
  boards: { type: [String], default: undefined },
  languages: { type: [String], default: undefined },
  serviceModes: { type: [String], default: undefined },
  minFee: { type: Number },
  maxFee: { type: Number },
  experience: { type: Number },
  ratingAverage: { type: Number },
}, { timestamps: true });

export const ProfileEmbedding = mongoose.model<IProfileEmbeddingDocument>('ProfileEmbedding', ProfileEmbeddingSchema);
