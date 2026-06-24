'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  LayoutTemplate,
  Plus,
  Stethoscope,
  HeartPulse,
  Baby,
  Bone,
  Sun,
  Flower2,
  Pencil,
  Copy,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { listTemplates } from '@/lib/data/store';
import type { NoteSectionKey } from '@/lib/types';
import { ScreenContainer, ScreenHeader } from './_kit';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { cn } from '@/lib/utils';

type SpecTone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const SPEC_VISUAL: Record<string, { icon: LucideIcon; tone: SpecTone }> = {
  clinica: { icon: Stethoscope, tone: 'brand' },
  cardio: { icon: HeartPulse, tone: 'danger' },
  pediatria: { icon: Baby, tone: 'info' },
  ortopedia: { icon: Bone, tone: 'accent' },
  dermato: { icon: Sun, tone: 'warning' },
  gineco: { icon: Flower2, tone: 'success' },
};

const TONE_CLS: Record<SpecTone, string> = {
  brand: 'text-brand-600 bg-brand-600/10',
  accent: 'text-accent-500 bg-accent-400/12',
  success: 'text-success-fg dark:text-success bg-success/12',
  warning: 'text-warning-fg dark:text-warning bg-warning/12',
  danger: 'text-danger-fg dark:text-danger bg-danger/12',
  info: 'text-info-fg dark:text-info bg-info/12',
};

export function TemplatesScreen({ paneId }: { paneId: string }) {
  void paneId;
  const t = useTranslations('templates');
  const tSec = useTranslations('encounter.sections');
  const tc = useTranslations('common');
  void useLocale();

  const templates = listTemplates();

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={LayoutTemplate}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button leftIcon={<Plus className="h-4 w-4" />}>{t('add')}</Button>}
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="h-6 w-6" />}
          title={tc('states.empty')}
          description={t('subtitle')}
          action={<Button leftIcon={<Plus className="h-4 w-4" />}>{t('add')}</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const visual = SPEC_VISUAL[tpl.specialtyKey] ?? { icon: Stethoscope, tone: 'brand' };
            const Icon = visual.icon;
            return (
              <Card key={tpl.id} hover className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                          TONE_CLS[visual.tone],
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-base font-semibold tracking-tight">
                          {t(`specialties.${tpl.specialtyKey}`)}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted">
                          {t('usedIn', { count: tpl.usedCount })}
                        </p>
                      </div>
                    </div>
                    {tpl.isDefault && <Badge tone="brand">{t('default')}</Badge>}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {tpl.sectionKeys.map((key) => (
                      <span
                        key={key}
                        className="inline-flex items-center rounded-md bg-ink/[0.05] px-2 py-1 text-2xs font-medium text-muted"
                      >
                        {tSec(key as NoteSectionKey)}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="flex-wrap gap-2 border-t border-hairline/60 pt-4">
                  <Button size="sm" variant="outline" leftIcon={<Pencil className="h-3.5 w-3.5" />}>
                    {t('edit')}
                  </Button>
                  <Button size="sm" variant="ghost" leftIcon={<Copy className="h-3.5 w-3.5" />}>
                    {t('duplicate')}
                  </Button>
                  {!tpl.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-brand-600 hover:text-brand-700"
                      leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    >
                      {t('setDefault')}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </ScreenContainer>
  );
}
