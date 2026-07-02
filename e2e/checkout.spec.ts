import { test, expect } from '@playwright/test';
import { signUpFreshUser, completeOnboarding } from './helpers';

test.describe('Checkout', () => {
  test('visiting /checkout without a session redirects to login and preserves the plan in ?next=', async ({
    page,
  }) => {
    await page.goto('/pt-BR/checkout?plan=pro&cycle=monthly');
    await expect(page).toHaveURL(/\/pt-BR\/login\?next=/);
  });

  test('PIX: shows a real QR code, copy-paste code, and settles to paid via live polling (sandbox)', async ({
    page,
  }) => {
    // Longer than the 30s default: signup + onboarding + the mock's own
    // ~8s settlement + poll interval need real headroom, especially on CI.
    test.setTimeout(60_000);
    await signUpFreshUser(page, 'checkout-pix');
    await completeOnboarding(page);

    await page.goto('/pt-BR/checkout?plan=starter&cycle=monthly');
    await page.getByLabel('Nome completo').fill('Dra. Compradora Teste');
    await page.getByLabel(/^E-mail$/).fill('compradora@e2e.auronishealth.test');
    await page.getByRole('button', { name: 'Confirmar e pagar' }).click();

    await expect(page.getByRole('heading', { name: 'Pague com PIX' })).toBeVisible();
    await expect(page.getByAltText('PIX QR code')).toBeVisible();
    await expect(page.getByText('Aguardando confirmação do pagamento…')).toBeVisible();

    // The sandbox mock self-settles ~8s after checkout session creation —
    // the checkout page polls GET /api/checkout/session/:id and must reflect
    // that transition live, with zero further user interaction.
    await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Ir para o app' })).toBeVisible();
  });

  test('boleto: shows a linha digitável and a link to view the boleto', async ({ page }) => {
    await signUpFreshUser(page, 'checkout-boleto');
    await completeOnboarding(page);

    await page.goto('/pt-BR/checkout?plan=starter&cycle=monthly');
    await page.getByLabel('Nome completo').fill('Dra. Compradora Teste');
    await page.getByLabel(/^E-mail$/).fill('compradora2@e2e.auronishealth.test');
    await page.getByRole('button', { name: 'Boleto', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar e pagar' }).click();

    await expect(page.getByRole('heading', { name: 'Pague com boleto' })).toBeVisible();
    // exact: true — the boleto subtitle text ("Copie a linha digitável ou…")
    // also contains this substring and would otherwise match too.
    await expect(page.getByText('Linha digitável', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver boleto' })).toBeVisible();
  });

  test('card: an even test number is approved immediately, no polling needed', async ({ page }) => {
    await signUpFreshUser(page, 'checkout-card-ok');
    await completeOnboarding(page);

    await page.goto('/pt-BR/checkout?plan=starter&cycle=monthly');
    await page.getByLabel('Nome completo').fill('Dra. Compradora Teste');
    await page.getByLabel(/^E-mail$/).fill('compradora3@e2e.auronishealth.test');
    await page.getByRole('button', { name: 'Cartão', exact: true }).click();
    await page.getByLabel('Número do cartão').fill('4242 4242 4242 4242');
    await page.getByLabel('Validade (MM/AA)').fill('1230');
    await page.getByLabel('CVV').fill('123');
    await page.getByLabel('Nome no cartão').fill('DRA COMPRADORA TESTE');
    await page.getByRole('button', { name: 'Confirmar e pagar' }).click();

    await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible();
  });

  test('card: an odd test number is declined, with a working retry', async ({ page }) => {
    await signUpFreshUser(page, 'checkout-card-fail');
    await completeOnboarding(page);

    await page.goto('/pt-BR/checkout?plan=starter&cycle=monthly');
    await page.getByLabel('Nome completo').fill('Dra. Compradora Teste');
    await page.getByLabel(/^E-mail$/).fill('compradora4@e2e.auronishealth.test');
    await page.getByRole('button', { name: 'Cartão', exact: true }).click();
    await page.getByLabel('Número do cartão').fill('4242 4242 4242 4241');
    await page.getByLabel('Validade (MM/AA)').fill('1230');
    await page.getByLabel('CVV').fill('123');
    await page.getByLabel('Nome no cartão').fill('DRA COMPRADORA TESTE');
    await page.getByRole('button', { name: 'Confirmar e pagar' }).click();

    await expect(page.getByRole('heading', { name: 'Pagamento não aprovado' })).toBeVisible();
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByRole('button', { name: 'Confirmar e pagar' })).toBeVisible();
  });

  test('the plan selector shows the real Starter price (R$99) — fase 2 P0 regression guard', async ({ page }) => {
    // FASE 2 found Pricing and the ROI calculator hardcoding two DIFFERENT
    // price sets (99/199/349 vs 97/197/397); FASE 3 fixed it by making both
    // import from components/landing/plans-data.ts. The checkout flow (fase 5)
    // imports the SAME module — this just confirms the number that reaches
    // the screen is the real one, not a re-hardcoded drift.
    await signUpFreshUser(page, 'checkout-prices');
    await completeOnboarding(page);
    await page.goto('/pt-BR/checkout?plan=starter&cycle=monthly');
    const starterButton = page.getByRole('button', { name: /Starter/ });
    await expect(starterButton).toBeVisible();
    // Displayed as "R$ 99/mês" (no decimals) — (?!\d) avoids a false match on 999.
    await expect(starterButton).toContainText(/R\$\s?99(?!\d)/);
  });

  test('billing entry point is reachable from within the app (Settings → Plan & billing → Assinar)', async ({
    page,
  }) => {
    await signUpFreshUser(page, 'checkout-settings');
    await completeOnboarding(page);

    await page.goto('/pt-BR/app?open=settings');
    await page.getByRole('button', { name: 'Plano & cobrança' }).click();
    await expect(page.getByRole('heading', { name: 'Plano & cobrança' })).toBeVisible();

    await page.getByRole('link', { name: 'Assinar' }).first().click();
    await expect(page).toHaveURL(/\/pt-BR\/checkout\?plan=/);
    await expect(page.getByRole('heading', { name: 'Assinar plano' })).toBeVisible();
  });

  test('yearly cycle shows the "2 months free" hint and a lower effective price', async ({ page }) => {
    await signUpFreshUser(page, 'checkout-yearly');
    await completeOnboarding(page);
    await page.goto('/pt-BR/checkout?plan=pro&cycle=yearly');
    await expect(page.getByRole('heading', { name: 'Assinar plano' })).toBeVisible();
    await expect(page.getByText('2 meses grátis')).toBeVisible();
  });
});
