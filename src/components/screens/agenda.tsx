'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import {
  CalendarClock,
  CalendarDays,
  Plus,
  Check,
  CheckCheck,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Video,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { listPatients } from '@/lib/data/store';
import { ScreenContainer, ScreenHeader, Table, Th, Td } from './_kit';
import { Avatar } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { EmptyState } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { formatLongDate, cn } from '@/lib/utils';

type ApptType = 'presencial' | 'teleconsulta';
type ApptStatus = 'agendado' | 'confirmado' | 'concluido' | 'cancelado';

const TYPE_META: Record<ApptType, { icon: LucideIcon; tone: React.ComponentProps<typeof Badge>['tone'] }> = {
  presencial: { icon: MapPin, tone: 'neutral' },
  teleconsulta: { icon: Video, tone: 'accent' },
};

const STATUS_TONE: Record<ApptStatus, React.ComponentProps<typeof Badge>['tone']> = {
  agendado: 'info',
  confirmado: 'brand',
  concluido: 'success',
  cancelado: 'danger',
};

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  hue: number;
  date: string; // YYYY-MM-DD (local)
  time: string; // HH:mm
  type: ApptType;
  status: ApptStatus;
}

/* Local-date helpers — kept TZ-safe by building dates from parts, never parsing ISO. */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function shiftDay(s: string, delta: number): string {
  const d = parseYmd(s);
  d.setDate(d.getDate() + delta);
  return ymd(d);
}

let seq = 200;
const uid = () => `appt_${(seq += 1)}`;

