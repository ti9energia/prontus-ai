'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Bot,
  Building2,
  Check,
  Crown,
  Flag,
  KeyRound,
  LayoutDashboard,
  LogIn,
  MessageCircle,
  Minus,
  PencilRuler,
  Plus,
  ScrollText,
  Send,
  Sparkles,
  Tags,
  TrendingUp,
} from 'lucide-react';
import {
  ALL_MODULE_KEYS,
  getPlan,
  listAudit,
  listFlags,
  listPlans,
  listTenants,
  mrrSeries,
  ownerStats,
  setTenantStatus,
  toggleFlag,
} from '@/lib/data/store';
import type { AuditEntry, TenantStatus } from '@/lib/types';
import { useOwner } from './context';
import { ScreenContainer, ScreenHeader, SectionTitle, StatCard, Table, Th, Td } from '@/components/screens/_kit';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { Avatar, SegmentedControl, Switch } from '@/components/ui/misc';
import { Progress } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { cn, formatCurrency, formatDate, formatNumber, formatPercent, timeAgo } from '@/lib/utils';

const L = (locale: string, pt: string, en: string, zh: string, fr: string) =>
  locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

const usageTone = (v: number) => (v > 85 ? 'danger' : v > 60 ? 'warning' : 'brand');

/* ============================== Overview ============================== */
export function OverviewSection() {
  const t = useTranslations('owner.overview');
  const locale = useLocale();
  const stats = ownerStats();
  const series = mrrSeries();
  const tenants = listTenants();
  const byUsage = [...tenants].sort((a, b) => b.usagePct - a.usagePct).slice(0, 6);
  const recent = [...tenants].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);

  return (
    <ScreenContainer>
      <ScreenHeader icon={LayoutDashboard} title={t('title')} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label={t('mrr')} value={formatCurrency(stats.mrr, locale, stats.currency)} sub={`+${formatPercent(stats.mrrGrowth, locale, 1)}`} icon={TrendingUp} tone="brand" />
        <StatCard label={t('activeTenants')} value={stats.activeTenants} icon={Building2} tone="accent" />
        <StatCard label={t('activeDoctors')} value={stats.activeDoctors} icon={Crown} tone="success" />
        <StatCard label={t('minutesProcessed')} value={formatNumber(stats.minutesProcessed, locale)} tone="neutral" />
        <StatCard label={t('aiSpend')} value={formatCurrency(stats.aiSpend, locale, stats.currency)} icon={Sparkles} tone="brand" />
        <StatCard label={t('churn')} value={formatPercent(stats.churn, locale, 1)} tone="warning" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-4">
          <SectionTitle>{t('growth')}</SectionTitle>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(148 163 184 / 0.15)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="rgb(148 163 184 / 0.6)" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="rgb(148 163 184 / 0.6)" axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatCurrency(Number(v), locale, stats.currency)} />
                <Tooltip
                  contentStyle={{ background: 'rgb(16 22 33)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, fontSize: 12, color: '#fff' }}
                  formatter={(v: number) => [formatCurrency(v, locale, stats.currency), 'MRR']}
                />
                <Area type="monotone" dataKey="mrr" stroke="#0d9488" strokeWidth={2.5} fill="url(#mrrG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
  const tf = useTranslations('feedback');
  const locale = useLocale();
  const { setImpersonating } = useOwner();
  const [, force] = React.useReducer((x) => x + 1, 0);
  const tenants = listTenants();

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Building2}
        title={t('title')}
        actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => toast.success(tf('comingSoon'))}>{t('add')}</Button>}
      />
      <Table>
        <thead>
          <tr>
            <Th>{t('columns.name')}</Th>
            <Th>{t('columns.plan')}</Th>
            <Th className="text-center">{t('columns.doctors')}</Th>
            <Th className="w-40">{t('columns.usage')}</Th>
            <Th className="text-right">{t('columns.mrr')}</Th>
            <Th>{t('columns.status')}</Th>
            <Th className="text-right">{t('columns.actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tn) => (
            <tr key={tn.id} className="hover:bg-ink/[0.02]">
              <Td>
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
                    onClick={() => setImpersonating(tn.name)}
                  >
                    {t('impersonate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTenantStatus(tn.id, tn.status === 'suspended' ? 'active' : 'suspended');
                      force();
                    }}
                  >
                    {tn.status === 'suspended' ? t('activate') : t('suspend')}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </ScreenContainer>
  );
}

/* ============================== Plans ============================== */
export function PlansSection() {
  const t = useTranslations('owner.plans');
  const tm = useTranslations('modules');
  const tf = useTranslations('feedback');
  const locale = useLocale();
  const plans = listPlans();

  const quota = (v: number | 'unlimited') => (v === 'unlimited' ? '∞' : formatNumber(v, locale));

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Tags}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => toast.success(tf('comingSoon'))}>{t('add')}</Button>}
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
                  <Check className="h-3.5 w-3.5 text-brand-600" />
                  <span className="text-ink/90">{tm(m as 'tiss')}</span>
                </li>
              ))}
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

            <Button variant="outline" className="mt-4 w-full" leftIcon={<PencilRuler className="h-4 w-4" />} onClick={() => toast.success(tf('comingSoon'))}>
              {t('editPlan')}
            </Button>
          </Card>
        ))}
      </div>
    </ScreenContainer>
  );
}

