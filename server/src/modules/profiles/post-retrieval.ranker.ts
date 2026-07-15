import { IProfileDocument } from '../../models/Profile';
import { AiSearchQueryPlan } from './query-parser.service';

export interface RankedCandidate {
  profile: IProfileDocument;
  semanticScore: number;
  distanceKm?: number;
}

export class PostRetrievalRanker {
  /**
   * Deterministically sorts the validated candidates based on the parsed sortIntent,
   * geographical boundaries, and semantic scores.
   * 
   * @param candidates The list of profiles that survived same-slot post-validation.
   * @param sortIntent The sort preference from the query parser.
   * @param locationIntent The location intent from the query parser.
   * @returns A stable sorted array of candidates.
   */
  public static rank(
    candidates: RankedCandidate[], 
    sortIntent?: AiSearchQueryPlan['sortIntent']
  ): RankedCandidate[] {
    
    // Create a defensive shallow copy before sorting
    const sorted = [...candidates];
    const pref = sortIntent?.preference || 'relevance';

    sorted.sort((a, b) => {
      // 1. Primary Sort Based on Intent
      if (pref === 'nearest') {
        const distA = a.distanceKm ?? Infinity;
        const distB = b.distanceKm ?? Infinity;
        if (distA !== distB) return distA - distB; // ASC
      }
      else if (pref === 'rating') {
        const ratingA = a.profile.rating?.average ?? 0;
        const ratingB = b.profile.rating?.average ?? 0;
        if (ratingA !== ratingB) return ratingB - ratingA; // DESC

        // Secondary confidence signal for ratings
        const countA = a.profile.rating?.count ?? 0;
        const countB = b.profile.rating?.count ?? 0;
        if (countA !== countB) return countB - countA; // DESC
      }
      else if (pref === 'experience') {
        const expA = a.profile.experience ?? 0;
        const expB = b.profile.experience ?? 0;
        if (expA !== expB) return expB - expA; // DESC
      }
      else if (pref === 'price_low_to_high') {
        // Compute minimum fee across all slots
        const minFeeA = this.getMinFee(a.profile);
        const minFeeB = this.getMinFee(b.profile);
        if (minFeeA !== minFeeB) return minFeeA - minFeeB; // ASC
      }

      // 2. Cascade / Default: Semantic Relevance
      // If primary sort tied, or if intent is "relevance", we fall back to semantic score.
      // (Even for non-nearest strict-radius queries, semantic score rules unless nearest is explicit).
      if (a.semanticScore !== b.semanticScore) {
        return b.semanticScore - a.semanticScore; // DESC
      }

      // 3. Deterministic Tie-Breaker 1: Rating Average
      const ratingA = a.profile.rating?.average ?? 0;
      const ratingB = b.profile.rating?.average ?? 0;
      if (ratingA !== ratingB) return ratingB - ratingA; // DESC

      // 4. Deterministic Tie-Breaker 2: Rating Count
      const countA = a.profile.rating?.count ?? 0;
      const countB = b.profile.rating?.count ?? 0;
      if (countA !== countB) return countB - countA; // DESC

      // 5. Deterministic Tie-Breaker 3: Experience
      const expA = a.profile.experience ?? 0;
      const expB = b.profile.experience ?? 0;
      if (expA !== expB) return expB - expA; // DESC

      // 6. Absolute Stability Tie-Breaker: profile._id
      const idA = a.profile._id.toString();
      const idB = b.profile._id.toString();
      return idA.localeCompare(idB); // ASC
    });

    return sorted;
  }

  private static getMinFee(profile: IProfileDocument): number {
    if (!profile.teachingSlots || !Array.isArray(profile.teachingSlots) || profile.teachingSlots.length === 0) {
      return Infinity;
    }

    let min = Infinity;
    for (const slot of profile.teachingSlots) {
      if (slot && typeof slot === 'object' && 'feePerMonth' in slot && typeof slot.feePerMonth === 'number') {
        if (slot.feePerMonth < min) {
          min = slot.feePerMonth;
        }
      }
    }
    return min;
  }
}
