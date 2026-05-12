import 'dotenv/config';
import { connectDB } from '../config/db';
import { EnrichmentWorker } from '../modules/importer/enrichment.worker';
import { importerLogger } from '../modules/importer/logger';

async function main() {
  try {
    await connectDB();
    importerLogger.info('Connected to MongoDB for enrichment worker');

    const isDryRun = process.argv.includes('--dry-run');
    const batchSizeArg = process.argv.find(arg => arg.startsWith('--batch-size='));
    const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 3;

    if (isDryRun) {
      importerLogger.info('DRY RUN MODE ENABLED - No changes will be saved to profiles');
    }

    importerLogger.info(`Starting enrichment worker. Batch size: ${batchSize}`);
    
    const worker = new EnrichmentWorker(isDryRun);
    await worker.processPendingJobs(batchSize);

    importerLogger.info('✅ Enrichment session completed');
    process.exit(0);
  } catch (err) {
    importerLogger.error('❌ Enrichment session failed', err);
    process.exit(1);
  }
}

main();
