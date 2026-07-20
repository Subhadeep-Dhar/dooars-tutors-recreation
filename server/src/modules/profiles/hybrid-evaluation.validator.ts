import { PublicSafeProfile } from './semantic-search.service';
import { HybridSearchResult } from './hybrid-search.service';

export interface EvaluationCase {
  id: string;
  category: string;
  query: string;
  userLocation?: { lat: number; lng: number };
  expected: {
    outcome: 'RESULTS' | 'ZERO_RESULTS' | 'SAFE_ERROR';
    constraints?: {
      subjects?: string[];
      activities?: string[];
      gender?: string;
      boards?: string[];
      classes?: string[];
      serviceModes?: string[];
      maxBudget?: number;
      maxDistanceKm?: number;
    };
    geoBehavior?: 'APPLIED' | 'NOT_APPLIED';
    sortIntent?: 'relevance' | 'rating' | 'experience' | 'price_low_to_high' | 'nearest';
    safeErrorType?: string;
  };
}

export class HybridEvaluationValidator {
  /**
   * Validates constraint adherence for the entire result set.
   * Returns an array of failure reasons. Empty array means PASS.
   */
  public static validateConstraints(results: HybridSearchResult['results'], expected: EvaluationCase['expected']): string[] {
    const failures: string[] = [];
    if (!expected.constraints) return failures;

    const { constraints } = expected;

    for (const r of results) {
      const prof = r.profile;
      const slots = prof.teachingSlots || [];

      // 1. Gender Validation
      if (constraints.gender && prof.gender?.toLowerCase() !== constraints.gender.toLowerCase()) {
        failures.push(`Profile ${prof._id} violates gender constraint. Found ${prof.gender}, expected ${constraints.gender}.`);
      }

      // 2. Service Mode Validation
      if (constraints.serviceModes && constraints.serviceModes.length > 0) {
        const satisfies = prof.serviceModes?.some((m: string) => constraints.serviceModes!.includes(m));
        if (!satisfies) {
          failures.push(`Profile ${prof._id} violates serviceMode constraint.`);
        }
      }

      // Same-Slot Validation (Budget + Subject + Board + Class)
      // At least one slot must satisfy ALL applicable slot-level constraints.
      const hasSlotConstraints = constraints.maxBudget || (constraints.boards && constraints.boards.length > 0) || (constraints.subjects && constraints.subjects.length > 0) || (constraints.classes && constraints.classes.length > 0);

      if (hasSlotConstraints) {
        let validSlotFound = false;
        for (const slot of slots) {
          let slotValid = true;

          // Budget
          if (constraints.maxBudget) {
            if (slot.feePerMonth === undefined || slot.feePerMonth === null || slot.feePerMonth > constraints.maxBudget) {
              slotValid = false;
            }
          }

          // Boards
          if (slotValid && constraints.boards && constraints.boards.length > 0) {
            if (!slot.board || !constraints.boards.includes(slot.board)) {
              slotValid = false;
            }
          }

          // Subjects / Activities
          if (slotValid && constraints.subjects && constraints.subjects.length > 0) {
            const matchesSubject = constraints.subjects.some(sub => slot.subject?.toLowerCase().includes(sub.toLowerCase()));
            if (!matchesSubject) {
              slotValid = false;
            }
          }

          // Classes
          if (slotValid && constraints.classes && constraints.classes.length > 0) {
            const matchesClass = constraints.classes.some(cls => slot.classes?.includes(cls));
            if (!matchesClass) {
              slotValid = false;
            }
          }

          if (slotValid) {
            validSlotFound = true;
            break;
          }
        }
        if (!validSlotFound) {
          failures.push(`Profile ${prof._id} failed same-slot validation for budget/board/subject/class.`);
        }
      }
      
      // Activity Validation (Similar to subjects but separate field in our schema logic, we check subjects here as fallback)
      if (constraints.activities && constraints.activities.length > 0) {
          let validSlotFound = false;
          for (const slot of slots) {
            const matchesActivity = constraints.activities.some(act => slot.subject?.toLowerCase().includes(act.toLowerCase()));
            if (matchesActivity) {
                validSlotFound = true;
                break;
            }
          }
          if (!validSlotFound) {
             failures.push(`Profile ${prof._id} failed activity constraint.`);
          }
      }

      // Strict maximum-distance/radius validation
      if (constraints.maxDistanceKm !== undefined) {
        if (r.distanceKm === undefined || r.distanceKm > constraints.maxDistanceKm) {
          failures.push(`Profile ${prof._id} distance ${r.distanceKm} violates maxDistanceKm ${constraints.maxDistanceKm}.`);
        }
      }
    }

    return failures;
  }

