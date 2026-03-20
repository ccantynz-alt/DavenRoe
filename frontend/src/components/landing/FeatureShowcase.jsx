import { useState, useEffect, useRef } from 'react';

/**
 * Scrolling feature showcase with animated cards
 * that reveal as you scroll down the page.
 */

const PILLARS = [
  {
    title: 'Autonomous Ledger',
    subtitle: 'AI-powered double-entry that learns from you',
    icon: '>',
    color: 'from-blue-500 to-indigo-600',
    stats: [
      { label: 'Auto-categorization accuracy', value: '94.7%' },
      { label: 'Time saved per month', value: '40+ hrs' },
      { label: 'Confidence threshold', value: '80%+' },
    ],
    features: [
      'Bank feed auto-matching with ML confidence scores',
      'Learns from your approvals — gets smarter every month',
      'Human-in-the-loop review queue for edge cases',
      'Full double-entry with debit/credit validation',
    ],
  },
  {
    title: 'Global Tax Engine',
    subtitle: '4 jurisdictions, 6 treaties, infinite complexity handled',
    icon: '%',
    color: 'from-green-500 to-emerald-600',
    stats: [
      { label: 'Tax treaties modeled', value: '6 DTAs' },
      { label: 'Tax types supported', value: '15+' },
      { label: 'Compliance deadlines tracked', value: '30+' },
    ],
    features: [
      'US (federal + state), Australia, New Zealand, United Kingdom',
      'Bilateral treaty engine: AU-US, AU-NZ, AU-GB, US-NZ, US-GB, NZ-GB',
      'Automatic WHT reduction with treaty benefit calculations',
      'Foreign income tax offsets and credit relief',
    ],
  },
  {
    title: 'Forensic Intelligence',
    subtitle: 'Catch what humans miss',
    icon: '!',
    color: 'from-red-500 to-pink-600',
    stats: [
      { label: "Benford's Law analysis", value: 'Real-time' },
      { label: 'Anomaly detection', value: 'ML-powered' },
      { label: 'Vendor cross-reference', value: 'Automated' },
    ],
    features: [
      "Benford's Law digit distribution analysis",
      'Duplicate payment and ghost vendor detection',
      'Related-party transaction identification',
      'Payroll phantom employee scanning',
    ],
  },
  {
    title: 'Ask Astra',
    subtitle: 'Plain English queries over your financial data',
    icon: '?',
    color: 'from-purple-500 to-violet-600',
    stats: [
      { label: 'Query types', value: 'Unlimited' },
      { label: 'Response time', value: '<2 sec' },
      { label: 'Languages', value: 'English' },
    ],
    features: [
      '"What\'s our cash position across all entities?"',
      '"Show me overdue invoices over $5,000"',
      '"Compare this quarter\'s expenses to last year"',
      '"What would our tax be if we opened a UK subsidiary?"',
    ],
  },
];

const WORKFLOW_STEPS = [
  { label: 'Transactions flow in', detail: 'Bank feeds, invoices, manual entries', icon: '1' },
  { label: 'AI categorizes & drafts entries', detail: '94.7% accuracy, learning continuously', icon: '2' },
  { label: 'Human reviews edge cases', detail: 'Only the 5% that need your expertise', icon: '3' },
  { label: 'Reports generate automatically', detail: 'P&L, Balance Sheet, Cash Flow, Trial Balance', icon: '4' },
  { label: 'Tax calculates across jurisdictions', detail: 'Treaty benefits applied automatically', icon: '5' },
  { label: 'Compliance deadlines tracked', detail: 'Never miss a BAS, GST, VAT, or PAYE deadline', icon: '6' },
];

