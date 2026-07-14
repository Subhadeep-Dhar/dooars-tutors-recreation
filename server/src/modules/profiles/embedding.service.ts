import { GoogleGenerativeAI } from '@google/generative-ai';
import { IProfileDocument, Profile } from '../../models/Profile';
import { ProfileEmbedding } from '../../models/ProfileEmbedding';
import { ragConfig } from '../../config/rag.config';
import { EmbeddingBuilder } from './embedding.builder';

export type EmbeddingSyncResult =
  | { status: 'created'; profileId: string; contentHash: string; dimensions: number }
  | { status: 'updated'; profileId: string; contentHash: string; dimensions: number }
  | { status: 'skipped'; profileId: string; reason: 'unchanged'; contentHash: string }
  | { status: 'ineligible'; profileId: string; reason: string }
  | { status: 'error'; profileId: string; error: string };

export class EmbeddingService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generates embedding with bounded retries (max 2) and 10s timeout
   */
  private async generateEmbeddingWithRetry(text: string): Promise<number[]> {
    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const model = this.genAI.getGenerativeModel(
          { model: ragConfig.embedding.model },
          { timeout: 10000 } // 10-second timeout
        );
        
        const result = await model.embedContent(text);
        const vector = result.embedding.values;

        // Strict runtime validation
        if (!Array.isArray(vector)) {
          throw new Error('Invalid response: vector is not an array');
        }
        if (vector.length !== ragConfig.embedding.dimensions) {
          throw new Error(`Dimension mismatch: expected ${ragConfig.embedding.dimensions}, got ${vector.length}`);
        }
        for (const val of vector) {
          if (typeof val !== 'number' || !Number.isFinite(val)) {
            throw new Error(`Invalid vector value: ${val}`);
          }
        }

        return vector;
      } catch (error: any) {
        attempt++;
        
        // Do not retry on validation failures or client errors (400)
        const errorMessage = error?.message?.toLowerCase() || '';
        const isClientError = errorMessage.includes('400') || errorMessage.includes('bad request') || errorMessage.includes('invalid');
        
        if (isClientError || attempt > maxRetries) {
          throw error;
        }

        // Exponential backoff for transient errors
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    
    throw new Error('Embedding generation failed after retries');
  }

  /**
   * Idempotent synchronization of a single profile
   */
  public async syncProfile(profileOrId: string | IProfileDocument): Promise<EmbeddingSyncResult> {
    try {
      let profile: IProfileDocument | null;

      if (typeof profileOrId === 'string') {
        profile = await Profile.findById(profileOrId);
      } else {
        profile = profileOrId;
      }

      if (!profile) {
        return { status: 'error', profileId: typeof profileOrId === 'string' ? profileOrId : 'unknown', error: 'Profile not found' };
      }

      const profileId = profile._id.toString();

      if (!EmbeddingBuilder.isProfileEligibleForRag(profile)) {
        // Soft delete the embedding if it exists since it's no longer eligible
        await ProfileEmbedding.findOneAndDelete({ profileId: profile._id });
        return { status: 'ineligible', profileId, reason: 'Profile is not active, verified, or has missing display name' };
      }

      const canonicalText = EmbeddingBuilder.buildCanonicalText(profile);
      const contentHash = EmbeddingBuilder.generateHash(canonicalText);

      const existingEmbedding = await ProfileEmbedding.findOne({ profileId: profile._id });

      const isFresh = existingEmbedding &&
                      existingEmbedding.contentHash === contentHash &&
                      existingEmbedding.model === ragConfig.embedding.model &&
                      existingEmbedding.dimensions === ragConfig.embedding.dimensions &&
                      existingEmbedding.schemaVersion === ragConfig.embedding.schemaVersion;

      if (isFresh) {
        return { status: 'skipped', profileId, reason: 'unchanged', contentHash };
      }

      // API Call
      const vector = await this.generateEmbeddingWithRetry(canonicalText);
      const filterSnapshot = EmbeddingBuilder.buildFilterSnapshot(profile);

      // Atomic Upsert
      const result = await ProfileEmbedding.findOneAndUpdate(
        { profileId: profile._id },
        {
          $set: {
            embedding: vector,
            contentHash,
            model: ragConfig.embedding.model,
            dimensions: ragConfig.embedding.dimensions,
            schemaVersion: ragConfig.embedding.schemaVersion,
            generatedAt: new Date(),
            ...filterSnapshot
          }
        },
        { upsert: true, new: false } // new: false returns the old doc (if any)
      );

      return {
        status: result ? 'updated' : 'created',
        profileId,
        contentHash,
        dimensions: vector.length
      };

    } catch (error: any) {
      // Structured logging without sensitive details
      const profileId = typeof profileOrId === 'string' ? profileOrId : profileOrId._id?.toString() || 'unknown';
      console.error(`[EmbeddingService] Sync failed for profile ${profileId}:`, error?.message || 'Unknown error');
      return { status: 'error', profileId, error: error?.message || 'Unknown error' };
    }
  }
}
