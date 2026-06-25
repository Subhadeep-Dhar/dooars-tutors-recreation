import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformStat extends Document {
  type: string;
  totalVisits: number;
}

const platformStatSchema = new Schema<IPlatformStat>(
  {
    type: { type: String, default: 'global', unique: true },
    totalVisits: { type: Number, default: 24358 }
  },
  { timestamps: true }
);

export const PlatformStat = mongoose.models.PlatformStat || mongoose.model<IPlatformStat>('PlatformStat', platformStatSchema);
