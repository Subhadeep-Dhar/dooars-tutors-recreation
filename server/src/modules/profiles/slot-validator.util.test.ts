import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SlotValidatorUtil } from './slot-validator.util';

describe('SlotValidatorUtil', () => {
  it('passes when no slot-level constraints exist', () => {
    const profile: any = { teachingSlots: [] };
    const filters: any = { type: ['tutor'] };
    assert.strictEqual(SlotValidatorUtil.isValid(profile, filters), true);
  });

  it('fails safely when slot constraints exist but slots are missing/empty', () => {
    const profile1: any = {};
    const profile2: any = { teachingSlots: [] };
    const filters: any = { maxBudget: 2000 };
    
    assert.strictEqual(SlotValidatorUtil.isValid(profile1, filters), false);
    assert.strictEqual(SlotValidatorUtil.isValid(profile2, filters), false);
  });

  it('passes matching academic slot (subject + class + budget)', () => {
    const profile: any = {
      teachingSlots: [
        { subject: 'Math', classes: ['Class 10'], feePerMonth: 1500 }
      ]
    };
    const filters: any = { subjects: ['Math'], classes: ['Class 10'], maxBudget: 2000 };
    
    assert.strictEqual(SlotValidatorUtil.isValid(profile, filters), true);
  });

  it('rejects cross-slot false positives (Math on one slot, budget on another)', () => {
    const profile: any = {
      teachingSlots: [
        { subject: 'Science', classes: ['Class 10'], feePerMonth: 1500 }, // Under budget, wrong subject
        { subject: 'Math', classes: ['Class 10'], feePerMonth: 5000 }    // Right subject, over budget
      ]
    };
    const filters: any = { subjects: ['Math'], maxBudget: 2000 };
    
    assert.strictEqual(SlotValidatorUtil.isValid(profile, filters), false);
  });

  it('rejects cross-slot false positives (subject on one, class on another)', () => {
    const profile: any = {
      teachingSlots: [
        { subject: 'Math', classes: ['Class 8'], feePerMonth: 1500 },
        { subject: 'Science', classes: ['Class 10'], feePerMonth: 1500 }
      ]
    };
    const filters: any = { subjects: ['Math'], classes: ['Class 10'] };
    
    assert.strictEqual(SlotValidatorUtil.isValid(profile, filters), false);
  });

  it('null/undefined/missing fee does NOT automatically pass a strict maxBudget', () => {
    const profile: any = {
      teachingSlots: [
        { subject: 'Math', classes: ['Class 10'] }, // fee missing
        { subject: 'Math', classes: ['Class 10'], feePerMonth: null },
        { subject: 'Math', classes: ['Class 10'], feePerMonth: NaN }
      ]
    };
    const filters: any = { subjects: ['Math'], maxBudget: 2000 };
    
    assert.strictEqual(SlotValidatorUtil.isValid(profile, filters), false);
  });

  it('passes matching non-academic slot (activity + budget)', () => {
    const profile: any = {
      teachingSlots: [
        { activity: 'Guitar', feePerMonth: 1800 }
      ]
    };
    const filters: any = { activities: ['Guitar'], maxBudget: 2000 };
    
    assert.strictEqual(SlotValidatorUtil.isValid(profile, filters), true);
  });

  it('enforces AND logic across domains if both academic and non-academic constraints exist', () => {
    const profile: any = {
      teachingSlots: [
        { subject: 'Math', classes: ['Class 10'], feePerMonth: 1500 },
        { activity: 'Guitar', feePerMonth: 1800 }
      ]
    };
    const filters: any = { subjects: ['Math'], activities: ['Guitar'] };
    
    assert.strictEqual(SlotValidatorUtil.isValid(profile, filters), true);

    const profileMissingGuitar: any = {
      teachingSlots: [
        { subject: 'Math', classes: ['Class 10'], feePerMonth: 1500 }
      ]
    };
    assert.strictEqual(SlotValidatorUtil.isValid(profileMissingGuitar, filters), false);
  });

  it('safely ignores malformed slots without crashing', () => {
    const profile: any = {
      teachingSlots: [
        null,
        undefined,
        "not-an-object",
        {},
        { subject: 'Math', classes: ['Class 10'], feePerMonth: 1500 } // only valid slot
      ]
    };
    const filters: any = { subjects: ['Math'], maxBudget: 2000 };
    
    assert.strictEqual(SlotValidatorUtil.isValid(profile, filters), true);
  });
  
  it('validates board constraints on academic slots', () => {
    const profile: any = {
      teachingSlots: [
        { subject: 'Math', classes: ['Class 10'], board: 'CBSE', feePerMonth: 1500 },
      ]
    };
    const filters: any = { subjects: ['Math'], boards: ['ICSE'] }; // wrong board
    assert.strictEqual(SlotValidatorUtil.isValid(profile, filters), false);

    const filters2: any = { subjects: ['Math'], boards: ['CBSE'] }; // correct board
    assert.strictEqual(SlotValidatorUtil.isValid(profile, filters2), true);
  });

  it('passes if ONLY maxBudget is provided and ANY valid slot meets it', () => {
    const profile: any = {
      teachingSlots: [
        { subject: 'Math', classes: ['Class 10'], feePerMonth: 5000 },
        { activity: 'Yoga', feePerMonth: 1000 } // meets budget
      ]
    };
    const filters: any = { maxBudget: 2000 };
    assert.strictEqual(SlotValidatorUtil.isValid(profile, filters), true);
  });
});
