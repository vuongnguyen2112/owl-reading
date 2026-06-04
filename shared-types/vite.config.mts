/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../node_modules/.vite/shared-types',
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    globals: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/shared-types',
      provider: 'v8',
    },
  },
});
