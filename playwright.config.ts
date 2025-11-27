import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Increase default timeout for actions
    actionTimeout: 15_000,
    // Increase navigation timeout
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Ensure the dev server is running before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120_000, // 2 minutes to start
    reuseExistingServer: !process.env.CI,
  },
})
