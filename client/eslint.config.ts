import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const TS_ROOT = path.dirname(fileURLToPath(import.meta.url))

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
    'server.js',
  ]),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },

  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    languageOptions: {
      parserOptions: {
        project: null,
        tsconfigRootDir: TS_ROOT,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
  },

  {
    files: ['**/*.js'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },

  skipFormatting,
)
