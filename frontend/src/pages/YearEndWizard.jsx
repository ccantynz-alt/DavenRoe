import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const CLIENTS = [
  { id: 'client-001', name: 'Meridian Corp', jurisdiction: 'AU', fy_end: 'June 30' },
  { id: 'client-002', name: 'Pinnacle Ltd', jurisdiction: 'NZ', fy_end: 'December 31' },
  { id: 'client-003', name: 'Vortex Digital', jurisdiction: 'AU', fy_end: 'June 30' },
  { id: 'client-004', name: 'Apex Advisory', jurisdiction: 'AU', fy_end: 'June 30' },
  { id: 'client-005', name: 'Summit Holdings', jurisdiction: 'UK', fy_end: 'March 31' },
];

export default function YearEndWizard() {
  const toast = useToast();
  const [rollovers, setRollovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRollover, setSelectedRollover] = useState(null);
  const [step, setStep] = useState(0); // 0=list, 1=select, 2=precheck, 3=executing, 4=done
  const [preCheck, setPreCheck] = useState(null);
  const [checking, setChecking] = useState(false);
  const [executing, setExecuting] = useState(false);

  const [form, setForm] = useState({
    client_id: '', client_name: '', financial_year: 'FY2026',
    year_start: '2025-07-01', year_end: '2026-06-30', jurisdiction: 'AU',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const res = await api.get('/year-end/').catch(() => ({ data: { rollovers: [] } }));
    setRollovers(res.data.rollovers || []);
    setLoading(false);
  }

  function handleClientChange(clientId) {
    const client = CLIENTS.find(c => c.id === clientId);
    if (!client) return;
    setForm(f => ({ ...f, client_id: clientId, client_name: client.name, jurisdiction: client.jurisdiction }));
  }

  async function runPreCheck() {
    if (!form.client_id) { toast.error('Select a client first'); return; }
    setChecking(true);
    try {
      const res = await api.get(`/year-end/pre-check/${form.client_id}?year_end=${form.year_end}`);
      setPreCheck(res.data);
      setStep(2);
    } catch { toast.error('Pre-check failed'); }
    setChecking(false);
  }

  async function executeRollover() {
    setExecuting(true);
    setStep(3);
    try {
      const res = await api.post('/year-end/execute', form);
      setSelectedRollover(res.data);
      setStep(4);
      toast.success('Year-end rollover completed successfully');
      loadData();
    } catch { toast.error('Rollover failed'); setStep(2); }
    setExecuting(false);
  }

  function resetWizard() {
    setStep(0);
    setPreCheck(null);
    setSelectedRollover(null);
    setForm({ client_id: '', client_name: '', financial_year: 'FY2026', year_start: '2025-07-01', year_end: '2026-06-30', jurisdiction: 'AU' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Year-End Rollover</h2>
          <p className="text-gray-400 mt-1">Automated year-end close — retained earnings, opening balances, provisions, and reports in one click</p>
        </div>
        {step === 0 && (
          <button onClick={() => setStep(1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors">
            + Start Year-End Close
          </button>
        )}
      </div>

      {/* Step 1: Select Client */}
      {step === 1 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Step 1: Select Client & Period</h3>
              <p className="text-sm text-gray-400 mt-1">Choose the entity and financial year to close</p>
            </div>
            <button onClick={resetWizard} className="text-gray-400 hover:text-white text-sm">Cancel</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Client *</label>
              <select value={form.client_id} onChange={e => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Select client...</option>
                {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.jurisdiction}) — FY ends {c.fy_end}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Financial Year</label>
              <input value={form.financial_year} onChange={e => setForm(f => ({ ...f, financial_year: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Year Start</label>
              <input type="date" value={form.year_start} onChange={e => setForm(f => ({ ...f, year_start: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Year End</label>
              <input type="date" value={form.year_end} onChange={e => setForm(f => ({ ...f, year_end: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <button onClick={runPreCheck} disabled={checking || !form.client_id}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors disabled:opacity-50">
            {checking ? 'Running checks...' : 'Run Pre-Check'}
          </button>
        </div>
      )}

      {/* Step 2: Pre-Check Results */}
      {step === 2 && preCheck && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Step 2: Pre-Rollover Checks</h3>
              <p className="text-sm text-gray-400 mt-1">{preCheck.passed}/{preCheck.total} checks passed</p>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${preCheck.ready ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/40 text-amber-300'}`}>
              {preCheck.ready ? 'Ready to close' : 'Issues detected'}
            </span>
          </div>

          <div className="space-y-2">
            {preCheck.checks.map((check, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${check.passed ? 'bg-emerald-950/20 border border-emerald-800/30' : 'bg-red-950/20 border border-red-800/30'}`}>
                <span className={`text-sm mt-0.5 ${check.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {check.passed ? '\u2713' : '\u2717'}
                </span>
                <div>
                  <p className="text-sm text-white">{check.check}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{check.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={executeRollover} disabled={executing}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors disabled:opacity-50">
              {preCheck.ready ? 'Execute Year-End Close' : 'Execute Anyway (Override)'}
            </button>
            <button onClick={() => setStep(1)} className="px-5 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm transition-colors">
              Back
            </button>
            <button onClick={resetWizard} className="px-5 py-2 text-gray-400 hover:text-white text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Executing */}
      {step === 3 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-12 text-center">
          <div className="w-16 h-16 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Processing Year-End Close</h3>
          <p className="text-sm text-gray-400">Closing accounts, calculating retained earnings, generating opening balances...</p>
        </div>
      )}

      {/* Step 4: Completed */}
      {step === 4 && selectedRollover && (
        <div className="bg-gradient-to-b from-emerald-950/30 to-gray-800/60 border border-emerald-700/40 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-400 text-xl">\u2713</span>
                <h3 className="text-lg font-semibold text-white">Year-End Close Complete</h3>
              </div>
              <p className="text-sm text-gray-400">{selectedRollover.client_name} — {selectedRollover.financial_year}</p>
            </div>
            <button onClick={resetWizard} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm transition-colors">
              Done
            </button>
          </div>

          {/* Financial Summary */}
          {selectedRollover.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard label="Revenue" value={`$${selectedRollover.summary.total_revenue?.toLocaleString()}`} color="emerald" />
              <SummaryCard label="Expenses" value={`$${selectedRollover.summary.total_expenses?.toLocaleString()}`} color="red" />
              <SummaryCard label="Net Profit" value={`$${selectedRollover.summary.net_profit?.toLocaleString()}`} color="indigo" />
              <SummaryCard label="Tax Provision" value={`$${selectedRollover.summary.tax_provision?.toLocaleString()}`} color="amber" />
            </div>
          )}

          {/* Checklist */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Completed Steps</h4>
            <div className="space-y-1">
              {selectedRollover.checklist?.map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-2 px-3 rounded-lg bg-gray-900/30">
                  <span className="text-emerald-400 text-sm mt-0.5">\u2713</span>
                  <div>
                    <p className="text-sm text-white">{item.step}</p>
                    <p className="text-xs text-gray-500">{item.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reports Generated */}
          {selectedRollover.reports_generated && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Reports Generated</h4>
              <div className="flex flex-wrap gap-2">
                {selectedRollover.reports_generated.map((report, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-900/30 text-indigo-300 border border-indigo-800/40">
                    {report}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previous Rollovers List */}
      {step === 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Previous Year-End Closes</h3>
          {rollovers.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">&#x1F4C5;</div>
              <p className="font-medium">No year-end closes recorded</p>
              <p className="text-sm mt-1">Start your first year-end rollover to automate the closing process</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rollovers.map(r => (
                <div
                  key={r.id}
                  className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 hover:bg-gray-800/60 transition-colors cursor-pointer"
                  onClick={() => { setSelectedRollover(r); setStep(4); }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-900/30 text-emerald-400 flex items-center justify-center text-lg">\u2713</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{r.client_name}</span>
                          <span className="text-xs text-gray-500">{r.financial_year}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300">{r.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {r.year_start} to {r.year_end}
                          &middot; Net profit ${r.summary?.net_profit?.toLocaleString() || '—'}
                          &middot; Completed by {r.completed_by}
                          &middot; {new Date(r.completed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{r.checklist?.length || 0} steps &middot; {r.reports_generated?.length || 0} reports</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colors = {
    indigo: 'border-indigo-800/50 bg-indigo-950/20 text-indigo-400',
    emerald: 'border-emerald-800/50 bg-emerald-950/20 text-emerald-400',
    amber: 'border-amber-800/50 bg-amber-950/20 text-amber-400',
    red: 'border-red-800/50 bg-red-950/20 text-red-400',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
