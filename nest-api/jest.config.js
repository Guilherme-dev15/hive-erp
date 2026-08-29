/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
  },
  moduleNameMapper: {
    '^jose$': '<rootDir>/../node_modules/jose/dist/node/cjs/index.js',
    '^jose/(.*)$': '<rootDir>/../node_modules/jose/dist/node/cjs/$1'
  },
  transformIgnorePatterns: [
    "node_modules/(?!.*\.mjs$)"
  ]
};
