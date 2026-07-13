/**
 * Backfill Bio Generator Script
 *
 * Generates bios for all active profiles that have no bio set (or only
 * have a bio that was auto-imported and is still the placeholder text).
 *
 * Usage:
 *   npx ts-node server/src/scripts/backfill-bios.ts [options]
 *   Options:
 *     --dry-run        Do not save results (logs what would be generated)
 *     --batch-size=N   Process N profiles at a time (default: 5)
 *     --delay-ms=N     Wait N ms between batches (default: 1000)
 *     --type=TYPE      Only process profiles of this type
 *
 * Safety:
 *   - Idempotent: skips profiles that already have a user/admin-authored bio
 *   - Rate-limited: configurable delay between batches
 *   - Non-destructive: never overwrites manually authored bios
 */

import 'dotenv/config';
import { connectDB } from '../config/db';
import { Profile } from '../models';
import { generateBioIfMissing } from '../modules/profiles/bioGenerator.service';

const isDryRun  = process.argv.includes('--dry-run');
const typeArg   = process.argv.find(a => a.startsWith('--type='));
const batchArg  = process.argv.find(a => a.startsWith('--batch-size='));
const delayArg  = process.argv.find(a => a.startsWith('--delay-ms='));

const profileType = typeArg  ? typeArg.split('=')[1]  : undefined;
const batchSize   = batchArg ? parseInt(batchArg.split('=')[1]) : 5;
const delayMs     = delayArg ? parseInt(delayArg.split('=')[1]) : 1000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  await connectDB();
  console.log(`[BackfillBios] Connected. dry-run=${isDryRun}, batch=${batchSize}, delay=${delayMs}ms`);
  if (profileType) console.log(`[BackfillBios] Filtering by type: ${profileType}`);

  // Query: profiles with empty bio AND (no bioSource OR bioSource not in user/admin)
  const query: any = {
    isActive: true,
    $or: [
      { bio: { $exists: false } },
      { bio: '' },
      { bio: 'Imported from Google Maps.' }, // default importer placeholder
    ],
    bioSource: { $nin: ['user', 'admin'] },
  };

  if (profileType) query.type = profileType;

  const total = await Profile.countDocuments(query);
  console.log(`[BackfillBios] Found ${total} profiles needing bio generation.`);

  if (total === 0) {
    console.log('[BackfillBios] Nothing to do. Exiting.');
    process.exit(0);
  }

  let processed = 0;
  let succeeded = 0;
  let skipped   = 0;

  for (let skip = 0; skip < total; skip += batchSize) {
    const batch = await Profile.find(query).skip(skip).limit(batchSize).lean();

    await Promise.all(batch.map(async (rawProfile) => {
      processed++;
      if (isDryRun) {
        console.log(`[BackfillBios] [DRY-RUN] Would generate bio for: ${rawProfile.displayName} (${rawProfile._id})`);
        skipped++;
        return;
      }

      try {
        // Re-fetch as a live document so generateBioIfMissing can call profile.save() path
        const liveProfile = await Profile.findById(rawProfile._id);
        if (!liveProfile) { skipped++; return; }

        await generateBioIfMissing(liveProfile);
        succeeded++;
        console.log(`[BackfillBios] Generated bio for: ${liveProfile.displayName} (${liveProfile._id})`);
      } catch (err: any) {
        console.warn(`[BackfillBios] Failed for ${rawProfile._id}: ${err.message}`);
        skipped++;
      }
    }));

    console.log(`[BackfillBios] Progress: ${Math.min(skip + batchSize, total)}/${total}`);

    if (skip + batchSize < total) {
      await sleep(delayMs);
    }
  }

  console.log(`
[BackfillBios] Done.
  Total found:  ${total}
  Processed:    ${processed}
  Succeeded:    ${succeeded}
  Skipped/err:  ${skipped}
  `);
  process.exit(0);
}

main().catch(err => {
  console.error('[BackfillBios] Fatal error:', err);
  process.exit(1);
});

