// eslint.config.mjs (root)
import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import vueTs from "@vue/eslint-config-typescript";
import vuePrettier from "@vue/eslint-config-prettier";
import playwright from "eslint-plugin-playwright";
import vitest from "@vitest/eslint-plugin";
import globals from "globals";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

export default [
  // ignore artifacts
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.next/**",
      "client/build/**",
      "**/.turbo/**",
    ],
  },

  js.configs.recommended,

  // Vue recommended (flat)
  ...vue.configs["flat/recommended"],

  // Ensure .vue uses vue parser + TS in <script lang="ts">
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2023,
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
      globals: { ...globals.browser, ...globals.es2023 },
    },
    plugins: { vue },
    rules: {
      // allow single-word names for common pages/components
      "vue/multi-word-component-names": [
        "error",
        {
          ignores: [
            "Home",
            "About",
            "Login",
            "Signup",
            "Profile",
            "Shared",
            "Header",
            "Footer",
          ],
        },
      ],
    },
  },

  // Vue + TypeScript preset
  ...vueTs(),

  // Prettier compatibility for Vue (note: this is a single object, not spread)
  vuePrettier,

  // Server code (Node)
  {
    files: ["server/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parser: tsParser,
      globals: { ...globals.node, ...globals.es2023 },
    },
    rules: {
      // unused args like (_next)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },

  // Client non-.vue TS/JS (browser)
  {
    files: ["client/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parser: tsParser,
      globals: { ...globals.browser, ...globals.es2023 },
    },
  },

  // Node env just for the client dev server file (fixes "process is not defined")
  {
    files: ["client/server.{js,cjs,mjs}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2023 },
    },
  },

  // Tests
  {
    files: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2023,
        ...vitest.environments.env.globals,
      },
    },
  },

  // Playwright
  {
    files: [
      "**/e2e/**/*.{ts,js}",
      "**/*.pw.{ts,js}",
      "**/*.playwright.{ts,js}",
    ],
    plugins: { playwright },
    rules: { ...playwright.configs["flat/recommended"].rules },
    languageOptions: { globals: { ...globals.node, ...globals.es2023 } },
  },

  // Migrations are allowed to be pragmatic (turn off no-explicit-any here)
  {
    files: ["server/src/migrations/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
