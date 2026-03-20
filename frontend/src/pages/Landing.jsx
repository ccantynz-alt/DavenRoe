import { useState, useEffect } from 'react';
import HeroCarousel from '../components/landing/HeroCarousel';
import LogoBar from '../components/landing/LogoBar';
import AnimatedStats from '../components/landing/AnimatedStats';
import DashboardPreview from '../components/landing/DashboardPreview';
import FeatureShowcase from '../components/landing/FeatureShowcase';
import Testimonials from '../components/landing/Testimonials';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';

/**
 * Professional, white-themed landing page for Astra.
 *
 * Section flow:
 *  1. Hero carousel (full-screen, 3 images, crossfade)
 *  2. Logo bar (bank integrations)
 *  3. Animated stats (counters tick up on scroll)
 *  4. Dashboard preview (floating mockup with perspective + notification cards)
 *  5. How It Works (4-step workflow)
 *  6. Capabilities (4 pillar cards)
 *  7. Testimonials (dark section, rotating quotes)
 *  8. Jurisdictions (4 country cards)
 *  9. Pricing (3 tiers)
 * 10. FAQ (accordion)
 * 11. Trust & Security
 * 12. Final CTA
 * 13. Footer
 */
export default function Landing({ onLogin }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
  }, []);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* ============================================================
          1. HERO — Full-screen carousel with overlay content
          ============================================================ */}
      <HeroCarousel>
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 lg:px-16 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <span className="text-indigo-600 font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">Astra</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="hidden md:inline text-sm text-white/80 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hidden md:inline text-sm text-white/80 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hidden md:inline text-sm text-white/80 hover:text-white transition-colors">FAQ</a>
            <button
              onClick={onLogin}
              className="px-5 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm"
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
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-medium tracking-wide border border-white/20 mb-8">
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
              <span className="text-indigo-300">Trust.</span>
            </h1>

            <p
              className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-10"
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
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </button>
              <a
                href="#features"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg text-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                Learn More
              </a>
            </div>

            <p
              className="text-sm text-white/50 mt-8"
              style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1s ease-out 1.2s' }}
            >
              Trusted by forward-thinking firms across Australia, US, NZ & UK
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="pb-36 flex justify-center">
          <div
            className="flex flex-col items-center gap-2"
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1s ease-out 1.5s' }}
          >
            <span className="text-xs text-white/50 tracking-wider uppercase">Scroll</span>
            <svg className="w-5 h-5 text-white/40 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </HeroCarousel>

      {/* ============================================================
          2. LOGO BAR — Bank integrations
          ============================================================ */}
      <LogoBar />

      {/* ============================================================
          3. ANIMATED STATS — Counters tick up on scroll
          ============================================================ */}
      <AnimatedStats />

      {/* ============================================================
          4. DASHBOARD PREVIEW — Floating mockup
          ============================================================ */}
      <DashboardPreview />

      {/* ============================================================
          5-6. FEATURES — Workflow + Capabilities + Jurisdictions + Trust
          ============================================================ */}
      <div id="features">
        <FeatureShowcase />
      </div>

      {/* ============================================================
          7. TESTIMONIALS — Dark section, rotating quotes
          ============================================================ */}
      <Testimonials />

      {/* ============================================================
          8. PRICING — Three tiers
          ============================================================ */}
      <Pricing />

      {/* ============================================================
          9. FAQ — Accordion
          ============================================================ */}
      <div id="faq">
        <FAQ />
      </div>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="bg-gray-900 text-white py-16 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-lg font-semibold">Astra</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Autonomous accounting intelligence for the modern practice. AI-powered bookkeeping, multi-jurisdiction tax compliance, and forensic anomaly detection.
              </p>
              <div className="flex gap-4">
                <SocialIcon label="LinkedIn">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
                </SocialIcon>
                <SocialIcon label="Twitter">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </SocialIcon>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Bookkeeping</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tax Engine</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Forensics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ask Astra</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Bank Feeds</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reports</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Migration Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status Page</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">&copy; 2026 Astra. All rights reserved.</p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                256-bit encryption
              </span>
              <span>SOC 2 compliant</span>
              <span>GDPR ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SocialIcon({ children, label }) {
  return (
    <a href="#" aria-label={label} className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {children}
      </svg>
    </a>
  );
}
