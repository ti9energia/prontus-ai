'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  LayoutTemplate,
  Plus,
  Stethoscope,
  HeartPulse,
  Baby,
  Bone,
  Sun,
  Flower2,
  Pencil,
  Copy,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { listTemplates, setDefaultTemplate, duplicateTemplate } from '@/lib/data';
import type { NoteSectionKey, Template } from '@/lib/types';
import { toast } from '@/lib/toast';
import { ScreenContainer, ScreenHeader } from './_kit';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { EmptyState } from '@/components/ui/feedback';
import { cn } from '@/lib/utils';

type SpecTone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const SPEC_VISUAL: Record<string, { icon: LucideIcon; tone: SpecTone }> = {
  clinica: { icon: Stethoscope, tone: 'brand' },
  cardio: { icon: HeartPulse, tone: 'danger' },
  pediatria: { icon: Baby, tone: 'info' },
  ortopedia: { icon: Bone, tone: 'accent' },
  dermato: { icon: Sun, tone: 'warning' },
  gineco: { icon: Flower2, tone: 'success' },
};

const TONE_CLS: Record<SpecTone, string> = {
  brand: 'text-brand-600 bg-brand-600/10',
  accent: 'text-accent-500 bg-accent-400/12',
  success: 'text-success-fg dark:text-success bg-success/12',
  warning: 'text-warning-fg dark:text-warning bg-warning/12',
  danger: 'text-danger-fg dark:text-danger bg-danger/12',
  info: 'text-info-fg dark:text-info bg-info/12',
};

const SPEC_KEYS = Object.keys(SPEC_VISUAL);
const SECTION_KEYS: NoteSectionKey[] = ['queixa', 'hma', 'exame', 'hipoteses', 'conduta'];

export function TemplatesScreen({ paneId }: { paneId: string }) {
  void paneId;
  const t = useTranslations('templates');
  const tSec = useTranslations('encounter.sections');
  const tc = useTranslations('common');
  const tf = useTranslations('feedback');
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const [, force] = React.useReducer((x) => x + 1, 0);

  const templates = listTemplates();

  // Display names live outside the Template model (which is specialty-based),
  // so they're kept in local React state and overlaid on the card title.
  const [names, setNames] = React.useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [fName, setFName] = React.useState('');
  const [fSpec, setFSpec] = React.useState<string>(SPEC_KEYS[0]);
  const [fSections, setFSections] = React.useState<NoteSectionKey[]>([...SECTION_KEYS]);

  const onSetDefault = (id: string) => {
    setDefaultTemplate(id);
    force();
    toast.success(tf('saved'));
  };
  const onDuplicate = (id: string) => {
    duplicateTemplate(id);
    force();
    toast.success(tf('duplicated'));
  };

  const openAdd = () => {
    setEditId(null);
    setFName('');
    setFSpec(SPEC_KEYS[0]);
    setFSections([...SECTION_KEYS]);
    setModalOpen(true);
  };
  const openEdit = (tpl: Template) => {
    setEditId(tpl.id);
    setFName(names[tpl.id] ?? '');
    setFSpec(tpl.specialtyKey);
    setFSections([...tpl.sectionKeys]);
    setModalOpen(true);
  };
  const toggleSection = (key: NoteSectionKey) =>
    setFSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  const onSubmit = () => {
    if (fSections.length === 0) return;
    const name = fName.trim();
    const sectionKeys = SECTION_KEYS.filter((k) => fSections.includes(k));
    if (editId) {
      const tpl = templates.find((x) => x.id === editId);
      if (tpl) {
        tpl.specialtyKey = fSpec;
        tpl.sectionKeys = sectionKeys;
      }
      setNames((prev) => ({ ...prev, [editId]: name }));
      force();
      toast.success(tf('saved'));
    } else {
      const newId = `tpl_${String(templates.length + 1).padStart(4, '0')}`;
      templates.push({
        id: newId,
        specialtyKey: fSpec,
        locale: 'pt-BR',
        sectionKeys,
        usedCount: 0,
        isDefault: false,
      });
      if (name) setNames((prev) => ({ ...prev, [newId]: name }));
      force();
      toast.success(tf('added'));
    }
    setModalOpen(false);
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={LayoutTemplate}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>{t('add')}</Button>}
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="h-6 w-6" />}
          title={tc('states.empty')}
          description={t('subtitle')}
          action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>{t('add')}</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const visual = SPEC_VISUAL[tpl.specialtyKey] ?? { icon: Stethoscope, tone: 'brand' };
            const Icon = visual.icon;
            return (
              <Card key={tpl.id} hover className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                          TONE_CLS[visual.tone],
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-base font-semibold tracking-tight">
                          {names[tpl.id]?.trim() || t(`specialties.${tpl.specialtyKey}`)}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted">
                          {t('usedIn', { count: tpl.usedCount })}
                        </p>
                      </div>
                    </div>
                    {tpl.isDefault && <Badge tone="brand">{t('default')}</Badge>}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {tpl.sectionKeys.map((key) => (
                      <span
                        key={key}
                        className="inline-flex items-center rounded-md bg-ink/[0.05] px-2 py-1 text-2xs font-medium text-muted"
                      >
                        {tSec(key as NoteSectionKey)}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="flex-wrap gap-2 border-t border-hairline/60 pt-4">
                  <Button size="sm" variant="outline" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => openEdit(tpl)}>
                    {t('edit')}
                  </Button>
                  <Button size="sm" variant="ghost" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={() => onDuplicate(tpl.id)}>
                    {t('duplicate')}
                  </Button>
                  {!tpl.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-brand-600 hover:text-brand-700"
                      leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      onClick={() => onSetDefault(tpl.id)}
                    >
                      {t('setDefault')}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? t('edit') : t('add')}
        size="sm"
      >
        <div className="flex flex-col gap-4 p-5">
          <Field label={L('Nome do modelo', 'Template name', '模板名称', 'Nom du modèle')}>
            <Input
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              placeholder={t(`specialties.${fSpec}`)}
              autoFocus
            />
          </Field>
          <Field label={t('specialty')}>
            <Select value={fSpec} onChange={(e) => setFSpec(e.target.value)}>
              {SPEC_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(`specialties.${k}`)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] font-medium text-ink/90">{t('sections')}</span>
            <div className="flex flex-wrap gap-1.5">
              {SECTION_KEYS.map((key) => {
                const active = fSections.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleSection(key)}
                    className={cn(
                      'inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'bg-brand-600/10 text-brand-600'
                        : 'bg-ink/[0.05] text-muted hover:bg-ink/[0.08]',
                    )}
                  >
                    {tSec(key)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button onClick={onSubmit} disabled={fSections.length === 0}>
              {editId ? tc('actions.save') : tc('actions.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </ScreenContainer>
  );
}
