'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { AudioLines, Check, FileCheck2, FileText, ShieldCheck } from 'lucide-react';
import { MariAssistant } from '@/components/brand/mari-assistant';
import { cn } from '@/lib/utils';
import { Reveal } from './reveal';

/**
 * Product explanation for Mari. The former full-body portrait was visually
 * disconnected from the interface; this section now demonstrates the causal
 * workflow and keeps the mascot as a compact product identity.
 */
export function MeetMari() {
  const locale = useLocale();
  const reduce = useReducedMotion();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const steps = [
    {
      icon: AudioLines,
      title: L('Escuta com contexto', 'Listens in context', '结合语境聆听', 'Écoute avec contexte'),
      desc: L('Separa médico e paciente em tempo real.', 'Separates clinician and patient in real time.', '实时区分医生和患者。', 'Sépare médecin et patient en temps réel.'),
      sample: L('“Dor de cabeça há duas semanas.”', '“Headache for two weeks.”', '“头痛已经两周了。”', '« Mal de tête depuis deux semaines. »'),
    },
    {
      icon: FileText,
      title: L('Estrutura só o que foi dito', 'Structures only what was said', '只整理已说出的内容', 'Structure uniquement ce qui est dit'),
      desc: L('Cada campo aparece após a informação ser confirmada.', 'Each field appears after the information is confirmed.', '信息确认后才会写入字段。', 'Chaque champ apparaît après confirmation.'),
      sample: L('Queixa · duração · sintomas', 'Complaint · duration · symptoms', '主诉 · 持续时间 · 症状', 'Motif · durée · symptômes'),
    },
    {
      icon: ShieldCheck,
      title: L('Revisa antes de assinar', 'Reviews before signing', '签署前复核', 'Révise avant signature'),
      desc: L('Destaca lacunas sem substituir a decisão médica.', 'Flags gaps without replacing clinical judgment.', '提示缺失，不替代医生判断。', 'Signale les lacunes sans remplacer le jugement médical.'),
      sample: L('Revisão humana obrigatória', 'Human review required', '必须人工复核', 'Révision humaine requise'),
    },
    {
      icon: FileCheck2,
      title: L('Prepara a continuidade', 'Prepares the next steps', '准备后续流程', 'Prépare la suite'),
      desc: L('Prontuário, documentos e guia TISS ficam conectados.', 'Record, documents and TISS claim stay connected.', '病历、文档和 TISS 申报保持关联。', 'Dossier, documents et feuille TISS restent reliés.'),
      sample: L('Pronto para revisar', 'Ready to review', '可供复核', 'Prêt à réviser'),
    },
  ];

  const [active, setActive] = React.useState(reduce ? steps.length - 1 : 0);
  React.useEffect(() => {
    if (reduce) {
      setActive(steps.length - 1);
      return;
    }
    const timer = window.setInterval(() => setActive((value) => (value + 1) % steps.length), 1800);
    return () => window.clearInterval(timer);
  }, [reduce, steps.length]);

  return (
    <section id="mari" className="scroll-mt-24 py-16 sm:py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2rem] border border-hairline bg-card/85 p-6 shadow-xl backdrop-blur-xl sm:p-10 lg:p-12">
          <div aria-hidden className="absolute inset-0 bg-grid opacity-[0.24] mask-b" />
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <Reveal>
              <div>
                <div className="flex items-center gap-4">
                  <MariAssistant variant="avatar" status={reduce ? 'success' : active === 0 ? 'listening' : 'thinking'} size={72} />
                  <div>
                    <span className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
                      {L('Conheça a Mari', 'Meet Mari', '认识 Mari', 'Découvrez Mari')}
                    </span>
                    <p className="mt-1 text-sm font-medium text-muted">
                      {L('Sua copilota clínica', 'Your clinical copilot', '您的临床副驾', 'Votre copilote clinique')}
                    </p>
                  </div>
                </div>
                <h2 className="mt-6 max-w-lg font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {L('Da conversa ao prontuário, com rastreabilidade.', 'From conversation to record, with traceability.', '从对话到病历，全程可追溯。', 'De la conversation au dossier, avec traçabilité.')}
                </h2>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
                  {L(
                    'Mari organiza a consulta em etapas visíveis. Nada entra no resumo antes de aparecer na conversa — e você sempre revisa antes de assinar.',
                    'Mari organizes the visit in visible steps. Nothing enters the summary before it appears in the conversation — and you always review before signing.',
                    'Mari 以可见步骤整理问诊。对话中尚未出现的信息不会进入摘要，签署前始终由您复核。',
                    'Mari organise la consultation en étapes visibles. Rien n’entre dans le résumé avant d’apparaître dans l’échange — et vous révisez toujours avant de signer.',
                  )}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success-fg dark:text-success">
                  <Check className="h-3.5 w-3.5" />
                  {L('Você mantém o controle clínico', 'You retain clinical control', '临床决策由您掌控', 'Vous gardez le contrôle clinique')}
                </div>
              </div>
            </Reveal>

            <div className="relative">
              <div aria-hidden className="absolute left-[8%] right-[8%] top-8 hidden h-px bg-hairline sm:block" />
              <motion.div
                aria-hidden
                className="absolute left-[8%] top-8 hidden h-px bg-gradient-to-r from-brand-500 to-accent-400 sm:block"
                animate={{ width: `${Math.max(0, active) * 28}%` }}
                transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const done = reduce || index <= active;
                  const current = !reduce && index === active;
                  return (
                    <motion.article
                      key={step.title}
                      animate={{ y: current ? -4 : 0, scale: current ? 1.015 : 1 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        'relative min-h-[170px] rounded-2xl border p-5 transition-colors duration-500',
                        done ? 'border-brand-500/30 bg-elevated/90 shadow-md' : 'border-hairline bg-surface/55',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={cn('grid h-10 w-10 place-items-center rounded-xl transition-colors duration-500', done ? 'bg-brand-600 text-white' : 'bg-surface text-muted')}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-mono text-2xs text-subtle">0{index + 1}</span>
                      </div>
                      <h3 className="mt-4 font-display text-sm font-semibold">{step.title}</h3>
                      <p className="mt-1.5 text-xs+ leading-relaxed text-muted">{step.desc}</p>
                      <motion.div
                        initial={false}
                        animate={{ opacity: done ? 1 : 0.35 }}
                        className="mt-3 truncate rounded-lg bg-brand-500/[0.07] px-2.5 py-1.5 font-mono text-2xs text-brand-700 dark:text-brand-300"
                      >
                        {step.sample}
                      </motion.div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
