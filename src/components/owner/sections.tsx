'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import {
  Bot,
  Building2,
  Check,
  Crown,
  Flag,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogIn,
  MessageCircle,
  Minus,
  PencilRuler,
  Plus,
  ScrollText,
  Search,
  Send,
  Sparkles,
  Tags,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  ALL_MODULE_KEYS,
  addCustomRole,
  addTenant as createTenant,
  auditImpersonation,
  getLandingBlock,
  getPlan,
  getTenant,
  listAudit,
  listCustomRoles,
  listFlags,
  listLandingBlocks,
  listPlans,
  listTenants,
  mrrSeries,
  ownerStats,
  publishLandingBlock,
  removeCustomRole,
  setTenantStatus,
  toggleFlag,
  updateTenantAi,
  updateTenantWhatsapp,
  upsertPlan,
  upsertTenantConnector,
} from '@/lib/data';
import type { AuditEntry, Plan, Tenant, TenantStatus } from '@/lib/types';
import { listConnectors } from '@/lib/connectors';
import { useOwner } from './context';
import { ScreenContainer, ScreenHeader, SectionTitle, StatCard, Table, Th, Td } from '@/components/screens/_kit';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { Avatar, SegmentedControl, Switch } from '@/components/ui/misc';
import { ConfirmDialog, Modal } from '@/components/ui/overlay';
import { Progress } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { cn, formatCurrency, formatDate, formatNumber, formatPercent, timeAgo } from '@/lib/utils';

const L = (locale: string, pt: string, en: string, zh: string, fr: string) =>
  locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

const usageTone = (v: number) => (v > 85 ? 'danger' : v > 60 ? 'warning' : 'brand');

