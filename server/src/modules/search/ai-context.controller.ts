import { Request, Response, NextFunction } from 'express';
import { HybridSearchService, HybridSearchInput } from '../profiles/hybrid-search.service';
import { SemanticSearchService } from '../profiles/semantic-search.service';
import { searchProfiles } from './search.service';

const hybridSearchService = new HybridSearchService();
const semanticSearchService = new SemanticSearchService();

// Maximum character limit to prevent token exhaustion and abusive prompt injection
const MAX_QUERY_LENGTH = 300;

function formatProfileContext(p: any) {
  if (!p) return null;
  return {
    id: p._id ? p._id.toString() : p.id,
    name: p.displayName || p.name,
    type: p.type,
    rating: p.rating || { average: 0, count: 0 },
    experience: p.experience,
    subjects: p.teachingSlots?.map((s: any) => s.subject || s.activity).filter(Boolean) || p._subjectIndex || [],
    bio: p.bio,
    location: p.address?.town ? `${p.address.town}${p.address.district ? `, ${p.address.district}` : ''}` : undefined,
    fee: p.teachingSlots?.[0]?.feePerMonth ?? (p.minFee || undefined),
  };
}

export async function getAiContext(req: Request, res: Response, next: NextFunction) {
  try {
    const rawQuery = req.query.q as string;
    
    if (!rawQuery || !rawQuery.trim()) {
      res.status(400).json({ success: false, message: 'Query (q) is required' });
      return;
    }

    // 1. Enforce strict character bounds to optimize token usage
    const cleanQuery = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);

    // ─────────────────────────────────────────────────────────────────────────
    // TIER 1: Hybrid Search (Semantic Vector + Strict Filter Normalization)
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const input: HybridSearchInput = {
        query: cleanQuery,
        limit: 5,
      };

      const result = await hybridSearchService.search(input);

      if (result.results && result.results.length > 0) {
        const contextProfiles = result.results
          .map(r => formatProfileContext(r.profile))
          .filter(Boolean);

        if (contextProfiles.length > 0) {
          res.json({ success: true, context: contextProfiles, tier: 'hybrid' });
          return;
        }
      }
    } catch (tier1Err: any) {
      console.warn('[AI Context] Tier 1 (Hybrid) skipped:', tier1Err.name, tier1Err.message);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIER 2: Pure Semantic Vector Search (Direct embeddings without over-filtering)
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const vectorResults = await semanticSearchService.search({
        query: cleanQuery,
        limit: 5,
      });

      if (vectorResults && vectorResults.length > 0) {
        const contextProfiles = vectorResults
          .map(r => formatProfileContext(r.profile))
          .filter(Boolean);

        if (contextProfiles.length > 0) {
          res.json({ success: true, context: contextProfiles, tier: 'semantic_vector' });
          return;
        }
      }
    } catch (tier2Err: any) {
      console.warn('[AI Context] Tier 2 (Semantic) skipped:', tier2Err.name, tier2Err.message);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIER 3: Platform Database Search (Synonym expansion + MongoDB regex indexes)
    // Guaranteed fallback when vector models/indexes or strict parses yield 0
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const platformResults = await searchProfiles({
        q: cleanQuery,
        limit: 5,
      });

      if (platformResults.data && platformResults.data.length > 0) {
        const contextProfiles = platformResults.data
          .map((p: any) => formatProfileContext(p))
          .filter(Boolean);

        if (contextProfiles.length > 0) {
          res.json({ success: true, context: contextProfiles, tier: 'platform_search' });
          return;
        }
      }
    } catch (tier3Err: any) {
      console.warn('[AI Context] Tier 3 (Platform Search) skipped:', tier3Err);
    }

    // Truly no tutors matching this query across all 3 tiers
    res.json({ success: true, context: [], tier: 'none' });
  } catch (err: any) {
    console.error('Unhandled AI Context error:', err);
    res.json({ success: false, context: [], error: err.message });
  }
}
