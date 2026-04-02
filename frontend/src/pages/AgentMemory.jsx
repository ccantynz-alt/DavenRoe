import { useState } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

const OVERVIEW = {
  totalMemories: 847,
  clientPatterns: 234,
  corrections: 89,
  accuracyImprovement: 12.4,
};

const MEMORIES = {
  pattern: [
    { id: 'p1', key: 'vendor:officeworks:category', value: 'Always categorise to 5100 (Office Supplies)', confidence: 0.98, timesApplied: 47, source: 'auto_learned', agent: 'AI Categorizer', entity: 'Coastal Coffee', created: '2026-03-18T09:14:00Z' },
    { id: 'p2', key: 'vendor:anz:interest', value: 'Always categorise to 4200 (Interest Income)', confidence: 0.99, timesApplied: 36, source: 'auto_learned', agent: 'AI Categorizer', entity: 'NorthStar Consulting', created: '2026-03-25T11:02:00Z' },
    { id: 'p3', key: 'vendor:telstra:category', value: 'Always categorise to 5300 (Telecommunications)', confidence: 0.97, timesApplied: 24, source: 'auto_learned', agent: 'AI Categorizer', entity: 'Coastal Coffee', created: '2026-02-10T14:30:00Z' },
    { id: 'p4', key: 'vendor:bunnings:category', value: 'Always categorise to 5400 (Repairs & Maintenance)', confidence: 0.92, timesApplied: 18, source: 'user_correction', agent: 'AI Categorizer', entity: 'Harbour Bridge Holdings', created: '2026-01-28T08:45:00Z' },
    { id: 'p5', key: 'vendor:uber-eats:category', value: 'Always categorise to 5600 (Meals & Entertainment)', confidence: 0.94, timesApplied: 31, source: 'auto_learned', agent: 'AI Categorizer', entity: 'Kiwi Design', created: '2026-03-05T16:20:00Z' },
  ],
  preference: [
    { id: 'pr1', key: 'bas_frequency', value: 'Monthly BAS, not quarterly', confidence: 1.0, timesApplied: 9, source: 'manual_set', agent: 'Compliance Monitor', entity: 'Coastal Coffee', created: '2025-08-12T10:00:00Z' },
    { id: 'pr2', key: 'year_end', value: '31 March year end, not 30 June', confidence: 1.0, timesApplied: 4, source: 'manual_set', agent: 'Tax Agent', entity: 'Kiwi Design', created: '2026-03-22T13:15:00Z' },
    { id: 'pr3', key: 'report_format', value: 'Prefers detailed P&L with department breakdown', confidence: 0.95, timesApplied: 12, source: 'auto_learned', agent: 'Report Agent', entity: 'NorthStar Consulting', created: '2026-02-18T09:30:00Z' },
    { id: 'pr4', key: 'invoice_terms', value: 'Net 14 days (not default Net 30)', confidence: 1.0, timesApplied: 67, source: 'manual_set', agent: 'Invoice Agent', entity: 'Harbour Bridge Holdings', created: '2025-11-04T11:00:00Z' },
  ],
  correction: [
    { id: 'c1', key: 'vendor:uber:category', value: 'Corrected from 5200 (Travel) to 5100 (Transport). Applied to all future Uber transactions.', confidence: 0.96, timesApplied: 22, source: 'user_correction', agent: 'AI Categorizer', entity: 'Coastal Coffee', created: '2026-03-10T15:22:00Z' },
    { id: 'c2', key: 'vendor:amazon:category', value: 'Corrected from 5100 (Office Supplies) to 5700 (Computer Equipment) for purchases over $500.', confidence: 0.88, timesApplied: 8, source: 'user_correction', agent: 'AI Categorizer', entity: 'NorthStar Consulting', created: '2026-02-28T10:45:00Z' },
    { id: 'c3', key: 'vendor:square:category', value: 'Corrected from 6100 (Bank Fees) to 4100 (Sales Revenue). Square deposits are income, not fees.', confidence: 0.99, timesApplied: 41, source: 'user_correction', agent: 'AI Categorizer', entity: 'Coastal Coffee', created: '2026-01-15T08:30:00Z' },
    { id: 'c4', key: 'payroll:super_rate', value: 'Corrected super rate from 11% to 11.5% for FY2026. Applied retroactively.', confidence: 1.0, timesApplied: 3, source: 'user_correction', agent: 'Payroll Agent', entity: 'Harbour Bridge Holdings', created: '2026-03-01T09:00:00Z' },
  ],
  tax_rule: [
    { id: 't1', key: 'accounting_basis', value: 'Cash basis accounting, not accrual. Applied to all tax calculations.', confidence: 1.0, timesApplied: 34, source: 'manual_set', agent: 'Tax Agent', entity: 'NorthStar Consulting', created: '2025-09-20T14:00:00Z' },
    { id: 't2', key: 'gst_registration', value: 'GST-registered, 10% rate. BAS lodged quarterly.', confidence: 1.0, timesApplied: 12, source: 'manual_set', agent: 'Tax Agent', entity: 'Coastal Coffee', created: '2025-07-01T09:00:00Z' },
    { id: 't3', key: 'wht_treaty', value: 'AU-NZ DTA applies. WHT on dividends reduced to 15% (from 30%).', confidence: 1.0, timesApplied: 6, source: 'manual_set', agent: 'Tax Treaty Agent', entity: 'Kiwi Design', created: '2026-01-10T11:30:00Z' },
  ],
  baseline: [
    { id: 'b1', key: 'monthly_expenses_range', value: 'Normal monthly expenses: $58,000 - $65,000. Anything outside this range triggers anomaly alert.', confidence: 0.93, timesApplied: 6, source: 'auto_learned', agent: 'Anomaly Detector', entity: 'Coastal Coffee', created: '2026-02-01T00:00:00Z' },
    { id: 'b2', key: 'monthly_revenue_range', value: 'Normal monthly revenue: $82,000 - $95,000. Deviation >15% triggers alert.', confidence: 0.91, timesApplied: 6, source: 'auto_learned', agent: 'Anomaly Detector', entity: 'Coastal Coffee', created: '2026-02-01T00:00:00Z' },
    { id: 'b3', key: 'payroll_variance', value: 'Normal fortnightly payroll: $42,000 - $44,500. Variance >5% triggers review.', confidence: 0.95, timesApplied: 12, source: 'auto_learned', agent: 'Payroll Agent', entity: 'NorthStar Consulting', created: '2026-01-15T00:00:00Z' },
    { id: 'b4', key: 'vendor_payment_frequency', value: 'Telstra billed monthly ~$420. AWS billed monthly ~$1,200-$1,800.', confidence: 0.89, timesApplied: 9, source: 'auto_learned', agent: 'Anomaly Detector', entity: 'Kiwi Design', created: '2026-03-01T00:00:00Z' },
  ],
};

