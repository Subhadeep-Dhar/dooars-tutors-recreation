import test from 'node:test';
import assert from 'node:assert';
import { SemanticSearchService } from './semantic-search.service';

test('SemanticSearchService', async (t) => {
  const service = new SemanticSearchService();

  await t.test('normalizeAndValidateQuery', async (t) => {
    await t.test('should reject non-string queries', () => {
      assert.throws(() => service.normalizeAndValidateQuery(123 as any), /must be a string/);
    });

    await t.test('should reject empty or whitespace queries', () => {
      assert.throws(() => service.normalizeAndValidateQuery(''), /cannot be empty/);
      assert.throws(() => service.normalizeAndValidateQuery('   '), /cannot be empty/);
    });

    await t.test('should trim leading/trailing whitespace', () => {
      assert.strictEqual(service.normalizeAndValidateQuery('  hello world  '), 'hello world');
    });

    await t.test('should reject queries exceeding 500 characters', () => {
      const longQuery = 'a'.repeat(501);
      assert.throws(() => service.normalizeAndValidateQuery(longQuery), /exceeds maximum length/);
    });
  });

  await t.test('buildVectorSearchFilter', async (t) => {
    await t.test('should enforce mandatory eligibility filters even with no input', () => {
      const filter = service.buildVectorSearchFilter();
      assert.deepStrictEqual(filter, {
        $and: [
          { isActive: { $eq: true } },
          { verificationStatus: { $eq: 'verified' } }
        ]
      });
    });

    await t.test('should append optional filters correctly', () => {
      const filter = service.buildVectorSearchFilter({
        type: ['tutor'],
        providerKind: ['individual'],
        gender: 'female',
        subjects: ['math'],
        minExperience: 5,
        maxBudget: 2000,
        minRating: 4.5
      });

      assert.deepStrictEqual(filter, {
        $and: [
          { isActive: { $eq: true } },
          { verificationStatus: { $eq: 'verified' } },
          { type: { $in: ['tutor'] } },
          { providerKind: { $in: ['individual'] } },
          { gender: { $eq: 'female' } },
          { subjects: { $in: ['math'] } },
          { experience: { $gte: 5 } },
          { ratingAverage: { $gte: 4.5 } },
          { minFee: { $lte: 2000 } }
        ]
      });
    });
  });

  await t.test('generateQueryEmbedding vector validation', async (t) => {
    // We can access private method via bracket notation for unit testing the strict boundary
    const validate = async (mockVector: any) => {
      const orig = (service as any).genAI.getGenerativeModel;
      (service as any).genAI.getGenerativeModel = () => ({
        embedContent: async () => ({ embedding: { values: mockVector } })
      });
      try {
        await (service as any).generateQueryEmbedding('test');
        return true;
      } catch (e: any) {
        return e.message;
      } finally {
        (service as any).genAI.getGenerativeModel = orig;
      }
    };

    await t.test('should reject non-array', async () => {
      const res = await validate('not an array');
      assert.match(res as string, /not an array/);
    });

    await t.test('should reject wrong dimensions', async () => {
      const res = await validate([1, 2, 3]);
      assert.match(res as string, /Dimension mismatch/);
    });

    await t.test('should reject NaN', async () => {
      const badVector = Array(3072).fill(0);
      badVector[10] = NaN;
      const res = await validate(badVector);
      assert.match(res as string, /Invalid vector value/);
    });

    await t.test('should reject Infinity', async () => {
      const badVector = Array(3072).fill(0);
      badVector[10] = Infinity;
      const res = await validate(badVector);
      assert.match(res as string, /Invalid vector value/);
    });

    await t.test('should accept valid vector', async () => {
      const goodVector = Array(3072).fill(0.123);
      const res = await validate(goodVector);
      assert.strictEqual(res, true);
    });
  });
});
