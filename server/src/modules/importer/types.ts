import { ProfileType } from '@dooars/shared';

export interface RawScrapedData {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  googlePlaceId: string;
}

export interface NormalizedData extends Omit<RawScrapedData, 'category'> {
  type: ProfileType;
  slug: string;
  addressLines: {
    line1: string;
    area?: string;
    town: string;
    district: string;
    state: string;
    pincode: string;
  };
}

export interface ImporterConfig {
  headless: boolean;
  delayMs: [number, number]; // [min, max]
  maxListings: number;
}
