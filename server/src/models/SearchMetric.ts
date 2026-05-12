import mongoose, { Document, Schema } from 'mongoose';

export interface ISearchMetric extends Document {
  term: string;
  category?: string;
  resultsCount: number;
  location?: string;
  timestamp: Date;
  metadata?: any;
}

const SearchMetricSchema = new Schema<ISearchMetric>(
  {
    term: { type: String, lowercase: true, trim: true, index: true },
    category: { type: String, index: true },
    resultsCount: { type: Number, required: true },
    location: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

SearchMetricSchema.index({ createdAt: -1 });

export const SearchMetric = mongoose.model<ISearchMetric>('SearchMetric', SearchMetricSchema);
