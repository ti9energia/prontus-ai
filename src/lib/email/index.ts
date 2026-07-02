/**
 * Transactional email seam (fase 5.4).
 *
 * Real path:   RESEND_API_KEY set → sends via the Resend API.
 * Absent path: structured console log (visible, deterministic "mock send") —
 *              signup/checkout keep working end-to-end with zero credentials.
 *
 * Server-only (fetch + no client usage today), but doesn't touch node:crypto,
 * so it's safe to import from any server context (route handlers, webhooks).
 */

import { config } from '@/lib/config';

export type EmailTemplateKind = 'welcome' | 'paymentReceived' | 'paymentFailed';

export interface EmailTemplate {
  kind: EmailTemplateKind;
  name: string;
  orgName: string;
  planName?: string;
  amountCents?: number;
  currency?: string;
}

export interface SendEmailInput {
  to: string;
  template: EmailTemplate;
  locale?: string;
}

export interface SendEmailResult {
  id: string;
  provider: 'resend' | 'mock';
}

export function isEmailReal(): boolean {
  return !!config.email.resendApiKey;
}

function money(cents: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

const L = (locale: string, pt: string, en: string, zh: string, fr: string) =>
  locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

function render(template: EmailTemplate, locale: string): { subject: string; text: string; html: string } {
  if (template.kind === 'welcome') {
    // Full name, not "first word" — a title prefix ("Dra./Dr.") is common in
    // this field and would otherwise become the greeting ("Welcome, Dra.!").
    const subject = L(
      locale,
      `Bem-vindo(a) ao Auronis Health, ${template.name}!`,
      `Welcome to Auronis Health, ${template.name}!`,
      `欢迎使用 Auronis Health，${template.name}！`,
      `Bienvenue sur Auronis Health, ${template.name} !`,
    );
    const text = L(
      locale,
      `Olá ${template.name},\n\nA conta de "${template.orgName}" foi criada. Entre no app para continuar o onboarding e conhecer a Mari, sua copiloto de IA.\n\n— Equipe Auronis Health`,
      `Hi ${template.name},\n\nYour "${template.orgName}" account is ready. Sign in to continue onboarding and meet Mari, your AI copilot.\n\n— The Auronis Health team`,
      `你好 ${template.name}，\n\n"${template.orgName}" 的账户已创建。登录以继续引导流程，认识你的 AI 副驾 Mari。\n\n— Auronis Health 团队`,
      `Bonjour ${template.name},\n\nLe compte de « ${template.orgName} » est prêt. Connectez-vous pour poursuivre l’intégration et découvrir Mari, votre copilote IA.\n\n— L’équipe Auronis Health`,
    );
    return { subject, text, html: `<p>${text.replace(/\n/g, '<br/>')}</p>` };
  }

  if (template.kind === 'paymentReceived') {
    const amount = money(template.amountCents ?? 0, template.currency ?? 'BRL', locale);
    const subject = L(locale, 'Pagamento confirmado', 'Payment confirmed', '支付已确认', 'Paiement confirmé');
    const text = L(
      locale,
      `Olá ${template.name},\n\nRecebemos o pagamento de ${amount} do plano ${template.planName} para "${template.orgName}". Sua assinatura está ativa.\n\n— Equipe Auronis Health`,
      `Hi ${template.name},\n\nWe received your ${amount} payment for the ${template.planName} plan on "${template.orgName}". Your subscription is active.\n\n— The Auronis Health team`,
      `你好 ${template.name}，\n\n我们已收到 "${template.orgName}" ${template.planName} 套餐的 ${amount} 付款。你的订阅已生效。\n\n— Auronis Health 团队`,
      `Bonjour ${template.name},\n\nNous avons reçu votre paiement de ${amount} pour l’offre ${template.planName} sur « ${template.orgName} ». Votre abonnement est actif.\n\n— L’équipe Auronis Health`,
    );
    return { subject, text, html: `<p>${text.replace(/\n/g, '<br/>')}</p>` };
  }

  // paymentFailed
  const subject = L(locale, 'Não conseguimos confirmar seu pagamento', "We couldn't confirm your payment", '付款未能确认', "Nous n'avons pas pu confirmer votre paiement");
  const text = L(
    locale,
    `Olá ${template.name},\n\nO pagamento do plano ${template.planName} para "${template.orgName}" não foi confirmado. Tente novamente pelo checkout.\n\n— Equipe Auronis Health`,
    `Hi ${template.name},\n\nThe payment for the ${template.planName} plan on "${template.orgName}" wasn't confirmed. Please try again from checkout.\n\n— The Auronis Health team`,
    `你好 ${template.name}，\n\n"${template.orgName}" ${template.planName} 套餐的付款未能确认。请重新前往结账页面重试。\n\n— Auronis Health 团队`,
    `Bonjour ${template.name},\n\nLe paiement pour l’offre ${template.planName} sur « ${template.orgName} » n’a pas été confirmé. Merci de réessayer depuis le paiement.\n\n— L’équipe Auronis Health`,
  );
  return { subject, text, html: `<p>${text.replace(/\n/g, '<br/>')}</p>` };
}

async function sendViaResend(to: string, subject: string, text: string, html: string): Promise<string> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.email.resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from: config.email.from, to: [to], subject, text, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Resend API error: ${body}`);
  }
  const data = (await res.json()) as { id?: string };
  return data.id ?? `resend_${Date.now().toString(36)}`;
}

/** Sends an email. Never throws — a mail failure must not break signup/checkout. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const locale = input.locale ?? 'pt-BR';
  const { subject, text, html } = render(input.template, locale);

  if (isEmailReal()) {
    try {
      const id = await sendViaResend(input.to, subject, text, html);
      return { id, provider: 'resend' };
    } catch (e) {
      console.error('[auronis:email] Resend send failed, falling back to log:', e instanceof Error ? e.message : e);
    }
  }

  const id = `mock_${Date.now().toString(36)}`;
  // Log the rendered body too, not just metadata — a mock "send" is only
  // useful as proof of execution if you can see what would have gone out.
  console.info('[auronis:email:mock]', JSON.stringify({ to: input.to, subject, text, id }));
  return { id, provider: 'mock' };
}

export function sendWelcomeEmail(input: { to: string; name: string; orgName: string; locale?: string }) {
  return sendEmail({ to: input.to, locale: input.locale, template: { kind: 'welcome', name: input.name, orgName: input.orgName } });
}

export function sendPaymentReceivedEmail(input: {
  to: string;
  name: string;
  orgName: string;
  planName: string;
  amountCents: number;
  currency: string;
  locale?: string;
}) {
  return sendEmail({
    to: input.to,
    locale: input.locale,
    template: {
      kind: 'paymentReceived',
      name: input.name,
      orgName: input.orgName,
      planName: input.planName,
      amountCents: input.amountCents,
      currency: input.currency,
    },
  });
}

export function sendPaymentFailedEmail(input: { to: string; name: string; orgName: string; planName: string; locale?: string }) {
  return sendEmail({
    to: input.to,
    locale: input.locale,
    template: { kind: 'paymentFailed', name: input.name, orgName: input.orgName, planName: input.planName },
  });
}