/* ============================== Landing CMS ============================== */
const LANDING_SECTIONS = ['hero', 'features', 'pricing', 'faq', 'testimonials', 'cta'] as const;
const LANDING_LOCALES = ['pt-BR', 'en', 'zh-CN', 'fr-FR'];

export function LandingSection() {
  const t = useTranslations('owner.landing');
  const tf = useTranslations('feedback');
  const [sec, setSec] = React.useState<(typeof LANDING_SECTIONS)[number]>('hero');
  const [loc, setLoc] = React.useState('pt-BR');

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={PencilRuler}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => toast.success(tf('comingSoon'))}>{t('preview')}</Button>
            <Button leftIcon={<Send className="h-4 w-4" />} onClick={() => toast.success(tf('published'))}>{t('publish')}</Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="p-2">
          {LANDING_SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSec(s)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                sec === s ? 'bg-brand-600/12 font-medium text-brand-700 dark:text-brand-300' : 'text-muted hover:bg-ink/[0.05]',
              )}
            >
              {t(`sections.${s}` as 'sections.hero')}
              <Badge tone={s === 'hero' ? 'success' : 'neutral'}>{s === 'hero' ? t('published') : t('draft')}</Badge>
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
                  onClick={() => setLoc(l)}
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
              <Input key={`${sec}-${loc}-t`} defaultValue={`${sec} · ${loc}`} />
            </Field>
            <Field label={t('fields.subtitle')}>
              <Textarea key={`${sec}-${loc}-s`} defaultValue="" placeholder="…" />
            </Field>
            <Field label={t('fields.cta')}>
              <Input key={`${sec}-${loc}-c`} defaultValue="" placeholder="…" />
            </Field>
            <p className="text-2xs text-muted">{t('savedNote')}</p>
          </div>
        </Card>
      </div>
    </ScreenContainer>
  );
}

