import {
  clampNumber,
  createSlug,
  getRuntimeApiBaseUrl,
  isDefined,
  loadRuntimeConfig,
  normalizeSearchTerm,
} from '..';

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

  it('loads and normalizes runtime API config', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          apiBaseUrl: 'https://api.example.com/api/',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await loadRuntimeConfig();

    expect(fetchMock).toHaveBeenCalledWith('/runtime-config.json', {
      cache: 'no-store',
    });
    expect(getRuntimeApiBaseUrl()).toEqual('https://api.example.com/api');
  });

  it('uses the explicit API fallback when runtime config is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    await loadRuntimeConfig({
      fallbackApiBaseUrl: 'http://localhost:3000/api/',
    });

    expect(getRuntimeApiBaseUrl()).toEqual('http://localhost:3000/api');
  });

  it('rejects missing runtime API config without a fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    await expect(loadRuntimeConfig()).rejects.toThrow(
      'Runtime config must provide apiBaseUrl',
    );
  });
});
