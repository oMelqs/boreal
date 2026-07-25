module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // O primeiro render de cada suíte de tela monta a árvore do RN do zero e
  // passa dos 5 s padrão nos runners de 2 núcleos do CI, mesmo levando ~200 ms
  // aqui. O teto maior evita falha por contenção sem esconder travamento real.
  testTimeout: 20_000,
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
