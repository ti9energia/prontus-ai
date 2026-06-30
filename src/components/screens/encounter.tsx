'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Mic, Pause, Play, Radio, ShieldCheck, Sparkles, Square, Stethoscope } from 'lucide-react';
import {
  ensureNote,
  getEncounter,
  getPatient,
  listEncounters,
} from '@/lib/data';
import type { NoteSectionKey } from '@/lib/types';
import { openTab } from '@/lib/workspace/store';
import { ScreenContainer } from './_kit';
import { AudioWave } from '@/components/visual/audio-wave';
import { Avatar, Switch } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/overlay';
import { toast } from '@/lib/toast';
import { clock, cn } from '@/lib/utils';
import { suggestCids, suggestProcs } from '@/lib/tuss';

type Line = { who: 'doctor' | 'patient'; text: string };
const NOTE_KEYS: NoteSectionKey[] = ['queixa', 'hma', 'exame', 'hipoteses', 'conduta'];

const SCRIPT: Record<string, { lines: Line[]; note: Record<NoteSectionKey, string> }> = {
  'pt-BR': {
    lines: [
      { who: 'patient', text: 'Doutora, estou com dor de cabeça quase toda manhã, faz umas duas semanas.' },
      { who: 'doctor', text: 'Entendi. Sente tontura junto? E vem medindo a pressão em casa?' },
      { who: 'patient', text: 'Um pouco de tontura, sim. Medi e deu 150 por 95.' },
      { who: 'doctor', text: 'A losartana você toma certinho? Vou examinar você agora.' },
      { who: 'patient', text: 'Confesso que às vezes esqueço de tomar.' },
      { who: 'doctor', text: 'Sua pressão está 152 por 96. Vamos ajustar a dose e pedir alguns exames.' },
    ],
    note: {
      queixa: 'Cefaleia occipital recorrente há 2 semanas, associada a tontura matinal.',
      hma: 'Cefaleia pulsátil de predomínio matinal, intensidade 6/10. Aferição domiciliar de PA elevada (150/95). Uso irregular de losartana 50 mg.',
      exame: 'PA 152/96 mmHg, FC 78 bpm. Ausculta cardíaca com ritmo regular, sem sopros. Restante do exame sem alterações.',
      hipoteses: 'Hipertensão arterial sistêmica com controle inadequado.',
      conduta: 'Ajuste de losartana para 12/12h, solicitar ECG e laboratório, orientações dietéticas. Retorno em 30 dias.',
    },
  },
  en: {
    lines: [
      { who: 'patient', text: 'Doctor, I get headaches almost every morning, for about two weeks.' },
      { who: 'doctor', text: 'I see. Any dizziness with it? Have you measured your blood pressure?' },
      { who: 'patient', text: 'A bit of dizziness, yes. I measured it: 150 over 95.' },
      { who: 'doctor', text: 'Are you taking losartan consistently? Let me examine you now.' },
      { who: 'patient', text: 'I admit I sometimes forget to take it.' },
      { who: 'doctor', text: 'Your pressure is 152 over 96. Let’s adjust the dose and order labs.' },
    ],
    note: {
      queixa: 'Recurrent occipital headache for 2 weeks, with morning dizziness.',
      hma: 'Pulsatile morning headache, intensity 6/10. Elevated home BP (150/95). Irregular use of losartan 50 mg.',
      exame: 'BP 152/96 mmHg, HR 78 bpm. Regular cardiac rhythm, no murmurs. Otherwise unremarkable.',
      hipoteses: 'Systemic arterial hypertension, inadequately controlled.',
      conduta: 'Increase losartan to twice daily, order ECG and labs, dietary advice. Follow-up in 30 days.',
    },
  },
  'zh-CN': {
    lines: [
      { who: 'patient', text: '医生，我almost每天早上都头痛，已经两周了。' },
      { who: 'doctor', text: '明白。会伴有头晕吗？在家量过血压吗？' },
      { who: 'patient', text: '有点头晕，量过，150/95。' },
      { who: 'doctor', text: '氯沙坦按时吃吗？我现在给你检查一下。' },
      { who: 'patient', text: '说实话有时会忘记吃。' },
      { who: 'doctor', text: '你的血压是152/96。我们调整剂量并开些检查。' },
    ],
    note: {
      queixa: '反复枕部头痛两周，伴晨起头晕。',
      hma: '搏动性晨起头痛，强度6/10。家庭血压偏高（150/95）。氯沙坦50mg服用不规律。',
      exame: '血压152/96 mmHg，心率78次/分。心律齐，无杂音。其余检查未见异常。',
      hipoteses: '系统性高血压，控制不佳。',
      conduta: '氯沙坦改为每日两次，开心电图及实验室检查，饮食指导。30天后复诊。',
    },
  },
  'fr-FR': {
    lines: [
      { who: 'patient', text: 'Docteur, j’ai mal à la tête presque chaque matin, depuis deux semaines.' },
      { who: 'doctor', text: 'Je vois. Des vertiges aussi ? Avez-vous mesuré votre tension ?' },
      { who: 'patient', text: 'Un peu de vertiges, oui. J’ai mesuré : 150 sur 95.' },
      { who: 'doctor', text: 'Prenez-vous bien le losartan ? Je vais vous examiner.' },
      { who: 'patient', text: 'J’avoue que j’oublie parfois de le prendre.' },
      { who: 'doctor', text: 'Votre tension est à 152 sur 96. Ajustons la dose et faisons un bilan.' },
    ],
    note: {
      queixa: 'Céphalées occipitales récurrentes depuis 2 semaines, avec vertiges matinaux.',
      hma: 'Céphalée pulsatile matinale, intensité 6/10. Tension élevée à domicile (150/95). Prise irrégulière de losartan 50 mg.',
      exame: 'TA 152/96 mmHg, FC 78 bpm. Rythme cardiaque régulier, sans souffle. Examen par ailleurs normal.',
      hipoteses: 'Hypertension artérielle systémique mal contrôlée.',
      conduta: 'Augmenter le losartan à deux fois/jour, ECG et bilan, conseils diététiques. Contrôle dans 30 jours.',
    },
  },
};

