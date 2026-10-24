import { defineConfig, devices } from '@playwright/test';

/**
 * Tests e2e (navigateur réel) des applis donjon-jouer et donjon-creer.
 * Lancer : `npm run e2e` (démarre les deux `ng serve` si besoin).
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'jouer', testMatch: '**/jouer*.e2e.ts', use: { baseURL: 'http://localhost:4201' } },
    { name: 'creer', testMatch: '**/creer*.e2e.ts', use: { baseURL: 'http://localhost:4200' } },
  ],
  webServer: [
    {
      command: 'npx ng serve donjon-jouer --configuration development --port 4201',
      url: 'http://localhost:4201',
      timeout: 240_000,
      reuseExistingServer: !process.env['CI'],
    },
    {
      command: 'node ensure-standalone.js && npx ng serve donjon-creer --configuration development --port 4200',
      url: 'http://localhost:4200',
      timeout: 240_000,
      reuseExistingServer: !process.env['CI'],
    },
  ],
});
