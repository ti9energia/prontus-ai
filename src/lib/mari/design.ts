/**
 * Mari — single source of truth for the copilot's identity, palette and
 * official copy. Every surface (dock, console, landing, onboarding, empty
 * states) reads from here so the persona stays consistent.
 *
 * The face is the owner's photoreal render in `public/assets/mari` (produced by
 * `scripts/process-mari.mjs`). The old hand-drawn `MariFace` SVG survives only
 * as a graceful fallback inside `<MariAssistant/>` when an image fails to load.
 */

const L = (locale: string, pt: string, en: string, zh: string, fr: string) =>
  locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

export const MARI_ASSETS = {
  avatar: '/assets/mari/mari-avatar.png',
  full: '/assets/mari/mari-full.png',
  favicon: '/assets/mari/mari-favicon.png',
  reference: '/assets/mari/mari-referencia.png',
} as const;

/** Mari's identity — mirrors the design brief. Colors match the globals.css tokens. */
export const mariDesign = {
  name: 'Mari',
  product: 'Auronis Health',
  role: 'Copilota Clínica de IA',
  description:
    'Mari é a copilota clínica de IA do Auronis Health, criada para transformar a fala da consulta em documentação estruturada, guia TISS e apoio inteligente à rotina médica.',
  personality: {
    tone: 'clínica, clara, serena, profissional e confiável',
    traits: ['inteligente', 'precisa', 'segura', 'organizada', 'humana', 'discreta', 'premium', 'clínica', 'objetiva'],
  },
  visualIdentity: {
    style: 'copilota clínica de IA premium, médica, tecnológica e humana',
    theme: 'premium dark',
    avoid: [
      'visual infantil',
      'boneca genérica',
      'mascote fofo demais',
      'desenho mal acabado',
      'robô infantil',
      'excesso de emojis',
      'aparência improvisada',
      'parecer médica real específica',
      'parecer personagem de jogo',
    ],
    colors: {
      bg: '#090B0F',
      surface: '#12151B',
      card: '#171A21',
      elevated: '#1F232D',
      ink: '#F6F8FA',
      muted: '#9CA6B4',
      brand: '#14C8C4',
      brandHover: '#00A8A2',
      accent: '#22D3EE',
      silverLight: '#E2E6EC',
      silver: '#C5CCD6',
      silverDark: '#8A929C',
      success: '#2ED47A',
      warning: '#F5A623',
      danger: '#E5484D',
    },
  },
  assets: MARI_ASSETS,
} as const;

/** Standard, localized alt text for every Mari image (a11y). */
export function mariAlt(locale: string) {
  return L(
    locale,
    'Mari, copilota clínica de IA do Auronis Health',
    'Mari, the clinical AI copilot of Auronis Health',
    'Mari，Auronis Health 的临床 AI 副驾',
    'Mari, la copilote clinique IA d’Auronis Health',
  );
}

/** Mari's official copy, localized: institutional line + the four situational lines. */
export function mariCopy(locale: string) {
  return {
    institutional: L(
      locale,
      'Mari é a copilota clínica de IA do Auronis Health, criada para transformar a fala da consulta em documentação estruturada, guia TISS e apoio inteligente à rotina médica.',
      'Mari is the clinical AI copilot of Auronis Health, built to turn the consultation’s speech into structured documentation, a TISS claim and intelligent support for the medical routine.',
      'Mari 是 Auronis Health 的临床 AI 副驾，将问诊对话转化为结构化病历、TISS 申报单，并为医疗流程提供智能支持。',
      'Mari est la copilote clinique IA d’Auronis Health, conçue pour transformer la parole de la consultation en documentation structurée, en feuille TISS et en appui intelligent à la routine médicale.',
    ),
    greeting: L(
      locale,
      'Olá, eu sou a Mari. Posso ajudar a organizar sua consulta, revisar o prontuário e reduzir riscos de glosa.',
      'Hi, I’m Mari. I can help organize your consultation, review the record and reduce denial risk.',
      '你好，我是 Mari。我可以帮您整理问诊、审核病历并降低被退费的风险。',
      'Bonjour, je suis Mari. Je peux aider à organiser votre consultation, réviser le dossier et réduire le risque de rejet.',
    ),
    recording: L(
      locale,
      'Estou ouvindo a consulta e organizando as informações clínicas em tempo real.',
      'I’m listening to the consultation and organizing the clinical information in real time.',
      '我正在聆听问诊，并实时整理临床信息。',
      'J’écoute la consultation et j’organise les informations cliniques en temps réel.',
    ),
    review: L(
      locale,
      'Revise os pontos destacados antes de assinar. A decisão final continua sendo médica.',
      'Review the highlighted points before signing. The final decision remains the physician’s.',
      '签署前请复核标注的要点。最终决定仍由医生做出。',
      'Vérifiez les points surlignés avant de signer. La décision finale reste celle du médecin.',
    ),
    preGlosa: L(
      locale,
      'Encontrei possíveis pontos de atenção antes do envio da guia.',
      'I found possible points of attention before the claim is submitted.',
      '在提交申报单前，我发现了一些需要注意的地方。',
      'J’ai trouvé de possibles points d’attention avant l’envoi de la feuille.',
    ),
  };
}
