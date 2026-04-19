import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '@dooars/shared';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: { url: string; publicId: string };
  isVerified: boolean;
  isActive: boolean;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['student', 'tutor', 'org', 'admin'],
      default: 'student',
      required: true,
    },
    avatar: {
      url: { type: String },
      publicId: { type: String },
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    refreshTokenHash: { type: String, select: false }, // never returned in queries
  },
  { timestamps: true }
);

export const User = mongoose.model<IUserDocument>('User', UserSchema);