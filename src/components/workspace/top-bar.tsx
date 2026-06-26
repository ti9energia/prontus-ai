'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { LogOut, Menu, Search, Sparkles } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/data/store';
import { openTab } from '@/lib/workspace/store';
import { signOut, useSession } from '@/lib/auth';
import { SCREEN_ORDER } from './registry';
import { ScreenMenu } from './launcher';
import { useChrome } from './labels';
import { Logo } from '@/components/brand/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-provider';
import { Avatar } from '@/components/ui/misc';
import { Kbd } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function TopBar({
  onOpenCommand,
  onOpenCopilot,
}: {
  onOpenCommand: () => void;
  onOpenCopilot: () => void;
}) {
  const t = useTranslations();
  const tr = useTranslations('roles');
  const c = useChrome();
  const router = useRouter();
  const user = getCurrentUser();
  const { role, name: sessionName, email: sessionEmail } = useSession();
  const displayName = sessionName ?? user.name;
  const displayEmail = sessionEmail ?? user.email;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const userRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const doSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-surface/70 px-3 backdrop-blur">
      {/* mobile menu */}
      <div className="relative md:hidden" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-ink/[0.06] hover:text-ink"
          aria-label={t('common.actions.openMenu')}
        >
          <Menu className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="absolute left-0 top-11 z-[60] animate-scale-in">
            <ScreenMenu
              onPick={(s) => {
                setMenuOpen(false);
                openTab(s);
              }}
            />
          </div>
        )}
      </div>
      {/* brand — desktop shows it in the sidebar header, so here it's mobile-only */}
      <Link href="/app" className="mr-1 flex items-center md:hidden" aria-label="Auronis Health">
        <Logo size={26} />
      </Link>

      {/* command trigger */}
      <button
        onClick={onOpenCommand}
        className="group flex h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-line bg-bg/60 px-3 text-sm text-subtle transition-colors hover:border-subtle/40 hover:text-muted"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 truncate text-left">{c('searchPlaceholder')}</span>
        <span className="hidden items-center gap-0.5 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="flex-1 md:flex-none" />

      {/* actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenCopilot}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 px-3 text-sm font-medium text-white shadow-sm transition-all hover:shadow-glow"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">{t('copilot.name')}</span>
        </button>

        <div className="hidden items-center gap-1.5 sm:flex">
          <ThemeSwitcher compact />
          <LanguageSwitcher />
        </div>

        {/* user */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen((o) => !o)}
            aria-label={displayName}
            aria-haspopup="menu"
            aria-expanded={userOpen}
            className="ml-0.5 rounded-full ring-2 ring-transparent transition hover:ring-brand-500/30"
          >
            <Avatar name={displayName} hue={170} size={34} />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-11 z-[60] w-60 overflow-hidden rounded-xl border border-hairline bg-card p-1.5 shadow-xl animate-scale-in">
              <div className="flex items-center gap-2.5 px-2 py-2">
                <Avatar name={displayName} hue={170} size={38} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-2xs text-muted">{displayEmail}</p>
                </div>
              </div>
              <div className="px-2 pb-2">
                <Badge tone="brand">{role === 'owner' ? tr('org_admin') : tr(user.roleKey as 'medico')}</Badge>
                <span className="ml-1.5 text-2xs text-muted">· {user.orgName}</span>
              </div>
              <div className="my-1 h-px bg-hairline" />
              <button
                onClick={() => {
                  setUserOpen(false);
                  openTab('settings');
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-ink/[0.05]"
              >
                <Sparkles className="h-4 w-4 text-muted" /> {t('nav.settings')}
              </button>
              <div className="my-1 h-px bg-hairline sm:hidden" />
              <div className="flex items-center justify-between px-2 py-1 sm:hidden">
                <ThemeSwitcher compact />
                <LanguageSwitcher />
              </div>
              <div className="my-1 h-px bg-hairline" />
              <button
                onClick={doSignOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-danger hover:bg-danger/[0.08]"
              >
                <LogOut className="h-4 w-4" /> {c('signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
