import type { Page } from '@playwright/test';

/** A fresh, collision-free identity for signup-style tests (each CI run gets
 *  a clean in-memory store, but parallel workers share ONE running server —
 *  unique emails avoid EMAIL_TAKEN races between specs). */
export function uniqueIdentity(prefix: string) {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    orgName: `Clínica E2E ${stamp}`,
    name: `Dr. Teste ${stamp}`,
    email: `${prefix}.${stamp}@e2e.auronishealth.test`,
    password: `senha-e2e-${stamp}-forte`,
  };
}

/** Signs up a brand-new org+user and leaves the browser on /onboarding
 *  (a real session cookie is set — this is the actual signup flow, not a
 *  shortcut). Returns the identity used, for tests that need to log back in. */
export async function signUpFreshUser(page: Page, prefix = 'signup') {
  const identity = uniqueIdentity(prefix);
  await page.goto('/pt-BR/signup');
  await page.getByLabel('Nome da clínica').fill(identity.orgName);
  await page.getByLabel('Seu nome').fill(identity.name);
  await page.getByLabel('E-mail').fill(identity.email);
  await page.getByLabel('Senha').fill(identity.password);
  await page.getByRole('button', { name: 'Criar conta grátis' }).click();
  await page.waitForURL('**/onboarding');
  return identity;
}

/** Fast-forwards a freshly-signed-up user through all 4 onboarding steps to /app. */
export async function completeOnboarding(page: Page) {
  await page.getByRole('button', { name: 'Continuar' }).click(); // profile (default size preselected)
  await page.getByRole('button', { name: 'Continuar' }).click(); // specialty (default preselected)
  await page.getByRole('button', { name: 'Pular' }).click(); // team (optional)
  await page.getByRole('button', { name: 'Ir para o app' }).click(); // tour
  await page.waitForURL('**/app');
}

/** Logs in via the public demo shortcut (DEMO_MODE=true in the E2E server env). */
export async function loginAsDemo(page: Page) {
  await page.goto('/pt-BR/login');
  // The demo shortcut has no dedicated UI button (removed by product decision —
  // see .entrega/DECISOES.md); drive the same POST the app itself would use to
  // reach a signed-in state deterministically for specs that only need *a*
  // session, not the credentials UI specifically.
  await page.request.post('/api/auth/login', { data: { demo: true } });
  await page.goto('/pt-BR/app');
}
