import { defineConfig, devices } from '@playwright/test';
import { E2E_API_URL } from './tests/e2e/config';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://localhost:5173',
    env: {
      VITE_API_URL: E2E_API_URL,
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
