import { useEffect, useRef, useState } from 'react';

/**
 * Premium bento grid feature showcase — asymmetric layout
 * with interactive elements, micro-animations, and rich visuals.
 * Inspired by Apple/Linear/Vercel design language.
 */

const WORKFLOW = [
  { step: '01', title: 'Connect', description: 'Link bank feeds, upload documents, or import from your existing system.', icon: '~' },
  { step: '02', title: 'Categorise', description: 'AI classifies transactions with 94.7% accuracy. You review only exceptions.', icon: '>' },
  { step: '03', title: 'Comply', description: 'Tax obligations calculated across all jurisdictions with treaty optimisation.', icon: '$' },
  { step: '04', title: 'Report', description: 'Financial statements, BAS, GST returns, and management reports — on demand.', icon: '#' },
];

const JURISDICTIONS = [
  { code: 'AU', name: 'Australia', flag: '🇦🇺', taxes: ['GST', 'Company Tax', 'PAYG', 'FBT', 'Super'] },
  { code: 'US', name: 'United States', flag: '🇺🇸', taxes: ['Federal Income', 'State Tax', 'Sales Tax', 'FICA', 'Sec 179'] },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', taxes: ['GST', 'Income Tax', 'PAYE', 'Provisional', 'RWT'] },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', taxes: ['VAT', 'Corporation Tax', 'PAYE', 'NI', 'MTD'] },
];

