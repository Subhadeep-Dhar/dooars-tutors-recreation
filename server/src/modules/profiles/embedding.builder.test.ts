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
  } as unknown as IProfileDocument;

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

  it('should deduplicate bio and enrichedDescription properly', () => {
    const profile = { ...baseProfile, bio: 'A great tutor', enrichedDescription: 'A great tutor who teaches math' } as IProfileDocument;
    const text = EmbeddingBuilder.buildCanonicalText(profile);
    assert.ok(text.includes('Bio: A great tutor\nAdditional Details: A great tutor who teaches math'));
  });

  it('should not append enrichedDescription if bio contains it', () => {
    const profile = { ...baseProfile, bio: 'A great tutor who teaches math and science', enrichedDescription: 'A great tutor who teaches math' } as IProfileDocument;
    const text = EmbeddingBuilder.buildCanonicalText(profile);
    assert.ok(text.includes('Bio: A great tutor who teaches math and science'));
    assert.ok(!text.includes('Additional Details:'));
  });
});