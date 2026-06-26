import { unstable_setRequestLocale } from 'next-intl/server';
import { LandingNav } from '@/components/landing/landing-nav';
import { DnaHelix } from '@/components/landing/dna-helix';
import { Hero } from '@/components/landing/hero';
import {
  Features,
  FinalCTA,
  Footer,
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
        <LogoCloud />
        <Stats />
        <Features />
        <How />
        <Security />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
