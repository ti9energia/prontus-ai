'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import { focusPane, hydrate, openTab, useWorkspace, type Pane } from '@/lib/workspace';
import { useSession } from '@/lib/auth/client';
import { SCREENS } from './registry';
import { TopBar } from './top-bar';
import { AppRail } from './app-rail';
import { TabStrip } from './tab-strip';
import { CommandPalette } from './command-palette';
import { CopilotDock } from './copilot-dock';
import { ScreenErrorBoundary } from './error-boundary';
import { MariPortrait } from '@/components/brand/mari';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

function PaneHost({ pane }: { pane: Pane }) {
  const tab = pane.tabs.find((t) => t.id === pane.activeTabId) ?? pane.tabs[0];
  if (!tab) return null;
  const def = SCREENS[tab.screen];
  const Comp = def.Component;
  // key by tab id so each tab is an independent mount — switching between two
  // tabs of the same screen never leaks the other tab's (uncontrolled) form state.
  return (
    <ScreenErrorBoundary key={tab.id} resetKey={tab.id}>
      <Comp paneId={pane.id} params={tab.params} />
    </ScreenErrorBoundary>
  );
}

export function Workspace() {
  const ws = useWorkspace();
  const router = useRouter();
  const { loading, authed } = useSession();
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [copilotOpen, setCopilotOpen] = React.useState(false);
  const [railCollapsed, setRailCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      setRailCollapsed(localStorage.getItem('auronis-rail-collapsed') === '1');
    } catch {
      /* noop */
    }
  }, []);

  const toggleRail = () =>
    setRailCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem('auronis-rail-collapsed', next ? '1' : '0');
      } catch {
        /* noop */
      }
      return next;
    });

  React.useEffect(() => {
    hydrate();
  }, []);

  // Honors the PWA manifest shortcuts (?open=encounter, ?open=billing — see
  // src/app/manifest.ts) and any other deep link into a specific tab. Reads
  // window.location directly (not useSearchParams) so this component doesn't
  // need a Suspense boundary just for a one-time read on mount.
  React.useEffect(() => {
    const open = new URLSearchParams(window.location.search).get('open');
    if (open && open in SCREENS) openTab(open as keyof typeof SCREENS);
  }, []);

  // Middleware already gates /app; this is a defensive client redirect.
  React.useEffect(() => {
    if (!loading && !authed) router.replace('/login');
  }, [loading, authed, router]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      } else if (mod && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setCopilotOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activePane = ws.panes.find((p) => p.id === ws.activePaneId) ?? ws.panes[0];
  const activeScreen = activePane?.tabs.find((t) => t.id === activePane.activeTabId)?.screen;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <TopBar
        onOpenCommand={() => setCmdOpen(true)}
        onOpenCopilot={() => setCopilotOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <AppRail collapsed={railCollapsed} onToggle={toggleRail} />
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {ws.panes.map((pane, i) => {
            const isActive = pane.id === ws.activePaneId && ws.panes.length > 1;
            return (
              <section
                key={pane.id}
                onMouseDown={() => focusPane(pane.id)}
                className={cn(
                  'flex min-h-0 min-w-0 flex-1 flex-col',
                  i > 0 && 'border-hairline border-t md:border-l md:border-t-0',
                )}
              >
                <TabStrip pane={pane} active={pane.id === ws.activePaneId} />
                <div
                  className={cn(
                    'relative min-h-0 flex-1 bg-bg transition-shadow',
                    isActive && 'shadow-[inset_0_2px_0_0_rgb(var(--ring)/0.5)]',
                  )}
                >
                  <PaneHost pane={pane} />
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Bottom-right floating button to summon Mari — the classic chat-widget
          spot. Hidden while the dock is open so it never overlaps it. */}
      {!copilotOpen && (
        <button
          type="button"
          onClick={() => setCopilotOpen(true)}
          aria-label={L('Falar com a Mari', 'Talk to Mari', '与 Mari 对话', 'Parler à Mari')}
          title={L('Mari — sua copilota (Ctrl/⌘ J)', 'Mari — your copilot (Ctrl/⌘ J)', 'Mari — 副驾 (Ctrl/⌘ J)', 'Mari — copilote (Ctrl/⌘ J)')}
          className="group fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full border border-brand-500/40 bg-card/90 shadow-lg backdrop-blur transition-all duration-200 ease-spring hover:scale-105 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 sm:bottom-6 sm:right-6"
        >
          <MariPortrait size={42} />
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-brand-500"
          />
        </button>
      )}

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onAskIris={() => {
          setCmdOpen(false);
          setCopilotOpen(true);
        }}
      />
      <CopilotDock
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        activeScreen={activeScreen}
        onNavigate={(s) => openTab(s)}
      />
    </div>
  );
}
