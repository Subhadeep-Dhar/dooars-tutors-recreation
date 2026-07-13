import mongoose, { Document, Schema } from 'mongoose';
import { ProfileType, BoardType, MediumType, MediaCategory, GenderType, ServiceModeType, LearnerLevelType, TeachingStyleType, BioSourceType, IAvailabilityDay } from '@dooars/shared';

// ── Subdocument interfaces ───────────────────────────────────────────────────

export interface IAcademicSlotDocument {
    _id: mongoose.Types.ObjectId;
    subject: string;
    classes: string[];
    board: BoardType;
    medium: MediumType;
    feePerMonth: number | null;
}

export interface INonAcademicSlotDocument {
    _id: mongoose.Types.ObjectId;
    activity: string;
    ageGroups?: string[];
    level?: string;
    sessionType?: string;
    timing?: string;
    gender?: string;
    feePerMonth: number | null;
}

export interface IMediaDocument {
    _id: mongoose.Types.ObjectId;
    type: 'image' | 'video';
    url: string;
    publicId: string;
    thumbnailUrl?: string;
    caption?: string;
    category: MediaCategory;
    order: number;
}

export interface IProfileDocument extends Document {
    userId: mongoose.Types.ObjectId;
    type: ProfileType;
    displayName: string;
    slug: string;
    tagline?: string;
    bio?: string;
    teachingSlots: Array<IAcademicSlotDocument | INonAcademicSlotDocument>;
    // Denormalized — rebuilt automatically on every slot change
    _subjectIndex: string[];
    _classIndex: string[];
    location: { type: 'Point'; coordinates: [number, number] };
    address: {
        line1?: string;
        area?: string;
        town?: string;
        district?: string;
        state?: string;
        pincode?: string;
    };
    contact: {
        phone?: string;
        whatsapp?: string;
        email?: string;
        website?: string;
    };
    experience?: number;
    languages: string[];
    media: IMediaDocument[];
    rating: { average: number; count: number };
    isFeatured: boolean;
    isActive: boolean;
    
    // Importer fields
    source?: string;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    googlePlaceId?: string;
    googleMapsUrl?: string;
    importBatchId?: string;
    sourcePriority?: number;
    importedAt?: Date;

    // Enrichment fields (Optional)
    subjects?: string[];
    classes?: string[];
    courses?: string[];
    boards?: string[];
    examPreparation?: string[];
    skills?: string[];
    whatsappNumber?: string;
    socialLinks?: {
        facebook?: string;
        instagram?: string;
        youtube?: string;
    };
    enrichedDescription?: string;

    // AI Enrichment Metadata
    autoExtracted: boolean;
    extractionSource?: 'website' | 'reviews' | 'mixed';
    extractionConfidence?: Record<string, number>;
    lastEnrichedAt?: Date;
    enrichmentVersion: number;
    manuallyEditedFields: string[];

    // ── New optional fields (Phases 2–11) ───────────────────────────────────
    /** Disambiguates gym_yoga profiles. Intentionally has no DB default — undefined = unknown. */
    isOrganisation?: boolean;
    gender?: GenderType;
    /**
     * Date of birth. Stored in DB but NEVER returned in public API responses.
     * Age is computed server-side using calculateAge() and exposed as calculatedAge.
     */
    dateOfBirth?: Date;
    serviceModes?: ServiceModeType[];
    learnerLevels?: LearnerLevelType[];
    teachingStyles?: TeachingStyleType[];
    availability?: IAvailabilityDay[];
    /** Service radius in km — applicable only when student_home is a selected mode. */
    serviceRadiusKm?: number;
    /**
     * Provenance of the bio field. Server-controlled — never accepted from client payloads.
     * Set automatically by: profile.service.ts, admin.service.ts, BioGeneratorService, mapper.service.ts.
     */
    bioSource?: BioSourceType;
    bioGeneratedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

// ── Subdocument schemas ──────────────────────────────────────────────────────

const AcademicSlotSchema = new Schema({
    subject: { type: String, required: true, trim: true },
    classes: [{ type: String, trim: true }],
    board: { type: String, enum: ['CBSE', 'ICSE', 'State', 'Other'], required: true },
    medium: { type: String, enum: ['Bengali', 'English', 'Hindi', 'Other'], required: true },
    feePerMonth: { type: Number, default: null },
});

const NonAcademicSlotSchema = new Schema({
    activity: { type: String, required: true, trim: true },
    ageGroups: [{ type: String }],
    level: { type: String },
    sessionType: { type: String },
    timing: { type: String },
    gender: { type: String },
    feePerMonth: { type: Number, default: null },
});

const MediaSchema = new Schema({
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    thumbnailUrl: { type: String },
    caption: { type: String, trim: true },
    category: {
        type: String,
        enum: ['facility', 'class', 'achievement', 'gallery'],
        default: 'gallery',
    },
    order: { type: Number, default: 0 },
});

// ── Main profile schema ──────────────────────────────────────────────────────

const ProfileSchema = new Schema<IProfileDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
        type: {
            type: String,
            enum: ['tutor', 'coaching_center', 'sports_trainer', 'arts_trainer', 'gym_yoga'],
            required: true,
        },
        displayName: { type: String, required: true, trim: true },
        slug: { type: String, required: true, lowercase: true, trim: true },
        tagline: { type: String, trim: true },
        bio: { type: String, trim: true },

