import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. `webServer` owns the app's lifecycle: Playwright starts it,
 * waits for /api/health, runs the suite, and tears the process down when
 * done — no server is left running afterward. Requires `npm run build` to
 * have already produced .next/ (both locally and in CI — see
 * .github/workflows/ci.yml's separate "Build" step before "Run E2E suite").
 */
const PORT = 3100; // distinct from the default dev port, avoids clashing with a dev server
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github'], ['list']] : [['html', { open: 'never' }], ['list']],
  // Generous defaults: several specs chain signup → onboarding → checkout in
  // one test, and CI runners are slower than a local machine.
  timeout: 45_000,
  expect: { timeout: 8_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Fixed values so login/session-dependent specs are deterministic —
      // never real secrets (this only ever runs against a local/CI build).
      AUTH_SECRET: 'e2e-test-secret-do-not-use-in-production',
      OWNER_PASSWORD: 'e2e-owner-password-123',
      DEMO_MODE: 'true',
      // The full suite makes far more login/signup calls than a real abuser
      // would in 15min (many specs each sign up their own throwaway account).
      // These overrides only exist here — production keeps the real 8/5
      // defaults (see lib/config.auth.maxLoginAttempts/maxSignupAttempts).
      E2E_MAX_LOGIN_ATTEMPTS: '500',
      E2E_MAX_SIGNUP_ATTEMPTS: '500',
    },
  },
});
