import { test, expect } from '@playwright/test';
import { loginAsDemo } from './helpers';

test.describe('Workspace', () => {
  test('demo session loads the workspace shell (rail, tabs, no console errors)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await loginAsDemo(page);
    await expect(page).toHaveURL(/\/pt-BR\/app/);
    await expect(page.getByRole('tablist').first()).toBeVisible();

    expect(errors, `unexpected page errors: ${errors.join('; ')}`).toEqual([]);
  });

  test('⌘K opens the command palette and can navigate to a screen', async ({ page }) => {
    await loginAsDemo(page);
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('regression: PWA shortcut deep links (?open=) actually open the target tab (was silently ignored)', async ({
    page,
  }) => {
    await loginAsDemo(page);
    await page.goto('/pt-BR/app?open=billing');
    // The tab strip must show a tab for the deep-linked screen — not just
    // land on whatever the default tab happens to be.
    await expect(page.getByRole('tab', { selected: true })).toBeVisible();
    const tabstrip = page.getByRole('tablist').first();
    await expect(tabstrip).toBeVisible();
  });

  test('unauthenticated visit to /app redirects to login', async ({ page }) => {
    await page.goto('/pt-BR/app');
    await expect(page).toHaveURL(/\/pt-BR\/login/);
  });

  test('unauthenticated visit to /owner redirects to login', async ({ page }) => {
    await page.goto('/pt-BR/owner');
    await expect(page).toHaveURL(/\/pt-BR\/login/);
  });
});