export default function FeatureShowcase() {
  return (
    <div className="space-y-32">
      {/* How it works */}
      <section>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">How Astra Works</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            From raw transactions to tax-compliant financial statements — fully autonomous, with human oversight where it matters.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {WORKFLOW_STEPS.map((step, i) => (
            <AnimateOnScroll key={i} delay={i * 100}>
              <div className="bg-gray-900/60 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mb-4">
                  {step.icon}
                </div>
                <h3 className="text-white font-semibold mb-1">{step.label}</h3>
                <p className="text-gray-400 text-sm">{step.detail}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Four Pillars */}
      <section>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Four Pillars</h2>
          <p className="text-gray-400 text-lg">Everything an accounting firm needs. Nothing it doesn't.</p>
        </div>
        <div className="space-y-12 max-w-6xl mx-auto">
          {PILLARS.map((pillar, i) => (
            <AnimateOnScroll key={i} delay={0}>
              <PillarCard pillar={pillar} reversed={i % 2 === 1} />
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">The Old Way vs Astra</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8">
            <h3 className="text-red-400 font-semibold text-lg mb-4">Traditional Accounting</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              {[
                'Manual data entry from bank statements',
                'Spreadsheet-based reconciliation',
                'One jurisdiction at a time',
                'Reports generated weekly (at best)',
                'Tax deadlines tracked in calendars',
                'Fraud found during annual audit (maybe)',
                'Client communication via email chains',
                'Month-end close takes 5-10 business days',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">x</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-8">
            <h3 className="text-indigo-400 font-semibold text-lg mb-4">With Astra</h3>
            <ul className="space-y-3 text-gray-300 text-sm">
              {[
                'AI categorizes 95% of transactions automatically',
                'Real-time bank feed reconciliation',
                '4 jurisdictions + 6 treaties simultaneously',
                'Reports generated in seconds, on demand',
                'Compliance calendar with automated alerts',
                "Forensic analysis runs continuously (Benford's, anomaly detection)",
                'Client portal with scoped access',
                'Month-end close in 4.2 seconds',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Supported Jurisdictions */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Global From Day One</h2>
          <p className="text-gray-400 text-lg">Full tax compliance across four major jurisdictions with bilateral treaty support.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <JurisdictionCard code="AU" name="Australia" taxes={['GST (10%)', 'Company Tax (25-30%)', 'PAYG', 'FBT', 'STP']} color="blue" />
          <JurisdictionCard code="US" name="United States" taxes={['Federal Income Tax', 'State Tax', 'Sales Tax', 'Payroll (941)', 'Sec 179']} color="red" />
          <JurisdictionCard code="NZ" name="New Zealand" taxes={['GST (15%)', 'Income Tax (28%)', 'PAYE', 'Provisional Tax', 'RWT']} color="green" />
          <JurisdictionCard code="GB" name="United Kingdom" taxes={['VAT (20%)', 'Corporation Tax', 'PAYE RTI', 'MTD', 'Self Assessment']} color="purple" />
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12">
        <h2 className="text-5xl font-bold text-white mb-6">
          The future of accounting<br />is already here.
        </h2>
        <p className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto">
          Stop doing accounting. Start running your practice.
        </p>
        <div className="flex justify-center gap-4">
          <a href="#signup" className="px-8 py-4 bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/30">
            Start Free
          </a>
          <a href="#demo" className="px-8 py-4 bg-gray-800 text-gray-300 rounded-xl text-lg font-semibold hover:bg-gray-700 transition-colors border border-gray-700">
            Watch Demo
          </a>
        </div>
        <p className="text-gray-600 text-sm mt-4">No credit card required. Full access for 14 days.</p>
      </section>
    </div>
  );
}


function PillarCard({ pillar, reversed }) {
  return (
    <div className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 items-center`}>
      {/* Info side */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center text-white text-xl font-mono font-bold`}>
            {pillar.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{pillar.title}</h3>
            <p className="text-gray-400 text-sm">{pillar.subtitle}</p>
          </div>
        </div>
        <ul className="space-y-2 mb-6">
          {pillar.features.map((f, i) => (
            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
              <span className="text-indigo-400 mt-1">-</span> {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Stats side */}
      <div className="flex-1 grid grid-cols-1 gap-3 w-full lg:max-w-sm">
        {pillar.stats.map((stat, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">{stat.label}</span>
            <span className="text-lg font-bold font-mono text-white">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function JurisdictionCard({ code, name, taxes, color }) {
  const colors = {
    blue: 'border-blue-500/30 bg-blue-900/20',
    red: 'border-red-500/30 bg-red-900/20',
    green: 'border-green-500/30 bg-green-900/20',
    purple: 'border-purple-500/30 bg-purple-900/20',
  };
  const textColors = {
    blue: 'text-blue-400',
    red: 'text-red-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
  };
  return (
    <div className={`border rounded-xl p-5 ${colors[color]}`}>
      <div className={`text-3xl font-bold font-mono ${textColors[color]} mb-1`}>{code}</div>
      <div className="text-white font-medium text-sm mb-3">{name}</div>
      <ul className="space-y-1">
        {taxes.map((t, i) => (
          <li key={i} className="text-xs text-gray-400">- {t}</li>
        ))}
      </ul>
    </div>
  );
}


function AnimateOnScroll({ children, delay = 0 }) {
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
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      {children}
    </div>
  );
}
