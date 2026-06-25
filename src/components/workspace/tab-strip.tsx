'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, X } from 'lucide-react';
import {
  closeTab,
  focusPane,
  openTab,
  setActiveTab,
  type Pane,
  type ScreenKey,
} from '@/lib/workspace/store';
import { SCREENS } from './registry';
import { ScreenMenu } from './launcher';
import { useChrome } from './labels';
import { cn } from '@/lib/utils';

export function TabStrip({
  pane,
  active,
}: {
  pane: Pane;
  active: boolean;
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
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
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
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
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
                aria-label={c('closeTab')}
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
            aria-label={c('newTab')}
          >
            <Plus className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-9 z-[60] animate-scale-in">
              <ScreenMenu onPick={pick} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
