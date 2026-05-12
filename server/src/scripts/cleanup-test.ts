import 'dotenv/config';
import { connectDB } from '../config/db';
import { Profile, EnrichmentJob, RawPlace } from '../models';

async function cleanup() {
  await connectDB();
  const names = [
    /DOOARS SCHOOL/i,
    /Alipurduar Youth Computer/i,
    /Youth Vocational Computer/i
  ];

  for (const name of names) {
    const profile = await Profile.findOne({ displayName: name });
    if (profile) {
      console.log(`Deleting profile: ${profile.displayName}`);
      await EnrichmentJob.deleteMany({ profileId: profile._id });
      await Profile.deleteOne({ _id: profile._id });
    }
  }
  
  // Also cleanup RawPlace to avoid confusion
  await RawPlace.deleteMany({ keyword: 'computer coaching alipurduar' });

  console.log('Cleanup complete');
  process.exit(0);
}

cleanup();
