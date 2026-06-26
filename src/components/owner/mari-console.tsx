'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import {
  AlertTriangle,
  ArrowUp,
  ArrowUpRight,
  Lightbulb,
  Megaphone,
  Mic,
  Radio,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from 'lucide-react';
import { ownerInsights } from '@/lib/data/store';
import { useSpeech, useSpeechRecognition } from '@/lib/voice';
import { MariPortrait, MariPresence, type MariState } from '@/components/brand/mari';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

function useMounted() {
  const [m, setM] = React.useState(false);
  React.useEffect(() => setM(true), []);
  return m;
}

/* ------------------------------ message list ------------------------------ */
function MessageList({ items, loading }: { items: Msg[]; loading: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [items, loading]);
  return (
    <div ref={ref} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      {items.map((m, i) => (
        <div key={i} className={cn('flex items-end gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
          {m.role === 'assistant' && <MariPortrait size={24} rim={false} className="mb-0.5 shrink-0" />}
          <div
            className={cn(
              'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
              m.role === 'user' ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-ink/[0.05] text-ink',
            )}
          >
            {m.content}
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex items-end gap-2">
          <MariPortrait size={24} rim={false} className="mb-0.5 shrink-0" />
          <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-ink/[0.05] px-3 py-2.5">
            {[0, 1, 2].map((d) => (
              <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtle" style={{ animationDelay: `${d * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ input row ------------------------------ */
function InputRow({
  value,
  onChange,
  onSend,
  micSupported,
  listening,
  onMic,
  placeholder,
  micLabel,
  sendLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  micSupported: boolean;
  listening: boolean;
  onMic: () => void;
  placeholder: string;
  micLabel: string;
  sendLabel: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className="flex items-end gap-2 border-t border-hairline p-3"
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 placeholder:text-subtle"
      />
      {micSupported && (
        <button
          type="button"
          onClick={onMic}
          aria-pressed={listening}
          aria-label={micLabel}
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors',
            listening ? 'animate-pulse bg-accent-500 text-white' : 'text-muted hover:bg-ink/[0.06] hover:text-ink',
          )}
        >
          <Mic className="h-4 w-4" />
        </button>
      )}
      <button
        type="submit"
        disabled={!value.trim()}
        aria-label={sendLabel}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-white transition-all hover:bg-brand-700 disabled:opacity-40"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </form>
  );
}

/* ============================== console ============================== */
export function MariConsoleSection() {
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const ins = ownerInsights();
  const mounted = useMounted();

  const greeting = L(
    'Oi! Sou a Mari, o cérebro da operação. Vejo seus dados — MRR, churn, uso e tenants. Posso trazer riscos, oportunidades e o que melhorar. Por onde começamos?',
    "Hi! I'm Mari, your operating brain. I can see your data — MRR, churn, usage and tenants. I'll surface risks, opportunities and what to improve. Where do we start?",
    '你好！我是 Mari，运营大脑。我能看到你的数据——MRR、流失、使用情况和租户。我可以指出风险、机会和改进点。我们从哪里开始？',
    "Bonjour ! Je suis Mari, le cerveau des opérations. Je vois vos données — MRR, churn, usage et tenants. Je remonte risques, opportunités et améliorations. On commence par quoi ?",
  );

  const [chat, setChat] = React.useState<Msg[]>([{ role: 'assistant', content: greeting }]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [voiceOn, setVoiceOn] = React.useState(false);
  const [meeting, setMeeting] = React.useState(false);

  const { speak, cancel, speaking } = useSpeech();

  const send = React.useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content) return;
      setChat((c) => [...c, { role: 'user', content }]);
      setInput('');
      setLoading(true);
      try {
        const history = [...chat, { role: 'user' as const, content }].slice(-20);
        const res = await fetch('/api/owner/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, locale }),
        });
        const data = await res.json();
        const reply = data.reply ?? '…';
        setChat((c) => [...c, { role: 'assistant', content: reply }]);
        if (voiceOn || meeting) speak(reply, locale);
      } catch {
        setChat((c) => [...c, { role: 'assistant', content: '…' }]);
      } finally {
        setLoading(false);
      }
    },
    [chat, locale, voiceOn, meeting, speak],
  );

  const { supported: micSupported, listening, start, stop } = useSpeechRecognition({
    locale,
    interimResults: true,
    onResult: (text, isFinal) => {
      setInput(text);
      if (isFinal) {
        stop();
        void send(text);
      }
    },
  });

  // Meeting loop: listen when idle, pause mic while thinking/speaking (no echo).
  React.useEffect(() => {
    if (!meeting) return;
    if (speaking || loading) {
      if (listening) stop();
      return;
    }
    if (!listening) start();
  }, [meeting, speaking, loading, listening, start, stop]);

  const toggleVoice = () =>
    setVoiceOn((v) => {
      if (v) cancel();
      return !v;
    });
  const toggleMic = () => (listening ? stop() : start());
  const startMeeting = () => {
    setMeeting(true);
    setVoiceOn(true);
  };
  const endMeeting = () => {
    setMeeting(false);
    stop();
    cancel();
  };

  const presence: MariState = speaking ? 'speaking' : listening ? 'listening' : loading ? 'thinking' : 'idle';
  const statusText = speaking
    ? L('Falando…', 'Speaking…', '正在朗读…', 'Réponse vocale…')
    : listening
      ? L('Ouvindo…', 'Listening…', '正在聆听…', 'À l’écoute…')
      : loading
        ? L('Pensando…', 'Thinking…', '正在思考…', 'Réflexion…')
        : L('Cérebro da operação', 'Operating brain', '运营大脑', 'Cerveau des opérations');

  const cards: { icon: LucideIcon; tone: string; label: string; value: string; prompt: string }[] = [
    {
      icon: TrendingUp,
      tone: 'text-brand-600',
      label: L('Crescimento', 'Growth', '增长', 'Croissance'),
      value: `${formatCurrency(ins.stats.mrr, locale, ins.stats.currency)} · +${formatPercent(ins.stats.mrrGrowth, locale, 1)}`,
      prompt: L('Como está o crescimento e o MRR?', 'How is growth and MRR?', '增长和 MRR 如何？', 'Comment vont la croissance et le MRR ?'),
    },
    {
      icon: AlertTriangle,
      tone: 'text-danger',
      label: L('Risco de churn', 'Churn risk', '流失风险', 'Risque de churn'),
      value: `${formatPercent(ins.stats.churn, locale, 1)} · ${ins.atRisk.length} ${L('em risco', 'at risk', '风险', 'à risque')}`,
      prompt: L('Quais contas estão em risco e como salvar?', 'Which accounts are at risk and how to save them?', '哪些客户有风险，如何挽留？', 'Quels comptes sont à risque et comment les sauver ?'),
    },
    {
      icon: ArrowUpRight,
      tone: 'text-success',
      label: L('Upsell', 'Upsell', '追加销售', 'Upsell'),
      value: `${ins.upsell.length} ${L('contas', 'accounts', '个客户', 'comptes')}`,
      prompt: L('Onde estão as melhores oportunidades de upsell?', 'Where are the best upsell opportunities?', '最佳追加销售机会在哪里？', 'Où sont les meilleures opportunités d’upsell ?'),
    },
    {
      icon: Lightbulb,
      tone: 'text-accent-500',
      label: L('Melhorar', 'Improve', '改进', 'Améliorer'),
      value: L('Produto & retenção', 'Product & retention', '产品与留存', 'Produit & rétention'),
      prompt: L('O que melhorar no produto para reter mais?', 'What to improve in the product to retain more?', '产品上改进什么以提升留存？', 'Quoi améliorer dans le produit pour mieux retenir ?'),
    },
    {
      icon: Megaphone,
      tone: 'text-brand-600',
      label: L('Vender', 'Sell', '销售', 'Vendre'),
      value: L('Pitch & ROI', 'Pitch & ROI', '话术与 ROI', 'Pitch & ROI'),
      prompt: L('Como vender mais rápido?', 'How to sell faster?', '如何更快成交？', 'Comment vendre plus vite ?'),
    },
  ];

  const meetingBadge = L('Reunião ao vivo', 'Live meeting', '实时会议', 'Réunion en direct');

  const chatPanel = (caption?: boolean) => (
    <>
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
        <MariPortrait size={28} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{caption ? L('Legenda', 'Captions', '字幕', 'Sous-titres') : 'Mari'}</p>
          <p className="truncate text-2xs text-muted">{statusText}</p>
        </div>
      </div>
      <MessageList items={chat} loading={loading} />
      <InputRow
        value={input}
        onChange={setInput}
        onSend={() => send(input)}
        micSupported={micSupported}
        listening={listening}
        onMic={toggleMic}
        placeholder={L('Pergunte à Mari…', 'Ask Mari…', '问 Mari…', 'Demandez à Mari…')}
        micLabel={L('Ditar por voz', 'Dictate by voice', '语音输入', 'Dicter à la voix')}
        sendLabel={L('Enviar', 'Send', '发送', 'Envoyer')}
      />
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      {/* stage */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-grid [background-size:44px_44px]">
        <div className="bg-aurora pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex flex-col items-center gap-5 px-6 py-8">
          <MariPresence size={180} state={presence} />
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight">Mari</h2>
            <p className="mt-0.5 text-sm text-muted">{statusText}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={startMeeting} leftIcon={<Radio className="h-4 w-4" />}>
              {L('Modo reunião', 'Meeting mode', '会议模式', 'Mode réunion')}
            </Button>
            <Button variant="outline" onClick={toggleVoice} leftIcon={voiceOn ? <Volume2 className="h-4 w-4 text-brand-600" /> : <VolumeX className="h-4 w-4" />}>
              {voiceOn ? L('Voz ligada', 'Voice on', '语音开', 'Voix activée') : L('Voz desligada', 'Voice off', '语音关', 'Voix coupée')}
            </Button>
          </div>

          <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
            {cards.map((card) => (
              <button
                key={card.label}
                onClick={() => send(card.prompt)}
                disabled={loading}
                className="group flex flex-col gap-1.5 rounded-xl border border-hairline bg-card/70 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md disabled:opacity-60"
              >
                <card.icon className={cn('h-4 w-4', card.tone)} />
                <span className="text-2xs font-medium uppercase tracking-wide text-subtle">{card.label}</span>
                <span className="text-sm font-semibold leading-tight">{card.value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* docked side chat */}
      <aside className="flex min-h-0 w-full shrink-0 flex-col border-t border-hairline bg-surface/30 lg:h-full lg:w-[380px] lg:border-l lg:border-t-0">
        {chatPanel(false)}
      </aside>

      {/* fullscreen meeting */}
      {meeting &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex flex-col bg-bg/95 backdrop-blur-xl lg:flex-row">
            <div className="relative flex flex-1 flex-col items-center justify-center gap-6 p-8">
              <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-accent-500/15 px-3 py-1 text-xs font-medium text-accent-600">
                <Radio className="h-3.5 w-3.5 animate-pulse" /> {meetingBadge}
              </span>
              <MariPresence size={320} state={presence} className="max-w-[80vw]" />
              <div className="text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight">Mari</h2>
                <p className="mt-1 text-muted">{statusText}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {micSupported && (
                  <Button
                    variant={listening ? 'primary' : 'outline'}
                    onClick={() => {
                      cancel();
                      if (!listening) start();
                    }}
                    leftIcon={<Mic className="h-4 w-4" />}
                  >
                    {listening ? L('Ouvindo', 'Listening', '聆听中', 'À l’écoute') : L('Falar', 'Talk', '说话', 'Parler')}
                  </Button>
                )}
                <Button variant="outline" onClick={toggleVoice} leftIcon={voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}>
                  {voiceOn ? L('Voz', 'Voice', '语音', 'Voix') : L('Mudo', 'Muted', '静音', 'Muet')}
                </Button>
                <Button variant="danger" onClick={endMeeting} leftIcon={<X className="h-4 w-4" />}>
                  {L('Encerrar', 'End', '结束', 'Terminer')}
                </Button>
              </div>
              {!micSupported && (
                <p className="max-w-sm text-center text-2xs text-subtle">
                  {L(
                    'Reconhecimento de voz não suportado neste navegador — use o chat ao lado.',
                    'Speech recognition is not supported in this browser — use the chat panel.',
                    '此浏览器不支持语音识别——请使用侧边聊天。',
                    'Reconnaissance vocale non prise en charge — utilisez le panneau de chat.',
                  )}
                </p>
              )}
            </div>
            <aside className="flex h-[42vh] min-h-0 w-full flex-col border-t border-hairline bg-card/70 lg:h-auto lg:w-[400px] lg:border-l lg:border-t-0">
              {chatPanel(true)}
            </aside>
          </div>,
          document.body,
        )}
    </div>
  );
}
