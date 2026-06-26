'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { openTab, useWorkspace, type ScreenKey } from '@/lib/workspace/store';
import { SCREENS, SCREEN_ORDER, type ScreenGroup } from './registry';
import { useChrome } from './labels';
import { Logo, LogoMark } from '@/components/brand/logo';
import { Tooltip } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

const GROUP_LABEL: Record<ScreenGroup, string> = {
  product: 'nav.product',
  clinic: 'nav.clinic',
  system: 'nav.system',
};

export function AppRail({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
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

  const items = (g: ScreenGroup) => SCREEN_ORDER.filter((k) => SCREENS[k].group === g);

  // Collapsed: a slim icon rail with tooltips. Vertical-only scroll, never sideways.
  if (collapsed) {
    return (
      <nav className="relative z-30 hidden w-[56px] shrink-0 flex-col items-center gap-1 border-r border-hairline bg-surface/40 py-3 md:flex">
        <Link href="/app" className="mb-1 grid h-10 w-10 place-items-center" aria-label="Auronis Health">
          <LogoMark size={26} />
        </Link>
        <div className="flex flex-1 flex-col items-center gap-0.5 overflow-y-auto overflow-x-hidden">
          {groups.map((g, gi) => (
            <React.Fragment key={g}>
              {gi > 0 && <div className="my-1 h-px w-7 bg-hairline" />}
              {items(g).map((k) => {
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
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </button>
                  </Tooltip>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <Tooltip label={c('expandSidebar')} side="right">
          <button
            onClick={onToggle}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
            aria-label={c('expandSidebar')}
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        </Tooltip>
      </nav>
    );
  }

  // Expanded: a labeled sidebar so every destination reads as a name, not a guess.
  return (
    <nav className="relative z-30 hidden w-[236px] shrink-0 flex-col border-r border-hairline bg-surface/40 md:flex">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-3">
        <Link href="/app" className="flex items-center" aria-label="Auronis Health">
          <Logo size={26} />
        </Link>
        <Tooltip label={c('collapseSidebar')} side="bottom">
          <button
            onClick={onToggle}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
            aria-label={c('collapseSidebar')}
          >
            <PanelLeftClose className="h-[18px] w-[18px]" />
          </button>
        </Tooltip>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-1">
        {groups.map((g) => (
          <div key={g} className="mb-1.5 last:mb-0">
            <p className="px-2.5 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-subtle">
              {t(GROUP_LABEL[g])}
            </p>
            <div className="flex flex-col gap-0.5">
              {items(g).map((k) => {
                const Icon = SCREENS[k].icon;
                const active = activeScreen === k;
                return (
                  <button
                    key={k}
                    onClick={() => openTab(k)}
                    className={cn(
                      'group flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-brand-600/12 text-brand-700 dark:text-brand-300'
                        : 'text-muted hover:bg-ink/[0.05] hover:text-ink',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0',
                        active ? 'text-brand-600' : 'text-subtle group-hover:text-muted',
                      )}
                    />
                    <span className="truncate">{title(k)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
