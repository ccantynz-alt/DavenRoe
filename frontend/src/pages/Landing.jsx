import { useState, useEffect } from 'react';
import HeroCarousel from '../components/landing/HeroCarousel';
import LogoBar from '../components/landing/LogoBar';
import AnimatedStats from '../components/landing/AnimatedStats';
import DashboardPreview from '../components/landing/DashboardPreview';
import FeatureShowcase from '../components/landing/FeatureShowcase';
import ComparisonTable from '../components/landing/ComparisonTable';
import Testimonials from '../components/landing/Testimonials';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';

/**
 * Premium landing page for Astra — dark hero with gradient mesh,
 * live AI demo, bento grid features, competitor comparison.
 *
 * Section flow:
 *  1. Hero (dark, animated gradient mesh + live Ask Astra demo)
 *  2. Logo marquee (animated infinite scroll)
 *  3. Stats (glass morphism, dark section)
 *  4. Dashboard preview (floating mockup with notification cards)
 *  5. How It Works (4-step minimal workflow)
 *  6. Bento grid capabilities (dark section)
 *  7. Jurisdictions
 *  8. Trust & Security
 *  9. Competitor comparison table
 * 10. Testimonials (dark section, rotating quotes)
 * 11. Pricing (3 tiers)
 * 12. FAQ (accordion)
 * 13. Final CTA
 * 14. Footer
 */
export default function Landing({ onLogin, onNavigate }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
  }, []);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* ============================================================
          1. HERO — Dark gradient mesh with live AI demo
          ============================================================ */}
      <HeroCarousel>
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 lg:px-16 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">Astra</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="hidden md:inline text-sm text-white/50 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hidden md:inline text-sm text-white/50 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hidden md:inline text-sm text-white/50 hover:text-white transition-colors">FAQ</a>
            <button
              onClick={onLogin}
              className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all border border-white/10"
            >
              Sign In
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16">
          <div className="text-center max-w-4xl">
            <div
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s ease-out 0.2s',
              }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-sm text-white/70 text-xs font-medium tracking-wide border border-white/[0.08] mb-8">
                Autonomous Accounting for the Modern Practice
              </span>
            </div>

            <h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] mb-6 tracking-tight"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 1s ease-out 0.4s',
              }}
            >
              Precision.<br />
              Intelligence.<br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Trust.</span>
            </h1>

            <p
              className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s ease-out 0.7s',
              }}
            >
              AI-powered bookkeeping, multi-jurisdiction tax compliance,
              and forensic anomaly detection — all in one platform
              built for accounting professionals.
            </p>

            <div
              className="flex flex-col sm:flex-row justify-center gap-4"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s ease-out 0.9s',
              }}
            >
              <button
                onClick={onLogin}
                className="px-8 py-4 bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
              >
                Start Free Trial
              </button>
              <a
                href="#features"
                className="px-8 py-4 bg-white/[0.06] backdrop-blur-sm text-white rounded-xl text-lg font-semibold hover:bg-white/[0.12] transition-all border border-white/[0.08]"
              >
                See How It Works
              </a>
            </div>

            <p
              className="text-sm text-white/30 mt-8"
              style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1s ease-out 1.2s' }}
            >
              Trusted by forward-thinking firms across Australia, US, NZ & UK
            </p>
          </div>
        </div>
      </HeroCarousel>

      {/* ============================================================
          2. LOGO MARQUEE — Animated infinite scroll
          ============================================================ */}
      <LogoBar />

      {/* ============================================================
          3. ANIMATED STATS — Glass morphism dark section
          ============================================================ */}
      <AnimatedStats />

      {/* ============================================================
          4. DASHBOARD PREVIEW — Floating mockup
          ============================================================ */}
      <DashboardPreview />

      {/* ============================================================
          5-8. FEATURES — Workflow + Bento Grid + Jurisdictions + Trust + CTA
          ============================================================ */}
      <div id="features">
        <FeatureShowcase />
      </div>

      {/* ============================================================
          9. COMPETITOR COMPARISON — Why switch table
          ============================================================ */}
      <ComparisonTable />

      {/* ============================================================
          10. TESTIMONIALS — Dark section, rotating quotes
          ============================================================ */}
      <Testimonials />

      {/* ============================================================
          11. PRICING — Three tiers
          ============================================================ */}
      <Pricing />

      {/* ============================================================
          12. FAQ — Accordion
          ============================================================ */}
      <div id="faq">
        <FAQ />
      </div>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="bg-[#08090d] text-white py-16 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-lg font-semibold">Astra</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Autonomous accounting intelligence for the modern practice. AI-powered bookkeeping, multi-jurisdiction tax compliance, and forensic anomaly detection.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.15em] text-gray-500 mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-white transition-colors">Bookkeeping</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Tax Engine</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Forensics</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Ask Astra</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Bank Feeds</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.15em] text-gray-500 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">About</button></li>
                <li><button onClick={() => onNavigate('security')} className="hover:text-white transition-colors">Security</button></li>
                <li><button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Contact</button></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.15em] text-gray-500 mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button onClick={() => onNavigate('security')} className="hover:text-white transition-colors">Data Security</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">&copy; 2026 Astra. All rights reserved.</p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                256-bit encryption
              </span>
              <span>SOC 2 architecture</span>
              <span>GDPR ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
