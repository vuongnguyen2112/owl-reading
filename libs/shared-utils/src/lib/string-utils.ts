export function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeSearchTerm(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}
