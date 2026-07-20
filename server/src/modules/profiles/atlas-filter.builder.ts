import { AiSearchQueryPlan } from './query-parser.service';
import { 
  ProfileType, 
  ProfileKind, 
  GenderType, 
  BoardType, 
  ServiceModeType 
} from '@dooars/shared';
import { ragConfig } from '../../config/rag.config';

const VALID_PROFILE_TYPES = new Set<string>(['tutor', 'coaching_center', 'sports_trainer', 'arts_trainer', 'gym_yoga']);
const VALID_PROVIDER_KINDS = new Set<string>(['individual', 'organisation', 'unknown']);
const VALID_GENDERS = new Set<string>(['male', 'female', 'alien']);
const VALID_BOARDS = new Set<string>(['CBSE', 'ICSE', 'State', 'Other']);
const VALID_SERVICE_MODES = new Set<string>(['online', 'offline', 'student_home', 'provider_home']);

import mongoose from 'mongoose';

export interface AtlasFilterBuilderOptions {
  geoCandidateIds?: mongoose.Types.ObjectId[];
}

export type AtlasFilterPrimitive = string | number | boolean | mongoose.Types.ObjectId;

export interface AtlasFilterCondition {
  $eq?: AtlasFilterPrimitive;
  $in?: AtlasFilterPrimitive[];
  $lte?: number;
}

export interface AtlasVectorFilter {
  $and: Record<string, AtlasFilterCondition>[];
}

export class AtlasFilterBuilder {
  /**
   * Constructs a strictly validated MongoDB Atlas $vectorSearch filter
   * based on the provided query plan and optional geo candidates.
   */
  public static build(plan: AiSearchQueryPlan, options?: AtlasFilterBuilderOptions): AtlasVectorFilter {
    const filters: any = plan.filters || {};
    
    // 1. Mandatory eligibility & schema constraints
    const conditions: any[] = [
      { isActive: { $eq: true } },
      { verificationStatus: { $eq: 'verified' } },
      { schemaVersion: { $eq: ragConfig.embedding.schemaVersion } }
    ];

    // 2. Geo Candidates Injection
    if (options && options.geoCandidateIds) {
      if (options.geoCandidateIds.length === 0) {
        // Short-circuit: if geo candidates are empty, the entire search must yield empty.
        // We inject an impossible condition to ensure $vectorSearch returns nothing, 
        // though the orchestrator should ideally short-circuit before calling Atlas.
        conditions.push({ profileId: { $in: [] } });
      } else {
        conditions.push({ profileId: { $in: options.geoCandidateIds } });
      }
    }

    // 3. Procedural allowlist mapping
    
    if (Array.isArray(filters.type) && filters.type.length > 0) {
      const validTypes = filters.type.filter((t: string) => VALID_PROFILE_TYPES.has(t));
      if (validTypes.length > 0) conditions.push({ type: { $in: validTypes } });
    }

    if (Array.isArray(filters.providerKind) && filters.providerKind.length > 0) {
      const validKinds = filters.providerKind.filter((k: string) => VALID_PROVIDER_KINDS.has(k));
      if (validKinds.length > 0) conditions.push({ providerKind: { $in: validKinds } });
    }

    if (filters.gender && VALID_GENDERS.has(filters.gender)) {
      conditions.push({ gender: { $eq: filters.gender } });
    }

    if (Array.isArray(filters.boards) && filters.boards.length > 0) {
      const validBoards = filters.boards.filter((b: string) => VALID_BOARDS.has(b));
      if (validBoards.length > 0) conditions.push({ boards: { $in: validBoards } });
    }

    if (Array.isArray(filters.serviceModes) && filters.serviceModes.length > 0) {
      const validModes = filters.serviceModes.filter((m: string) => VALID_SERVICE_MODES.has(m));
      if (validModes.length > 0) conditions.push({ serviceModes: { $in: validModes } });
    }

    // For string arrays without strict enums, we just ensure they are non-empty strings
    if (Array.isArray(filters.subjects) && filters.subjects.length > 0) {
      const validSubjects = filters.subjects.filter((s: string) => typeof s === 'string' && s.trim().length > 0);
      if (validSubjects.length > 0) conditions.push({ subjects: { $in: validSubjects } });
    }

    if (Array.isArray(filters.activities) && filters.activities.length > 0) {
      const validActivities = filters.activities.filter((a: string) => typeof a === 'string' && a.trim().length > 0);
      if (validActivities.length > 0) conditions.push({ activities: { $in: validActivities } });
    }

    if (Array.isArray(filters.classes) && filters.classes.length > 0) {
      const validClasses = filters.classes.filter((c: string) => typeof c === 'string' && c.trim().length > 0);
      if (validClasses.length > 0) conditions.push({ classes: { $in: validClasses } });
    }

    if (Array.isArray(filters.languages) && filters.languages.length > 0) {
      const validLangs = filters.languages.filter((l: string) => typeof l === 'string' && l.trim().length > 0);
      if (validLangs.length > 0) conditions.push({ languages: { $in: validLangs } });
    }

    // 4. Numeric mappings
    if (typeof filters.maxBudget === 'number' && Number.isFinite(filters.maxBudget)) {
      // Coarse profile-level prefilter: The profile has AT LEAST one slot offering within budget
      conditions.push({ minFee: { $lte: filters.maxBudget } });
    }

    // Note: learnerLevels / studentLevels intentionally omitted from hard filter to preserve semantic-only behavior.

    return { $and: conditions };
  }
}
