import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { EmbeddingBuilder } from './embedding.builder';
import { IProfileDocument, IAcademicSlotDocument, INonAcademicSlotDocument } from '../../models/Profile';

describe('EmbeddingBuilder', () => {
  const baseProfile = {
    type: 'tutor', // ProfileType.TUTOR
    displayName: 'Test Tutor',
    teachingSlots: [],
    languages: [],
    isActive: true,
    verificationStatus: 'verified',
  } as unknown as IProfileDocument;

  describe('isProfileEligibleForRag', () => {
    it('should return true for eligible profiles', () => {
      assert.strictEqual(EmbeddingBuilder.isProfileEligibleForRag(baseProfile), true);
    });

    it('should return false if inactive', () => {
      assert.strictEqual(EmbeddingBuilder.isProfileEligibleForRag({ ...baseProfile, isActive: false } as IProfileDocument), false);
    });

    it('should return false if unverified', () => {
      assert.strictEqual(EmbeddingBuilder.isProfileEligibleForRag({ ...baseProfile, verificationStatus: 'pending' } as IProfileDocument), false);
    });

    it('should return false if displayName is missing or empty', () => {
      assert.strictEqual(EmbeddingBuilder.isProfileEligibleForRag({ ...baseProfile, displayName: '   ' } as IProfileDocument), false);
      assert.strictEqual(EmbeddingBuilder.isProfileEligibleForRag({ ...baseProfile, displayName: undefined } as unknown as IProfileDocument), false);
    });
  });

  describe('isSubstantiallyDuplicative', () => {
    it('should return false for completely different texts', () => {
      assert.strictEqual(EmbeddingBuilder.isSubstantiallyDuplicative('Math tutor here', 'Science teacher available'), false);
    });

    it('should return true for identical texts', () => {
      assert.strictEqual(EmbeddingBuilder.isSubstantiallyDuplicative('A great math tutor', 'A great math tutor'), true);
    });

    it('should return true for texts above 70% overlap', () => {
      // 4 out of 5 words overlap = 80% overlap
      assert.strictEqual(EmbeddingBuilder.isSubstantiallyDuplicative('I am a great math tutor', 'A great math tutor'), true);
    });

    it('should return true for texts exactly at 70% overlap', () => {
      // "one two three four five six seven eight nine ten"
      // "one two three four five six seven eleven twelve thirteen"
      // intersection: 7, min unique size: 10, overlap = 0.70
      assert.strictEqual(EmbeddingBuilder.isSubstantiallyDuplicative(
        'one two three four five six seven eight nine ten',
        'one two three four five six seven eleven twelve thirteen'
      ), true);
    });

    it('should return false for texts below 70% overlap', () => {
      // intersection: 6, min size: 10, overlap = 0.60
      assert.strictEqual(EmbeddingBuilder.isSubstantiallyDuplicative(
        'one two three four five six seven eight nine ten',
        'one two three four five six eleven twelve thirteen fourteen fifteen'
      ), false);
    });

    it('should normalize punctuation and whitespace', () => {
      assert.strictEqual(EmbeddingBuilder.isSubstantiallyDuplicative(
        'A great math tutor!',
        'A    great, math-tutor...'
      ), true);
    });
  });

  describe('extractFees', () => {
    it('should return empty object if no fees are present', () => {
      const profile = { ...baseProfile, teachingSlots: [{ subject: 'Math', feePerMonth: null } as unknown as IAcademicSlotDocument] } as IProfileDocument;
      assert.deepStrictEqual(EmbeddingBuilder.extractFees(profile), {});
    });

    it('should return correct min and max fee', () => {
      const profile = { 
        ...baseProfile, 
        teachingSlots: [
          { subject: 'Math', feePerMonth: 1000 } as unknown as IAcademicSlotDocument,
          { subject: 'Science', feePerMonth: 2000 } as unknown as IAcademicSlotDocument,
          { subject: 'English', feePerMonth: 500 } as unknown as IAcademicSlotDocument,
        ] 
      } as IProfileDocument;
      assert.deepStrictEqual(EmbeddingBuilder.extractFees(profile), { minFee: 500, maxFee: 2000 });
    });
  });

  describe('buildFilterSnapshot', () => {
    it('should not extract activities for academic slots', () => {
      const profile = { 
        ...baseProfile,
        teachingSlots: [
          { subject: 'Math', classes: ['Class 10'] } as unknown as IAcademicSlotDocument
        ] 
      } as IProfileDocument;
      const snapshot = EmbeddingBuilder.buildFilterSnapshot(profile);
      assert.strictEqual(snapshot.activities, undefined);
    });

    it('should extract and deduplicate activities for non-academic slots', () => {
      const profile = { 
        ...baseProfile,
        type: 'sports_trainer',
        teachingSlots: [
          { activity: 'Football ' } as unknown as INonAcademicSlotDocument,
          { activity: ' Yoga' } as unknown as INonAcademicSlotDocument,
          { activity: 'Football' } as unknown as INonAcademicSlotDocument,
          { activity: '' } as unknown as INonAcademicSlotDocument,
        ] 
      } as IProfileDocument;
      const snapshot = EmbeddingBuilder.buildFilterSnapshot(profile);
      assert.deepStrictEqual(snapshot.activities, ['Football', 'Yoga']);
    });
  });

  describe('buildCanonicalText', () => {
    it('should generate academic canonical text correctly', () => {
      const profile = { 
        ...baseProfile, 
        languages: ['English', 'Bengali'], 
        teachingSlots: [
          { subject: 'Math', classes: ['Class 10', 'Class 12'], board: 'CBSE', medium: 'English' } as unknown as IAcademicSlotDocument
        ] 
      } as IProfileDocument;
      
      const text = EmbeddingBuilder.buildCanonicalText(profile);
      assert.ok(text.includes('Type: Individual tutor'));
      assert.ok(text.includes('Name: Test Tutor'));
      assert.ok(text.includes('Subjects: Math'));
      assert.ok(text.includes('Classes: Class 10, Class 12'));
      assert.ok(text.includes('Boards: CBSE'));
      assert.ok(text.includes('Medium: English'));
      assert.ok(text.includes('Languages: Bengali, English'));
    });

    it('should omit empty arrays and nulls', () => {
      const text = EmbeddingBuilder.buildCanonicalText(baseProfile);
      assert.ok(!text.includes('Subjects:'));
      assert.ok(!text.includes('Languages:'));
      assert.ok(!text.includes('Bio:'));
    });

    it('should generate deterministic hashes regardless of whitespace differences', () => {
      const text1 = 'Type: Individual tutor\nName: Test Tutor\nBio: Hello World';
      const text2 = 'Type: Individual tutor\nName: Test Tutor\r\nBio: Hello World';
      assert.strictEqual(EmbeddingBuilder.generateHash(text1), EmbeddingBuilder.generateHash(text2));
    });

    it('should deduplicate bio and enrichedDescription properly (below threshold)', () => {
      const profile = { ...baseProfile, bio: 'A passionate math tutor from Delhi.', enrichedDescription: 'An experienced science teacher with a focus on physics and chemistry.' } as IProfileDocument;
      const text = EmbeddingBuilder.buildCanonicalText(profile);
      assert.ok(text.includes('Bio: A passionate math tutor from Delhi.\nAdditional Details: An experienced science teacher with a focus on physics and chemistry.'));
    });

    it('should not append enrichedDescription if bio contains it (above threshold)', () => {
      const profile = { ...baseProfile, bio: 'A great math tutor from Delhi', enrichedDescription: 'Great math tutor from Delhi' } as IProfileDocument;
      const text = EmbeddingBuilder.buildCanonicalText(profile);
      assert.ok(text.includes('Bio: A great math tutor from Delhi'));
      assert.ok(!text.includes('Additional Details:'));
    });
  });
});