import { useState, useEffect } from 'react';
import HeroCarousel from '../components/landing/HeroCarousel';
import FeatureShowcase from '../components/landing/FeatureShowcase';

/**
 * Professional, white-themed landing page for Astra.
 *
 * Grand hero with full-screen image carousel,
 * clean typography, elegant transitions, and
 * restrained colour palette. Designed to convey
 * trust, authority, and sophistication — the way
 * a top-tier accounting firm should feel.
 */
export default function Landing({ onLogin }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
  }, []);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* ============================================================
          HERO — Full-screen carousel with overlay content
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
            <a href="#process" className="hidden md:inline text-sm text-white/80 hover:text-white transition-colors">How It Works</a>
            <a href="#capabilities" className="hidden md:inline text-sm text-white/80 hover:text-white transition-colors">Capabilities</a>
            <a href="#global" className="hidden md:inline text-sm text-white/80 hover:text-white transition-colors">Global</a>
            <button
              onClick={onLogin}
              className="px-5 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm"
            >
              Sign In
            </button>
          </div>
        </nav>

        {/* Hero content — centred */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16">
          <div className="text-center max-w-4xl">
            {/* Tagline pill */}
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

            {/* Main headline */}
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

            {/* Subtitle */}
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

            {/* CTA buttons */}
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
                href="#process"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg text-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                Learn More
              </a>
            </div>

            {/* Trust line */}
            <p
              className="text-sm text-white/50 mt-8"
              style={{
                opacity: loaded ? 1 : 0,
                transition: 'opacity 1s ease-out 1.2s',
              }}
            >
              Trusted by forward-thinking firms across Australia, US, NZ & UK
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="pb-36 flex justify-center">
          <div
            className="flex flex-col items-center gap-2"
            style={{
              opacity: loaded ? 1 : 0,
              transition: 'opacity 1s ease-out 1.5s',
            }}
          >
            <span className="text-xs text-white/50 tracking-wider uppercase">Scroll</span>
            <svg className="w-5 h-5 text-white/40 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </HeroCarousel>

      {/* ============================================================
          SOCIAL PROOF BAR
          ============================================================ */}
      <section className="py-12 px-6 lg:px-16 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">94.7%</div>
              <div className="text-sm text-gray-500 mt-1">Categorisation Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">4</div>
              <div className="text-sm text-gray-500 mt-1">Tax Jurisdictions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">4.2s</div>
              <div className="text-sm text-gray-500 mt-1">Month-End Close</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">40+</div>
              <div className="text-sm text-gray-500 mt-1">Hours Saved / Month</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURE SECTIONS
          ============================================================ */}
      <div id="process">
        <FeatureShowcase />
      </div>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="bg-gray-900 text-white py-16 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-lg font-semibold">Astra</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Autonomous accounting intelligence for the modern practice.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Bookkeeping</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tax Engine</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Forensics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ask Astra</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Jurisdictions</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Australia</li>
                <li>United States</li>
                <li>New Zealand</li>
                <li>United Kingdom</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">2026 Astra. All rights reserved.</p>
            <p className="text-xs text-gray-600">256-bit encryption. SOC 2 compliant. Your data never leaves our secure infrastructure.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
