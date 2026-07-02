'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { FileSignature, Check, X, Send, Clock, Hourglass, CheckCircle2, XCircle } from 'lucide-react';
import {
  listGuides,
  requestAuthorization,
  reviewAuthorization,
  decideAuthorization,
} from '@/lib/data';
import type { TissGuide } from '@/lib/types';
import { ScreenContainer, ScreenHeader, SectionTitle, StatCard } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/overlay';
import { EmptyState } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { cn, timeAgo } from '@/lib/utils';

type AuthStatus = NonNullable<TissGuide['authStatus']>;

/** Hospital requisition / prior-authorization queue (Block 5).
 *  medico requests → faturista/gestor reviews → authorizes/denies. */
export function RequisicaoScreen({ paneId }: { paneId: string }) {
  void paneId;
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const [, bump] = React.useReducer((x: number) => x + 1, 0);
  const guides = listGuides();

  const STATUS: Record<AuthStatus, { label: string; tone: React.ComponentProps<typeof Badge>['tone'] }> = {
    requested: { label: L('Solicitada', 'Requested', '已申请', 'Demandée'), tone: 'info' },
    in_review: { label: L('Em análise', 'In review', '审核中', 'En analyse'), tone: 'warning' },
    authorized: { label: L('Autorizada', 'Authorized', '已授权', 'Autorisée'), tone: 'success' },
    denied: { label: L('Negada', 'Denied', '已拒绝', 'Refusée'), tone: 'danger' },
  };

  const run = (fn: () => void, msg: string) => {
    fn();
    bump();
    toast.success(msg);
  };

  const [denyTarget, setDenyTarget] = React.useState<TissGuide | null>(null);
  const confirmDeny = () => {
    if (!denyTarget) return;
    decideAuthorization(denyTarget.id, 'denied');
    setDenyTarget(null);
    bump();
    toast.success(L('Negada', 'Denied', '已拒绝', 'Refusée'));
  };

  /* Group the queue by workflow stage so the eye lands on what's actionable. */
  const groups: Array<{ key: string; title: string; items: TissGuide[] }> = [
    {
      key: 'in_review',
      title: L('Em análise', 'In review', '审核中', 'En analyse'),
      items: guides.filter((g) => g.authStatus === 'in_review'),
    },
    {
      key: 'requested',
      title: L('Solicitadas', 'Requested', '已申请', 'Demandées'),
      items: guides.filter((g) => g.authStatus === 'requested'),
    },
    {
      key: 'none',
      title: L('Aguardando solicitação', 'Awaiting request', '待申请', 'En attente de demande'),
      items: guides.filter((g) => !g.authStatus),
    },
    {
      key: 'decided',
      title: L('Decididas', 'Decided', '已决定', 'Décidées'),
      items: guides.filter((g) => g.authStatus === 'authorized' || g.authStatus === 'denied'),
    },
  ];

  const counts = {
    queue: guides.filter((g) => g.authStatus === 'requested' || g.authStatus === 'in_review').length,
    authorized: guides.filter((g) => g.authStatus === 'authorized').length,
    denied: guides.filter((g) => g.authStatus === 'denied').length,
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={FileSignature}
        title={L('Requisição / Autorização', 'Requisition / Authorization', '申请 / 授权', 'Requête / Autorisation')}
        subtitle={L(
          'Solicite e acompanhe autorizações dos planos de saúde.',
          'Request and track prior authorizations from payers.',
          '向支付方申请并跟踪事先授权。',
          'Demandez et suivez les autorisations des assureurs.',
        )}
      />

      {/* pipeline summary */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard
          label={L('Na fila', 'In queue', '排队中', 'En file')}
          value={counts.queue}
          icon={Hourglass}
          tone="warning"
        />
        <StatCard
          label={L('Autorizadas', 'Authorized', '已授权', 'Autorisées')}
          value={counts.authorized}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label={L('Negadas', 'Denied', '已拒绝', 'Refusées')}
          value={counts.denied}
          icon={XCircle}
          tone="danger"
        />
      </div>

      {guides.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-6 w-6" />}
          title={L('Nenhuma guia para autorizar', 'No guides to authorize', '没有待授权的单据', 'Aucune feuille à autoriser')}
          description={L(
            'Guias criadas a partir das consultas aparecem aqui para autorização prévia.',
            'Guides created from encounters show up here for prior authorization.',
            '由就诊生成的单据会出现在这里等待事先授权。',
            'Les feuilles créées à partir des consultations apparaissent ici pour autorisation préalable.',
          )}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {groups
            .filter((grp) => grp.items.length > 0)
            .map((grp) => (
              <section key={grp.key}>
                <SectionTitle action={<Badge tone="neutral">{grp.items.length}</Badge>}>
                  {grp.title}
                </SectionTitle>
                <div className="flex flex-col gap-3">
                  {grp.items.map((g) => {
                    const st = g.authStatus ? STATUS[g.authStatus] : null;
                    const inQueue = g.authStatus === 'requested' || g.authStatus === 'in_review';
                    return (
                      <Card key={g.id} className="p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">
                              {g.payer} · <span className="font-mono text-xs text-muted">{g.id}</span>
                            </p>
                            <p className="mt-0.5 text-2xs text-muted">
                              {g.procedures.map((p) => p.code).join(', ')}
                            </p>
                          </div>
                          {inQueue && (
                            <span className="inline-flex items-center gap-1 text-2xs text-muted">
                              <Clock className="h-3 w-3" />
                              {L('na fila', 'in queue', '排队', 'en file')} · {timeAgo(g.createdAt, locale)}
                            </span>
                          )}
                          {st && <Badge tone={st.tone}>{st.label}</Badge>}
                          {g.authNumber && (
                            <span className="font-mono text-2xs text-muted">{g.authNumber}</span>
                          )}
                          <div className="flex gap-2">
                            {!g.authStatus && (
                              <Button
                                size="sm"
                                leftIcon={<Send className="h-3.5 w-3.5" />}
                                onClick={() =>
                                  run(
                                    () => requestAuthorization(g.id),
                                    L('Autorização solicitada', 'Authorization requested', '已申请授权', 'Autorisation demandée'),
                                  )
                                }
                              >
                                {L('Solicitar', 'Request', '申请', 'Demander')}
                              </Button>
                            )}
                            {g.authStatus === 'requested' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  run(() => reviewAuthorization(g.id), L('Em análise', 'In review', '审核中', 'En analyse'))
                                }
                              >
                                {L('Analisar', 'Review', '分析', 'Analyser')}
                              </Button>
                            )}
                            {g.authStatus === 'in_review' && (
                              <>
                                <Button
                                  size="sm"
                                  leftIcon={<Check className="h-3.5 w-3.5" />}
                                  onClick={() =>
                                    run(
                                      () => decideAuthorization(g.id, 'authorized'),
                                      L('Autorizada', 'Authorized', '已授权', 'Autorisée'),
                                    )
                                  }
                                >
                                  {L('Autorizar', 'Authorize', '授权', 'Autoriser')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-danger-fg hover:bg-danger/10 dark:text-danger"
                                  leftIcon={<X className="h-3.5 w-3.5" />}
                                  onClick={() => setDenyTarget(g)}
                                >
                                  {L('Negar', 'Deny', '拒绝', 'Refuser')}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* workflow stepper */}
                        <AuthStepper status={g.authStatus} L={L} />
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      )}

      {/* deny confirmation */}
      <ConfirmDialog
        open={!!denyTarget}
        onClose={() => setDenyTarget(null)}
        onConfirm={confirmDeny}
        tone="danger"
        title={L('Negar autorização', 'Deny authorization', '拒绝授权', 'Refuser l’autorisation')}
        description={
          denyTarget
            ? `${denyTarget.payer} · ${denyTarget.id} — ${L(
                'O solicitante será notificado e a guia não poderá ser executada.',
                'The requester is notified and the guide cannot be executed.',
                '申请人将收到通知，该单据将无法执行。',
                'Le demandeur est notifié et la feuille ne pourra pas être exécutée.',
              )}`
            : undefined
        }
        confirmLabel={L('Negar', 'Deny', '拒绝', 'Refuser')}
      />
    </ScreenContainer>
  );
}

/* ------------------------- workflow stepper ------------------------- */

function AuthStepper({
  status,
  L,
}: {
  status?: AuthStatus;
  L: (pt: string, en: string, zh: string, fr: string) => string;
}) {
  const steps = [
    { key: 'requested', label: L('Solicitada', 'Requested', '已申请', 'Demandée') },
    { key: 'in_review', label: L('Em análise', 'In review', '审核中', 'En analyse') },
    {
      key: 'decision',
      label:
        status === 'denied'
          ? L('Negada', 'Denied', '已拒绝', 'Refusée')
          : L('Autorizada', 'Authorized', '已授权', 'Autorisée'),
    },
  ] as const;

  const stage = status === 'requested' ? 0 : status === 'in_review' ? 1 : status ? 2 : -1;
  const denied = status === 'denied';

  return (
    <ol className="mt-4 flex items-center gap-0 border-t border-hairline/60 pt-3" aria-label={L('Fluxo de autorização', 'Authorization flow', '授权流程', 'Flux d’autorisation')}>
      {steps.map((s, i) => {
        const done = stage > i || (stage === i && i === 2);
        const current = stage === i && i < 2;
        const lastStepDenied = denied && i === 2;
        return (
          <li key={s.key} className={cn('flex items-center', i > 0 && 'flex-1')}>
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  'mx-2 h-px flex-1',
                  stage >= i ? (lastStepDenied ? 'bg-danger/50' : 'bg-brand-500/50') : 'bg-hairline',
                )}
              />
            )}
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <span
                aria-hidden
                className={cn(
                  'grid h-4 w-4 place-items-center rounded-full text-[0.5rem]',
                  lastStepDenied
                    ? 'bg-danger/15 text-danger-fg dark:text-danger'
                    : done
                      ? 'bg-brand-600/15 text-brand-600'
                      : current
                        ? 'bg-warning/15 text-warning-fg dark:text-warning'
                        : 'bg-ink/[0.05] text-subtle',
                )}
              >
                {lastStepDenied ? (
                  <X className="h-2.5 w-2.5" />
                ) : done ? (
                  <Check className="h-2.5 w-2.5" />
                ) : (
                  <span className={cn('h-1.5 w-1.5 rounded-full bg-current', current && 'animate-pulse')} />
                )}
              </span>
              <span
                className={cn(
                  'text-2xs font-medium',
                  lastStepDenied
                    ? 'text-danger-fg dark:text-danger'
                    : done
                      ? 'text-ink/90'
                      : current
                        ? 'text-warning-fg dark:text-warning'
                        : 'text-subtle',
                )}
              >
                {s.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
