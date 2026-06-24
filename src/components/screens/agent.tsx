'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Sparkles,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileWarning,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { agentRecommendations } from '@/lib/data/store';
import type { AgentCategory, AgentRecommendation } from '@/lib/types';
import { openTab } from '@/lib/workspace/store';
import { ScreenContainer, ScreenHeader } from './_kit';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import { type Locale } from '@/i18n/routing';

const CATEGORY_META: Record<
  AgentCategory,
  {
    icon: LucideIcon;
    tone: React.ComponentProps<typeof Badge>['tone'];
    strip: string;
    chip: string;
  }
> = {
  gloss: {
    icon: AlertTriangle,
    tone: 'danger',
    strip: 'bg-danger',
    chip: 'bg-danger/12 text-danger-fg dark:text-danger',
  },
  resubmit: {
    icon: RefreshCw,
    tone: 'warning',
    strip: 'bg-warning',
    chip: 'bg-warning/12 text-warning-fg dark:text-warning',
  },
  incomplete: {
    icon: FileWarning,
    tone: 'info',
    strip: 'bg-info',
    chip: 'bg-info/12 text-info-fg dark:text-info',
  },
  template: {
    icon: FileText,
    tone: 'brand',
    strip: 'bg-brand-600',
    chip: 'bg-brand-600/10 text-brand-600',
  },
};

/* Per-locale rationale shown under "why" — keyed by recommendation id. */
const RATIONALE: Record<string, Record<Locale, string>> = {
  rec_1: {
    'pt-BR': 'O código do procedimento não bate com o CID informado. Operadoras glosam esse tipo de inconsistência em ~91% dos casos.',
    en: 'The procedure code does not match the reported diagnosis. Payers deny this kind of mismatch in ~91% of cases.',
    'zh-CN': '操作编码与所填诊断不匹配。付款方约有 91% 的情况会拒付此类不一致。',
    'fr-FR': 'Le code de l’acte ne correspond pas au diagnostic indiqué. Les assureurs rejettent ce type d’incohérence dans ~91 % des cas.',
  },
  rec_2: {
    'pt-BR': 'A glosa foi por falta de autorização prévia. Anexei o documento de autorização — a guia está pronta para reenvio imediato.',
    en: 'The denial was due to missing prior authorization. I attached the authorization document — the guide is ready for immediate resubmission.',
    'zh-CN': '拒付原因是缺少事先授权。我已附上授权文件——该表单可立即重新提交。',
    'fr-FR': 'Le rejet était dû à l’absence d’autorisation préalable. J’ai joint le document d’autorisation — le guide est prêt à être renvoyé immédiatement.',
  },
  rec_3: {
    'pt-BR': 'A consulta foi finalizada mas a nota ficou em rascunho. Sem o prontuário aprovado, a guia não pode ser gerada.',
    en: 'The encounter ended but the note is still a draft. Without an approved note, the guide cannot be generated.',
    'zh-CN': '就诊已结束，但记录仍为草稿。没有已批准的记录，无法生成表单。',
    'fr-FR': 'La consultation est terminée mais la note est encore un brouillon. Sans note approuvée, le guide ne peut pas être généré.',
  },
};

const FALLBACK_RATIONALE: Record<Locale, string> = {
  'pt-BR': 'Recomendação baseada nos dados da consulta e no histórico de glosas da operadora.',
  en: 'Recommendation based on encounter data and the payer’s denial history.',
  'zh-CN': '基于就诊数据和付款方拒付历史的推荐。',
  'fr-FR': 'Recommandation basée sur les données de consultation et l’historique des rejets de l’assureur.',
};

function rationaleFor(id: string, locale: string) {
  return RATIONALE[id]?.[(locale as Locale)] ?? FALLBACK_RATIONALE[(locale as Locale)] ?? FALLBACK_RATIONALE['pt-BR'];
}

