'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { FlaskConical, Plus, Search, ChevronRight, Check, AlertTriangle, Clock } from 'lucide-react';
import { listLabOrders, getPatient, listPatients, addLabOrder, updateLabOrderStatus } from '@/lib/data';
import type { LabOrder, LabOrderStatus } from '@/lib/types';
import { ScreenContainer, ScreenHeader, Table, Th, Td } from './_kit';
import { Avatar } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Modal, Sheet } from '@/components/ui/overlay';
import { EmptyState } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';

type StatusTone = React.ComponentProps<typeof Badge>['tone'];

const STATUS_TONE: Record<LabOrderStatus, StatusTone> = {
  ordered: 'neutral',
  collected: 'info',
  processing: 'warning',
  resulted: 'success',
  reviewed: 'neutral',
};

const STATUS_NEXT: Partial<Record<LabOrderStatus, LabOrderStatus>> = {
  ordered: 'collected',
  collected: 'processing',
  processing: 'resulted',
  resulted: 'reviewed',
};

const PRESET_PANELS = [
  { name: 'Hemograma completo', code: '40301140' },
  { name: 'Glicemia em jejum', code: '40301190' },
  { name: 'Creatinina sérica', code: '40301310' },
  { name: 'Colesterol total e frações', code: '40301250' },
  { name: 'Triglicérides', code: '40301260' },
  { name: 'TSH ultrassensível', code: '40301050' },
  { name: 'T4 livre', code: '40301060' },
  { name: 'Urina I (EAS)', code: '40301050' },
];

