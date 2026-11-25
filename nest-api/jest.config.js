/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs', 'cjs', 'jsx', 'json', 'node'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup-e2e.js'],
  transform: {
    '^.+\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
  },
  moduleNameMapper: {
    '^firebase-admin/auth$': '<rootDir>/test/mocks/firebase-admin-auth.ts'
  },
  transformIgnorePatterns: [
    "node_modules/(?!.*\.mjs$)"
  ]
};
