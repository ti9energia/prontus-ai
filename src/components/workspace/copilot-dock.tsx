'use client';

import * as React from 'react';
import { useLocale, useMessages, useTranslations } from 'next-intl';
import { ArrowUp, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Sheet } from '@/components/ui/overlay';
import type { ScreenKey } from '@/lib/workspace/store';
import { cn } from '@/lib/utils';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

function suggestionSet(screen?: ScreenKey): 'today' | 'review' | 'billing' | 'generic' {
  if (screen === 'today') return 'today';
  if (screen === 'review' || screen === 'encounter' || screen === 'tiss') return 'review';
  if (screen === 'billing') return 'billing';
  return 'generic';
}

export function CopilotDock({
  open,
  onClose,
  activeScreen,
}: {
  open: boolean;
  onClose: () => void;
  activeScreen?: ScreenKey;
}) {
  const t = useTranslations('copilot');
  const locale = useLocale();
  const messages = useMessages() as any;

  const [chat, setChat] = React.useState<Msg[]>([{ role: 'assistant', content: t('greeting') }]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const suggestions: string[] = messages?.copilot?.suggestions?.[suggestionSet(activeScreen)] ?? [];

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...chat, { role: 'user' as const, content }];
    setChat(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, locale, screen: activeScreen }),
      });
      const data = await res.json();
      setChat((c) => [...c, { role: 'assistant', content: data.reply ?? '…' }]);
    } catch {
      setChat((c) => [...c, { role: 'assistant', content: '…' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} side="right" className="max-w-[420px]">
      <div className="flex h-full flex-col">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">{t('title')}</p>
              <p className="text-2xs text-muted">{t('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-ink/[0.06] hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {chat.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'rounded-br-md bg-brand-600 text-white'
                    : 'rounded-bl-md bg-ink/[0.05] text-ink',
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-ink/[0.05] px-3.5 py-3">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtle"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* suggestions */}
        {suggestions.length > 0 && (
          <div className="border-t border-hairline px-4 py-2.5">
            <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-subtle">{t('suggestionsTitle')}</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="rounded-full border border-hairline bg-surface px-2.5 py-1 text-2xs text-muted transition-colors hover:border-brand-500/40 hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* input */}
        <div className="border-t border-hairline p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 rounded-xl border border-line bg-surface p-1.5 focus-within:border-brand-500/50 focus-within:ring-4 focus-within:ring-brand-500/10"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder={t('placeholder')}
              className="max-h-28 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-subtle"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white transition-all hover:bg-brand-700 disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 flex items-center gap-1.5 px-1 text-2xs text-subtle">
            <ShieldCheck className="h-3 w-3" /> {t('poweredBy')}
          </p>
        </div>
      </div>
    </Sheet>
  );
}
