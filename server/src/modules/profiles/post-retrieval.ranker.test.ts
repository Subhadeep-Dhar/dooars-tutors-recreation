import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PostRetrievalRanker, RankedCandidate } from './post-retrieval.ranker';

describe('PostRetrievalRanker', () => {
  
  const createCandidate = (id: string, semanticScore: number, options: any = {}): RankedCandidate => ({
    profile: {
      _id: id,
      rating: { average: options.ratingAvg ?? 0, count: options.ratingCount ?? 0 },
      experience: options.experience ?? 0,
      teachingSlots: options.fee ? [{ feePerMonth: options.fee }] : []
    } as any,
    semanticScore,
    distanceKm: options.distanceKm
  });

  it('ranks by semantic score DESC by default', () => {
    const candidates = [
      createCandidate('1', 0.8),
      createCandidate('2', 0.95),
      createCandidate('3', 0.6)
    ];
    
    const ranked = PostRetrievalRanker.rank(candidates);
    assert.strictEqual(ranked[0].profile._id, '2');
    assert.strictEqual(ranked[1].profile._id, '1');
    assert.strictEqual(ranked[2].profile._id, '3');
  });

  it('ranks by distanceKm ASC when explicit nearest intent is provided', () => {
    const candidates = [
      createCandidate('1', 0.9, { distanceKm: 15 }),
      createCandidate('2', 0.8, { distanceKm: 2 }), // Nearest
      createCandidate('3', 0.99, { distanceKm: 5 })
    ];
    
    const ranked = PostRetrievalRanker.rank(candidates, { preference: 'nearest' });
    assert.strictEqual(ranked[0].profile._id, '2');
    assert.strictEqual(ranked[1].profile._id, '3');
    assert.strictEqual(ranked[2].profile._id, '1');
  });

  it('ranks by distanceKm ASC even if missing distance (missing distance goes to end)', () => {
    const candidates = [
      createCandidate('1', 0.9, { distanceKm: 15 }),
      createCandidate('2', 0.8), // missing distance
      createCandidate('3', 0.99, { distanceKm: 5 })
    ];
    
    const ranked = PostRetrievalRanker.rank(candidates, { preference: 'nearest' });
    assert.strictEqual(ranked[0].profile._id, '3');
    assert.strictEqual(ranked[1].profile._id, '1');
    assert.strictEqual(ranked[2].profile._id, '2');
  });

  it('ranks by rating DESC when explicit rating intent is provided, using count as tie-breaker', () => {
    const candidates = [
      createCandidate('1', 0.9, { ratingAvg: 4.5, ratingCount: 10 }),
      createCandidate('2', 0.8, { ratingAvg: 4.8, ratingCount: 5 }), // Highest rating
      createCandidate('3', 0.9, { ratingAvg: 4.5, ratingCount: 20 })  // Tied rating, higher count
    ];
    
    const ranked = PostRetrievalRanker.rank(candidates, { preference: 'rating' });
    assert.strictEqual(ranked[0].profile._id, '2'); // 4.8
    assert.strictEqual(ranked[1].profile._id, '3'); // 4.5 (20)
    assert.strictEqual(ranked[2].profile._id, '1'); // 4.5 (10)
  });

  it('ranks by experience DESC when explicit experience intent is provided', () => {
    const candidates = [
      createCandidate('1', 0.9, { experience: 5 }),
      createCandidate('2', 0.8, { experience: 10 }),
      createCandidate('3', 0.99, { experience: 2 })
    ];
    
    const ranked = PostRetrievalRanker.rank(candidates, { preference: 'experience' });
    assert.strictEqual(ranked[0].profile._id, '2'); // 10
    assert.strictEqual(ranked[1].profile._id, '1'); // 5
    assert.strictEqual(ranked[2].profile._id, '3'); // 2
  });

  it('ranks by price_low_to_high using minimum slot fee', () => {
    const candidates = [
      createCandidate('1', 0.9, { fee: 5000 }),
      createCandidate('2', 0.8, { fee: 1000 }),
      createCandidate('3', 0.99, { fee: 2000 })
    ];
    
    const ranked = PostRetrievalRanker.rank(candidates, { preference: 'price_low_to_high' });
    assert.strictEqual(ranked[0].profile._id, '2'); // 1000
    assert.strictEqual(ranked[1].profile._id, '3'); // 2000
    assert.strictEqual(ranked[2].profile._id, '1'); // 5000
  });

  it('applies cascade tie-breakers correctly: semantic -> ratingAvg -> ratingCount -> experience -> _id', () => {
    const candidates = [
      createCandidate('b', 0.9, { ratingAvg: 4.5, ratingCount: 10, experience: 5 }),
      createCandidate('a', 0.9, { ratingAvg: 4.5, ratingCount: 10, experience: 5 }), // Tied completely, ID wins
      createCandidate('c', 0.9, { ratingAvg: 4.5, ratingCount: 15, experience: 2 }), // Higher count wins
      createCandidate('d', 0.9, { ratingAvg: 4.8, ratingCount: 1, experience: 1 })   // Higher rating wins
    ];
    
    // Sort by default (relevance). All have 0.9.
    const ranked = PostRetrievalRanker.rank(candidates);
    assert.strictEqual(ranked[0].profile._id, 'd'); // 4.8 rating
    assert.strictEqual(ranked[1].profile._id, 'c'); // 4.5 rating, 15 count
    assert.strictEqual(ranked[2].profile._id, 'a'); // 4.5 rating, 10 count, 5 exp, ID 'a'
    assert.strictEqual(ranked[3].profile._id, 'b'); // 4.5 rating, 10 count, 5 exp, ID 'b'
  });
});
