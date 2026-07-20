import { AiSearchQueryPlan, QueryParserService } from './query-parser.service';
import { TaxonomyNormalizer } from './taxonomy-normalizer.util';
import { GeoRetrievalUtil, GeoCandidate, GeoRetrievalError } from './geo-retrieval.util';
import { AtlasFilterBuilder, AtlasVectorFilter } from './atlas-filter.builder';
import { OverfetchPolicy } from './overfetch.policy';
import { SemanticSearchService, PublicSafeProfile } from './semantic-search.service';
import { SlotValidatorUtil } from './slot-validator.util';
import { PostRetrievalRanker, RankedCandidate } from './post-retrieval.ranker';
import { Profile } from '../../models/Profile';

export class LocationRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocationRequiredError';
  }
}

export class LocationResolutionRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocationResolutionRequiredError';
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class RetrievalUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetrievalUnavailableError';
  }
}

export interface HybridSearchInput {
  query: string;
  limit?: number;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface HybridSearchDiagnostics {
  fallbackUsed: boolean;
  geoApplied: boolean;
  timings: {
    totalMs: number;
  };
  geoCandidateCount?: number;
  vectorCandidateCount: number;
  slotRejectedCount: number;
  finalResultCount: number;
}

export interface HybridSearchResult {
  results: {
    profileId: string;
    score: number;
    distanceKm?: number;
    profile: PublicSafeProfile;
  }[];
  diagnostics: HybridSearchDiagnostics;
}

export class HybridSearchService {
  private queryParser: QueryParserService;
  private semanticSearch: SemanticSearchService;

  constructor(
    queryParser: QueryParserService = new QueryParserService(),
    semanticSearch: SemanticSearchService = new SemanticSearchService()
  ) {
    this.queryParser = queryParser;
    this.semanticSearch = semanticSearch;
  }

  public async search(input: HybridSearchInput): Promise<HybridSearchResult> {
    const startTime = Date.now();
    let slotRejectedCount = 0;
    
    // 1. Query Parsing
    const rawPlan = await this.queryParser.parseQuery(input.query);
    const fallbackUsed = rawPlan.parserMetadata.warnings.includes("Structured parsing unavailable; semantic fallback used.");

    // 2. Taxonomy Normalization
    const plan = TaxonomyNormalizer.normalize(rawPlan);

    // 3. Geo Intent Determination
    let geoCandidates: GeoCandidate[] | undefined;
    const { locationIntent, sortIntent } = plan;
    const hasExplicitRadius = locationIntent?.radiusKm !== undefined && locationIntent.radiusKm > 0;
    const hasPlaceText = locationIntent?.placeText !== undefined && locationIntent.placeText.trim().length > 0;
    const hasNearMe = locationIntent !== undefined && !hasExplicitRadius && !hasPlaceText; // Location intent exists without radius or text
    const hasNearestSort = sortIntent?.preference === 'nearest';

    if (hasPlaceText) {
      throw new LocationResolutionRequiredError(`Cannot resolve textual place: "${locationIntent.placeText}". Geocoding not supported in Phase 7D.`);
    }

    if (hasExplicitRadius || hasNearMe || hasNearestSort) {
      if (!input.userLocation) {
        throw new LocationRequiredError("Location required for this search query.");
      }
      try {
        geoCandidates = await GeoRetrievalUtil.getGeoCandidates(
          input.userLocation.latitude,
          input.userLocation.longitude,
          hasExplicitRadius ? locationIntent.radiusKm : undefined
        );
      } catch (err: any) {
        if (err instanceof GeoRetrievalError) {
          if (err.message.includes('Invalid latitude') || err.message.includes('Invalid longitude')) {
            throw new DomainError(err.message);
          }
          throw new RetrievalUnavailableError(err.message);
        }
        throw new RetrievalUnavailableError(`Geo retrieval failed: ${err.message}`);
      }

      // 4. Zero-Geo-Candidate Short-Circuit
      if (geoCandidates.length === 0) {
        return {
          results: [],
          diagnostics: {
            fallbackUsed,
            geoApplied: true,
            geoCandidateCount: 0,
            vectorCandidateCount: 0,
            slotRejectedCount: 0,
            finalResultCount: 0,
            timings: { totalMs: Date.now() - startTime }
          }
        };
      }
    }

    // 5. Atlas Filter Construction
    const atlasFilter = AtlasFilterBuilder.build(plan, { 
      geoCandidateIds: geoCandidates ? geoCandidates.map(c => c.profileId) : undefined 
    });

    // 6. Overfetch Policy
    const finalLimit = input.limit !== undefined && input.limit > 0 ? input.limit : 10;
    const overfetchLimit = OverfetchPolicy.calculateLimit(finalLimit);

    // 7. Semantic Candidate Retrieval
    let vectorResults;
    try {
      vectorResults = await this.semanticSearch.executeVectorSearch(plan.semanticQuery, atlasFilter, overfetchLimit);
    } catch (err: any) {
      throw new RetrievalUnavailableError(`Semantic vector search failed: ${err.message}`);
    }

    if (vectorResults.length === 0) {
      return {
        results: [],
        diagnostics: {
          fallbackUsed,
          geoApplied: geoCandidates !== undefined,
          geoCandidateCount: geoCandidates?.length,
          vectorCandidateCount: 0,
          slotRejectedCount: 0,
          finalResultCount: 0,
          timings: { totalMs: Date.now() - startTime }
        }
      };
    }

    // 8. Batch Hydration of Canonical Profiles
    const profileIds = vectorResults.map(r => r.profileId);
    let profiles;
    try {
      profiles = await Profile.find({ _id: { $in: profileIds } }).lean().exec();
    } catch (err: any) {
      throw new RetrievalUnavailableError(`Hydration failed: ${err.message}`);
    }

    const profileMap = new Map();
    for (const p of profiles) {
      profileMap.set(p._id.toString(), p);
    }

    const distanceMap = new Map<string, number>();
    if (geoCandidates) {
      for (const gc of geoCandidates) {
        distanceMap.set(gc.profileId.toString(), gc.distanceKm);
      }
    }

    const rankableCandidates: RankedCandidate[] = [];

    // 9. Slot Validation
    for (const vr of vectorResults) {
      const canonicalProfile = profileMap.get(vr.profileId);
      if (!canonicalProfile) {
        continue; // Orphan/missing profile
      }

      if (!SlotValidatorUtil.isValid(canonicalProfile, plan.filters)) {
        slotRejectedCount++;
        continue;
      }

      rankableCandidates.push({
        profile: canonicalProfile as any,
        semanticScore: vr.score,
        distanceKm: distanceMap.get(vr.profileId)
      });
    }

    // 10. Post Retrieval Ranking
    const ranked = PostRetrievalRanker.rank(rankableCandidates, plan.sortIntent);

    // 11. Final Slicing & Projection
    const finalResults = ranked.slice(0, finalLimit).map(r => ({
      profileId: r.profile._id.toString(),
      score: r.semanticScore,
      distanceKm: r.distanceKm,
      profile: this.semanticSearch.toPublicSafeProfile(r.profile)
    }));

    return {
      results: finalResults,
      diagnostics: {
        fallbackUsed,
        geoApplied: geoCandidates !== undefined,
        geoCandidateCount: geoCandidates?.length,
        vectorCandidateCount: vectorResults.length,
        slotRejectedCount,
        finalResultCount: finalResults.length,
        timings: { totalMs: Date.now() - startTime }
      }
    };
  }
}
