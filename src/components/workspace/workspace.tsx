'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import { focusPane, hydrate, useWorkspace, type Pane } from '@/lib/workspace/store';
import { useSession } from '@/lib/auth';
import { SCREENS } from './registry';
import { TopBar } from './top-bar';
import { AppRail } from './app-rail';
import { TabStrip } from './tab-strip';
import { CommandPalette } from './command-palette';
import { CopilotDock } from './copilot-dock';
import { ScreenErrorBoundary } from './error-boundary';
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
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [copilotOpen, setCopilotOpen] = React.useState(false);
  const [railCollapsed, setRailCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      setRailCollapsed(localStorage.getItem('aureon-rail-collapsed') === '1');
    } catch {
      /* noop */
    }
  }, []);

  const toggleRail = () =>
    setRailCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem('aureon-rail-collapsed', next ? '1' : '0');
      } catch {
        /* noop */
      }
      return next;
    });

  React.useEffect(() => {
    hydrate();
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

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onAskIris={() => {
          setCmdOpen(false);
          setCopilotOpen(true);
        }}
      />
      <CopilotDock open={copilotOpen} onClose={() => setCopilotOpen(false)} activeScreen={activeScreen} />
    </div>
  );
}