const TIMELINE = [
  { id: 'tl1', date: 'Mar 25', text: 'Learned that \'ANZ Interest\' transactions are always 4200 (Interest Income)', confidence: 99, agent: 'AI Categorizer' },
  { id: 'tl2', date: 'Mar 22', text: 'Client preference updated \u2014 Kiwi Design uses 31 March year end, not 30 June', confidence: 100, agent: 'Tax Agent' },
  { id: 'tl3', date: 'Mar 18', text: 'Pattern confirmed: Officeworks \u2192 5100 (Office Supplies) after 47 consistent approvals', confidence: 98, agent: 'AI Categorizer' },
  { id: 'tl4', date: 'Mar 10', text: 'User corrected Uber categorisation from Travel to Transport \u2014 applied globally', confidence: 96, agent: 'AI Categorizer' },
  { id: 'tl5', date: 'Mar 05', text: 'Auto-learned Uber Eats pattern \u2192 5600 (Meals & Entertainment) for Kiwi Design', confidence: 94, agent: 'AI Categorizer' },
  { id: 'tl6', date: 'Mar 01', text: 'Anomaly baselines recalculated for Coastal Coffee \u2014 expenses & revenue ranges updated', confidence: 93, agent: 'Anomaly Detector' },
  { id: 'tl7', date: 'Feb 28', text: 'User corrected Amazon \u2192 Computer Equipment for high-value purchases (>$500)', confidence: 88, agent: 'AI Categorizer' },
  { id: 'tl8', date: 'Feb 18', text: 'Learned NorthStar Consulting prefers departmental P&L breakdown', confidence: 95, agent: 'Report Agent' },
  { id: 'tl9', date: 'Feb 10', text: 'Pattern confirmed: Telstra \u2192 5300 (Telecommunications) for Coastal Coffee', confidence: 97, agent: 'AI Categorizer' },
  { id: 'tl10', date: 'Feb 01', text: 'Initial anomaly baselines established for Coastal Coffee (6-month lookback)', confidence: 91, agent: 'Anomaly Detector' },
];

const ACCURACY_DATA = [
  { month: 'Month 1', pct: 82 },
  { month: 'Month 2', pct: 86 },
  { month: 'Month 3', pct: 89 },
  { month: 'Month 4', pct: 92 },
  { month: 'Month 5', pct: 94.1 },
  { month: 'Month 6', pct: 96.4 },
];

