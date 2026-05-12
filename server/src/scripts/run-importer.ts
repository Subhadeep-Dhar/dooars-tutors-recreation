import 'dotenv/config';
import { env } from '../config/env';
import { ImporterWorker } from '../modules/importer/importer.worker';
import { connectDB } from '../config/db';
import { importerLogger } from '../modules/importer/logger';

async function main() {
  try {
    await connectDB();
    importerLogger.info('Connected to MongoDB');

    const isDryRun = process.argv.includes('--dry-run');
    if (isDryRun) {
      importerLogger.info('DRY RUN MODE ENABLED - No changes will be saved to profiles');
    }

    const worker = new ImporterWorker({
      headless: env.IMPORTER_HEADLESS,
      maxListings: 3,
      delayMs: [env.IMPORTER_DELAY_MIN, env.IMPORTER_DELAY_MAX],
      maxScrolls: env.IMPORTER_MAX_SCROLLS,
      contextResetInterval: env.IMPORTER_CONTEXT_RESET_INTERVAL,
      dryRun: isDryRun
    });

    const keywords = [
      'computer coaching alipurduar',
    ];

    const result = await worker.run(keywords);

    importerLogger.info('✅ Import session completed', result);
    process.exit(0);
  } catch (err) {
    importerLogger.error('❌ Import session failed', err);
    process.exit(1);
  }
}

main();