export function ExamsScreen({ paneId, params }: { paneId: string; params?: Record<string, string> }) {
  void paneId;
  const t = useTranslations('exams');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [newPatientId, setNewPatientId] = React.useState(params?.patientId ?? '');
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const [, force] = React.useReducer((x) => x + 1, 0);

  const orders = listLabOrders(params?.patientId);
  const patients = listPatients();

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const p = getPatient(o.patientId);
      return p?.name.toLowerCase().includes(q) || o.status.includes(q);
    });
  }, [orders, query]);

  const selected = selectedId ? orders.find((o) => o.id === selectedId) : undefined;

  const doAdd = () => {
    if (!newPatientId) return;
    addLabOrder({
      patientId: newPatientId,
      priority: 'routine',
      items: PRESET_PANELS.filter((p) => selectedItems.includes(p.code)).map((p) => ({ code: p.code, name: p.name })),
    });
    setAddOpen(false);
    setSelectedItems([]);
    force();
    toast.success(t('ordered'));
  };

  const doAdvance = (order: LabOrder) => {
    const next = STATUS_NEXT[order.status];
    if (!next) return;
    const now = new Date().toISOString();
    updateLabOrderStatus(order.id, next, {
      collectedAt: next === 'processing' ? now : undefined,
      resultedAt: next === 'reviewed' ? now : undefined,
      reviewedAt: next === 'reviewed' ? now : undefined,
    });
    force();
    setSelectedId(null);
    toast.success(t(`status.${next}`));
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={FlaskConical}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('search')} className="pl-9" />
            </div>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
              {t('order')}
            </Button>
          </>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<FlaskConical className="h-6 w-6" />} title={tc('states.empty')} description={t('subtitle')} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t('columns.patient')}</Th>
              <Th className="hidden sm:table-cell">{t('columns.items')}</Th>
              <Th className="hidden md:table-cell">{t('columns.lab')}</Th>
              <Th className="hidden lg:table-cell">{t('columns.ordered')}</Th>
              <Th>{t('columns.status')}</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const patient = getPatient(o.patientId);
              return (
                <tr
                  key={o.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => setSelectedId(o.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(o.id); }
                  }}
                  className="group cursor-pointer outline-none transition-colors hover:bg-ink/[0.02] focus-visible:bg-ink/[0.03]"
                >
                  <Td>
                    {patient ? (
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={patient.name} hue={patient.hue} size={32} />
                        <span className="truncate font-medium">{patient.name}</span>
                      </div>
                    ) : <span className="text-muted">—</span>}
                  </Td>
                  <Td className="hidden whitespace-nowrap text-muted tnum sm:table-cell">{o.items.length}</Td>
                  <Td className="hidden whitespace-nowrap text-muted md:table-cell">{o.lab ?? '—'}</Td>
                  <Td className="hidden whitespace-nowrap text-muted lg:table-cell">{formatDate(o.orderedAt, locale)}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[o.status]} dot>
                      {t(`status.${o.status}`)}
                    </Badge>
                  </Td>
                  <Td>
                    <ChevronRight className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-muted" />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Order detail sheet */}
      <Sheet open={!!selected} onClose={() => setSelectedId(null)}>
        {selected && <OrderDetail order={selected} onAdvance={doAdvance} locale={locale} />}
      </Sheet>

      {/* New order modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('order')} size="sm">
        <div className="flex flex-col gap-4 p-5">
          <Field label={t('columns.patient')}>
            <select
              value={newPatientId}
              onChange={(e) => setNewPatientId(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">{tc('actions.select')}</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium">{t('selectExams')}</p>
            <div className="space-y-1.5">
              {PRESET_PANELS.map((panel) => (
                <label key={panel.code + panel.name} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-hairline p-2.5 hover:bg-ink/[0.02]">
                  <input
                    type="checkbox"
                    className="accent-brand-600"
                    checked={selectedItems.includes(panel.code)}
                    onChange={(e) => {
                      setSelectedItems((prev) =>
                        e.target.checked ? [...prev, panel.code] : prev.filter((c) => c !== panel.code)
                      );
                    }}
                  />
                  <span className="text-sm">{panel.name}</span>
                  <span className="ml-auto font-mono text-2xs text-subtle">{panel.code}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>{tc('actions.cancel')}</Button>
            <Button disabled={!newPatientId || selectedItems.length === 0} onClick={doAdd}>
              {t('order')}
            </Button>
          </div>
        </div>
      </Modal>
    </ScreenContainer>
  );
}

function OrderDetail({
  order,
  onAdvance,
  locale,
}: {
  order: LabOrder;
  onAdvance: (o: LabOrder) => void;
  locale: string;
}) {
  const t = useTranslations('exams');
  const tc = useTranslations('common');
  const patient = getPatient(order.patientId);
  const next = STATUS_NEXT[order.status];

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-hairline p-5">
        {patient && (
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={patient.name} hue={patient.hue} size={44} />
            <div>
              <p className="font-semibold">{patient.name}</p>
              <p className="text-xs text-muted">{patient.payer}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Badge tone={STATUS_TONE[order.status]} dot>{t(`status.${order.status}`)}</Badge>
          {order.lab && <span className="text-xs text-muted">{order.lab}</span>}
          {order.priority !== 'routine' && (
            <Badge tone="danger">{t(`priority.${order.priority}`)}</Badge>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
          <span>{t('columns.ordered')}: {formatDate(order.orderedAt, locale)}</span>
          {order.collectedAt && <span>{t('columns.collected')}: {formatDate(order.collectedAt, locale)}</span>}
          {order.resultedAt && <span>{t('columns.resulted')}: {formatDate(order.resultedAt, locale)}</span>}
        </div>
      </div>

      <div className="flex-1 p-5">
        <p className="mb-3 text-2xs font-semibold uppercase tracking-wide text-subtle">{t('columns.items')}</p>
        <div className="space-y-2">
          <AnimatePresence>
            {order.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'rounded-xl border p-3',
                  item.flag === 'C' ? 'border-danger-400/50 bg-danger-400/5' :
                  item.flag === 'H' || item.flag === 'L' ? 'border-warning-400/50 bg-warning-400/5' :
                  'border-hairline bg-surface/40',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="font-mono text-2xs text-subtle">{item.code}</p>
                  </div>
                  {item.value && (
                    <div className="text-right">
                      <p className={cn('text-sm font-semibold', item.flag ? 'text-warning-600' : 'text-ink')}>
                        {item.value} {item.unit}
                      </p>
                      {item.refRange && <p className="text-2xs text-subtle">ref: {item.refRange}</p>}
                    </div>
                  )}
                  {item.flag && (
                    <span className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-2xs font-bold',
                      item.flag === 'C' ? 'bg-danger-500 text-white' : 'bg-warning-500 text-white',
                    )}>
                      {item.flag}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {next && (
        <div className="border-t border-hairline p-4">
          <Button className="w-full" onClick={() => onAdvance(order)}>
            {t(`advance.${next}`)}
          </Button>
        </div>
      )}
    </div>
  );
}
