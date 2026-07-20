import test from 'node:test';
import assert from 'node:assert';
import { HybridEvaluationValidator, EvaluationCase } from './hybrid-evaluation.validator';
import mongoose from 'mongoose';

test('HybridEvaluationValidator', async (t) => {
  const baseResult = (profileOverrides: any = {}, extra: any = {}) => ({
    profileId: new mongoose.Types.ObjectId().toString(),
    score: 0.9,
    profile: {
      _id: new mongoose.Types.ObjectId(),
      type: 'tutor',
      ...profileOverrides
    },
    ...extra
  });

  const runValidate = (results: any[], expected: any) => HybridEvaluationValidator.validateConstraints(results as any, expected);

  await t.test('CONSTRAINT VALIDATION', async (tt) => {
    await tt.test('Correct gender -> pass', () => {
      const results = [baseResult({ gender: 'female' })];
      const fails = runValidate(results, { constraints: { gender: 'female' } });
      assert.strictEqual(fails.length, 0);
    });

    await tt.test('Wrong gender -> fail', () => {
      const results = [baseResult({ gender: 'male' })];
      const fails = runValidate(results, { constraints: { gender: 'female' } });
      assert.strictEqual(fails.length, 1);
    });

    await tt.test('Correct subject -> pass', () => {
      const results = [baseResult({ teachingSlots: [{ subject: 'Mathematics' }] })];
      const fails = runValidate(results, { constraints: { subjects: ['math'] } });
      assert.strictEqual(fails.length, 0);
    });

    await tt.test('Wrong subject -> fail', () => {
      const results = [baseResult({ teachingSlots: [{ subject: 'Science' }] })];
      const fails = runValidate(results, { constraints: { subjects: ['math'] } });
      assert.strictEqual(fails.length, 1);
    });

    await tt.test('Correct activity -> pass', () => {
      const results = [baseResult({ teachingSlots: [{ subject: 'Yoga' }] })];
      const fails = runValidate(results, { constraints: { activities: ['yoga'] } });
      assert.strictEqual(fails.length, 0);
    });

    await tt.test('Wrong activity -> fail', () => {
      const results = [baseResult({ teachingSlots: [{ subject: 'Dance' }] })];
      const fails = runValidate(results, { constraints: { activities: ['yoga'] } });
      assert.strictEqual(fails.length, 1);
    });

    await tt.test('Correct board -> pass', () => {
      const results = [baseResult({ teachingSlots: [{ board: 'CBSE' }] })];
      const fails = runValidate(results, { constraints: { boards: ['CBSE'] } });
      assert.strictEqual(fails.length, 0);
    });

    await tt.test('Wrong board -> fail', () => {
      const results = [baseResult({ teachingSlots: [{ board: 'ICSE' }] })];
      const fails = runValidate(results, { constraints: { boards: ['CBSE'] } });
      assert.strictEqual(fails.length, 1);
    });

    await tt.test('Correct class -> pass', () => {
      const results = [baseResult({ teachingSlots: [{ classes: ['10'] }] })];
      const fails = runValidate(results, { constraints: { classes: ['10'] } });
      assert.strictEqual(fails.length, 0);
    });

    await tt.test('Wrong class -> fail', () => {
      const results = [baseResult({ teachingSlots: [{ classes: ['9'] }] })];
      const fails = runValidate(results, { constraints: { classes: ['10'] } });
      assert.strictEqual(fails.length, 1);
    });

    await tt.test('Correct service mode -> pass', () => {
      const results = [baseResult({ serviceModes: ['online', 'offline'] })];
      const fails = runValidate(results, { constraints: { serviceModes: ['online'] } });
      assert.strictEqual(fails.length, 0);
    });

    await tt.test('Wrong service mode -> fail', () => {
      const results = [baseResult({ serviceModes: ['offline'] })];
      const fails = runValidate(results, { constraints: { serviceModes: ['online'] } });
      assert.strictEqual(fails.length, 1);
    });
  });

  await t.test('SAME-SLOT BUDGET', async (tt) => {
    await tt.test('Relevant Math slot under budget -> pass', () => {
      const results = [baseResult({ teachingSlots: [{ subject: 'Mathematics', feePerMonth: 1000 }] })];
      const fails = runValidate(results, { constraints: { maxBudget: 2000, subjects: ['math'] } });
      assert.strictEqual(fails.length, 0);
    });

    await tt.test('Math slot over budget + unrelated Science slot under budget -> fail', () => {
      const results = [baseResult({ teachingSlots: [
        { subject: 'Mathematics', feePerMonth: 5000 },
        { subject: 'Science', feePerMonth: 1000 }
      ] })];
      const fails = runValidate(results, { constraints: { maxBudget: 2000, subjects: ['math'] } });
      assert.strictEqual(fails.length, 1);
    });

    await tt.test('Null/missing fee under strict budget -> fail', () => {
      const results = [baseResult({ teachingSlots: [{ subject: 'Mathematics' }] })];
      const fails = runValidate(results, { constraints: { maxBudget: 2000 } });
      assert.strictEqual(fails.length, 1);
    });
  });

  await t.test('GEO', async (tt) => {
    await tt.test('geoApplied true when expected -> pass', () => {
      const fails = HybridEvaluationValidator.validateGeoBehavior({ geoApplied: true }, { geoBehavior: 'APPLIED' } as any);
      assert.strictEqual(fails.length, 0);
    });

    await tt.test('geoApplied false when expected true -> fail', () => {
      const fails = HybridEvaluationValidator.validateGeoBehavior({ geoApplied: false }, { geoBehavior: 'APPLIED' } as any);
      assert.strictEqual(fails.length, 1);
    });

    await tt.test('Result within radius -> pass', () => {
      const results = [baseResult({}, { distanceKm: 4 })];
      const fails = runValidate(results, { constraints: { maxDistanceKm: 5 } });
      assert.strictEqual(fails.length, 0);
    });

    await tt.test('Result outside radius -> fail', () => {
      const results = [baseResult({}, { distanceKm: 6 })];
      const fails = runValidate(results, { constraints: { maxDistanceKm: 5 } });
      assert.strictEqual(fails.length, 1);
    });

    await tt.test('Missing distance when strict geo validation requires it -> fail', () => {
      const results = [baseResult({}, {})]; // missing distanceKm
      const fails = runValidate(results, { constraints: { maxDistanceKm: 5 } });
      assert.strictEqual(fails.length, 1);
    });
  });

  await t.test('SORTING', async (tt) => {
    const runSort = (results: any[], pref: string) => HybridEvaluationValidator.validateSorting(results as any, { sortIntent: pref } as any);

    await tt.test('Correct nearest ordering -> pass', () => {
      const r1 = baseResult({}, { distanceKm: 1 });
      const r2 = baseResult({}, { distanceKm: 2 });
      assert.strictEqual(runSort([r1, r2], 'nearest').length, 0);
    });

    await tt.test('Wrong nearest ordering -> fail', () => {
      const r1 = baseResult({}, { distanceKm: 5 });
      const r2 = baseResult({}, { distanceKm: 2 });
      assert.strictEqual(runSort([r1, r2], 'nearest').length, 1);
    });

    await tt.test('Correct rating ordering -> pass', () => {
      const r1 = baseResult({ rating: { average: 5 } });
      const r2 = baseResult({ rating: { average: 4 } });
      assert.strictEqual(runSort([r1, r2], 'rating').length, 0);
    });

    await tt.test('Wrong rating ordering -> fail', () => {
      const r1 = baseResult({ rating: { average: 3 } });
      const r2 = baseResult({ rating: { average: 4 } });
      assert.strictEqual(runSort([r1, r2], 'rating').length, 1);
    });

    await tt.test('Correct experience ordering -> pass', () => {
      const r1 = baseResult({ experience: 10 });
      const r2 = baseResult({ experience: 5 });
      assert.strictEqual(runSort([r1, r2], 'experience').length, 0);
    });

    await tt.test('Wrong experience ordering -> fail', () => {
      const r1 = baseResult({ experience: 1 });
      const r2 = baseResult({ experience: 5 });
      assert.strictEqual(runSort([r1, r2], 'experience').length, 1);
    });

    await tt.test('Correct price-low-to-high ordering -> pass', () => {
      const r1 = baseResult({ teachingSlots: [{ feePerMonth: 1000 }] });
      const r2 = baseResult({ teachingSlots: [{ feePerMonth: 2000 }] });
      assert.strictEqual(runSort([r1, r2], 'price_low_to_high').length, 0);
    });

    await tt.test('Wrong price ordering -> fail', () => {
      const r1 = baseResult({ teachingSlots: [{ feePerMonth: 3000 }] });
      const r2 = baseResult({ teachingSlots: [{ feePerMonth: 2000 }] });
      assert.strictEqual(runSort([r1, r2], 'price_low_to_high').length, 1);
    });

    await tt.test('Correct relevance ordering -> pass', () => {
      const r1 = baseResult({}, { score: 0.95 });
      const r2 = baseResult({}, { score: 0.85 });
      assert.strictEqual(runSort([r1, r2], 'relevance').length, 0);
    });

    await tt.test('Wrong relevance ordering -> fail', () => {
      const r1 = baseResult({}, { score: 0.7 });
      const r2 = baseResult({}, { score: 0.85 });
      assert.strictEqual(runSort([r1, r2], 'relevance').length, 1);
    });
  });

  await t.test('OUTCOMES', async (tt) => {
    const runEval = (testCase: any, result: any, error: any) => HybridEvaluationValidator.evaluateCase(testCase, result, error);

    await tt.test('Expected zero results + zero returned -> EXPECTED_ZERO_RESULT', () => {
      const c = { expected: { outcome: 'ZERO_RESULTS' } };
      const res = { diagnostics: { finalResultCount: 0 }, results: [] };
      assert.strictEqual(runEval(c, res, null).status, 'EXPECTED_ZERO_RESULT');
    });

    await tt.test('Expected zero results + nonzero returned -> FAIL', () => {
      const c = { expected: { outcome: 'ZERO_RESULTS' } };
      const res = { diagnostics: { finalResultCount: 1 }, results: [baseResult()] };
      assert.strictEqual(runEval(c, res, null).status, 'FAIL');
    });

    await tt.test('Expected safe error + correct error type -> EXPECTED_SAFE_ERROR', () => {
      const c = { expected: { outcome: 'SAFE_ERROR', safeErrorType: 'LocationRequiredError' } };
      const err = new Error();
      err.name = 'LocationRequiredError';
      assert.strictEqual(runEval(c, null, err).status, 'EXPECTED_SAFE_ERROR');
    });

    await tt.test('Expected safe error + wrong error type -> FAIL', () => {
      const c = { expected: { outcome: 'SAFE_ERROR', safeErrorType: 'LocationRequiredError' } };
      const err = new Error();
      err.name = 'DomainError';
      assert.strictEqual(runEval(c, null, err).status, 'FAIL');
    });

    await tt.test('No exception alone does not produce PASS when deterministic validators fail', () => {
      const c = { expected: { outcome: 'RESULTS', constraints: { maxDistanceKm: 1 } } };
      const res = { diagnostics: { finalResultCount: 1 }, results: [baseResult({}, { distanceKm: 10 })] };
      const result = runEval(c, res, null);
      assert.strictEqual(result.status, 'FAIL');
      assert.ok(result.failures.length > 0);
    });
  });

  await t.test('SAFETY', async (tt) => {
    const runSafe = (results: any[]) => HybridEvaluationValidator.validateOutputSafety(results as any);

    await tt.test('Raw embedding field -> fail', () => {
      const r = baseResult({ embedding: [0.1, 0.2] });
      assert.strictEqual(runSafe([r]).length, 1);
    });

    await tt.test('Nested raw embedding field -> fail', () => {
      const r = baseResult({ meta: { embedding: [0.1] } });
      assert.strictEqual(runSafe([r]).length, 1);
    });

    await tt.test('Raw embedding array detected -> fail', () => {
        const r = baseResult({ data: Array(101).fill(0.1) });
        assert.strictEqual(runSafe([r]).length, 1);
    });

    await tt.test('Private phone field -> fail where prohibited', () => {
      const r = baseResult({ phone: '123' });
      assert.strictEqual(runSafe([r]).length, 1);
    });

    await tt.test('Private email field -> fail where prohibited', () => {
      const r = baseResult({ email: 'a@b.com' });
      assert.strictEqual(runSafe([r]).length, 1);
    });

    await tt.test('Password/token field -> fail', () => {
      assert.strictEqual(runSafe([baseResult({ passwordHash: 'hash' })]).length, 1);
      assert.strictEqual(runSafe([baseResult({ accessToken: 'token' })]).length, 1);
      assert.strictEqual(runSafe([baseResult({ JWT_SECRET: 'secret' })]).length, 1);
    });

    await tt.test('Raw stack trace -> fail', () => {
      assert.strictEqual(runSafe([baseResult({ stack: 'Error at line 1...' })]).length, 1);
    });

    await tt.test('Clean PublicSafeProfile payload -> pass', () => {
      const r = baseResult({ publicEmail: 'hello@a.com', displayName: 'John' });
      assert.strictEqual(runSafe([r]).length, 0);
    });
  });

  await t.test('FAILURE CLASSIFICATION', async (tt) => {
    const runClassify = (err: any, exp?: string) => HybridEvaluationValidator.classifyError(err, exp);

    await tt.test('StructuredParsingUnavailableError with rate_limit -> NOT_EXECUTED_QUOTA', () => {
      const err = new Error() as any;
      err.name = 'StructuredParsingUnavailableError';
      err.reason = 'rate_limit';
      assert.strictEqual(runClassify(err), 'NOT_EXECUTED_QUOTA');
    });

    await tt.test('StructuredParsingUnavailableError with timeout -> NOT_EXECUTED_INFRASTRUCTURE', () => {
      const err = new Error() as any;
      err.name = 'StructuredParsingUnavailableError';
      err.reason = 'timeout';
      assert.strictEqual(runClassify(err), 'NOT_EXECUTED_INFRASTRUCTURE');
    });

    await tt.test('StructuredParsingUnavailableError with network_error -> NOT_EXECUTED_INFRASTRUCTURE', () => {
      const err = new Error() as any;
      err.name = 'StructuredParsingUnavailableError';
      err.reason = 'network_error';
      assert.strictEqual(runClassify(err), 'NOT_EXECUTED_INFRASTRUCTURE');
    });

    await tt.test('Expected functional safe error with exact matching type -> EXPECTED_SAFE_ERROR', () => {
      const err = new Error();
      err.name = 'LocationRequiredError';
      assert.strictEqual(runClassify(err, 'LocationRequiredError'), 'EXPECTED_SAFE_ERROR');
    });

    await tt.test('Unexpected wrong safe error -> FAIL', () => {
      const err = new Error();
      err.name = 'LocationRequiredError';
      assert.strictEqual(runClassify(err, 'LocationResolutionRequiredError'), 'FAIL');
    });
  });

  await t.test('PROVE THAT PASS REQUIRES VALIDATION', async (tt) => {
    await tt.test('A result passing but failing validation must NEVER pass', () => {
      const testCase = { expected: { outcome: 'RESULTS', constraints: { maxBudget: 500 } } };
      // Execution genuinely completed, non-empty results, HTTP 200 equivalent
      const result = {
        diagnostics: { finalResultCount: 1 },
        results: [baseResult({ teachingSlots: [{ feePerMonth: 1000 }] })]
      };
      
      const evalOutput = HybridEvaluationValidator.evaluateCase(testCase as any, result as any, null);
      
      assert.strictEqual(evalOutput.status, 'FAIL');
      assert.strictEqual(evalOutput.failures.length, 1);
    });
  });
});
