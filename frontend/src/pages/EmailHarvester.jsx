import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Email Harvester — snapshot, extract, draft-with-GST in one live pipeline.
 *
 * Visual "fishhook": live animated pipeline a prospect can run on sample
 * emails (or paste their own) without any mailbox connection. Designed to
 * make switching feel inevitable.
 */

const SAMPLE_SEED = [
  {
    email_id: 'sample-nz-spark',
    subject: 'Your Spark Business bill — March 2026',
    sender_name: 'Spark NZ',
    sender_email: 'billing@spark.co.nz',
    date: '2026-03-28',
    body_preview:
      'Invoice number INV-2026-0391. Subtotal NZ$139.13 plus GST NZ$20.87. Total amount due NZ$160.00 by 10 April 2026.',
    has_attachment: true,
  },
  {
    email_id: 'sample-au-officeworks',
    subject: 'Receipt from Officeworks — Order 94410',
    sender_name: 'Officeworks',
    sender_email: 'noreply@officeworks.com.au',
    date: '2026-03-22',
    body_preview:
      'Thank you for your purchase. Total AU$242.00 including GST AU$22.00. Order confirmation for stationery supplies.',
    has_attachment: false,
  },
  {
    email_id: 'sample-aws',
    subject: 'AWS Invoice 102893421',
    sender_name: 'Amazon Web Services',
    sender_email: 'no-reply-aws@amazon.com',
    date: '2026-04-03',
    body_preview:
      'AWS charges for March 2026. Invoice number 102893421. Amount due US$1,284.56. Payment will be charged to your card.',
    has_attachment: true,
  },
];

