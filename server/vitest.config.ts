import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    env: {
      
      DATABASE_URL: 'mysql://ofix:ofix123@localhost:3306/ofix_test',
      JWT_SECRET: 'test-secret',
    },
    fileParallelism: false,
  },
})
