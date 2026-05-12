import * as cheerio from 'cheerio';

export interface ProcessedContent {
  headings: string[];
  aboutText: string;
  services: string[];
  courses: string[];
  contactBlocks: string[];
  fullTextSummary: string;
}

export class ContentProcessorService {
  private readonly MAX_SNIPPET_LENGTH = 1000;
  private readonly MAX_TOTAL_TEXT = 15000;

  process(html: string): ProcessedContent {
    const $ = cheerio.load(html);

    // 1. Strip noise
    $('script, style, nav, footer, iframe, noscript, .cookie-banner, .popup').remove();

    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text) headings.push(text);
    });

    const contactBlocks: string[] = [];
    $('[class*="contact"], [id*="contact"], .footer-bottom, address').each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (text.length > 10) contactBlocks.push(text.substring(0, this.MAX_SNIPPET_LENGTH));
    });

    // Extract potential sections
    let aboutText = '';
    $('[class*="about"], #about, .introduction').each((_, el) => {
      aboutText += $(el).text().trim() + '\n';
    });

    const services: string[] = [];
    $('[class*="service"], #services, .offerings').each((_, el) => {
      const text = $(el).text().trim();
      if (text) services.push(text.substring(0, this.MAX_SNIPPET_LENGTH));
    });

    const courses: string[] = [];
    $('[class*="course"], #courses, .curriculum, .syllabus').each((_, el) => {
      const text = $(el).text().trim();
      if (text) courses.push(text.substring(0, this.MAX_SNIPPET_LENGTH));
    });

    // Cleanup text
    const fullText = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();

    return {
      headings: [...new Set(headings)].slice(0, 20),
      aboutText: aboutText.substring(0, 2000).trim(),
      services: [...new Set(services)].slice(0, 10),
      courses: [...new Set(courses)].slice(0, 15),
      contactBlocks: [...new Set(contactBlocks)].slice(0, 5),
      fullTextSummary: fullText.substring(0, this.MAX_TOTAL_TEXT)
    };
  }

  /**
   * Simple sanitization to prevent script injection in extracted text
   */
  sanitize(text: string): string {
    return text
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
      .replace(/on\w+="[^"]*"/gim, '')
      .replace(/javascript:/gim, '');
  }
}
