'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Building2,
  Crown,
  Flag,
  KeyRound,
  LayoutDashboard,
  MessageCircle,
  PencilRuler,
  ScrollText,
  Sparkles,
  Tags,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useSession } from '@/lib/auth';
import { useRouter } from '@/i18n/routing';
import { OwnerProvider, useOwner } from './context';
import {
  OverviewSection,
  TenantsSection,
  PlansSection,
  LandingSection,
  FlagsSection,
  AiSection,
  WhatsappSection,
  AccessSection,
  AuditSection,
} from './sections';
import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

type SectionKey =
  | 'overview'
  | 'tenants'
  | 'plans'
  | 'landing'
  | 'flags'
  | 'ai'
  | 'whatsapp'
  | 'access'
  | 'audit';

const NAV: { key: SectionKey; icon: LucideIcon; Component: React.ComponentType }[] = [
  { key: 'overview', icon: LayoutDashboard, Component: OverviewSection },
  { key: 'tenants', icon: Building2, Component: TenantsSection },
  { key: 'plans', icon: Tags, Component: PlansSection },
  { key: 'landing', icon: PencilRuler, Component: LandingSection },
  { key: 'flags', icon: Flag, Component: FlagsSection },
  { key: 'ai', icon: Sparkles, Component: AiSection },
  { key: 'whatsapp', icon: MessageCircle, Component: WhatsappSection },
  { key: 'access', icon: KeyRound, Component: AccessSection },
  { key: 'audit', icon: ScrollText, Component: AuditSection },
];

function ImpersonationBanner() {
  const { impersonating, setImpersonating } = useOwner();
  const t = useTranslations('owner.tenants');
  if (!impersonating) return null;
  return (
    <div className="flex items-center justify-center gap-3 bg-accent-500 px-4 py-2 text-sm font-medium text-white">
      <span>{t('impersonating', { tenant: impersonating })}</span>
      <button
        onClick={() => setImpersonating(null)}
        className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
      >
        <X className="h-3 w-3" /> {t('exitImpersonation')}
      </button>
    </div>
  );
}

function Shell() {
  const t = useTranslations('owner');
  const tn = useTranslations('nav');
  const router = useRouter();
  const { loading, authed, role } = useSession();
  const [section, setSection] = React.useState<SectionKey>('overview');

  // Middleware enforces owner-only access; this mirrors it client-side.
  React.useEffect(() => {
    if (!loading && (!authed || role !== 'owner')) router.replace('/login');
  }, [loading, authed, role, router]);

  const Active = NAV.find((n) => n.key === section)?.Component ?? OverviewSection;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <ImpersonationBanner />
      {/* topbar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-hairline bg-surface/70 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Logo size={26} />
          <Badge tone="accent" className="gap-1">
            <Crown className="h-3 w-3" /> {t('platformBadge')}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              <span className="hidden sm:inline">{tn('backToProduct')}</span>
            </Button>
          </Link>
          <ThemeToggle compact />
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-surface/40 p-3 md:flex">
          <p className="px-2 pb-2 pt-1 text-2xs font-semibold uppercase tracking-wide text-subtle">
            {t('title')}
          </p>
          <nav className="flex flex-col gap-0.5">
            {NAV.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  section === key
                    ? 'bg-brand-600/12 font-medium text-brand-700 dark:text-brand-300'
                    : 'text-muted hover:bg-ink/[0.05] hover:text-ink',
                )}
              >
                <Icon className="h-4 w-4" />
                {t(`nav.${key}` as 'nav.overview')}
              </button>
            ))}
          </nav>
        </aside>

        {/* mobile section selector */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mask-x flex items-center gap-1 overflow-x-auto border-b border-hairline bg-surface/40 px-2 py-1.5 md:hidden">
            {NAV.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm',
                  section === key ? 'bg-brand-600/12 text-brand-700 dark:text-brand-300' : 'text-muted',
                )}
              >
                <Icon className="h-4 w-4" />
                {t(`nav.${key}` as 'nav.overview')}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <Active />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OwnerPanel() {
  return (
    <OwnerProvider>
      <Shell />
    </OwnerProvider>
  );
}
