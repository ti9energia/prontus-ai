import { test, expect } from '@playwright/test';
import { signUpFreshUser, completeOnboarding } from './helpers';

test.describe('Error paths & resilience', () => {
  test('checkout shows a real error state (not a silent failure) when the payment provider fails', async ({
    page,
  }) => {
    await signUpFreshUser(page, 'err-provider');
    await completeOnboarding(page);
    await page.goto('/pt-BR/checkout?plan=starter&cycle=monthly');

    // Simulate the payment provider being down — intercept only the checkout
    // session call, everything else on the page is untouched.
    await page.route('**/api/checkout/session', (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'PROVIDER_ERROR' } }),
      });
    });

    await page.getByLabel('Nome completo').fill('Dra. Erro Teste');
    await page.getByLabel(/^E-mail$/).fill('erro@e2e.auronishealth.test');
    await page.getByRole('button', { name: 'Confirmar e pagar' }).click();

    // Next.js's own route announcer (#__next-route-announcer__) also has
    // role="alert" and is always present in the DOM — exclude it so this
    // targets the app's actual error banner, not framework plumbing.
    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toBeVisible();
    // Still on the setup form — no false "success", no blank/crashed screen.
    await expect(page.getByRole('button', { name: 'Confirmar e pagar' })).toBeVisible();
  });

  test('a network drop on signup surfaces an error instead of hanging forever', async ({ page }) => {
    await page.goto('/pt-BR/signup');
    await page.route('**/api/auth/signup', (route) => route.abort('failed'));

    await page.getByLabel('Nome da clínica').fill('Clínica Offline');
    await page.getByLabel('Seu nome').fill('Dr. Offline');
    await page.getByLabel('E-mail').fill('offline@e2e.auronishealth.test');
    await page.getByLabel('Senha', { exact: true }).fill('senha-offline-teste-123');
    await page.getByRole('button', { name: 'Criar conta grátis' }).click();

    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toBeVisible({ timeout: 10_000 });
  });

  test('security headers are present on every response (CSP, HSTS, frame-ancestors)', async ({ page }) => {
    const response = await page.goto('/pt-BR');
    expect(response).not.toBeNull();
    const headers = response!.headers();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['strict-transport-security']).toContain('max-age=');
  });

  test('the API health check responds honestly about auth/model configuration', async ({ page }) => {
    const res = await page.request.get('/api/health');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.checks.auth).toBe('boolean');
    expect(typeof body.checks.model).toBe('boolean');
  });

  test('the public v1 API rejects requests without an API key', async ({ page }) => {
    // `npm run start` always runs in production mode (Next's own behavior),
    // so the sk_test_* dev bypass in lib/api/auth.ts is correctly OFF here —
    // this only exercises the "no key at all" rejection, true in any mode.
    const res = await page.request.get('/api/v1/patients');
    expect(res.status()).toBe(401);
  });

  test('the public v1 API rejects an unknown/invalid key the same way', async ({ page }) => {
    const res = await page.request.get('/api/v1/patients', {
      headers: { authorization: 'Bearer sk_live_not_a_real_key' },
    });
    expect(res.status()).toBe(401);
  });
});
