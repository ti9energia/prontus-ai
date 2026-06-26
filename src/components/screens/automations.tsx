'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import {
  Workflow,
  Plus,
  Settings2,
  Clock,
  CalendarCheck,
  Mic,
  FileCheck2,
  Repeat,
  ClipboardList,
  FileQuestion,
  Ear,
  AudioLines,
  Stethoscope,
  FileText,
  Pill,
  ReceiptText,
  MessageCircle,
  Star,
  CalendarClock,
  FlaskConical,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { ScreenContainer, ScreenHeader, SectionTitle } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { Switch } from '@/components/ui/misc';
import { toast } from '@/lib/toast';

/** A localized 4-tuple: [pt-BR, en, zh-CN, fr-FR]. */
type Loc = [string, string, string, string];

type PhaseKey = 'before' | 'during' | 'after' | 'followup';
type Channel = 'whatsapp' | 'sms' | 'email' | 'app' | 'internal';
type TimingKey =
  | '24h'
  | '1h'
  | 'onStart'
  | 'realtime'
  | 'onFinish'
  | 'after1d'
  | 'after7d'
  | 'after30d';

interface Automation {
  id: string;
  phase: PhaseKey;
  icon: LucideIcon;
  name: Loc;
  desc: Loc;
  message: Loc;
  timing: TimingKey;
  channel: Channel;
  enabled: boolean;
}

const PHASES: { key: PhaseKey; icon: LucideIcon; title: Loc; desc: Loc }[] = [
  {
    key: 'before',
    icon: CalendarCheck,
    title: ['Antes da consulta', 'Before the visit', '就诊前', 'Avant la consultation'],
    desc: [
      'Prepare o paciente e os dados antes de ele chegar.',
      'Prepare the patient and data before they arrive.',
      '在患者到达前准备好患者与数据。',
      "Préparez le patient et les données avant son arrivée.",
    ],
  },
  {
    key: 'during',
    icon: Mic,
    title: ['Durante', 'During', '就诊中', 'Pendant'],
    desc: [
      'A IA escuta, transcreve e estrutura em tempo real.',
      'AI listens, transcribes and structures in real time.',
      'AI 实时聆听、转录并结构化。',
      "L'IA écoute, transcrit et structure en temps réel.",
    ],
  },
  {
    key: 'after',
    icon: FileCheck2,
    title: ['Após', 'After', '就诊后', 'Après'],
    desc: [
      'Documentos e faturamento gerados ao finalizar.',
      'Documents and billing generated when you finish.',
      '结束时生成文档与账单。',
      'Documents et facturation générés à la fin.',
    ],
  },
  {
    key: 'followup',
    icon: Repeat,
    title: ['Follow-up inteligente', 'Smart follow-up', '智能随访', 'Suivi intelligent'],
    desc: [
      'Reengaje o paciente e feche o ciclo de cuidado.',
      'Re-engage the patient and close the care loop.',
      '重新联系患者，闭合诊疗环。',
      'Réengagez le patient et bouclez le parcours de soin.',
    ],
  },
];

const CHANNELS: Channel[] = ['whatsapp', 'sms', 'email', 'app', 'internal'];
const TIMINGS: TimingKey[] = [
  '24h',
  '1h',
  'onStart',
  'realtime',
  'onFinish',
  'after1d',
  'after7d',
  'after30d',
];

let seq = 400;
const uid = () => `auto_${(seq += 1)}`;
const mkLoc = (s: string): Loc => [s, s, s, s];

