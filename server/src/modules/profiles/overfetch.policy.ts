import { ragConfig } from '../../config/rag.config';

export class OverfetchPolicy {
  /**
   * Calculates the optimal number of candidates to request from Atlas $vectorSearch
   * to ensure enough candidates survive strict same-slot post-validation.
   * 
   * @param requestedFinalLimit The final number of results requested by the client (e.g., pagination limit).
   * @returns The bounded overfetch limit for the database query.
   */
  public static calculateLimit(requestedFinalLimit: number): number {
    if (requestedFinalLimit <= 0 || !Number.isFinite(requestedFinalLimit)) {
      requestedFinalLimit = 20; // Default fallback
    }

    const { overfetchMultiplier, maxOverfetchCap } = ragConfig.retrieval;
    
    // Ensure we don't multiply by zero or negative
    const multiplier = Math.max(1, overfetchMultiplier);
    
    // Calculate raw multiplier
    const rawLimit = requestedFinalLimit * multiplier;

    // Bound by the maximum configured cap
    const finalLimit = Math.min(rawLimit, maxOverfetchCap);

    // Ensure we at least fetch what was requested if cap is strangely configured lower
    return Math.max(finalLimit, requestedFinalLimit);
  }
}
