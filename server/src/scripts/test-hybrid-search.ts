import 'dotenv/config';
import mongoose from 'mongoose';
import { HybridSearchService } from '../modules/profiles/hybrid-search.service';

async function main() {
  const args = process.argv.slice(2);
  let query = '';
  let limit = 10;
  let lat: number | undefined;
  let lng: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--query' && args[i + 1]) {
      query = args[++i];
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[++i], 10);
    } else if (args[i] === '--lat' && args[i + 1]) {
      lat = parseFloat(args[++i]);
    } else if (args[i] === '--lng' && args[i + 1]) {
      lng = parseFloat(args[++i]);
    }
  }

  if (!query) {
    console.error("Usage: npx tsx src/scripts/test-hybrid-search.ts --query <text> [--limit <number>] [--lat <lat>] [--lng <lng>]");
    process.exit(1);
  }

  console.log(`[Hybrid CLI] Connecting to DB...`);
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dooars-tutors');

  console.log(`[Hybrid CLI] Executing query: "${query}"`);
  const service = new HybridSearchService();

  try {
    const input: any = { query, limit };
    if (lat !== undefined && lng !== undefined) {
      input.userLocation = { latitude: lat, longitude: lng };
    }
    const result = await service.search(input);
    console.log('\n[Hybrid CLI] Diagnostics:');
    console.log(JSON.stringify(result.diagnostics, null, 2));
    console.log(`\n[Hybrid CLI] Results (${result.results.length}):`);
    for (const r of result.results) {
      const p = r.profile;
      console.log(` - ID: ${r.profileId} | Score: ${r.score.toFixed(4)}${r.distanceKm !== undefined ? ` | Dist: ${r.distanceKm.toFixed(1)}km` : ''} | Type: ${p.type} | Gen: ${p.gender}`);
    }
  } catch (error: any) {
    console.error(`\n[Hybrid CLI] Error: ${error.name} - ${error.message}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
