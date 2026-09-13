import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts'],
    fileParallelism: false,
    env: {
      // Existing suites register/login many times in one process.
      // Dedicated Phase 10 tests unset this to assert 429.
      FORMA_RATE_LIMIT_DISABLED: '1',
    },
  },
})