/* ============================== Flags ============================== */
export function FlagsSection() {
  const t = useTranslations('owner.flags');
  const tm = useTranslations('modules');
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
                      toggleFlag(f.module);
                      force();
                    }}
                    aria-label={f.module}
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
  const [autonomy, setAutonomy] = React.useState<'suggest' | 'semi' | 'scheduled'>('semi');

  const tools = ['notes:read', 'tiss:create', 'tiss:submit', 'billing:gloss:read'];
  const [enabled, setEnabled] = React.useState<string[]>(['notes:read', 'tiss:create', 'billing:gloss:read']);

  return (
    <ScreenContainer>
      <ScreenHeader icon={Bot} title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="space-y-5 p-5">
          <Field label={L(locale, 'Organização', 'Organization', '组织', 'Organisation')}>
            <Select>
              {tenants.map((tn) => (
                <option key={tn.id}>{tn.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('persona')}>
              <Input defaultValue="Mari" />
            </Field>
            <Field label={t('model')}>
              <Select defaultValue="claude-opus-4-8">
                <option value="claude-opus-4-8">claude-opus-4-8</option>
                <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
                <option value="claude-haiku-4-5">claude-haiku-4-5</option>
              </Select>
            </Field>
          </div>
          <Field label={t('monthlyBudget')}>
            <Input defaultValue={formatCurrency(2500, locale, 'BRL')} />
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
              {tools.map((tool) => {
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
        </Card>
        <div className="space-y-4">
          <StatCard label={t('spend')} value={formatCurrency(stats.aiSpend, locale, 'BRL')} icon={Sparkles} tone="brand" />
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-brand-500" /> Mari
            </p>
            <p className="mt-1 text-2xs text-muted">
              {L(
                locale,
                'A IA respeita o papel do usuário e a LGPD em UI, API e WhatsApp.',
                'The AI respects the user role and LGPD across UI, API and WhatsApp.',
                'AI 在 UI、API 和 WhatsApp 中均遵循用户角色与 LGPD。',
                'L’IA respecte le rôle de l’utilisateur et la LGPD sur l’UI, l’API et WhatsApp.',
              )}
            </p>
          </Card>
        </div>
      </div>
    </ScreenContainer>
  );
}

/* ============================== WhatsApp ============================== */
export function WhatsappSection() {
  const t = useTranslations('owner.whatsapp');
  const locale = useLocale();
  const [perTenant, setPerTenant] = React.useState(true);

  const commands = [
    L(locale, 'Consultar guias glosadas', 'Query denied claims', '查询被拒单据', 'Consulter les rejets'),
    L(locale, 'Resumo da agenda', 'Schedule summary', '日程摘要', 'Résumé de l’agenda'),
    L(locale, 'Reenviar guia', 'Resubmit claim', '重新提交单据', 'Renvoyer une feuille'),
    L(locale, 'Minutos economizados', 'Minutes saved', '已节省分钟', 'Minutes gagnées'),
  ];
  const [on, setOn] = React.useState<number[]>([0, 1, 2, 3]);

  const templates = [
    L(locale, 'Entrou um caso de risco alto — quer revisar?', 'A high-risk case came in — review it?', '有一例高风险病例——需要查看吗？', 'Un cas à haut risque est arrivé — le revoir ?'),
    L(locale, 'Você tem 3 guias glosadas para reenvio.', 'You have 3 denied claims to resubmit.', '你有 3 单被拒待重新提交。', 'Vous avez 3 feuilles rejetées à renvoyer.'),
  ];

  return (
    <ScreenContainer>
      <ScreenHeader icon={MessageCircle} title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <Field label={t('number')}>
            <Input defaultValue="+55 11 4000-2000" className="font-mono" />
          </Field>
          <Field label={t('persona')}>
            <Input defaultValue="Mari" />
          </Field>
          <label className="flex items-center justify-between rounded-lg border border-hairline bg-surface/50 px-3 py-2.5">
            <span className="text-sm">{t('perTenant')}</span>
            <Switch checked={perTenant} onChange={setPerTenant} />
          </label>
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <SectionTitle>{t('commands')}</SectionTitle>
            <div className="space-y-2">
              {commands.map((cmd, i) => (
                <label key={i} className="flex items-center justify-between rounded-lg border border-hairline px-3 py-2 text-sm">
                  <span>{cmd}</span>
                  <Switch checked={on.includes(i)} onChange={() => setOn((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))} />
                </label>
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
export function AccessSection() {
  const t = useTranslations('owner.access');
  const tr = useTranslations('roles');
  const tf = useTranslations('feedback');
  const locale = useLocale();

  const roles = ['org_admin', 'medico', 'faturista', 'gestor', 'viewer'];
  const perms = [
    { key: 'view', label: L(locale, 'Ver dados', 'View data', '查看数据', 'Voir les données'), allow: [true, true, true, true, true] },
    { key: 'act', label: L(locale, 'Executar ação', 'Run action', '执行操作', 'Exécuter une action'), allow: [true, true, true, true, false] },
    { key: 'config', label: L(locale, 'Configurar produto', 'Configure product', '配置产品', 'Configurer le produit'), allow: [true, true, false, true, false] },
    { key: 'users', label: L(locale, 'Gerenciar usuários', 'Manage users', '管理用户', 'Gérer les utilisateurs'), allow: [true, false, false, false, false] },
    { key: 'plans', label: L(locale, 'Editar planos', 'Edit plans', '编辑套餐', 'Modifier les offres'), allow: [false, false, false, false, false] },
    { key: 'ai', label: L(locale, 'Configurar IA/WhatsApp', 'Configure AI/WhatsApp', '配置 AI/WhatsApp', 'Configurer IA/WhatsApp'), allow: [true, false, false, false, false] },
  ];

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={KeyRound}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => toast.success(tf('comingSoon'))}>{t('addRole')}</Button>}
      />
      <SectionTitle>{t('matrix')}</SectionTitle>
      <Table>
        <thead>
          <tr>
            <Th>{t('permission')}</Th>
            {roles.map((r) => (
              <Th key={r} className="text-center">
                {tr(r as 'medico')}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {perms.map((p) => (
            <tr key={p.key} className="hover:bg-ink/[0.02]">
              <Td className="font-medium">{p.label}</Td>
              {p.allow.map((a, i) => (
                <Td key={i} className="text-center">
                  {a ? (
                    <Check className="mx-auto h-4 w-4 text-success" />
                  ) : (
                    <Minus className="mx-auto h-4 w-4 text-subtle/50" />
                  )}
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
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

  const resultLabel = (r: AuditEntry['result']) =>
    r === 'ok'
      ? L(locale, 'OK', 'OK', '成功', 'OK')
      : r === 'blocked'
        ? L(locale, 'Bloqueado', 'Blocked', '已拦截', 'Bloqué')
        : L(locale, 'Pendente', 'Pending', '待处理', 'En attente');

  return (
    <ScreenContainer>
      <ScreenHeader icon={ScrollText} title={t('title')} subtitle={t('subtitle')} />
      <Table>
        <thead>
          <tr>
            <Th>{t('columns.time')}</Th>
            <Th>{t('columns.actor')}</Th>
            <Th>{t('columns.action')}</Th>
            <Th>{t('columns.target')}</Th>
            <Th>{t('columns.result')}</Th>
            <Th>{t('columns.source')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-ink/[0.02]">
              <Td className="whitespace-nowrap text-2xs text-muted">{timeAgo(r.at, locale)}</Td>
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
