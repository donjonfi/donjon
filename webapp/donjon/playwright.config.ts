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
    { name: 'jouer', testMatch: '**/jouer*.e2e.ts', use: { baseURL: 'http://127.0.0.1:4201' } },
    { name: 'creer', testMatch: '**/creer*.e2e.ts', use: { baseURL: 'http://127.0.0.1:4200' } },
  ],
  // Les applis sont compilées avant (`npm run e2e:build`, appelé par `npm run e2e`) puis servies en statique.
  webServer: [
    {
      command: 'node e2e/serveur-statique.mjs dist/donjon-jouer/browser 4201',
      url: 'http://127.0.0.1:4201',
      timeout: 30_000,
      reuseExistingServer: !process.env['CI'],
    },
    {
      command: 'node e2e/serveur-statique.mjs dist/donjon-creer/browser 4200',
      url: 'http://127.0.0.1:4200',
      timeout: 30_000,
      reuseExistingServer: !process.env['CI'],
    },
  ],
});
