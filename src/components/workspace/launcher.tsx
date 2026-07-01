'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SCREENS, SCREEN_ORDER, type ScreenGroup } from './registry';
import type { ScreenKey } from '@/lib/workspace';
import { cn } from '@/lib/utils';

const GROUP_LABEL: Record<ScreenGroup, string> = {
  product: 'nav.product',
  clinic: 'nav.clinic',
  system: 'nav.system',
};

export function ScreenMenu({
  onPick,
  className,
}: {
  onPick: (screen: ScreenKey) => void;
  className?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const groups: ScreenGroup[] = ['product', 'clinic', 'system'];

  const title = (key: ScreenKey) => {
    const def = SCREENS[key];
    return def.titleMap?.[locale] ?? (def.titleKey ? t(def.titleKey) : key);
  };

  return (
    <div className={cn('w-60 overflow-hidden rounded-xl border border-hairline bg-card p-1.5 shadow-lg', className)}>
      {groups.map((g) => {
        const items = SCREEN_ORDER.filter((k) => SCREENS[k].group === g);
        return (
          <div key={g} className="mb-1 last:mb-0">
            <p className="px-2 py-1 text-2xs font-semibold uppercase tracking-wide text-subtle">{t(GROUP_LABEL[g])}</p>
            {items.map((k) => {
              const Icon = SCREENS[k].icon;
              return (
                <button
                  key={k}
                  onClick={() => onPick(k)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-ink/[0.06]"
                >
                  <Icon className="h-4 w-4 text-muted" />
                  <span>{title(k)}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
