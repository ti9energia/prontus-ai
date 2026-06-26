import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ownerInsights, pushAudit } from '@/lib/data/store';
import { SESSION_COOKIE, readCookie, verifySession } from '@/lib/auth/session';
import { mariChat } from '@/lib/mari/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // headroom for slow model calls (avoid 504 on the LLM path)

const SYSTEM = `You are Mari, the operating-brain copilot for the OWNER of Aureon Health, an AI medical-scribe SaaS.
You see platform-wide metrics (MRR, growth, churn, usage, tenants, AI spend). Your job is to help the owner grow the
business: surface insights from client usage, flag churn risk and how to save accounts, find upsell/expansion plays,
suggest what to improve in the product, and advise how to sell. Be strategic, specific and concise. Never invent
numbers — use the data provided. Always answer in the user's language.`;

const LOCALES = ['pt-BR', 'en', 'zh-CN', 'fr-FR'] as const;

const BodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(6000) }))
    .max(50)
    .optional(),
  locale: z.string().max(12).optional(),
});

function fmtCurrency(v: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}
function fmtPercent(v: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(v);
}

function ownerMock(text: string, locale: string): string {
  const q = text.toLowerCase();
  const ins = ownerInsights();
  const s = ins.stats;
  const names = (list: { name: string }[]) => (list.length ? list.map((t) => t.name).join(', ') : '—');
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const isChurn = /churn|risco|risk|inadimpl|cancel|流失|désabonn|résili/.test(q);
  const isUpsell = /upsell|upgrade|expan|expand|扩|expansion|vendre plus/.test(q);
  const isSell = /vend|sell|sales|venda|pitch|销售|vente/.test(q);
  const isImprove = /melhor|improve|improv|改进|amélior|produto|product/.test(q);
  const isGrow = /cresc|grow|growth|mrr|receita|增长|croissance|revenue/.test(q);

  if (isChurn) {
    return L(
      `Churn em ${fmtPercent(s.churn, locale)}. Em risco agora: ${names(ins.atRisk)}. Sugiro régua de retenção: contato proativo da Mari por WhatsApp, revisão de uso e oferta de migração de plano. Quer que eu prepare as mensagens?`,
      `Churn at ${fmtPercent(s.churn, 'en')}. At risk now: ${names(ins.atRisk)}. I suggest a save-play: proactive Mari WhatsApp outreach, a usage review and a plan-migration offer. Want me to draft the messages?`,
      `流失率为 ${fmtPercent(s.churn, 'zh-CN')}。当前风险客户：${names(ins.atRisk)}。建议启动挽留流程：由 Mari 通过 WhatsApp 主动联系、复盘使用情况并提供套餐迁移方案。需要我拟好消息吗？`,
      `Churn à ${fmtPercent(s.churn, 'fr-FR')}. À risque : ${names(ins.atRisk)}. Je propose un plan de rétention : prise de contact proactive via WhatsApp, revue d'usage et offre de migration. Je prépare les messages ?`,
    );
  }
  if (isUpsell) {
    return L(
      `Oportunidade de expansão: ${names(ins.upsell)} estão acima de 80% de uso — fortes candidatos a upgrade. Posso gerar a proposta com o ROI de cada conta.`,
      `Expansion opportunity: ${names(ins.upsell)} are above 80% usage — strong upgrade candidates. I can generate a proposal with each account's ROI.`,
      `扩张机会：${names(ins.upsell)} 使用率超过 80%，是升级的有力候选。我可以为每个客户生成带 ROI 的方案。`,
      `Opportunité d'expansion : ${names(ins.upsell)} dépassent 80 % d'usage — bons candidats à l'upgrade. Je peux générer une proposition avec le ROI de chaque compte.`,
    );
  }
  if (isSell) {
    return L(
      `Para vender mais rápido, lidere com o número que dói: glosa. Mostre −68% de glosa em 90 dias e as horas devolvidas por médico, com um único CTA: "teste com uma consulta". Quer um roteiro de pitch de 3 linhas?`,
      `To sell faster, lead with the number that hurts: denials. Show −68% denials in 90 days and hours returned per doctor, with one CTA: "try it on one visit." Want a 3-line pitch script?`,
      `想更快成交，就用最痛的数字：拒付。展示 90 天内拒付下降 68%、每位医生节省的工时，并用单一行动号召：“用一次问诊试试”。需要 3 句话的话术吗？`,
      `Pour vendre plus vite, mettez en avant le chiffre qui fait mal : les rejets. Montrez −68 % de rejets en 90 jours et les heures rendues par médecin, avec un seul CTA : « essayez sur une consultation ». Un pitch en 3 lignes ?`,
    );
  }
  if (isImprove) {
    return L(
      `O que mais melhoraria a retenção: (1) reduzir a taxa de erro (hoje ${fmtPercent(s.errorRate, locale)}); (2) onboarding guiado nas 5 primeiras consultas; (3) dar destaque à verificação pré-glosa, sua feature de maior valor percebido.`,
      `Highest-leverage improvements: (1) cut the error rate (now ${fmtPercent(s.errorRate, 'en')}); (2) guided onboarding for the first 5 visits; (3) spotlight the pre-denial check — your highest perceived-value feature.`,
      `最能提升留存的改进：(1) 降低错误率（当前 ${fmtPercent(s.errorRate, 'zh-CN')}）；(2) 前 5 次问诊的引导式上手；(3) 突出拒付预检——你感知价值最高的功能。`,
      `Améliorations à plus fort levier : (1) baisser le taux d'erreur (actuellement ${fmtPercent(s.errorRate, 'fr-FR')}) ; (2) onboarding guidé sur les 5 premières consultations ; (3) mettre en avant le contrôle anti-rejet, votre fonction à plus forte valeur perçue.`,
    );
  }
  if (isGrow) {
    return L(
      `MRR em ${fmtCurrency(s.mrr, locale)}, crescendo ${fmtPercent(s.mrrGrowth, locale)}. ${ins.tenantCount} organizações e ${s.activeDoctors} médicos ativos. A maior alavanca agora é converter os ${ins.trials.length} trials e os upgrades de alto uso.`,
      `MRR at ${fmtCurrency(s.mrr, 'en')}, growing ${fmtPercent(s.mrrGrowth, 'en')}. ${ins.tenantCount} organizations and ${s.activeDoctors} active doctors. Biggest lever right now: convert the ${ins.trials.length} trials and the high-usage upgrades.`,
      `MRR 为 ${fmtCurrency(s.mrr, 'zh-CN')}，增长 ${fmtPercent(s.mrrGrowth, 'zh-CN')}。${ins.tenantCount} 家机构、${s.activeDoctors} 名活跃医生。当前最大杠杆：转化 ${ins.trials.length} 个试用并完成高使用率客户的升级。`,
      `MRR à ${fmtCurrency(s.mrr, 'fr-FR')}, +${fmtPercent(s.mrrGrowth, 'fr-FR')}. ${ins.tenantCount} organisations et ${s.activeDoctors} médecins actifs. Le plus gros levier : convertir les ${ins.trials.length} essais et les upgrades à fort usage.`,
    );
  }
  return L(
    `Sou a Mari, o cérebro da operação. Vejo MRR, churn, uso e tenants. Posso trazer riscos de churn, oportunidades de upsell, o que melhorar no produto e como vender. Por onde começamos?`,
    `I'm Mari, the operating brain. I see MRR, churn, usage and tenants. I can surface churn risks, upsell plays, product improvements and how to sell. Where do we start?`,
    `我是 Mari，运营大脑。我掌握 MRR、流失、使用情况和租户数据。我可以指出流失风险、追加销售机会、产品改进点以及销售方法。我们从哪里开始？`,
    `Je suis Mari, le cerveau des opérations. Je vois le MRR, le churn, l'usage et les tenants. Je peux remonter les risques de churn, les upsells, les améliorations produit et comment vendre. On commence par quoi ?`,
  );
}

