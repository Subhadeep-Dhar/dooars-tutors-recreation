import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AtlasFilterBuilder } from './atlas-filter.builder';
import { ragConfig } from '../../config/rag.config';
import { AiSearchQueryPlan } from './query-parser.service';
import mongoose from 'mongoose';

describe('AtlasFilterBuilder', () => {

  it('builds mandatory eligibility and schema conditions', () => {
    const plan: any = { query: 'test', filters: {} };
    const filter = AtlasFilterBuilder.build(plan);

    assert.ok(filter.$and);
    assert.strictEqual(filter.$and.length, 3);
    assert.deepStrictEqual(filter.$and[0], { isActive: { $eq: true } });
    assert.deepStrictEqual(filter.$and[1], { verificationStatus: { $eq: 'verified' } });
    assert.deepStrictEqual(filter.$and[2], { schemaVersion: { $eq: ragConfig.embedding.schemaVersion } });
  });

  it('injects geo candidate IDs safely as ObjectIds', () => {
    const plan: any = { query: 'test', filters: {} };
    const geoCandidateIds = [
      new mongoose.Types.ObjectId('60b9b3b3e6b3f3b3b3b3b3b3'), 
      new mongoose.Types.ObjectId('60b9b3b3e6b3f3b3b3b3b3b4')
    ];
    
    const filter = AtlasFilterBuilder.build(plan, { geoCandidateIds });
    const profileIdCondition = filter.$and.find((c: any) => c.profileId);
    
    assert.ok(profileIdCondition);
    assert.ok(profileIdCondition.profileId!.$in![0] instanceof mongoose.Types.ObjectId);
    assert.strictEqual(profileIdCondition.profileId!.$in![0].toString(), '60b9b3b3e6b3f3b3b3b3b3b3');
  });

  it('injects empty array short-circuit if geo candidates are zero', () => {
    const plan: any = { query: 'test', filters: {} };
    const filter = AtlasFilterBuilder.build(plan, { geoCandidateIds: [] });
    
    const profileIdCondition = filter.$and.find((c: any) => c.profileId) as any;
    assert.ok(profileIdCondition.profileId!.$in);
    assert.strictEqual(profileIdCondition.profileId!.$in.length, 0);
  });

  it('filters taxonomy values procedurally via allowlist', () => {
    const plan: any = {
      query: 'test',
      filters: {
        type: ['tutor', 'hallucinated_type'] as any,
        gender: 'male',
        boards: ['CBSE', 'FakeBoard'] as any,
        serviceModes: ['online', 'telepathy'] as any
      }
    };
    
    const filter = AtlasFilterBuilder.build(plan);
    
    const typeCond = filter.$and.find((c: any) => c.type) as any;
    assert.ok(typeCond);
    assert.deepStrictEqual(typeCond.type.$in, ['tutor']); // Discarded hallucination

    const boardCond = filter.$and.find((c: any) => c.boards) as any;
    assert.ok(boardCond);
    assert.deepStrictEqual(boardCond.boards.$in, ['CBSE']); // Discarded FakeBoard

    const modeCond = filter.$and.find((c: any) => c.serviceModes) as any;
    assert.ok(modeCond);
    assert.deepStrictEqual(modeCond.serviceModes.$in, ['online']); // Discarded telepathy
  });

  it('discards unknown enum values completely if none are valid', () => {
    const plan: any = {
      query: 'test',
      filters: {
        type: ['hallucinated_type'] as any,
        gender: 'cyborg' as any
      }
    };
    
    const filter = AtlasFilterBuilder.build(plan);
    const typeCond = filter.$and.find((c: any) => c.type);
    const genderCond = filter.$and.find((c: any) => c.gender);
    
    assert.strictEqual(typeCond, undefined);
    assert.strictEqual(genderCond, undefined);
  });

  it('maps maxBudget to minFee <= maxBudget', () => {
    const plan: any = {
      query: 'test',
      filters: { maxBudget: 5000 }
    };
    
    const filter = AtlasFilterBuilder.build(plan);
    const feeCond = filter.$and.find((c: any) => c.minFee);
    
    assert.ok(feeCond);
    assert.deepStrictEqual(feeCond.minFee.$lte, 5000);
  });

  it('preserves academic vs non-academic fields distinctly', () => {
    const plan: any = {
      query: 'test',
      filters: {
        subjects: ['Math'],
        activities: ['Guitar']
      }
    };
    
    const filter = AtlasFilterBuilder.build(plan);
    const subCond = filter.$and.find((c: any) => c.subjects) as any;
    const actCond = filter.$and.find((c: any) => c.activities) as any;
    
    assert.deepStrictEqual(subCond.subjects.$in, ['Math']);
    assert.deepStrictEqual(actCond.activities.$in, ['Guitar']);
  });

  it('excludes learnerLevels from Atlas hard filter', () => {
    const plan: any = {
      query: 'test',
      filters: {
        studentLevels: ['beginner', 'all'] as any
      }
    };
    
    const filter = AtlasFilterBuilder.build(plan);
    const levelsCond = filter.$and.find((c: any) => c.studentLevels || c.learnerLevels);
    
    assert.strictEqual(levelsCond, undefined);
  });
  it('discards malicious operator-shaped input in taxonomy filters', () => {
    const plan: any = {
      query: 'test',
      filters: {
        type: [{ $ne: 'tutor' }] as any
      }
    };
    
    const filter = AtlasFilterBuilder.build(plan);
    const typeCond = filter.$and.find((c: any) => c.type);
    
    assert.strictEqual(typeCond, undefined);
  });

  it('handles duplicate filter values gracefully by passing them as-is (MongoDB handles $in duplicates)', () => {
    const plan: any = {
      query: 'test',
      filters: {
        type: ['tutor', 'tutor'] as any
      }
    };
    
    const filter = AtlasFilterBuilder.build(plan);
    const typeCond = filter.$and.find((c: any) => c.type) as any;
    
    assert.deepStrictEqual(typeCond.type.$in, ['tutor', 'tutor']);
  });

});
