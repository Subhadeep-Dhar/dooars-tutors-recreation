import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { TaxonomyNormalizer } from './taxonomy-normalizer.util';
import { AiSearchQueryPlan } from './query-parser.service';

describe('TaxonomyNormalizer', () => {
  const basePlan: AiSearchQueryPlan = {
    originalQuery: 'test query',
    semanticQuery: 'test query',
    filters: {},
    preferences: {},
    parserMetadata: {
      parserVersion: 1,
      warnings: [],
    },
  };

  it('should return the plan unchanged if no filters exist', () => {
    const plan = { ...basePlan, filters: undefined } as any;
    const result = TaxonomyNormalizer.normalize(plan);
    assert.deepStrictEqual(result, plan);
  });

  it('should normalize subjects using aliases', () => {
    const plan: AiSearchQueryPlan = {
      ...basePlan,
      filters: {
        subjects: ['maths', 'science', 'BENGALI', 'unknown subject'],
      },
    };
    
    const result = TaxonomyNormalizer.normalize(plan);
    
    assert.ok(result.filters?.subjects?.includes('Mathematics'));
    assert.ok(result.filters?.subjects?.includes('Science'));
    assert.ok(result.filters?.subjects?.includes('Bengali'));
    assert.ok(result.filters?.subjects?.includes('unknown subject'));
    assert.strictEqual(result.filters?.subjects?.length, 4);
  });

  it('should deduplicate after normalization', () => {
    const plan: AiSearchQueryPlan = {
      ...basePlan,
      filters: {
        subjects: ['maths', 'math', 'Mathematics'],
      },
    };
    
    const result = TaxonomyNormalizer.normalize(plan);
    
    assert.deepStrictEqual(result.filters?.subjects, ['Mathematics']);
  });

  it('should normalize boards using aliases', () => {
    const plan: AiSearchQueryPlan = {
      ...basePlan,
      filters: {
        boards: ['cbse', 'isc', 'wbbse', 'Other'] as any,
      },
    };
    
    const result = TaxonomyNormalizer.normalize(plan);
    
    assert.ok(result.filters?.boards?.includes('CBSE'));
    assert.ok(result.filters?.boards?.includes('ICSE'));
    assert.ok(result.filters?.boards?.includes('State'));
    assert.ok(result.filters?.boards?.includes('Other'));
  });

  it('should normalize service modes using aliases', () => {
    const plan: AiSearchQueryPlan = {
      ...basePlan,
      filters: {
        serviceModes: ['online', 'at my house', 'center', 'offline'] as any,
      },
    };
    
    const result = TaxonomyNormalizer.normalize(plan);
    
    assert.ok(result.filters?.serviceModes?.includes('online'));
    assert.ok(result.filters?.serviceModes?.includes('student_home'));
    assert.ok(result.filters?.serviceModes?.includes('provider_home'));
    assert.ok(result.filters?.serviceModes?.includes('offline'));
  });
});
