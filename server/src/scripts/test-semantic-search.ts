import 'dotenv/config';
import mongoose from 'mongoose';
import { parseArgs } from 'util';
import { SemanticSearchService, SemanticSearchInput } from '../modules/profiles/semantic-search.service';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dooars_tutors';

async function run() {
  const { values } = parseArgs({
    options: {
      'query': { type: 'string' },
      'limit': { type: 'string', default: '10' },
      'type': { type: 'string' }, // optional filter
      'gender': { type: 'string' } // optional filter
    }
  });

  if (!values.query) {
    console.error('Usage: npx tsx src/scripts/test-semantic-search.ts --query "your semantic query" [--limit 10]');
    process.exit(1);
  }

  const query = values.query;
  const limit = parseInt(values.limit as string, 10);
  
  const filters: SemanticSearchInput['filters'] = {};
  if (values.type) filters.type = [values.type as any];
  if (values.gender) filters.gender = values.gender as any;

  console.log('--- Semantic Search Evaluation ---');
  console.log(`Query: "${query}"`);
  console.log(`Limit: ${limit}`);
  if (Object.keys(filters).length > 0) {
    console.log(`Filters: ${JSON.stringify(filters)}`);
  }
  console.log('----------------------------------\n');

  await mongoose.connect(MONGODB_URI);
  
  const service = new SemanticSearchService();
  const startTime = Date.now();

  try {
    const results = await service.search({
      query,
      limit,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    });

    const elapsed = Date.now() - startTime;
    console.log(`Retrieved ${results.length} results in ${elapsed}ms\n`);

    if (results.length === 0) {
      console.log('No results found.');
    } else {
      results.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.profile.displayName}`);
        console.log(`   Profile ID: ${r.profileId}`);
        console.log(`   Type: ${r.profile.type}`);
        console.log(`   Score: ${r.score.toFixed(4)}`);
        // Optional snippet context for debugging relevance
        if (r.profile.bio) {
          const snippet = r.profile.bio.substring(0, 100).replace(/\n/g, ' ');
          console.log(`   Bio Snippet: ${snippet}${r.profile.bio.length > 100 ? '...' : ''}`);
        }
        console.log('');
      });
    }
  } catch (err: any) {
    console.error('Search failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
