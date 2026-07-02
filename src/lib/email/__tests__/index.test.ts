import { describe, it, expect, vi } from 'vitest';
import { isEmailReal, sendEmail, sendPaymentFailedEmail, sendPaymentReceivedEmail, sendWelcomeEmail } from '../index';

describe('email module — mock fallback (no RESEND_API_KEY in test env)', () => {
  it('isEmailReal is false without a key', () => {
    expect(isEmailReal()).toBe(false);
  });

  it('sendEmail never throws and returns a mock id', async () => {
    const result = await sendEmail({
      to: 'ana@x.com',
      template: { kind: 'welcome', name: 'Ana Souza', orgName: 'Clínica X' },
    });
    expect(result.provider).toBe('mock');
    expect(result.id).toMatch(/^mock_/);
  });

  it('logs the send instead of silently doing nothing (visible proof of "delivery")', async () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await sendWelcomeEmail({ to: 'ana@x.com', name: 'Ana', orgName: 'X' });
    expect(spy).toHaveBeenCalledWith('[auronis:email:mock]', expect.stringContaining('ana@x.com'));
    spy.mockRestore();
  });

  // Regression: the welcome subject used to take name.split(' ')[0], which
  // turned "Dra. Camila Rocha" into "Welcome, Dra.!" — full name now, always.
  it('uses the full name in the welcome subject, not just the first word', async () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await sendWelcomeEmail({ to: 'x@x.com', name: 'Dra. Camila Rocha', orgName: 'Clínica X', locale: 'pt-BR' });
    const logged = spy.mock.calls[0][1] as string;
    expect(logged).toContain('Dra. Camila Rocha');
    expect(logged).not.toMatch(/Dra\.!/);
    spy.mockRestore();
  });

  it('renders all three templates in all four locales without throwing', async () => {
    const locales = ['pt-BR', 'en', 'zh-CN', 'fr-FR'];
    for (const locale of locales) {
      await expect(
        sendWelcomeEmail({ to: 'a@x.com', name: 'Ana', orgName: 'X', locale }),
      ).resolves.toMatchObject({ provider: 'mock' });
      await expect(
        sendPaymentReceivedEmail({ to: 'a@x.com', name: 'Ana', orgName: 'X', planName: 'Pro', amountCents: 19900, currency: 'BRL', locale }),
      ).resolves.toMatchObject({ provider: 'mock' });
      await expect(
        sendPaymentFailedEmail({ to: 'a@x.com', name: 'Ana', orgName: 'X', planName: 'Pro', locale }),
      ).resolves.toMatchObject({ provider: 'mock' });
    }
  });

  it('formats the amount as currency in the payment-received email', async () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await sendPaymentReceivedEmail({
      to: 'a@x.com',
      name: 'Ana',
      orgName: 'Clínica X',
      planName: 'Pro',
      amountCents: 19900,
      currency: 'BRL',
      locale: 'pt-BR',
    });
    const logged = spy.mock.calls[0][1] as string;
    expect(logged).toMatch(/R\$\s?199,00/);
    spy.mockRestore();
  });
});
