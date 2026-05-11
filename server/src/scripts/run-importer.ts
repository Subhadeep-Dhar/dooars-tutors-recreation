import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { ImporterWorker } from '../modules/importer/importer.worker';
import { connectDB } from '../config/db';

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const worker = new ImporterWorker({
      headless: true, // Set to false to watch it work
      maxListings: 3  // Safe small batch for testing
    });

    const keywords = [
      'computer coaching alipurduar',
      // 'dance classes alipurduar',
      // 'music school alipurduar'
    ];

    await worker.run(keywords);

    console.log('✅ Import script finished successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Import script failed:', err);
    process.exit(1);
  }
}

main();
