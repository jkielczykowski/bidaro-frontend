import { defineConfig } from '@playwright/test'

// Read-only checks against a DEPLOYED site (GitHub Actions smoke job). Never creates data.
const baseURL = process.env.SMOKE_BASE_URL
if (!baseURL) throw new Error('Set SMOKE_BASE_URL (e.g. http://72.61.177.37:9088)')

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'report' }]],
  use: { baseURL, locale: 'pl-PL', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
})
