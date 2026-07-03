'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Check,
  Copy,
  ExternalLink,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { useSession } from '@/lib/auth/client';
import { PLANS, PLAN_BY_ID, backendPlanId, yearlyMonthlyPrice, type PlanId } from '@/components/landing/plans-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/misc';
import { Spinner } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { cn, formatCurrency } from '@/lib/utils';

type Cycle = 'monthly' | 'yearly';
type Method = 'pix' | 'boleto' | 'card';
type Stage = 'setup' | 'result';

interface CheckoutResult {
  orderId: string;
  status: 'pending' | 'paid' | 'failed';
  method: Method;
  amountCents: number;
  pixQrCode?: string;
  pixCopyPaste?: string;
  boletoLine?: string;
  boletoUrl?: string;
}

function isPlanId(v: string | undefined): v is PlanId {
  return !!v && PLANS.some((p) => p.id === v);
}

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 48; // ~2min — past the sandbox's ~8s settle and a typical real PIX confirmation

export function CheckoutFlow({ initialPlan, initialCycle }: { initialPlan?: string; initialCycle?: string }) {
  const t = useTranslations('checkout');
  const tc = useTranslations('common.actions');
  const locale = useLocale();
  const router = useRouter();
  const { name: sessionName, email: sessionEmail, loading: sessionLoading } = useSession();

  const [planId, setPlanId] = React.useState<PlanId>(isPlanId(initialPlan) ? initialPlan : 'pro');
  const [cycle, setCycle] = React.useState<Cycle>(initialCycle === 'yearly' ? 'yearly' : 'monthly');
  const [method, setMethod] = React.useState<Method>('pix');
  const [payerName, setPayerName] = React.useState('');
  const [payerEmail, setPayerEmail] = React.useState('');
  const [taxId, setTaxId] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');
  const [cardExpiry, setCardExpiry] = React.useState('');
  const [cardCvv, setCardCvv] = React.useState('');
  const [cardName, setCardName] = React.useState('');

  const [stage, setStage] = React.useState<Stage>('setup');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<CheckoutResult | null>(null);
  const [pollTimedOut, setPollTimedOut] = React.useState(false);

  React.useEffect(() => {
    if (sessionLoading) return;
    setPayerName((v) => v || sessionName || '');
    setPayerEmail((v) => v || sessionEmail || '');
  }, [sessionLoading, sessionName, sessionEmail]);

  const plan = PLAN_BY_ID[planId];
  const displayMonthly = cycle === 'yearly' ? yearlyMonthlyPrice(plan.monthly) : plan.monthly;
  const displayAmount = cycle === 'yearly' ? displayMonthly * 12 : displayMonthly;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (method === 'card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim() || !cardName.trim())) {
      setError(t('errors.cardTokenRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: backendPlanId(planId),
          cycle,
          method,
          payer: { name: payerName, email: payerEmail, taxId: taxId.trim() || undefined },
          cardToken: method === 'card' ? cardNumber.replace(/\s/g, '').slice(-1) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitting(false);
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(`/checkout?plan=${planId}&cycle=${cycle}`)}`);
          return;
        }
        const code = data?.error?.code;
        setError(
          code === 'PLAN_NOT_FOUND'
            ? t('errors.planNotFound')
            : code === 'CARD_TOKEN_REQUIRED'
              ? t('errors.cardTokenRequired')
              : res.status === 502
                ? t('errors.provider')
                : t('errors.generic'),
        );
        return;
      }

      setResult(data as CheckoutResult);
      setStage('result');
    } catch {
      setError(t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  // PIX/boleto settle asynchronously — poll while pending, exactly what the
  // sandbox mock needs to resolve itself and what a real Mercado Pago
  // confirmation would need too. Capped at MAX_POLLS so an abandoned pending
  // tab stops pinging the server forever (~2min at 2.5s covers the sandbox's
  // ~8s settle and a typical real PIX confirmation); after that we show a
  // manual "check again" instead of an infinite background poll.
  const orderId = result?.orderId;
  React.useEffect(() => {
    if (stage !== 'result' || !orderId || result?.status !== 'pending' || pollTimedOut) return;
    let count = 0;
    const id = setInterval(async () => {
      count += 1;
      if (count > MAX_POLLS) {
        clearInterval(id);
        setPollTimedOut(true);
        return;
      }
      try {
        const res = await fetch(`/api/checkout/session/${orderId}`);
        if (!res.ok) return;
        const data = (await res.json()) as CheckoutResult;
        setResult((prev) => (prev ? { ...prev, ...data } : data));
      } catch {
        // transient — next tick retries
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [stage, orderId, result?.status, pollTimedOut]);

  // Manual re-check after the auto-poll gives up: one immediate fetch, then
  // resume the capped auto-poll if it's still pending.
  const recheck = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/checkout/session/${orderId}`);
      if (res.ok) {
        const data = (await res.json()) as CheckoutResult;
        setResult((prev) => (prev ? { ...prev, ...data } : data));
      }
    } catch {
      // transient — resuming the poll below will retry
    }
    setPollTimedOut(false);
  };

  const retry = () => {
    setStage('setup');
    setResult(null);
    setError(null);
    setPollTimedOut(false);
  };

  // Shared "waiting for confirmation" indicator for PIX/boleto: an animated
  // spinner while auto-polling, or a manual re-check once the poll cap is hit.
  const waitingIndicator = (waitingLabel: string) =>
    pollTimedOut ? (
      <div className="mt-5 flex flex-col items-center gap-2.5 text-sm text-muted">
        <span>{t('stillProcessing')}</span>
        <Button type="button" variant="outline" size="sm" leftIcon={<RotateCw className="h-3.5 w-3.5" />} onClick={recheck}>
          {t('recheck')}
        </Button>
      </div>
    ) : (
      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted">
        <Spinner /> {waitingLabel}
      </div>
    );

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      // clipboard unavailable — non-fatal, the text is still selectable/visible
    }
  };

  const formatCardNumber = (raw: string) =>
    raw
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim();

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between p-5">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-brand-600" /> Auronis Health
        </span>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-6 pb-20 pt-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1.5 text-sm text-muted">{t('subtitle')}</p>

        {stage === 'setup' && (
          <form onSubmit={submit} className="mt-6 space-y-5">
            {/* plan selector */}
            <div>
              <p className="mb-2 text-xs+ font-medium text-ink/90">{t('planLabel')}</p>
              <div className="grid grid-cols-3 gap-2">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={cn(
                      'rounded-lg border px-2 py-2.5 text-center transition-colors',
                      planId === p.id
                        ? 'border-brand-500/50 bg-brand-600/10'
                        : 'border-line hover:bg-ink/[0.04]',
                    )}
                  >
                    <p className={cn('text-sm font-semibold', planId === p.id && 'text-brand-700 dark:text-brand-300')}>{p.name}</p>
                    <p className="text-2xs text-muted">
                      {formatCurrency(p.monthly, locale, 'BRL')}
                      {t('perMonth')}
                    </p>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <SegmentedControl
                  value={cycle}
                  onChange={setCycle}
                  options={[
                    { value: 'monthly', label: t('cycleMonthly') },
                    { value: 'yearly', label: t('cycleYearly') },
                  ]}
                />
                {cycle === 'yearly' && (
                  <span className="text-2xs font-medium text-success">{t('yearlyHint')}</span>
                )}
              </div>
              <p className="mt-3 text-right font-display text-lg font-bold tracking-tight">
                {formatCurrency(displayAmount, locale, 'BRL')}
                <span className="text-xs font-normal text-muted">{cycle === 'yearly' ? t('perYear') : t('perMonth')}</span>
              </p>
            </div>

            {/* payer */}
            <div className="space-y-3 border-t border-hairline pt-5">
              <p className="text-xs+ font-medium text-ink/90">{t('payer.title')}</p>
              <Field label={t('payer.name')}>
                <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} required minLength={2} />
              </Field>
              <Field label={t('payer.email')}>
                <Input type="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} required />
              </Field>
              <Field label={t('payer.taxId')}>
                <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="000.000.000-00" />
              </Field>
            </div>

            {/* method */}
            <div className="space-y-3 border-t border-hairline pt-5">
              <p className="text-xs+ font-medium text-ink/90">{t('method.title')}</p>
              <SegmentedControl
                value={method}
                onChange={setMethod}
                className="w-full"
                options={[
                  { value: 'pix', label: t('method.pix') },
                  { value: 'boleto', label: t('method.boleto') },
                  { value: 'card', label: t('method.card') },
                ]}
              />

              {method === 'card' && (
                <div className="space-y-3 rounded-lg border border-hairline bg-surface/50 p-3">
                  <Field label={t('card.number')}>
                    <Input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      className="font-mono"
                      required
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('card.expiry')}>
                      <Input
                        value={cardExpiry}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                        }}
                        placeholder="MM/AA"
                        className="font-mono"
                        required
                      />
                    </Field>
                    <Field label={t('card.cvv')}>
                      <Input
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        className="font-mono"
                        required
                      />
                    </Field>
                  </div>
                  <Field label={t('card.name')}>
                    <Input value={cardName} onChange={(e) => setCardName(e.target.value)} required />
                  </Field>
                  <p className="text-2xs text-muted">{t('card.testHint')}</p>
                </div>
              )}
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-2.5 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" loading={submitting} className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t('confirm')}
            </Button>
          </form>
        )}

        {stage === 'result' && result && (
          <Card className="mt-6 p-6">
            {result.status === 'pending' && result.method === 'pix' && (
              <div className="text-center">
                <h2 className="font-display text-lg font-semibold">{t('pix.title')}</h2>
                <p className="mt-1 text-sm text-muted">{t('pix.subtitle')}</p>
                {result.pixQrCode && (
                  // eslint-disable-next-line @next/next/no-img-element -- data: URL, no optimization applicable
                  <img src={result.pixQrCode} alt="PIX QR code" className="mx-auto mt-5 h-52 w-52 rounded-lg border border-hairline" />
                )}
                {result.pixCopyPaste && (
                  <div className="mt-4 text-left">
                    <p className="mb-1 text-2xs font-medium text-muted">{t('pix.copyPaste')}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded-md border border-line bg-surface px-2.5 py-2 text-2xs">{result.pixCopyPaste}</code>
                      <Button type="button" variant="outline" size="sm" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={() => copy(result.pixCopyPaste!, t('pix.copied'))}>
                        {t('pix.copyButton')}
                      </Button>
                    </div>
                  </div>
                )}
                {waitingIndicator(t('pix.waiting'))}
                <p className="mt-2 text-2xs text-muted">{t('pix.sandboxNote')}</p>
              </div>
            )}

            {result.status === 'pending' && result.method === 'boleto' && (
              <div className="text-center">
                <Banknote className="mx-auto h-10 w-10 text-brand-600" />
                <h2 className="mt-3 font-display text-lg font-semibold">{t('boleto.title')}</h2>
                <p className="mt-1 text-sm text-muted">{t('boleto.subtitle')}</p>
                {result.boletoLine && (
                  <div className="mt-4 text-left">
                    <p className="mb-1 text-2xs font-medium text-muted">{t('boleto.line')}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded-md border border-line bg-surface px-2.5 py-2 text-2xs">{result.boletoLine}</code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<Copy className="h-3.5 w-3.5" />}
                        onClick={() => copy(result.boletoLine!, t('pix.copied'))}
                      >
                        {t('pix.copyButton')}
                      </Button>
                    </div>
                  </div>
                )}
                {result.boletoUrl && (
                  <a
                    href={result.boletoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
                  >
                    {t('boleto.view')} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {waitingIndicator(t('boleto.waiting'))}
              </div>
            )}

            {result.status === 'paid' && (
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/12 text-success">
                  <Check className="h-7 w-7" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold">{t('success.title')}</h2>
                <p className="mt-1.5 text-sm text-muted">{t('success.subtitle', { plan: plan.name })}</p>
                <Button className="mt-6 w-full" size="lg" onClick={() => router.push('/app')}>
                  {t('success.cta')}
                </Button>
              </div>
            )}

            {result.status === 'failed' && (
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-danger/12 text-danger">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold">{t('failed.title')}</h2>
                <p className="mt-1.5 text-sm text-muted">{t('failed.subtitle')}</p>
                <Button className="mt-6 w-full" size="lg" leftIcon={<RotateCw className="h-4 w-4" />} onClick={retry}>
                  {t('failed.retry')}
                </Button>
              </div>
            )}
          </Card>
        )}

        {stage === 'setup' && (
          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-2xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> LGPD · GDPR · PIPL
          </p>
        )}
      </main>
    </div>
  );
}
