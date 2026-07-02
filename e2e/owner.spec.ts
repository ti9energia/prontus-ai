import { test, expect } from '@playwright/test';

const OWNER_EMAIL = 'owner@auronishealth.com'; // config.auth.ownerEmail default
const OWNER_PASSWORD = 'e2e-owner-password-123'; // set in playwright.config.ts webServer.env

test.describe('Owner panel', () => {
  test('owner credentials (AUTH_SECRET + OWNER_PASSWORD) log in for real and reach /owner', async ({ page }) => {
    await page.goto('/pt-BR/login');
    await page.getByLabel('E-mail').fill(OWNER_EMAIL);
    await page.getByLabel('Senha', { exact: true }).fill(OWNER_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('**/owner');

    const session = await page.request.get('/api/auth/session');
    const body = await session.json();
    expect(body.role).toBe('owner');
  });

  test('a doctor session cannot reach /owner (role gate, not just "any session")', async ({ page }) => {
    await page.request.post('/api/auth/login', { data: { demo: true } });
    await page.goto('/pt-BR/owner');
    await expect(page).toHaveURL(/\/pt-BR\/login/);
  });

  test('suspending a tenant requires typing its name to confirm (destructive-action guard, fase 3 fix)', async ({
    page,
  }) => {
    await page.goto('/pt-BR/login');
    await page.getByLabel('E-mail').fill(OWNER_EMAIL);
    await page.getByLabel('Senha', { exact: true }).fill(OWNER_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('**/owner');

    await page.getByRole('button', { name: /organiza[cç][oõ]es|tenants/i }).first().click();
    const suspendButtons = page.getByRole('button', { name: /suspender/i });
    await expect(suspendButtons.first()).toBeVisible();
    await suspendButtons.first().click();

    // Confirm dialog opens and the confirm action starts disabled until the
    // exact tenant name is typed — never a one-click destructive action.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const confirmButton = dialog.getByRole('button', { name: /suspender/i });
    await expect(confirmButton).toBeDisabled();
  });
});
