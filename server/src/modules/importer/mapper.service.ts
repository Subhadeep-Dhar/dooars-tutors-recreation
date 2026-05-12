import { NormalizedData } from './types';

/**
 * Maps normalized data to the Profile schema format.
 * Pure function - does not interact with DB directly.
 */
export async function mapToProfile(data: NormalizedData): Promise<any> {
  return {
    type: data.type,
    displayName: data.name,
    slug: `${data.slug}-${data.googlePlaceId.substring(0, 8)}`, // Ensure uniqueness
    bio: `Imported from Google Maps.`,
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
    googleMapsUrl: data.googleMapsUrl,
    verificationStatus: 'pending',
    isApproved: false, // Backward compatibility, unified with verificationStatus: pending
    isActive: true,
    sourcePriority: 50,
    importedAt: new Date(),
    teachingSlots: [] 
  };
}
