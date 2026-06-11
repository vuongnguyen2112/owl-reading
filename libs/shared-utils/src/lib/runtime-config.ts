export interface RuntimeFrontendConfig {
  apiBaseUrl: string;
}

export interface LoadRuntimeConfigOptions {
  configPath?: string;
  fallbackApiBaseUrl?: string;
}

let runtimeApiBaseUrl: string | null = null;

export async function loadRuntimeConfig({
  configPath = '/runtime-config.json',
  fallbackApiBaseUrl,
}: LoadRuntimeConfigOptions = {}): Promise<void> {
  if (typeof fetch === 'function') {
    try {
      const response = await fetch(configPath, { cache: 'no-store' });

      if (response.ok) {
        const config = (await response.json()) as Partial<RuntimeFrontendConfig>;
        runtimeApiBaseUrl = normalizeApiBaseUrl(config.apiBaseUrl);
        return;
      }
    } catch {
      // Fall through to the explicit fallback below.
    }
  }

  runtimeApiBaseUrl = normalizeApiBaseUrl(fallbackApiBaseUrl);
}

export function getRuntimeApiBaseUrl(fallbackApiBaseUrl?: string): string {
  if (runtimeApiBaseUrl) {
    return runtimeApiBaseUrl;
  }

  runtimeApiBaseUrl = normalizeApiBaseUrl(fallbackApiBaseUrl);

  return runtimeApiBaseUrl;
}

function normalizeApiBaseUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(
      'Runtime config must provide apiBaseUrl as an absolute HTTP(S) URL.',
    );
  }

  const trimmed = value.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      'Runtime config apiBaseUrl must be an absolute HTTP(S) URL.',
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Runtime config apiBaseUrl must use HTTP or HTTPS.');
  }

  return trimmed.replace(/\/+$/, '');
}
