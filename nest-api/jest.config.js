/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
  },
  moduleNameMapper: {
    '^jose(.*)$': '<rootDir>/../node_modules/jose/dist/node/cjs$1',
    '^firebase-admin/auth$': '<rootDir>/../node_modules/firebase-admin/lib/auth/index.js'
  },
  transformIgnorePatterns: [
    "node_modules/(?!.*\.mjs$)"
  ]
};
