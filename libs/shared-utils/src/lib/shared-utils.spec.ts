import { clampNumber, createSlug, isDefined, normalizeSearchTerm } from '..';

describe('shared-utils', () => {
  it('creates URL-safe slugs', () => {
    expect(createSlug('  The Owl: Chapter 01!  ')).toEqual(
      'the-owl-chapter-01',
    );
  });

  it('normalizes search terms', () => {
    expect(normalizeSearchTerm('  Magic    Library  ')).toEqual(
      'magic library',
    );
  });

  it('clamps numbers to a range', () => {
    expect(clampNumber(32, 12, 24)).toEqual(24);
  });

  it('narrows nullable values', () => {
    const values = ['novel', null, undefined, 'chapter'].filter(isDefined);

    expect(values).toEqual(['novel', 'chapter']);
  });
});
