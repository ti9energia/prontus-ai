import { setRequestLocale } from 'next-intl/server';
import { LandingNav } from '@/components/landing/landing-nav';
import { DnaHelix } from '@/components/landing/dna-helix';
import { Hero } from '@/components/landing/hero';
import {
  Features,
  FinalCTA,
  Footer,
  ForWhom,
  How,
  LogoCloud,
  Security,
  Stats,
  Testimonials,
} from '@/components/landing/sections';
import { ROICalculator } from '@/components/landing/roi-calculator';
import { MeetMari } from '@/components/landing/meet-mari';
import { Pricing } from '@/components/landing/pricing';
import { FAQ } from '@/components/landing/faq';
import { JsonLd } from '@/components/seo/json-ld';

export default async function LandingPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  setRequestLocale(locale);
  return (
    <div className="relative">
      <JsonLd locale={locale} />
      <DnaHelix />
      <LandingNav />
      <main>
        <Hero />
        {/* The ambient DNA now runs behind the WHOLE page (owner request). This
            scrim is a translucent gradient instead of a solid base: the fixed
            DnaHelix shows through strongest just under the hero and calms toward
            the text-dense bottom, so it reads as one continuous molecule while
            body copy stays legible (sections already use bg-surface/40·bg-card/60
            + blur, which protects text locally). Tune legibility here: raise the
            opacities (…/88) to mute the DNA, lower them (…/55) to intensify it. */}
        <div className="relative bg-gradient-to-b from-bg/50 via-bg/72 to-bg/88">
          <LogoCloud />
          <Stats />
          <ROICalculator />
          <Features />
          <How />
          <ForWhom />
          <MeetMari />
          <Security />
          <Pricing />
          <Testimonials />
          <FAQ />
          <FinalCTA />
        </div>
      </main>
      <Footer />
    </div>
  );
}
