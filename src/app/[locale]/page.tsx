import { unstable_setRequestLocale } from 'next-intl/server';
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
import { Pricing } from '@/components/landing/pricing';
import { FAQ } from '@/components/landing/faq';
import { JsonLd } from '@/components/seo/json-ld';

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <div className="relative">
      <JsonLd locale={locale} />
      <DnaHelix />
      <LandingNav />
      <main>
        <Hero />
        {/* Solid base below the hero so the ambient DNA stays a hero-only motif and never
            bleeds behind body copy — every section below stays fully legible. */}
        <div className="relative bg-bg">
          <LogoCloud />
          <Stats />
          <Features />
          <How />
          <ForWhom />
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
