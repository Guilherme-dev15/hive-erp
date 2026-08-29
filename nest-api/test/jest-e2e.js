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
    "^firebase-admin/auth$": "<rootDir>/mocks/firebase-admin-auth.ts"
  }
};
