import { useEffect, useRef, useState } from 'react';

/**
 * Clean, white-themed feature sections for a professional accounting firm.
 * Scroll-triggered fade-in animations, generous whitespace, restrained palette.
 */

const CAPABILITIES = [
  {
    title: 'Autonomous Bookkeeping',
    description: 'AI-powered double-entry that categorises 95% of transactions automatically. Bank feeds reconcile in real-time. Your team reviews only the exceptions.',
    stats: ['94.7% accuracy', '40+ hrs saved/month', 'Real-time reconciliation'],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    title: 'Multi-Jurisdiction Tax',
    description: 'Full compliance across Australia, United States, New Zealand, and the United Kingdom. Six bilateral treaty engines calculate withholding reductions automatically.',
    stats: ['4 jurisdictions', '6 DTA treaties', '15+ tax types'],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    title: 'Forensic Intelligence',
    description: "Continuous anomaly detection powered by Benford's Law analysis, duplicate payment scanning, and related-party identification. Catch what auditors miss.",
    stats: ['Real-time scanning', 'ML-powered detection', 'Evidence chain reports'],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Ask Astra',
    description: 'Plain English queries over your entire financial dataset. Ask about cash positions, overdue invoices, quarterly comparisons, or hypothetical scenarios — answered in seconds.',
    stats: ['Natural language', '<2 sec response', 'Unlimited queries'],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
];

const JURISDICTIONS = [
  { code: 'AU', name: 'Australia', flag: '🇦🇺', taxes: ['GST', 'Company Tax', 'PAYG', 'FBT', 'STP'] },
  { code: 'US', name: 'United States', flag: '🇺🇸', taxes: ['Federal Income', 'State Tax', 'Sales Tax', '941 Payroll', 'Sec 179'] },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', taxes: ['GST', 'Income Tax', 'PAYE', 'Provisional', 'RWT'] },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', taxes: ['VAT', 'Corporation Tax', 'PAYE RTI', 'MTD', 'Self Assessment'] },
];

const WORKFLOW = [
  { step: '01', title: 'Connect', description: 'Link bank feeds, upload documents, or import from your existing system.' },
  { step: '02', title: 'Categorise', description: 'AI classifies transactions with 94.7% accuracy. You review only exceptions.' },
  { step: '03', title: 'Comply', description: 'Tax obligations calculated across all jurisdictions with treaty optimisation.' },
  { step: '04', title: 'Report', description: 'Financial statements, BAS, GST returns, and management reports — on demand.' },
];

export default function FeatureShowcase() {
  return (
    <div>
      {/* How It Works */}
      <section className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase mb-3">Process</p>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Four steps. Fully autonomous.</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">From raw bank data to tax-compliant financial statements — with human oversight where it matters.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {WORKFLOW.map((item, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="relative">
                  <span className="text-7xl font-bold text-gray-100 absolute -top-4 -left-2">{item.step}</span>
                  <div className="relative pt-12">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{item.description}</p>
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <div className="hidden lg:block absolute top-16 -right-4 w-8 text-gray-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-24 px-6 lg:px-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase mb-3">Capabilities</p>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Built for the modern practice</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">Four pillars that cover everything from daily bookkeeping to cross-border tax treaty optimisation.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {CAPABILITIES.map((cap, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      {cap.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{cap.title}</h3>
                      <p className="text-gray-500 leading-relaxed mb-4">{cap.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {cap.stats.map((stat, j) => (
                          <span key={j} className="px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-full border border-gray-100">
                            {stat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Jurisdictions */}
      <section className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase mb-3">Global Coverage</p>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Four jurisdictions. Six treaties. One platform.</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">Full tax compliance with automatic bilateral treaty benefit calculations.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {JURISDICTIONS.map((j, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 text-center">
                  <div className="text-4xl mb-3">{j.flag}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{j.name}</h3>
                  <p className="text-xs text-gray-400 font-mono mb-4">{j.code}</p>
                  <div className="space-y-1.5">
                    {j.taxes.map((tax, k) => (
                      <div key={k} className="text-sm text-gray-500 py-1 border-b border-gray-50 last:border-0">
                        {tax}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="py-24 px-6 lg:px-12 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase mb-3">Trust & Security</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Enterprise-grade by default</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: '256-bit Encryption', description: 'All data encrypted at rest and in transit. Your financial data never leaves our secure infrastructure.' },
              { title: 'Full Audit Trail', description: 'Every transaction, every change, every approval — timestamped and immutable. Complete compliance ready.' },
              { title: 'Human-in-the-Loop', description: 'AI handles the volume. Your team retains full control over approvals, exceptions, and overrides.' },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Ready to transform<br />your practice?
            </h2>
            <p className="text-xl text-gray-500 mb-10 leading-relaxed">
              Join the firms that have already eliminated manual data entry, automated their tax compliance, and reclaimed thousands of hours.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#signup" className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                Start Free Trial
              </a>
              <a href="#contact" className="px-8 py-4 bg-white text-gray-700 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-200">
                Book a Demo
              </a>
            </div>
            <p className="text-sm text-gray-400 mt-6">No credit card required. 14-day full access.</p>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}

function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
