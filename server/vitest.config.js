import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    environment: 'node',
    env: {
      DATABASE_URL: 'mysql://root:root@localhost:3306/homefix_test',
      JWT_SECRET: 'test-secret',
    }
  },
})