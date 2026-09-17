import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts'],
    fileParallelism: false,
    // Same headroom as the SPA suite: these tests open a SQLite file per test and register users
    // against it. Nothing here should take half a minute, so a real hang is still caught.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      // Existing suites register/login many times in one process.
      // Dedicated Phase 10 tests unset this to assert 429.
      FORMA_RATE_LIMIT_DISABLED: '1',
    },
  },
})
