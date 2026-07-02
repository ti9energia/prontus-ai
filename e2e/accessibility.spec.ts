import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginAsDemo, signUpFreshUser } from './helpers';

/** Fails the test with the violation list inlined in the assertion message —
 *  a bare boolean pass/fail would force digging through a separate report. */
async function expectNoSeriousViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    // aria-hidden-focus: axe-core doesn't recognize the `inert` DOM property
    // as mitigation for a focusable descendant inside aria-hidden — a
    // confirmed axe-core limitation (dequelabs/axe-core#3527), not a real
    // bug. Our Sheet component (src/components/ui/overlay.tsx) already sets
    // `el.inert = !open` correctly; excluding here to avoid failing on a
    // false positive the tool itself acknowledges.
    .disableRules(['aria-hidden-focus'])
    .analyze();
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