/** Derive CID/TUSS codes from the note text using the keyword matcher. */
function codesFromNote(noteText: string) {
  return {
    cids: suggestCids(noteText).length > 0 ? suggestCids(noteText) : [{ code: 'Z00', label: 'Exame médico geral', confidence: 0.5 }],
    procs: suggestProcs(noteText),
  };
}

function resolveEncounter(id?: string) {
  const all = listEncounters();
  if (id && id !== 'new') {
    const e = getEncounter(id);
    if (e) return e;
  }
  return all.find((e) => e.status === 'scheduled') ?? all[0];
}

export function EncounterScreen({ paneId, params }: { paneId: string; params?: Record<string, string> }) {
  const t = useTranslations('encounter');
  const locale = useLocale();
  const script = SCRIPT[locale] ?? SCRIPT['pt-BR'];

  const enc = resolveEncounter(params?.id);
  const patient = enc ? getPatient(enc.patientId) : undefined;

  const [phase, setPhase] = React.useState<'idle' | 'recording' | 'paused' | 'done'>('idle');
  const [consentOpen, setConsentOpen] = React.useState(false);
  const [consented, setConsented] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [visible, setVisible] = React.useState(0);
  const [noteStep, setNoteStep] = React.useState(0);
  const transcriptRef = React.useRef<HTMLDivElement>(null);
  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [asrReal, setAsrReal] = React.useState<boolean | null>(null);
  const [liveLines, setLiveLines] = React.useState<Line[]>([]);

  // timer
  React.useEffect(() => {
    if (phase !== 'recording') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // streaming engine
  React.useEffect(() => {
    if (phase !== 'recording') return;
    if (visible >= script.lines.length) return;
    const id = setTimeout(() => {
      setVisible((v) => {
        const nv = v + 1;
        if (nv >= 2) setNoteStep((n) => Math.min(NOTE_KEYS.length, n + 1));
        return nv;
      });
    }, 1700);
    return () => clearTimeout(id);
  }, [phase, visible, script.lines.length]);

  React.useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [visible, liveLines]);

  // Probe ASR capability once on mount.
  React.useEffect(() => {
    fetch('/api/ai/transcribe')
      .then((r) => r.json())
      .then((d: { real: boolean }) => setAsrReal(d.real))
      .catch(() => setAsrReal(false));
  }, []);

  // Cleanup media resources on unmount.
  React.useEffect(() => {
    return () => {
      mediaRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startConsent = () => setConsentOpen(true);
  const beginRecording = async () => {
    setConsentOpen(false);
    if (asrReal) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mr = new MediaRecorder(stream);
        mediaRef.current = mr;
        mr.ondataavailable = async (e) => {
          if (e.data.size < 100) return;
          const fd = new FormData();
          fd.append('audio', e.data);
          fd.append('locale', locale);
          const res = await fetch('/api/ai/transcribe', { method: 'POST', body: fd }).catch(() => null);
          if (res?.ok) {
            const { text } = (await res.json()) as { text: string };
            if (text) setLiveLines((prev) => [...prev, { who: 'patient', text }]);
          }
        };
        mr.start(5000);
      } catch {
        // Mic permission denied or unavailable — fall back to demo.
        setAsrReal(false);
      }
    }
    setPhase('recording');
  };

  const finish = () => {
    if (!enc) return;
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.requestData();
      mediaRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const note = ensureNote(enc.id);
    NOTE_KEYS.forEach((k) => {
      const sec = note.sections.find((s) => s.key === k);
      if (sec) {
        sec.content = script.note[k];
        sec.inferred = true;
        sec.confidence = 0.85;
        sec.approved = false;
      }
    });
    // Derive CID/TUSS codes from the actual note text.
    const fullText = NOTE_KEYS.map((k) => script.note[k]).join(' ');
    const { cids, procs } = codesFromNote(fullText);
    note.cids = cids;
    note.procedures = procs;
    note.version += 1;
    note.updatedAt = new Date().toISOString();
    note.approved = false;
    enc.hasNote = true;
    enc.status = 'review';
    enc.durationSec = seconds;
    setPhase('done');
    toast.success(t('draftSaved'));
    openTab('review', { id: enc.id }, { paneId });
  };

  if (!enc || !patient) {
    return (
      <ScreenContainer>
        <p className="text-muted">{t('transcriptEmpty')}</p>
      </ScreenContainer>
    );
  }

  const recording = phase === 'recording';
  const progressPct = (noteStep / NOTE_KEYS.length) * 100;
  const displayLines = asrReal ? liveLines : script.lines.slice(0, visible);

  return (
    <div className="flex h-full flex-col">
      {/* header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-card/60 px-5 py-3.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Avatar name={patient.name} hue={patient.hue} size={42} />
          <div>
            <p className="font-semibold leading-tight">{patient.name}</p>
            <p className="text-xs text-muted">
              {t('with', { name: 'Dra. Helena' })} · {patient.payer}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {phase !== 'idle' && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5',
                recording ? 'bg-accent-400/12' : 'bg-ink/[0.06]',
              )}
            >
              {recording ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-500" />
                </span>
              ) : (
                <Pause className="h-3.5 w-3.5 text-muted" />
              )}
              <span
                className={cn(
                  'font-mono text-xs font-semibold tracking-wide',
                  recording ? 'text-accent-600' : 'text-muted',
                )}
              >
                {recording ? t('live') : t('paused')}
              </span>
              <span className="tnum font-mono text-xs text-muted">{clock(seconds)}</span>
            </div>
          )}
        </div>
      </div>

      {/* body */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        {/* transcript */}
        <div className="flex min-h-0 flex-col border-b border-hairline lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-subtle">
              <Stethoscope className="h-3.5 w-3.5" /> {t('transcript')}
            </p>
          </div>
          <div ref={transcriptRef} className="min-h-[180px] flex-1 space-y-3 overflow-y-auto px-5 pb-4">
            {phase === 'idle' ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600/10 text-brand-600">
                  <Mic className="h-7 w-7" />
                </div>
                <p className="mt-4 max-w-xs text-sm text-muted">{t('transcriptEmpty')}</p>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {displayLines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('flex flex-col', line.who === 'doctor' ? 'items-end' : 'items-start')}
                    >
                      <span className="mb-0.5 text-2xs font-medium text-subtle">
                        {line.who === 'doctor' ? t('speakerDoctor') : t('speakerPatient')}
                      </span>
                      <p
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-snug',
                          line.who === 'doctor' ? 'bg-brand-600 text-white' : 'bg-ink/[0.06] text-ink',
                        )}
                      >
                        {line.text}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {recording && (asrReal ? true : visible < script.lines.length) && (
                  <span className="inline-flex items-center gap-1.5 text-2xs text-subtle">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                    {t('capturing')}
                  </span>
                )}
              </>
            )}
          </div>
          {/* waveform + controls */}
          <div className="border-t border-hairline px-5 py-4">
            <AudioWave active={recording} bars={64} height={40} color="#14c8c4" />
            <div className="mt-3 flex items-center justify-center gap-3">
              {phase === 'idle' && (
                <Button size="lg" leftIcon={<Radio className="h-4 w-4" />} onClick={startConsent}>
                  {t('record')}
                </Button>
              )}
              {recording && (
                <>
                  <Button variant="outline" size="lg" leftIcon={<Pause className="h-4 w-4" />} onClick={() => { mediaRef.current?.pause(); setPhase('paused'); }}>
                    {t('pause')}
                  </Button>
                  <Button
                    size="lg"
                    className="bg-accent-500 hover:bg-accent-600"
                    leftIcon={<Square className="h-4 w-4" />}
                    onClick={finish}
                  >
                    {t('finishToReview')}
                  </Button>
                </>
              )}
              {phase === 'paused' && (
                <>
                  <Button size="lg" leftIcon={<Play className="h-4 w-4" />} onClick={() => { mediaRef.current?.resume(); setPhase('recording'); }}>
                    {t('resume')}
                  </Button>
                  <Button variant="outline" size="lg" leftIcon={<Square className="h-4 w-4" />} onClick={finish}>
                    {t('finishToReview')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* live note */}
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-subtle">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" /> {t('note')}
            </p>
            <Badge tone="brand">{Math.round(progressPct)}%</Badge>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-6">
            <p className="text-xs text-muted">{t('noteBuilding')}</p>
            {NOTE_KEYS.map((k, i) => (
              <div key={k} className="rounded-xl border border-hairline bg-surface/40 p-3.5">
                <p className="mb-1.5 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                  {t(`sections.${k}` as 'sections.queixa')}
                  {noteStep > i && <Check className="h-3 w-3" />}
                </p>
                {noteStep > i ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm leading-relaxed text-ink/90"
                  >
                    {script.note[k]}
                  </motion.p>
                ) : (
                  <div className="space-y-1.5">
                    <div className="skeleton h-2.5 w-full" />
                    <div className="skeleton h-2.5 w-4/5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* consent modal */}
      <Modal
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-600" /> {t('consent.title')}
          </span>
        }
        description={t('consent.body')}
      >
        <div className="p-5">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-hairline bg-surface/50 p-3.5">
            <Switch checked={consented} onChange={setConsented} aria-label={t('consent.checkbox')} />
            <span className="text-sm">{t('consent.checkbox')}</span>
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConsentOpen(false)}>
              {t('consent.cancel')}
            </Button>
            <Button disabled={!consented} leftIcon={<Radio className="h-4 w-4" />} onClick={beginRecording}>
              {t('consent.start')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