        // Teaching slots — academic and non-academic mixed
        teachingSlots: {
            type: [Schema.Types.Mixed as unknown as Schema],
            default: [],
        },

        // Denormalized index fields — NEVER set directly, always via updateSlotIndexes()
        _subjectIndex: [{ type: String, index: true }],
        _classIndex: [{ type: String, index: true }],

        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }, // [lng, lat]
        },

        address: {
            line1: { type: String, trim: true },
            area: { type: String, trim: true },
            town: { type: String, trim: true },
            district: { type: String, trim: true },
            state: { type: String, trim: true },
            pincode: { type: String, trim: true },
        },

        contact: {
            phone: { type: String },
            whatsapp: { type: String },
            email: { type: String, lowercase: true },
            website: { type: String },
        },

        experience: { type: Number, min: 0 },
        languages: [{ type: String }],
        media: [MediaSchema],

        rating: {
            average: { type: Number, default: 0, min: 0, max: 5 },
            count: { type: Number, default: 0, min: 0 },
            score: { type: Number, default: 0 }, // Bayesian average score
        },

        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },

        // Importer fields
        source: { type: String },
        verificationStatus: { 
            type: String, 
            enum: ['pending', 'verified', 'rejected'], 
            default: 'pending' 
        },
        googlePlaceId: { type: String, index: { unique: true, sparse: true } },
        googleMapsUrl: { type: String },
        importBatchId: { type: String, index: true },
        sourcePriority: { type: Number, default: 50 },
        importedAt: { type: Date },

        // Enrichment fields
        subjects: [{ type: String, trim: true }],
        classes: [{ type: String, trim: true }],
        courses: [{ type: String, trim: true }],
        boards: [{ type: String, trim: true }],
        examPreparation: [{ type: String, trim: true }],
        skills: [{ type: String, trim: true }],
        whatsappNumber: { type: String, trim: true },
        socialLinks: {
            facebook: { type: String, trim: true },
            instagram: { type: String, trim: true },
            youtube: { type: String, trim: true },
        },
        enrichedDescription: { type: String, trim: true },

        // AI Enrichment Metadata
        autoExtracted: { type: Boolean, default: false },
        extractionSource: { type: String, enum: ['website', 'reviews', 'mixed'] },
        extractionConfidence: { type: Schema.Types.Mixed },
        lastEnrichedAt: { type: Date },
        enrichmentVersion: { type: Number, default: 0 },
        manuallyEditedFields: [{ type: String, default: [] }],

        // ── New optional fields (no defaults to preserve legacy document state) ──
        isOrganisation: { type: Boolean }, // No default — undefined = unknown for gym_yoga
        gender: { type: String, enum: ['male', 'female', 'alien'] },
        dateOfBirth: { type: Date }, // Never returned in public API responses
        serviceModes: [{ type: String, enum: ['online', 'offline', 'student_home', 'provider_home'] }],
        learnerLevels: [{ type: String, enum: ['foundation', 'intermediate', 'advanced', 'all'] }],
        teachingStyles: [{ type: String, enum: ['patient','concept_focused','exam_oriented','interactive','practice_intensive','visual_learning','step_by_step','fast_paced','gentle'] }],
        availability: [{
            day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
            slots: [{
                startTime: { type: String }, // HH:mm, 24h, Asia/Kolkata implied
                endTime:   { type: String },
            }],
        }],
        serviceRadiusKm: { type: Number, min: 0, max: 200 },
        bioSource: { type: String, enum: ['user','admin','ai_generated','deterministic','imported'] },
        bioGeneratedAt: { type: Date },
    },
    { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

ProfileSchema.index({ location: '2dsphere' });
ProfileSchema.index({ type: 1, _subjectIndex: 1, _classIndex: 1 });
ProfileSchema.index({ verificationStatus: 1, isActive: 1, _subjectIndex: 1, _classIndex: 1, 'rating.score': -1 });
ProfileSchema.index({ slug: 1 }, { unique: true });
ProfileSchema.index({ isFeatured: 1, verificationStatus: 1, isActive: 1 });
// Sparse indexes for new filterable fields — do not force presence on all documents
ProfileSchema.index({ gender: 1 }, { sparse: true });
ProfileSchema.index({ languages: 1 }, { sparse: true });
ProfileSchema.index({ serviceModes: 1 }, { sparse: true });

export const Profile = mongoose.model<IProfileDocument>('Profile', ProfileSchema);