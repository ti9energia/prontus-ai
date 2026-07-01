import type { ScreenKey } from '@/lib/workspace';

/**
 * Lets Mari OPERATE the app, not just talk about it: maps a natural-language
 * command ("abre o faturamento", "open the patients screen") to a screen so the
 * copilot can navigate for the user. Deterministic + client-side + 4 languages,
 * so it works without a model round-trip.
 */
const NAV: Array<{ screen: ScreenKey; kw: RegExp }> = [
  { screen: 'today', kw: /\b(hoje|today|aujourd)\b|今日|当天/i },
  { screen: 'agenda', kw: /\b(agenda|schedule|rendez)\b|日程/i },
  { screen: 'encounter', kw: /\b(consulta|encounter|atendimento|visite)\b|问诊|就诊/i },
  { screen: 'review', kw: /\b(prontu\w*|revis\w*|review|compte rendu)\b|病历|审核/i },
  { screen: 'tiss', kw: /\b(guia|tiss|claim|feuille)\b|单据/i },
  { screen: 'patients', kw: /\b(paciente\w*|patient\w*)\b|患者/i },
  { screen: 'billing', kw: /\b(glosa\w*|faturamento|billing|gloss|facturation)\b|拒付|收费/i },
  { screen: 'reports', kw: /\b(relat\w*|report\w*|rapport\w*|analytics|bi)\b|报告/i },
  { screen: 'agent', kw: /\b(agente|agent)\b|智能体/i },
  { screen: 'whatsapp', kw: /\bwhatsapp\b/i },
  { screen: 'settings', kw: /\b(config\w*|settings|ajustes|param[èe]tres)\b|设置/i },
];

const NAV_VERB =
  /\b(abr\w*|abre|ir para|v[áa]? para|vai|leva|mostr\w*|open|go to|navigate|show|take me|ouvr\w*|aller|montr\w*)\b|打开|前往|跳转/i;

/** Returns the screen to navigate to for an explicit command, else null. */
export function detectNavIntent(text: string): ScreenKey | null {
  if (!NAV_VERB.test(text)) return null;
  for (const n of NAV) if (n.kw.test(text)) return n.screen;
  return null;
}
