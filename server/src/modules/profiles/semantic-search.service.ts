import { GoogleGenerativeAI } from '@google/generative-ai';
import { ragConfig } from '../../config/rag.config';
import { ProfileEmbedding } from '../../models/ProfileEmbedding';
import { Profile, IProfileDocument } from '../../models/Profile';
import { ProfileType, GenderType, BoardType, ServiceModeType } from '@dooars/shared';
import mongoose from 'mongoose';

export interface SemanticSearchInput {
  query: string;
  limit?: number;
  filters?: {
    type?: ProfileType[];
    providerKind?: ('individual' | 'organisation' | 'unknown')[];
    gender?: GenderType;
    subjects?: string[];
    classes?: string[];
    boards?: BoardType[];
    languages?: string[];
    serviceModes?: ServiceModeType[];
    minExperience?: number;
    maxBudget?: number;
    minRating?: number;
  };
}

export interface PublicSafeProfile {
  _id: string;
  type: string;
  displayName: string;
  slug: string;
  tagline?: string;
  bio?: string;
  experience?: number;
  languages: string[];
  rating: { average: number; count: number };
  isFeatured: boolean;
  address?: {
    area?: string;
    town?: string;
    district?: string;
    state?: string;
  };
  media?: any[];
  teachingSlots?: any[];
  serviceModes?: string[];
  gender?: string;
}

export interface SemanticSearchResult {
  profileId: string;
  score: number;
  profile: PublicSafeProfile;
}

export class SemanticSearchService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Trims whitespace, rejects empty, bounds length to 500 chars.
   */
  public normalizeAndValidateQuery(query: string): string {
    if (typeof query !== 'string') {
      throw new Error('Query must be a string');
    }
    
    const normalized = query.trim();
    if (!normalized) {
      throw new Error('Query cannot be empty or whitespace-only');
    }
    
    if (normalized.length > 500) {
      throw new Error('Query exceeds maximum length of 500 characters');
    }
    
    return normalized;
  }

  /**
   * Generates embedding without taskType to match existing stored vectors.
   * Performs exact same dimension and finite-number validation.
   */
  private async generateQueryEmbedding(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel(
      { model: ragConfig.embedding.model },
      { timeout: 10000 }
    );
    
    const result = await model.embedContent(text);
    const vector = result.embedding.values;

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
  }

  /**
   * Safe projection explicitly stripping sensitive fields.
   */
  private toPublicSafeProfile(doc: any): PublicSafeProfile {
    return {
      _id: doc._id.toString(),
      type: doc.type,
      displayName: doc.displayName,
      slug: doc.slug,
      tagline: doc.tagline,
      bio: doc.bio,
      experience: doc.experience,
      languages: doc.languages || [],
      rating: doc.rating || { average: 0, count: 0 },
      isFeatured: !!doc.isFeatured,
      address: doc.address ? {
        area: doc.address.area,
        town: doc.address.town,
        district: doc.address.district,
        state: doc.address.state
      } : undefined,
      media: doc.media || [],
      teachingSlots: doc.teachingSlots || [],
      serviceModes: doc.serviceModes || [],
      gender: doc.gender
    };
  }

  /**
   * Constructs the filter object for $vectorSearch.
   */
  public buildVectorSearchFilter(filters?: SemanticSearchInput['filters']): any {
    // Mandatory filters for Phase 5 testing (even if embeddings are pre-filtered, defense in depth)
    const baseFilter: any = {
      $and: [
        { isActive: { $eq: true } },
        { verificationStatus: { $eq: 'verified' } }
      ]
    };

    if (!filters) {
      return baseFilter;
    }

    const conditions: any[] = [...baseFilter.$and];

    if (filters.type && filters.type.length > 0) {
      conditions.push({ type: { $in: filters.type } });
    }
    if (filters.providerKind && filters.providerKind.length > 0) {
      conditions.push({ providerKind: { $in: filters.providerKind } });
    }
    if (filters.gender) {
      conditions.push({ gender: { $eq: filters.gender } });
    }
    
    // Arrays - matching any requested value (simplest consistent behavior)
    if (filters.subjects && filters.subjects.length > 0) {
      conditions.push({ subjects: { $in: filters.subjects } });
    }
    if (filters.classes && filters.classes.length > 0) {
      conditions.push({ classes: { $in: filters.classes } });
    }
    if (filters.boards && filters.boards.length > 0) {
      conditions.push({ boards: { $in: filters.boards } });
    }
    if (filters.languages && filters.languages.length > 0) {
      conditions.push({ languages: { $in: filters.languages } });
    }
    if (filters.serviceModes && filters.serviceModes.length > 0) {
      conditions.push({ serviceModes: { $in: filters.serviceModes } });
    }

    // Numerics
    if (typeof filters.minExperience === 'number') {
      conditions.push({ experience: { $gte: filters.minExperience } });
    }
    if (typeof filters.minRating === 'number') {
      conditions.push({ ratingAverage: { $gte: filters.minRating } });
    }
    if (typeof filters.maxBudget === 'number') {
      // minFee <= maxBudget establishes the profile has at least one offering within budget
      conditions.push({ minFee: { $lte: filters.maxBudget } });
    }

    return { $and: conditions };
  }

  /**
   * Executes the standalone semantic search pipeline.
   */
  public async search(input: SemanticSearchInput): Promise<SemanticSearchResult[]> {
    const normalizedQuery = this.normalizeAndValidateQuery(input.query);
    
    let limit = typeof input.limit === 'number' ? input.limit : 10;
    if (limit < 1) limit = 1;
    if (limit > 20) limit = 20;
    
    const queryVector = await this.generateQueryEmbedding(normalizedQuery);
    const filter = this.buildVectorSearchFilter(input.filters);

    // Number of candidates bounds how deep Atlas traverses the graph before culling
    // Since we have 50 exact documents, numCandidates = 50 covers the whole current space.
    const numCandidates = 50; 

    const pipeline = [
      {
        $vectorSearch: {
          index: 'profile_semantic_index',
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: numCandidates,
          limit: limit,
          filter: filter
        }
      },
      {
        $project: {
          profileId: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const rawResults = await ProfileEmbedding.aggregate(pipeline).exec();

    if (!rawResults || rawResults.length === 0) {
      return [];
    }

    const orderedProfileIds = rawResults.map(r => r.profileId.toString());
    const scoreMap = new Map<string, number>();
    rawResults.forEach(r => scoreMap.set(r.profileId.toString(), r.score));

    // Fetch canonical profiles
    const profiles = await Profile.find({ _id: { $in: orderedProfileIds } }).lean().exec();
    const profileMap = new Map<string, any>();
    profiles.forEach(p => profileMap.set(p._id.toString(), p));

    const finalResults: SemanticSearchResult[] = [];

    // Restore exact vector ranking and apply safe projection
    for (const pid of orderedProfileIds) {
      const canonicalProfile = profileMap.get(pid);
      if (!canonicalProfile) {
        console.warn(`[SemanticSearch] Missing canonical Profile for profileId: ${pid}. Skipping.`);
        continue;
      }
      
      finalResults.push({
        profileId: pid,
        score: scoreMap.get(pid) || 0,
        profile: this.toPublicSafeProfile(canonicalProfile)
      });
    }

    return finalResults;
  }
}
