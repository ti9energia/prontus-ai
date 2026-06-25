/**
 * Per-payer denial intelligence — the defensible moat.
 *
 * Generic pre-denial rules catch the obvious gaps; the real glosa game in Brazil
 * is payer-specific: each operadora denies differently (prior-auth codes, card
 * formats, referral needs). This catalog encodes that knowledge declaratively so
 * the pre-denial check and Mari can be *operadora-aware* — something the global
 * scribes don't do. The catalog is data; the evaluator is pure & testable.
 */

import type { TissGuide, TissIssue } from '@/lib/types';

export interface PayerRule {
  label: string;
  /** TUSS procedure codes this payer requires prior authorization for. */
  priorAuthCodes: string[];
  /** Expected beneficiary-card length (digits). */
  cardDigits: number;
  /** Plain-language explanation of this payer's denial profile. */
  note: { 'pt-BR': string; en: string; 'zh-CN': string; 'fr-FR': string };
}

export const PAYER_RULES: Record<string, PayerRule> = {
  unimed: {
    label: 'Unimed',
    priorAuthCodes: ['40808152', '41001010'],
    cardDigits: 11,
    note: {
      'pt-BR': 'Unimed exige autorização prévia para imagem e procedimentos de alto custo; carteirinha com 11+ dígitos.',
      en: 'Unimed requires prior authorization for imaging and high-cost procedures; card with 11+ digits.',
      'zh-CN': 'Unimed 对影像及高费用项目要求事先授权；卡号需 11 位以上。',
      'fr-FR': 'Unimed exige une autorisation préalable pour l’imagerie et les actes coûteux ; carte à 11+ chiffres.',
    },
  },
  'bradesco saúde': {
    label: 'Bradesco Saúde',
    priorAuthCodes: ['40808152', '40901114'],
    cardDigits: 12,
    note: {
      'pt-BR': 'Bradesco Saúde costuma glosar por código sem autorização e carteirinha fora do padrão (12 dígitos).',
      en: 'Bradesco Saúde often denies on unauthorised codes and non-standard cards (12 digits).',
      'zh-CN': 'Bradesco Saúde 常因未授权编码及非标准卡号（12 位）拒付。',
      'fr-FR': 'Bradesco Saúde rejette souvent pour codes non autorisés et cartes non conformes (12 chiffres).',
    },
  },
  'sulamérica': {
    label: 'SulAmérica',
    priorAuthCodes: ['40901114'],
    cardDigits: 11,
    note: {
      'pt-BR': 'SulAmérica é rígida com autorização prévia de procedimentos seriados.',
      en: 'SulAmérica is strict on prior authorization for serial procedures.',
      'zh-CN': 'SulAmérica 对系列项目的事先授权要求严格。',
      'fr-FR': 'SulAmérica est stricte sur l’autorisation préalable des actes en série.',
    },
  },
  amil: {
    label: 'Amil',
    priorAuthCodes: ['41001010'],
    cardDigits: 9,
    note: {
      'pt-BR': 'Amil glosa com frequência por divergência de código e carteirinha curta (9 dígitos).',
      en: 'Amil frequently denies on code mismatch and short cards (9 digits).',
      'zh-CN': 'Amil 常因编码不符及卡号过短（9 位）拒付。',
      'fr-FR': 'Amil rejette souvent pour incohérence de code et carte courte (9 chiffres).',
    },
  },
};

export function payerKey(payer: string): string {
  return payer.trim().toLowerCase();
}

export function getPayerRule(payer: string): PayerRule | undefined {
  return PAYER_RULES[payerKey(payer)];
}

/** Payer-specific pre-denial issues for a guide (empty for an unknown payer). */
export function evaluatePayer(guide: TissGuide): TissIssue[] {
  const rule = getPayerRule(guide.payer);
  if (!rule) return [];
  const issues: TissIssue[] = [];
  if (guide.procedures.some((p) => rule.priorAuthCodes.includes(p.code))) {
    issues.push({ id: 'payer_auth', fieldKey: 'procedures', messageKey: 'payerPriorAuth', severity: 'high' });
  }
  // Only flag a *malformed* card here — an empty one is already caught generically.
  const digits = (guide.cardNumber || '').replace(/\D/g, '').length;
  if (digits > 0 && digits < rule.cardDigits) {
    issues.push({ id: 'payer_card', fieldKey: 'cardNumber', messageKey: 'payerCardFormat', severity: 'medium' });
  }
  return issues;
}
