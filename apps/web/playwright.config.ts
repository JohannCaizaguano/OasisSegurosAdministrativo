import { defineConfig, devices } from '@playwright/test';

/**
 * Prueba e2e del flujo completo. Requiere la infraestructura levantada:
 *   docker compose -f compose.dev.yaml up -d && pnpm dev:chain && pnpm dev
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.WEB_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    locale: 'es-EC',
  },
  webServer: [
    {
      command: 'node test/start-servicios.mjs',
      cwd: '../api',
      url: 'http://localhost:3000/api/v1/health',
      reuseExistingServer: true,
      timeout: 90_000,
    },
    {
      command: 'pnpm dev',
      cwd: '.',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
