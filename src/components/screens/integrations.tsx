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
  type LucideIcon,
} from 'lucide-react';
import { ScreenContainer, ScreenHeader, SectionTitle } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { toast } from '@/lib/toast';

type Status = 'connected' | 'available';
type CategoryKey = 'pep' | 'payers' | 'asr' | 'messaging';

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

export function IntegrationsScreen({ paneId }: { paneId: string }) {
  void paneId;
  const t = useTranslations('integrations');
  const tf = useTranslations('feedback');
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const [connected, setConnected] = React.useState<Set<string>>(() => new Set(INITIAL_CONNECTED));
  const [configuring, setConfiguring] = React.useState<string | null>(null);

  const statusOf = (name: string): Status =>
    connected.has(name) ? 'connected' : 'available';

  const toggle = (name: string) => {
    const willConnect = !connected.has(name);
    setConnected((prev) => {
      const next = new Set(prev);
      if (willConnect) next.add(name);
      else next.delete(name);
      return next;
    });
    toast.success(willConnect ? tf('connected') : tf('disconnected'));
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
                  onToggle={() => toggle(name)}
                  onConfigure={() => setConfiguring(name)}
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
          <Field label={L('Chave de API', 'API key', 'API 密钥', 'Clé API')}>
            <Input placeholder="sk-•••••••••••••" className="font-mono" autoFocus />
          </Field>
          <Field label="Webhook URL">
            <Input placeholder="https://hooks.auronishealth.com/…" className="font-mono" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfiguring(null)}>
              {L('Cancelar', 'Cancel', '取消', 'Annuler')}
            </Button>
            <Button
              onClick={() => {
                setConfiguring(null);
                toast.success(L('Configuração salva', 'Configuration saved', '配置已保存', 'Configuration enregistrée'));
              }}
            >
              {L('Salvar', 'Save', '保存', 'Enregistrer')}
            </Button>
          </div>
        </div>
      </Modal>
    </ScreenContainer>
  );
}

function ProviderCard({
  name,
  status,
  onToggle,
  onConfigure,
  t,
}: {
  name: string;
  status: Status;
  onToggle: () => void;
  onConfigure: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const hue = hueOf(name);
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
          <div className="mt-1.5">
            <Badge tone={STATUS_TONE[status]} dot={status === 'connected'}>
              {t(`status.${status}` as never)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
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
            <Button size="sm" variant="ghost" onClick={onToggle}>
              {t('disconnect')}
            </Button>
          </>
        )}
        {status === 'available' && (
          <Button
            size="sm"
            className="flex-1"
            leftIcon={<Plug className="h-3.5 w-3.5" />}
            onClick={onToggle}
          >
            {t('connect')}
          </Button>
        )}
      </div>
    </Card>
  );
}
