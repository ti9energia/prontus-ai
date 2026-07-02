import { test, expect } from '@playwright/test';
import { uniqueIdentity } from './helpers';

test.describe('Login', () => {
  test('rejects invalid credentials with a visible, accessible error', async ({ page }) => {
    await page.goto('/pt-BR/login');
    await page.getByLabel('E-mail').fill('nao-existe@e2e.auronishealth.test');
    await page.getByLabel('Senha', { exact: true }).fill('senha-errada-qualquer');
    await page.getByRole('button', { name: 'Entrar' }).click();
    // Excludes Next.js's own #__next-route-announcer__, which also has
    // role="alert" and is always present — see errors-and-regressions.spec.ts.
    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toBeVisible();
    await expect(page).toHaveURL(/\/pt-BR\/login/); // stays put, no false navigation
  });

  test('no demo-login shortcut is exposed on the login screen (product decision — see DECISOES.md)', async ({
    page,
  }) => {
    await page.goto('/pt-BR/login');
    await expect(page.getByRole('button', { name: /demonstra[cç][aã]o|demo/i })).toHaveCount(0);
  });

  test('offers a path to create an account (fase 2 finding: funnel had no signup)', async ({ page }) => {
    await page.goto('/pt-BR/login');
    await page.getByRole('link', { name: 'Criar conta grátis' }).click();
    await expect(page).toHaveURL(/\/pt-BR\/signup/);
  });
});

test.describe('Signup', () => {
  test('creates a real account and lands on onboarding, already signed in', async ({ page }) => {
    const identity = uniqueIdentity('newacct');
    await page.goto('/pt-BR/signup');
    await page.getByLabel('Nome da clínica').fill(identity.orgName);
    await page.getByLabel('Seu nome').fill(identity.name);
    await page.getByLabel('E-mail').fill(identity.email);
    await page.getByLabel('Senha', { exact: true }).fill(identity.password);
    await page.getByRole('button', { name: 'Criar conta grátis' }).click();

    await page.waitForURL('**/onboarding');

    // Proves signup performed a REAL login (session cookie), not just a
    // client-side redirect: session endpoint must now say authed.
    const session = await page.request.get('/api/auth/session');
    const body = await session.json();
    expect(body.authed).toBe(true);
    expect(body.email).toBe(identity.email);
  });

  test('a duplicate email is rejected with a link back to login, not a generic crash', async ({ page }) => {
    const identity = uniqueIdentity('dupe');
    // First signup succeeds.
    await page.goto('/pt-BR/signup');
    await page.getByLabel('Nome da clínica').fill(identity.orgName);
    await page.getByLabel('Seu nome').fill(identity.name);
    await page.getByLabel('E-mail').fill(identity.email);
    await page.getByLabel('Senha', { exact: true }).fill(identity.password);
    await page.getByRole('button', { name: 'Criar conta grátis' }).click();
    await page.waitForURL('**/onboarding');

    // Second signup with the SAME email, from a clean (logged-out) context.
    await page.request.post('/api/auth/logout');
    await page.goto('/pt-BR/signup');
    await page.getByLabel('Nome da clínica').fill('Outra Clínica');
    await page.getByLabel('Seu nome').fill('Outro Nome');
    await page.getByLabel('E-mail').fill(identity.email);
    await page.getByLabel('Senha', { exact: true }).fill('outra-senha-bem-forte-123');
    await page.getByRole('button', { name: 'Criar conta grátis' }).click();

    // Excludes Next.js's own #__next-route-announcer__, which also has
    // role="alert" and is always present — see errors-and-regressions.spec.ts.
    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    // Scoped to the alert itself — the signup page's own permanent "Já tem
    // conta? Entrar" footer link would otherwise also match and make this
    // locator ambiguous.
    await expect(alert.getByRole('link', { name: 'Entrar' })).toBeVisible();
    await expect(page).toHaveURL(/\/pt-BR\/signup/); // did NOT navigate away
  });

  test('a freshly created account can log back in with the same password (auth extension works end-to-end)', async ({
    page,
  }) => {
    const identity = uniqueIdentity('relogin');
    await page.goto('/pt-BR/signup');
    await page.getByLabel('Nome da clínica').fill(identity.orgName);
    await page.getByLabel('Seu nome').fill(identity.name);
    await page.getByLabel('E-mail').fill(identity.email);
    await page.getByLabel('Senha', { exact: true }).fill(identity.password);
    await page.getByRole('button', { name: 'Criar conta grátis' }).click();
    await page.waitForURL('**/onboarding');

    await page.request.post('/api/auth/logout');
    await page.goto('/pt-BR/login');
    await page.getByLabel('E-mail').fill(identity.email);
    await page.getByLabel('Senha', { exact: true }).fill(identity.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // A brand-new account resumes onboarding (never marked complete yet).
    await page.waitForURL('**/onboarding');
  });

  test('a short password is rejected client-visibly, not silently', async ({ page }) => {
    const identity = uniqueIdentity('shortpw');
    await page.goto('/pt-BR/signup');
    await page.getByLabel('Nome da clínica').fill(identity.orgName);
    await page.getByLabel('Seu nome').fill(identity.name);
    await page.getByLabel('E-mail').fill(identity.email);
    await page.getByLabel('Senha', { exact: true }).fill('short');
    await page.getByRole('button', { name: 'Criar conta grátis' }).click();
    // HTML5 minLength=10 blocks submission client-side before any request —
    // still on the signup page, form not submitted.
    await expect(page).toHaveURL(/\/pt-BR\/signup/);
  });
});
