/**
 * Mari's tools — what she can *do*, not just say.
 *
 * Each tool is a typed, deterministic capability over the domain (today backed
 * by the in-memory store; tomorrow by connectors/DB). The registry is the single
 * source of truth for "what Mari can do": the action endpoint runs them now, and
 * the same `{ id, description, input }` shape feeds model tool-use later.
 *
 * Tools that change state are flagged `requiresConfirmation` (human-in-the-loop):
 * the endpoint refuses to run them without an explicit confirm.
 */

import { z } from 'zod';
import {
  listEncounters,
  getEncounter,
  getNote,
  getGuide,
  createGuideFromEncounter,
  submitGuide,
  agentRecommendations,
} from '@/lib/data/store';
import type { TissGuide, TissIssue } from '@/lib/types';
import { impactFromStore } from './impact';
import { evaluatePayer, getPayerRule } from './payer-rules';

type Loc = string;
const L = (l: Loc, pt: string, en: string, zh: string, fr: string) =>
  l === 'en' ? en : l === 'zh-CN' ? zh : l === 'fr-FR' ? fr : pt;

export type ToolSurface = 'clinical' | 'owner';
export interface ToolContext {
  role: 'owner' | 'doctor';
  locale: Loc;
}
export interface ToolResult {
  ok: boolean;
  summary: string;
  data?: unknown;
  error?: { code: string; message: string };
}
export interface MariTool {
  id: string;
  title: string;
  description: string;
  surfaces: ToolSurface[];
  requiresConfirmation?: boolean;
  input: z.ZodTypeAny;
  run: (input: unknown, ctx: ToolContext) => ToolResult | Promise<ToolResult>;
}

/** Penalise issues (high 25, medium 10, low 5) into a 0..100 readiness score. */
export function scoreIssues(issues: TissIssue[]): { score: number; ready: boolean } {
  const penalty = issues.reduce(
    (s, i) => s + (i.severity === 'high' ? 25 : i.severity === 'medium' ? 10 : 5),
    0,
  );
  return { score: Math.max(0, 100 - penalty), ready: !issues.some((i) => i.severity === 'high') };
}

