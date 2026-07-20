import test from 'node:test';
import assert from 'node:assert';
import { StrictIntentGuard } from './strict-intent.guard';

test('StrictIntentGuard', async (t) => {
  await t.test('hasStrictIntent', async (tt) => {
    await tt.test('returns false for pure semantic queries', () => {
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('patient and gentle teacher'), false);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('someone who is good with kids'), false);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('very experienced and polite'), false);
    });

    await tt.test('returns true for budget constraints', () => {
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('tutor under 2000'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('max 5000 rs'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('₹1500'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('budget tutor'), true);
    });

    await tt.test('returns true for spatial/geo constraints', () => {
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('tutor within 5 km'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('near me'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('nearest teacher'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('teacher near alipurduar'), true);
    });

    await tt.test('returns true for gender constraints', () => {
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('female tutor'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('lady teacher'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('male instructor'), true);
    });

    await tt.test('returns true for class/grade constraints', () => {
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('class 10'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('grade 5'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('kg tutor'), true);
    });

    await tt.test('returns true for board constraints', () => {
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('cbse board'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('icse syllabus'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('wbbse'), true);
    });

    await tt.test('returns true for service mode constraints', () => {
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('online tutor'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('offline'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('home tutor'), true);
    });

    await tt.test('returns true for specific subjects/activities', () => {
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('maths tutor'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('physics'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('yoga instructor'), true);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('dance teacher'), true);
    });

    await tt.test('resists false positives on ordinary prose', () => {
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('nearly perfect'), false);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('classic approach'), false);
      assert.strictEqual(StrictIntentGuard.hasStrictIntent('format'), false);
    });
  });
});