export default function EmailHarvester() {
  const [samples, setSamples] = useState(SAMPLE_SEED);
  const [selected, setSelected] = useState(() => new Set(SAMPLE_SEED.map((e) => e.email_id)));
  const [custom, setCustom] = useState({ subject: '', sender_email: '', body_preview: '' });
  const [pipelineStage, setPipelineStage] = useState('idle'); // idle|snapshot|extract|calc|draft|done
  const [results, setResults] = useState([]);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(null);
  const [pipelineId, setPipelineId] = useState(null);

  useEffect(() => {
    api
      .get('/email-harvester/sample-emails')
      .then(({ data }) => {
        if (data?.emails?.length) {
          setSamples(data.emails);
          setSelected(new Set(data.emails.map((e) => e.email_id)));
        }
      })
      .catch(() => {});
  }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runPipeline = useCallback(async () => {
    const queue = samples.filter((s) => selected.has(s.email_id));
    const addCustom =
      custom.subject.trim() || custom.body_preview.trim() || custom.sender_email.trim();
    if (addCustom) {
      queue.push({
        email_id: `custom-${Date.now()}`,
        subject: custom.subject || 'Custom invoice',
        sender_name: custom.sender_email.split('@')[0] || 'Custom sender',
        sender_email: custom.sender_email || 'unknown@example.com',
        date: new Date().toISOString().slice(0, 10),
        body_preview: custom.body_preview,
        has_attachment: false,
      });
    }
    if (!queue.length) return;

    setResults([]);
    setApproved(null);
    setPipelineStage('snapshot');
    await new Promise((r) => setTimeout(r, 600));
    setPipelineStage('extract');
    await new Promise((r) => setTimeout(r, 600));
    setPipelineStage('calc');

    try {
      const { data } = await api.post('/email-harvester/harvest', { emails: queue });
      setPipelineId(data.pipeline_id);
      setPipelineStage('draft');
      await new Promise((r) => setTimeout(r, 400));
      setResults(data.results || []);
      setPipelineStage('done');
    } catch {
      // Demo fallback — build results client-side
      const demoResults = queue.map((email) => buildDemoResult(email));
      setPipelineStage('draft');
      await new Promise((r) => setTimeout(r, 400));
      setResults(demoResults);
      setPipelineStage('done');
    }
  }, [samples, selected, custom]);

  const approveAll = async () => {
    if (!pipelineId || !results.length) return;
    setApproving(true);
    try {
      const { data } = await api.post(
        `/email-harvester/pipeline/${pipelineId}/approve`,
        results.map((r) => r.draft.draft_id),
      );
      setApproved(data);
    } catch {
      setApproved({
        approved_count: results.length,
        message: `${results.length} draft transaction(s) landed in Review Queue (demo mode).`,
      });
    } finally {
      setApproving(false);
    }
  };

  const reset = () => {
    setResults([]);
    setApproved(null);
    setPipelineStage('idle');
    setPipelineId(null);
  };

  const running = pipelineStage !== 'idle' && pipelineStage !== 'done';
  const done = pipelineStage === 'done';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Hero />

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
            1. Pick emails to harvest
          </h2>
          <div className="space-y-2">
            {samples.map((s) => (
              <SampleRow
                key={s.email_id}
                email={s}
                selected={selected.has(s.email_id)}
                onToggle={() => toggle(s.email_id)}
              />
            ))}
          </div>

          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mt-6 mb-3">
            Or paste one of yours
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <input
              type="text"
              value={custom.subject}
              onChange={(e) => setCustom((c) => ({ ...c, subject: e.target.value }))}
              placeholder="Subject: e.g. Tax Invoice #1042"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              type="text"
              value={custom.sender_email}
              onChange={(e) => setCustom((c) => ({ ...c, sender_email: e.target.value }))}
              placeholder="Sender email: e.g. billing@somevendor.co.nz"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <textarea
              rows={3}
              value={custom.body_preview}
              onChange={(e) => setCustom((c) => ({ ...c, body_preview: e.target.value }))}
              placeholder="Paste the body. Include the total, GST and invoice number."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              disabled={running}
              onClick={runPipeline}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {running ? 'Harvesting…' : done ? 'Run again' : 'Run pipeline →'}
            </button>
            {done && (
              <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-800">
                Reset
              </button>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
            2. Live pipeline
          </h2>
          <PipelineStrip stage={pipelineStage} />
        </section>
      </div>

      {done && results.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
              3. Review drafts — ready for the Review Queue
            </h2>
            <button
              disabled={approving || approved}
              onClick={approveAll}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-emerald-700 disabled:opacity-60 transition"
            >
              {approving ? 'Sending…' : approved ? '✓ Sent to Review Queue' : 'Approve all & send to Review'}
            </button>
          </div>

          {approved && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
              {approved.message}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {results.map((r, i) => (
              <DraftCard key={i} result={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Hero() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white shadow-xl">
      <div className="absolute inset-0 opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, #ffffff33 0, transparent 40%), radial-gradient(circle at 80% 80%, #ffffff33 0, transparent 40%)",
        }}
      />
      <div className="relative px-8 py-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 text-xs font-semibold uppercase tracking-widest">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
          </span>
          Live AI pipeline
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">
          Your inbox is an accounting ledger. You just don't know it yet.
        </h1>
        <p className="mt-3 text-indigo-100 text-lg max-w-3xl">
          Connect Gmail or Outlook. DavenRoe finds every invoice, takes a
          snapshot, extracts every figure, calculates GST for the right
          jurisdiction and queues a draft for you to approve. No printer, no
          scanner, no typing.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <Pill>Gmail</Pill>
          <Pill>Outlook / Microsoft 365</Pill>
          <Pill>AU GST 10%</Pill>
          <Pill>NZ GST 15%</Pill>
          <Pill>UK VAT 20%</Pill>
          <Pill>Review Queue ready</Pill>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur">
      {children}
    </span>
  );
}

function SampleRow({ email, selected, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-3 rounded-xl border-2 transition flex items-start gap-3 ${
        selected
          ? 'border-indigo-500 bg-indigo-50/50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div
        className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
          selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
        }`}
      >
        {selected && <span className="text-white text-[10px]">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{email.subject}</p>
        <p className="text-xs text-gray-500 truncate">
          from {email.sender_name} &lt;{email.sender_email}&gt; · {email.date}
        </p>
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{email.body_preview}</p>
      </div>
    </button>
  );
}

function PipelineStrip({ stage }) {
  const steps = [
    { id: 'snapshot', label: 'Snapshot', detail: 'Capture the email + attachment' },
    { id: 'extract',  label: 'Extract',  detail: 'Pull vendor, amounts, invoice #' },
    { id: 'calc',     label: 'Calculate',detail: 'Apply GST / VAT for jurisdiction' },
    { id: 'draft',    label: 'Draft',    detail: 'Land in Review Queue' },
  ];
  const order = ['idle', 'snapshot', 'extract', 'calc', 'draft', 'done'];
  const currentIdx = order.indexOf(stage);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="space-y-3">
        {steps.map((s, i) => {
          const myIdx = order.indexOf(s.id);
          const active = stage === s.id;
          const doneStep = currentIdx > myIdx;
          return (
            <div key={s.id} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  doneStep
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {doneStep ? '✓' : i + 1}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className={`text-sm font-semibold ${active ? 'text-indigo-700' : doneStep ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {s.label}
                </p>
                <p className="text-xs text-gray-500">{s.detail}</p>
              </div>
              {active && (
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mt-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DraftCard({ result }) {
  const { snapshot, extracted, draft } = result;
  const confidencePct = Math.round((draft.ai_confidence || 0) * 100);
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
        <img
          src={snapshot.thumbnail_data_url}
          alt="snapshot"
          className="w-full h-40 object-cover rounded-lg border border-gray-200"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{draft.vendor}</h3>
            <p className="text-xs text-gray-500 truncate">{draft.description}</p>
          </div>
          <span
            className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
              confidencePct >= 80
                ? 'bg-emerald-100 text-emerald-700'
                : confidencePct >= 50
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700'
            }`}
          >
            {confidencePct}% AI
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-y-1 text-xs mb-3">
          <dt className="text-gray-500">Date</dt>
          <dd className="text-gray-900 font-medium text-right">{draft.transaction_date}</dd>
          <dt className="text-gray-500">Invoice #</dt>
          <dd className="text-gray-900 font-medium text-right">{extracted.invoice_number || '—'}</dd>
          <dt className="text-gray-500">Jurisdiction</dt>
          <dd className="text-gray-900 font-medium text-right">{draft.tax_jurisdiction} · {draft.currency}</dd>
          <dt className="text-gray-500">Tax rate applied</dt>
          <dd className="text-gray-900 font-medium text-right">{(Number(draft.tax_rate) * 100).toFixed(1)}%</dd>
        </dl>
        <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-lg p-2">
          <Money label="Net" value={draft.amount_net} currency={draft.currency} />
          <Money label="Tax" value={draft.amount_tax} currency={draft.currency} accent />
          <Money label="Gross" value={draft.amount_gross} currency={draft.currency} bold />
        </div>
        <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">{draft.ai_reasoning}</p>
      </div>
    </div>
  );
}

function Money({ label, value, currency, accent, bold }) {
  const n = Number(value || 0);
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className={`${bold ? 'text-gray-900 font-bold' : accent ? 'text-indigo-700 font-semibold' : 'text-gray-700 font-medium'} text-sm mt-0.5`}
      >
        {currency} {n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// ─── Demo fallback (when backend is not reachable) ──────────────────────────

function buildDemoResult(email) {
  const subtotal = extractNumber(email.body_preview, /subtotal[^\d]*([\d,.]+)/i) || 0;
  let tax = extractNumber(email.body_preview, /(?:gst|vat|tax)[^\d]*([\d,.]+)/i) || 0;
  let total = extractNumber(email.body_preview, /total[^\d]*([\d,.]+)/i) || subtotal + tax;
  const domain = (email.sender_email || '').split('@')[1] || '';
  let jurisdiction = 'US';
  let currency = 'USD';
  let rate = 0;
  if (domain.endsWith('.co.nz')) { jurisdiction = 'NZ'; currency = 'NZD'; rate = 0.15; }
  else if (domain.endsWith('.com.au')) { jurisdiction = 'AU'; currency = 'AUD'; rate = 0.10; }
  else if (domain.endsWith('.co.uk')) { jurisdiction = 'GB'; currency = 'GBP'; rate = 0.20; }
  const net = subtotal || (total / (1 + rate));
  const computedTax = tax || net * rate;
  const gross = total || net + computedTax;
  return {
    email_id: email.email_id,
    snapshot: {
      snapshot_id: `snap-demo-${email.email_id}`,
      kind: 'email',
      thumbnail_data_url: buildDemoSvg(email, `${currency} ${gross.toFixed(2)}`),
      byte_count: email.body_preview.length,
    },
    extracted: {
      vendor_name: email.sender_name,
      invoice_number: (email.body_preview.match(/(?:invoice|inv|order)[^a-z]*([A-Z0-9-]{3,})/i) || [])[1] || null,
      currency,
    },
    draft: {
      draft_id: `draft-demo-${email.email_id}`,
      vendor: email.sender_name,
      description: email.subject,
      transaction_date: email.date || new Date().toISOString().slice(0, 10),
      amount_net: net.toFixed(2),
      amount_tax: computedTax.toFixed(2),
      amount_gross: gross.toFixed(2),
      currency,
      tax_jurisdiction: jurisdiction,
      tax_rate: rate.toString(),
      ai_confidence: subtotal && tax ? 0.88 : 0.62,
      ai_reasoning: `Demo-mode extraction from "${email.subject}" — jurisdiction ${jurisdiction} @ ${(rate * 100).toFixed(0)}%.`,
    },
  };
}

function extractNumber(text, re) {
  const m = (text || '').match(re);
  if (!m) return null;
  return Number(m[1].replace(/,/g, ''));
}

function buildDemoSvg(email, amount) {
  const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320" width="500" height="320">' +
    '<defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">' +
    '<stop offset="0%" stop-color="#eef2ff"/><stop offset="100%" stop-color="#ffffff"/></linearGradient></defs>' +
    '<rect width="500" height="320" fill="url(#bg)"/>' +
    '<rect x="16" y="16" width="468" height="288" rx="12" fill="white" stroke="#e2e8f0"/>' +
    '<rect x="16" y="16" width="468" height="44" rx="12" fill="#4f46e5"/>' +
    '<text x="32" y="44" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="white">Email snapshot</text>' +
    `<text x="32" y="96" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#0f172a">${esc(email.subject.slice(0, 70))}</text>` +
    `<text x="32" y="124" font-family="Inter, sans-serif" font-size="12" fill="#475569">from ${esc(email.sender_email)}</text>` +
    `<text x="480" y="280" font-family="Inter, sans-serif" font-size="36" font-weight="700" fill="#1e293b" text-anchor="end">${esc(amount)}</text>` +
    '</svg>';
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}
