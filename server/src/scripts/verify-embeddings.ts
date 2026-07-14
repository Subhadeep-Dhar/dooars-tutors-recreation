import 'dotenv/config';
import mongoose from 'mongoose';
import { ProfileEmbedding } from '../models/ProfileEmbedding';
import { ragConfig } from '../config/rag.config';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dooars_tutors';

async function verify() {
  await mongoose.connect(MONGODB_URI);
  
  const embeddings = await ProfileEmbedding.find().exec();
  console.log(`Total embeddings found: ${embeddings.length}`);

  let invalidDimensions = 0;
  let nonFiniteValues = 0;
  let modelMismatches = 0;
  let schemaMismatches = 0;
  let hashInconsistencies = 0; // if empty
  const profileIds = new Set();
  let duplicates = 0;
  let hasActivities = 0;

  for (const doc of embeddings) {
    if (profileIds.has(doc.profileId.toString())) {
      duplicates++;
    }
    profileIds.add(doc.profileId.toString());

    if (!doc.embedding || doc.embedding.length !== ragConfig.embedding.dimensions) {
      invalidDimensions++;
    } else {
      for (const val of doc.embedding) {
        if (typeof val !== 'number' || !Number.isFinite(val)) {
          nonFiniteValues++;
          break; // count once per doc
        }
      }
    }

    if (doc.model !== ragConfig.embedding.model) modelMismatches++;
    if (doc.dimensions !== ragConfig.embedding.dimensions) invalidDimensions++; // Metadata mismatch
    if (doc.schemaVersion !== ragConfig.embedding.schemaVersion) schemaMismatches++;
    if (!doc.contentHash) hashInconsistencies++;
    if (doc.activities && doc.activities.length > 0) hasActivities++;
  }

  console.log('\n--- Integrity Report ---');
  console.log(`Valid Documents: ${embeddings.length - duplicates - invalidDimensions - nonFiniteValues - modelMismatches - schemaMismatches - hashInconsistencies}`);
  console.log(`Duplicates: ${duplicates}`);
  console.log(`Invalid Dimensions: ${invalidDimensions}`);
  console.log(`Non-Finite Values: ${nonFiniteValues}`);
  console.log(`Model Mismatches: ${modelMismatches}`);
  console.log(`Schema Mismatches: ${schemaMismatches}`);
  console.log(`Hash Inconsistencies: ${hashInconsistencies}`);
  console.log(`Documents with non-empty activities array: ${hasActivities}`);

  await mongoose.disconnect();
}

verify().catch(console.error);
