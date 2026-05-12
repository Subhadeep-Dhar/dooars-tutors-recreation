import mongoose, { Document, Schema } from 'mongoose';

export interface IImportSummaryDocument extends Document {
  batchId: string;
  startTime: Date;
  endTime?: Date;
  keywords: string[];
  stats: {
    totalScraped: number;
    imported: number;
    duplicatesSkipped: number;
    failed: number;
    partial: number;
  };
  config: {
    headless: boolean;
    maxListings: number;
    delayMs: [number, number];
  };
  errors: string[];
}

const ImportSummarySchema = new Schema<IImportSummaryDocument>(
  {
    batchId: { type: String, required: true, unique: true, index: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    keywords: [{ type: String }],
    stats: {
      totalScraped: { type: Number, default: 0 },
      imported: { type: Number, default: 0 },
      duplicatesSkipped: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      partial: { type: Number, default: 0 },
    },
    config: {
      headless: { type: Boolean },
      maxListings: { type: Number },
      delayMs: [{ type: Number }],
    },
    errors: [{ type: String }],
  },
  { timestamps: true }
);

export const ImportSummary = mongoose.model<IImportSummaryDocument>('ImportSummary', ImportSummarySchema);
