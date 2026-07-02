import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginAsDemo, signUpFreshUser } from './helpers';

/** Fails the test with the violation list inlined in the assertion message —
 *  a bare boolean pass/fail would force digging through a separate report. */
async function expectNoSeriousViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious, JSON.stringify(serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), null, 2)).toEqual(
    [],
  );
}

test.describe('Accessibility (WCAG 2 A/AA — axe)', () => {
  test('landing page', async ({ page }) => {
    await page.goto('/pt-BR');
    await expectNoSeriousViolations(page);
  });

  test('login page', async ({ page }) => {
    await page.goto('/pt-BR/login');
    await expectNoSeriousViolations(page);
  });

  test('signup page', async ({ page }) => {
    await page.goto('/pt-BR/signup');
    await expectNoSeriousViolations(page);
  });

  test('privacy / legal page', async ({ page }) => {
    await page.goto('/pt-BR/privacy');
    await expectNoSeriousViolations(page);
  });

  test('onboarding wizard (profile step)', async ({ page }) => {
    await signUpFreshUser(page, 'a11y-onb');
    await expectNoSeriousViolations(page);
  });

  test('checkout page', async ({ page }) => {
    await signUpFreshUser(page, 'a11y-checkout'); // leaves the session authenticated
    await page.goto('/pt-BR/checkout?plan=pro&cycle=monthly');
    await expectNoSeriousViolations(page);
  });

  test('workspace shell (logged in)', async ({ page }) => {
    await loginAsDemo(page);
    await expectNoSeriousViolations(page);
  });
});
