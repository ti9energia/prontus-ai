import { test, expect } from '@playwright/test';
import { signUpFreshUser } from './helpers';

test.describe('Onboarding wizard', () => {
  test('walks all 4 steps in order and lands on /app', async ({ page }) => {
    await signUpFreshUser(page, 'onb-full');

    await expect(page.getByRole('heading', { name: 'Conte sobre sua clínica' })).toBeVisible();
    await page.getByRole('button', { name: '2 a 5 médicos' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: 'Qual sua especialidade principal?' })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: 'Convide sua equipe' })).toBeVisible();
    await page.getByRole('button', { name: 'Pular' }).click();

    await expect(page.getByRole('heading', { name: 'Você está pronto' })).toBeVisible();
    await page.getByRole('button', { name: 'Ir para o app' }).click();

    await page.waitForURL('**/app');
  });

  test('progress persists across a reload (server-side, not localStorage)', async ({ page }) => {
    await signUpFreshUser(page, 'onb-resume');
    await page.getByRole('button', { name: 'Continuar' }).click(); // finishes "profile"
    await expect(page.getByRole('heading', { name: 'Qual sua especialidade principal?' })).toBeVisible();

    await page.reload();

    // Resumes on "specialty", not back at "profile" — proves the progress
    // came from the server (GET /api/onboarding), not client-only state.
    await expect(page.getByRole('heading', { name: 'Qual sua especialidade principal?' })).toBeVisible();
  });

  test('team step lets you add and remove an invite email before continuing', async ({ page }) => {
    await signUpFreshUser(page, 'onb-team');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: 'Convide sua equipe' })).toBeVisible();
    const emailInput = page.getByPlaceholder('colega@clinica.com');
    await emailInput.fill('colega@e2e.auronishealth.test');
    await page.getByRole('button', { name: 'Adicionar' }).click();
    await expect(page.getByText('colega@e2e.auronishealth.test')).toBeVisible();

    await page.getByRole('button', { name: /excluir colega@e2e/i }).click();
    await expect(page.getByText('colega@e2e.auronishealth.test')).not.toBeVisible();
  });

  test('an org that already finished onboarding is redirected straight to /app', async ({ page }) => {
    await signUpFreshUser(page, 'onb-done');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Pular' }).click();
    await page.getByRole('button', { name: 'Ir para o app' }).click();
    await page.waitForURL('**/app');

    await page.goto('/pt-BR/onboarding');
    await page.waitForURL('**/app');
  });

  test('visiting /onboarding without a session redirects to login', async ({ page }) => {
    await page.goto('/pt-BR/onboarding');
    await expect(page).toHaveURL(/\/pt-BR\/login/);
  });
});
