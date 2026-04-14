import { useEffect, useRef, useState } from 'react';

const TEAM_VALUES = [
  {
    title: 'Precision First',
    description: 'Every calculation, every categorisation, every tax treaty application is built on deterministic logic verified against published legislation. We don\'t guess — we compute.',
  },
  {
    title: 'Radical Transparency',
    description: 'Every AI decision comes with a confidence score and full audit trail. Your team sees exactly why a transaction was categorised, what the AI considered, and can override anything.',
  },
  {
    title: 'Accountant-Led Design',
    description: 'Built by people who\'ve done the month-end close at 2am. Every feature solves a real pain point that practitioners face daily — not hypothetical problems from a product roadmap.',
  },
  {
    title: 'Security as Foundation',
    description: '256-bit encryption, immutable audit trails, and entity-level data isolation aren\'t features we bolted on. They\'re the foundation everything else is built on.',
  },
];

const MILESTONES = [
  { year: '2024', event: 'Founded with a mission to eliminate manual data entry for accounting firms' },
  { year: '2024', event: 'Core AI categorisation engine launched with 95%+ accuracy target' },
  { year: '2025', event: 'Multi-jurisdiction tax engine launches covering AU, US, NZ & UK' },
  { year: '2025', event: 'Forensic intelligence suite with Benford\'s Law analysis goes live' },
  { year: '2025', event: 'Six bilateral Double Tax Agreement engines deployed' },
  { year: '2026', event: 'Full autonomous month-end close pipeline launched' },
  { year: '2026', event: 'Eight-agent AI fleet with natural language orchestration' },
];

export default function About({ onBack }) {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">AlecRae</span>
        </div>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          &larr; Back to homepage
        </button>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase mb-3">About AlecRae</p>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              We believe accounting firms<br />deserve better tools.
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed max-w-3xl mx-auto">
              AlecRae was built by accountants and engineers who saw the same problem everywhere: brilliant professionals drowning in manual data entry, copy-paste compliance, and repetitive month-end processes. We built the platform we wished existed.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 lg:px-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Give every accounting firm the AI infrastructure that was previously only available to the Big Four. Autonomous bookkeeping, multi-jurisdiction tax compliance, and forensic intelligence — accessible from day one, not after a six-figure implementation.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 lg:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">What We Stand For</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TEAM_VALUES.map((value, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="p-8 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all">
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{value.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6 lg:px-16 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Our Journey</h2>
            </div>
          </FadeIn>
          <div className="space-y-6">
            {MILESTONES.map((m, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-16 text-sm font-bold text-indigo-600 pt-1">{m.year}</div>
                  <div className="flex-1 pb-6 border-l-2 border-gray-200 pl-6 relative">
                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-indigo-600" />
                    <p className="text-gray-700">{m.event}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 lg:px-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '4', label: 'Jurisdictions' },
              { value: '24', label: 'AI Agents' },
              { value: '95%+', label: 'Categorisation Target' },
              { value: '21,000+', label: 'Bank Institutions' },
            ].map((stat, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div>
                  <div className="text-3xl lg:text-4xl font-bold text-indigo-600 mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-16 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to see it in action?</h2>
          <p className="text-gray-400 mb-8">14-day free trial. No credit card required.</p>
          <button onClick={onBack} className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors">
            Start Free Trial
          </button>
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
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `all 0.6s ease-out ${delay}ms` }}>
      {children}
    </div>
  );
}
