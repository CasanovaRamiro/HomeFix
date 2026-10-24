import { defineConfig } from 'vitest/config'
import { resolveTestDb } from './test/helpers/testDbSafety.js'

const approved = resolveTestDb(process.env)

export default defineConfig({
  test: {
    include: ['test/routes/**/*.test.ts', 'test/data/**/*.test.ts'],
    exclude: ['test/data/**/*.unit.test.ts'],
    environment: 'node',
    fileParallelism: false,
    setupFiles: ['./test/helpers/requireTestDb.ts'],
    env: {
      DATABASE_URL: approved.url,
      HF_TEST_DB_URL: approved.url,
      HF_TEST_DB_TARGET: approved.target,
      HF_TEST_DB_SERVER_UUID: approved.serverUuid,
      HF_TEST_DB_PRINCIPAL: approved.principal,
      HF_TEST_DB_CONFIRM: 'I_AUTHORIZE_DISPOSABLE_HF_TESTS',
      JWT_SECRET: 'test-secret',
      AUTH0_AUDIENCE: 'https://api.miapinode.com',
      AUTH0_ISSUER_BASE_URL: 'https://dev-thdx752hxc0ircbe.us.auth0.com/',
    },
  },
})
