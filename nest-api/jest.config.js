/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
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
