import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    env: {
      DATABASE_URL: 'mysql://root:root@localhost:3306/homefix_db',
      JWT_SECRET: 'test-secret',
    },
    fileParallelism: false,
  },
})
