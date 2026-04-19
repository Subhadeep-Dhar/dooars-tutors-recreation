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
  sort?: 'rating' | 'distance' | 'newest' | 'fee_asc';
  page?: number;
  limit?: number;
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