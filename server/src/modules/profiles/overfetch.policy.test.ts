import { describe, it } from 'node:test';
import assert from 'node:assert';
import { OverfetchPolicy } from './overfetch.policy';
import { ragConfig } from '../../config/rag.config';

describe('OverfetchPolicy', () => {
  it('applies configured multiplier to small requested limits', () => {
    const limit = OverfetchPolicy.calculateLimit(10);
    assert.strictEqual(limit, 10 * ragConfig.retrieval.overfetchMultiplier);
  });

  it('bounds by maximum overfetch cap', () => {
    const hugeLimit = 1000;
    const limit = OverfetchPolicy.calculateLimit(hugeLimit);
    assert.strictEqual(limit, Math.max(hugeLimit, ragConfig.retrieval.maxOverfetchCap));
  });

  it('handles invalid limits by using a fallback of 20 and applying multiplier', () => {
    const limit1 = OverfetchPolicy.calculateLimit(0);
    const limit2 = OverfetchPolicy.calculateLimit(-5);
    const limit3 = OverfetchPolicy.calculateLimit(NaN);

    const expected = 20 * ragConfig.retrieval.overfetchMultiplier;
    assert.strictEqual(limit1, expected);
    assert.strictEqual(limit2, expected);
    assert.strictEqual(limit3, expected);
  });

  it('ensures returned limit is at least the requested limit if cap is strangely configured lower', () => {
    const requested = 300; // Greater than default 200 cap
    const limit = OverfetchPolicy.calculateLimit(requested);
    assert.strictEqual(limit, requested);
  });
});
