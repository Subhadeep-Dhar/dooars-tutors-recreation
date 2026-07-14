import * as crypto from 'crypto';
import { IProfileDocument, IAcademicSlotDocument, INonAcademicSlotDocument } from '../../models/Profile';
import { resolveProfileKind } from '@dooars/shared';

export class EmbeddingBuilder {

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

    for (const slot of profile.teachingSlots) {
      if ('subject' in slot) {
        const acSlot = slot as IAcademicSlotDocument;
        if (acSlot.subject) subjects.add(acSlot.subject);
        if (acSlot.board) boards.add(acSlot.board);
        if (acSlot.medium) mediums.add(acSlot.medium);
        if (acSlot.classes) acSlot.classes.forEach(c => classes.add(c));
      } else {
        const nonAcSlot = slot as INonAcademicSlotDocument;
        if (nonAcSlot.activity) activities.add(nonAcSlot.activity);
        if (nonAcSlot.level) learnerLevels.add(nonAcSlot.level);
        if (nonAcSlot.ageGroups) nonAcSlot.ageGroups.forEach(ag => ageGroups.add(ag));
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

    if (profile.languages && profile.languages.length > 0) {
      lines.push(`Languages: ${profile.languages.sort().join(', ')}`);
    }

    // Bio and enrichedDescription rules:
    // User-authored bio takes precedence. Include enrichedDescription only if it adds semantic information.
    let bioStr = (profile.bio || '').trim();
    let enrichedStr = (profile.enrichedDescription || '').trim();

    if (bioStr && enrichedStr) {
      if (!bioStr.toLowerCase().includes(enrichedStr.toLowerCase().substring(0, 30))) {
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