export function AgentScreen({ paneId }: { paneId: string }) {
  const t = useTranslations('agent');
  const locale = useLocale();

  const [items, setItems] = React.useState<AgentRecommendation[]>(() => agentRecommendations());

  const dismiss = (id: string) => setItems((prev) => prev.filter((r) => r.id !== id));

  const review = (rec: AgentRecommendation) => {
    if (rec.encounterId) openTab('review', { id: rec.encounterId }, { paneId });
    else if (rec.guideId) openTab('billing', undefined, { paneId });
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Sparkles}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          items.length > 0 ? (
            <Badge tone="brand" className="h-7 px-3">
              {items.length} · {t('recommendations')}
            </Badge>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-7 w-7" />}
          title={t('noRecommendations')}
          description={t('subtitle')}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              locale={locale}
              t={t}
              onApply={() => dismiss(rec.id)}
              onDismiss={() => dismiss(rec.id)}
              onReview={() => review(rec)}
            />
          ))}
        </div>
      )}
    </ScreenContainer>
  );
}

function RecommendationCard({
  rec,
  locale,
  t,
  onApply,
  onDismiss,
  onReview,
}: {
  rec: AgentRecommendation;
  locale: string;
  t: ReturnType<typeof useTranslations<'agent'>>;
  onApply: () => void;
  onDismiss: () => void;
  onReview: () => void;
}) {
  const [showWhy, setShowWhy] = React.useState(false);
  const meta = CATEGORY_META[rec.category];
  const CatIcon = meta.icon;
  const patient = String(rec.params.patient ?? '');

  return (
    <article className="group relative overflow-hidden rounded-xl border border-hairline bg-card shadow-xs transition-shadow duration-300 hover:shadow-md">
      {/* left accent strip */}
      <span className={cn('absolute inset-y-0 left-0 w-1', meta.strip)} aria-hidden />

      <div className="flex flex-col gap-4 p-5 pl-6 sm:pl-7">
        {/* header */}
        <div className="flex items-start gap-3.5">
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', meta.chip)}>
            <CatIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge tone={meta.tone}>{t(`categories.${rec.category}`)}</Badge>
            </div>
            <h3 className="font-display text-base font-semibold tracking-tight">
              {t(`items.${rec.titleKey}.title` as 'items.preGloss.title')}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {t(`items.${rec.descKey}.desc` as 'items.preGloss.desc', { patient })}
            </p>
          </div>
        </div>

        {/* metrics */}
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <Metric
            icon={TrendingUp}
            tone="success"
            label={t('impact')}
            value={formatCurrency(rec.impact, locale, 'BRL')}
          />
          <Metric
            icon={Gauge}
            tone="brand"
            label={t('confidence')}
            value={formatPercent(rec.confidence, locale, 0)}
          />
        </div>

        {/* why */}
        <div>
          <button
            type="button"
            onClick={() => setShowWhy((v) => !v)}
            aria-expanded={showWhy}
            className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-muted transition-colors hover:text-ink"
          >
            {showWhy ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {t('why')}
          </button>
          {showWhy && (
            <p className="mt-2 rounded-lg border border-hairline bg-surface/60 px-3.5 py-2.5 text-sm leading-relaxed text-muted">
              {rationaleFor(rec.id, locale)}
            </p>
          )}
        </div>

        {/* actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-hairline/70 pt-4">
          <Button size="sm" leftIcon={<Check className="h-3.5 w-3.5" />} onClick={onApply}>
            {t('apply')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
            onClick={onReview}
          >
            {t('review')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<X className="h-3.5 w-3.5" />}
            onClick={onDismiss}
            className="ml-auto"
          >
            {t('dismiss')}
          </Button>
        </div>
      </div>
    </article>
  );
}

function Metric({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: LucideIcon;
  tone: 'success' | 'brand';
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  const toneCls =
    tone === 'success'
      ? 'bg-success/12 text-success-fg dark:text-success'
      : 'bg-brand-600/10 text-brand-600';
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface/60 px-3.5 py-3">
      <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', toneCls)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-2xs font-medium uppercase tracking-wide text-subtle">{label}</p>
        <p className="font-display text-base font-bold tracking-tight tnum">{value}</p>
      </div>
    </div>
  );
}
