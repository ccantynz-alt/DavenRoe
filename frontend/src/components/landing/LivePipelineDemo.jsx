import { useState, useEffect, useRef } from 'react';

/**
 * Auto-playing pipeline demo embedded in the Landing page.
 *
 * Shows three sample invoices being automatically:
 *   1. Snapshotted (SVG preview)
 *   2. AI-extracted (vendor, amount, invoice #)
 *   3. GST-calculated (jurisdiction + rate)
 *   4. Drafted into Review Queue
 *
 * Loops forever. Zero user interaction required — the goal is to make
 * a prospect stop scrolling and say "I need this."
 */

const INVOICES = [
  {
    vendor: 'Spark NZ',
    email: 'billing@spark.co.nz',
    subject: 'Your Spark Business bill — March 2026',
    invoiceNo: 'INV-2026-0391',
    subtotal: 139.13,
    tax: 20.87,
    total: 160.00,
    currency: 'NZD',
    jurisdiction: 'NZ',
    rate: '15%',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    vendor: 'Officeworks',
    email: 'noreply@officeworks.com.au',
    subject: 'Receipt — Order 94410',
    invoiceNo: '94410',
    subtotal: 220.00,
    tax: 22.00,
    total: 242.00,
    currency: 'AUD',
    jurisdiction: 'AU',
    rate: '10%',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    vendor: 'Amazon Web Services',
    email: 'no-reply-aws@amazon.com',
    subject: 'AWS Invoice 102893421',
    invoiceNo: '102893421',
    subtotal: 1284.56,
    tax: 0,
    total: 1284.56,
    currency: 'USD',
    jurisdiction: 'US',
    rate: '0%',
    color: 'from-orange-500 to-rose-600',
  },
];

const STAGES = ['idle', 'snapshot', 'extract', 'calculate', 'draft', 'done'];

function usePipelineAnimation() {
  const [invoiceIdx, setInvoiceIdx] = useState(0);
  const [stage, setStage] = useState('idle');

  useEffect(() => {
    let timers = [];
    function run() {
      timers.push(setTimeout(() => setStage('snapshot'),   400));
      timers.push(setTimeout(() => setStage('extract'),   1200));
      timers.push(setTimeout(() => setStage('calculate'), 2000));
      timers.push(setTimeout(() => setStage('draft'),     2800));
      timers.push(setTimeout(() => setStage('done'),      3600));
      timers.push(setTimeout(() => {
        setStage('idle');
        setInvoiceIdx((i) => (i + 1) % INVOICES.length);
      }, 5200));
    }
    run();
    const loop = setInterval(run, 5600);
    return () => { clearInterval(loop); timers.forEach(clearTimeout); };
  }, []);

  return { invoice: INVOICES[invoiceIdx], stage, invoiceIdx };
}

export default function LivePipelineDemo() {
  const { invoice, stage, invoiceIdx } = usePipelineAnimation();
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const stageIdx = STAGES.indexOf(stage);

  return (
    <section
      ref={sectionRef}
      className="py-24 px-6 lg:px-12 bg-[#08090d] overflow-hidden"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease-out' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            </span>
            Live demo — no signup needed
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            Watch your inbox become a ledger
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            DavenRoe scans your email, snapshots every invoice, extracts every
            figure, calculates GST for the right country and drafts the
            transaction. You just approve.
          </p>
        </div>

        {/* Pipeline visual */}
        <div className="grid lg:grid-cols-5 gap-4 items-start">
          {/* Email card */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl border transition-all duration-500 overflow-hidden ${
              stageIdx >= 1 ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/10' : 'border-white/10'
            }`}>
              <div className={`h-1.5 bg-gradient-to-r ${invoice.color} transition-all duration-700 ${
                stageIdx >= 1 ? 'opacity-100' : 'opacity-0'
              }`} />
              <div className="bg-white/[0.03] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${invoice.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {invoice.vendor[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{invoice.vendor}</p>
                    <p className="text-[10px] text-gray-500">{invoice.email}</p>
                  </div>
                </div>
                <p className="text-sm text-white/70 font-medium mb-2">{invoice.subject}</p>
                <div className="flex items-baseline gap-1 text-right">
                  <span className="text-2xl font-bold text-white ml-auto">
                    {invoice.currency} {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-4">
              {INVOICES.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === invoiceIdx ? 'bg-indigo-500 w-6' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Pipeline stages */}
          <div className="lg:col-span-3 space-y-3">
            <StageRow
              num={1}
              label="Snapshot"
              detail={stageIdx >= 1 ? `Captured email from ${invoice.vendor}` : 'Awaiting email...'}
              active={stage === 'snapshot'}
              done={stageIdx > 1}
            />
            <StageRow
              num={2}
              label="AI Extract"
              detail={
                stageIdx >= 2
                  ? `${invoice.invoiceNo} · ${invoice.currency} ${invoice.subtotal.toFixed(2)} + tax ${invoice.tax.toFixed(2)}`
                  : 'Waiting for snapshot...'
              }
              active={stage === 'extract'}
              done={stageIdx > 2}
            />
            <StageRow
              num={3}
              label="GST / VAT Calculate"
              detail={
                stageIdx >= 3
                  ? `${invoice.jurisdiction} ${invoice.rate} applied → net ${invoice.currency} ${invoice.subtotal.toFixed(2)}, tax ${invoice.currency} ${invoice.tax.toFixed(2)}`
                  : 'Waiting for extraction...'
              }
              active={stage === 'calculate'}
              done={stageIdx > 3}
            />
            <StageRow
              num={4}
              label="Draft to Review Queue"
              detail={
                stageIdx >= 4
                  ? `Draft created — ${invoice.vendor} · ${invoice.currency} ${invoice.total.toFixed(2)} — awaiting your approval`
                  : 'Waiting for calculation...'
              }
              active={stage === 'draft'}
              done={stageIdx > 4}
            />

            {/* Result flash */}
            {stage === 'done' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-300">
                    Transaction drafted in 3.2 seconds
                  </p>
                  <p className="text-xs text-emerald-400/60">
                    {invoice.vendor} · {invoice.currency} {invoice.total.toFixed(2)} · GST {invoice.rate} ({invoice.jurisdiction}) · Ready for approval
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom callout */}
        <div className="mt-14 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Works with Gmail, Outlook, and Microsoft 365.
            Supports AU (10% GST), NZ (15% GST), UK (20% VAT), and US jurisdictions.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold text-white/40">
            {['No printer needed', 'No manual data entry', 'No scanning', '99.1% accuracy', 'Human approves every draft'].map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StageRow({ num, label, detail, active, done }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl p-3 transition-all duration-500 ${
      active ? 'bg-indigo-500/10 border border-indigo-500/30' :
      done ? 'bg-white/[0.02] border border-white/[0.06]' :
      'bg-white/[0.01] border border-white/[0.04]'
    }`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
        done ? 'bg-emerald-500 text-white' :
        active ? 'bg-indigo-600 text-white animate-pulse' :
        'bg-white/10 text-gray-500'
      }`}>
        {done ? '✓' : num}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold transition-colors ${
          done ? 'text-emerald-300' : active ? 'text-indigo-300' : 'text-gray-500'
        }`}>{label}</p>
        <p className={`text-xs transition-colors mt-0.5 ${
          done ? 'text-gray-400' : active ? 'text-indigo-200/60' : 'text-gray-600'
        }`}>{detail}</p>
      </div>
      {active && (
        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mt-1.5" />
      )}
    </div>
  );
}
