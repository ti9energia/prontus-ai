'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { FileSignature, Check, X, Send } from 'lucide-react';
import {
  listGuides,
  requestAuthorization,
  reviewAuthorization,
  decideAuthorization,
} from '@/lib/data/store';
import { ScreenContainer, ScreenHeader } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

/** Hospital requisition / prior-authorization queue (Block 5).
 *  medico requests → faturista/gestor reviews → authorizes/denies. */
export function RequisicaoScreen({ paneId }: { paneId: string }) {
  void paneId;
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const [, bump] = React.useReducer((x: number) => x + 1, 0);
  const guides = listGuides();

  const STATUS: Record<string, { label: string; tone: React.ComponentProps<typeof Badge>['tone'] }> = {
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
      <div className="flex flex-col gap-3">
        {guides.map((g) => {
          const st = g.authStatus ? STATUS[g.authStatus] : null;
          return (
            <Card key={g.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {g.payer} · {g.id}
                </p>
                <p className="text-2xs text-muted">{g.procedures.map((p) => p.code).join(', ')}</p>
              </div>
              {st && <Badge tone={st.tone}>{st.label}</Badge>}
              {g.authNumber && <span className="font-mono text-2xs text-muted">{g.authNumber}</span>}
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
                    onClick={() => run(() => reviewAuthorization(g.id), L('Em análise', 'In review', '审核中', 'En analyse'))}
                  >
                    {L('Analisar', 'Review', '分析', 'Analyser')}
                  </Button>
                )}
                {g.authStatus === 'in_review' && (
                  <>
                    <Button
                      size="sm"
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                      onClick={() => run(() => decideAuthorization(g.id, 'authorized'), L('Autorizada', 'Authorized', '已授权', 'Autorisée'))}
                    >
                      {L('Autorizar', 'Authorize', '授权', 'Autoriser')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<X className="h-3.5 w-3.5" />}
                      onClick={() => run(() => decideAuthorization(g.id, 'denied'), L('Negada', 'Denied', '已拒绝', 'Refusée'))}
                    >
                      {L('Negar', 'Deny', '拒绝', 'Refuser')}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </ScreenContainer>
  );
}
