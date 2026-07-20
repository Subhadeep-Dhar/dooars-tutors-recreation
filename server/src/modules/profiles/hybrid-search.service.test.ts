import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { HybridSearchService, LocationRequiredError, LocationResolutionRequiredError, DomainError, RetrievalUnavailableError } from './hybrid-search.service';
import { QueryParserService } from './query-parser.service';
import { SemanticSearchService } from './semantic-search.service';
import { GeoRetrievalUtil, GeoRetrievalError } from './geo-retrieval.util';
import { Profile } from '../../models/Profile';
import { TaxonomyNormalizer } from './taxonomy-normalizer.util';
import { AtlasFilterBuilder } from './atlas-filter.builder';
import { SlotValidatorUtil } from './slot-validator.util';

test('HybridSearchService', async (t) => {
  const queryParser = new QueryParserService();
  const semanticSearch = new SemanticSearchService();
  const service = new HybridSearchService(queryParser, semanticSearch);

  // Helper to mock QueryParser
  const mockParse = (plan: any) => {
    t.mock.method(queryParser, 'parseQuery', async () => plan);
  };

  // Helper to mock GeoRetrieval
  const mockGeo = (candidates: any[]) => {
    t.mock.method(GeoRetrievalUtil, 'getGeoCandidates', async () => candidates);
  };

  // Helper to mock SemanticSearch
  const mockVectorSearch = (results: any[]) => {
    t.mock.method(semanticSearch, 'executeVectorSearch', async () => results);
    // Ignore embeddings for tests
    t.mock.method(semanticSearch as any, 'generateQueryEmbedding', async () => Array(3072).fill(0.1));
  };

  // Helper to mock Profile hydration
  const mockProfileFind = (profiles: any[]) => {
    const execMock = async () => profiles;
    const leanMock = () => ({ exec: execMock });
    t.mock.method(Profile, 'find', () => ({ lean: leanMock }));
  };

  t.afterEach(() => {
    t.mock.restoreAll();
  });

  await t.test('Parser Fallback', async () => {
    mockParse({
      originalQuery: 'test',
      semanticQuery: 'test',
      filters: {},
      preferences: {},
      parserMetadata: { warnings: ["Structured parsing unavailable; semantic fallback used."] }
    });
    mockVectorSearch([]);

    const result = await service.search({ query: 'test' });
    assert.strictEqual(result.diagnostics.fallbackUsed, true);
    assert.strictEqual(result.diagnostics.geoApplied, false);
    assert.strictEqual(result.results.length, 0);
  });

  await t.test('Bubbles StructuredParsingUnavailableError on strict failure without generating embeddings or calling Atlas', async () => {
    class MockError extends Error {
      constructor() { super("Search is temporarily unable to safely apply all requested constraints. Please try again shortly."); this.name = 'StructuredParsingUnavailableError'; }
    }
    t.mock.method(queryParser, 'parseQuery', async () => {
      throw new MockError();
    });

    let embedCalled = false;
    let vectorSearchCalled = false;
    t.mock.method(semanticSearch as any, 'generateQueryEmbedding', async () => { embedCalled = true; return []; });
    t.mock.method(semanticSearch, 'executeVectorSearch', async () => { vectorSearchCalled = true; return []; });

    await assert.rejects(
      async () => service.search({ query: 'female tutor near me' }),
      (err: any) => err.name === 'StructuredParsingUnavailableError'
    );
    assert.strictEqual(embedCalled, false);
    assert.strictEqual(vectorSearchCalled, false);
  });

  await t.test('Missing Coordinates for Strict Geo (Radius)', async () => {
    mockParse({
      originalQuery: 'test within 10km',
      semanticQuery: 'test',
      filters: {},
      locationIntent: { radiusKm: 10 },
      parserMetadata: { warnings: [] }
    });

    await assert.rejects(
      async () => service.search({ query: 'test within 10km' }),
      LocationRequiredError
    );
  });

  await t.test('Missing Coordinates for Strict Geo (Nearest)', async () => {
    mockParse({
      originalQuery: 'nearest test',
      semanticQuery: 'test',
      filters: {},
      sortIntent: { preference: 'nearest' },
      parserMetadata: { warnings: [] }
    });

    await assert.rejects(
      async () => service.search({ query: 'nearest test' }),
      LocationRequiredError
    );
  });

  await t.test('Missing Coordinates for Near Me', async () => {
    mockParse({
      originalQuery: 'test near me',
      semanticQuery: 'test',
      filters: {},
      locationIntent: { }, // location intent present, no radius/place
      parserMetadata: { warnings: [] }
    });

    await assert.rejects(
      async () => service.search({ query: 'test near me' }),
      LocationRequiredError
    );
  });

  await t.test('Textual Unresolved Place', async () => {
    mockParse({
      originalQuery: 'test near Alipurduar',
      semanticQuery: 'test',
      filters: {},
      locationIntent: { placeText: 'Alipurduar' },
      parserMetadata: { warnings: [] }
    });

    await assert.rejects(
      async () => service.search({ query: 'test near Alipurduar' }),
      LocationResolutionRequiredError
    );
  });

  await t.test('Invalid Coordinates', async () => {
    mockParse({
      originalQuery: 'test near me',
      semanticQuery: 'test',
      filters: {},
      locationIntent: { radiusKm: 5 },
      parserMetadata: { warnings: [] }
    });
    t.mock.method(GeoRetrievalUtil, 'getGeoCandidates', async () => {
      throw new GeoRetrievalError("Invalid latitude: 900");
    });

    await assert.rejects(
      async () => service.search({ query: 'test near me', userLocation: { latitude: 900, longitude: 0 } }),
      DomainError
    );
  });

  await t.test('Zero Geo Candidates Short Circuit', async () => {
    mockParse({
      originalQuery: 'test near me',
      semanticQuery: 'test',
      filters: {},
      locationIntent: { radiusKm: 5 },
      parserMetadata: { warnings: [] }
    });
    mockGeo([]);

    // We can spy on SemanticSearch methods to ensure they are NOT called
    let vectorSearchCalled = false;
    let embedCalled = false;
    t.mock.method(semanticSearch, 'executeVectorSearch', async () => { vectorSearchCalled = true; return []; });
    t.mock.method(semanticSearch as any, 'generateQueryEmbedding', async () => { embedCalled = true; return []; });

    const result = await service.search({ query: 'test near me', userLocation: { latitude: 0, longitude: 0 } });
    
    assert.strictEqual(result.results.length, 0);
    assert.strictEqual(result.diagnostics.geoApplied, true);
    assert.strictEqual(result.diagnostics.geoCandidateCount, 0);
    assert.strictEqual(vectorSearchCalled, false);
    assert.strictEqual(embedCalled, false);
  });

  await t.test('Successful Pipeline Execution', async () => {
    const pid = new mongoose.Types.ObjectId();
    
    mockParse({
      originalQuery: 'maths tutor under 2000',
      semanticQuery: 'maths tutor',
      filters: { subjects: ['maths'], maxBudget: 2000 },
      parserMetadata: { warnings: [] }
    });

    // Mock Geo not required
    mockVectorSearch([{ profileId: pid.toString(), score: 0.95 }]);
    
    const mockProfile = {
      _id: pid,
      type: 'tutor',
      teachingSlots: [{ subject: 'Mathematics', feePerMonth: 1500 }]
    };
    mockProfileFind([mockProfile]);
    
    // Taxonomy Normalization ensures 'maths' -> 'Mathematics'
    // So SlotValidator should pass.
    
    // We also need to mock `toPublicSafeProfile` just to return the doc
    t.mock.method(semanticSearch, 'toPublicSafeProfile', (doc: any) => doc);

    const result = await service.search({ query: 'maths tutor under 2000' });
    
    assert.strictEqual(result.results.length, 1);
    assert.strictEqual(result.diagnostics.slotRejectedCount, 0);
    assert.strictEqual(result.results[0].score, 0.95);
  });

  await t.test('All Candidates Rejected by Slot Validation', async () => {
    const pid = new mongoose.Types.ObjectId();
    
    mockParse({
      originalQuery: 'maths tutor under 50', // Impossible budget
      semanticQuery: 'maths tutor',
      filters: { subjects: ['maths'], maxBudget: 50 },
      parserMetadata: { warnings: [] }
    });

    mockVectorSearch([{ profileId: pid.toString(), score: 0.95 }]);
    
    const mockProfile = {
      _id: pid,
      type: 'tutor',
      teachingSlots: [{ subject: 'Mathematics', feePerMonth: 1500 }] // Reject!
    };
    mockProfileFind([mockProfile]);

    const result = await service.search({ query: 'maths tutor under 50' });
    
    assert.strictEqual(result.results.length, 0);
    assert.strictEqual(result.diagnostics.slotRejectedCount, 1);
  });

  await t.test('Geo DB Failure throws RetrievalUnavailableError', async () => {
    mockParse({
      originalQuery: 'test near me',
      semanticQuery: 'test',
      filters: {},
      locationIntent: { radiusKm: 5 },
      parserMetadata: { warnings: [] }
    });
    t.mock.method(GeoRetrievalUtil, 'getGeoCandidates', async () => {
      throw new GeoRetrievalError("Database geo-query failed: timeout");
    });

    await assert.rejects(
      async () => service.search({ query: 'test near me', userLocation: { latitude: 0, longitude: 0 } }),
      RetrievalUnavailableError
    );
  });

  await t.test('Atlas Vector Search Failure throws RetrievalUnavailableError', async () => {
    mockParse({
      originalQuery: 'test',
      semanticQuery: 'test',
      filters: {},
      parserMetadata: { warnings: [] }
    });
    t.mock.method(semanticSearch, 'executeVectorSearch', async () => {
      throw new Error("Atlas connection lost");
    });
    t.mock.method(semanticSearch as any, 'generateQueryEmbedding', async () => Array(3072).fill(0.1));

    await assert.rejects(
      async () => service.search({ query: 'test' }),
      RetrievalUnavailableError
    );
  });
  await t.test('Orphaned Profile skipping and Limit Slicing', async () => {
    const pid1 = new mongoose.Types.ObjectId();
    const pid2 = new mongoose.Types.ObjectId();
    
    mockParse({
      originalQuery: 'test',
      semanticQuery: 'test',
      filters: {},
      parserMetadata: { warnings: [] }
    });

    // Mock two results from Atlas
    mockVectorSearch([
      { profileId: pid1.toString(), score: 0.95 },
      { profileId: pid2.toString(), score: 0.85 }
    ]);
    
    // But hydration only finds one (pid1 is orphaned)
    const mockProfile = {
      _id: pid2,
      type: 'tutor',
      teachingSlots: []
    };
    mockProfileFind([mockProfile]);
    
    t.mock.method(semanticSearch, 'toPublicSafeProfile', (doc: any) => doc);

    // Limit to 1, we only have 1 valid anyway
    const result = await service.search({ query: 'test', limit: 1 });
    
    assert.strictEqual(result.results.length, 1);
    assert.strictEqual(result.results[0].profileId, pid2.toString());
    assert.strictEqual(result.diagnostics.finalResultCount, 1);
    assert.strictEqual(result.diagnostics.vectorCandidateCount, 2);
  });

  await t.test('Distance-map reattachment', async () => {
    const pid = new mongoose.Types.ObjectId();
    
    mockParse({
      originalQuery: 'test near me',
      semanticQuery: 'test',
      filters: {},
      locationIntent: { radiusKm: 10 },
      parserMetadata: { warnings: [] }
    });

    mockGeo([{ profileId: pid.toString(), distanceKm: 4.5 }]);
    mockVectorSearch([{ profileId: pid.toString(), score: 0.9 }]);
    mockProfileFind([{ _id: pid, type: 'tutor' }]);
    t.mock.method(semanticSearch, 'toPublicSafeProfile', (doc: any) => doc);

    const result = await service.search({ query: 'test near me', userLocation: { latitude: 0, longitude: 0 } });
    
    assert.strictEqual(result.results.length, 1);
    assert.strictEqual(result.results[0].distanceKm, 4.5);
  });
});
