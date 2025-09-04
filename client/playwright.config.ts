import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT || 5174)
const BASE = process.env.E2E_BASE_URL || `http://localhost:${PORT}`
const USE_LOCAL = !process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: BASE, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: USE_LOCAL
    ? {
        command:
          process.platform === 'win32'
            ? `cmd /c "npm run build && set PORT=${PORT}&& set API_PROXY_PASS=https://goalbuddyone.d00ed23ca0jv2.eu-central-1.cs.amazonlightsail.com&& node server.js"`
            : `npm run build && PORT=${PORT} API_PROXY_PASS=https://goalbuddyone.d00ed23ca0jv2.eu-central-1.cs.amazonlightsail.com node server.js`,
        port: PORT,
        timeout: 60_000,
        reuseExistingServer: true,
      }
    : undefined,
})
