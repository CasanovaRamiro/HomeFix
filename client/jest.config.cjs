module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/views/Trabajos.test.tsx',
    '<rootDir>/src/test/Trabajos.test.tsx',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.app.json',
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}
