import 'dotenv/config';
import { connectDB } from '../config/db';
import { Profile, EnrichmentJob } from '../models';

async function testManual() {
  await connectDB();
  const profile = await Profile.findOne({ displayName: /Youth Vocational/i });
  if (profile) {
    console.log(`Simulating manual edit for: ${profile.displayName}`);
    profile.subjects = ['Manual Subject'];
    profile.manuallyEditedFields = ['subjects'];
    await profile.save();
    
    // Reset job
    await EnrichmentJob.updateOne({ profileId: profile._id }, { status: 'pending', retries: 0 });
  }
  process.exit(0);
}
testManual();
