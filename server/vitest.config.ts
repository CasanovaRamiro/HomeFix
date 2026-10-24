import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/service/**/*.test.ts', 'test/middleware/**/*.test.ts', 'test/data/**/*.unit.test.ts', 'test/safety/**/*.test.ts'],
    environment: 'node',
    env: {
      DATABASE_URL: 'mysql://blocked:blocked@127.0.0.1:1/unavailable',
      HF_TEST_DB_CONFIRM: '',
    JWT_SECRET: 'test-secret',
    AUTH0_AUDIENCE: 'https://api.miapinode.com',
    AUTH0_ISSUER_BASE_URL: 'https://dev-thdx752hxc0ircbe.us.auth0.com/',
    },
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
    },
  },
})
