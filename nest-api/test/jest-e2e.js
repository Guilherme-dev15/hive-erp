module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testTimeout: 30000,
  setupFilesAfterEnv: ["<rootDir>/setup-e2e.js"],
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\.(t|j)s$": "ts-jest"
  },
  transformIgnorePatterns: [
    "node_modules/(?!(jose|firebase-admin)/)"
  ],
  moduleNameMapper: {
    "^jose(.*)$": "<rootDir>/../../node_modules/jose/dist/node/cjs$1"
  }
};
