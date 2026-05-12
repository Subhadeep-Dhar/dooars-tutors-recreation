import { v4 as uuidv4 } from 'uuid';
import { RawPlace, Profile, ImportSummary, EnrichmentJob } from '../../models';
import { importerLogger } from './logger';
import { PlaywrightService } from './playwright.service';
import { normalizeData } from './normalizer.service';
import { findDuplicate } from './dedupe.service';
import { mapToProfile } from './mapper.service';
import { getOrCreateSystemImporterUser } from './user.helper';
import { ImporterConfig, ImportStats } from './types';

export class ImporterWorker {
  private playwright: PlaywrightService;
  private config: ImporterConfig;
  private dryRun: boolean;

  constructor(config: Partial<ImporterConfig> & { dryRun?: boolean } = {}) {
    const { dryRun = false, ...rest } = config;
    this.dryRun = dryRun;
    this.config = {
      headless: true,
      delayMs: [2000, 5000],
      maxListings: 5,
      maxScrolls: 10,
      contextResetInterval: 10,
      ...rest
    };
    this.playwright = new PlaywrightService(this.config);
  }

  async run(keywords: string[]) {
    const batchId = `batch_${Date.now()}_${uuidv4().substring(0, 8)}`;
    const startTime = new Date();
    
    const stats: ImportStats = {
      totalScraped: 0,
      imported: 0,
      duplicatesSkipped: 0,
      failed: 0,
      partial: 0
    };

    const summary = await ImportSummary.create({
      batchId,
      startTime,
      keywords,
      config: {
        headless: this.config.headless,
        maxListings: this.config.maxListings,
        delayMs: this.config.delayMs
      }
    });

    importerLogger.info(`Starting import session. BatchID: ${batchId}`);
    
    try {
      const systemUser = await getOrCreateSystemImporterUser();
      await this.playwright.init();

      for (const keyword of keywords) {
        importerLogger.info(`Processing keyword: ${keyword}`);
        const scrapedItems = await this.playwright.scrapeKeyword(keyword);
        stats.totalScraped += scrapedItems.length;
        
        for (const raw of scrapedItems) {
          try {
            // 1. Save to Raw Collection
            const rawEntry = await RawPlace.create({
              source: 'google_maps',
              keyword,
              importBatchId: batchId,
              googleMapsUrl: raw.googleMapsUrl,
              rawData: raw,
              importedAt: new Date(),
              processed: false,
              scrapeStatus: raw.warnings?.length ? 'partial' : 'success',
              warnings: raw.warnings
            });

            if (rawEntry.scrapeStatus === 'partial') stats.partial++;

            // 2. Normalize
            const normalized = normalizeData(raw);

            // 3. Deduplicate
            const existing = await findDuplicate(normalized);
            if (existing) {
              importerLogger.info(`Skipping duplicate: ${normalized.name}`);
              stats.duplicatesSkipped++;
              continue;
            }

            // 4. Map to Profile
            const profileData = await mapToProfile(normalized);
            
            // Assign systemic fields
            profileData.userId = systemUser._id;
            profileData.importBatchId = batchId;
            profileData.googleMapsUrl = raw.googleMapsUrl;
            profileData.sourcePriority = 50;
            profileData.verificationStatus = 'pending';
            profileData.isApproved = false; // Backward compatibility

            if (this.dryRun) {
              importerLogger.info(`[DRY RUN] Would import: ${profileData.displayName}`);
              stats.imported++; // Still count as "would be imported" for stats
              continue;
            }

            // 5. Save Profile
            const profile = await Profile.create(profileData);
            stats.imported++;
            importerLogger.info(`Successfully imported: ${profile.displayName}`);

            // 6. Queue Enrichment Job (Graceful degradation - failure here doesn't stop import)
            try {
              await EnrichmentJob.create({
                profileId: profile._id,
                importBatchId: batchId,
                metadata: {
                  websiteUrl: raw.website,
                  hasReviews: (raw.reviews?.length || 0) > 0
                }
              });
              importerLogger.debug(`Queued enrichment job for: ${profile.displayName}`);
            } catch (jobErr) {
              importerLogger.error(`Failed to queue enrichment job for ${profile.displayName}`, jobErr);
            }

            // 7. Mark Raw as processed
            rawEntry.processed = true;
            await rawEntry.save();

          } catch (err: any) {
            importerLogger.error(`Error processing item ${raw.name}`, err);
            stats.failed++;
          }
        }
      }
    } catch (err: any) {
      importerLogger.error('Critical worker error', err);
      summary.importErrors.push(err.message || 'Unknown critical error');
    } finally {
      await this.playwright.close();
      
      const endTime = new Date();
      summary.endTime = endTime;
      summary.stats = stats;
      await summary.save();

      importerLogger.info('Import session finished', { batchId, stats, duration: `${(endTime.getTime() - startTime.getTime()) / 1000}s` });
    }

    return { batchId, stats };
  }
}
