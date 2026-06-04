import { DEFAULT_READER_SETTINGS, NOVEL_STATUSES } from '..';

describe('shared-types', () => {
  it('exposes initial novel statuses', () => {
    expect(NOVEL_STATUSES).toEqual(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
  });

  it('exposes default reader settings', () => {
    expect(DEFAULT_READER_SETTINGS).toEqual({
      darkMode: false,
      fontSizePx: 18,
      lineHeight: 1.7,
    });
  });
});
