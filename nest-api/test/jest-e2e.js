module.exports = {
  moduleFileExtensions: ["ts", "tsx", "js", "mjs", "cjs", "jsx", "json", "node"],
  rootDir: ".",
  testEnvironment: "node",
  testTimeout: 30000,
  setupFiles: ["<rootDir>/e2e-db-safety-setup.js"],
  setupFilesAfterEnv: ["<rootDir>/setup-e2e.js"],
  testRegex: ".e2e-spec.ts$",
  testPathIgnorePatterns: ["/node_modules/"],
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  transformIgnorePatterns: [
    "node_modules/(?!(jose|firebase-admin)/)"
  ],
  moduleNameMapper: {
    "^firebase-admin/auth$": "<rootDir>/mocks/firebase-admin-auth.ts"
  }
};