function seedAutomations(): Automation[] {
  return [
    /* ----------------------------- before ----------------------------- */
    {
      id: 'auto_1',
      phase: 'before',
      icon: CalendarCheck,
      name: ['Confirmação automática', 'Automatic confirmation', '自动确认', 'Confirmation automatique'],
      desc: [
        'Confirma presença por WhatsApp/SMS e atualiza a agenda.',
        'Confirms attendance via WhatsApp/SMS and updates the schedule.',
        '通过 WhatsApp/短信确认就诊并更新日程。',
        "Confirme la présence par WhatsApp/SMS et met à jour l'agenda.",
      ],
      message: [
        'Olá! Confirmando sua consulta amanhã. Responda SIM para confirmar.',
        'Hi! Confirming your appointment tomorrow. Reply YES to confirm.',
        '您好！确认您明天的预约。回复 SIM 以确认。',
        'Bonjour ! Confirmation de votre rendez-vous demain. Répondez OUI pour confirmer.',
      ],
      timing: '24h',
      channel: 'whatsapp',
      enabled: true,
    },
    {
      id: 'auto_2',
      phase: 'before',
      icon: ClipboardList,
      name: ['Coleta de dados', 'Data collection', '数据收集', 'Collecte de données'],
      desc: [
        'Solicita carteirinha e documentos antes da consulta.',
        'Requests insurance card and documents before the visit.',
        '就诊前索取医保卡和证件。',
        "Demande la carte d'assurance et les documents avant la consultation.",
      ],
      message: [
        'Envie foto da carteirinha e documento para agilizar.',
        'Send a photo of your insurance card and ID to speed things up.',
        '请发送医保卡和证件照片以加快流程。',
        "Envoyez une photo de votre carte et pièce d'identité.",
      ],
      timing: '24h',
      channel: 'whatsapp',
      enabled: true,
    },
    {
      id: 'auto_3',
      phase: 'before',
      icon: FileQuestion,
      name: ['Pré-anamnese', 'Pre-anamnesis', '预问诊', 'Pré-anamnèse'],
      desc: [
        'Envia questionário de sintomas e histórico para preencher antes.',
        'Sends a symptoms and history questionnaire to fill in beforehand.',
        '发送症状和病史问卷供提前填写。',
        'Envoie un questionnaire de symptômes et antécédents à remplir.',
      ],
      message: [
        'Responda algumas perguntas rápidas antes da consulta.',
        'Answer a few quick questions before your appointment.',
        '就诊前回答几个简短问题。',
        'Répondez à quelques questions avant votre rendez-vous.',
      ],
      timing: '1h',
      channel: 'app',
      enabled: false,
    },
    /* ----------------------------- during ----------------------------- */
    {
      id: 'auto_4',
      phase: 'during',
      icon: Ear,
      name: ['Escuta ativa', 'Active listening', '主动聆听', 'Écoute active'],
      desc: [
        'Captura o áudio da consulta com consentimento do paciente.',
        "Captures consultation audio with the patient's consent.",
        '在患者同意下采集就诊音频。',
        "Capture l'audio de la consultation avec le consentement du patient.",
      ],
      message: [
        'Gravação iniciada com consentimento.',
        'Recording started with consent.',
        '已在同意下开始录音。',
        'Enregistrement démarré avec consentement.',
      ],
      timing: 'onStart',
      channel: 'internal',
      enabled: true,
    },
    {
      id: 'auto_5',
      phase: 'during',
      icon: AudioLines,
      name: ['Transcrição em tempo real', 'Real-time transcription', '实时转录', 'Transcription en temps réel'],
      desc: [
        'Transcreve a conversa enquanto você atende.',
        'Transcribes the conversation while you see the patient.',
        '在您接诊时转录对话。',
        'Transcrit la conversation pendant la consultation.',
      ],
      message: [
        'Transcrição ao vivo ativa.',
        'Live transcription active.',
        '实时转录已启用。',
        'Transcription en direct active.',
      ],
      timing: 'realtime',
      channel: 'internal',
      enabled: true,
    },
    {
      id: 'auto_6',
      phase: 'during',
      icon: Stethoscope,
      name: ['Estruturação do prontuário', 'Record structuring', '病历结构化', 'Structuration du dossier'],
      desc: [
        'Organiza a fala em queixa, exame e conduta.',
        'Organizes speech into complaint, exam and plan.',
        '将对话整理为主诉、检查与处置。',
        'Organise le discours en motif, examen et conduite.',
      ],
      message: [
        'Estruturando o prontuário automaticamente.',
        'Structuring the record automatically.',
        '正在自动结构化病历。',
        'Structuration automatique du dossier.',
      ],
      timing: 'realtime',
      channel: 'internal',
      enabled: true,
    },
    /* ------------------------------ after ----------------------------- */
    {
      id: 'auto_7',
      phase: 'after',
      icon: FileText,
      name: ['Geração de prontuário', 'Record generation', '病历生成', 'Génération du dossier'],
      desc: [
        'Monta o prontuário final para sua revisão e assinatura.',
        'Builds the final record for your review and signature.',
        '生成最终病历供您审核和签名。',
        'Génère le dossier final pour révision et signature.',
      ],
      message: [
        'Prontuário pronto para revisão.',
        'Record ready for review.',
        '病历已就绪待审核。',
        'Dossier prêt pour révision.',
      ],
      timing: 'onFinish',
      channel: 'internal',
      enabled: true,
    },
    {
      id: 'auto_8',
      phase: 'after',
      icon: Pill,
      name: ['Receita', 'Prescription', '处方', 'Ordonnance'],
      desc: [
        'Gera a receita a partir das prescrições da consulta.',
        "Generates the prescription from the visit's orders.",
        '根据就诊处方生成处方单。',
        'Génère ordonnance à partir des prescriptions.',
      ],
      message: [
        'Receita gerada e pronta para assinar.',
        'Prescription generated and ready to sign.',
        '处方已生成待签名。',
        'Ordonnance générée, prête à signer.',
      ],
      timing: 'onFinish',
      channel: 'internal',
      enabled: true,
    },
    {
      id: 'auto_9',
      phase: 'after',
      icon: FileCheck2,
      name: ['Guia TISS', 'TISS form', 'TISS 表单', 'Formulaire TISS'],
      desc: [
        'Preenche a guia TISS com procedimentos e códigos.',
        'Fills the TISS form with procedures and codes.',
        '用项目和编码填写 TISS 表单。',
        'Remplit le formulaire TISS avec actes et codes.',
      ],
      message: [
        'Guia TISS preenchida automaticamente.',
        'TISS form filled automatically.',
        'TISS 表单已自动填写。',
        'Formulaire TISS rempli automatiquement.',
      ],
      timing: 'onFinish',
      channel: 'internal',
      enabled: true,
    },
    {
      id: 'auto_10',
      phase: 'after',
      icon: ReceiptText,
      name: ['Faturamento', 'Billing', '计费', 'Facturation'],
      desc: [
        'Lança o faturamento e envia ao convênio ou particular.',
        'Posts billing and sends it to the payer or patient.',
        '生成账单并发送给保险或自费方。',
        "Enregistre la facturation et l'envoie au payeur.",
      ],
      message: ['Faturamento lançado.', 'Billing posted.', '账单已生成。', 'Facturation enregistrée.'],
      timing: 'onFinish',
      channel: 'internal',
      enabled: true,
    },
    /* ---------------------------- follow-up --------------------------- */
    {
      id: 'auto_11',
      phase: 'followup',
      icon: MessageCircle,
      name: ['Mensagem automática', 'Automatic message', '自动消息', 'Message automatique'],
      desc: [
        'Envia orientações de cuidado e resumo após a consulta.',
        'Sends care instructions and a summary after the visit.',
        '就诊后发送护理建议和摘要。',
        'Envoie des conseils de soins et un résumé après la visite.',
      ],
      message: [
        'Aqui está o resumo da sua consulta e orientações.',
        'Here is your visit summary and care instructions.',
        '这是您的就诊摘要和护理建议。',
        'Voici le résumé de votre consultation et vos conseils.',
      ],
      timing: 'onFinish',
      channel: 'whatsapp',
      enabled: true,
    },
    {
      id: 'auto_12',
      phase: 'followup',
      icon: Star,
      name: ['Pesquisa NPS', 'NPS survey', 'NPS 调查', 'Enquête NPS'],
      desc: [
        'Mede a satisfação com uma pergunta de 0 a 10.',
        'Measures satisfaction with a single 0–10 question.',
        '用 0 到 10 的问题衡量满意度。',
        'Mesure la satisfaction avec une question de 0 à 10.',
      ],
      message: [
        'De 0 a 10, quanto você recomendaria nossa clínica?',
        'From 0 to 10, how likely are you to recommend us?',
        '从 0 到 10，您有多大可能推荐我们？',
        'De 0 à 10, recommanderiez-vous notre clinique ?',
      ],
      timing: 'after1d',
      channel: 'whatsapp',
      enabled: false,
    },
    {
      id: 'auto_13',
      phase: 'followup',
      icon: CalendarClock,
      name: ['Lembrete de retorno', 'Return reminder', '复诊提醒', 'Rappel de retour'],
      desc: [
        'Avisa o paciente quando estiver na hora do retorno.',
        "Reminds the patient when it's time for a follow-up.",
        '到复诊时间时提醒患者。',
        'Prévient le patient quand il est temps de revenir.',
      ],
      message: [
        'Está na hora do seu retorno. Vamos agendar?',
        "It's time for your follow-up. Shall we schedule it?",
        '到您复诊的时间了，预约一下吧？',
        'Il est temps de votre suivi. On planifie ?',
      ],
      timing: 'after30d',
      channel: 'whatsapp',
      enabled: true,
    },
    {
      id: 'auto_14',
      phase: 'followup',
      icon: FlaskConical,
      name: ['Solicitação de exames', 'Exam request', '检查申请', "Demande d'examens"],
      desc: [
        'Envia o pedido de exames e orienta o agendamento.',
        'Sends the exam order and guides scheduling.',
        '发送检查申请并指导预约。',
        'Envoie la demande d examens et guide la prise de rendez-vous.',
      ],
      message: [
        'Seu pedido de exames está disponível. Agende a coleta.',
        'Your exam order is ready. Book your collection.',
        '您的检查申请已就绪，请预约采样。',
        'Votre demande d examens est prête. Planifiez le prélèvement.',
      ],
      timing: 'after7d',
      channel: 'app',
      enabled: false,
    },
  ];
}

