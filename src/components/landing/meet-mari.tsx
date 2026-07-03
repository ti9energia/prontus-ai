'use client';

import { useLocale } from 'next-intl';
import { Check } from 'lucide-react';
import { MariAssistant } from '@/components/brand/mari-assistant';
import { mariCopy } from '@/lib/mari';
import { Reveal } from './reveal';

/**
 * "Conheça a Mari" — the landing's introduction to the copilot, using the
 * photoreal full-body render. Copy comes from the shared mari design source so
 * the persona reads identically here and inside the product.
 */
export function MeetMari() {
  const locale = useLocale();
  const copy = mariCopy(locale);
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const traits = [
    L('Escuta a consulta', 'Listens to the visit', '聆听问诊', 'Écoute la consultation'),
    L('Estrutura o prontuário', 'Structures the record', '构建病历', 'Structure le dossier'),
    L('Sugere a guia TISS', 'Suggests the TISS claim', '建议 TISS 单据', 'Propose la feuille TISS'),
    L('Aponta risco de glosa', 'Flags denial risk', '提示风险', 'Signale le risque de rejet'),
  ];

  return (
    <section id="mari" className="scroll-mt-24 py-16 sm:py-24">
      <div className="container-page">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/10 px-3 py-1 text-2xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                {L('Copilota clínica de IA', 'Clinical AI copilot', '临床 AI 副驾', 'Copilote clinique IA')}
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {L('Conheça a Mari', 'Meet Mari', '认识 Mari', 'Rencontrez Mari')}
              </h2>
              <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">{copy.institutional}</p>
              <ul className="mt-6 grid max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2">
                {traits.map((tr) => (
                  <li key={tr} className="flex items-center gap-2 text-sm text-ink/90">
                    <Check className="h-4 w-4 shrink-0 text-brand-600" /> {tr}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative mx-auto flex max-w-sm justify-center">
              {/* soft brand halo behind Mari (decorative) */}
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-mesh blur-2xl" />
              <MariAssistant variant="full" size={360} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
