'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  FileText,
  Plus,
  Pill,
  FileCheck2,
  Share2,
  FileSignature,
  ClipboardList,
  FlaskConical,
  ShieldCheck,
  Trash2,
  Eye,
  Download,
  type LucideIcon,
} from 'lucide-react';
import { listPatients, getCurrentUser } from '@/lib/data';
import { ScreenContainer, ScreenHeader, Table, Th, Td } from './_kit';
import { Avatar } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { EmptyState } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';

type DocType = 'receita' | 'atestado' | 'encaminhamento' | 'declaracao' | 'relatorio' | 'pedidoExame' | 'termo';

const DOC_META: Record<DocType, { icon: LucideIcon; tone: React.ComponentProps<typeof Badge>['tone'] }> = {
  receita: { icon: Pill, tone: 'brand' },
  atestado: { icon: FileCheck2, tone: 'success' },
  encaminhamento: { icon: Share2, tone: 'info' },
  declaracao: { icon: FileSignature, tone: 'neutral' },
  relatorio: { icon: ClipboardList, tone: 'accent' },
  pedidoExame: { icon: FlaskConical, tone: 'warning' },
  termo: { icon: ShieldCheck, tone: 'brand' },
};

const DOC_TYPES: DocType[] = ['receita', 'pedidoExame', 'atestado', 'encaminhamento', 'declaracao', 'relatorio', 'termo'];

interface DocRecord {
  id: string;
  type: DocType;
  patientId: string;
  patientName: string;
  content: string;
  createdAt: string;
}

let seq = 100;
const uid = () => `doc_${(seq += 1)}`;

export function DocumentsScreen() {
  const t = useTranslations('documents');
  const tc = useTranslations('common');
  const tf = useTranslations('feedback');
  const locale = useLocale();
  const patients = listPatients();
  const user = getCurrentUser();

  const [docs, setDocs] = React.useState<DocRecord[]>(() => [
    {
      id: 'doc_1',
      type: 'receita',
      patientId: patients[0]?.id ?? '',
      patientName: patients[0]?.name ?? '—',
      content: 'Losartana 50mg — 1 comp 12/12h por 30 dias.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'doc_2',
      type: 'atestado',
      patientId: patients[1]?.id ?? '',
      patientName: patients[1]?.name ?? '—',
      content: 'Afastamento de 2 dias por motivo de saúde.',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [newType, setNewType] = React.useState<DocType>('receita');
  const [newPatient, setNewPatient] = React.useState(patients[0]?.id ?? '');
  const [newContent, setNewContent] = React.useState('');
  const [viewing, setViewing] = React.useState<DocRecord | null>(null);

  const create = () => {
    const p = patients.find((x) => x.id === newPatient);
    const doc: DocRecord = {
      id: uid(),
      type: newType,
      patientId: newPatient,
      patientName: p?.name ?? '—',
      content: newContent.trim() || t(`placeholders.${newType}` as 'placeholders.receita'),
      createdAt: new Date().toISOString(),
    };
    setDocs((d) => [doc, ...d]);
    setCreateOpen(false);
    setNewContent('');
    toast.success(tf('added'));
  };

  const remove = (id: string) => {
    setDocs((d) => d.filter((x) => x.id !== id));
    toast.success(tf('removed'));
  };

  const download = (doc: DocRecord) => {
    const head = t(`types.${doc.type}` as 'types.receita');
    const sign = t('signedBy', { name: user.name, council: user.council });
    const body = `${head} — ${doc.patientName}\n${formatDate(doc.createdAt, locale)}\n\n${doc.content}\n\n${sign}\n`;
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.type}-${doc.patientName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={FileText}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
            {t('new')}
          </Button>
        }
      />

      {/* quick generate row */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {DOC_TYPES.map((type) => {
          const Icon = DOC_META[type].icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                setNewType(type);
                setNewContent('');
                setCreateOpen(true);
              }}
              className="group flex flex-col items-center gap-2 rounded-xl border border-hairline bg-card/70 p-3 text-center transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600/10 text-brand-600">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="text-2xs font-medium leading-tight">{t(`types.${type}` as 'types.receita')}</span>
            </button>
          );
        })}
      </div>

      {docs.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title={tc('states.empty')} description={t('subtitle')} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t('columns.type')}</Th>
              <Th>{t('columns.patient')}</Th>
              <Th className="hidden sm:table-cell">{t('columns.date')}</Th>
              <Th className="text-right">{t('columns.actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => {
              const meta = DOC_META[doc.type];
              const Icon = meta.icon;
              return (
                <tr key={doc.id} className="transition-colors hover:bg-ink/[0.02]">
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <span className={cn('grid h-7 w-7 place-items-center rounded-md bg-ink/[0.05]')}>
                        <Icon className="h-4 w-4 text-brand-600" />
                      </span>
                      <Badge tone={meta.tone}>{t(`types.${doc.type}` as 'types.receita')}</Badge>
                    </span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={doc.patientName} hue={(doc.patientName.length * 47) % 360} size={28} />
                      <span className="font-medium">{doc.patientName}</span>
                    </span>
                  </Td>
                  <Td className="hidden whitespace-nowrap text-muted sm:table-cell">{formatDate(doc.createdAt, locale)}</Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewing(doc)}
                        aria-label={t('view')}
                        className="grid h-8 w-8 place-items-center rounded-md text-subtle hover:bg-ink/[0.06] hover:text-ink"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => download(doc)}
                        aria-label={t('download')}
                        className="grid h-8 w-8 place-items-center rounded-md text-subtle hover:bg-ink/[0.06] hover:text-ink"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(doc.id)}
                        aria-label={tc('actions.delete')}
                        className="grid h-8 w-8 place-items-center rounded-md text-subtle transition-colors hover:bg-danger/10 hover:text-danger-fg dark:hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('new')}>
        <div className="flex flex-col gap-4 p-5">
          <Field label={t('columns.type')}>
            <Select value={newType} onChange={(e) => setNewType(e.target.value as DocType)}>
              {DOC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`types.${type}` as 'types.receita')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('columns.patient')}>
            <Select value={newPatient} onChange={(e) => setNewPatient(e.target.value)}>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('content')} hint={t('contentHint')}>
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={t(`placeholders.${newType}` as 'placeholders.receita')}
            />
          </Field>
          <div className="rounded-lg border border-hairline bg-surface/50 px-3 py-2 text-2xs text-muted">
            {t('signedBy', { name: user.name, council: user.council })}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={create}>
              {t('generate')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* view modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? t(`types.${viewing.type}` as 'types.receita') : ''}
        description={viewing?.patientName}
      >
        {viewing && (
          <div className="flex flex-col gap-4 p-5">
            <div className="whitespace-pre-wrap rounded-xl border border-hairline bg-surface/40 p-4 text-sm leading-relaxed">
              {viewing.content}
            </div>
            <div className="text-2xs text-muted">{t('signedBy', { name: user.name, council: user.council })}</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => download(viewing)}>
                {t('download')}
              </Button>
              <Button onClick={() => setViewing(null)}>{tc('actions.close')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </ScreenContainer>
  );
}
