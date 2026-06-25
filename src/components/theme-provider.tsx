'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';
const KEY = 'aureon-theme';

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
  const [theme, setThemeState] = React.useState<Theme>('system');
  const [resolved, setResolved] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme) || 'system';
    setThemeState(stored);
    setResolved(applyTheme(stored) as 'light' | 'dark');

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = (localStorage.getItem(KEY) as Theme) || 'system';
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

/** Inline script that sets the theme class before paint to avoid FOUC. */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('${KEY}')||'system';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t==='system'&&d)){document.documentElement.classList.add('dark')}}catch(e){}})();`;
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
