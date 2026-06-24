import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Profile, User, Review } from '../models';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = 'mongodb+srv://subhadeepdhar563_db_user:test123@cluster0.f3bfe3m.mongodb.net/dooars_dev?retryWrites=true&w=majority';

const BAD_PROFILES = [
  "DOOARS SCHOOL",
  "Alipurduar Youth Computer",
  "Youth Vocational Computer",
  "GURUKUL",
  "AfterZ",
  "Step up & Dance"
];

const M = 5;
const C = 3.5;

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  // 1. Delete profiles
  for (const name of BAD_PROFILES) {
    const profile = await Profile.findOne({ displayName: new RegExp(name, 'i') });
    if (profile) {
      console.log(`Deleting profile: ${profile.displayName}`);
      await User.findByIdAndDelete(profile.userId);
      await Review.deleteMany({ profileId: profile._id });
      await Profile.findByIdAndDelete(profile._id);
    } else {
      console.log(`Profile not found matching: ${name}`);
    }
  }

  // 2. Recalculate rating scores
  const allProfiles = await Profile.find({});
  let updated = 0;
  for (const p of allProfiles) {
    const count = p.rating?.count || 0;
    const avg = p.rating?.average || 0;
    const score = (count * avg + M * C) / (count + M);
    
    await Profile.findByIdAndUpdate(p._id, {
      'rating.score': Math.round(score * 100) / 100
    });
    updated++;
  }
  console.log(`Recalculated rating scores for ${updated} profiles.`);
  process.exit(0);
}

run().catch(console.error);