  public static validateGeoBehavior(diagnostics: any, expected: EvaluationCase['expected']): string[] {
    const failures: string[] = [];
    if (expected.geoBehavior === 'APPLIED' && !diagnostics.geoApplied) {
      failures.push(`Expected geo behavior to be APPLIED, but it was NOT_APPLIED.`);
    } else if (expected.geoBehavior === 'NOT_APPLIED' && diagnostics.geoApplied) {
      failures.push(`Expected geo behavior to be NOT_APPLIED, but it was APPLIED.`);
    }
    return failures;
  }

  public static validateSorting(results: HybridSearchResult['results'], expected: EvaluationCase['expected']): string[] {
    const failures: string[] = [];
    if (!expected.sortIntent || results.length < 2) return failures;

    const pref = expected.sortIntent;

    for (let i = 0; i < results.length - 1; i++) {
      const a = results[i];
      const b = results[i + 1];

      if (pref === 'nearest') {
        const distA = a.distanceKm;
        const distB = b.distanceKm;
        if (distA === undefined || distB === undefined) {
           failures.push(`Missing distanceKm for nearest sort on Profile ${a.profile._id} or ${b.profile._id}`);
           break;
        }
        // Needs to be nondecreasing
        if (distA > distB) {
           failures.push(`Nearest sort violation: ${distA} > ${distB} at index ${i}`);
           break;
        }
      } else if (pref === 'rating') {
        const ratingA = a.profile.rating?.average ?? 0;
        const ratingB = b.profile.rating?.average ?? 0;
        if (ratingA < ratingB) {
            failures.push(`Rating sort violation: ${ratingA} < ${ratingB} at index ${i}`);
            break;
        }
      } else if (pref === 'experience') {
        const expA = a.profile.experience ?? 0;
        const expB = b.profile.experience ?? 0;
        if (expA < expB) {
            failures.push(`Experience sort violation: ${expA} < ${expB} at index ${i}`);
            break;
        }
      } else if (pref === 'price_low_to_high') {
        const minFeeA = this.getMinFee(a.profile as any);
        const minFeeB = this.getMinFee(b.profile as any);
        if (minFeeA > minFeeB) {
             failures.push(`Price sort violation: ${minFeeA} > ${minFeeB} at index ${i}`);
             break;
        }
      } else if (pref === 'relevance') {
        if (a.score < b.score) {
            failures.push(`Relevance sort violation: ${a.score} < ${b.score} at index ${i}`);
            break;
        }
      }
    }

    return failures;
  }

