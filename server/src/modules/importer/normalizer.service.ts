import slugify from 'slugify';
import { ProfileType } from '@dooars/shared';
import { RawScrapedData, NormalizedData } from './types';

export function normalizeName(name: string): string {
  return name.trim();
}

export function generateSlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

export function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Remove non-numeric characters except +
  return phone.replace(/[^\d+]/g, '');
}

export function mapCategoryToType(googleCategory?: string): ProfileType {
  const cat = (googleCategory || '').toLowerCase();

  if (cat.includes('dance') || cat.includes('music') || cat.includes('singing') || cat.includes('art') || cat.includes('drawing')) {
    return 'arts_trainer';
  }
  if (cat.includes('gym') || cat.includes('yoga') || cat.includes('fitness')) {
    return 'gym_yoga';
  }
  if (cat.includes('sports') || cat.includes('cricket') || cat.includes('football') || cat.includes('martial arts') || cat.includes('karate')) {
    return 'sports_trainer';
  }
  if (cat.includes('coaching') || cat.includes('computer') || cat.includes('technical school') || cat.includes('education') || cat.includes('abacus')) {
    return 'coaching_center';
  }

  return 'coaching_center'; // Default fallback
}

export function parseAddress(address: string): NormalizedData['addressLines'] {
  const parts = address.split(',').map(p => p.trim());
  
  // Very basic parser for Indian addresses
  // Expecting: Line 1, Area, Town, District, State, Pincode
  // Google Maps addresses are often: "Shop No, Street, Area, Town, State Pincode, Country"
  
  const pincodeMatch = address.match(/\b\d{6}\b/);
  const pincode = pincodeMatch ? pincodeMatch[0] : '';
  
  const state = parts[parts.length - 2]?.replace(/\d/g, '').trim() || 'West Bengal';
  const town = parts[parts.length - 3] || 'Alipurduar';
  
  return {
    line1: parts[0] || '',
    area: parts[1] || '',
    town: town,
    district: 'Alipurduar', // Hardcoded as per request
    state: state,
    pincode: pincode
  };
}

export function normalizeData(raw: RawScrapedData): NormalizedData {
  return {
    ...raw,
    name: normalizeName(raw.name),
    slug: generateSlug(raw.name),
    phone: normalizePhone(raw.phone),
    type: mapCategoryToType(raw.category),
    addressLines: parseAddress(raw.address)
  };
}
