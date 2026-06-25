'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Columns2, Plus, X } from 'lucide-react';
import {
  closePane,
  closeTab,
  focusPane,
  openTab,
  setActiveTab,
  splitActivePane,
  MAX_WORKSPACE_PANES,
  type Pane,
  type ScreenKey,
} from '@/lib/workspace/store';
import { SCREENS } from './registry';
import { ScreenMenu } from './launcher';
import { useChrome } from './labels';
import { Tooltip } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

export function TabStrip({
  pane,
  active,
  paneCount,
}: {
  pane: Pane;
  active: boolean;
  paneCount: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const c = useChrome();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const title = (key: ScreenKey) => {
    const def = SCREENS[key];
    return def.titleMap?.[locale] ?? (def.titleKey ? t(def.titleKey) : key);
  };

  const pick = (screen: ScreenKey) => {
    setMenuOpen(false);
    openTab(screen, undefined, { paneId: pane.id });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 border-b border-hairline bg-surface/60 px-1.5 py-1.5 backdrop-blur transition-colors',
        active ? 'bg-surface/80' : '',
      )}
      onMouseDown={() => !active && focusPane(pane.id)}
    >
      {/* tabs */}
      <div className="mask-x flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {pane.tabs.map((tab) => {
          const def = SCREENS[tab.screen];
          const Icon = def.icon;
          const isActive = tab.id === pane.activeTabId;
          return (
            <div
              key={tab.id}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(pane.id, tab.id);
                }
              }}
              onClick={() => setActiveTab(pane.id, tab.id)}
              className={cn(
                'group/tab flex h-8 max-w-[180px] shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm transition-all duration-150',
                isActive
                  ? 'bg-card text-ink shadow-xs ring-1 ring-hairline'
                  : 'text-muted hover:bg-ink/[0.05] hover:text-ink',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive && 'text-brand-600')} />
              <span className="truncate">{title(tab.screen)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(pane.id, tab.id);
                }}
                className={cn(
                  'grid h-4 w-4 shrink-0 place-items-center rounded transition-all hover:bg-ink/[0.12]',
                  isActive ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover/tab:opacity-60 hover:!opacity-100',
                )}
                aria-label="close tab"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {/* new tab */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
            aria-label="new tab"
          >
            <Plus className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-9 z-50 animate-scale-in">
              <ScreenMenu onPick={pick} />
            </div>
          )}
        </div>
      </div>

      {/* pane actions */}
      <div className="flex shrink-0 items-center gap-0.5 pl-1">
        {paneCount < MAX_WORKSPACE_PANES && (
          <Tooltip label={c('split')} side="bottom">
            <button
              onClick={() => {
                focusPane(pane.id);
                splitActivePane();
              }}
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-hairline bg-bg/40 px-2 text-2xs font-medium text-muted transition-colors hover:border-brand-500/40 hover:bg-ink/[0.04] hover:text-ink"
              aria-label={c('split')}
            >
              <Columns2 className="h-4 w-4" />
              <span className="hidden lg:inline">{c('split')}</span>
            </button>
          </Tooltip>
        )}
        {paneCount > 1 && (
          <Tooltip label={c('closePane')} side="bottom">
            <button
              onClick={() => closePane(pane.id)}
              className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-danger/10 hover:text-danger"
              aria-label="close pane"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
