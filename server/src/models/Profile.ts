import mongoose, { Document, Schema } from 'mongoose';
import { ProfileType, BoardType, MediumType, MediaCategory } from '@dooars/shared';

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
        line1: string;
        area?: string;
        town: string;
        district: string;
        state: string;
        pincode: string;
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
    isApproved: boolean;
    isFeatured: boolean;
    isActive: boolean;
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
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
            line1: { type: String, required: true, trim: true },
            area: { type: String, trim: true },
            town: { type: String, required: true, trim: true },
            district: { type: String, required: true, trim: true },
            state: { type: String, required: true, trim: true },
            pincode: { type: String, required: true, trim: true },
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
        },

        isApproved: { type: Boolean, default: false },
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

ProfileSchema.index({ location: '2dsphere' });
ProfileSchema.index({ type: 1, _subjectIndex: 1, _classIndex: 1 });
ProfileSchema.index({ isApproved: 1, isActive: 1, _subjectIndex: 1, _classIndex: 1, 'rating.average': -1 });
ProfileSchema.index({ slug: 1 }, { unique: true });
ProfileSchema.index({ isFeatured: 1, isApproved: 1, isActive: 1 });

export const Profile = mongoose.model<IProfileDocument>('Profile', ProfileSchema);