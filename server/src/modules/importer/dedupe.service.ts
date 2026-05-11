import { Profile } from '../../models';
import { NormalizedData } from './types';

export async function findDuplicate(data: NormalizedData): Promise<any | null> {
  // 1. Check by Google Place ID
  if (data.googlePlaceId) {
    const existing = await Profile.findOne({ googlePlaceId: data.googlePlaceId });
    if (existing) return existing;
  }

  // 2. Check by Normalized Name + Phone
  if (data.phone) {
    const existing = await Profile.findOne({
      displayName: { $regex: new RegExp(`^${data.name}$`, 'i') },
      'contact.phone': data.phone
    });
    if (existing) return existing;
  }

  // 3. Check by Normalized Name + Coordinates (within small radius)
  const existingByLoc = await Profile.findOne({
    displayName: { $regex: new RegExp(`^${data.name}$`, 'i') },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [data.longitude, data.latitude] },
        $maxDistance: 100 // 100 meters
      }
    }
  });

  return existingByLoc;
}
