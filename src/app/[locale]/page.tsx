import { unstable_setRequestLocale } from 'next-intl/server';
import { LandingNav } from '@/components/landing/landing-nav';
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

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <div className="relative">
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
