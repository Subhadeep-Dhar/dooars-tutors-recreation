import mongoose, { Document, Schema } from 'mongoose';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'permanent_failure';

export interface IEnrichmentJobDocument extends Document {
  profileId: mongoose.Types.ObjectId;
  importBatchId: string;
  status: JobStatus;
  priority: number;
  retries: number;
  maxRetries: number;
  nextRunAt: Date;
  errors: Array<{
    message: string;
    timestamp: Date;
    code?: string;
  }>;
  metadata: {
    websiteUrl?: string;
    hasReviews: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EnrichmentJobSchema = new Schema<IEnrichmentJobDocument>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    importBatchId: { type: String, required: true, index: true },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed', 'permanent_failure'],
      default: 'pending',
      index: true 
    },
    priority: { type: Number, default: 50 },
    retries: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    nextRunAt: { type: Date, default: Date.now, index: true },
    errors: [{
      message: { type: String },
      timestamp: { type: Date, default: Date.now },
      code: { type: String }
    }],
    metadata: {
      websiteUrl: { type: String },
      hasReviews: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

EnrichmentJobSchema.index({ status: 1, nextRunAt: 1, priority: -1 });

export const EnrichmentJob = mongoose.model<IEnrichmentJobDocument>('EnrichmentJob', EnrichmentJobSchema);