export function AutomationsScreen() {
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const T = (loc: Loc) => L(loc[0], loc[1], loc[2], loc[3]);

  const [items, setItems] = React.useState<Automation[]>(seedAutomations);

  /* ----------------------------- labels ----------------------------- */
  const channelLabel = (c: Channel) =>
    ({
      whatsapp: 'WhatsApp',
      sms: 'SMS',
      email: L('E-mail', 'Email', '电子邮件', 'E-mail'),
      app: L('App', 'App', '应用', 'Appli'),
      internal: L('Interno', 'Internal', '内部', 'Interne'),
    })[c];

  const timingLabel = (tk: TimingKey) =>
    ({
      '24h': L('24h antes', '24h before', '提前24小时', '24 h avant'),
      '1h': L('1h antes', '1h before', '提前1小时', '1 h avant'),
      onStart: L('Ao iniciar', 'On start', '开始时', 'Au démarrage'),
      realtime: L('Em tempo real', 'Real-time', '实时', 'Temps réel'),
      onFinish: L('Ao finalizar', 'On finish', '结束时', 'À la fin'),
      after1d: L('1 dia depois', '1 day after', '1天后', '1 jour après'),
      after7d: L('7 dias depois', '7 days after', '7天后', '7 jours après'),
      after30d: L('30 dias depois', '30 days after', '30天后', '30 jours après'),
    })[tk];

  /* ----------------------------- toggle ----------------------------- */
  const toggle = (a: Automation) => {
    const nowOn = !a.enabled;
    setItems((list) => list.map((x) => (x.id === a.id ? { ...x, enabled: nowOn } : x)));
    toast.success(
      nowOn
        ? L('Automação ativada', 'Automation enabled', '自动化已启用', 'Automatisation activée')
        : L('Automação desativada', 'Automation disabled', '自动化已停用', 'Automatisation désactivée'),
    );
  };

  /* ----------------------------- config ----------------------------- */
  const [configId, setConfigId] = React.useState<string | null>(null);
  const configItem = items.find((a) => a.id === configId) ?? null;
  const [draft, setDraft] = React.useState<{ timing: TimingKey; channel: Channel; message: string }>({
    timing: '24h',
    channel: 'whatsapp',
    message: '',
  });

  const openConfig = (a: Automation) => {
    setDraft({ timing: a.timing, channel: a.channel, message: T(a.message) });
    setConfigId(a.id);
  };

  const saveConfig = () => {
    if (!configId) return;
    setItems((list) =>
      list.map((a) =>
        a.id === configId
          ? { ...a, timing: draft.timing, channel: draft.channel, message: mkLoc(draft.message.trim() || T(a.message)) }
          : a,
      ),
    );
    setConfigId(null);
    toast.success(L('Configuração salva', 'Configuration saved', '配置已保存', 'Configuration enregistrée'));
  };

  /* ----------------------------- create ----------------------------- */
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState<{
    name: string;
    phase: PhaseKey;
    channel: Channel;
    timing: TimingKey;
    message: string;
  }>({ name: '', phase: 'before', channel: 'whatsapp', timing: '24h', message: '' });

  const openCreate = () => {
    setForm({ name: '', phase: 'before', channel: 'whatsapp', timing: '24h', message: '' });
    setCreateOpen(true);
  };

  const createAutomation = () => {
    const name = form.name.trim() || L('Nova automação', 'New automation', '新自动化', 'Nouvelle automatisation');
    const desc =
      form.message.trim() ||
      L('Automação personalizada.', 'Custom automation.', '自定义自动化。', 'Automatisation personnalisée.');
    const item: Automation = {
      id: uid(),
      phase: form.phase,
      icon: Zap,
      name: mkLoc(name),
      desc: mkLoc(desc),
      message: mkLoc(form.message.trim() || name),
      timing: form.timing,
      channel: form.channel,
      enabled: true,
    };
    setItems((list) => [...list, item]);
    setCreateOpen(false);
    toast.success(L('Automação criada', 'Automation created', '自动化已创建', 'Automatisation créée'));
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Workflow}
        title={L('Automações', 'Automations', '自动化', 'Automatisations')}
        subtitle={L(
          'Orquestre o atendimento de ponta a ponta — antes, durante, depois e no follow-up.',
          'Orchestrate care end to end — before, during, after and follow-up.',
          '端到端编排诊疗 — 就诊前、中、后及随访。',
          'Orchestrez le parcours de bout en bout — avant, pendant, après et suivi.',
        )}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            {L('Nova automação', 'New automation', '新建自动化', 'Nouvelle automatisation')}
          </Button>
        }
      />

      <div className="flex flex-col gap-8">
        {PHASES.map((phase) => {
          const list = items.filter((a) => a.phase === phase.key);
          const active = list.filter((a) => a.enabled).length;
          const PhaseIcon = phase.icon;
          return (
            <section key={phase.key}>
              <SectionTitle
                action={
                  <Badge tone="brand">
                    {active}/{list.length} {L('ativas', 'active', '已启用', 'actives')}
                  </Badge>
                }
              >
                <span className="inline-flex items-center gap-2">
                  <PhaseIcon className="h-3.5 w-3.5 text-brand-600" />
                  {T(phase.title)}
                </span>
              </SectionTitle>
              <p className="-mt-1 mb-3 text-xs text-muted">{T(phase.desc)}</p>

              <div className="flex flex-col gap-3">
                {list.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Card key={a.id} hover className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <div className="flex flex-1 items-start gap-3">
                        <span
                          className={
                            'grid h-10 w-10 shrink-0 place-items-center rounded-xl ' +
                            (a.enabled ? 'bg-brand-600/10 text-brand-600' : 'bg-ink/[0.05] text-subtle')
                          }
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium leading-tight">{T(a.name)}</p>
                          <p className="mt-0.5 text-xs text-muted">{T(a.desc)}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge tone="neutral">
                              <Clock className="h-3 w-3" />
                              {timingLabel(a.timing)}
                            </Badge>
                            <Badge tone="info">{channelLabel(a.channel)}</Badge>
                            <Badge tone={a.enabled ? 'success' : 'neutral'} dot={a.enabled}>
                              {a.enabled
                                ? L('Ativa', 'Active', '已启用', 'Active')
                                : L('Inativa', 'Inactive', '未启用', 'Inactive')}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Settings2 className="h-3.5 w-3.5" />}
                          onClick={() => openConfig(a)}
                        >
                          {L('Configurar', 'Configure', '配置', 'Configurer')}
                        </Button>
                        <Switch
                          checked={a.enabled}
                          onChange={() => toggle(a)}
                          aria-label={`${L('Alternar', 'Toggle', '切换', 'Basculer')} ${T(a.name)}`}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* configure modal */}
      <Modal
        open={!!configItem}
        onClose={() => setConfigId(null)}
        title={`${L('Configurar', 'Configure', '配置', 'Configurer')}${configItem ? ` · ${T(configItem.name)}` : ''}`}
        description={configItem ? T(configItem.desc) : undefined}
      >
        {configItem && (
          <div className="flex flex-col gap-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label={L('Disparo', 'Trigger', '触发', 'Déclencheur')}>
                <Select
                  value={draft.timing}
                  onChange={(e) => setDraft((d) => ({ ...d, timing: e.target.value as TimingKey }))}
                >
                  {TIMINGS.map((tk) => (
                    <option key={tk} value={tk}>
                      {timingLabel(tk)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={L('Canal', 'Channel', '渠道', 'Canal')}>
                <Select
                  value={draft.channel}
                  onChange={(e) => setDraft((d) => ({ ...d, channel: e.target.value as Channel }))}
                >
                  {CHANNELS.map((ck) => (
                    <option key={ck} value={ck}>
                      {channelLabel(ck)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field
              label={L('Mensagem', 'Message', '消息', 'Message')}
              hint={L(
                'Texto enviado ao paciente neste disparo.',
                'Text sent to the patient on this trigger.',
                '此触发发送给患者的文本。',
                'Texte envoyé au patient lors de ce déclencheur.',
              )}
            >
              <Textarea
                value={draft.message}
                onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfigId(null)}>
                {L('Cancelar', 'Cancel', '取消', 'Annuler')}
              </Button>
              <Button onClick={saveConfig}>{L('Salvar', 'Save', '保存', 'Enregistrer')}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* new automation modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={L('Nova automação', 'New automation', '新建自动化', 'Nouvelle automatisation')}
      >
        <div className="flex flex-col gap-4 p-5">
          <Field label={L('Nome', 'Name', '名称', 'Nom')}>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={L('Ex.: Lembrete de jejum', 'e.g. Fasting reminder', '例如：禁食提醒', 'Ex. : Rappel de jeûne')}
              autoFocus
            />
          </Field>
          <Field label={L('Fase', 'Phase', '阶段', 'Phase')}>
            <Select
              value={form.phase}
              onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value as PhaseKey }))}
            >
              {PHASES.map((p) => (
                <option key={p.key} value={p.key}>
                  {T(p.title)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={L('Disparo', 'Trigger', '触发', 'Déclencheur')}>
              <Select
                value={form.timing}
                onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value as TimingKey }))}
              >
                {TIMINGS.map((tk) => (
                  <option key={tk} value={tk}>
                    {timingLabel(tk)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={L('Canal', 'Channel', '渠道', 'Canal')}>
              <Select
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as Channel }))}
              >
                {CHANNELS.map((ck) => (
                  <option key={ck} value={ck}>
                    {channelLabel(ck)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={L('Mensagem', 'Message', '消息', 'Message')}>
            <Textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder={L(
                'O que enviar ao paciente…',
                'What to send to the patient…',
                '向患者发送的内容…',
                'Quoi envoyer au patient…',
              )}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              {L('Cancelar', 'Cancel', '取消', 'Annuler')}
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={createAutomation}>
              {L('Criar', 'Create', '创建', 'Créer')}
            </Button>
          </div>
        </div>
      </Modal>
    </ScreenContainer>
  );
}
