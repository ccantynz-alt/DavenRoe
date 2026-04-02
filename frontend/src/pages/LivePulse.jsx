import { useState, useEffect, useCallback, useRef } from 'react';
import ProprietaryNotice from '../components/ProprietaryNotice';

/* ───────────────────────────── helpers ───────────────────────────── */

function fmt(n, prefix = '$') {
  if (n >= 1000000) return `${prefix}${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${prefix}${(n / 1000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(0)}`;
}

function jitter(val, pct = 0.02) {
  return val * (1 + (Math.random() - 0.5) * 2 * pct);
}

function sparkData(base, len = 7) {
  return Array.from({ length: len }, () => jitter(base, 0.08));
}

function relTime(seconds) {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

/* ────────────────────────── initial data ─────────────────────────── */

const INITIAL_METRICS = [
  { id: 'cash', label: 'Cash Position', value: 247300, prefix: '$', spark: sparkData(247300), delta: 2.1, unit: 'today' },
  { id: 'rev', label: 'Revenue MTD', value: 42800, prefix: '$', spark: sparkData(42800), delta: 4.3, unit: 'vs last month' },
  { id: 'inv', label: 'Outstanding Invoices', value: 18200, prefix: '$', spark: sparkData(18200), delta: -1.2, unit: '3 overdue', warn: true },
  { id: 'burn', label: 'Burn Rate', value: 2100, prefix: '$', spark: sparkData(2100), delta: 0, unit: '/day', suffix: '/day', stable: true },
  { id: 'runway', label: 'Runway', value: 117, prefix: '', spark: sparkData(117), delta: 0, unit: 'days', suffix: ' days' },
];

const ACTIVITY_TEMPLATES = [
  { icon: 'tag', text: 'Transaction categorised: Office Supplies $45.90 → 5100', age: 2 },
  { icon: 'dollar', text: 'Invoice #1847 paid: $2,400 from Acme Corp', age: 15 },
  { icon: 'bank', text: 'Bank feed synced: 12 new transactions', age: 60 },
  { icon: 'bot', text: 'AI agent: Compliance deadline alert sent', age: 180 },
  { icon: 'check', text: 'Reconciliation complete: 34/34 matched', age: 240 },
  { icon: 'dollar', text: 'Payment received: $890 from Widget Co', age: 310 },
  { icon: 'tag', text: 'Bulk categorised: 8 transactions via smart rules', age: 420 },
  { icon: 'alert', text: 'Anomaly detected: Duplicate vendor payment $1,200', age: 500 },
  { icon: 'bot', text: 'Month-end close agent: Accruals posted', age: 630 },
  { icon: 'bank', text: 'TrueLayer sync: 5 new transactions (Barclays)', age: 780 },
  { icon: 'dollar', text: 'Invoice #1852 sent: $6,300 to GlobalTech', age: 900 },
  { icon: 'tag', text: 'Transaction categorised: SaaS Subscriptions $199 → 6200', age: 1020 },
  { icon: 'check', text: 'BAS Q3 draft generated — ready for review', age: 1200 },
  { icon: 'bot', text: 'Cash flow forecaster: 14-day projection updated', age: 1500 },
  { icon: 'bank', text: 'Plaid sync: 18 new transactions (Chase)', age: 1800 },
];

const NEW_ACTIVITIES = [
  'Receipt matched: Uber $32.50 → Travel & Transport',
  'Invoice #1860 overdue reminder sent to Apex Ltd',
  'AI categorised: Stripe payout $1,847.20 → Revenue',
  'Bank feed: 3 new transactions (ANZ)',
  'Payroll processed: 12 employees, $28,400 total',
  'Credit note CN-042 applied to Invoice #1831',
  'Vendor payment scheduled: $4,200 to CloudHost Inc',
  'Compliance: PAYG Q3 deadline in 12 days',
  'Anomaly flagged: Unusual after-hours transaction $890',
  'Document OCR complete: 4 receipts processed',
];

const AGENTS = [
  { name: 'Transaction Categoriser', task: 'Processing 24 transactions', progress: 78, active: true },
  { name: 'Bank Reconciler', task: 'Matching transactions for Entity A', progress: 45, active: true },
  { name: 'Compliance Monitor', task: 'Checking AU deadlines', progress: 100, active: false, done: true },
  { name: 'Cash Flow Forecaster', task: 'Building 30-day projection', progress: 62, active: true },
  { name: 'Receipt Scanner', task: 'OCR on 3 uploaded documents', progress: 33, active: true },
  { name: 'Month-End Agent', task: 'Idle — next run in 28 days', progress: 0, active: false },
];

const ALERTS_INIT = [
  { id: 1, text: '2 invoices overdue >30 days — $8,400 at risk', severity: 'red' },
  { id: 2, text: 'BAS Q3 due in 5 days — draft ready for review', severity: 'amber' },
];

/* ───────────────────────── sub-components ────────────────────────── */

function Sparkline({ data }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-px h-5 mt-1">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-1 rounded-sm bg-cyan-500/60"
          style={{ height: `${Math.max(((v - min) / range) * 100, 10)}%` }}
        />
      ))}
    </div>
  );
}

