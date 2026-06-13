/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  // Only run dedicated unit/integration specs under __tests__ directories.
  // This deliberately excludes the legacy src/tests/phase1.test.ts script,
  // which is a live-database smoke runner (calls process.exit), not a Jest test.
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
};
