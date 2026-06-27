'use client';

import * as React from 'react';
import { useLocale, useMessages, useTranslations } from 'next-intl';
import { ArrowUp, Mic, ShieldCheck, ThumbsDown, ThumbsUp, Volume2, VolumeX, X } from 'lucide-react';
import { Sheet } from '@/components/ui/overlay';
import { MariPortrait } from '@/components/brand/mari';
import { useSpeech, useSpeechRecognition } from '@/lib/voice';
import type { ScreenKey } from '@/lib/workspace/store';
import { detectNavIntent } from '@/lib/mari/intents';
import { SCREENS } from './registry';
import { toast } from '@/lib/toast';
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
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  activeScreen?: ScreenKey;
  onNavigate?: (screen: ScreenKey) => void;
}) {
  const t = useTranslations('copilot');
  const locale = useLocale();
  const messages = useMessages() as any;
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const [chat, setChat] = React.useState<Msg[]>([{ role: 'assistant', content: t('greeting') }]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [voiceOn, setVoiceOn] = React.useState(false);
  const [feedback, setFeedback] = React.useState<Record<number, 'up' | 'down'>>({});
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { speak, cancel, speaking, supported: ttsSupported } = useSpeech();

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

    // Mari can operate the app — navigate on command instead of just answering.
    const nav = detectNavIntent(content);
    if (nav && onNavigate) {
      onNavigate(nav);
      const label = SCREENS[nav].titleMap?.[locale] ?? nav;
      setChat((c) => [
        ...c,
        { role: 'assistant', content: L(`Abrindo ${label}.`, `Opening ${label}.`, `正在打开 ${label}。`, `Ouverture de ${label}.`) },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, locale, screen: activeScreen }),
      });
      const data = await res.json();
      const reply = data.reply ?? '…';
      setChat((c) => [...c, { role: 'assistant', content: reply }]);
      if (voiceOn) speak(reply, locale);
    } catch {
      setChat((c) => [...c, { role: 'assistant', content: '…' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = (i: number, intent: 'up' | 'down') => {
    setFeedback((f) => ({ ...f, [i]: intent }));
    void fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent, locale, screen: activeScreen, message: chat[i]?.content?.slice(0, 2000) }),
    }).catch(() => {});
    toast.success(
      L('Obrigado pelo feedback', 'Thanks for the feedback', '感谢你的反馈', 'Merci pour votre retour'),
    );
  };

  const { supported: micSupported, listening, start: startMic, stop: stopMic } = useSpeechRecognition({
    locale,
    interimResults: true,
    onResult: (text, isFinal) => {
      setInput(text);
      if (isFinal) {
        stopMic();
        void send(text);
      }
    },
  });

  const toggleMic = () => (listening ? stopMic() : startMic());
  const toggleVoice = () =>
    setVoiceOn((v) => {
      if (v) cancel();
      return !v;
    });

  const statusText = listening
    ? L('Ouvindo…', 'Listening…', '正在聆听…', 'À l’écoute…')
    : speaking
      ? L('Falando…', 'Speaking…', '正在朗读…', 'Réponse vocale…')
      : t('subtitle');

  return (
    <Sheet open={open} onClose={onClose} side="right" className="max-w-[420px]">
      <div className="flex h-full flex-col">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className={cn('relative shrink-0 rounded-full transition-shadow', speaking && 'shadow-glow')}>
              <MariPortrait size={40} />
              {(speaking || listening) && (
                <span className="absolute -bottom-0.5 -right-0.5 flex items-end gap-px rounded-full bg-card px-1 py-0.5 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-[2px] origin-bottom rounded-full bg-brand-500 animate-eq"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">{t('title')}</p>
              <p className="truncate text-2xs text-muted">{statusText}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {ttsSupported && (
              <button
                onClick={toggleVoice}
                className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-ink/[0.06] hover:text-ink"
                aria-pressed={voiceOn}
                aria-label={L('Voz da Mari', 'Mari’s voice', 'Mari 语音', 'Voix de Mari')}
                title={L('Voz da Mari', 'Mari’s voice', 'Mari 语音', 'Voix de Mari')}
              >
                {voiceOn ? <Volume2 className="h-4 w-4 text-brand-600" /> : <VolumeX className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-ink/[0.06] hover:text-ink"
              aria-label={L('Fechar', 'Close', '关闭', 'Fermer')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* messages */}
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          {chat.map((m, i) => (
            <div key={i} className={cn('flex flex-col gap-1', m.role === 'user' ? 'items-end' : 'items-start')}>
              <div className={cn('flex w-full items-end gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'assistant' && <MariPortrait size={26} className="mb-0.5 shrink-0" rim={false} />}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'rounded-br-md bg-brand-600 text-white'
                      : 'rounded-bl-md bg-ink/[0.05] text-ink',
                  )}
                >
                  {m.content}
                </div>
              </div>
              {m.role === 'assistant' && i > 0 && (
                <div className="flex items-center gap-1 pl-8">
                  <FeedbackButton
                    active={feedback[i] === 'up'}
                    onClick={() => sendFeedback(i, 'up')}
                    label={L('Resposta útil', 'Helpful', '有帮助', 'Utile')}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </FeedbackButton>
                  <FeedbackButton
                    active={feedback[i] === 'down'}
                    onClick={() => sendFeedback(i, 'down')}
                    label={L('Resposta ruim', 'Not helpful', '没帮助', 'Pas utile')}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </FeedbackButton>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-end gap-2">
              <MariPortrait size={26} className="mb-0.5 shrink-0" rim={false} />
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
              placeholder={listening ? L('Ouvindo…', 'Listening…', '正在聆听…', 'À l’écoute…') : t('placeholder')}
              className="max-h-28 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-subtle"
            />
            {micSupported && (
              <button
                type="button"
                onClick={toggleMic}
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors',
                  listening
                    ? 'animate-pulse bg-accent-500 text-white'
                    : 'text-muted hover:bg-ink/[0.06] hover:text-ink',
                )}
                aria-pressed={listening}
                aria-label={L('Ditar por voz', 'Dictate by voice', '语音输入', 'Dicter à la voix')}
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white transition-all hover:bg-brand-700 disabled:opacity-40"
              aria-label={t('send')}
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

function FeedbackButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'grid h-6 w-6 place-items-center rounded-md transition-colors',
        active ? 'bg-brand-600/15 text-brand-600' : 'text-subtle hover:bg-ink/[0.06] hover:text-muted',
      )}
    >
      {children}
    </button>
  );
}
