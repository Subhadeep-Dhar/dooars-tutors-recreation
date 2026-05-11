import { RawPlace, Profile } from '../../models';
import { importerLogger } from './logger';
import { PlaywrightService } from './playwright.service';
import { normalizeData } from './normalizer.service';
import { findDuplicate } from './dedupe.service';
import { mapToProfile } from './mapper.service';
import { ImporterConfig } from './types';

export class ImporterWorker {
  private playwright: PlaywrightService;

  constructor(config: Partial<ImporterConfig> = {}) {
    this.playwright = new PlaywrightService(config);
  }

  async run(keywords: string[]) {
    importerLogger.info(`Starting import for ${keywords.length} keywords`);
    
    try {
      await this.playwright.init();

      for (const keyword of keywords) {
        importerLogger.info(`Processing keyword: ${keyword}`);
        const scrapedItems = await this.playwright.scrapeKeyword(keyword);
        
        for (const raw of scrapedItems) {
          try {
            // 1. Save to Raw Collection
            await RawPlace.create({
              source: 'google_maps',
              keyword,
              rawData: raw,
              importedAt: new Date(),
              processed: false
            });

            // 2. Normalize
            const normalized = normalizeData(raw);

            // 3. Deduplicate
            const existing = await findDuplicate(normalized);
            if (existing) {
              importerLogger.info(`Skipping duplicate: ${normalized.name} (${existing._id})`);
              continue;
            }

            // 4. Map to Profile
            const profileData = await mapToProfile(normalized);

            // 5. Save as Pending
            const profile = await Profile.create(profileData);
            importerLogger.info(`Imported new profile: ${profile.displayName} (${profile._id})`);

            // 6. Mark Raw as processed
            await RawPlace.updateOne(
              { 'rawData.googlePlaceId': raw.googlePlaceId },
              { $set: { processed: true } }
            );

          } catch (err: any) {
            importerLogger.error(`Error processing item ${raw.name}`, err);
            await RawPlace.updateOne(
              { 'rawData.googlePlaceId': raw.googlePlaceId },
              { $push: { processingErrors: err.message } }
            );
          }
        }
      }
    } catch (err) {
      importerLogger.error('Critical worker error', err);
    } finally {
      await this.playwright.close();
      importerLogger.info('Import process finished');
    }
  }
}
