import { defineConfig, devices } from '@playwright/test';

const devServerUrl = 'http://localhost:5173';

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env['CI'],
  reporter: 'list',
  use: { baseURL: devServerUrl, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: devServerUrl,
    reuseExistingServer: true,
  },
});
