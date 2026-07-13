// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'tutor' | 'org' | 'admin';

export interface IUser {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: IMediaAsset;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

export interface LoginResponse {
  user: Omit<IUser, 'passwordHash'>;
  accessToken: string;
}

// ─── Profile & Teaching Slots ────────────────────────────────────────────────

export type ProfileType =
  | 'tutor'
  | 'coaching_center'
  | 'sports_trainer'
  | 'arts_trainer'
  | 'gym_yoga';

export type BoardType = 'CBSE' | 'ICSE' | 'State' | 'Other';

export type MediumType = 'Bengali' | 'English' | 'Hindi' | 'Other';

/**
 * Academic teaching slot — used by tutors and coaching centers
 */
export interface IAcademicSlot {
  _id: string;
  subject: string;
  classes: string[];       // ["Class 8", "Class 9"]
  board: BoardType;
  medium: MediumType;
  feePerMonth: number | null;
}

/**
 * Non-academic slot — used by sports, arts, gym/yoga trainers
 */
export interface INonAcademicSlot {
  _id: string;
  activity: string;        // "Football", "Yoga", "Tabla"
  ageGroups?: string[];    // ["Under 14", "Under 17"]
  level?: string;          // "Beginner", "Intermediate", "Advanced"
  sessionType?: string;    // "Group", "Individual"
  timing?: string;         // "Morning", "Evening"
  gender?: string;         // "All", "Male only", "Female only"
  feePerMonth: number | null;
}

export type TeachingSlot = IAcademicSlot | INonAcademicSlot;

export interface IGeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IAddress {
  line1: string;
  area?: string;
  town: string;
  district: string;
  state: string;
  pincode: string;
}

export interface IContact {
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
}

export type MediaCategory = 'facility' | 'class' | 'achievement' | 'gallery';

export interface IMediaAsset {
  _id: string;
  type: 'image' | 'video';
  url: string;
  publicId: string;         // Cloudinary public ID — needed for deletion
  thumbnailUrl?: string;    // auto-generated for videos
  caption?: string;
  category: MediaCategory;
  order: number;
}

export interface IRating {
  average: number;
  count: number;
}

export interface IProfile {
  _id: string;
  userId: string;
  type: ProfileType;
  displayName: string;
  slug: string;
  tagline?: string;
  bio?: string;
  teachingSlots: TeachingSlot[];
  // Denormalized index fields — never set directly, derived from teachingSlots
  _subjectIndex: string[];
  _classIndex: string[];
  location: IGeoLocation;
  address: IAddress;
  contact: IContact;
  experience?: number;      // years
  languages: string[];
  media: IMediaAsset[];
  rating: IRating;
  isApproved: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // ── New optional fields (all backward-compatible) ─────────────────────────
  /** Disambiguates gym_yoga profiles. undefined = legacy/unknown state. */
  isOrganisation?: boolean;
  gender?: GenderType;
  /** NOT included in public API responses. Age is computed server-side. */
  // dateOfBirth omitted intentionally — never exposed publicly
  /** Age computed server-side from dateOfBirth. Included in public responses when available. */
  calculatedAge?: number;
  serviceModes?: ServiceModeType[];
  learnerLevels?: LearnerLevelType[];
  teachingStyles?: TeachingStyleType[];
  availability?: IAvailabilityDay[];
  /** Service radius in km. Applicable only when student_home is a selected service mode. */
  serviceRadiusKm?: number;
  bioSource?: BioSourceType;
  bioGeneratedAt?: string;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchParams {
  q?: string;
  type?: ProfileType;
  subject?: string;
  class?: string;
  board?: BoardType;
  lat?: number;
  lng?: number;
  radius?: number;          // km, default 10
  minFee?: number;
  maxFee?: number;
  minRating?: number;        // filter: rating.average >= this
  place?: string;            // filter: town/area/district name
  sort?: 'rating' | 'distance' | 'newest' | 'fee_asc';
  page?: number;
  limit?: number;
  // ── New optional search filters ──────────────────────────────────────────
  gender?: GenderType;
  /** Comma-separated language names. Match ANY of the provided values. */
  languages?: string;
  /** Comma-separated service mode values. Match ANY of the provided values. */
  serviceModes?: string;
}

/**
 * Profile as returned by search — includes only the slots
 * that matched the search query, not all slots
 */
export interface SearchResultProfile extends IProfile {
  matchedSlots: TeachingSlot[];
  distanceKm?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface IReview {
  _id: string;
  profileId: string;
  reviewer: Pick<IUser, '_id' | 'name' | 'avatar'>;
  rating: number;
  text: string;
  isVisible: boolean;
  createdAt: string;
}

// ─── API Response wrapper ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string>;  // field-level validation errors
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── New Types (Phases 2–11) ──────────────────────────────────────────────────

/** Provider gender. 'alien' is the platform's non-binary/other-inclusive option. */
export type GenderType = 'male' | 'female' | 'alien';

/**
 * How a provider delivers their service.
 * - online: virtual sessions
 * - offline: fixed physical location (provider's centre/home)
 * - student_home: provider travels to student
 * - provider_home: student comes to provider's residence
 */
export type ServiceModeType = 'online' | 'offline' | 'student_home' | 'provider_home';

/**
 * Target learner experience levels.
 * Category-appropriate labels are managed in profileFieldConfig on the frontend.
 */
export type LearnerLevelType = 'foundation' | 'intermediate' | 'advanced' | 'all';

/**
 * Instructor style tags.
 * Not all styles apply to all profile types — see profileFieldConfig.
 */
export type TeachingStyleType =
  | 'patient'
  | 'concept_focused'
  | 'exam_oriented'
  | 'interactive'
  | 'practice_intensive'
  | 'visual_learning'
  | 'step_by_step'
  | 'fast_paced'
  | 'gentle';

/**
 * Provenance of the bio field. Server-controlled — never accepted from clients.
 * - user: written/edited by the tutor/org via the dashboard
 * - admin: written/edited by an admin
 * - ai_generated: generated by the BioGeneratorService using Gemini
 * - deterministic: generated by the deterministic template fallback
 * - imported: supplied by the importer pipeline
 */
export type BioSourceType = 'user' | 'admin' | 'ai_generated' | 'deterministic' | 'imported';

/**
 * A time slot within an availability day.
 * Times are HH:mm strings, 24-hour format, Asia/Kolkata (IST, UTC+5:30).
 * Single-region platform — no per-slot timezone stored.
 */
export interface IAvailabilitySlot {
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "11:30"
}

/**
 * Availability for one day of the week.
 */
export interface IAvailabilityDay {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  slots: IAvailabilitySlot[];
}

// ─── ProfileKind — tristate resolver ─────────────────────────────────────────

/**
 * Semantic classification of a profile as individual, organisation, or unknown.
 *
 * Rules:
 * - tutor, sports_trainer, arts_trainer → always individual
 * - coaching_center → always organisation
 * - gym_yoga with isOrganisation=true  → organisation
 * - gym_yoga with isOrganisation=false → individual
 * - gym_yoga with isOrganisation=undefined (legacy) → unknown
 *
 * Never default isOrganisation on legacy records. Treat unknown as neither.
 */
export type ProfileKind = 'individual' | 'organisation' | 'unknown';

export function resolveProfileKind(type: ProfileType, isOrganisation?: boolean | null): ProfileKind {
  if (type === 'tutor' || type === 'sports_trainer' || type === 'arts_trainer') {
    return 'individual';
  }
  if (type === 'coaching_center') {
    return 'organisation';
  }
  if (type === 'gym_yoga') {
    if (isOrganisation === true)  return 'organisation';
    if (isOrganisation === false) return 'individual';
    return 'unknown'; // legacy: isOrganisation not set
  }
  return 'unknown';
}

// ─── Field Applicability (per kind/type) ─────────────────────────────────────

export interface ProfileFieldApplicability {
  /** Gender and date of birth fields */
  showGenderDob: boolean;
  /** Service modes selector */
  showServiceModes: boolean;
  /** Languages for communication */
  showLanguages: boolean;
  /** Learner levels selector */
  showLearnerLevels: boolean;
  /** Style tags selector */
  showStyles: boolean;
  /** Availability schedule */
  showAvailability: boolean;
  /** Service radius — only meaningful when student_home mode is selected */
  showServiceRadius: boolean;
}

/**
 * Returns which profile fields are applicable for a given type and kind.
 * When kind is 'unknown', conservative defaults are used (org-like: hide personal fields).
 */
export function getProfileFieldApplicability(
  type: ProfileType,
  kind: ProfileKind,
): ProfileFieldApplicability {
  const isOrg = kind === 'organisation';
  const isUnknown = kind === 'unknown';

  return {
    showGenderDob:    !isOrg && !isUnknown,
    showServiceModes: true,
    showLanguages:    true,
    showLearnerLevels: true,
    showStyles:       true,
    showAvailability: !isOrg,
    showServiceRadius: !isOrg && !isUnknown,
  };
}

// ─── Utility: calculate age from DOB ─────────────────────────────────────────

/**
 * Calculates the current age in whole years from a date of birth.
 * Does not require any cron job — computed at request time.
 * Uses Asia/Kolkata as the reference timezone (single-region platform).
 */
export function calculateAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}