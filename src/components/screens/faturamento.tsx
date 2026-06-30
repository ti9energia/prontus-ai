'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Banknote, RefreshCw, TrendingUp, AlertTriangle, ShieldCheck, Send } from 'lucide-react';
import { listGuides, billingStats, resubmitGuide } from '@/lib/data';
import type { GuideStatus } from '@/lib/types';
import { ScreenContainer, ScreenHeader, StatCard } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { formatCurrency, cn } from '@/lib/utils';

const STATUS_TONE: Record<GuideStatus, React.ComponentProps<typeof Badge>['tone']> = {
  draft: 'neutral',
  sent: 'info',
  paid: 'success',
  glossed: 'danger',
};

/** Billing-team queue across the whole org (Block 5) — distinct from the doctor's
 *  gloss dashboard: cross-doctor filters + one-click resubmit. */
export function FaturamentoScreen({ paneId }: { paneId: string }) {
  void paneId;
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const [, bump] = React.useReducer((x: number) => x + 1, 0);
  const [filter, setFilter] = React.useState<'all' | GuideStatus>('all');
  const stats = billingStats();
  const guides = listGuides().filter((g) => (filter === 'all' ? true : g.status === filter));

  const resub = (id: string) => {
    resubmitGuide(id);
    bump();
    toast.success(L('Guia reenviada', 'Claim resubmitted', '单据已重新提交', 'Feuille renvoyée'));
  };

  const flabel = (f: 'all' | GuideStatus) =>
    ({
      all: L('Todas', 'All', '全部', 'Toutes'),
      glossed: L('Glosadas', 'Denied', '被拒', 'Rejetées'),
      sent: L('Enviadas', 'Sent', '已发送', 'Envoyées'),
      paid: L('Pagas', 'Paid', '已支付', 'Payées'),
      draft: L('Rascunho', 'Draft', '草稿', 'Brouillon'),
    })[f];

  const filters: Array<'all' | GuideStatus> = ['all', 'glossed', 'sent', 'paid'];

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Banknote}
        title={L('Faturamento (equipe)', 'Billing (team)', '收费（团队）', 'Facturation (équipe)')}
        subtitle={L(
          'Fila de guias de toda a equipe — priorize reenvios e recupere glosas.',
          'Whole-team claim queue — prioritize resubmissions and recover denials.',
          '全团队单据队列——优先重新提交并追回拒付。',
          'File des feuilles de toute l’équipe — priorisez les renvois.',
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={L('Recuperado', 'Recovered', '已追回', 'Récupéré')} value={formatCurrency(stats.recovered, locale, 'BRL')} icon={TrendingUp} tone="success" />
        <StatCard label={L('Em risco', 'At risk', '风险中', 'À risque')} value={formatCurrency(stats.atRisk, locale, 'BRL')} icon={AlertTriangle} tone="danger" />
        <StatCard label={L('Taxa de glosa', 'Denial rate', '拒付率', 'Taux de rejet')} value={`${Math.round(stats.glossRate * 100)}%`} icon={ShieldCheck} tone="brand" />
        <StatCard label={L('Enviadas', 'Submitted', '已提交', 'Envoyées')} value={String(stats.submitted)} icon={Send} tone="brand" />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              filter === f ? 'border-brand-500/40 bg-brand-600/10 text-brand-700 dark:text-brand-300' : 'border-hairline text-muted hover:text-ink',
            )}
          >
            {flabel(f)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {guides.map((g) => (
          <Card key={g.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {g.payer} · {g.id}
              </p>
              <p className="text-2xs text-muted tnum">{formatCurrency(g.value, locale, 'BRL')}</p>
            </div>
            <Badge tone={STATUS_TONE[g.status]}>{flabel(g.status)}</Badge>
            {g.status === 'glossed' && (
              <Button size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => resub(g.id)}>
                {L('Reenviar', 'Resubmit', '重新提交', 'Renvoyer')}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </ScreenContainer>
  );
}
