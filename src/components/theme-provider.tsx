'use client';

import * as React from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';
const KEY = 'auronis-theme';

const ThemeCtx = React.createContext<{
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}>({ theme: 'system', resolved: 'light', setTheme: () => {} });

export function applyTheme(theme: Theme) {
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && sysDark);
  document.documentElement.classList.toggle('dark', dark);
  return dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('dark');
  const [resolved, setResolved] = React.useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme) || 'dark';
    setThemeState(stored);
    setResolved(applyTheme(stored) as 'light' | 'dark');

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = (localStorage.getItem(KEY) as Theme) || 'dark';
      if (current === 'system') setResolved(applyTheme('system') as 'light' | 'dark');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    localStorage.setItem(KEY, t);
    setThemeState(t);
    setResolved(applyTheme(t) as 'light' | 'dark');
  }, []);

  return <ThemeCtx.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => React.useContext(ThemeCtx);

/** Theme picker as a dropdown — same pattern as the LanguageSwitcher (button → list). */
export function ThemeSwitcher({ align = 'end', compact }: { align?: 'start' | 'end'; compact?: boolean }) {
  const { theme, resolved, setTheme } = useTheme();
  const t = useTranslations('common.theme');
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const opts: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="h-4 w-4" />, label: t('light') },
    { value: 'dark', icon: <Moon className="h-4 w-4" />, label: t('dark') },
    { value: 'system', icon: <Monitor className="h-4 w-4" />, label: t('system') },
  ];
  const TriggerIcon = theme === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun;

  const choose = (val: Theme) => {
    setOpen(false);
    setTheme(val);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md border border-line bg-surface px-2.5 text-sm text-muted transition-colors hover:text-ink',
          compact ? 'h-8 w-8' : 'h-9',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('label')}
      >
        <TriggerIcon className="h-4 w-4" />
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-40 overflow-hidden rounded-xl border border-hairline bg-card p-1 shadow-lg animate-scale-in',
            align === 'end' ? 'right-0' : 'left-0',
          )}
          role="listbox"
        >
          {opts.map((o) => (
            <button
              key={o.value}
              onClick={() => choose(o.value)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-ink/[0.05]',
                o.value === theme && 'bg-brand-600/[0.08]',
              )}
              role="option"
              aria-selected={o.value === theme}
            >
              <span className="flex items-center gap-2.5">
                <span className={cn(o.value === theme ? 'text-brand-600' : 'text-muted')}>{o.icon}</span>
                <span className={cn(o.value === theme && 'font-medium text-brand-700 dark:text-brand-300')}>
                  {o.label}
                </span>
              </span>
              {o.value === theme && <Check className="h-4 w-4 text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Inline script that sets the theme class before paint to avoid FOUC. */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('${KEY}')||'dark';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t==='system'&&d)){document.documentElement.classList.add('dark')}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('common.theme');
  const opts: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="h-4 w-4" />, label: t('light') },
    { value: 'dark', icon: <Moon className="h-4 w-4" />, label: t('dark') },
    { value: 'system', icon: <Monitor className="h-4 w-4" />, label: t('system') },
  ];

  if (compact) {
    return (
      <div className="inline-flex rounded-lg bg-ink/[0.05] p-0.5">
        {opts.map((o) => (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            aria-label={o.label}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-md transition-all',
              theme === o.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {o.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => setTheme(o.value)}
          className={cn(
            'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
            theme === o.value ? 'bg-brand-600/10 text-brand-700 dark:text-brand-300' : 'hover:bg-ink/[0.05]',
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
