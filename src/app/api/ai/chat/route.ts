import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { billingStats, listEncounters, agentRecommendations, pushAudit } from '@/lib/data/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM = `You are Mari, the clinical copilot inside Prontus.ai, an AI medical-scribe SaaS.
You understand the whole system and help doctors and billing staff. You are concise, warm and precise.
Rules: respect the user's role and LGPD; never invent patient data; for irreversible actions require human approval (say it needs confirmation). Always answer in the user's language.`;

function fmtPercent(v: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(v);
}
function fmtCurrency(v: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}

function mockReply(text: string, locale: string): string {
  const q = text.toLowerCase();
  const bs = billingStats();
  const enc = listEncounters();
  const minutes = enc.reduce((s, e) => s + (e.minutesSaved ?? 0), 0);
  const recs = agentRecommendations();

  const isGloss = /glosa|gloss|denial|reject|拒付|rejet/.test(q);
  const isAgenda = /agenda|today|hoje|day|日程|就诊|aujourd/.test(q);
  const isTime = /minuto|tempo|time|saved|economiz|分钟|temps|gagn/.test(q);
  const isGuide = /guia|guide|tiss|单据|feuille/.test(q);

  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  if (isGloss) {
    return L(
      `Sua taxa de glosa no mês é ${fmtPercent(bs.glossRate, locale)} (${bs.glossed} guias glosadas de ${bs.submitted} enviadas). Há ${fmtCurrency(bs.atRisk, locale)} em risco. Posso priorizar os reenvios de maior valor — quer que eu prepare?`,
      `Your denial rate this month is ${fmtPercent(bs.glossRate, 'en')} (${bs.glossed} denied of ${bs.submitted} submitted). ${fmtCurrency(bs.atRisk, 'en')} is at risk. I can prioritize the highest-value resubmissions — want me to prepare them?`,
      `本月拒付率为 ${fmtPercent(bs.glossRate, 'zh-CN')}（已提交 ${bs.submitted} 单中 ${bs.glossed} 单被拒）。有 ${fmtCurrency(bs.atRisk, 'zh-CN')} 处于风险中。我可以优先处理高金额的重新提交，需要我准备吗？`,
      `Votre taux de rejet ce mois est de ${fmtPercent(bs.glossRate, 'fr-FR')} (${bs.glossed} rejetées sur ${bs.submitted} envoyées). ${fmtCurrency(bs.atRisk, 'fr-FR')} sont à risque. Je peux prioriser les renvois les plus importants — voulez-vous que je les prépare ?`,
    );
  }
  if (isTime) {
    return L(
      `Hoje o Prontus já devolveu ${minutes} minutos do seu tempo — cerca de ${(minutes / 60).toFixed(1)}h que você não passou digitando.`,
      `Today Prontus already gave you back ${minutes} minutes — about ${(minutes / 60).toFixed(1)}h you didn't spend typing.`,
      `今天 Prontus 已为你节省 ${minutes} 分钟，约 ${(minutes / 60).toFixed(1)} 小时无需手动记录。`,
      `Aujourd'hui, Prontus vous a déjà fait gagner ${minutes} minutes — environ ${(minutes / 60).toFixed(1)} h sans saisie.`,
    );
  }
  if (isAgenda) {
    const pending = enc.filter((e) => (e.status === 'draft' || e.status === 'review') && !e.hasGuide).length;
    return L(
      `Você tem ${enc.length} consultas hoje. ${pending} estão com prontuário pendente de finalização e ${recs.length} recomendações do agente aguardam você.`,
      `You have ${enc.length} consultations today. ${pending} have notes pending finalization and ${recs.length} agent recommendations are waiting.`,
      `今天你有 ${enc.length} 个问诊，其中 ${pending} 个病历待完成，还有 ${recs.length} 条智能体建议等待处理。`,
      `Vous avez ${enc.length} consultations aujourd'hui. ${pending} ont un compte rendu à finaliser et ${recs.length} recommandations de l'agent vous attendent.`,
    );
  }
  if (isGuide) {
    return L(
      `Posso gerar a guia TISS desta consulta a partir do prontuário aprovado e rodar a verificação pré-glosa antes do envio. Confirma que aprovou a nota?`,
      `I can generate the TISS claim for this encounter from the approved note and run the pre-denial check before sending. Did you approve the note?`,
      `我可以根据已批准的病历生成本次问诊的 TISS 单据，并在提交前进行拒付预检。你已批准病历了吗？`,
      `Je peux générer la feuille de soins TISS de cette consultation à partir du compte rendu approuvé et lancer le contrôle anti-rejet avant l'envoi. Avez-vous approuvé la note ?`,
    );
  }
  return L(
    `Sou a Mari e entendo o Prontus inteiro. Posso resumir prontuários, gerar guias TISS, explicar suas glosas e trazer sua agenda. O que você precisa agora?`,
    `I'm Mari and I understand all of Prontus. I can summarize notes, generate TISS claims, explain denials and pull up your schedule. What do you need?`,
    `我是 Mari，熟悉整个 Prontus。我可以总结病历、生成 TISS 单据、解释拒付并查看你的日程。你需要什么？`,
    `Je suis Mari et je connais tout Prontus. Je peux résumer des comptes rendus, générer des feuilles TISS, expliquer les rejets et afficher votre agenda. Que puis-je faire ?`,
  );
}

const LOCALES = ['pt-BR', 'en', 'zh-CN', 'fr-FR'] as const;

const BodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(6000) }))
    .max(50)
    .optional(),
  locale: z.string().max(12).optional(),
  screen: z.string().max(48).optional(),
});

export async function POST(req: NextRequest) {
  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }

  // Validate + sanitize input (anti-abuse / prompt-injection hardening).
  const parsed = BodySchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', messageKey: 'errors.invalid_input' } },
      { status: 400 },
    );
  }

  const messages = (parsed.data.messages ?? []).slice(-20); // cap context window
  const locale = (LOCALES as readonly string[]).includes(parsed.data.locale ?? '')
    ? (parsed.data.locale as string)
    : 'pt-BR';
  const screen = (parsed.data.screen ?? '-').replace(/[^\w:-]/g, '').slice(0, 48) || '-';
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  pushAudit('Mari (IA)', 'copilot.chat', `screen:${screen}`, 'ok', 'ai');

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Real Claude API when a key is configured; graceful mock otherwise.
  if (apiKey) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });
      const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
      const completion = await client.messages.create({
        model,
        max_tokens: 600,
        system: `${SYSTEM}\nUser locale: ${locale}. Current screen: ${screen}.`,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      const reply = completion.content
        .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      return NextResponse.json({ reply: reply || mockReply(last, locale), source: 'claude' });
    } catch (err) {
      return NextResponse.json({ reply: mockReply(last, locale), source: 'mock-fallback' });
    }
  }

  // Simulate a little latency so the typing indicator reads naturally.
  await new Promise((r) => setTimeout(r, 450));
  return NextResponse.json({ reply: mockReply(last, locale), source: 'mock' });
}