const TAB_META = {
  pattern:    { label: 'Transaction Patterns', color: 'indigo' },
  preference: { label: 'Client Preferences',   color: 'emerald' },
  correction: { label: 'Correction History',    color: 'amber' },
  tax_rule:   { label: 'Tax Rules Learned',     color: 'rose' },
  baseline:   { label: 'Anomaly Baselines',     color: 'cyan' },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ConfidenceBadge({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 95 ? 'bg-green-100 text-green-700' : pct >= 85 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{pct}%</span>;
}

function SourceBadge({ source }) {
  const map = {
    user_correction: { label: 'User Correction', cls: 'bg-purple-100 text-purple-700' },
    auto_learned:    { label: 'Auto-Learned',    cls: 'bg-blue-100 text-blue-700' },
    manual_set:      { label: 'Manual',           cls: 'bg-gray-100 text-gray-700' },
  };
  const s = map[source] || map.auto_learned;
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function AgentMemory() {
  const { addToast } = useToast();
  const [tab, setTab] = useState('pattern');
  const [memories, setMemories] = useState(MEMORIES);
  const [autoLearn, setAutoLearn] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleForget = (type, id) => {
    setMemories((prev) => ({
      ...prev,
      [type]: prev[type].filter((m) => m.id !== id),
    }));
    addToast('Memory removed successfully', 'success');
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setMemories({ pattern: [], preference: [], correction: [], tax_rule: [], baseline: [] });
    setConfirmClear(false);
    addToast('All memories cleared', 'success');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(memories, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent-memory-report.json';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Memory report exported', 'success');
  };

  const maxPct = Math.max(...ACCURACY_DATA.map((d) => d.pct));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Memory System</h1>
          <p className="text-gray-500 mt-1">
            How Astra's AI agents learn and remember per client. Every correction, pattern, and preference is retained to improve accuracy over time.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Memories" value={OVERVIEW.totalMemories.toLocaleString()} sub="Across all clients" color="text-indigo-600" />
          <StatCard label="Client Patterns Learned" value={OVERVIEW.clientPatterns} sub="Transaction categorisation rules" color="text-emerald-600" />
          <StatCard label="Correction-Based Learnings" value={OVERVIEW.corrections} sub="From user feedback" color="text-amber-600" />
          <StatCard label="Accuracy Improvement" value={`+${OVERVIEW.accuracyImprovement}%`} sub="Since first month" color="text-green-600" />
        </div>

        {/* Memory Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Auto-Learn from Corrections</span>
              <button
                onClick={() => {
                  setAutoLearn(!autoLearn);
                  addToast(autoLearn ? 'Auto-learn disabled' : 'Auto-learn enabled', 'info');
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoLearn ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoLearn ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleExport} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                Export Memory Report
              </button>
              <button
                onClick={handleClearAll}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmClear ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-red-300 text-red-600 hover:bg-red-50'}`}
              >
                {confirmClear ? 'Confirm Clear All' : 'Clear All Memories'}
              </button>
              {confirmClear && (
                <button onClick={() => setConfirmClear(false)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 flex overflow-x-auto">
            {Object.entries(TAB_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {meta.label}
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {memories[key].length}
                </span>
              </button>
            ))}
          </div>

          <div className="divide-y divide-gray-100">
            {memories[tab].length === 0 && (
              <div className="p-12 text-center text-gray-400">No memories in this category yet.</div>
            )}
            {memories[tab].map((m) => (
              <div key={m.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{m.entity}</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-xs text-gray-500">{m.agent}</span>
                      <ConfidenceBadge value={m.confidence} />
                      <SourceBadge source={m.source} />
                    </div>
                    <p className="text-sm text-gray-700">{m.value}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Key: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">{m.key}</code></span>
                      <span>Applied {m.timesApplied} times</span>
                      <span>Created {new Date(m.created).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleForget(tab, m.id)}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors"
                  >
                    Forget This
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Memory Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Memory Timeline</h2>
          <div className="space-y-0">
            {TIMELINE.map((item, i) => (
              <div key={item.id} className="flex gap-4">
                {/* Vertical line */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-indigo-200 shrink-0 mt-1" />
                  {i < TIMELINE.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
                </div>
                {/* Content */}
                <div className="pb-6">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{item.date}</span>
                    <span className="text-xs text-gray-400">{item.agent}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${item.confidence >= 95 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Stats Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Agent Learning Stats</h2>
          <p className="text-sm text-gray-500 mb-6">Categorisation accuracy improvement over 6 months</p>
          <div className="flex items-end gap-3 h-48">
            {ACCURACY_DATA.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-gray-700">{d.pct}%</span>
                <div className="w-full relative" style={{ height: '160px' }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t-lg bg-indigo-500 transition-all duration-500"
                    style={{ height: `${(d.pct / maxPct) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">{d.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              Month 1: <span className="font-semibold">82%</span> &rarr; Month 6: <span className="font-semibold text-indigo-600">96.4%</span>
            </span>
          </div>
        </div>

        <ProprietaryNotice />
      </div>
    </div>
  );
}
