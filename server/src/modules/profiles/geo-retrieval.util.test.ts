import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { GeoRetrievalUtil, GeoRetrievalError } from './geo-retrieval.util';
import { Profile } from '../../models/Profile';
import { ragConfig } from '../../config/rag.config';

describe('GeoRetrievalUtil', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it('throws error for invalid latitude', async () => {
    await assert.rejects(
      GeoRetrievalUtil.getGeoCandidates(95, 0),
      GeoRetrievalError,
      'Invalid latitude: 95'
    );
  });

  it('throws error for invalid longitude', async () => {
    await assert.rejects(
      GeoRetrievalUtil.getGeoCandidates(0, 190),
      GeoRetrievalError,
      'Invalid longitude: 190'
    );
  });

  it('throws error for NaN or Infinity coordinates', async () => {
    await assert.rejects(GeoRetrievalUtil.getGeoCandidates(NaN, 0), GeoRetrievalError);
    await assert.rejects(GeoRetrievalUtil.getGeoCandidates(0, Infinity), GeoRetrievalError);
  });

  it('uses default near-me radius when radiusKm is omitted', async () => {
    let capturedPipeline: any;
    mock.method(Profile, 'aggregate', (pipeline: any) => {
      capturedPipeline = pipeline;
      return { exec: async () => [] };
    });

    await GeoRetrievalUtil.getGeoCandidates(0, 0);

    const geoNear = capturedPipeline[0].$geoNear;
    assert.strictEqual(geoNear.maxDistance, ragConfig.geo.defaultRadiusKm * 1000);
  });

  it('enforces mandatory eligibility criteria in geo query', async () => {
    let capturedPipeline: any;
    mock.method(Profile, 'aggregate', (pipeline: any) => {
      capturedPipeline = pipeline;
      return { exec: async () => [] };
    });

    await GeoRetrievalUtil.getGeoCandidates(0, 0);

    const query = capturedPipeline[0].$geoNear.query;
    assert.deepStrictEqual(query, { isActive: true, verificationStatus: 'verified' });
  });

  it('bounds radius and limit to max configured values', async () => {
    let capturedPipeline: any;
    mock.method(Profile, 'aggregate', (pipeline: any) => {
      capturedPipeline = pipeline;
      return { exec: async () => [] };
    });

    await GeoRetrievalUtil.getGeoCandidates(0, 0, 500, 1000); // Exceeds max 200 radius and max 500 candidates

    const geoNear = capturedPipeline[0].$geoNear;
    const limitStage = capturedPipeline[1].$limit;

    assert.strictEqual(geoNear.maxDistance, ragConfig.geo.maxRadiusKm * 1000);
    assert.strictEqual(limitStage, ragConfig.geo.maxCandidates);
  });

  it('returns mapped GeoCandidates natively from $geoNear', async () => {
    mock.method(Profile, 'aggregate', () => {
      return {
        exec: async () => [
          { _id: 'profile1', distance: 5.5 },
          { _id: 'profile2', distance: 12.1 }
        ]
      };
    });

    const candidates = await GeoRetrievalUtil.getGeoCandidates(22.5, 88.3);
    assert.strictEqual(candidates.length, 2);
    assert.deepStrictEqual(candidates[0], { profileId: 'profile1', distanceKm: 5.5 });
    assert.deepStrictEqual(candidates[1], { profileId: 'profile2', distanceKm: 12.1 });
  });

  it('throws GeoRetrievalError on database failure, not swallowing as zero matches', async () => {
    mock.method(Profile, 'aggregate', () => {
      return {
        exec: async () => {
          throw new Error('MongoDB connection failed');
        }
      };
    });

    await assert.rejects(
      GeoRetrievalUtil.getGeoCandidates(0, 0),
      GeoRetrievalError,
      'Database geo-query failed: MongoDB connection failed'
    );
  });

  it('returns empty array when no candidates match', async () => {
    mock.method(Profile, 'aggregate', () => {
      return {
        exec: async () => []
      };
    });

    const candidates = await GeoRetrievalUtil.getGeoCandidates(0, 0);
    assert.strictEqual(candidates.length, 0);
  });
});
