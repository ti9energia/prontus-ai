'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Crown } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { openTab, useWorkspace, type ScreenKey } from '@/lib/workspace/store';
import { SCREENS, SCREEN_ORDER, type ScreenGroup } from './registry';
import { useChrome } from './labels';
import { Logo, LogoMark } from '@/components/brand/logo';
import { Tooltip } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

export function AppRail() {
  const t = useTranslations();
  const locale = useLocale();
  const c = useChrome();
  const ws = useWorkspace();

  const activePane = ws.panes.find((p) => p.id === ws.activePaneId) ?? ws.panes[0];
  const activeScreen = activePane?.tabs.find((tb) => tb.id === activePane.activeTabId)?.screen;

  const groups: ScreenGroup[] = ['product', 'clinic', 'system'];
  const title = (key: ScreenKey) => {
    const def = SCREENS[key];
    return def.titleMap?.[locale] ?? (def.titleKey ? t(def.titleKey) : key);
  };

  return (
    <nav className="hidden w-[64px] shrink-0 flex-col items-center border-r border-hairline bg-surface/40 py-3 md:flex">
      <Link href="/app" className="mb-2 grid h-10 w-10 place-items-center">
        <LogoMark size={30} />
      </Link>

      <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto">
        {groups.map((g, gi) => (
          <React.Fragment key={g}>
            {gi > 0 && <div className="my-1.5 h-px w-7 bg-hairline" />}
            {SCREEN_ORDER.filter((k) => SCREENS[k].group === g).map((k) => {
              const Icon = SCREENS[k].icon;
              const active = activeScreen === k;
              return (
                <Tooltip key={k} label={title(k)} side="right">
                  <button
                    onClick={() => openTab(k)}
                    className={cn(
                      'grid h-10 w-10 place-items-center rounded-xl transition-all duration-150',
                      active
                        ? 'bg-brand-600/12 text-brand-600 shadow-xs'
                        : 'text-muted hover:bg-ink/[0.06] hover:text-ink',
                    )}
                    aria-label={title(k)}
                    aria-current={active}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </button>
                </Tooltip>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-2 flex flex-col items-center gap-1 border-t border-hairline pt-2">
        <Tooltip label={c('owner')} side="right">
          <Link
            href="/owner"
            className="grid h-10 w-10 place-items-center rounded-xl text-muted transition-all hover:bg-accent-400/10 hover:text-accent-500"
            aria-label={c('owner')}
          >
            <Crown className="h-[18px] w-[18px]" />
          </Link>
        </Tooltip>
      </div>
    </nav>
  );
}
