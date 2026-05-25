import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
   env: {
    DATABASE_URL: 'mysql://root:homero123@localhost:3306/homefix_test',
    JWT_SECRET: 'test-secret',
    AUTH0_AUDIENCE: 'https://api.miapinode.com',
    AUTH0_ISSUER_BASE_URL: 'https://dev-thdx752hxc0ircbe.us.auth0.com/',
    },
    fileParallelism: false,
  },
})