function ActivityIcon({ type }) {
  const icons = {
    tag: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    dollar: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 8v2" />
      </svg>
    ),
    bank: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    bot: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.591 1.591a2.25 2.25 0 01-1.591.659H8.182a2.25 2.25 0 01-1.591-.659L5 14.5" />
      </svg>
    ),
    check: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    alert: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  return icons[type] || icons.tag;
}

function HeartbeatChart({ data }) {
  /* Render an ECG-style SVG path for cash flow over 24h */
  const w = 800;
  const h = 100;
  const max = Math.max(...data.map(Math.abs));
  const step = w / (data.length - 1);

  let path = '';
  data.forEach((v, i) => {
    const x = i * step;
    const y = h / 2 - (v / (max || 1)) * (h / 2 - 8);
    path += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="hb-grad" x1="0" y1="0" x2="1" y2="0">
          {data.map((v, i) => (
            <stop
              key={i}
              offset={`${(i / (data.length - 1)) * 100}%`}
              stopColor={v >= 0 ? '#22d3ee' : '#f87171'}
            />
          ))}
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* zero line */}
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#374151" strokeWidth="0.5" strokeDasharray="4 4" />
      <path d={path} fill="none" stroke="url(#hb-grad)" strokeWidth="2" filter="url(#glow)" />
    </svg>
  );
}

/* ───────────────────────── main component ────────────────────────── */