function dedupeIssues(issues: TissIssue[]): TissIssue[] {
  const seen = new Set<string>();
  return issues.filter((i) => {
    const k = `${i.fieldKey}:${i.messageKey}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Generic, deterministic pre-denial ("pré-glosa") rules over a TISS guide. Pure
 * and side-effect free. Payer-specific rules layer on top in the glosa.check tool.
 */
export function checkGuide(g: TissGuide): { issues: TissIssue[]; score: number; ready: boolean } {
  const issues: TissIssue[] = [...(g.issues ?? [])];
  const add = (fieldKey: string, messageKey: string, severity: TissIssue['severity']) => {
    if (!issues.some((i) => i.fieldKey === fieldKey && i.messageKey === messageKey)) {
      issues.push({ id: `chk_${fieldKey}_${messageKey}`, fieldKey, messageKey, severity });
    }
  };
  if (g.diagnoses.length === 0) add('diagnoses', 'missingCid', 'high');
  if (!g.cardNumber?.trim()) add('cardNumber', 'missingCard', 'high');
  if (!g.council?.trim()) add('council', 'missingCouncil', 'high');
  if (!g.cbo?.trim()) add('cbo', 'missingCbo', 'medium');
  if (g.procedures.length === 0) add('procedures', 'noProcedures', 'high');
  if (g.value <= 0) add('value', 'zeroValue', 'medium');
  return { issues, ...scoreIssues(issues) };
}

const EID = z.object({ encounterId: z.string().min(1).max(64) });
const GID = z.object({ guideId: z.string().min(1).max(64) });

export const MARI_TOOLS: Record<string, MariTool> = {
  'schedule.today': {
    id: 'schedule.today',
    title: 'Agenda do dia',
    description:
      "Summarise today's clinical agenda: total encounters, notes pending finalisation, and Mari recommendations waiting.",
    surfaces: ['clinical'],
    input: z.object({}).strip(),
    run: (_input, ctx) => {
      const enc = listEncounters();
      const pending = enc.filter((e) => (e.status === 'draft' || e.status === 'review') && !e.hasGuide).length;
      const recs = agentRecommendations().length;
      return {
        ok: true,
        summary: L(
          ctx.locale,
          `${enc.length} consultas hoje · ${pending} com prontuário pendente · ${recs} recomendações da Mari.`,
          `${enc.length} consultations today · ${pending} with notes pending · ${recs} Mari recommendations.`,
          `今天 ${enc.length} 个问诊 · ${pending} 个病历待完成 · ${recs} 条 Mari 建议。`,
          `${enc.length} consultations aujourd'hui · ${pending} comptes rendus en attente · ${recs} recommandations.`,
        ),
        data: { total: enc.length, pendingNotes: pending, recommendations: recs },
      };
    },
  },

  'impact.summary': {
    id: 'impact.summary',
    title: 'Impacto Aureon',
    description:
      'Quantify the value Aureon generated this month: revenue recovered, denials prevented vs baseline, and hours returned — as one number.',
    surfaces: ['clinical', 'owner'],
    input: z.object({}).strip(),
    run: (_input, ctx) => {
      const im = impactFromStore();
      const money = (v: number) =>
        new Intl.NumberFormat(ctx.locale, { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
      return {
        ok: true,
        summary: L(
          ctx.locale,
          `Impacto este mês: ${money(im.monthlyImpact)} — ${money(im.recovered)} recuperados, ${money(im.preventedValue)} em glosa evitada e ${im.hoursReturned}h devolvidas.`,
          `Impact this month: ${money(im.monthlyImpact)} — ${money(im.recovered)} recovered, ${money(im.preventedValue)} in denials prevented, and ${im.hoursReturned}h returned.`,
          `本月影响：${money(im.monthlyImpact)} — 已回收 ${money(im.recovered)}，避免拒付 ${money(im.preventedValue)}，节省 ${im.hoursReturned} 小时。`,
          `Impact ce mois : ${money(im.monthlyImpact)} — ${money(im.recovered)} récupérés, ${money(im.preventedValue)} de rejets évités et ${im.hoursReturned} h rendues.`,
        ),
        data: im,
      };
    },
  },

  'note.summarize': {
    id: 'note.summarize',
    title: 'Resumir prontuário',
    description: 'Summarise the structured clinical note of an encounter (its sections and coded diagnoses).',
    surfaces: ['clinical'],
    input: EID,
    run: (input, ctx) => {
      const { encounterId } = input as z.infer<typeof EID>;
      const note = getNote(encounterId);
      if (!note) {
        return {
          ok: false,
          summary: L(ctx.locale, 'Prontuário não encontrado.', 'Note not found.', '未找到病历。', 'Compte rendu introuvable.'),
          error: { code: 'NOT_FOUND', message: 'note not found' },
        };
      }
      const filled = note.sections.filter((s) => s.content?.trim()).length;
      return {
        ok: true,
        summary: L(
          ctx.locale,
          `Prontuário v${note.version}: ${filled}/${note.sections.length} seções preenchidas, ${note.cids.length} CIDs.`,
          `Note v${note.version}: ${filled}/${note.sections.length} sections filled, ${note.cids.length} diagnoses.`,
          `病历 v${note.version}：已填 ${filled}/${note.sections.length} 节，${note.cids.length} 个诊断。`,
          `Compte rendu v${note.version} : ${filled}/${note.sections.length} sections, ${note.cids.length} diagnostics.`,
        ),
        data: {
          version: note.version,
          approved: note.approved,
          sections: note.sections.map((s) => ({ key: s.key, hasContent: !!s.content?.trim() })),
          diagnoses: note.cids,
        },
      };
    },
  },

  'tiss.generate': {
    id: 'tiss.generate',
    title: 'Gerar guia TISS',
    description: 'Generate (or fetch) the draft TISS guide for an encounter from its note. Idempotent; never submits.',
    surfaces: ['clinical'],
    input: EID,
    run: (input, ctx) => {
      const { encounterId } = input as z.infer<typeof EID>;
      if (!getEncounter(encounterId)) {
        return {
          ok: false,
          summary: L(ctx.locale, 'Consulta não encontrada.', 'Encounter not found.', '未找到问诊。', 'Consultation introuvable.'),
          error: { code: 'NOT_FOUND', message: 'encounter not found' },
        };
      }
      const guide = createGuideFromEncounter(encounterId);
      const { score, ready } = checkGuide(guide);
      return {
        ok: true,
        summary: L(
          ctx.locale,
          `Guia rascunho ${guide.id} gerada (R$ ${guide.value}). Prontidão pré-glosa: ${score}/100.`,
          `Draft guide ${guide.id} ready (R$ ${guide.value}). Pre-denial readiness: ${score}/100.`,
          `已生成草稿单据 ${guide.id}（R$ ${guide.value}）。拒付预检就绪度：${score}/100。`,
          `Feuille brouillon ${guide.id} prête (R$ ${guide.value}). Préparation anti-rejet : ${score}/100.`,
        ),
        data: { guideId: guide.id, value: guide.value, status: guide.status, ready },
      };
    },
  },

  'glosa.check': {
    id: 'glosa.check',
    title: 'Verificação pré-glosa',
    description: 'Run the pre-denial check on a TISS guide: returns a readiness score and the blocking/soft issues found.',
    surfaces: ['clinical'],
    input: GID,
    run: (input, ctx) => {
      const { guideId } = input as z.infer<typeof GID>;
      const guide = getGuide(guideId);
      if (!guide) {
        return {
          ok: false,
          summary: L(ctx.locale, 'Guia não encontrada.', 'Guide not found.', '未找到单据。', 'Feuille introuvable.'),
          error: { code: 'NOT_FOUND', message: 'guide not found' },
        };
      }
      const base = checkGuide(guide);
      const issues = dedupeIssues([...base.issues, ...evaluatePayer(guide)]);
      const { score, ready } = scoreIssues(issues);
      const highs = issues.filter((i) => i.severity === 'high').length;
      return {
        ok: true,
        summary: ready
          ? L(
              ctx.locale,
              `Pronta para envio · prontidão ${score}/100, sem bloqueios.`,
              `Ready to submit · readiness ${score}/100, no blockers.`,
              `可提交 · 就绪度 ${score}/100，无阻断项。`,
              `Prête à l'envoi · ${score}/100, aucun bloqueur.`,
            )
          : L(
              ctx.locale,
              `${highs} bloqueio(s) antes do envio · prontidão ${score}/100.`,
              `${highs} blocker(s) before submit · readiness ${score}/100.`,
              `提交前有 ${highs} 个阻断项 · 就绪度 ${score}/100。`,
              `${highs} bloqueur(s) avant envoi · ${score}/100.`,
            ),
        data: { guideId, payer: guide.payer, score, ready, issues },
      };
    },
  },

  'glosa.payerProfile': {
    id: 'glosa.payerProfile',
    title: 'Perfil da operadora',
    description: "Explain a payer's denial profile and the pre-denial rules active for this guide.",
    surfaces: ['clinical', 'owner'],
    input: GID,
    run: (input, ctx) => {
      const { guideId } = input as z.infer<typeof GID>;
      const guide = getGuide(guideId);
      if (!guide) {
        return {
          ok: false,
          summary: L(ctx.locale, 'Guia não encontrada.', 'Guide not found.', '未找到单据。', 'Feuille introuvable.'),
          error: { code: 'NOT_FOUND', message: 'guide not found' },
        };
      }
      const rule = getPayerRule(guide.payer);
      if (!rule) {
        return {
          ok: true,
          summary: L(
            ctx.locale,
            `Sem perfil específico para ${guide.payer} — aplicamos as regras gerais de pré-glosa.`,
            `No specific profile for ${guide.payer} — generic pre-denial rules apply.`,
            `${guide.payer} 暂无专属画像——采用通用拒付预检规则。`,
            `Pas de profil spécifique pour ${guide.payer} — règles génériques appliquées.`,
          ),
          data: { payer: guide.payer, hasRules: false },
        };
      }
      const note = rule.note[ctx.locale as keyof typeof rule.note] ?? rule.note['pt-BR'];
      const tripped = evaluatePayer(guide).length;
      return {
        ok: true,
        summary: tripped
          ? L(
              ctx.locale,
              `${rule.label}: ${tripped} ponto(s) de atenção nesta guia. ${note}`,
              `${rule.label}: ${tripped} attention point(s) on this guide. ${note}`,
              `${rule.label}：本单据有 ${tripped} 处注意点。${note}`,
              `${rule.label} : ${tripped} point(s) d'attention sur cette feuille. ${note}`,
            )
          : L(
              ctx.locale,
              `${rule.label}: guia alinhada às regras desta operadora. ${note}`,
              `${rule.label}: guide aligned with this payer's rules. ${note}`,
              `${rule.label}：本单据符合该支付方规则。${note}`,
              `${rule.label} : feuille conforme aux règles de cet assureur. ${note}`,
            ),
        data: { payer: rule.label, hasRules: true, note, priorAuthCodes: rule.priorAuthCodes, cardDigits: rule.cardDigits, tripped },
      };
    },
  },

  'tiss.submit': {
    id: 'tiss.submit',
    title: 'Enviar guia',
    description: 'Submit a TISS guide to the payer. Irreversible — requires explicit human confirmation, and is blocked if the pre-denial check still has high-severity issues.',
    surfaces: ['clinical'],
    requiresConfirmation: true,
    input: GID,
    run: (input, ctx) => {
      const { guideId } = input as z.infer<typeof GID>;
      const guide = getGuide(guideId);
      if (!guide) {
        return {
          ok: false,
          summary: L(ctx.locale, 'Guia não encontrada.', 'Guide not found.', '未找到单据。', 'Feuille introuvable.'),
          error: { code: 'NOT_FOUND', message: 'guide not found' },
        };
      }
      const { ready, score } = checkGuide(guide);
      if (!ready) {
        return {
          ok: false,
          summary: L(
            ctx.locale,
            `Envio bloqueado: resolva os bloqueios da pré-glosa primeiro (prontidão ${score}/100).`,
            `Submit blocked: resolve the pre-denial blockers first (readiness ${score}/100).`,
            `提交被阻止：请先解决拒付预检的阻断项（就绪度 ${score}/100）。`,
            `Envoi bloqué : corrigez d'abord les bloqueurs (préparation ${score}/100).`,
          ),
          error: { code: 'BLOCKED', message: 'pre-denial check has high-severity issues' },
        };
      }
      submitGuide(guideId);
      return {
        ok: true,
        summary: L(ctx.locale, `Guia ${guideId} enviada.`, `Guide ${guideId} submitted.`, `单据 ${guideId} 已提交。`, `Feuille ${guideId} envoyée.`),
        data: { guideId, status: 'sent' },
      };
    },
  },
};

export function getTool(id: string): MariTool | undefined {
  return MARI_TOOLS[id];
}

export function listTools(surface?: ToolSurface): MariTool[] {
  const all = Object.values(MARI_TOOLS);
  return surface ? all.filter((t) => t.surfaces.includes(surface)) : all;
}
