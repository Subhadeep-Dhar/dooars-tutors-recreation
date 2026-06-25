import 'dotenv/config';
import { connectDB } from './src/config/db';
import { Review } from './src/models/Review';
import { Report } from './src/models/Report';
import mongoose from 'mongoose';

async function run() {
  try {
    await connectDB();
    console.log('Connected to DB');

    // Drop unique index on Review
    try {
      await Review.collection.dropIndex('profileId_1_reviewerId_1');
      console.log('Dropped unique index on Review');
    } catch (e: any) {
      console.log('Index profileId_1_reviewerId_1 on Review may not exist or already dropped', e.message);
    }

    // Ensure index on Report is unique for (reporterId, reportedProfileId)
    // First, let's try to create it. If it fails, maybe there are duplicates. If we don't have duplicates it's fine.
    try {
      await Report.collection.createIndex({ reporterId: 1, reportedProfileId: 1 }, { unique: true });
      console.log('Created unique index on Report');
    } catch (e: any) {
      console.log('Failed to create unique index on Report. There might be duplicate reports.', e.message);
    }

  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

run();