export default function FeatureShowcase() {
  return (
    <div>
      {/* How It Works — minimal timeline */}
      <section className="py-32 px-6 lg:px-12 bg-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99,102,241,0.3) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        <div className="max-w-6xl mx-auto relative">
          <FadeIn>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
                <span className="text-[11px] font-semibold text-indigo-600 tracking-wide uppercase">How It Works</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Four steps. Fully autonomous.</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">From raw bank data to tax-compliant financial statements — with human oversight where it matters.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW.map((item, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="group relative bg-white rounded-2xl p-8 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-500 border border-gray-200 hover:border-indigo-200">
                  <div className="text-6xl font-bold bg-gradient-to-b from-gray-100 to-gray-50 bg-clip-text text-transparent group-hover:from-indigo-200 group-hover:to-indigo-50 transition-all duration-500 mb-6 font-mono">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{item.description}</p>
                  {i < WORKFLOW.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 text-indigo-200 group-hover:text-indigo-400 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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

      {/* Bento Grid — Core Capabilities */}
      <section className="py-32 px-6 lg:px-12 bg-[#05060a] relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
        {/* Center glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full opacity-[0.06] blur-[150px]"
          style={{ background: 'radial-gradient(ellipse, #6366f1 0%, transparent 60%)' }}
        />

        <div className="max-w-6xl mx-auto relative">
          <FadeIn>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-indigo-300 tracking-wide uppercase">Core Capabilities</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Built for the modern practice</h2>
              <p className="text-lg text-white/40 max-w-2xl mx-auto">Everything your competitors charge extra for — included by default.</p>
            </div>
          </FadeIn>

          {/* Bento layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large card — Autonomous Bookkeeping */}
            <FadeIn delay={0}>
              <BentoCard className="lg:col-span-2 lg:row-span-2" accent="indigo">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span className="text-[11px] font-medium text-indigo-300">Core Engine</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Autonomous Bookkeeping</h3>
                      <p className="text-white/50 leading-relaxed max-w-md">AI-powered double-entry that categorises 95% of transactions automatically. Bank feeds reconcile in real-time. Your team reviews only the exceptions.</p>
                    </div>
                  </div>
                  {/* Mini demo — transaction flow */}
                  <div className="mt-auto bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 space-y-2">
                    {[
                      { desc: 'Xero Cafe — EFTPOS', amount: '-$847.20', cat: 'Office Expenses', conf: '98%', status: 'auto' },
                      { desc: 'Stripe Transfer', amount: '+$12,400.00', cat: 'Revenue — Services', conf: '99%', status: 'auto' },
                      { desc: 'Unknown — REF #4821', amount: '-$2,100.00', cat: 'Needs Review', conf: '62%', status: 'review' },
                    ].map((tx, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tx.status === 'auto' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className="text-xs text-white/70 flex-1 truncate">{tx.desc}</span>
                        <span className={`text-xs font-mono font-medium ${tx.amount.startsWith('+') ? 'text-emerald-400' : 'text-white/60'}`}>{tx.amount}</span>
                        <span className="text-[10px] text-white/40 hidden sm:inline w-28 truncate">{tx.cat}</span>
                        <span className={`text-[10px] font-mono ${parseInt(tx.conf) > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{tx.conf}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </BentoCard>
            </FadeIn>

            {/* Multi-Jurisdiction Tax */}
            <FadeIn delay={100}>
              <BentoCard accent="cyan">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-[11px] font-medium text-cyan-300">Tax Engine</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Multi-Jurisdiction Tax</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-4">Four countries. Six treaties. One platform. Automatic WHT reduction.</p>
                <div className="grid grid-cols-2 gap-2">
                  {['AU', 'US', 'NZ', 'GB'].map(code => (
                    <div key={code} className="bg-white/[0.04] rounded-lg px-3 py-2 text-center border border-white/[0.06]">
                      <span className="text-lg">{code === 'AU' ? '🇦🇺' : code === 'US' ? '🇺🇸' : code === 'NZ' ? '🇳🇿' : '🇬🇧'}</span>
                      <div className="text-[10px] text-white/40 mt-1">{code}</div>
                    </div>
                  ))}
                </div>
              </BentoCard>
            </FadeIn>

            {/* Forensic Intelligence */}
            <FadeIn delay={200}>
              <BentoCard accent="rose">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span className="text-[11px] font-medium text-rose-300">Unique to AlecRae</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Forensic Intelligence</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-4">Benford's Law analysis, ghost vendor detection, payment splitting alerts. Runs continuously.</p>
                {/* Mini Benford chart */}
                <div className="flex items-end gap-1 h-16">
                  {[30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-rose-500/30 rounded-t border border-rose-500/20"
                        style={{ height: `${h * 2}px` }}
                      />
                      <span className="text-[8px] text-white/30">{i + 1}</span>
                    </div>
                  ))}
                </div>
              </BentoCard>
            </FadeIn>

            {/* Ask AlecRae */}
            <FadeIn delay={300}>
              <BentoCard accent="violet">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="text-[11px] font-medium text-violet-300">AI Assistant</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ask AlecRae</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-4">Natural language queries over your entire financial dataset. Answers in under 2 seconds.</p>
                <div className="bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06]">
                  <p className="text-xs text-violet-300 font-mono">"What were my top 5 expenses last quarter?"</p>
                </div>
              </BentoCard>
            </FadeIn>

            {/* AI Agents */}
            <FadeIn delay={400}>
              <BentoCard accent="emerald">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-medium text-emerald-300">Agentic AI</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Autonomous Agents</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-3">Multi-agent orchestrator handles month-end close, compliance monitoring, and cash flow forecasting.</p>
                <div className="space-y-2">
                  {['Month-End Close Agent', 'Compliance Monitor', 'Cash Flow Forecaster'].map((agent, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-white/50">{agent}</span>
                      <span className="text-[10px] text-emerald-400 ml-auto font-mono">active</span>
                    </div>
                  ))}
                </div>
              </BentoCard>
            </FadeIn>

            {/* Native Payroll */}
            <FadeIn delay={500}>
              <BentoCard accent="amber">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-medium text-amber-300">Included</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Native Payroll</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-3">Tax withholding across AU, NZ, UK, and US with super, KiwiSaver, pension, and leave accrual. No add-on fees.</p>
                <div className="flex gap-2">
                  {['PAYG', 'PAYE', 'KiwiSaver', 'Pension'].map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white/[0.04] rounded text-[10px] text-white/40 border border-white/[0.06]">{tag}</span>
                  ))}
                </div>
              </BentoCard>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Jurisdictions */}
      <section className="py-28 px-6 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-20">
              <p className="text-[11px] font-medium tracking-[0.2em] text-indigo-600 uppercase mb-3">Global Coverage</p>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Four jurisdictions. Six treaties. One platform.</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">Full tax compliance with automatic bilateral treaty benefit calculations.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {JURISDICTIONS.map((j, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-500 text-center">
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
              <p className="text-[11px] font-medium tracking-[0.2em] text-indigo-600 uppercase mb-3">Trust & Security</p>
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
      <section className="py-36 px-6 lg:px-12 bg-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 50%)',
        }} />
        <div className="max-w-3xl mx-auto text-center relative">
          <FadeIn>
            <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              Ready to transform<br />your practice?
            </h2>
            <p className="text-xl text-gray-500 mb-12 leading-relaxed">
              Join the firms that have already eliminated manual data entry, automated their tax compliance, and reclaimed thousands of hours.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#register" className="group relative px-10 py-4 bg-indigo-600 text-white rounded-xl text-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]">
                <span className="relative z-10">Start Free Trial</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="#register" className="px-10 py-4 bg-white text-gray-700 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all border border-gray-200 hover:border-indigo-200 hover:text-indigo-600">
                Book a Demo
              </a>
            </div>
            <p className="text-sm text-gray-400 mt-8">No credit card required. 14-day full access. Cancel anytime.</p>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}

function BentoCard({ children, className = '', accent = 'indigo' }) {
  const gradientMap = {
    indigo: 'from-indigo-500 via-indigo-400 to-violet-500',
    cyan: 'from-cyan-500 via-cyan-400 to-blue-500',
    rose: 'from-rose-500 via-rose-400 to-pink-500',
    violet: 'from-violet-500 via-violet-400 to-purple-500',
    emerald: 'from-emerald-500 via-emerald-400 to-teal-500',
    amber: 'from-amber-500 via-amber-400 to-orange-500',
  };
  const glowMap = {
    indigo: 'rgba(99,102,241,0.1)',
    cyan: 'rgba(6,182,212,0.1)',
    rose: 'rgba(244,63,94,0.1)',
    violet: 'rgba(139,92,246,0.1)',
    emerald: 'rgba(16,185,129,0.1)',
    amber: 'rgba(245,158,11,0.1)',
  };

  return (
    <div className={`relative group h-full ${className}`}>
      {/* Animated gradient border on hover */}
      <div className="absolute -inset-[1px] rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div
          className={`absolute inset-0 bg-gradient-to-r ${gradientMap[accent]}`}
          style={{ animation: 'bento-spin 4s linear infinite' }}
        />
      </div>
      {/* Glow */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl"
        style={{ background: glowMap[accent] }}
      />
      <div className="relative bg-[#0a0b10] rounded-2xl border border-white/[0.06] p-6 group-hover:border-transparent transition-colors duration-300 h-full">
        {children}
      </div>
      <style>{`
        @keyframes bento-spin {
          from { transform: rotate(0deg) scale(3); }
          to { transform: rotate(360deg) scale(3); }
        }
      `}</style>
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
      className="h-full"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease-out, transform 0.7s ease-out`,
      }}
    >
      {children}
    </div>
  );
}
