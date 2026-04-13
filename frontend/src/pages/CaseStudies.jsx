import { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/Toast';

/* ───────────────────────── ROI Calculator ───────────────────────── */

function ROICalculator() {
  const [clients, setClients] = useState(50);
  const [currentSpend, setCurrentSpend] = useState(384);
  const [manualHours, setManualHours] = useState(15);

  const astraPrice = clients <= 45 ? 149 : clients <= 150 ? 499 : 999;
  const annualSaving = Math.max(0, (currentSpend - astraPrice) * 12);
  const automationRate = 0.73;
  const hoursSavedPerYear = Math.round(manualHours * automationRate * 52);
  const hourlyRateIncrease = manualHours > 0
    ? Math.round((annualSaving / (manualHours * 52)) * 100) / 100
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">ROI Calculator</h3>
          <p className="text-sm text-gray-500">See how much you could save switching to DavenRoe</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of clients
            </label>
            <input
              type="range"
              min={1}
              max={500}
              value={clients}
              onChange={(e) => setClients(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">1</span>
              <span className="text-sm font-semibold text-blue-600">{clients} clients</span>
              <span className="text-xs text-gray-400">500</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current monthly software spend
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="number"
                min={0}
                max={10000}
                value={currentSpend}
                onChange={(e) => setCurrentSpend(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Average multi-tool stack: $384/mo (QBO + Gusto + Dext + Fathom + Chaser + Float)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours spent on manual tasks per week
            </label>
            <input
              type="range"
              min={0}
              max={60}
              value={manualHours}
              onChange={(e) => setManualHours(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">0</span>
              <span className="text-sm font-semibold text-blue-600">{manualHours} hrs/week</span>
              <span className="text-xs text-gray-400">60</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500">
              <span className="font-semibold">DavenRoe tier selected:</span>{' '}
              {clients <= 45 ? 'Practice ($149/mo)' : clients <= 150 ? 'Firm ($499/mo)' : 'Enterprise ($999/mo)'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Automation rate: 73% of manual tasks (platform average)
            </p>
          </div>
        </div>

        {/* Outputs */}
        <div className="space-y-4">
          <ResultCard
            label="Annual Software Saving"
            value={`$${annualSaving.toLocaleString()}`}
            subtitle="switching to a single DavenRoe subscription"
            color="emerald"
          />
          <ResultCard
            label="Hours Saved Per Year"
            value={hoursSavedPerYear.toLocaleString()}
            subtitle="through AI-powered automation"
            color="blue"
          />
          <ResultCard
            label="Effective Hourly Rate Increase"
            value={`$${hourlyRateIncrease.toLocaleString()}`}
            subtitle="reinvested into advisory and growth"
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}

function ResultCard({ label, value, subtitle, color }) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  const badgeColors = {
    emerald: 'bg-emerald-100 text-emerald-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className={`rounded-xl border p-6 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-3xl font-bold">{value}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeColors[color]}`}>
          saving
        </span>
      </div>
      <p className="text-xs mt-2 opacity-70">{subtitle}</p>
    </div>
  );
}

/* ──────────────────────── Case Study Cards ───────────────────────── */

const CASE_STUDIES = [
  {
    company: 'Smith & Associates',
    industry: 'Public Practice',
    jurisdiction: 'Australia',
    flag: '🇦🇺',
    size: '45 clients',
    challenge:
      'The team was spending 40 hours per month on manual bank reconciliation across their client base. Staff overtime costs were escalating and error rates were climbing.',
    solution: ['AI Categoriser', 'Bank Reconciler', 'Review Queue'],
    results: [
      { metric: 'Reconciliation time', before: '40 hrs/mo', after: '4 hrs/mo' },
      { metric: 'Auto-categorisation rate', before: '0%', after: '95%' },
      { metric: 'Annual staff cost saved', before: '$48K overhead', after: '$0 overhead' },
    ],
    quote:
      '"We went from dreading month-end to barely noticing it. DavenRoe categorises transactions with 95% accuracy — our junior staff now spend their time on advisory instead of data entry."',
    author: 'Sarah Chen, Managing Partner',
  },
  {
    company: 'Pacific Tax Partners',
    industry: 'Tax Advisory',
    jurisdiction: 'New Zealand / Australia',
    flag: '🇳🇿',
    size: '120 clients across AU/NZ',
    challenge:
      'Managing two jurisdictions required maintaining two separate platforms with different logins, different compliance calendars, and duplicated data. Deadlines were falling through the cracks.',
    solution: ['Multi-Jurisdiction Engine', 'Compliance Calendar', 'Cross-Border Tax Treaties'],
    results: [
      { metric: 'Duplicate subscriptions', before: '$7,200/yr', after: '$0/yr' },
      { metric: 'Platform logins required', before: '2 separate', after: '1 unified' },
      { metric: 'Missed compliance deadlines', before: '3 per year', after: '0 per year' },
    ],
    quote:
      '"Having AU and NZ in one platform with a single compliance calendar changed everything. We caught three deadlines that would have resulted in penalties — DavenRoe paid for itself in the first month."',
    author: 'James Wiremu, Director',
  },
  {
    company: 'Thames Advisory Group',
    industry: 'Management Accounting',
    jurisdiction: 'United Kingdom',
    flag: '🇬🇧',
    size: '80 clients',
    challenge:
      'Month-end close was taking 3 to 5 days per client, consuming the entire team and leaving no capacity for the advisory services clients were asking for.',
    solution: ['Autonomous Month-End Close', 'Agentic AI', 'AI Command Center'],
    results: [
      { metric: 'Close time per client', before: '4 days', after: '4.2 seconds' },
      { metric: 'Weekly hours freed', before: '0 hrs advisory', after: '15 hrs advisory' },
      { metric: 'Advisory revenue growth', before: 'Baseline', after: '+34%' },
    ],
    quote:
      '"Four days to four seconds — I had to see it twice to believe it. The autonomous close agent handles reconciliation, accruals, and reporting while we focus on the work that actually grows our practice."',
    author: 'Oliver Hughes, Practice Lead',
  },
  {
    company: 'Meridian Accounting',
    industry: 'Forensic & General Practice',
    jurisdiction: 'United States',
    flag: '🇺🇸',
    size: '200+ clients',
    challenge:
      'A long-standing client lost $180,000 to a ghost vendor scheme that went undetected for over two years. The firm had no fraud detection tools and relied entirely on manual spot checks.',
    solution: ['Forensic Intelligence Suite', 'Ghost Vendor Detection', "Benford's Law Analysis"],
    results: [
      { metric: 'Suspicious vendors flagged', before: '0 detected', after: '4 flagged instantly' },
      { metric: 'Fraudulent payments prevented', before: '$180K lost', after: '$94K prevented' },
      { metric: 'Forensic sweeps', before: 'None', after: 'Monthly automated' },
    ],
    quote:
      '"After the ghost vendor incident, we needed forensic capability but couldn\'t justify a dedicated tool at $15K a year. DavenRoe includes Benford\'s analysis, vendor audits, and money trail tracking in the standard subscription. We run monthly sweeps for every client now."',
    author: 'David Morales, CPA, Senior Partner',
  },
];

function CaseStudyCard({ study }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{study.flag}</span>
              <h4 className="text-lg font-bold text-gray-900">{study.company}</h4>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                {study.industry}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                {study.jurisdiction}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-50 text-purple-700">
                {study.size}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge */}
      <div className="px-6 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-1">Challenge</p>
        <p className="text-sm text-gray-600 leading-relaxed">{study.challenge}</p>
      </div>

      {/* Solution */}
      <div className="px-6 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-2">Solution</p>
        <div className="flex flex-wrap gap-2">
          {study.solution.map((feature) => (
            <span
              key={feature}
              className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-6 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-2">Results</p>
        <div className="space-y-2">
          {study.results.map((r) => (
            <div key={r.metric} className="flex items-center gap-3 text-sm">
              <span className="text-gray-500 min-w-[140px]">{r.metric}</span>
              <span className="text-red-400 line-through text-xs">{r.before}</span>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-emerald-600 font-semibold">{r.after}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <div className="bg-gray-50 border-t border-gray-100 px-6 py-4">
        <p className="text-sm text-gray-600 italic leading-relaxed">{study.quote}</p>
        <p className="text-xs font-semibold text-gray-500 mt-2">-- {study.author}</p>
      </div>
    </div>
  );
}

/* ──────────────────── Animated Stat Counters ─────────────────────── */

const PLATFORM_STATS = [
  { label: 'Transactions Processed', value: 2400000, suffix: '+', format: true, prefix: '' },
  { label: 'Categorisation Accuracy', value: 95, suffix: '%+', format: false, prefix: '' },
  { label: 'Countries Supported', value: 4, suffix: '', format: false, prefix: '' },
  { label: 'AI Agents', value: 25, suffix: '', format: false, prefix: '' },
  { label: 'Month-End Close Time', value: 4.2, suffix: ' sec', format: false, prefix: '' },
  { label: 'Support Auto-Resolution', value: 78, suffix: '%', format: false, prefix: '' },
];

function AnimatedCounter({ stat }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const target = stat.value;
          const duration = 1500;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            setDisplayValue(current);
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [stat.value]);

  const formatted = stat.format
    ? Math.round(displayValue).toLocaleString()
    : Number.isInteger(stat.value)
      ? Math.round(displayValue)
      : displayValue.toFixed(1);

  return (
    <div ref={ref} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
      <p className="text-3xl font-bold text-gray-900">
        {stat.prefix}
        {formatted}
        {stat.suffix}
      </p>
      <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
    </div>
  );
}

/* ──────────────────────── Main Page ─────────────────────────────── */

export default function CaseStudies() {
  const { addToast } = useToast();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Case Studies</h2>
        <p className="text-gray-500 mt-1">
          Real outcomes from practices that switched to DavenRoe
        </p>
      </div>

      {/* ROI Calculator */}
      <section className="mb-12">
        <ROICalculator />
      </section>

      {/* Case Studies */}
      <section className="mb-12">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Featured Stories</h3>
        <p className="text-sm text-gray-500 mb-6">
          How accounting practices across four countries transformed their operations
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CASE_STUDIES.map((study) => (
            <CaseStudyCard key={study.company} study={study} />
          ))}
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="mb-12">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Platform at a Glance</h3>
        <p className="text-sm text-gray-500 mb-6">Numbers that speak for themselves</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PLATFORM_STATS.map((stat) => (
            <AnimatedCounter key={stat.label} stat={stat} />
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="text-center pb-8">
        <p className="text-xs text-gray-400">
          Case studies represent projected outcomes based on platform capabilities. Individual results
          may vary.
        </p>
      </div>
    </div>
  );
}