export async function POST(req: NextRequest) {
  // Owner-only: the console exposes business-wide data.
  const session = await verifySession(readCookie(req.headers.get('cookie'), SESSION_COOKIE));
  if (!session || session.role !== 'owner') {
    return NextResponse.json(
      { data: null, error: { code: 'FORBIDDEN', messageKey: 'errors.forbidden' } },
      { status: 403 },
    );
  }

  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  const parsed = BodySchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', messageKey: 'errors.invalid_input' } },
      { status: 400 },
    );
  }

  const messages = (parsed.data.messages ?? []).slice(-20);
  const locale = (LOCALES as readonly string[]).includes(parsed.data.locale ?? '')
    ? (parsed.data.locale as string)
    : 'pt-BR';
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  pushAudit('Mari (IA)', 'owner.console.chat', 'owner', 'ok', 'ai');

  const ins = ownerInsights();
  const ctx = `Platform data — MRR: ${ins.stats.mrr} ${ins.stats.currency}; growth: ${ins.stats.mrrGrowth}; churn: ${ins.stats.churn}; activeTenants: ${ins.stats.activeTenants}; activeDoctors: ${ins.stats.activeDoctors}; trials: ${ins.trials.length}; atRisk: ${ins.atRisk.map((t) => t.name).join(' / ') || 'none'}; upsellCandidates: ${ins.upsell.map((t) => t.name).join(' / ') || 'none'}.`;

  // Owner is already authenticated above, so the model / remote brain is always allowed.
  const result = await mariChat({
    surface: 'owner',
    system: `${SYSTEM}\nUser locale: ${locale}.\n${ctx}`,
    messages,
    locale,
    context: { platform: ins.stats, trials: ins.trials.length, atRisk: ins.atRisk.length },
    allowModel: true,
    maxTokens: 700,
    fallback: () => ownerMock(last, locale),
  });

  if (result.source === 'mock') await new Promise((r) => setTimeout(r, 350));
  return NextResponse.json(result);
}
