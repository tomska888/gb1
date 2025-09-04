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

  ...vue.configs["flat/recommended"],

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

  ...vueTs(),

  vuePrettier,

  {
    files: ["server/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parser: tsParser,
      globals: { ...globals.node, ...globals.es2023 },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },

  {
    files: ["client/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parser: tsParser,
      globals: { ...globals.browser, ...globals.es2023 },
    },
  },

  {
    files: ["client/server.{js,cjs,mjs}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2023 },
    },
  },

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

  {
    files: ["server/src/migrations/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
