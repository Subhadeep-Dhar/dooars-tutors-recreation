import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { importerLogger } from './logger';
import { RawScrapedData, ImporterConfig } from './types';
import { ParserService } from './parser.service';

const DEFAULT_CONFIG: ImporterConfig = {
  headless: true,
  delayMs: [2000, 5000],
  maxListings: 5,
  maxScrolls: 10,
  contextResetInterval: 10
};

export class PlaywrightService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: ImporterConfig;
  private parser: ParserService;
  private processedInContext: number = 0;

  constructor(config: Partial<ImporterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.parser = new ParserService();
  }

  private async sleep(ms?: number) {
    const time = ms || Math.floor(Math.random() * (this.config.delayMs[1] - this.config.delayMs[0])) + this.config.delayMs[0];
    return new Promise(resolve => setTimeout(resolve, time));
  }

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({ 
        headless: this.config.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
    }
    await this.resetContext();
  }

  private async resetContext() {
    if (this.context) {
      importerLogger.debug('Recycling browser context...');
      await this.context.close();
    }
    this.context = await this.browser!.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });
    this.processedInContext = 0;
  }

  async close() {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    this.browser = null;
    this.context = null;
  }

  async scrapeKeyword(keyword: string): Promise<RawScrapedData[]> {
    if (!this.browser) await this.init();
    
    const page = await this.context!.newPage();
    const results: RawScrapedData[] = [];

    try {
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}`;
      importerLogger.info(`Navigating to ${searchUrl}`);
      
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('div[role="feed"]', { timeout: 30000 }).catch(() => importerLogger.warn('Results pane not found after navigation'));
      await this.sleep(3000);

      // ── Infinite Scroll Protection ─────────────────────────────────────────
      const resultsPaneSelector = 'div[role="feed"]';
      let scrollAttempts = 0;
      let noNewResultsCount = 0;
      let lastListingCount = 0;

      while (scrollAttempts < this.config.maxScrolls) {
        const currentListings = await page.$$('a.hfpxzc');
        
        if (currentListings.length >= this.config.maxListings) break;
        
        if (currentListings.length === lastListingCount) {
          noNewResultsCount++;
          if (noNewResultsCount > 3) break; // Stuck
        } else {
          noNewResultsCount = 0;
        }

        lastListingCount = currentListings.length;
        await page.mouse.wheel(0, 2000);
        await this.sleep(1500);
        scrollAttempts++;
      }

      // ── Listing Processing ─────────────────────────────────────────────────
      const listingHandles = await page.$$('a.hfpxzc');
      const toProcess = Math.min(listingHandles.length, this.config.maxListings);
      
      importerLogger.info(`Found ${listingHandles.length} listings. Processing ${toProcess}`);

      for (let i = 0; i < toProcess; i++) {
        // Context recycling check
        if (this.processedInContext >= this.config.contextResetInterval) {
          await this.resetContext();
          // Need to navigate back if we reset context mid-keyword (but usually we do it between keywords or every X listings)
          // For simplicity, we'll reset context ONLY between keywords or if a threshold is hit.
          // Let's stick to simple recycling for now.
        }

        try {
          // Re-fetch handles after potential navigation/scrolling
          const freshHandles = await page.$$('a.hfpxzc');
          const handle = freshHandles[i];
          if (!handle) continue;

          await handle.click();
          await this.sleep(2500); // Wait for details pane

          const data = await this.parser.extractListingDetails(page);
          if (data) {
            results.push(data);
            this.processedInContext++;
            importerLogger.info(`[${i+1}/${toProcess}] Extracted: ${data.name}`);
          }

          await this.sleep();
        } catch (err) {
          importerLogger.error(`Error processing listing ${i}`, err);
        }
      }

    } catch (err) {
      importerLogger.error(`Error scraping keyword ${keyword}`, err);
    } finally {
      await page.close();
    }

    return results;
  }
}
