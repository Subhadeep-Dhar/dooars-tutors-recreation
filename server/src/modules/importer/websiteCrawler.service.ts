import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium, Browser, Page } from 'playwright';
import { importerLogger } from './logger';

const CRAWL_BLOCKLIST = [
  'facebook.com',
  'instagram.com',
  'youtube.com',
  'twitter.com',
  'linkedin.com',
  'wa.me',
  'api.whatsapp',
  '.pdf',
  '.doc',
  '.docx',
  '.zip'
];

export interface CrawlerOutput {
  url: string;
  html: string;
  source: 'axios' | 'playwright';
}

export class WebsiteCrawlerService {
  private browser: Browser | null = null;
  private domainCache: Set<string> = new Set();
  private maxPages: number = 5;

  constructor(private readonly playwrightEnabled: boolean = true) {}

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isBlocked(url: string): boolean {
    return CRAWL_BLOCKLIST.some(blocked => url.toLowerCase().includes(blocked));
  }

  async crawl(baseUrl: string): Promise<CrawlerOutput[]> {
    if (!baseUrl || this.isBlocked(baseUrl)) return [];

    const results: CrawlerOutput[] = [];
    const visited = new Set<string>();
    const queue = [baseUrl];
    const domain = new URL(baseUrl).hostname;

    importerLogger.info(`Starting crawl for domain: ${domain}`);

    while (queue.length > 0 && results.length < this.maxPages) {
      const url = queue.shift()!;
      if (visited.has(url) || !url.includes(domain) || this.isBlocked(url)) continue;

      visited.add(url);
      
      try {
        importerLogger.debug(`Crawling page [${results.length + 1}/${this.maxPages}]: ${url}`);
        
        // 1. Try Axios first
        try {
          const response = await axios.get(url, { 
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          
          if (response.status === 200 && response.data) {
            results.push({ url, html: response.data, source: 'axios' });
            this.extractLinks(response.data, baseUrl, queue, visited);
          }
        } catch (axiosErr) {
          importerLogger.warn(`Axios failed for ${url}, falling back to Playwright...`);
          
          if (this.playwrightEnabled) {
            const pwResult = await this.crawlWithPlaywright(url);
            if (pwResult) {
              results.push({ url, html: pwResult, source: 'playwright' });
              this.extractLinks(pwResult, baseUrl, queue, visited);
            }
          }
        }

        await this.sleep(Math.floor(Math.random() * 3000) + 2000); // Randomized delay
      } catch (err) {
        importerLogger.error(`Crawl error for ${url}`, err);
      }
    }

    return results;
  }

  private extractLinks(html: string, baseUrl: string, queue: string[], visited: Set<string>) {
    const $ = cheerio.load(html);
    const domain = new URL(baseUrl).hostname;

    $('a').each((_, el) => {
      let href = $(el).attr('href');
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, baseUrl).toString();
        if (absoluteUrl.includes(domain) && !visited.has(absoluteUrl) && !this.isBlocked(absoluteUrl)) {
          // Priority to interesting pages
          const interesting = ['about', 'service', 'course', 'contact', 'subject', 'class'].some(word => href?.toLowerCase().includes(word));
          if (interesting) {
            queue.unshift(absoluteUrl); // Prioritize
          } else {
            queue.push(absoluteUrl);
          }
        }
      } catch {}
    });
  }

  private async crawlWithPlaywright(url: string): Promise<string | null> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    
    const context = await this.browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.sleep(2000); // Wait for potential dynamic content
      const html = await page.content();
      return html;
    } catch (err) {
      importerLogger.error(`Playwright crawl failed for ${url}`, err);
      return null;
    } finally {
      await page.close();
      await context.close();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
