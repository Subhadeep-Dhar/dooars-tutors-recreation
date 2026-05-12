import { Page } from 'playwright';
import { RawScrapedData } from './types';
import { importerLogger } from './logger';

/**
 * Handles DOM extraction logic from Google Maps pages.
 * Decoupled from browser navigation.
 */
export class ParserService {
  async extractListingDetails(page: Page): Promise<RawScrapedData | null> {
    try {
      // 1. Extract Name (H1)
      const name = await page.innerText('h1.DUwDvf').catch(() => '');
      if (!name) return null;

      // 2. Extract Basic Info
      const address = await page.getAttribute('button[data-item-id="address"]', 'aria-label').catch(() => '');
      const phone = await page.getAttribute('button[data-item-id^="phone:tel:"]', 'aria-label').catch(() => '');
      const website = await page.getAttribute('a[data-item-id="authority"]', 'href').catch(() => '');
      const category = await page.innerText('button.DkEaL').catch(() => '');

      // 3. Extract Rating & Reviews
      const ratingText = await page.innerText('div.F7kYVb').catch(() => '0');
      const reviewCountText = await page.innerText('span.e07Mpf').catch(() => '0');
      
      const rating = parseFloat(ratingText.replace(',', '.')) || 0;
      const reviewCount = parseInt(reviewCountText.replace(/[^\d]/g, '')) || 0;

      // 4. Extract URL & Coordinates
      const mapsUrl = page.url();
      const coordsMatch = mapsUrl.match(/!3d([-.\d]+)!4d([-.\d]+)/);
      const latitude = coordsMatch ? parseFloat(coordsMatch[1]) : 0;
      const longitude = coordsMatch ? parseFloat(coordsMatch[2]) : 0;

      // 5. Extract/Generate Place ID
      const placeIdMatch = mapsUrl.match(/ChI[a-zA-Z0-9-_]+/);
      const googlePlaceId = placeIdMatch 
        ? placeIdMatch[0] 
        : `gen_${Buffer.from(name + latitude + longitude).toString('hex').substring(0, 16)}`;

      // 6. Validation Warnings
      const warnings: string[] = [];
      if (!address) warnings.push('Missing address');
      if (!phone) warnings.push('Missing phone');
      if (latitude === 0 || longitude === 0) warnings.push('Missing coordinates');

      return {
        name,
        address: address?.replace(/^Address: /, '') || '',
        phone: phone?.replace(/^Phone: /, '') || '',
        website: website || '',
        rating,
        reviewCount,
        category,
        latitude,
        longitude,
        googleMapsUrl: mapsUrl,
        googlePlaceId,
        warnings
      };
    } catch (err) {
      importerLogger.error('Error in ParserService.extractListingDetails', err);
      return null;
    }
  }
}