export function AgendaScreen() {
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const patients = listPatients();
  const today = React.useMemo(() => ymd(new Date()), []);

  const [appts, setAppts] = React.useState<Appointment[]>(() => {
    const rows: Array<[number, string, ApptType, ApptStatus]> = [
      [0, '08:30', 'presencial', 'confirmado'],
      [1, '09:15', 'presencial', 'agendado'],
      [2, '10:00', 'teleconsulta', 'agendado'],
      [3, '11:30', 'presencial', 'concluido'],
      [4, '14:00', 'teleconsulta', 'agendado'],
      [5, '15:30', 'presencial', 'cancelado'],
    ];
    return rows.map(([i, time, type, status], k) => {
      const p = patients[i];
      return {
        id: `appt_${k + 1}`,
        patientId: p?.id ?? '',
        patientName: p?.name ?? '—',
        hue: p?.hue ?? (k * 47) % 360,
        date: today,
        time,
        type,
        status,
      };
    });
  });

  const [day, setDay] = React.useState(today);

  const dayAppts = React.useMemo(
    () => appts.filter((a) => a.date === day).sort((a, b) => a.time.localeCompare(b.time)),
    [appts, day],
  );

  /* ----------------------------- labels ----------------------------- */
  const typeLabel = (ty: ApptType) =>
    ty === 'presencial'
      ? L('Presencial', 'In-person', '门诊', 'Présentiel')
      : L('Teleconsulta', 'Telehealth', '远程', 'Téléconsultation');
  const statusLabel = (st: ApptStatus) =>
    ({
      agendado: L('Agendado', 'Scheduled', '已安排', 'Planifié'),
      confirmado: L('Confirmado', 'Confirmed', '已确认', 'Confirmé'),
      concluido: L('Concluído', 'Completed', '已完成', 'Terminé'),
      cancelado: L('Cancelado', 'Cancelled', '已取消', 'Annulé'),
    })[st];

  /* ----------------------------- create ----------------------------- */
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    patientId: patients[0]?.id ?? '',
    date: today,
    time: '09:00',
    type: 'presencial' as ApptType,
  });

  const openCreate = () => {
    setForm({ patientId: patients[0]?.id ?? '', date: day, time: '09:00', type: 'presencial' });
    setCreateOpen(true);
  };

  const createAppt = () => {
    const p = patients.find((x) => x.id === form.patientId);
    const appt: Appointment = {
      id: uid(),
      patientId: form.patientId,
      patientName: p?.name ?? '—',
      hue: p?.hue ?? 200,
      date: form.date,
      time: form.time,
      type: form.type,
      status: 'agendado',
    };
    setAppts((list) => [...list, appt]);
    setDay(form.date); // jump to the day we just scheduled on, so it's visible
    setCreateOpen(false);
    toast.success(L('Consulta agendada', 'Appointment scheduled', '预约已创建', 'Rendez-vous planifié'));
  };

  /* --------------------------- status moves --------------------------- */
  const setStatus = (id: string, status: ApptStatus) =>
    setAppts((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));

  const confirmAppt = (a: Appointment) => {
    setStatus(a.id, 'confirmado');
    toast.success(L('Consulta confirmada', 'Appointment confirmed', '预约已确认', 'Rendez-vous confirmé'));
  };
  const completeAppt = (a: Appointment) => {
    setStatus(a.id, 'concluido');
    toast.success(L('Consulta concluída', 'Appointment completed', '预约已完成', 'Rendez-vous terminé'));
  };
  const cancelAppt = (a: Appointment) => {
    const ok = window.confirm(
      L('Cancelar esta consulta?', 'Cancel this appointment?', '取消这个预约？', 'Annuler ce rendez-vous ?'),
    );
    if (!ok) return;
    setStatus(a.id, 'cancelado');
    toast.success(L('Consulta cancelada', 'Appointment cancelled', '预约已取消', 'Rendez-vous annulé'));
  };

  /* ---------------------------- reschedule ---------------------------- */
  const [reschedule, setReschedule] = React.useState<Appointment | null>(null);
  const [rsForm, setRsForm] = React.useState({ date: today, time: '09:00' });

  const openReschedule = (a: Appointment) => {
    setRsForm({ date: a.date, time: a.time });
    setReschedule(a);
  };
  const applyReschedule = () => {
    if (!reschedule) return;
    const id = reschedule.id;
    setAppts((list) =>
      list.map((a) => (a.id === id ? { ...a, date: rsForm.date, time: rsForm.time, status: 'agendado' } : a)),
    );
    setDay(rsForm.date);
    setReschedule(null);
    toast.success(L('Consulta reagendada', 'Appointment rescheduled', '预约已改期', 'Rendez-vous reporté'));
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={CalendarClock}
        title={L('Agenda', 'Schedule', '日程', 'Agenda')}
        subtitle={L(
          'Sua agenda do dia — consultas, confirmações e reagendamentos.',
          'Your day at a glance — appointments, confirmations and reschedules.',
          '您的当日日程 — 预约、确认与改期。',
          'Votre agenda du jour — consultations, confirmations et reports.',
        )}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            {L('Nova consulta', 'New appointment', '新预约', 'Nouveau rendez-vous')}
          </Button>
        }
      />

      {/* day picker strip */}
      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-hairline bg-card px-3 py-2.5 shadow-xs">
        <button
          type="button"
          onClick={() => setDay(shiftDay(day, -1))}
          aria-label={L('Dia anterior', 'Previous day', '前一天', 'Jour précédent')}
          className="grid h-9 w-9 place-items-center rounded-md text-subtle hover:bg-ink/[0.06] hover:text-ink"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate font-display text-sm font-semibold capitalize tracking-tight">
            {formatLongDate(parseYmd(day), locale)}
          </p>
          <p className="text-2xs text-muted">
            {dayAppts.length} {L('consultas', 'appointments', '个预约', 'rendez-vous')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {day !== today && (
            <Button size="sm" variant="ghost" onClick={() => setDay(today)}>
              {L('Hoje', 'Today', '今天', "Aujourd'hui")}
            </Button>
          )}
          <button
            type="button"
            onClick={() => setDay(shiftDay(day, 1))}
            aria-label={L('Próximo dia', 'Next day', '后一天', 'Jour suivant')}
            className="grid h-9 w-9 place-items-center rounded-md text-subtle hover:bg-ink/[0.06] hover:text-ink"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {dayAppts.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title={L('Nenhuma consulta neste dia', 'No appointments this day', '当天没有预约', 'Aucun rendez-vous ce jour')}
          description={L(
            'Use "Nova consulta" para agendar.',
            'Use "New appointment" to schedule one.',
            '使用“新预约”进行安排。',
            'Utilisez « Nouveau rendez-vous » pour planifier.',
          )}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{L('Horário', 'Time', '时间', 'Heure')}</Th>
              <Th>{L('Paciente', 'Patient', '患者', 'Patient')}</Th>
              <Th className="hidden sm:table-cell">{L('Tipo', 'Type', '类型', 'Type')}</Th>
              <Th>{L('Status', 'Status', '状态', 'Statut')}</Th>
              <Th className="text-right">{L('Ações', 'Actions', '操作', 'Actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {dayAppts.map((a) => {
              const meta = TYPE_META[a.type];
              const TypeIcon = meta.icon;
              const canceled = a.status === 'cancelado';
              return (
                <tr key={a.id} className="transition-colors hover:bg-ink/[0.02]">
                  <Td>
                    <span className={cn('inline-flex items-center gap-2 font-medium tnum', canceled && 'text-subtle line-through')}>
                      <Clock className="h-3.5 w-3.5 text-subtle" />
                      {a.time}
                    </span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={a.patientName} hue={a.hue} size={28} />
                      <span className={cn('font-medium', canceled && 'text-muted line-through')}>{a.patientName}</span>
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <Badge tone={meta.tone}>
                      <TypeIcon className="h-3 w-3" />
                      {typeLabel(a.type)}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[a.status]} dot={a.status === 'confirmado'}>
                      {statusLabel(a.status)}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                      {a.status === 'agendado' && (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Check className="h-3.5 w-3.5" />}
                          onClick={() => confirmAppt(a)}
                        >
                          {L('Confirmar', 'Confirm', '确认', 'Confirmer')}
                        </Button>
                      )}
                      {a.status === 'confirmado' && (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
                          onClick={() => completeAppt(a)}
                        >
                          {L('Concluir', 'Complete', '完成', 'Terminer')}
                        </Button>
                      )}
                      {(a.status === 'agendado' || a.status === 'confirmado') && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<Clock className="h-3.5 w-3.5" />}
                            onClick={() => openReschedule(a)}
                          >
                            {L('Reagendar', 'Reschedule', '改期', 'Reporter')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger-fg hover:bg-danger/10 dark:text-danger"
                            leftIcon={<X className="h-3.5 w-3.5" />}
                            onClick={() => cancelAppt(a)}
                          >
                            {L('Cancelar', 'Cancel', '取消', 'Annuler')}
                          </Button>
                        </>
                      )}
                      {(a.status === 'concluido' || a.status === 'cancelado') && (
                        <span className="text-2xs text-subtle">—</span>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* new appointment modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={L('Nova consulta', 'New appointment', '新预约', 'Nouveau rendez-vous')}
      >
        <div className="flex flex-col gap-4 p-5">
          <Field label={L('Paciente', 'Patient', '患者', 'Patient')}>
            <Select value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={L('Data', 'Date', '日期', 'Date')}>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Field>
            <Field label={L('Horário', 'Time', '时间', 'Heure')}>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              />
            </Field>
          </div>
          <Field label={L('Tipo', 'Type', '类型', 'Type')}>
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ApptType }))}
            >
              <option value="presencial">{typeLabel('presencial')}</option>
              <option value="teleconsulta">{typeLabel('teleconsulta')}</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              {L('Cancelar', 'Cancel', '取消', 'Annuler')}
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={createAppt}>
              {L('Agendar', 'Schedule', '预约', 'Planifier')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* reschedule modal */}
      <Modal
        open={!!reschedule}
        onClose={() => setReschedule(null)}
        title={L('Reagendar consulta', 'Reschedule appointment', '改期预约', 'Reporter le rendez-vous')}
        description={reschedule?.patientName}
      >
        {reschedule && (
          <div className="flex flex-col gap-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label={L('Data', 'Date', '日期', 'Date')}>
                <Input
                  type="date"
                  value={rsForm.date}
                  onChange={(e) => setRsForm((f) => ({ ...f, date: e.target.value }))}
                />
              </Field>
              <Field label={L('Horário', 'Time', '时间', 'Heure')}>
                <Input
                  type="time"
                  value={rsForm.time}
                  onChange={(e) => setRsForm((f) => ({ ...f, time: e.target.value }))}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReschedule(null)}>
                {L('Cancelar', 'Cancel', '取消', 'Annuler')}
              </Button>
              <Button leftIcon={<Clock className="h-4 w-4" />} onClick={applyReschedule}>
                {L('Salvar', 'Save', '保存', 'Enregistrer')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ScreenContainer>
  );
}
