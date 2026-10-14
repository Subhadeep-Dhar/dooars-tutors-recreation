import { IProfileDocument, IAcademicSlotDocument, INonAcademicSlotDocument } from '../../models/Profile';
import { AiSearchQueryPlan } from './query-parser.service';

export class SlotValidatorUtil {
  /**
   * Validates if a retrieved profile satisfies all slot-level constraints (subjects, classes, boards, activities, maxBudget)
   * on a per-slot basis to prevent cross-slot false positives.
   */
  public static isValid(profile: IProfileDocument, filters?: AiSearchQueryPlan['filters']): boolean {
    if (!filters) return true;

    const hasAcademicConstraints = 
      (filters.subjects && filters.subjects.length > 0) || 
      (filters.classes && filters.classes.length > 0) || 
      (filters.boards && filters.boards.length > 0);
      
    const hasNonAcademicConstraints = 
      (filters.activities && filters.activities.length > 0);
      
    const hasBudgetConstraint = filters.maxBudget !== undefined && Number.isFinite(filters.maxBudget);

    // If no slot-level constraints exist, validation trivially passes.
    if (!hasAcademicConstraints && !hasNonAcademicConstraints && !hasBudgetConstraint) {
      return true;
    }

    // If slot constraints exist but the profile has no slots, it safely fails.
    if (!profile.teachingSlots || !Array.isArray(profile.teachingSlots) || profile.teachingSlots.length === 0) {
      return false;
    }

    const maxBudget = hasBudgetConstraint ? filters.maxBudget! : undefined;

    // Helper to identify slot type safely
    const isAcademic = (slot: any): slot is IAcademicSlotDocument => {
      return slot && typeof slot === 'object' && typeof slot.subject === 'string';
    };
    
    const isNonAcademic = (slot: any): slot is INonAcademicSlotDocument => {
      return slot && typeof slot === 'object' && typeof slot.activity === 'string';
    };

    let passedAcademic = false;
    let passedNonAcademic = false;

    // If ONLY budget is provided (no domain-specific constraints), a valid budget on ANY valid slot is sufficient.
    const budgetOnly = !hasAcademicConstraints && !hasNonAcademicConstraints && hasBudgetConstraint;
    if (budgetOnly) {
      for (const slot of profile.teachingSlots) {
        if (!slot || typeof slot !== 'object') continue;
        if (isAcademic(slot) || isNonAcademic(slot)) {
          if (this.satisfiesBudget(slot.feePerMonth, maxBudget)) {
            return true;
          }
        }
      }
      return false; // No valid slot matched budget
    }

    const normalizeSubj = (s: string) => {
      const lower = (s || '').toLowerCase().trim();
      if (lower === 'math' || lower === 'maths' || lower === 'mathematics') return 'mathematics';
      if (lower === 'bangla' || lower === 'bengali') return 'bengali';
      if (lower === 'cs' || lower === 'computer' || lower === 'computer science') return 'computer science';
      return lower;
    };

    const normalizeCls = (c: string) => {
      const cleaned = (c || '').toLowerCase().replace(/class|grade|th|st|nd|rd/g, '').trim();
      if (cleaned === 'x') return '10';
      if (cleaned === 'ix') return '9';
      if (cleaned === 'xi') return '11';
      if (cleaned === 'xii') return '12';
      return cleaned;
    };

    // Evaluate Academic Requirements
    if (hasAcademicConstraints || hasBudgetConstraint) {
      for (const slot of profile.teachingSlots) {
        if (!isAcademic(slot)) continue;

        let slotPasses = true;

        if (filters.subjects && filters.subjects.length > 0) {
          const slotSubjNorm = normalizeSubj(slot.subject);
          const matches = filters.subjects.some(fs => {
            const fsNorm = normalizeSubj(fs);
            return slotSubjNorm === fsNorm || slotSubjNorm.includes(fsNorm) || fsNorm.includes(slotSubjNorm);
          });
          if (!matches) slotPasses = false;
        }

        if (filters.classes && filters.classes.length > 0) {
          if (!slot.classes || !Array.isArray(slot.classes)) {
            slotPasses = false;
          } else {
            const filterNorms = filters.classes.map(normalizeCls);
            const intersects = slot.classes.some(c => {
              const cNorm = normalizeCls(c);
              return filterNorms.includes(cNorm) || filters.classes!.includes(c);
            });
            if (!intersects) slotPasses = false;
          }
        }

        if (filters.boards && filters.boards.length > 0) {
          if (!slot.board || !filters.boards.some(b => b.toLowerCase() === (slot.board || '').toLowerCase())) slotPasses = false;
        }

        if (maxBudget !== undefined) {
          if (!this.satisfiesBudget(slot.feePerMonth, maxBudget)) slotPasses = false;
        }

        if (slotPasses) {
          passedAcademic = true;
          break; // One matching academic slot is sufficient for the academic domain
        }
      }
    }

    // Evaluate Non-Academic Requirements
    if (hasNonAcademicConstraints || hasBudgetConstraint) {
      for (const slot of profile.teachingSlots) {
        if (!isNonAcademic(slot)) continue;

        let slotPasses = true;

        if (filters.activities && filters.activities.length > 0) {
          const slotAct = (slot.activity || '').toLowerCase();
          const matches = filters.activities.some(act => {
            const a = act.toLowerCase();
            return slotAct === a || slotAct.includes(a) || a.includes(slotAct);
          });
          if (!matches) slotPasses = false;
        }

        if (maxBudget !== undefined) {
          if (!this.satisfiesBudget(slot.feePerMonth, maxBudget)) slotPasses = false;
        }

        if (slotPasses) {
          passedNonAcademic = true;
          break; // One matching non-academic slot is sufficient for the non-academic domain
        }
      }
    }

    // Resolve Cross-Domain Logic
    if (hasAcademicConstraints && hasNonAcademicConstraints) {
      // Cross-domain AND logic: both must pass
      return passedAcademic && passedNonAcademic;
    } else if (hasAcademicConstraints) {
      return passedAcademic;
    } else if (hasNonAcademicConstraints) {
      return passedNonAcademic;
    }

    return false;
  }

  /**
   * Only a known valid fee <= maxBudget satisfies the constraint.
   * Null/undefined/NaN does NOT automatically pass a strict budget.
   */
  private static satisfiesBudget(fee: any, maxBudget: number | undefined): boolean {
    if (maxBudget === undefined) return true;
    if (typeof fee !== 'number' || !Number.isFinite(fee)) return false;
    return fee <= maxBudget;
  }
}
