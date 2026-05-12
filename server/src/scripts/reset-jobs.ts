import 'dotenv/config';
import { connectDB } from '../config/db';
import { EnrichmentJob } from '../models/EnrichmentJob';

async function run() {
  await connectDB();
  const res = await EnrichmentJob.updateMany({}, { status: 'pending', retries: 0, nextRunAt: new Date() });
  console.log(`Reset ${res.modifiedCount} jobs to pending`);
  process.exit(0);
}
run();
