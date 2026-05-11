import mongoose, { Document, Schema } from 'mongoose';

export interface IRawPlaceDocument extends Document {
  source: string;
  keyword: string;
  rawData: any;
  importedAt: Date;
  processed: boolean;
  processingErrors?: string[];
}

const RawPlaceSchema = new Schema<IRawPlaceDocument>(
  {
    source: { type: String, required: true },
    keyword: { type: String, required: true },
    rawData: { type: Schema.Types.Mixed, required: true },
    importedAt: { type: Date, default: Date.now },
    processed: { type: Boolean, default: false },
    processingErrors: [{ type: String }],
  },
  { timestamps: true }
);

RawPlaceSchema.index({ source: 1, keyword: 1 });
RawPlaceSchema.index({ processed: 1 });

export const RawPlace = mongoose.model<IRawPlaceDocument>('RawPlace', RawPlaceSchema);
