// eslint.config.js
"use strict";

const globals = require("globals");
const tseslint = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const pluginReact = require("eslint-plugin-react");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["**/dist/", "**/dev-dist/", "**/.venv/"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tseslint,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.node, ...globals.browser, ...globals.jest },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: pluginReact,
    },
    rules: {
      ...tsPlugin.configs["recommended"].rules,
      ...pluginReact.configs["jsx-runtime"].rules,
      "react/prop-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
  {
    // Override para arquivos CommonJS (API e Functions)
    files: ["api/**/*.js", "functions/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      parser: undefined, // Usar o parser padrão do JS
    },
    rules: {
      // Permite o uso de require()
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-require-imports": "off",
    }
  },
  {
    // Override para o próprio arquivo de config, que é CommonJS
    files: ["eslint.config.js"],
    languageOptions: {
        sourceType: "commonjs",
    },
    rules: {
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-require-imports": "off",
    }
  },
  eslintConfigPrettier,
];
