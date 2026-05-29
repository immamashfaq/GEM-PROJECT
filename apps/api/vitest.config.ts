import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use forked processes for ESM + native module compatibility
    pool: 'forks',
    // Include test files from the tests/ directory
    include: ['tests/**/*.test.ts'],
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
    },
    // Give each test file longer timeout for integration tests that
    // need to connect to Postgres/Redis
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run tests serially to avoid DB race conditions in integration tests
    sequence: {
      concurrent: false,
    },
  },
});
