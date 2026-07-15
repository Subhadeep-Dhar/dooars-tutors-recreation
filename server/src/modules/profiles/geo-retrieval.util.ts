import { Profile } from '../../models/Profile';
import { ragConfig } from '../../config/rag.config';

export class GeoRetrievalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeoRetrievalError';
  }
}

import mongoose from 'mongoose';

export interface GeoCandidate {
  profileId: mongoose.Types.ObjectId;
  distanceKm: number;
}

export class GeoRetrievalUtil {
  /**
   * Retrieves deterministic nearest-first geo candidates using $geoNear aggregation.
   * Only returns verified and active profiles.
   */
  public static async getGeoCandidates(
    lat: number,
    lng: number,
    radiusKm?: number,
    limit?: number
  ): Promise<GeoCandidate[]> {
    // 1. Independent validation at the trust boundary
    if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new GeoRetrievalError(`Invalid latitude: ${lat}`);
    }
    if (typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      throw new GeoRetrievalError(`Invalid longitude: ${lng}`);
    }

    const maxLimit = ragConfig.geo.maxCandidates;
    let safeLimit = typeof limit === 'number' && limit > 0 ? limit : maxLimit;
    if (safeLimit > maxLimit) safeLimit = maxLimit;

    const maxRadius = ragConfig.geo.maxRadiusKm;
    let effectiveRadius = typeof radiusKm === 'number' && radiusKm > 0 
      ? radiusKm 
      : ragConfig.geo.defaultRadiusKm;
    
    if (effectiveRadius > maxRadius) effectiveRadius = maxRadius;

    // 2. Execution of deterministic nearest-first retrieval
    try {
      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distance',
            maxDistance: effectiveRadius * 1000,
            distanceMultiplier: 0.001, // Convert meters to km
            spherical: true,
            query: {
              isActive: true,
              verificationStatus: 'verified'
            }
          }
        },
        {
          $limit: safeLimit
        },
        {
          $project: {
            _id: 1,
            distance: 1
          }
        }
      ];

      const results = await Profile.aggregate(pipeline as any[]).exec();

      return results.map(r => ({
        profileId: r._id,
        distanceKm: r.distance
      }));

    } catch (error: any) {
      // Do not swallow DB failures as zero matches
      throw new GeoRetrievalError(`Database geo-query failed: ${error.message}`);
    }
  }
}