  private static getMinFee(profile: PublicSafeProfile): number {
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

  public static validateOutputSafety(results: HybridSearchResult['results']): string[] {
    const failures: string[] = [];

    const hasProhibitedKey = (obj: any, path: string = ''): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        // Strictly prohibit raw embeddings, keys, secrets, passwords
        if (lowerKey === 'embedding' || lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey === 'stack' || lowerKey === 'trace') {
            failures.push(`Safety violation: Prohibited field found at ${path ? path + '.' + key : key}`);
            return true;
        }

        // We only allow email/phone if explicitly permitted in the contract, assuming PublicSafeProfile sanitizes them.
        // For testing, if we see them they should trigger failures unless they are public contacts.
        if ((lowerKey === 'email' || lowerKey === 'phone') && key !== 'publicEmail' && key !== 'publicPhone') {
           failures.push(`Safety violation: Private contact field found at ${path ? path + '.' + key : key}`);
           return true;
        }

        if (Array.isArray(value)) {
            // Check if it's an embedding array (array of numbers of length >= 100)
            if (value.length > 100 && value.every(v => typeof v === 'number')) {
                failures.push(`Safety violation: Raw embedding array detected at ${path ? path + '.' + key : key}`);
                return true;
            }
            value.forEach((item, index) => hasProhibitedKey(item, `${path ? path + '.' : ''}${key}[${index}]`));
        } else if (typeof value === 'object') {
            hasProhibitedKey(value, `${path ? path + '.' : ''}${key}`);
        }
      }
      return false;
    };

    results.forEach((r, idx) => hasProhibitedKey(r, `results[${idx}]`));
    
    return failures;
  }

  public static classifyError(error: any, expectedSafeErrorType?: string): 'EXPECTED_SAFE_ERROR' | 'NOT_EXECUTED_QUOTA' | 'NOT_EXECUTED_INFRASTRUCTURE' | 'FAIL' {
    if (error.name === 'StructuredParsingUnavailableError') {
      const reason = error.reason;
      if (reason === 'rate_limit') {
         return 'NOT_EXECUTED_QUOTA';
      }
      if (reason === 'timeout' || reason === 'network_error') {
         return 'NOT_EXECUTED_INFRASTRUCTURE';
      }
    }

    if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('rate limit')) {
        return 'NOT_EXECUTED_QUOTA';
    }

    if (expectedSafeErrorType && error.name === expectedSafeErrorType) {
        return 'EXPECTED_SAFE_ERROR';
    }

    return 'FAIL';
  }

  public static evaluateCase(
    testCase: EvaluationCase, 
    searchResult: HybridSearchResult | null, 
    error: any | null
  ): { status: string, failures: string[] } {
    const failures: string[] = [];

    // 1. Error Classification
    if (error) {
      const classification = this.classifyError(error, testCase.expected.safeErrorType);
      if (classification === 'EXPECTED_SAFE_ERROR') {
          return { status: 'EXPECTED_SAFE_ERROR', failures: [] };
      }
      return { status: classification, failures: [error.message] };
    }

    // 2. We got a result, but we expected an error!
    if (testCase.expected.outcome === 'SAFE_ERROR') {
       return { status: 'FAIL', failures: [`Expected SAFE_ERROR (${testCase.expected.safeErrorType}) but search succeeded.`] };
    }

    if (!searchResult) {
       return { status: 'FAIL', failures: [`No search result and no error.`] };
    }

    // 3. Zero Results outcome
    if (testCase.expected.outcome === 'ZERO_RESULTS') {
       if (searchResult.diagnostics.finalResultCount > 0) {
           return { status: 'FAIL', failures: [`Expected ZERO_RESULTS but got ${searchResult.diagnostics.finalResultCount}.`] };
       }
       return { status: 'EXPECTED_ZERO_RESULT', failures: [] };
    }

    // 4. Expected RESULTS
    if (searchResult.diagnostics.finalResultCount === 0) {
        failures.push(`Expected RESULTS but got 0.`);
    }

    failures.push(...this.validateGeoBehavior(searchResult.diagnostics, testCase.expected));
    failures.push(...this.validateConstraints(searchResult.results, testCase.expected));
    failures.push(...this.validateSorting(searchResult.results, testCase.expected));
    failures.push(...this.validateOutputSafety(searchResult.results));

    if (failures.length > 0) {
        return { status: 'FAIL', failures };
    }
    
    return { status: 'PASS', failures: [] };
  }
}
