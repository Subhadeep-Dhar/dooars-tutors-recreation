import * as crypto from 'crypto';
import { IProfileDocument, IAcademicSlotDocument, INonAcademicSlotDocument } from '../../models/Profile';
import { resolveProfileKind, ProfileType, GenderType, BoardType, ServiceModeType } from '@dooars/shared';

// Defined overlap threshold as a constant
const OVERLAP_THRESHOLD = 0.70;

export class EmbeddingBuilder {

  static isProfileEligibleForRag(profile: IProfileDocument): boolean {
    return profile.isActive === true &&
           profile.verificationStatus === "verified" &&
           typeof profile.displayName === "string" &&
           profile.displayName.trim().length > 0;
  }

  static isSubstantiallyDuplicative(text1: string, text2: string): boolean {
    if (!text1 || !text2) return false;

    // Normalize: lowercase, replace punctuation with spaces, collapse whitespace, trim
    const normalize = (str: string) => str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    
    const tokens1 = new Set(normalize(text1).split(' ').filter(t => t.length > 0));
    const tokens2 = new Set(normalize(text2).split(' ').filter(t => t.length > 0));

    if (tokens1.size === 0 || tokens2.size === 0) return false;

    let intersectionSize = 0;
    for (const token of tokens1) {
      if (tokens2.has(token)) {
        intersectionSize++;
      }
    }

    const minSize = Math.min(tokens1.size, tokens2.size);
    if (minSize === 0) return false;

    const overlap = intersectionSize / minSize;
    return overlap >= OVERLAP_THRESHOLD;
  }

  static extractFees(profile: IProfileDocument): { minFee?: number, maxFee?: number } {
    let minFee = Infinity;
    let maxFee = -Infinity;
    let found = false;

    if (Array.isArray(profile.teachingSlots)) {
      for (const slot of profile.teachingSlots) {
        if (typeof slot.feePerMonth === 'number' && !isNaN(slot.feePerMonth) && slot.feePerMonth > 0) {
          if (slot.feePerMonth < minFee) minFee = slot.feePerMonth;
          if (slot.feePerMonth > maxFee) maxFee = slot.feePerMonth;
          found = true;
        }
      }
    }
    
    return found ? { minFee, maxFee } : {};
  }

  static buildFilterSnapshot(profile: IProfileDocument) {
    const kind = resolveProfileKind(profile.type);
    const { minFee, maxFee } = this.extractFees(profile);
    
    const activities = new Set<string>();
    if (Array.isArray(profile.teachingSlots)) {
      for (const slot of profile.teachingSlots) {
        if (!('subject' in slot) && 'activity' in slot) {
          const nonAcSlot = slot as INonAcademicSlotDocument;
          if (nonAcSlot.activity && typeof nonAcSlot.activity === 'string') {
            const act = nonAcSlot.activity.trim();
            if (act.length > 0) {
              activities.add(act);
            }
          }
        }
      }
    }
    
    return {
      type: profile.type as ProfileType,
      providerKind: kind,
      isActive: profile.isActive,
      verificationStatus: profile.verificationStatus,
      gender: profile.gender,
      subjects: Array.isArray(profile.subjects) ? [...profile.subjects].sort() : undefined,
      activities: activities.size > 0 ? Array.from(activities).sort() : undefined,
      classes: Array.isArray(profile.classes) ? [...profile.classes].sort() : undefined,
      boards: Array.isArray(profile.boards) ? [...profile.boards].sort() as BoardType[] : undefined,
      languages: Array.isArray(profile.languages) ? [...profile.languages].sort() : undefined,
      serviceModes: Array.isArray(profile.serviceModes) ? [...profile.serviceModes].sort() as ServiceModeType[] : undefined,
      minFee,
      maxFee,
      experience: typeof profile.experience === 'number' ? profile.experience : undefined,
      ratingAverage: profile.rating?.average || 0
    };
  }

  static buildCanonicalText(profile: IProfileDocument): string {
    const kind = resolveProfileKind(profile.type);
    const providerKindStr = kind === 'unknown' ? '' : (kind === 'organisation' ? 'Organisation' : 'Individual');
    
    const lines: string[] = [];
    if (providerKindStr) {
      lines.push(`Type: ${providerKindStr} ${profile.type}`);
    } else {
      lines.push(`Type: ${profile.type}`);
    }

    if (profile.displayName) lines.push(`Name: ${profile.displayName.trim()}`);

    // Collect unique slots data
    const subjects = new Set<string>();
    const classes = new Set<string>();
    const boards = new Set<string>();
    const mediums = new Set<string>();
    const activities = new Set<string>();
    const ageGroups = new Set<string>();
    const learnerLevels = new Set<string>();

    if (Array.isArray(profile.teachingSlots)) {
      for (const slot of profile.teachingSlots) {
        if ('subject' in slot) {
          const acSlot = slot as IAcademicSlotDocument;
          if (acSlot.subject) subjects.add(acSlot.subject);
          if (acSlot.board) boards.add(acSlot.board);
          if (acSlot.medium) mediums.add(acSlot.medium);
          if (Array.isArray(acSlot.classes)) acSlot.classes.forEach(c => classes.add(c));
        } else {
          const nonAcSlot = slot as INonAcademicSlotDocument;
          if (nonAcSlot.activity) activities.add(nonAcSlot.activity);
          if (nonAcSlot.level) learnerLevels.add(nonAcSlot.level);
          if (Array.isArray(nonAcSlot.ageGroups)) nonAcSlot.ageGroups.forEach(ag => ageGroups.add(ag));
        }
      }
    }

    if (subjects.size > 0) lines.push(`Subjects: ${Array.from(subjects).sort().join(', ')}`);
    if (activities.size > 0) lines.push(`Activities: ${Array.from(activities).sort().join(', ')}`);
    if (classes.size > 0) lines.push(`Classes: ${Array.from(classes).sort().join(', ')}`);
    if (ageGroups.size > 0) lines.push(`Age Groups: ${Array.from(ageGroups).sort().join(', ')}`);
    if (boards.size > 0) lines.push(`Boards: ${Array.from(boards).sort().join(', ')}`);
    if (mediums.size > 0) lines.push(`Medium: ${Array.from(mediums).sort().join(', ')}`);
    if (learnerLevels.size > 0) lines.push(`Levels: ${Array.from(learnerLevels).sort().join(', ')}`);

    // We don't have teachingStyles on Profile in the actual schema, skip it for now unless it exists on some profiles.
    if ((profile as any).teachingStyles && Array.isArray((profile as any).teachingStyles) && (profile as any).teachingStyles.length > 0) {
      lines.push(`Teaching Styles: ${(profile as any).teachingStyles.sort().join(', ')}`);
    }

    if (Array.isArray(profile.languages) && profile.languages.length > 0) {
      lines.push(`Languages: ${[...profile.languages].sort().join(', ')}`);
    }

    // Bio and enrichedDescription rules:
    let bioStr = (profile.bio || '').trim();
    let enrichedStr = (profile.enrichedDescription || '').trim();

    if (bioStr && enrichedStr) {
      if (!this.isSubstantiallyDuplicative(bioStr, enrichedStr)) {
        bioStr += `\nAdditional Details: ${enrichedStr}`;
      }
    } else if (!bioStr && enrichedStr) {
      bioStr = enrichedStr;
    }

    if (bioStr) {
      lines.push(`Bio: ${bioStr}`);
    }

    return lines.join('\n');
  }

  static generateHash(canonicalText: string): string {
    const normalized = canonicalText.trim().replace(/\r\n/g, '\n');
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }
}
