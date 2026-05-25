import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    env: {
      DATABASE_URL: 'mysql://root:homero123@localhost:3306/homefix_test',
      JWT_SECRET: 'test-secret',
    },
    fileParallelism: false,
  },
})
