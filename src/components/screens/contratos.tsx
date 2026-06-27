'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Handshake } from 'lucide-react';
import { PAYERS, getGuideTemplate } from '@/lib/data/store';
import { ScreenContainer, ScreenHeader } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

/** Per-payer contracts + the standard guide configured for each plan (Block 5b),
 *  reusing the per-payer guide templates from Block 2. */
export function ContratosScreen({ paneId }: { paneId: string }) {
  void paneId;
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Handshake}
        title={L('Contratos', 'Contracts', '合同', 'Contrats')}
        subtitle={L(
          'Convênios e a guia-padrão de cada plano de saúde.',
          'Payers and the standard guide for each health plan.',
          '支付方与各健康计划的标准单据。',
          'Assureurs et la feuille standard de chaque plan.',
        )}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {PAYERS.map((payer) => {
          const tpl = getGuideTemplate(payer);
          const procs = tpl?.procedures ?? [];
          const total = procs.reduce((s, p) => s + p.value * p.qty, 0);
          return (
            <Card key={payer} className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{payer}</p>
                <Badge tone="success" dot>
                  {L('Ativo', 'Active', '有效', 'Actif')}
                </Badge>
              </div>
              <p className="mt-3 text-2xs font-medium uppercase tracking-wide text-subtle">
                {L('Guia-padrão', 'Standard guide', '标准单据', 'Feuille standard')}
              </p>
              <ul className="mt-1.5 space-y-1 text-sm text-muted">
                {procs.map((p) => (
                  <li key={p.code} className="flex items-center justify-between gap-3">
                    <span className="truncate">{p.description}</span>
                    <span className="tnum shrink-0">{formatCurrency(p.value, locale, 'BRL')}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-hairline pt-2 text-right text-sm font-semibold tnum">
                {formatCurrency(total, locale, 'BRL')}
              </p>
            </Card>
          );
        })}
      </div>
    </ScreenContainer>
  );
}
