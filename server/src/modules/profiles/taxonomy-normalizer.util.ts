import { AiSearchQueryPlan } from './query-parser.service';
import { BoardType, ServiceModeType } from '@dooars/shared';

// Taxonomy maps must only map to existing canonical project enums/constants.
// Do not invent unsupported canonical values.
const SUBJECT_ALIASES: Record<string, string> = {
  'math': 'Mathematics',
  'maths': 'Mathematics',
  'mathematics': 'Mathematics',
  'science': 'Science',
  'english': 'English',
  'bengali': 'Bengali',
  'bangla': 'Bengali',
  'physics': 'Physics',
  'chemistry': 'Chemistry',
  'biology': 'Biology',
  'computer': 'Computer Science',
  'cs': 'Computer Science',
};

const BOARD_ALIASES: Record<string, BoardType> = {
  'cbse': 'CBSE',
  'icse': 'ICSE',
  'isc': 'ICSE',
  'state': 'State',
  'wbbse': 'State',
  'wbchse': 'State',
  'other': 'Other'
};

const SERVICE_MODE_ALIASES: Record<string, ServiceModeType> = {
  'online': 'online',
  'offline': 'offline',
  'student home': 'student_home',
  'at my house': 'student_home',
  'home tuition': 'student_home',
  'tutor home': 'provider_home',
  'provider home': 'provider_home',
  'center': 'provider_home'
};

export class TaxonomyNormalizer {
  /**
   * Normalizes parsed query plan fields into canonical platform values.
   */
  public static normalize(plan: AiSearchQueryPlan): AiSearchQueryPlan {
    const normalizedPlan = { ...plan };

    if (!normalizedPlan.filters) {
      return normalizedPlan;
    }

    if (normalizedPlan.filters.subjects) {
      const normalizedSubjects = new Set<string>();
      for (const subject of normalizedPlan.filters.subjects) {
        const lower = subject.toLowerCase().trim();
        if (SUBJECT_ALIASES[lower]) {
          normalizedSubjects.add(SUBJECT_ALIASES[lower]);
        } else {
          // If not in aliases, keep it as is. It might be a valid canonical value not explicitly aliased.
          normalizedSubjects.add(subject.trim());
        }
      }
      normalizedPlan.filters.subjects = Array.from(normalizedSubjects);
    }

    if (normalizedPlan.filters.boards) {
      const normalizedBoards = new Set<BoardType>();
      for (const board of normalizedPlan.filters.boards) {
        const lower = board.toLowerCase().trim();
        if (BOARD_ALIASES[lower]) {
          normalizedBoards.add(BOARD_ALIASES[lower]);
        } else {
          normalizedBoards.add(board as BoardType);
        }
      }
      normalizedPlan.filters.boards = Array.from(normalizedBoards);
    }

    if (normalizedPlan.filters.serviceModes) {
      const normalizedModes = new Set<ServiceModeType>();
      for (const mode of normalizedPlan.filters.serviceModes) {
        const lower = mode.toLowerCase().trim();
        if (SERVICE_MODE_ALIASES[lower]) {
          normalizedModes.add(SERVICE_MODE_ALIASES[lower]);
        } else {
          normalizedModes.add(mode as ServiceModeType);
        }
      }
      normalizedPlan.filters.serviceModes = Array.from(normalizedModes);
    }

    return normalizedPlan;
  }
}
