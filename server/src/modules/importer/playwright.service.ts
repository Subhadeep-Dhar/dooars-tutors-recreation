import { chromium, Browser, Page } from 'playwright';
import { importerLogger } from './logger';
import { RawScrapedData, ImporterConfig } from './types';

const DEFAULT_CONFIG: ImporterConfig = {
  headless: true,
  delayMs: [2000, 5000],
  maxListings: 5
};

export class PlaywrightService {
  private browser: Browser | null = null;
  private config: ImporterConfig;

  constructor(config: Partial<ImporterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async sleep(ms?: number) {
    const time = ms || Math.floor(Math.random() * (this.config.delayMs[1] - this.config.delayMs[0])) + this.config.delayMs[0];
    return new Promise(resolve => setTimeout(resolve, time));
  }

  async init() {
    this.browser = await chromium.launch({ headless: this.config.headless });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeKeyword(keyword: string): Promise<RawScrapedData[]> {
    if (!this.browser) await this.init();
    const context = await this.browser!.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const results: RawScrapedData[] = [];
    try {
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}`;
      importerLogger.info(`Navigating to ${searchUrl}`);
      await page.goto(searchUrl);
      await this.sleep(3000); // Wait for results to load

      // Scroll the results pane if it exists
      const resultsPaneSelector = 'div[role="feed"]';
      const pane = await page.$(resultsPaneSelector);
      if (pane) {
          importerLogger.debug('Found results pane, scrolling...');
          for (let i = 0; i < 3; i++) {
              await page.mouse.wheel(0, 1000);
              await this.sleep(1000);
          }
      }

      // Selectors for listing titles
      // Note: These are fragile but common in GMap as of 2024
      const listingSelector = 'a.hfpxzc'; 
      const listings = await page.$$(listingSelector);
      
      importerLogger.info(`Found ${listings.length} listings. Processing max ${this.config.maxListings}`);

      for (let i = 0; i < Math.min(listings.length, this.config.maxListings); i++) {
        try {
          const listing = listings[i];
          await listing.click();
          await this.sleep(2000); // Wait for details pane

          const data = await this.extractDetails(page);
          if (data) {
              results.push(data);
              importerLogger.info(`Extracted: ${data.name}`);
          }
          
          await this.sleep();
        } catch (err) {
          importerLogger.error(`Error processing listing ${i}`, err);
        }
      }

    } catch (err) {
      importerLogger.error(`Error scraping keyword ${keyword}`, err);
    } finally {
      await context.close();
    }

    return results;
  }

  private async extractDetails(page: Page): Promise<RawScrapedData | null> {
    try {
        const name = await page.innerText('h1.DUwDvf').catch(() => '');
        if (!name) return null;

        const address = await page.getAttribute('button[data-item-id="address"]', 'aria-label').catch(() => '');
        const phone = await page.getAttribute('button[data-item-id^="phone:tel:"]', 'aria-label').catch(() => '');
        const website = await page.getAttribute('a[data-item-id="authority"]', 'href').catch(() => '');
        const ratingText = await page.innerText('div.F7kYVb').catch(() => '0');
        const reviewCountText = await page.innerText('span.e07Mpf').catch(() => '0');
        const category = await page.innerText('button.DkEaL').catch(() => '');
        
        const mapsUrl = page.url();
        const coordsMatch = mapsUrl.match(/!3d([-.\d]+)!4d([-.\d]+)/);
        const latitude = coordsMatch ? parseFloat(coordsMatch[1]) : 0;
        const longitude = coordsMatch ? parseFloat(coordsMatch[2]) : 0;

        // Extract Place ID from URL if possible or generate one from name+coords
        const placeIdMatch = mapsUrl.match(/ChI[a-zA-Z0-9-_]+/);
        const googlePlaceId = placeIdMatch ? placeIdMatch[0] : `gen_${Buffer.from(name + latitude + longitude).toString('hex').substring(0, 16)}`;

        return {
            name,
            address: address?.replace(/^Address: /, '') || '',
            phone: phone?.replace(/^Phone: /, '') || '',
            website: website || '',
            rating: parseFloat(ratingText.replace(',', '.')) || 0,
            reviewCount: parseInt(reviewCountText.replace(/[^\d]/g, '')) || 0,
            category,
            latitude,
            longitude,
            googleMapsUrl: mapsUrl,
            googlePlaceId
        };
    } catch (err) {
        importerLogger.error('Error extracting details', err);
        return null;
    }
  }
}
