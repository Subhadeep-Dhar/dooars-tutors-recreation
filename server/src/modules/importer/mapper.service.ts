import { User, IProfileDocument } from '../../models';
import { NormalizedData } from './types';
import mongoose from 'mongoose';

let cachedAdminId: mongoose.Types.ObjectId | null = null;

async function getImporterUserId(): Promise<mongoose.Types.ObjectId> {
  if (cachedAdminId) return cachedAdminId;

  const admin = await User.findOne({ role: 'admin' });
  if (admin) {
    cachedAdminId = admin._id as mongoose.Types.ObjectId;
    return cachedAdminId;
  }

  throw new Error('No admin user found to assign imported profiles');
}

export async function mapToProfile(data: NormalizedData): Promise<any> {
  const userId = await getImporterUserId();

  return {
    userId,
    type: data.type,
    displayName: data.name,
    slug: `${data.slug}-${data.googlePlaceId.substring(0, 8)}`, // Ensure uniqueness
    bio: `Imported from Google Maps. ${data.category || ''}`,
    location: {
      type: 'Point',
      coordinates: [data.longitude, data.latitude]
    },
    address: data.addressLines,
    contact: {
      phone: data.phone,
      website: data.website
    },
    rating: {
      average: data.rating || 0,
      count: data.reviewCount || 0
    },
    source: 'google_maps',
    googlePlaceId: data.googlePlaceId,
    verificationStatus: 'pending',
    isApproved: false,
    isActive: true,
    importedAt: new Date(),
    teachingSlots: [] // To be filled later if possible
  };
}
