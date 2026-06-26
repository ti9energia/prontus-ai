'use client';

import * as React from 'react';
import { useLocale, useTranslations, useMessages } from 'next-intl';
import {
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  CheckCheck,
  ShieldCheck,
  Smartphone,
  Lightbulb,
} from 'lucide-react';
import { type Locale } from '@/i18n/routing';
import { ScreenContainer, ScreenHeader } from './_kit';
import { Avatar, Switch, IconButton } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { cn, formatTime } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface Message {
  id: number;
  role: 'in' | 'out';
  text: string;
  at: Date;
}

/* Per-locale copy with no existing i18n key. */
const COPY: Record<string, Record<Locale, string>> = {
  online: {
    'pt-BR': 'online',
    en: 'online',
    'zh-CN': '在线',
    'fr-FR': 'en ligne',
  },
  numberCopied: {
    'pt-BR': 'Número copiado',
    en: 'Number copied',
    'zh-CN': '号码已复制',
    'fr-FR': 'Numéro copié',
  },
  config: {
    'pt-BR': 'Configuração do canal',
    en: 'Channel setup',
    'zh-CN': '通道设置',
    'fr-FR': 'Configuration du canal',
  },
  numberHint: {
    'pt-BR': 'Use o formato internacional, ex.: +55 11 99000-0000.',
    en: 'Use the international format, e.g. +55 11 99000-0000.',
    'zh-CN': '请使用国际格式，例如 +55 11 99000-0000。',
    'fr-FR': 'Utilisez le format international, ex. : +55 11 99000-0000.',
  },
  greeting: {
    'pt-BR': 'Oi! Sou a Mari no WhatsApp. Me peça suas guias, agenda ou minutos economizados — eu puxo e ajo, sempre com a sua confirmação.',
    en: 'Hi! I’m Mari on WhatsApp. Ask me for your guides, schedule or saved minutes — I pull data and act, always with your confirmation.',
    'zh-CN': '你好！我是 WhatsApp 上的 Mari。向我索取您的表单、日程或节省的时间——我会提取数据并执行操作，始终需要您的确认。',
    'fr-FR': 'Bonjour ! Je suis Mari sur WhatsApp. Demandez-moi vos guides, votre agenda ou vos minutes gagnées — j’extrais les données et j’agis, toujours avec votre confirmation.',
  },
  replyGeneric: {
    'pt-BR': 'Entendi. Já estou puxando isso do sistema e te trago o resumo em segundos.',
    en: 'Got it. I’m pulling that from the system and will bring you the summary in seconds.',
    'zh-CN': '明白了。我正在从系统中提取信息，几秒钟后给您摘要。',
    'fr-FR': 'Compris. Je récupère cela dans le système et je vous apporte le résumé en quelques secondes.',
  },
  replyGloss: {
    'pt-BR': 'Encontrei 3 guias glosadas esta semana, somando R$ 780. A maior é a do paciente João Pedro (R$ 420) por código incompatível. Quer que eu corrija e reenvie?',
    en: 'I found 3 denied guides this week, totaling R$ 780. The largest is patient João Pedro’s (R$ 420) for a code mismatch. Want me to fix and resubmit it?',
    'zh-CN': '本周我发现 3 份被拒付的表单，共计 R$ 780。金额最大的是患者 João Pedro 的（R$ 420），原因是编码不匹配。需要我修正并重新提交吗？',
    'fr-FR': 'J’ai trouvé 3 guides rejetés cette semaine, pour un total de 780 R$. Le plus important est celui du patient João Pedro (420 R$) pour un code incompatible. Voulez-vous que je le corrige et le renvoie ?',
  },
  replyConfirm: {
    'pt-BR': 'Perfeito! Guia corrigida e reenviada à operadora. Te aviso assim que houver retorno. ✅',
    en: 'Perfect! Guide fixed and resubmitted to the payer. I’ll let you know as soon as there’s a reply. ✅',
    'zh-CN': '完美！表单已修正并重新提交给付款方。一有回复我就通知您。✅',
    'fr-FR': 'Parfait ! Guide corrigé et renvoyé à l’assureur. Je vous préviens dès qu’il y a une réponse. ✅',
  },
};

function localized(key: keyof typeof COPY, locale: string) {
  return COPY[key][(locale as Locale)] ?? COPY[key]['pt-BR'];
}

function cannedReply(userText: string, locale: string): string {
  const lc = userText.toLowerCase();
  if (
    /glos|denied|gloss|reembol|reenv|resubmit|sim\b|yes\b|拒|rejet/.test(lc)
  ) {
    if (/sim\b|yes\b|确认|oui\b|reenv|resubmit/.test(lc)) return localized('replyConfirm', locale);
    return localized('replyGloss', locale);
  }
  return localized('replyGeneric', locale);
}

