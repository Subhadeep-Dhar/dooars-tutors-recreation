import { ProfileType, ServiceModeType, LearnerLevelType, TeachingStyleType } from '@dooars/shared';

// ── Display Labels ────────────────────────────────────────────────────────────

export const SERVICE_MODE_LABELS: Record<ServiceModeType, string> = {
  online: 'Online',
  offline: 'At my location (Centre/Home)',
  student_home: 'At student/client location',
  provider_home: 'At provider location',
};

export const STYLE_LABELS: Record<TeachingStyleType, string> = {
  patient: 'Patient & Encouraging',
  concept_focused: 'Concept-focused',
  exam_oriented: 'Exam-oriented',
  interactive: 'Highly Interactive',
  practice_intensive: 'Practice-intensive',
  visual_learning: 'Visual/Demonstration',
  step_by_step: 'Step-by-step guidance',
  fast_paced: 'Fast-paced / Intensive',
  gentle: 'Gentle & Supportive',
};

// ── Profile Type Overrides ────────────────────────────────────────────────────

/**
 * Returns category-appropriate labels for learner levels.
 */
export function getLearnerLevelLabels(profileType: ProfileType): Record<LearnerLevelType, string> {
  switch (profileType) {
    case 'tutor':
    case 'coaching_center':
      return {
        foundation: 'Foundation / Basics',
        intermediate: 'Intermediate / Regular',
        advanced: 'Advanced / Competitive',
        all: 'All Levels',
      };
    case 'sports_trainer':
    case 'arts_trainer':
      return {
        foundation: 'Beginner / Foundation',
        intermediate: 'Intermediate / Amateur',
        advanced: 'Advanced / Professional',
        all: 'All Levels',
      };
    case 'gym_yoga':
      return {
        foundation: 'Beginner / First-timers',
        intermediate: 'Regular practitioners',
        advanced: 'Advanced / Elite',
        all: 'All Levels',
      };
    default:
      return {
        foundation: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        all: 'All Levels',
      };
  }
}

/**
 * Returns which teaching styles are applicable to a given profile type.
 */
export function getApplicableStyles(profileType: ProfileType): TeachingStyleType[] {
  switch (profileType) {
    case 'tutor':
    case 'coaching_center':
      return [
        'patient',
        'concept_focused',
        'exam_oriented',
        'interactive',
        'practice_intensive',
      ];
    case 'sports_trainer':
      return [
        'patient',
        'visual_learning',
        'practice_intensive',
        'fast_paced',
        'step_by_step',
      ];
    case 'arts_trainer':
      return [
        'patient',
        'visual_learning',
        'interactive',
        'step_by_step',
      ];
    case 'gym_yoga':
      return [
        'gentle',
        'visual_learning',
        'fast_paced',
        'step_by_step',
        'patient',
      ];
    default:
      return Object.keys(STYLE_LABELS) as TeachingStyleType[];
  }
}

