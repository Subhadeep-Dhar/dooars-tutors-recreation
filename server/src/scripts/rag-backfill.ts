import 'dotenv/config';
import mongoose from 'mongoose';
import { parseArgs } from 'util';
import { Profile } from '../models/Profile';
import { ProfileEmbedding } from '../models/ProfileEmbedding';
import { EmbeddingBuilder } from '../modules/profiles/embedding.builder';
import { EmbeddingService } from '../modules/profiles/embedding.service';
import { ragConfig } from '../config/rag.config';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dooars_tutors';

async function run() {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      'limit': { type: 'string' },
      'profile-id': { type: 'string' },
      'concurrency': { type: 'string', default: '3' },
    }
  });

  const isDryRun = values['dry-run'];
  const limit = values.limit ? parseInt(values.limit, 10) : 0;
  const profileId = values['profile-id'];
  const concurrency = parseInt(values.concurrency as string, 10);

  console.log('--- RAG Embedding Backfill ---');
  console.log(`Dry Run: ${isDryRun}`);
  console.log(`Limit: ${limit || 'None'}`);
  console.log(`Concurrency: ${concurrency}`);
  if (profileId) console.log(`Target Profile ID: ${profileId}`);
  console.log('------------------------------');

  await mongoose.connect(MONGODB_URI);
  
  const query = profileId ? { _id: profileId } : {};
  let dbQuery = Profile.find(query);
  if (limit > 0) {
    dbQuery = dbQuery.limit(limit);
  }

  const profiles = await dbQuery.exec();
  
  const stats = {
    scanned: 0,
    eligible: 0,
    ineligible: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    
    // Detailed dry-run stats
    missingEmbeddings: 0,
    staleByHash: 0,
    staleByModel: 0,
    staleByDimensions: 0,
    staleBySchemaVersion: 0
  };

  const service = new EmbeddingService();

  // Simple concurrency implementation
  const queue = [...profiles];
  
  const worker = async () => {
    while (queue.length > 0) {
      const profile = queue.shift();
      if (!profile) continue;

      stats.scanned++;
      const isEligible = EmbeddingBuilder.isProfileEligibleForRag(profile);

      if (!isEligible) {
        stats.ineligible++;
        if (!isDryRun) {
          await service.syncProfile(profile); // This will handle deletion of ineligible docs
        }
        continue;
      }

      stats.eligible++;
      const canonicalText = EmbeddingBuilder.buildCanonicalText(profile);
      const contentHash = EmbeddingBuilder.generateHash(canonicalText);

      const existing = await ProfileEmbedding.findOne({ profileId: profile._id });

      let isFresh = true;
      if (!existing) {
        stats.missingEmbeddings++;
        isFresh = false;
      } else if (existing.contentHash !== contentHash) {
        stats.staleByHash++;
        isFresh = false;
      } else if (existing.model !== ragConfig.embedding.model) {
        stats.staleByModel++;
        isFresh = false;
      } else if (existing.dimensions !== ragConfig.embedding.dimensions) {
        stats.staleByDimensions++;
        isFresh = false;
      } else if (existing.schemaVersion !== ragConfig.embedding.schemaVersion) {
        stats.staleBySchemaVersion++;
        isFresh = false;
      }

      if (isDryRun) {
        if (isFresh) {
          stats.skipped++;
        } else {
          stats.updated++; // Treat as 'would update/create'
        }
      } else {
        const result = await service.syncProfile(profile);
        if (result.status === 'created') stats.created++;
        else if (result.status === 'updated') stats.updated++;
        else if (result.status === 'skipped') stats.skipped++;
        else if (result.status === 'error') stats.failed++;
      }
    }
  };

  const workers = Array(Math.min(concurrency, profiles.length)).fill(0).map(() => worker());
  await Promise.all(workers);

  await mongoose.disconnect();

  console.log('\n--- Final Results ---');
  console.log(`Scanned: ${stats.scanned}`);
  console.log(`Eligible: ${stats.eligible}`);
  console.log(`Ineligible: ${stats.ineligible}`);
  if (isDryRun) {
    console.log(`Would Create/Update: ${stats.updated + stats.created}`);
    console.log(`Would Skip (Unchanged): ${stats.skipped}`);
    console.log('\n--- Stale Breakdown ---');
    console.log(`Missing Embeddings: ${stats.missingEmbeddings}`);
    console.log(`Stale By Hash: ${stats.staleByHash}`);
    console.log(`Stale By Model: ${stats.staleByModel}`);
    console.log(`Stale By Dimensions: ${stats.staleByDimensions}`);
    console.log(`Stale By Schema Version: ${stats.staleBySchemaVersion}`);
  } else {
    console.log(`Created: ${stats.created}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Skipped Unchanged: ${stats.skipped}`);
    console.log(`Failed: ${stats.failed}`);
  }
}

run().catch(err => {
  console.error('Fatal error running backfill:', err);
  process.exit(1);
});
