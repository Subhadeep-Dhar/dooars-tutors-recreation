import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env before importing models
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { ProfileEmbedding } from '../models/ProfileEmbedding';
import { Profile } from '../models/Profile';
import { EmbeddingBuilder } from '../modules/profiles/embedding.builder';

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log(`Starting ProfileEmbedding activities backfill...`);
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (No writes)' : 'WRITE (Modifying database)'}`);

  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const embeddings = await ProfileEmbedding.find({});
  console.log(`Found ${embeddings.length} ProfileEmbedding documents.`);

  let updatedCount = 0;
  let unchangedCount = 0;
  let missingProfileCount = 0;
  let errorCount = 0;

  for (const embeddingDoc of embeddings) {
    try {
      const profile = await Profile.findById(embeddingDoc.profileId);
      
      if (!profile) {
        missingProfileCount++;
        continue;
      }

      const snapshot = EmbeddingBuilder.buildFilterSnapshot(profile);
      const expectedActivities = snapshot.activities;
      
      // Check if update is needed
      let needsUpdate = false;
      const currentActivities = embeddingDoc.activities;

      if (!expectedActivities && currentActivities && currentActivities.length > 0) {
        needsUpdate = true;
      } else if (expectedActivities && (!currentActivities || currentActivities.length !== expectedActivities.length)) {
        needsUpdate = true;
      } else if (expectedActivities && currentActivities) {
        // Deep compare sorted arrays
        for (let i = 0; i < expectedActivities.length; i++) {
          if (expectedActivities[i] !== currentActivities[i]) {
            needsUpdate = true;
            break;
          }
        }
      }

      if (needsUpdate) {
        if (!isDryRun) {
          await ProfileEmbedding.updateOne(
            { _id: embeddingDoc._id },
            { $set: { activities: expectedActivities || undefined } }
          );
        }
        updatedCount++;
      } else {
        unchangedCount++;
      }

    } catch (error) {
      console.error(`Error processing ProfileEmbedding ${embeddingDoc._id}:`, error);
      errorCount++;
    }
  }

  console.log('\n--- Migration Results ---');
  console.log(`Total documents processed: ${embeddings.length}`);
  console.log(`Documents to update: ${updatedCount}`);
  console.log(`Documents unchanged: ${unchangedCount}`);
  console.log(`Documents with missing profiles: ${missingProfileCount}`);
  console.log(`Errors encountered: ${errorCount}`);
  
  if (isDryRun) {
    console.log('\nThis was a DRY-RUN. No documents were modified.');
  } else {
    console.log('\nMigration completed successfully.');
  }

  await mongoose.disconnect();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
