/**
 * Mari — single source of truth for the copilot's identity, palette and
 * official copy. Every surface (dock, console, landing, onboarding, empty
 * states) reads from here so the persona stays consistent.
 *
 * Mari is a non-human medical-record mascot: memorable enough for campaigns,
 * neutral enough for clinical software, and derived from the Auronis silver
 * arch + ECG visual language. The code-native face is the resilient fallback.
 */

const L = (locale: string, pt: string, en: string, zh: string, fr: string) =>
  locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

export const MARI_ASSETS = {
  avatar: '/assets/mari/mari-mascot-avatar.png',
  full: '/assets/mari/mari-mascot.png',
  favicon: '/assets/mari/mari-mascot-avatar.png',
  reference: '/brand/symbol.png',
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
    style: 'mascote-prontuário de IA clínica, premium, tecnológica e acolhedora',
    theme: 'premium dark',
    avoid: [
      'visual infantil',
      'boneca genérica',
      'mascote infantil demais',
      'desenho mal acabado',
      'robô infantil',
      'excesso de emojis',
      'aparência improvisada',
      'parecer uma pessoa real',
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

/**
 * Mari's narrated empty states, localized. Each line is her first-person voice
 * for a blank surface — serene, clinical and useful, reinforcing what she does
 * there. Consumed by `<MariEmptyState/>` so the persona reads the same on every
 * screen; the generic `<EmptyState/>` stays for neutral admin tables.
 */
export function mariEmptyLines(locale: string) {
  return {
    today: L(
      locale,
      'Sua agenda está livre por aqui. Assim que as consultas chegarem, começo a preparar tudo com você.',
      'Your schedule is clear here. As soon as visits come in, I’ll start preparing everything with you.',
      '这里的日程还空着。一旦有问诊，我就会和您一起做好准备。',
      'Votre agenda est libre ici. Dès que des consultations arrivent, je prépare tout avec vous.',
    ),
    patients: L(
      locale,
      'Não encontrei nenhum paciente com esses critérios. Podemos ajustar a busca ou cadastrar um novo.',
      'I couldn’t find any patient matching this. We can adjust the search or add a new one.',
      '我没有找到符合条件的患者。我们可以调整搜索，或新增一位。',
      'Je n’ai trouvé aucun patient correspondant. On peut ajuster la recherche ou en ajouter un.',
    ),
    documents: L(
      locale,
      'Ainda não há documentos por aqui. Ao finalizar uma consulta, organizo receitas, atestados e laudos neste lugar.',
      'No documents here yet. When you finish a visit, I’ll organize prescriptions, certificates and reports right here.',
      '这里还没有文档。完成问诊后，我会在此整理处方、证明和报告。',
      'Aucun document ici pour l’instant. À la fin d’une consultation, j’organise ordonnances, certificats et comptes-rendus ici.',
    ),
    exams: L(
      locale,
      'Nenhum exame por aqui ainda. Quando você solicitar, acompanho os resultados e sinalizo o que precisa de atenção.',
      'No exams here yet. Once you order them, I’ll track the results and flag what needs attention.',
      '这里还没有检查。您开单后，我会跟踪结果并标记需要注意的地方。',
      'Aucun examen ici pour l’instant. Dès que vous en demandez, je suis les résultats et signale ce qui mérite attention.',
    ),
    billing: L(
      locale,
      'Nenhuma guia nesta visão. Reviso cada guia antes do envio para reduzir o risco de glosa.',
      'No claims in this view. I review each claim before it’s sent to reduce denial risk.',
      '此视图下没有单据。我会在提交前审核每一张单据，以降低被退费的风险。',
      'Aucune feuille dans cette vue. Je révise chaque feuille avant l’envoi pour réduire le risque de rejet.',
    ),
    allClear: L(
      locale,
      'Está tudo em dia. Não encontrei pendências agora — sigo de olho e aviso se algo precisar de você.',
      'Everything’s up to date. I found nothing pending right now — I’ll keep watch and let you know if anything needs you.',
      '一切都是最新的。目前没有待办事项——我会持续留意，有需要会通知您。',
      'Tout est à jour. Rien en attente pour l’instant — je reste attentive et vous préviens si besoin.',
    ),
  };
}
