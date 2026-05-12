import crypto from 'crypto';
import { Profile, EnrichmentData, EnrichmentJob } from '../../models';
import { WebsiteCrawlerService } from './websiteCrawler.service';
import { ContentProcessorService } from './contentProcessor.service';
import { AiParserService } from './aiParser.service';
import { importerLogger } from './logger';
import { EnrichmentResult } from './types';

export class EnrichmentWorker {
  private crawler: WebsiteCrawlerService;
  private processor: ContentProcessorService;
  private ai: AiParserService;
  private readonly ENRICHMENT_VERSION = 1;

  constructor(private dryRun: boolean = false) {
    this.crawler = new WebsiteCrawlerService();
    this.processor = new ContentProcessorService();
    this.ai = new AiParserService();
  }

  async processPendingJobs(batchSize: number = 3) {
    const jobs = await EnrichmentJob.find({
      status: { $in: ['pending', 'failed'] },
      nextRunAt: { $lte: new Date() }
    })
    .sort({ priority: -1, createdAt: 1 })
    .limit(batchSize);

    importerLogger.info(`Found ${jobs.length} pending enrichment jobs.`);

    for (const job of jobs) {
      await this.processJob(job);
    }

    await this.crawler.close();
  }

  private async processJob(job: any) {
    importerLogger.info(`Processing job for profile: ${job.profileId}`);
    job.status = 'processing';
    await job.save();

    try {
      const profile = await Profile.findById(job.profileId);
      if (!profile) {
        job.status = 'permanent_failure';
        job.errors.push({ message: 'Profile not found', timestamp: new Date() });
        await job.save();
        return;
      }

      // 1. Crawl website if available
      let websiteContent = '';
      let crawlMetrics = { crawlDurationMs: 0, pagesVisited: 0, source: 'axios' as const };
      let websiteHash = '';

      if (job.metadata.websiteUrl) {
        const startTime = Date.now();
        const pages = await this.crawler.crawl(job.metadata.websiteUrl);
        crawlMetrics.crawlDurationMs = Date.now() - startTime;
        crawlMetrics.pagesVisited = pages.length;
        crawlMetrics.source = pages.some(p => p.source === 'playwright') ? 'playwright' : 'axios';

        const processedPages = pages.map(p => this.processor.process(p.html));
        websiteContent = processedPages.map(p => p.fullTextSummary).join('\n\n');
        websiteHash = crypto.createHash('md5').update(websiteContent).digest('hex');

        // Check cache/stale
        const existingData = await EnrichmentData.findOne({ profileId: profile._id }).sort({ lastCrawledAt: -1 });
        if (existingData && existingData.websiteHash === websiteHash && profile.enrichmentVersion === this.ENRICHMENT_VERSION) {
          importerLogger.info(`Website content unchanged for ${profile.displayName}. Skipping AI processing.`);
          job.status = 'completed';
          await job.save();
          return;
        }

        // Store raw snippets
        if (!this.dryRun) {
          await EnrichmentData.create({
            profileId: profile._id,
            websiteUrl: job.metadata.websiteUrl,
            websiteHash,
            snippets: {
              headings: processedPages.flatMap(p => p.headings),
              about: processedPages[0]?.aboutText,
              services: processedPages.flatMap(p => p.services),
              courses: processedPages.flatMap(p => p.courses),
              contactBlocks: processedPages.flatMap(p => p.contactBlocks)
            },
            metrics: crawlMetrics,
            lastCrawledAt: new Date()
          });
        }
      }

      // 2. AI Enrichment
      const reviews = profile.googlePlaceId ? await this.getRawReviews(profile) : [];
      const aiStartTime = Date.now();
      const enrichment = await this.ai.parseContent(websiteContent, reviews);
      const aiDurationMs = Date.now() - aiStartTime;

      if (enrichment) {
        if (this.dryRun) {
          importerLogger.info(`[DRY RUN] Enrichment for ${profile.displayName}:`, JSON.stringify(enrichment, null, 2));
        } else {
          await this.applyEnrichment(profile, enrichment);
          profile.lastEnrichedAt = new Date();
          profile.enrichmentVersion = this.ENRICHMENT_VERSION;
          profile.autoExtracted = true;
          await profile.save();
        }
      }

      job.status = 'completed';
      await job.save();
      importerLogger.info(`Successfully enriched: ${profile.displayName}`);

    } catch (err: any) {
      importerLogger.error(`Job failed for ${job.profileId}`, err);
      job.status = job.retries >= job.maxRetries ? 'permanent_failure' : 'failed';
      job.retries += 1;
      job.nextRunAt = new Date(Date.now() + Math.pow(2, job.retries) * 60000); // Exp backoff
      job.errors.push({ message: err.message, timestamp: new Date() });
      await job.save();
    }
  }

  private async applyEnrichment(profile: any, enrichment: EnrichmentResult) {
    const fieldsToUpdate = [
      'subjects', 'classes', 'courses', 'boards', 'examPreparation', 'skills', 'whatsappNumber', 'enrichedDescription'
    ];

    for (const field of fieldsToUpdate) {
      // Field-level manual protection
      if (profile.manuallyEditedFields.includes(field)) {
        importerLogger.debug(`Skipping manually edited field: ${field} for ${profile.displayName}`);
        continue;
      }

      const newValue = (enrichment as any)[field];
      if (newValue) {
        // Simple sanitization for strings
        if (typeof newValue === 'string') {
          profile[field] = this.processor.sanitize(newValue);
        } else if (Array.isArray(newValue)) {
          profile[field] = newValue.map(v => typeof v === 'string' ? this.processor.sanitize(v) : v);
        } else {
          profile[field] = newValue;
        }
      }
    }

    // Social links specific merge
    if (enrichment.socialLinks && !profile.manuallyEditedFields.includes('socialLinks')) {
      profile.socialLinks = { ...profile.socialLinks, ...enrichment.socialLinks };
    }

    // Confidence merge
    profile.extractionConfidence = { ...profile.extractionConfidence, ...enrichment.confidence };
    profile.extractionSource = enrichment.source;
  }

  private async getRawReviews(profile: any): Promise<string[]> {
    // In a real scenario, we might fetch from RawPlace or Review model
    // For now, we'll try to find the RawPlace data associated with this profile
    const raw = await import('../../models').then(m => m.RawPlace.findOne({ googlePlaceId: profile.googlePlaceId }));
    return raw?.rawData?.reviews || [];
  }
}
