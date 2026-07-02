'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Cable,
  Plug,
  Settings2,
  HeartPulse,
  ShieldCheck,
  AudioLines,
  MessageCircle,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { ScreenContainer, ScreenHeader, SectionTitle } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { ConfirmDialog, Modal } from '@/components/ui/overlay';
import { toast } from '@/lib/toast';
import { cn, formatNumber, timeAgo } from '@/lib/utils';

type Status = 'connected' | 'available';
type CategoryKey = 'pep' | 'payers' | 'asr' | 'messaging';

interface ProviderConfig {
  apiKey: string;
  webhook: string;
}

const CATEGORIES: { key: CategoryKey; icon: LucideIcon; providers: string[] }[] = [
  { key: 'pep', icon: HeartPulse, providers: ['Tasy', 'MV Soul', 'iClinic', 'Feegow'] },
  {
    key: 'payers',
    icon: ShieldCheck,
    providers: ['Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'Hapvida'],
  },
  { key: 'asr', icon: AudioLines, providers: ['Auronis ASR', 'Whisper', 'Azure Speech', 'Google Speech'] },
  { key: 'messaging', icon: MessageCircle, providers: ['WhatsApp Business', 'Telegram'] },
];

const INITIAL_CONNECTED = new Set(['Auronis ASR', 'Unimed', 'WhatsApp Business']);

const STATUS_TONE: Record<Status, React.ComponentProps<typeof Badge>['tone']> = {
  connected: 'success',
  available: 'neutral',
};

/** Deterministic hue from the provider name, so each logo tile gets a stable color. */
function hueOf(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

/** Deterministic per-provider sync telemetry (simulated, stable across renders). */
function telemetryOf(name: string): { minutesAgo: number; events: number } {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 33 + name.charCodeAt(i)) % 9973;
  return { minutesAgo: (h % 47) + 2, events: (h % 880) + 60 };
}

export function IntegrationsScreen({ paneId }: { paneId: string }) {
  void paneId;
  const t = useTranslations('integrations');
  const tf = useTranslations('feedback');
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const [connected, setConnected] = React.useState<Set<string>>(() => new Set(INITIAL_CONNECTED));
  const [configuring, setConfiguring] = React.useState<string | null>(null);
  const [disconnectTarget, setDisconnectTarget] = React.useState<string | null>(null);
  // Per-provider config, kept for the session — the modal reads and writes it for real.
  const [configs, setConfigs] = React.useState<Record<string, ProviderConfig>>({});
  const [draft, setDraft] = React.useState<ProviderConfig>({ apiKey: '', webhook: '' });
  const now = React.useMemo(() => Date.now(), []);

  const statusOf = (name: string): Status =>
    connected.has(name) ? 'connected' : 'available';

  const connect = (name: string) => {
    setConnected((prev) => new Set(prev).add(name));
    toast.success(tf('connected'));
  };

  const confirmDisconnect = () => {
    if (!disconnectTarget) return;
    setConnected((prev) => {
      const next = new Set(prev);
      next.delete(disconnectTarget);
      return next;
    });
    setDisconnectTarget(null);
    toast.success(tf('disconnected'));
  };

  const openConfigure = (name: string) => {
    setDraft(configs[name] ?? { apiKey: '', webhook: '' });
    setConfiguring(name);
  };

  const saveConfig = () => {
    if (!configuring) return;
    setConfigs((c) => ({ ...c, [configuring]: { apiKey: draft.apiKey.trim(), webhook: draft.webhook.trim() } }));
    setConfiguring(null);
    toast.success(L('Configuração salva', 'Configuration saved', '配置已保存', 'Configuration enregistrée'));
  };

  return (
    <ScreenContainer>
      <ScreenHeader icon={Cable} title={t('title')} subtitle={t('subtitle')} />

      <div className="flex flex-col gap-8">
        {CATEGORIES.map((cat) => (
          <section key={cat.key}>
            <SectionTitle>
              <span className="inline-flex items-center gap-2">
                <cat.icon className="h-3.5 w-3.5 text-brand-600" />
                {t(`categories.${cat.key}` as never)}
              </span>
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cat.providers.map((name) => (
                <ProviderCard
                  key={name}
                  name={name}
                  status={statusOf(name)}
                  configured={!!configs[name]?.apiKey}
                  now={now}
                  locale={locale}
                  L={L}
                  onConnect={() => connect(name)}
                  onDisconnect={() => setDisconnectTarget(name)}
                  onConfigure={() => openConfigure(name)}
                  t={t}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <Modal
        open={!!configuring}
        onClose={() => setConfiguring(null)}
        title={`${L('Configurar', 'Configure', '配置', 'Configurer')}${configuring ? ` · ${configuring}` : ''}`}
      >
        <div className="flex flex-col gap-4 p-5">
          {/* honest note — same posture as the marketplace API surface */}
          <div className="rounded-lg border border-hairline bg-surface/50 px-3 py-2 text-2xs text-muted">
            {L(
              'Superfície de demonstração — as credenciais ficam apenas neste navegador, nesta sessão.',
              'Demo surface — credentials live only in this browser, for this session.',
              '演示界面——凭据仅保存在此浏览器的本次会话中。',
              'Surface de démonstration — les identifiants restent uniquement dans ce navigateur, pour cette session.',
            )}
          </div>
          <Field label={L('Chave de API', 'API key', 'API 密钥', 'Clé API')}>
            <Input
              value={draft.apiKey}
              onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
              placeholder="sk-•••••••••••••"
              className="font-mono"
              autoFocus
            />
          </Field>
          <Field label="Webhook URL">
            <Input
              value={draft.webhook}
              onChange={(e) => setDraft((d) => ({ ...d, webhook: e.target.value }))}
              placeholder="https://hooks.auronishealth.com/…"
              className="font-mono"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfiguring(null)}>
              {L('Cancelar', 'Cancel', '取消', 'Annuler')}
            </Button>
            <Button onClick={saveConfig}>{L('Salvar', 'Save', '保存', 'Enregistrer')}</Button>
          </div>
        </div>
      </Modal>

      {/* disconnect confirmation */}
      <ConfirmDialog
        open={!!disconnectTarget}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={confirmDisconnect}
        title={t('disconnect')}
        description={
          disconnectTarget
            ? `${disconnectTarget} — ${L(
                'A sincronização para imediatamente e os dados deixam de fluir.',
                'Sync stops immediately and data stops flowing.',
                '同步将立即停止，数据不再流动。',
                'La synchronisation s’arrête immédiatement et les données cessent de circuler.',
              )}`
            : undefined
        }
        confirmLabel={t('disconnect')}
      />
    </ScreenContainer>
  );
}

function ProviderCard({
  name,
  status,
  configured,
  now,
  locale,
  L,
  onConnect,
  onDisconnect,
  onConfigure,
  t,
}: {
  name: string;
  status: Status;
  configured: boolean;
  now: number;
  locale: string;
  L: (pt: string, en: string, zh: string, fr: string) => string;
  onConnect: () => void;
  onDisconnect: () => void;
  onConfigure: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const hue = hueOf(name);
  const tele = telemetryOf(name);
  const lastSync = new Date(now - tele.minutesAgo * 60_000);

  return (
    <Card hover className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-lg font-bold text-white ring-1 ring-black/5"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 58% 50%), hsl(${(hue + 38) % 360} 62% 40%))`,
          }}
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight">{name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[status]} dot={status === 'connected'}>
              {t(`status.${status}` as never)}
            </Badge>
            {configured && (
              <Badge tone="brand">{L('Configurado', 'Configured', '已配置', 'Configurée')}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* connection health — deterministic simulated telemetry */}
      {status === 'connected' && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-2xs text-muted">
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="truncate">
              {L('Última sync', 'Last sync', '最近同步', 'Dernière sync')} {timeAgo(lastSync, locale)}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-2xs font-medium text-muted tnum">
            <Activity className="h-3 w-3" aria-hidden />
            {formatNumber(tele.events, locale)} {L('eventos/24h', 'events/24h', '事件/24h', 'évén./24h')}
          </span>
        </div>
      )}

      <div className={cn('flex items-center gap-2', status === 'connected' ? 'mt-3' : 'mt-4')}>
        {status === 'connected' && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              leftIcon={<Settings2 className="h-3.5 w-3.5" />}
              onClick={onConfigure}
            >
              {t('configure')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDisconnect}>
              {t('disconnect')}
            </Button>
          </>
        )}
        {status === 'available' && (
          <Button
            size="sm"
            className="flex-1"
            leftIcon={<Plug className="h-3.5 w-3.5" />}
            onClick={onConnect}
          >
            {t('connect')}
          </Button>
        )}
      </div>
    </Card>
  );
}
