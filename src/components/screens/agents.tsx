'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import {
  Bot,
  ReceiptText,
  Wallet,
  ShieldCheck,
  Play,
  Activity,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { billingStats, ownerInsights } from '@/lib/data/store';
import { ScreenContainer, ScreenHeader, SectionTitle, Table, Th, Td } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/misc';
import { toast } from '@/lib/toast';
import { cn, formatCurrency, formatNumber, formatPercent, timeAgo } from '@/lib/utils';

/** A localized 4-tuple: [pt-BR, en, zh-CN, fr-FR]. */
type Loc = [string, string, string, string];

type AgentId = 'billing' | 'finance' | 'audit';

interface Metric {
  label: Loc;
  value: number;
  kind: 'currency' | 'percent' | 'int';
  digits?: number;
}

interface FleetAgent {
  id: AgentId;
  icon: LucideIcon;
  name: Loc;
  mission: Loc;
  active: boolean;
  running: boolean;
  /** "ações no mês" — bumps on every run. */
  actions: number;
  lastRunAt: string | null;
  metrics: Metric[];
  /** Fixed list of sample actions — cycled deterministically by index. */
  samples: Loc[];
  /** Deterministic cursor into `samples` (never Math.random). */
  cursor: number;
}

interface ActivityEntry {
  id: string;
  agentId: AgentId;
  action: Loc;
  at: string;
}

/* Fixed sample actions per agent — cycled by index, never randomized. */
const BILLING_SAMPLES: Loc[] = [
  ['Reenviou guia glosada', 'Resubmitted denied claim', '重新提交被拒票据', 'Guide rejeté renvoyé'],
  ['Corrigiu código TUSS', 'Fixed TUSS code', '修正 TUSS 编码', 'Code TUSS corrigé'],
  ['Anexou autorização prévia', 'Attached prior authorization', '附加事先授权', 'Autorisation préalable jointe'],
  ['Detectou pré-glosa', 'Caught pre-denial', '发现预拒付', 'Pré-rejet détecté'],
  ['Otimizou o lançamento', 'Optimized the posting', '优化记账', 'Saisie optimisée'],
];
const FINANCE_SAMPLES: Loc[] = [
  ['Conciliou recebíveis', 'Reconciled receivables', '对账应收款', 'Créances rapprochées'],
  ['Atualizou o fluxo de caixa', 'Updated cash flow', '更新现金流', 'Trésorerie mise à jour'],
  ['Projetou receita de 30 dias', 'Projected 30-day revenue', '预测 30 天收入', 'Revenus à 30 jours projetés'],
  ['Sinalizou inadimplência', 'Flagged an overdue payment', '标记逾期款项', 'Impayé signalé'],
  ['Emitiu cobrança', 'Issued an invoice', '开具账单', 'Facture émise'],
];
const AUDIT_SAMPLES: Loc[] = [
  ['Revisou prontuário', 'Reviewed a record', '审查病历', 'Dossier révisé'],
  ['Validou CID × procedimento', 'Validated diagnosis × code', '校验诊断×编码', 'Diagnostic × acte validé'],
  ['Sinalizou risco de glosa', 'Flagged denial risk', '标记拒付风险', 'Risque de rejet signalé'],
  ['Conferiu assinatura digital', 'Checked digital signature', '核对数字签名', 'Signature numérique vérifiée'],
  ['Auditou consentimento', 'Audited consent', '审计知情同意', 'Consentement audité'],
];

let seq = 700;
const uid = () => `act_${(seq += 1)}`;

