'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CornerDownLeft, Mic, Search, Sparkles } from 'lucide-react';
import { openTab, type ScreenKey } from '@/lib/workspace';
import { isScreenVisible } from '@/lib/workspace';
import { SCREENS, SCREEN_ORDER } from './registry';
import { useChrome } from './labels';
import { Kbd } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

type Item =
  | { kind: 'screen'; key: ScreenKey; label: string; icon: React.ComponentType<{ className?: string }> }
  | { kind: 'action'; id: string; label: string; icon: React.ComponentType<{ className?: string }>; run: () => void };

export function CommandPalette({
  open,
  onClose,
  onAskIris,
}: {
  open: boolean;
  onClose: () => void;
  onAskIris: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const c = useChrome();
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const mounted = useMounted();

  const title = (key: ScreenKey) => {
    const def = SCREENS[key];
    return def.titleMap?.[locale] ?? (def.titleKey ? t(def.titleKey) : key);
  };

  const screenItems: Item[] = SCREEN_ORDER.filter((k) => isScreenVisible(k)).map((k) => ({
    kind: 'screen',
    key: k,
    label: title(k),
    icon: SCREENS[k].icon,
  }));

  const actionItems: Item[] = [
    {
      kind: 'action',
      id: 'new-consult',
      label: c('newConsultation'),
      icon: Mic,
      run: () => openTab('encounter', { id: 'new' }),
    },
    { kind: 'action', id: 'ask-iris', label: c('askIris'), icon: Sparkles, run: onAskIris },
  ];

  const q = query.trim().toLowerCase();
  const filteredScreens = q ? screenItems.filter((i) => i.label.toLowerCase().includes(q)) : screenItems;
  const filteredActions = q ? actionItems.filter((i) => i.label.toLowerCase().includes(q)) : actionItems;
  const flat: Item[] = [...filteredActions, ...filteredScreens];

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  React.useEffect(() => setActive(0), [query]);

  const run = (item: Item) => {
    if (item.kind === 'screen') openTab(item.key);
    else item.run();
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(flat.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[active]) run(flat[active]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!mounted || !open) return null;

  let idx = -1;
  const renderItem = (item: Item) => {
    idx += 1;
    const myIdx = idx;
    const Icon = item.icon;
    return (
      <button
        key={item.kind === 'screen' ? `s-${item.key}` : `a-${item.id}`}
        onMouseEnter={() => setActive(myIdx)}
        onClick={() => run(item)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
          active === myIdx ? 'bg-brand-600/10 text-ink' : 'text-ink/90 hover:bg-ink/[0.04]',
        )}
      >
        <span
          className={cn(
            'grid h-7 w-7 place-items-center rounded-md',
            active === myIdx ? 'bg-brand-600/15 text-brand-600' : 'bg-ink/[0.05] text-muted',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1">{item.label}</span>
        {active === myIdx && <ArrowRight className="h-3.5 w-3.5 text-brand-600" />}
      </button>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-hairline bg-card shadow-xl animate-scale-in"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-hairline px-4">
          <Search className="h-4.5 w-4.5 text-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={c('searchPlaceholder')}
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-subtle"
          />
          <Kbd>ESC</Kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {flat.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted">{c('noResults')}</p>
          )}
          {filteredActions.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wide text-subtle">{c('actions')}</p>
              {filteredActions.map(renderItem)}
            </>
          )}
          {filteredScreens.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-3 text-2xs font-semibold uppercase tracking-wide text-subtle">{c('navigate')}</p>
              {filteredScreens.map(renderItem)}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-hairline px-4 py-2.5 text-2xs text-subtle">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
          </span>
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="h-3 w-3" /> {t('common.actions.continue')}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function useMounted() {
  const [m, setM] = React.useState(false);
  React.useEffect(() => setM(true), []);
  return m;
}
