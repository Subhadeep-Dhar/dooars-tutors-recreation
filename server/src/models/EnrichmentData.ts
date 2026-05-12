import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrichmentDataDocument extends Document {
  profileId: mongoose.Types.ObjectId;
  websiteUrl?: string;
  websiteHash?: string;
  
  // Scraped Content Snippets (Sanitized & Noise-Reduced)
  snippets: {
    headings: string[];
    about?: string;
    services?: string[];
    courses?: string[];
    contactBlocks: string[];
  };

  // Metrics
  metrics: {
    crawlDurationMs: number;
    pagesVisited: number;
    aiTokenUsage?: number;
    aiDurationMs?: number;
    source: 'axios' | 'playwright';
  };

  lastCrawledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EnrichmentDataSchema = new Schema<IEnrichmentDataDocument>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    websiteUrl: { type: String, trim: true },
    websiteHash: { type: String, index: true },
    
    snippets: {
      headings: [{ type: String }],
      about: { type: String },
      services: [{ type: String }],
      courses: [{ type: String }],
      contactBlocks: [{ type: String }],
    },

    metrics: {
      crawlDurationMs: { type: Number, default: 0 },
      pagesVisited: { type: Number, default: 0 },
      aiTokenUsage: { type: Number },
      aiDurationMs: { type: Number },
      source: { type: String, enum: ['axios', 'playwright'] },
    },

    lastCrawledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

EnrichmentDataSchema.index({ profileId: 1, lastCrawledAt: -1 });

export const EnrichmentData = mongoose.model<IEnrichmentDataDocument>('EnrichmentData', EnrichmentDataSchema);