let __idSeq = 0;
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(__idSeq++).toString(36)}`;

/** Theme-aware chart colors — same CSS vars globals.css feeds the Tailwind tokens with. */
// Lazy-loaded so recharts (~90KB) stays out of the initial /owner bundle and
// streams in behind a skeleton after hydration — see mrr-chart.tsx.
const MrrChart = dynamic(() => import('./mrr-chart').then((m) => m.MrrChart), {
  ssr: false,
  loading: () => <div className="skeleton h-[260px] w-full rounded-lg" />,
});

/** Styled empty row for owner tables — keeps the table chrome instead of collapsing it. */
function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <span className="inline-flex flex-col items-center gap-2 text-sm text-muted">
          <Inbox className="h-5 w-5 text-subtle" aria-hidden />
          {label}
        </span>
      </td>
    </tr>
  );
}

/* ============================== Overview ============================== */
const CHURN_WARNING_THRESHOLD = 0.03;

export function OverviewSection() {
  const t = useTranslations('owner.overview');
  const locale = useLocale();
  const { setSection } = useOwner();
  const stats = ownerStats();
  const series = mrrSeries();
  const tenants = listTenants();
  const byUsage = [...tenants].sort((a, b) => b.usagePct - a.usagePct).slice(0, 6);
  const recent = [...tenants].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);

  // Month-over-month delta straight from the MRR series (last vs previous point).
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const lastMrr = Number(last?.mrr ?? 0);
  const prevMrr = Number(prev?.mrr ?? 0);
  const mrrDelta = last && prev && prevMrr > 0 ? (lastMrr - prevMrr) / prevMrr : null;
  const vsPrevMonth = L(locale, 'vs mês anterior', 'vs last month', '环比上月', 'vs mois précédent');
  const churnHigh = stats.churn > CHURN_WARNING_THRESHOLD;

  const kpis: {
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    icon?: React.ComponentProps<typeof StatCard>['icon'];
    tone: React.ComponentProps<typeof StatCard>['tone'];
    target: Parameters<typeof setSection>[0];
  }[] = [
    {
      label: t('mrr'),
      value: formatCurrency(stats.mrr, locale, stats.currency),
      sub: mrrDelta !== null ? `${mrrDelta >= 0 ? '+' : ''}${formatPercent(mrrDelta, locale, 1)} ${vsPrevMonth}` : undefined,
      icon: TrendingUp,
      tone: 'brand',
      target: 'tenants',
    },
    { label: t('activeTenants'), value: stats.activeTenants, icon: Building2, tone: 'accent', target: 'tenants' },
    { label: t('activeDoctors'), value: stats.activeDoctors, icon: Crown, tone: 'success', target: 'tenants' },
    {
      label: t('minutesProcessed'),
      value: formatNumber(stats.minutesProcessed, locale),
      tone: 'neutral',
      target: 'ai',
    },
    {
      label: t('aiSpend'),
      value: formatCurrency(stats.aiSpend, locale, stats.currency),
      icon: Sparkles,
      tone: 'brand',
      target: 'ai',
    },
    {
      label: t('churn'),
      value: formatPercent(stats.churn, locale, 1),
      sub: churnHigh
        ? L(locale, 'acima da meta de 3%', 'above the 3% target', '高于 3% 目标', 'au-dessus de l’objectif de 3 %')
        : L(locale, 'dentro da meta (≤ 3%)', 'within target (≤ 3%)', '目标之内（≤ 3%）', 'dans l’objectif (≤ 3 %)'),
      tone: churnHigh ? 'warning' : 'success',
      target: 'tenants',
    },
  ];

  const lastMrrFmt = last ? formatCurrency(lastMrr, locale, stats.currency) : '';
  const chartLabel = L(
    locale,
    `Gráfico de área da evolução do MRR em ${series.length} meses; último valor ${lastMrrFmt}`,
    `Area chart of MRR over ${series.length} months; latest value ${lastMrrFmt}`,
    `${series.length} 个月 MRR 走势面积图；最新值 ${lastMrrFmt}`,
    `Graphique en aires du MRR sur ${series.length} mois ; dernière valeur ${lastMrrFmt}`,
  );

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={LayoutDashboard}
        title={t('title')}
        subtitle={L(
          locale,
          'MRR, uso e adoção da plataforma em um só lugar. Clique em um indicador para abrir a área.',
          'MRR, usage and platform adoption at a glance. Click a KPI to open its area.',
          'MRR、使用情况与平台采用一览。点击指标可进入对应板块。',
          'MRR, usage et adoption de la plateforme en un coup d’œil. Cliquez sur un indicateur pour ouvrir la zone.',
        )}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kpis.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => setSection(k.target)}
            className="group rounded-xl text-left transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:hover:-translate-y-0.5"
          >
            <StatCard
              label={k.label}
              value={k.value}
              sub={k.sub}
              icon={k.icon}
              tone={k.tone}
              className="h-full transition-colors group-hover:border-brand-500/40"
            />
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-4">
          <SectionTitle>{t('growth')}</SectionTitle>
          <p className="sr-only">
            {series.map((p) => `${p.label}: ${formatCurrency(Number(p.mrr), locale, stats.currency)}`).join(' · ')}
          </p>
          <MrrChart series={series} locale={locale} currency={stats.currency} label={chartLabel} />
        </Card>

        <Card className="p-4">
          <SectionTitle>{t('usage')}</SectionTitle>
          <div className="space-y-3">
            {byUsage.map((tn) => (
              <div key={tn.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="truncate">{tn.name}</span>
                  <span className="tnum text-muted">{tn.usagePct}%</span>
                </div>
                <Progress value={tn.usagePct} tone={usageTone(tn.usagePct)} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <SectionTitle>{t('recentSignups')}</SectionTitle>
        <Card className="divide-y divide-hairline/60">
          {recent.map((tn) => (
            <div key={tn.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={tn.name} hue={(tn.name.charCodeAt(0) * 9) % 360} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{tn.name}</p>
                <p className="text-2xs text-muted">{getPlan(tn.planId)?.name}</p>
              </div>
              <span className="text-2xs text-subtle">{timeAgo(tn.createdAt, locale)}</span>
            </div>
          ))}
        </Card>
      </div>
    </ScreenContainer>
  );
}

/* ============================== Tenants ============================== */
const TENANT_TONE: Record<TenantStatus, React.ComponentProps<typeof Badge>['tone']> = {
  active: 'success',
  trial: 'info',
  suspended: 'neutral',
  past_due: 'danger',
};

export function TenantsSection() {
  const t = useTranslations('owner.tenants');
  const tc = useTranslations('common');
  const tf = useTranslations('feedback');
  const locale = useLocale();
  const { setImpersonating } = useOwner();
  const plans = listPlans();
  const [, force] = React.useReducer((x) => x + 1, 0);
  const tenants = listTenants();

  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [planId, setPlanId] = React.useState(plans[0]?.id ?? '');

  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | TenantStatus>('all');
  const [confirm, setConfirm] = React.useState<{ kind: 'suspend' | 'activate' | 'impersonate'; tenant: Tenant } | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = tenants.filter(
    (tn) => (statusFilter === 'all' || tn.status === statusFilter) && (!q || tn.name.toLowerCase().includes(q)),
  );

  const addTenant = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createTenant({ name: trimmed, planId: planId || plans[0]?.id || '' });
    force();
    setAdding(false);
    setName('');
    setPlanId(plans[0]?.id ?? '');
    toast.success(tf('added'));
  };

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === 'impersonate') {
      auditImpersonation(confirm.tenant.id, confirm.tenant.name);
      setImpersonating({ id: confirm.tenant.id, name: confirm.tenant.name });
    } else {
      setTenantStatus(confirm.tenant.id, confirm.kind === 'suspend' ? 'suspended' : 'active');
      force();
      toast.success(
        confirm.kind === 'suspend'
          ? L(locale, 'Organização suspensa', 'Organization suspended', '组织已暂停', 'Organisation suspendue')
          : L(locale, 'Organização reativada', 'Organization reactivated', '组织已恢复', 'Organisation réactivée'),
      );
    }
    setConfirm(null);
  };

  const statusOptions: { value: 'all' | TenantStatus; label: string }[] = [
    { value: 'all', label: L(locale, 'Todos', 'All', '全部', 'Tous') },
    { value: 'active', label: t('status.active') },
    { value: 'trial', label: t('status.trial') },
    { value: 'suspended', label: t('status.suspended') },
    { value: 'past_due', label: t('status.past_due') },
  ];

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Building2}
        title={t('title')}
        subtitle={L(
          locale,
          'Todas as organizações da plataforma — plano, uso, MRR e status.',
          'Every organization on the platform — plan, usage, MRR and status.',
          '平台上的全部组织——套餐、使用、MRR 与状态。',
          'Toutes les organisations de la plateforme — offre, usage, MRR et statut.',
        )}
        actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>{t('add')}</Button>}
      />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={L(locale, 'Buscar organização…', 'Search organization…', '搜索组织…', 'Rechercher une organisation…')}
            aria-label={L(locale, 'Buscar organização', 'Search organization', '搜索组织', 'Rechercher une organisation')}
            className="h-9 w-64 pl-9"
          />
        </div>
        <SegmentedControl value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
      </div>
      <Table>
        <thead>
          <tr>
            <Th className="sticky left-0 z-10 bg-card">{t('columns.name')}</Th>
            <Th>{t('columns.plan')}</Th>
            <Th className="text-center">{t('columns.doctors')}</Th>
            <Th className="w-40">{t('columns.usage')}</Th>
            <Th className="text-right">{t('columns.mrr')}</Th>
            <Th>{t('columns.status')}</Th>
            <Th className="text-right">{t('columns.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <EmptyRow
              colSpan={7}
              label={L(locale, 'Nenhuma organização encontrada', 'No organizations found', '未找到组织', 'Aucune organisation trouvée')}
            />
          )}
          {filtered.map((tn) => (
            <tr key={tn.id} className="hover:bg-ink/[0.02]">
              <Td className="sticky left-0 z-10 bg-card">
                <div className="flex items-center gap-2.5">
                  <Avatar name={tn.name} hue={(tn.name.charCodeAt(0) * 9) % 360} size={32} />
                  <span className="font-medium">{tn.name}</span>
                </div>
              </Td>
              <Td>
                <Badge tone="brand">{getPlan(tn.planId)?.name}</Badge>
              </Td>
              <Td className="text-center tnum">{tn.doctors}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Progress value={tn.usagePct} tone={usageTone(tn.usagePct)} className="w-20" />
                  <span className="tnum text-2xs text-muted">{tn.usagePct}%</span>
                </div>
              </Td>
              <Td className="text-right tnum font-medium">{formatCurrency(tn.mrr, locale, 'BRL')}</Td>
              <Td>
                <Badge tone={TENANT_TONE[tn.status]} dot>
                  {t(`status.${tn.status}` as 'status.active')}
                </Badge>
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<LogIn className="h-3.5 w-3.5" />}
                    onClick={() => setConfirm({ kind: 'impersonate', tenant: tn })}
                  >
                    {t('impersonate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirm({ kind: tn.status === 'suspended' ? 'activate' : 'suspend', tenant: tn })}
                  >
                    {tn.status === 'suspended' ? t('activate') : t('suspend')}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title={t('add')}
        description={L(
          locale,
          'Crie uma nova organização no seu workspace.',
          'Create a new organization in your workspace.',
          '在你的工作区中创建一个新组织。',
          'Créez une nouvelle organisation dans votre espace.',
        )}
        size="sm"
      >
        <div className="space-y-4 p-5">
          <Field label={t('columns.name')}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder={L(locale, 'Clínica Aurora', 'Aurora Clinic', '极光诊所', 'Clinique Aurora')}
            />
          </Field>
          <Field label={t('columns.plan')}>
            <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-hairline p-4">
          <Button variant="outline" onClick={() => setAdding(false)}>
            {tc('actions.cancel')}
          </Button>
          <Button onClick={addTenant} disabled={!name.trim()}>
            {tc('actions.create')}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        tone={confirm?.kind === 'suspend' ? 'danger' : 'default'}
        requireText={confirm?.kind === 'suspend' ? confirm.tenant.name : undefined}
        title={
          confirm?.kind === 'impersonate'
            ? `${t('impersonate')} ${confirm.tenant.name}?`
            : confirm?.kind === 'suspend'
              ? `${t('suspend')} ${confirm.tenant.name}?`
              : confirm
                ? `${t('activate')} ${confirm.tenant.name}?`
                : ''
        }
        description={
          confirm?.kind === 'impersonate'
            ? L(
                locale,
                'Você passa a ver o produto exatamente como esta organização. Toda ação fica registrada na auditoria.',
                'You will see the product exactly as this organization does. Every action is recorded in the audit trail.',
                '你将以该组织的视角查看产品。所有操作都会记录在审计日志中。',
                'Vous verrez le produit exactement comme cette organisation. Chaque action est consignée dans l’audit.',
              )
            : confirm?.kind === 'suspend'
              ? L(
                  locale,
                  'A organização perde o acesso imediatamente. Você pode reativá-la depois.',
                  'The organization loses access immediately. You can reactivate it later.',
                  '该组织将立即失去访问权限。之后可以重新激活。',
                  'L’organisation perd l’accès immédiatement. Vous pourrez la réactiver ensuite.',
                )
              : L(
                  locale,
                  'A organização volta a ter acesso imediatamente.',
                  'The organization regains access immediately.',
                  '该组织将立即恢复访问权限。',
                  'L’organisation retrouve l’accès immédiatement.',
                )
        }
        confirmLabel={
          confirm?.kind === 'impersonate' ? t('impersonate') : confirm?.kind === 'suspend' ? t('suspend') : t('activate')
        }
      />
    </ScreenContainer>
  );
}

/* ============================== Plans ============================== */
export function PlansSection() {
  const t = useTranslations('owner.plans');
  const tc = useTranslations('common');
  const tm = useTranslations('modules');
  const tf = useTranslations('feedback');
  const locale = useLocale();
  const [, force] = React.useReducer((x) => x + 1, 0);
  const plans = listPlans();
  const [draft, setDraft] = React.useState<Plan | null>(null);
  const [isNew, setIsNew] = React.useState(false);

  const quota = (v: number | 'unlimited') => (v === 'unlimited' ? '∞' : formatNumber(v, locale));
  const quotaIn = (v: number | 'unlimited') => (v === 'unlimited' ? '∞' : String(v));
  const quotaOut = (s: string): number | 'unlimited' => {
    const raw = s.trim();
    if (raw === '' || raw === '∞' || /unlim|ilim/i.test(raw)) return 'unlimited';
    const n = Number(raw.replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? n : 'unlimited';
  };

  const openAdd = () => {
    setIsNew(true);
    setDraft({
      id: uid('plan'),
      name: '',
      price: 0,
      currency: 'BRL',
      modules: ['encounters', 'clinical-notes', 'copilot'],
      quotas: { doctors: 5, minutes: 2000, whatsapp: false },
      featureKeys: [],
    });
  };
  const openEdit = (plan: Plan) => {
    setIsNew(false);
    setDraft({ ...plan, quotas: { ...plan.quotas }, modules: [...plan.modules] });
  };
  const save = () => {
    if (!draft || !draft.name.trim()) return;
    upsertPlan({ ...draft, name: draft.name.trim() });
    force();
    setDraft(null);
    toast.success(isNew ? tf('added') : tf('saved'));
  };
  const toggleModule = (m: string) =>
    setDraft((d) =>
      d ? { ...d, modules: d.modules.includes(m) ? d.modules.filter((x) => x !== m) : [...d.modules, m] } : d,
    );

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Tags}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>{t('add')}</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={cn('flex flex-col p-5', plan.popular && 'ring-1 ring-brand-500/40')}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold capitalize">{plan.name}</h3>
              {plan.popular && <Badge tone="brand">★</Badge>}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold tracking-tight">{formatCurrency(plan.price, locale, plan.currency)}</span>
              <span className="text-xs text-muted">{t('perDoctor')}</span>
            </div>

            <p className="mt-4 text-2xs font-semibold uppercase tracking-wide text-subtle">{t('modules')}</p>
            <ul className="mt-2 flex-1 space-y-1.5">
              {plan.modules.slice(0, 7).map((m) => (
                <li key={m} className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                  <span className="text-ink/90">{tm(m as 'tiss')}</span>
                </li>
              ))}
              {plan.modules.length > 7 && (
                <li className="pl-[1.375rem] text-2xs text-muted" title={plan.modules.slice(7).map((m) => tm(m as 'tiss')).join(', ')}>
                  +{plan.modules.length - 7}{' '}
                  {L(locale, 'outros módulos', 'more modules', '个其他模块', 'autres modules')}
                </li>
              )}
            </ul>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-surface/60 p-2.5 text-center">
              <div>
                <p className="text-2xs text-subtle">{t('quotaDoctors')}</p>
                <p className="text-sm font-semibold tnum">{quota(plan.quotas.doctors)}</p>
              </div>
              <div>
                <p className="text-2xs text-subtle">{t('quotaMinutes')}</p>
                <p className="text-sm font-semibold tnum">{quota(plan.quotas.minutes)}</p>
              </div>
              <div>
                <p className="text-2xs text-subtle">{t('quotaWhatsapp')}</p>
                <p className="text-sm font-semibold">{plan.quotas.whatsapp ? '✓' : '—'}</p>
              </div>
            </div>

            <Button variant="outline" className="mt-4 w-full" leftIcon={<PencilRuler className="h-4 w-4" />} onClick={() => openEdit(plan)}>
              {t('editPlan')}
            </Button>
          </Card>
        ))}
      </div>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={isNew ? t('add') : t('editPlan')}
        description={L(
          locale,
          'Defina preço, limites e os módulos liberados.',
          'Set price, limits and the unlocked modules.',
          '设置价格、限额以及解锁的模块。',
          'Définissez le prix, les limites et les modules débloqués.',
        )}
      >
        {draft && (
          <>
            <div className="space-y-4 p-5">
              <Field label={L(locale, 'Nome do plano', 'Plan name', '套餐名称', 'Nom de l’offre')}>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('price')}>
                  <Input
                    type="number"
                    min={0}
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })}
                  />
                </Field>
                <Field label={t('quotaDoctors')}>
                  <Input
                    value={quotaIn(draft.quotas.doctors)}
                    onChange={(e) => setDraft({ ...draft, quotas: { ...draft.quotas, doctors: quotaOut(e.target.value) } })}
                  />
                </Field>
              </div>
              <Field label={t('quotaMinutes')}>
                <Input
                  value={quotaIn(draft.quotas.minutes)}
                  onChange={(e) => setDraft({ ...draft, quotas: { ...draft.quotas, minutes: quotaOut(e.target.value) } })}
                />
              </Field>
              <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface/50 px-3 py-2.5">
                <span className="text-sm">{t('quotaWhatsapp')}</span>
                <Switch
                  checked={draft.quotas.whatsapp}
                  onChange={(v) => setDraft({ ...draft, quotas: { ...draft.quotas, whatsapp: v } })}
                  aria-label={t('quotaWhatsapp')}
                />
              </div>
              <div>
                <p className="mb-2 text-[0.8125rem] font-medium text-ink/90">{t('modules')}</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_MODULE_KEYS.map((m) => {
                    const on = draft.modules.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleModule(m)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-2xs transition-colors',
                          on
                            ? 'border-brand-500/40 bg-brand-600/10 text-brand-700 dark:text-brand-300'
                            : 'border-hairline text-muted',
                        )}
                      >
                        {on && <Check className="h-3 w-3" />}
                        {tm(m as 'tiss')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-hairline p-4">
              <Button variant="outline" onClick={() => setDraft(null)}>
                {tc('actions.cancel')}
              </Button>
              <Button onClick={save} disabled={!draft.name.trim()}>
                {isNew ? tc('actions.create') : t('save')}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </ScreenContainer>
  );
}

/* ============================== Landing CMS ============================== */
const LANDING_SECTIONS = ['hero', 'features', 'pricing', 'faq', 'testimonials', 'cta'] as const;
const LANDING_LOCALES = ['pt-BR', 'en', 'zh-CN', 'fr-FR'];

interface LandingDraft {
  title: string;
  subtitle: string;
  cta: string;
}

const landingDefaults = (sec: string, loc: string): LandingDraft => ({
  title: `${sec} · ${loc}`,
  subtitle: '',
  cta: '',
});

export function LandingSection() {
  const t = useTranslations('owner.landing');
  const locale = useLocale();
  const [, force] = React.useReducer((x) => x + 1, 0);
  const [sec, setSec] = React.useState<(typeof LANDING_SECTIONS)[number]>('hero');
  const [loc, setLoc] = React.useState('pt-BR');
  const [title, setTitle] = React.useState(landingDefaults('hero', 'pt-BR').title);
  const [subtitle, setSubtitle] = React.useState('');
  const [cta, setCta] = React.useState('');
  const [preview, setPreview] = React.useState(false);
  const [pendingSwitch, setPendingSwitch] = React.useState<{ sec: (typeof LANDING_SECTIONS)[number]; loc: string } | null>(null);

  // Persisted in the shared store — survives reload within the server process
  // (see .entrega/PENDENCIAS.md for the Postgres write-through gap on this entity).
  const publishedBlocks = listLandingBlocks();
  const savedFor = (s: string, l: string): LandingDraft => {
    const block = getLandingBlock(s, l);
    return block ? { title: block.title, subtitle: block.subtitle, cta: block.cta } : landingDefaults(s, l);
  };
  const isPublished = (s: string) => publishedBlocks.some((b) => b.section === s && b.published);
  const base = savedFor(sec, loc);
  const dirty = title !== base.title || subtitle !== base.subtitle || cta !== base.cta;

  const applySwitch = (s: (typeof LANDING_SECTIONS)[number], l: string) => {
    setSec(s);
    setLoc(l);
    const next = savedFor(s, l);
    setTitle(next.title);
    setSubtitle(next.subtitle);
    setCta(next.cta);
  };
  const requestSwitch = (s: (typeof LANDING_SECTIONS)[number], l: string) => {
    if (s === sec && l === loc) return;
    if (dirty) setPendingSwitch({ sec: s, loc: l });
    else applySwitch(s, l);
  };

  const publish = () => {
    publishLandingBlock(sec, loc, { title, subtitle, cta });
    force();
    toast.success(
      L(
        locale,
        'Publicado em modo demonstração — sem alterar a landing pública.',
        'Published in demo mode — the public landing is untouched.',
        '已在演示模式下发布——不会更改公开落地页。',
        'Publié en mode démo — la landing publique reste inchangée.',
      ),
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={PencilRuler}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPreview(true)}>{t('preview')}</Button>
            <Button leftIcon={<Send className="h-4 w-4" />} onClick={publish}>{t('publish')}</Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="p-2">
          {LANDING_SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => requestSwitch(s, loc)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                sec === s ? 'bg-brand-600/12 font-medium text-brand-700 dark:text-brand-300' : 'text-muted hover:bg-ink/[0.05]',
              )}
            >
              {t(`sections.${s}` as 'sections.hero')}
              {s === sec && dirty ? (
                <Badge tone="warning">{L(locale, 'Editando', 'Editing', '编辑中', 'En cours')}</Badge>
              ) : (
                <Badge tone={isPublished(s) ? 'success' : 'neutral'}>{isPublished(s) ? t('published') : t('draft')}</Badge>
              )}
            </button>
          ))}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">{t(`sections.${sec}` as 'sections.hero')}</h3>
            <div className="flex gap-1">
              {LANDING_LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => requestSwitch(sec, l)}
                  className={cn(
                    'rounded-md px-2 py-1 text-2xs font-medium transition-colors',
                    loc === l ? 'bg-ink text-bg' : 'text-muted hover:bg-ink/[0.06]',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Field label={t('fields.title')}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label={t('fields.subtitle')}>
              <Textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="…" />
            </Field>
            <Field label={t('fields.cta')}>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="…" />
            </Field>
            <p className="text-2xs text-muted">
              {L(
                locale,
                'Publicar salva este texto no backend (persiste, entra na auditoria) e atualiza a pré-visualização abaixo. A landing pública continua servindo a cópia revisada em código — plugar este conteúdo à renderização ao vivo é um passo consciente e separado.',
                'Publishing saves this copy to the backend (persists, enters the audit trail) and updates the preview below. The public landing still serves the reviewed, code-shipped copy — wiring this content into live rendering is a separate, deliberate step.',
                '发布会将此文案保存到后端（持久化，记入审计日志）并更新下方预览。公开落地页仍然使用已审阅、随代码发布的文案——将此内容接入实时渲染是另一项需要单独决定的工作。',
                'Publier enregistre ce texte côté serveur (persistant, tracé dans l’audit) et met à jour l’aperçu ci-dessous. La landing publique continue de servir le texte revu et livré avec le code — brancher ce contenu au rendu en direct est une étape distincte et délibérée.',
              )}
            </p>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!pendingSwitch}
        onClose={() => setPendingSwitch(null)}
        onConfirm={() => {
          if (pendingSwitch) applySwitch(pendingSwitch.sec, pendingSwitch.loc);
          setPendingSwitch(null);
        }}
        tone="danger"
        title={L(locale, 'Descartar alterações?', 'Discard changes?', '丢弃更改？', 'Abandonner les modifications ?')}
        description={L(
          locale,
          'Você tem edições não publicadas nesta seção. Trocar agora descarta o texto digitado.',
          'You have unpublished edits in this section. Switching now discards the typed text.',
          '此部分有未发布的编辑内容。现在切换将丢弃已输入的文本。',
          'Vous avez des modifications non publiées dans cette section. Changer maintenant les supprime.',
        )}
        confirmLabel={L(locale, 'Descartar', 'Discard', '丢弃', 'Abandonner')}
      />

      <Modal
        open={preview}
        onClose={() => setPreview(false)}
        title={t('preview')}
        description={`${t(`sections.${sec}` as 'sections.hero')} · ${loc}`}
      >
        <div className="p-5">
          <div className="rounded-xl border border-hairline bg-gradient-to-b from-surface/80 to-card p-8 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              {title || t(`sections.${sec}` as 'sections.hero')}
            </h2>
            {subtitle && <p className="mx-auto mt-3 max-w-md text-sm text-muted">{subtitle}</p>}
            <div className="mt-6">
              <Button>{cta || L(locale, 'Começar agora', 'Get started', '立即开始', 'Commencer')}</Button>
            </div>
          </div>
        </div>
      </Modal>
    </ScreenContainer>
  );
}

/* ============================== Flags ============================== */
export function FlagsSection() {
  const t = useTranslations('owner.flags');
  const tm = useTranslations('modules');
  const locale = useLocale();
  const [, force] = React.useReducer((x) => x + 1, 0);
  const flags = listFlags();

  return (
    <ScreenContainer>
      <ScreenHeader icon={Flag} title={t('title')} subtitle={t('subtitle')} />
      <Table>
        <thead>
          <tr>
            <Th>{t('module')}</Th>
            <Th>{t('scope')}</Th>
            <Th className="w-44">{t('rollout')}</Th>
            <Th className="text-right">{t('on')}</Th>
          </tr>
        </thead>
        <tbody>
          {flags.length === 0 && (
            <EmptyRow
              colSpan={4}
              label={L(locale, 'Nenhuma flag cadastrada', 'No flags configured', '暂无功能开关', 'Aucun drapeau configuré')}
            />
          )}
          {flags.map((f) => (
            <tr key={f.module} className="hover:bg-ink/[0.02]">
              <Td className="font-medium">{tm(f.module as 'tiss')}</Td>
              <Td>
                <Badge tone="neutral">{t(`scopes.${f.scope}` as 'scopes.global')}</Badge>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Progress value={f.rollout} className="w-24" />
                  <span className="tnum text-2xs text-muted">{f.rollout}%</span>
                </div>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end">
                  <Switch
                    checked={f.enabled}
                    onChange={() => {
                      const next = toggleFlag(f.module);
                      force();
                      toast.success(`${tm(f.module as 'tiss')} · ${next?.enabled ? t('on') : t('off')}`);
                    }}
                    aria-label={tm(f.module as 'tiss')}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </ScreenContainer>
  );
}

/* ============================== AI & Agent ============================== */
export function AiSection() {
  const t = useTranslations('owner.ai');
  const locale = useLocale();
  const tenants = listTenants();
  const stats = ownerStats();
  const { activeTenantId, setActiveTenant } = useOwner();
  const tenantId = activeTenantId ?? tenants[0]?.id ?? '';
  const [, bump] = React.useReducer((x: number) => x + 1, 0);
  const ai0 = getTenant(tenantId)?.ai;
  const [persona, setPersona] = React.useState(ai0?.persona ?? 'Mari');
  const [model, setModel] = React.useState(ai0?.model ?? 'claude-opus-4-8');
  const [budget, setBudget] = React.useState(String(ai0?.monthlyBudget ?? 2500));
  const [autonomy, setAutonomy] = React.useState<'suggest' | 'semi' | 'scheduled'>(ai0?.autonomy ?? 'semi');

  const allTools = ['notes:read', 'tiss:create', 'tiss:submit', 'billing:gloss:read'];
  const [enabled, setEnabled] = React.useState<string[]>(
    ai0?.enabledTools ?? ['notes:read', 'tiss:create', 'billing:gloss:read'],
  );

  React.useEffect(() => {
    const x = getTenant(tenantId)?.ai;
    setPersona(x?.persona ?? 'Mari');
    setModel(x?.model ?? 'claude-opus-4-8');
    setBudget(String(x?.monthlyBudget ?? 2500));
    setAutonomy(x?.autonomy ?? 'semi');
    setEnabled(x?.enabledTools ?? ['notes:read', 'tiss:create', 'billing:gloss:read']);
  }, [tenantId]);

  const save = () => {
    updateTenantAi(tenantId, {
      persona,
      model,
      autonomy,
      monthlyBudget: Number(budget) || 0,
      enabledTools: enabled,
    });
    toast.success(L(locale, 'Configuração salva', 'Settings saved', '设置已保存', 'Paramètres enregistrés'));
  };

  const tenantConns = getTenant(tenantId)?.connectors ?? [];
  const connOn = (id: string) => tenantConns.some((c) => c.id === id && c.configured);
  const toggleConnector = (id: string, category: string) => {
    const cur = tenantConns.find((c) => c.id === id);
    const nextOn = !cur?.configured;
    upsertTenantConnector(tenantId, {
      id,
      category,
      status: nextOn ? 'connected' : 'disconnected',
      configured: nextOn,
      config: cur?.config ?? {},
    });
    bump();
  };

  return (
    <ScreenContainer>
      <ScreenHeader icon={Bot} title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="space-y-5 p-5">
          <Field label={L(locale, 'Organização', 'Organization', '组织', 'Organisation')}>
            <Select value={tenantId} onChange={(e) => setActiveTenant(e.target.value)}>
              {tenants.map((tn) => (
                <option key={tn.id} value={tn.id}>
                  {tn.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('persona')}>
              <Input value={persona} onChange={(e) => setPersona(e.target.value)} />
            </Field>
            <Field label={t('model')}>
              <Select value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="claude-opus-4-8">claude-opus-4-8</option>
                <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
                <option value="claude-haiku-4-5">claude-haiku-4-5</option>
              </Select>
            </Field>
          </div>
          <Field label={t('monthlyBudget')}>
            <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </Field>
          <div>
            <p className="mb-2 text-[0.8125rem] font-medium text-ink/90">{t('autonomy')}</p>
            <SegmentedControl
              value={autonomy}
              onChange={setAutonomy}
              options={[
                { value: 'suggest', label: t('autonomyLevels.suggest') },
                { value: 'semi', label: t('autonomyLevels.semi') },
                { value: 'scheduled', label: t('autonomyLevels.scheduled') },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-[0.8125rem] font-medium text-ink/90">{t('tools')}</p>
            <div className="flex flex-wrap gap-2">
              {allTools.map((tool) => {
                const on = enabled.includes(tool);
                return (
                  <button
                    key={tool}
                    onClick={() => setEnabled((e) => (on ? e.filter((x) => x !== tool) : [...e, tool]))}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-2xs transition-colors',
                      on ? 'border-brand-500/40 bg-brand-600/10 text-brand-700 dark:text-brand-300' : 'border-hairline text-muted',
                    )}
                  >
                    {on && <Check className="h-3 w-3" />}
                    {tool}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={save}>{L(locale, 'Salvar', 'Save', '保存', 'Enregistrer')}</Button>
          </div>
        </Card>
        <div className="space-y-4">
          <StatCard label={t('spend')} value={formatCurrency(stats.aiSpend, locale, 'BRL')} icon={Sparkles} tone="brand" />
          <Card className="p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <KeyRound className="h-4 w-4 text-brand-500" />
              {L(locale, 'Integrações do cliente', 'Client integrations', '客户集成', 'Intégrations du client')}
            </p>
            <div className="space-y-1.5">
              {listConnectors().map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-hairline px-2.5 py-1.5 text-xs"
                >
                  <span className="truncate">{c.name}</span>
                  <Switch checked={connOn(c.id)} onChange={() => toggleConnector(c.id, c.category)} aria-label={c.name} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-brand-500" aria-hidden /> Mari
            </p>
            <dl className="mt-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted">{L(locale, 'Modelo em uso', 'Model in use', '使用中的模型', 'Modèle utilisé')}</dt>
                <dd className="truncate font-mono text-2xs">{model}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted">{L(locale, 'Status', 'Status', '状态', 'Statut')}</dt>
                <dd>
                  <Badge tone="success" dot>
                    {L(locale, 'Operacional', 'Operational', '运行正常', 'Opérationnel')}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted">{L(locale, 'Tools ativas', 'Active tools', '启用的工具', 'Outils actifs')}</dt>
                <dd className="tnum font-medium">
                  {enabled.length}/{allTools.length}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted">{t('autonomy')}</dt>
                <dd>{t(`autonomyLevels.${autonomy}` as 'autonomyLevels.semi')}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </ScreenContainer>
  );
}

/* ============================== WhatsApp ============================== */
const WA_COMMAND_KEYS = ['denied-claims', 'schedule-summary', 'resubmit-claim', 'minutes-saved'] as const;

export function WhatsappSection() {
  const t = useTranslations('owner.whatsapp');
  const locale = useLocale();
  const tenants = listTenants();
  const { activeTenantId, setActiveTenant } = useOwner();
  const tenantId = activeTenantId ?? tenants[0]?.id ?? '';
  const wa0 = getTenant(tenantId)?.whatsapp;
  const [number, setNumber] = React.useState(wa0?.number ?? '+55 11 4000-2000');
  const [waPersona, setWaPersona] = React.useState(wa0?.persona ?? 'Mari');
  const [perTenant, setPerTenant] = React.useState(wa0?.perTenant ?? true);
  const [on, setOn] = React.useState<string[]>(wa0?.commands ?? [...WA_COMMAND_KEYS]);

  React.useEffect(() => {
    const x = getTenant(tenantId)?.whatsapp;
    setNumber(x?.number ?? '+55 11 4000-2000');
    setWaPersona(x?.persona ?? 'Mari');
    setPerTenant(x?.perTenant ?? true);
    setOn(x?.commands ?? [...WA_COMMAND_KEYS]);
  }, [tenantId]);

  const save = () => {
    // The command toggles are part of the saved config — the toast only confirms what actually went in.
    updateTenantWhatsapp(tenantId, { number, persona: waPersona, perTenant, enabled: true, commands: on });
    toast.success(
      `${L(locale, 'WhatsApp salvo', 'WhatsApp saved', 'WhatsApp 已保存', 'WhatsApp enregistré')} · ${on.length} ${L(
        locale,
        'comandos ativos',
        'active commands',
        '个已启用命令',
        'commandes actives',
      )}`,
    );
  };

  const commands: { key: string; label: string }[] = [
    { key: WA_COMMAND_KEYS[0], label: L(locale, 'Consultar guias glosadas', 'Query denied claims', '查询被拒单据', 'Consulter les rejets') },
    { key: WA_COMMAND_KEYS[1], label: L(locale, 'Resumo da agenda', 'Schedule summary', '日程摘要', 'Résumé de l’agenda') },
    { key: WA_COMMAND_KEYS[2], label: L(locale, 'Reenviar guia', 'Resubmit claim', '重新提交单据', 'Renvoyer une feuille') },
    { key: WA_COMMAND_KEYS[3], label: L(locale, 'Minutos economizados', 'Minutes saved', '已节省分钟', 'Minutes gagnées') },
  ];

  const templates = [
    L(locale, 'Entrou um caso de risco alto — quer revisar?', 'A high-risk case came in — review it?', '有一例高风险病例——需要查看吗？', 'Un cas à haut risque est arrivé — le revoir ?'),
    L(locale, 'Você tem 3 guias glosadas para reenvio.', 'You have 3 denied claims to resubmit.', '你有 3 单被拒待重新提交。', 'Vous avez 3 feuilles rejetées à renvoyer.'),
  ];

  return (
    <ScreenContainer>
      <ScreenHeader icon={MessageCircle} title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <Field label={L(locale, 'Organização', 'Organization', '组织', 'Organisation')}>
            <Select value={tenantId} onChange={(e) => setActiveTenant(e.target.value)}>
              {tenants.map((tn) => (
                <option key={tn.id} value={tn.id}>
                  {tn.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('number')}>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} className="font-mono" />
          </Field>
          <Field label={t('persona')}>
            <Input value={waPersona} onChange={(e) => setWaPersona(e.target.value)} />
          </Field>
          <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface/50 px-3 py-2.5">
            <span className="text-sm">{t('perTenant')}</span>
            <Switch checked={perTenant} onChange={setPerTenant} aria-label={t('perTenant')} />
          </div>
          <div className="flex justify-end">
            <Button onClick={save}>{L(locale, 'Salvar', 'Save', '保存', 'Enregistrer')}</Button>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <SectionTitle>{t('commands')}</SectionTitle>
            <div className="space-y-2">
              {commands.map((cmd) => (
                <div key={cmd.key} className="flex items-center justify-between rounded-lg border border-hairline px-3 py-2 text-sm">
                  <span>{cmd.label}</span>
                  <Switch
                    checked={on.includes(cmd.key)}
                    onChange={() =>
                      setOn((s) => (s.includes(cmd.key) ? s.filter((x) => x !== cmd.key) : [...s, cmd.key]))
                    }
                    aria-label={cmd.label}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>{t('templates')}</SectionTitle>
            <div className="space-y-2">
              {templates.map((tpl, i) => (
                <div key={i} className="rounded-lg border border-hairline bg-surface/40 px-3 py-2 text-sm text-muted">
                  {tpl}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </ScreenContainer>
  );
}

/* ============================== Access matrix ============================== */
/** Allow/deny cell — perceivable color plus a text alternative on every cell. */
function PermIcon({ allowed, locale }: { allowed: boolean; locale: string }) {
  const label = allowed
    ? L(locale, 'Permitido', 'Allowed', '允许', 'Autorisé')
    : L(locale, 'Negado', 'Denied', '拒绝', 'Refusé');
  return (
    <span role="img" aria-label={label} title={label} className="inline-flex w-full justify-center">
      {allowed ? (
        <Check className="h-4 w-4 text-success" aria-hidden />
      ) : (
        <Minus className="h-4 w-4 text-muted" aria-hidden />
      )}
    </span>
  );
}

export function AccessSection() {
  const t = useTranslations('owner.access');
  const tc = useTranslations('common');
  const tr = useTranslations('roles');
  const tf = useTranslations('feedback');
  const locale = useLocale();

  const baseRoles = ['org_admin', 'medico', 'faturista', 'gestor', 'viewer'];
  const perms = [
    { key: 'view', label: L(locale, 'Ver dados', 'View data', '查看数据', 'Voir les données'), allow: [true, true, true, true, true] },
    { key: 'act', label: L(locale, 'Executar ação', 'Run action', '执行操作', 'Exécuter une action'), allow: [true, true, true, true, false] },
    { key: 'config', label: L(locale, 'Configurar produto', 'Configure product', '配置产品', 'Configurer le produit'), allow: [true, true, false, true, false] },
    { key: 'users', label: L(locale, 'Gerenciar usuários', 'Manage users', '管理用户', 'Gérer les utilisateurs'), allow: [true, false, false, false, false] },
    { key: 'plans', label: L(locale, 'Editar planos', 'Edit plans', '编辑套餐', 'Modifier les offres'), allow: [false, false, false, false, false] },
    { key: 'ai', label: L(locale, 'Configurar IA/WhatsApp', 'Configure AI/WhatsApp', '配置 AI/WhatsApp', 'Configurer IA/WhatsApp'), allow: [true, false, false, false, false] },
  ];

  const [, force] = React.useReducer((x) => x + 1, 0);
  const customRoles = listCustomRoles();
  const [adding, setAdding] = React.useState(false);
  const [roleName, setRoleName] = React.useState('');
  const [sel, setSel] = React.useState<string[]>([]);
  const [removing, setRemoving] = React.useState<{ key: string; label: string } | null>(null);

  const togglePerm = (k: string) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const addRole = () => {
    const trimmed = roleName.trim();
    if (!trimmed) return;
    addCustomRole({ label: trimmed, allowed: sel });
    force();
    setAdding(false);
    setRoleName('');
    setSel([]);
    toast.success(tf('added'));
  };

  const confirmRemoveRole = () => {
    if (!removing) return;
    removeCustomRole(removing.key);
    force();
    toast.success(tf('removed'));
    setRemoving(null);
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={KeyRound}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>{t('addRole')}</Button>}
      />
      <SectionTitle>{t('matrix')}</SectionTitle>
      <Table>
        <thead>
          <tr>
            <Th className="sticky left-0 z-10 bg-card">{t('permission')}</Th>
            {baseRoles.map((r) => (
              <Th key={r} className="text-center">
                {tr(r as 'medico')}
              </Th>
            ))}
            {customRoles.map((r) => (
              <Th key={r.key} className="text-center">
                <span className="inline-flex items-center gap-1.5">
                  {r.label}
                  <button
                    type="button"
                    onClick={() => setRemoving({ key: r.key, label: r.label })}
                    aria-label={`${tc('actions.delete')} ${r.label}`}
                    className="rounded p-0.5 text-subtle hover:bg-danger/10 hover:text-danger"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {perms.length === 0 && (
            <EmptyRow
              colSpan={1 + baseRoles.length + customRoles.length}
              label={L(locale, 'Nenhuma permissão cadastrada', 'No permissions configured', '暂无权限', 'Aucune permission configurée')}
            />
          )}
          {perms.map((p) => (
            <tr key={p.key} className="hover:bg-ink/[0.02]">
              <Td className="sticky left-0 z-10 bg-card font-medium">{p.label}</Td>
              {p.allow.map((a, i) => (
                <Td key={i} className="text-center">
                  <PermIcon allowed={a} locale={locale} />
                </Td>
              ))}
              {customRoles.map((r) => (
                <Td key={r.key} className="text-center">
                  <PermIcon allowed={r.allowed.includes(p.key)} locale={locale} />
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title={t('addRole')}
        description={L(
          locale,
          'Defina o nome e as permissões iniciais do papel.',
          'Set the name and starting permissions for the role.',
          '设置角色的名称和初始权限。',
          'Définissez le nom et les permissions initiales du rôle.',
        )}
      >
        <div className="space-y-4 p-5">
          <Field label={t('role')}>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              autoFocus
              placeholder={L(locale, 'Ex.: Auditor', 'e.g. Auditor', '例如：审计员', 'p. ex. Auditeur')}
            />
          </Field>
          <div>
            <p className="mb-2 text-[0.8125rem] font-medium text-ink/90">{t('permission')}</p>
            <div className="space-y-2">
              {perms.map((p) => {
                const on = sel.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePerm(p.key)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                      on
                        ? 'border-brand-500/40 bg-brand-600/10 text-brand-700 dark:text-brand-300'
                        : 'border-hairline text-muted',
                    )}
                  >
                    <span>{p.label}</span>
                    {on && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-hairline p-4">
          <Button variant="outline" onClick={() => setAdding(false)}>
            {tc('actions.cancel')}
          </Button>
          <Button onClick={addRole} disabled={!roleName.trim()}>
            {tc('actions.create')}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemoveRole}
        tone="danger"
        title={`${tc('actions.delete')} ${removing?.label ?? ''}?`}
        description={L(
          locale,
          'Usuários com este papel perdem as permissões associadas a ele.',
          'Users with this role lose the permissions tied to it.',
          '拥有此角色的用户将失去与之关联的权限。',
          'Les utilisateurs ayant ce rôle perdent les permissions qui y sont liées.',
        )}
        confirmLabel={tc('actions.delete')}
      />
    </ScreenContainer>
  );
}

/* ============================== Audit ============================== */
const RESULT_TONE: Record<AuditEntry['result'], React.ComponentProps<typeof Badge>['tone']> = {
  ok: 'success',
  blocked: 'danger',
  pending: 'warning',
};

export function AuditSection() {
  const t = useTranslations('owner.audit');
  const locale = useLocale();
  const rows = listAudit();

  const [query, setQuery] = React.useState('');
  const [resultFilter, setResultFilter] = React.useState<'all' | AuditEntry['result']>('all');

  const resultLabel = (r: AuditEntry['result']) =>
    r === 'ok'
      ? L(locale, 'OK', 'OK', '成功', 'OK')
      : r === 'blocked'
        ? L(locale, 'Bloqueado', 'Blocked', '已拦截', 'Bloqué')
        : L(locale, 'Pendente', 'Pending', '待处理', 'En attente');

  const q = query.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (resultFilter === 'all' || r.result === resultFilter) &&
      (!q ||
        r.actor.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        r.target.toLowerCase().includes(q)),
  );

  return (
    <ScreenContainer>
      <ScreenHeader icon={ScrollText} title={t('title')} subtitle={t('subtitle')} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={L(locale, 'Buscar por ator, ação ou alvo…', 'Search actor, action or target…', '按操作者、动作或对象搜索…', 'Rechercher acteur, action ou cible…')}
            aria-label={L(locale, 'Buscar na auditoria', 'Search audit trail', '搜索审计记录', 'Rechercher dans l’audit')}
            className="h-9 w-72 pl-9"
          />
        </div>
        <SegmentedControl
          value={resultFilter}
          onChange={setResultFilter}
          options={[
            { value: 'all', label: L(locale, 'Todos', 'All', '全部', 'Tous') },
            { value: 'ok', label: resultLabel('ok') },
            { value: 'blocked', label: resultLabel('blocked') },
            { value: 'pending', label: resultLabel('pending') },
          ]}
        />
      </div>
      <Table>
        <thead>
          <tr>
            <Th className="sticky left-0 z-10 bg-card">{t('columns.time')}</Th>
            <Th>{t('columns.actor')}</Th>
            <Th>{t('columns.action')}</Th>
            <Th>{t('columns.target')}</Th>
            <Th>{t('columns.result')}</Th>
            <Th>{t('columns.source')}</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <EmptyRow
              colSpan={6}
              label={L(locale, 'Nenhum registro encontrado', 'No entries found', '未找到记录', 'Aucune entrée trouvée')}
            />
          )}
          {filtered.map((r) => (
            <tr key={r.id} className="hover:bg-ink/[0.02]">
              <Td className="sticky left-0 z-10 whitespace-nowrap bg-card text-2xs text-muted">{timeAgo(r.at, locale)}</Td>
              <Td className="text-sm">{r.actor}</Td>
              <Td className="font-mono text-2xs">{r.action}</Td>
              <Td className="font-mono text-2xs text-muted">{r.target}</Td>
              <Td>
                <Badge tone={RESULT_TONE[r.result]}>{resultLabel(r.result)}</Badge>
              </Td>
              <Td>
                <Badge tone="neutral">{t(`sources.${r.source}` as 'sources.ui')}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </ScreenContainer>
  );
}
