module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\.(t|j)s$": "ts-jest"
  },
  transformIgnorePatterns: [
    "node_modules/(?!(jose|firebase-admin)/)"
  ],
  moduleNameMapper: {
    "^jose(.*)$": "<rootDir>/../../node_modules/jose/dist/node/cjs$1",
    "^firebase-admin/auth$": "<rootDir>/../../node_modules/firebase-admin/lib/auth/index.js"
  }
};