export function WhatsappScreen({ paneId }: { paneId: string }) {
  void paneId;
  const t = useTranslations('whatsapp');
  const tcop = useTranslations('copilot');
  const locale = useLocale();
  const messages = useMessages() as Record<string, { examples?: string[] }>;
  const examples = (messages.whatsapp?.examples as string[]) ?? [];
  const personaName = tcop('name');

  const [linked, setLinked] = React.useState(false);
  const [proactive, setProactive] = React.useState(true);
  const [number, setNumber] = React.useState('+55 11 99000-0000');
  const [draft, setDraft] = React.useState('');
  const seq = React.useRef(2);

  const [thread, setThread] = React.useState<Message[]>(() => [
    { id: 1, role: 'in', text: localized('greeting', locale), at: new Date() },
  ]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const replyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [thread]);

  React.useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, []);

  const sendMessage = React.useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      const outId = seq.current++;
      setThread((prev) => [...prev, { id: outId, role: 'out', text: clean, at: new Date() }]);
      setDraft('');
      if (replyTimer.current) clearTimeout(replyTimer.current);
      replyTimer.current = setTimeout(() => {
        setThread((prev) => [
          ...prev,
          { id: seq.current++, role: 'in', text: cannedReply(clean, locale), at: new Date() },
        ]);
      }, 700);
    },
    [locale],
  );

  return (
    <ScreenContainer>
      <ScreenHeader icon={MessageCircle} title={t('title')} subtitle={t('subtitle')} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* LEFT — config */}
        <div className="flex flex-col gap-5">
          <section className="overflow-hidden rounded-xl border border-hairline bg-card shadow-xs">
            <header className="border-b border-hairline px-5 py-4">
              <h2 className="font-display text-base font-semibold tracking-tight">
                {localized('config', locale)}
              </h2>
            </header>
            <div className="flex flex-col gap-5 p-5">
              {/* persona */}
              <div>
                <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-subtle">
                  {t('persona')}
                </p>
                <div className="flex items-center gap-3.5 rounded-xl border border-hairline bg-surface/60 p-3.5">
                  <Avatar name={personaName} hue={172} size={48} />
                  <div className="min-w-0">
                    <p className="font-medium text-ink/90">{personaName}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                      {tcop('subtitle')}
                    </p>
                  </div>
                </div>
              </div>

              {/* number */}
              <Field label={t('number')} hint={localized('numberHint', locale)}>
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <div className="relative flex-1">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                    <Input
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      disabled={linked}
                      className="pl-9 font-mono"
                      inputMode="tel"
                    />
                  </div>
                  {linked ? (
                    <Badge tone="success" dot className="h-10 justify-center px-4 sm:w-32">
                      {t('linked')}
                    </Badge>
                  ) : (
                    <Button
                      leftIcon={<Smartphone className="h-4 w-4" />}
                      onClick={() => setLinked(true)}
                      className="sm:w-auto"
                    >
                      {t('linkNumber')}
                    </Button>
                  )}
                </div>
              </Field>

              {linked && (
                <button
                  type="button"
                  onClick={() => setLinked(false)}
                  className="-mt-2 self-start text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  {t('verify')}
                </button>
              )}

              {/* proactive */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface/60 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600/10 text-brand-600">
                    <Sparkles className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink/90">{t('proactive')}</p>
                    <p className="mt-0.5 text-xs text-muted">{t('consent')}</p>
                  </div>
                </div>
                <Switch checked={proactive} onChange={setProactive} aria-label={t('proactive')} />
              </div>

              {/* consent note */}
              <div className="flex items-start gap-2.5 rounded-xl bg-brand-600/[0.06] px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <p className="text-xs text-muted">{t('consent')}</p>
              </div>
            </div>
          </section>

          {/* examples */}
          <section className="overflow-hidden rounded-xl border border-hairline bg-card shadow-xs">
            <header className="flex items-center gap-2 border-b border-hairline px-5 py-4">
              <Lightbulb className="h-4 w-4 text-accent-500" />
              <h2 className="font-display text-base font-semibold tracking-tight">
                {t('examplesTitle')}
              </h2>
            </header>
            <div className="flex flex-wrap gap-2 p-5">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(ex)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-left text-[0.8125rem] text-muted transition-all hover:border-brand-500/40 hover:bg-brand-600/[0.06] hover:text-ink"
                >
                  <Send className="h-3 w-3 text-subtle transition-colors group-hover:text-brand-600" />
                  {ex}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT — phone chat */}
        <section className="flex h-[34rem] flex-col overflow-hidden rounded-xl border border-hairline bg-card shadow-sm lg:h-[40rem]">
          {/* chat header */}
          <header className="flex items-center gap-3 border-b border-hairline bg-[#075E54]/[0.04] px-4 py-3">
            <span className="relative">
              <Avatar name={personaName} hue={172} size={40} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-[#25D366]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium leading-tight">{personaName}</p>
              <p className="flex items-center gap-1 text-2xs text-[#1FA855]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                {localized('online', locale)}
              </p>
            </div>
            <IconButton
              aria-label={t('number')}
              onClick={() => {
                navigator.clipboard?.writeText('+55 11 99000-0000');
                toast.success(localized('numberCopied', locale));
              }}
            >
              <Phone className="h-4 w-4" />
            </IconButton>
          </header>

          {/* messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-2.5 overflow-y-auto bg-bg/40 px-4 py-4"
          >
            {thread.map((m) => (
              <div
                key={m.id}
                className={cn('flex', m.role === 'out' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-xs',
                    m.role === 'out'
                      ? 'rounded-br-md bg-brand-600 text-white'
                      : 'rounded-bl-md border border-hairline bg-card text-ink',
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  <span
                    className={cn(
                      'mt-1 flex items-center justify-end gap-1 text-[0.625rem] tnum',
                      m.role === 'out' ? 'text-white/70' : 'text-subtle',
                    )}
                  >
                    {formatTime(m.at, locale)}
                    {m.role === 'out' && <CheckCheck className="h-3 w-3" />}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* input row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(draft);
            }}
            className="flex items-center gap-2 border-t border-hairline bg-surface/60 px-3 py-3"
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('typeHere', { name: personaName })}
              aria-label={t('inputPlaceholder')}
              className="flex-1 rounded-full bg-surface"
            />
            <button
              type="submit"
              aria-label={t('send')}
              disabled={!draft.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-sm transition-all duration-200 ease-spring hover:bg-brand-700 hover:shadow-glow active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </ScreenContainer>
  );
}
