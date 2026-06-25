'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Cable,
  Plug,
  Check,
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

type Status = 'connected' | 'available' | 'soon';
type CategoryKey = 'pep' | 'payers' | 'asr' | 'messaging';

const CATEGORIES: { key: CategoryKey; icon: LucideIcon; providers: string[] }[] = [
  { key: 'pep', icon: HeartPulse, providers: ['Tasy', 'MV Soul', 'iClinic', 'Feegow'] },
  {
    key: 'payers',
    icon: ShieldCheck,
    providers: ['Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'Hapvida'],
  },
  { key: 'asr', icon: AudioLines, providers: ['Aureon ASR', 'Whisper', 'Azure Speech', 'Google Speech'] },
  { key: 'messaging', icon: MessageCircle, providers: ['WhatsApp Business', 'Telegram'] },
];

const INITIAL_CONNECTED = new Set(['Aureon ASR', 'Unimed', 'WhatsApp Business']);
const SOON = new Set(['Telegram', 'Google Speech']);

const STATUS_TONE: Record<Status, React.ComponentProps<typeof Badge>['tone']> = {
  connected: 'success',
  available: 'neutral',
  soon: 'warning',
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
  const [connected, setConnected] = React.useState<Set<string>>(() => new Set(INITIAL_CONNECTED));

  const statusOf = (name: string): Status =>
    SOON.has(name) ? 'soon' : connected.has(name) ? 'connected' : 'available';

  const toggle = (name: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
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
                  t={t}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </ScreenContainer>
  );
}

function ProviderCard({
  name,
  status,
  onToggle,
  t,
}: {
  name: string;
  status: Status;
  onToggle: () => void;
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
        {status === 'soon' && (
          <Button size="sm" variant="subtle" className="flex-1" disabled leftIcon={<Check className="h-3.5 w-3.5" />}>
            {t('status.soon')}
          </Button>
        )}
      </div>
    </Card>
  );
}
