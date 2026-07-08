module.exports = {
  preset: 'jest-expo',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/testing/**',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    './src/domain/': {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
};