export function AgentsScreen() {
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const T = (loc: Loc) => L(loc[0], loc[1], loc[2], loc[3]);

  const [agents, setAgents] = React.useState<FleetAgent[]>(() => {
    const bs = billingStats();
    const oi = ownerInsights();
    const now = Date.now();
    const ago = (min: number) => new Date(now - min * 60_000).toISOString();
    return [
      {
        id: 'billing',
        icon: ReceiptText,
        name: ['Agente de Faturamento', 'Billing Agent', '计费智能体', 'Agent de facturation'],
        mission: [
          'Monitora guias, reenvia glosadas e otimiza códigos.',
          'Monitors claims, resubmits denials and optimizes codes.',
          '监控票据、重提拒付并优化编码。',
          'Surveille les guides, renvoie les rejets et optimise les codes.',
        ],
        active: true,
        running: false,
        actions: 142,
        lastRunAt: ago(8),
        metrics: [
          { label: ['Valor recuperado', 'Recovered', '已追回', 'Récupéré'], value: bs.recovered, kind: 'currency' },
          { label: ['Glosas reenviadas', 'Denials resubmitted', '已重提拒付', 'Rejets renvoyés'], value: bs.glossed, kind: 'int' },
        ],
        samples: BILLING_SAMPLES,
        cursor: 0,
      },
      {
        id: 'finance',
        icon: Wallet,
        name: ['Agente Financeiro', 'Finance Agent', '财务智能体', 'Agent financier'],
        mission: [
          'Contas a receber, fluxo de caixa e projeções.',
          'Receivables, cash flow and projections.',
          '应收账款、现金流与预测。',
          'Comptes clients, trésorerie et projections.',
        ],
        active: true,
        running: false,
        actions: 68,
        lastRunAt: ago(42),
        metrics: [
          { label: ['Fluxo projetado', 'Projected flow', '预计现金流', 'Flux projeté'], value: oi.stats.mrr, kind: 'currency' },
          { label: ['Crescimento', 'Growth', '增长', 'Croissance'], value: oi.stats.mrrGrowth, kind: 'percent', digits: 1 },
        ],
        samples: FINANCE_SAMPLES,
        cursor: 1,
      },
      {
        id: 'audit',
        icon: ShieldCheck,
        name: ['Agente de Auditoria', 'Audit Agent', '审计智能体', 'Agent d’audit'],
        mission: [
          'Revisa prontuários, conformidade e riscos.',
          'Reviews records, compliance and risks.',
          '审查病历、合规与风险。',
          'Révise les dossiers, la conformité et les risques.',
        ],
        active: false,
        running: false,
        actions: 53,
        lastRunAt: ago(180),
        metrics: [
          { label: ['Conformidade', 'Compliance', '合规率', 'Conformité'], value: 0.98, kind: 'percent', digits: 0 },
          { label: ['Riscos abertos', 'Open risks', '未结风险', 'Risques ouverts'], value: bs.glossed, kind: 'int' },
        ],
        samples: AUDIT_SAMPLES,
        cursor: 2,
      },
    ];
  });

  const [log, setLog] = React.useState<ActivityEntry[]>(() => {
    const now = Date.now();
    const ago = (min: number) => new Date(now - min * 60_000).toISOString();
    return [
      { id: uid(), agentId: 'billing', action: BILLING_SAMPLES[0], at: ago(8) },
      { id: uid(), agentId: 'finance', action: FINANCE_SAMPLES[1], at: ago(42) },
      { id: uid(), agentId: 'audit', action: AUDIT_SAMPLES[2], at: ago(180) },
      { id: uid(), agentId: 'billing', action: BILLING_SAMPLES[3], at: ago(260) },
    ];
  });

  /* Per-agent simulated-cycle timers — cleared on unmount. */
  const timers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  React.useEffect(() => {
    const pending = timers.current;
    return () => {
      Object.values(pending).forEach((t) => clearTimeout(t));
    };
  }, []);

  const renderMetric = (m: Metric) =>
    m.kind === 'currency'
      ? formatCurrency(m.value, locale, 'BRL')
      : m.kind === 'percent'
        ? formatPercent(m.value, locale, m.digits ?? 0)
        : formatNumber(m.value, locale);

  const toggle = (id: AgentId) => {
    const a = agents.find((x) => x.id === id);
    if (!a) return;
    const nowOn = !a.active;
    setAgents((list) => list.map((x) => (x.id === id ? { ...x, active: nowOn } : x)));
    toast.success(
      nowOn
        ? L('Agente ativado', 'Agent activated', '智能体已启用', 'Agent activé')
        : L('Agente pausado', 'Agent paused', '智能体已暂停', 'Agent en pause'),
    );
  };

  const runAgent = (id: AgentId) => {
    const agent = agents.find((x) => x.id === id);
    if (!agent || !agent.active || agent.running) return; // paused agents can't run

    setAgents((list) => list.map((x) => (x.id === id ? { ...x, running: true } : x)));

    // Deterministic: 1–3 actions, cycling through the fixed sample list by index.
    const startCursor = agent.cursor;
    const count = (startCursor % 3) + 1;
    const picked = Array.from(
      { length: count },
      (_, i) => agent.samples[(startCursor + i) % agent.samples.length],
    );

    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => {
      delete timers.current[id];
      const at = new Date().toISOString();
      setAgents((list) =>
        list.map((x) =>
          x.id === id
            ? { ...x, running: false, actions: x.actions + count, cursor: x.cursor + count, lastRunAt: at }
            : x,
        ),
      );
      setLog((prev) => [...picked.map((action) => ({ id: uid(), agentId: id, action, at })), ...prev]);
      toast.success(
        L('Ciclo concluído', 'Cycle complete', '周期完成', 'Cycle terminé'),
        `${T(agent.name)} · ${count} ${L('ações', 'actions', '个动作', 'actions')}`,
      );
    }, 1200);
  };

  const runAll = () => agents.filter((a) => a.active && !a.running).forEach((a) => runAgent(a.id));

  const activeCount = agents.filter((a) => a.active).length;
  const canRunAny = agents.some((a) => a.active && !a.running);

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Bot}
        title={L('Agentes IA', 'AI Agents', 'AI 智能体', 'Agents IA')}
        subtitle={L(
          'Uma frota de agentes autônomos que operam o negócio — faturamento, finanças e auditoria — sobre os seus dados reais.',
          'A fleet of autonomous agents that run the business — billing, finance and audit — over your real data.',
          '一支自主智能体队伍，基于真实数据运营业务 — 计费、财务与审计。',
          'Une flotte d’agents autonomes qui pilotent l’activité — facturation, finances et audit — sur vos données réelles.',
        )}
        actions={
          <>
            <Badge tone="brand" className="h-7 px-3">
              {activeCount}/{agents.length} {L('ativos', 'active', '运行中', 'actifs')}
            </Badge>
            <Button
              variant="outline"
              leftIcon={<Play className="h-4 w-4" />}
              onClick={runAll}
              disabled={!canRunAny}
            >
              {L('Executar todos', 'Run all', '全部执行', 'Tout exécuter')}
            </Button>
          </>
        }
      />

      {/* the fleet */}
      <div className="grid gap-4 lg:grid-cols-3">
        {agents.map((a) => {
          const Icon = a.icon;
          return (
            <Card
              key={a.id}
              className={cn(
                'flex flex-col gap-4 p-5 transition-shadow',
                !a.active && 'opacity-80',
                a.running && 'ring-1 ring-brand-500/40',
              )}
            >
              {/* header */}
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                    a.active ? 'bg-brand-600/10 text-brand-600' : 'bg-ink/[0.05] text-subtle',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold tracking-tight">{T(a.name)}</h3>
                    <Badge tone={a.active ? 'success' : 'neutral'} dot={a.active}>
                      {a.active
                        ? L('Ativo', 'Active', '运行中', 'Actif')
                        : L('Pausado', 'Paused', '已暂停', 'En pause')}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{T(a.mission)}</p>
                </div>
                <Switch
                  checked={a.active}
                  onChange={() => toggle(a.id)}
                  aria-label={`${L('Alternar', 'Toggle', '切换', 'Basculer')} ${T(a.name)}`}
                />
              </div>

              {/* mini-metrics */}
              <div className="grid grid-cols-3 gap-2.5">
                <Mini
                  label={L('Ações no mês', 'Actions this month', '本月动作', 'Actions ce mois')}
                  value={formatNumber(a.actions, locale)}
                />
                {a.metrics.map((m, i) => (
                  <Mini key={i} label={T(m.label)} value={renderMetric(m)} />
                ))}
              </div>

              {/* footer */}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-hairline/70 pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <Clock className="h-3.5 w-3.5" />
                  {a.lastRunAt
                    ? `${L('Última execução', 'Last run', '上次运行', 'Dernière exécution')} · ${timeAgo(a.lastRunAt, locale)}`
                    : L('Nunca executado', 'Never run', '从未运行', 'Jamais exécuté')}
                </span>
                <Button
                  size="sm"
                  leftIcon={<Play className="h-3.5 w-3.5" />}
                  loading={a.running}
                  disabled={!a.active}
                  onClick={() => runAgent(a.id)}
                >
                  {a.running
                    ? L('Executando…', 'Running…', '执行中…', 'En cours…')
                    : L('Executar agora', 'Run now', '立即执行', 'Exécuter')}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* combined activity timeline */}
      <section className="mt-8">
        <SectionTitle action={<Badge tone="neutral">{log.length}</Badge>}>
          <span className="inline-flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-brand-600" />
            {L('Atividade recente', 'Recent activity', '近期活动', 'Activité récente')}
          </span>
        </SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>{L('Agente', 'Agent', '智能体', 'Agent')}</Th>
              <Th>{L('Ação', 'Action', '动作', 'Action')}</Th>
              <Th className="text-right">{L('Quando', 'When', '时间', 'Quand')}</Th>
            </tr>
          </thead>
          <tbody>
            {log.slice(0, 8).map((e) => {
              const owner = agents.find((a) => a.id === e.agentId);
              const Icon = owner?.icon ?? Bot;
              return (
                <tr key={e.id} className="transition-colors hover:bg-ink/[0.02]">
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-ink/[0.05] text-brand-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-medium">{owner ? T(owner.name) : e.agentId}</span>
                    </span>
                  </Td>
                  <Td className="text-muted">{T(e.action)}</Td>
                  <Td className="whitespace-nowrap text-right text-muted">{timeAgo(e.at, locale)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </section>
    </ScreenContainer>
  );
}

function Mini({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface/60 px-3 py-2.5">
      <p className="truncate text-2xs font-medium uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-0.5 font-display text-sm font-bold tracking-tight tnum">{value}</p>
    </div>
  );
}