export default function LivePulse() {
  const [healthScore, setHealthScore] = useState(82);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [activities, setActivities] = useState(ACTIVITY_TEMPLATES);
  const [agents, setAgents] = useState(AGENTS);
  const [alerts, setAlerts] = useState(ALERTS_INIT);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [heartbeat, setHeartbeat] = useState(() =>
    Array.from({ length: 48 }, (_, i) => (Math.sin(i * 0.5) * 2000 + Math.random() * 1000 - 500))
  );
  const tickRef = useRef(0);

  const dismissAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /* live update tick every 3 seconds */
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;

      /* health score wobble */
      setHealthScore((prev) => {
        const next = prev + (Math.random() - 0.48) * 2;
        return Math.max(20, Math.min(98, Math.round(next)));
      });

      /* metrics jitter */
      setMetrics((prev) =>
        prev.map((m) => {
          const newVal = jitter(m.value, 0.005);
          const newSpark = [...m.spark.slice(1), newVal];
          const newDelta = m.stable ? 0 : +(m.delta + (Math.random() - 0.48) * 0.3).toFixed(1);
          return { ...m, value: newVal, spark: newSpark, delta: newDelta };
        })
      );

      /* new activity every 2 ticks */
      if (tick % 2 === 0) {
        const tpl = NEW_ACTIVITIES[tick % NEW_ACTIVITIES.length];
        const icons = ['tag', 'dollar', 'bank', 'bot', 'check', 'alert'];
        setActivities((prev) => [
          { icon: icons[Math.floor(Math.random() * icons.length)], text: tpl, age: 0, key: Date.now() },
          ...prev.slice(0, 14),
        ]);
      }

      /* agent progress */
      setAgents((prev) =>
        prev.map((a) => {
          if (a.done) return a;
          if (!a.active) return a;
          let np = a.progress + Math.floor(Math.random() * 6);
          if (np >= 100) return { ...a, progress: 100, done: true, active: false };
          return { ...a, progress: np };
        })
      );

      /* heartbeat shift */
      setHeartbeat((prev) => {
        const next = [...prev.slice(1), Math.sin(tick * 0.5) * 2000 + Math.random() * 1500 - 750];
        return next;
      });

      /* last-updated counter */
      setLastUpdate(0);
    }, 3000);

    /* counter for "X seconds ago" */
    const counter = setInterval(() => {
      setLastUpdate((p) => p + 1);
    }, 1000);

    /* age up activities every second */
    const ageUp = setInterval(() => {
      setActivities((prev) => prev.map((a) => ({ ...a, age: a.age + 1 })));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(counter);
      clearInterval(ageUp);
    };
  }, []);

  const scoreColor =
    healthScore > 70 ? 'text-emerald-400' : healthScore > 40 ? 'text-amber-400' : 'text-red-400';
  const ringColor =
    healthScore > 70 ? '#34d399' : healthScore > 40 ? '#fbbf24' : '#f87171';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* ── CSS keyframes injected once ── */}
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 ${ringColor}55; }
          70% { box-shadow: 0 0 0 18px ${ringColor}00; }
          100% { box-shadow: 0 0 0 0 ${ringColor}00; }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scan-line {
          from { left: 0; }
          to { left: 100%; }
        }
        .pulse-ring { animation: pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        .fade-in { animation: fade-in-down 0.4s ease-out; }
        .heartbeat-scan {
          position: absolute; top: 0; bottom: 0; width: 2px;
          background: linear-gradient(to bottom, transparent, #22d3ee, transparent);
          animation: scan-line 6s linear infinite;
          opacity: 0.6;
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Alert Banner ── */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium ${
                  a.severity === 'red'
                    ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${a.severity === 'red' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  {a.text}
                </span>
                <button onClick={() => dismissAlert(a.id)} className="ml-4 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Live Pulse</h1>
            <p className="text-gray-500 text-sm mt-0.5">Real-time business heartbeat</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </div>
        </div>

        {/* ── Pulse Ring + Metrics ── */}
        <div className="flex flex-col lg:flex-row items-center gap-8 mb-10">

          {/* Pulse Ring */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div
              className="pulse-ring w-44 h-44 rounded-full flex items-center justify-center"
              style={{ border: `3px solid ${ringColor}` }}
            >
              <div className="flex flex-col items-center">
                <span className={`text-5xl font-bold font-mono ${scoreColor}`}>{healthScore}</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Health Score</span>
              </div>
            </div>
            <span className="text-[11px] text-gray-600 font-mono mt-3">
              Updated {lastUpdate}s ago
            </span>
          </div>

          {/* Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 flex-1 w-full">
            {metrics.map((m) => (
              <div
                key={m.id}
                className="bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors"
              >
                <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">{m.label}</div>
                <div className="text-xl font-bold font-mono text-white">
                  {m.prefix}{m.value >= 1000 ? fmt(m.value, '') : Math.round(m.value)}{m.suffix || ''}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {!m.stable && (
                    <span className={`text-xs font-mono ${m.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.delta >= 0 ? '+' : ''}{m.delta}%
                    </span>
                  )}
                  {m.stable && <span className="text-xs font-mono text-gray-500">stable</span>}
                  <span className="text-[10px] text-gray-600">{m.unit}</span>
                </div>
                <Sparkline data={m.spark} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Activity Stream + Agent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Activity Stream */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Activity Stream</h2>
              <span className="text-[10px] text-gray-600 font-mono">LIVE FEED</span>
            </div>
            <div className="divide-y divide-gray-800/60 max-h-[420px] overflow-y-auto">
              {activities.map((a, i) => (
                <div key={a.key || i} className={`flex items-start gap-3 px-4 py-2.5 ${i === 0 ? 'fade-in' : ''}`}>
                  <span className="mt-0.5 text-cyan-400/70">
                    <ActivityIcon type={a.icon} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 leading-snug truncate">{a.text}</p>
                  </div>
                  <span className="text-[10px] text-gray-600 font-mono whitespace-nowrap mt-0.5">
                    {relTime(a.age)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Agent Activity */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">AI Agent Activity</h2>
              <span className="text-[10px] font-mono text-emerald-400/80">
                {agents.filter((a) => a.active).length} active
              </span>
            </div>
            <div className="divide-y divide-gray-800/60">
              {agents.map((a, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          a.done ? 'bg-emerald-400' : a.active ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-200">{a.name}</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">
                      {a.done ? '100% \u2713' : a.active ? `${a.progress}%` : 'Idle'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 ml-4">{a.task}</p>
                  <div className="ml-4 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        a.done ? 'bg-emerald-500' : a.active ? 'bg-cyan-500' : 'bg-gray-700'
                      }`}
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Cash Flow Heartbeat ── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Cash Flow Heartbeat
              <span className="text-[10px] text-gray-600 font-normal ml-2">Last 24 hours</span>
            </h2>
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-cyan-400 inline-block rounded" /> Inflow</span>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-red-400 inline-block rounded" /> Outflow</span>
            </div>
          </div>
          <div className="relative h-28 px-4 py-2">
            <HeartbeatChart data={heartbeat} />
            <div className="heartbeat-scan" />
          </div>
        </div>

        {/* ── Proprietary Notice (dark-mode compatible) ── */}
        <div className="border-t border-gray-800 pt-4">
          <p className="text-[10px] text-gray-600 text-center leading-relaxed">
            Proprietary and Confidential. The technology, algorithms, agent architecture, and analytical methods
            displayed on this page are the intellectual property of AlecRae and are protected by copyright, trade
            secret law, and contractual obligations. Unauthorised reproduction, reverse engineering, or
            competitive analysis is prohibited under our{' '}
            <a href="/terms" className="underline hover:text-gray-400">Terms of Service</a> and
            applicable law. Patent applications may be pending.
          </p>
        </div>
      </div>
    </div>
  );
}
