import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const OP_ICONS = {
  approve_transactions: '\u2713', send_invoices: '\u2709', categorise_transactions: '\u2605',
  reconcile: '\u2194', generate_statements: '\u2B06', chase_overdue: '\u26A0',
  apply_bank_rules: '\u26A1', export_data: '\u2B07',
};
const OP_COLORS = {
  approve_transactions: 'bg-emerald-900/40 text-emerald-400',
  send_invoices: 'bg-blue-900/40 text-blue-400',
  categorise_transactions: 'bg-amber-900/40 text-amber-400',
  reconcile: 'bg-indigo-900/40 text-indigo-400',
  generate_statements: 'bg-purple-900/40 text-purple-400',
  chase_overdue: 'bg-red-900/40 text-red-400',
  apply_bank_rules: 'bg-cyan-900/40 text-cyan-400',
  export_data: 'bg-gray-700/60 text-gray-300',
};

export default function BatchOps() {
  const toast = useToast();
  const [operations, setOperations] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOp, setSelectedOp] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [executing, setExecuting] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [confidenceMin, setConfidenceMin] = useState(80);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [opsRes, jobsRes, statsRes] = await Promise.all([
      api.get('/batch/operations').catch(() => ({ data: { operations: [] } })),
      api.get('/batch/jobs').catch(() => ({ data: { jobs: [] } })),
      api.get('/batch/stats').catch(() => ({ data: null })),
    ]);
    setOperations(opsRes.data.operations || []);
    setJobs(jobsRes.data.jobs || []);
    setStats(statsRes.data);
    setLoading(false);
  }

  async function loadPreview(opType) {
    try {
      const res = await api.get(`/batch/preview/${opType}?confidence_min=${confidenceMin}`);
      setPreview(res.data);
      setSelectedItems(new Set(res.data.items?.map(i => i.id) || []));
    } catch { toast.error('Failed to load preview'); }
  }

  async function handleSelectOp(op) {
    setSelectedOp(op);
    setSelectedJob(null);
    await loadPreview(op.type);
  }

  function toggleItem(id) {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!preview?.items) return;
    if (selectedItems.size === preview.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(preview.items.map(i => i.id)));
    }
  }

  async function handleExecute() {
    if (!selectedOp) return;
    if (selectedItems.size === 0) { toast.error('Select at least one item'); return; }
    setExecuting(true);
    try {
      const res = await api.post('/batch/execute', {
        operation_type: selectedOp.type,
        item_ids: [...selectedItems],
        filters: {},
        params: {},
      });
      setSelectedJob(res.data);
      setSelectedOp(null);
      setPreview(null);
      toast.success(`Batch complete — ${res.data.succeeded}/${res.data.total_items} succeeded`);
      loadData();
    } catch { toast.error('Batch operation failed'); }
    setExecuting(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Batch Operations</h2>
          <p className="text-gray-400 mt-1">Bulk approve, send, categorise, and reconcile — process hundreds of items at once</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Items Processed" value={stats.total_processed.toLocaleString()} color="indigo" />
          <StatCard label="Success Rate" value={`${stats.success_rate}%`} color="emerald" />
          <StatCard label="Time Saved" value={`${stats.total_time_saved_minutes} min`} color="blue" />
          <StatCard label="Batch Jobs" value={stats.total_jobs} color="amber" />
        </div>
      )}

      {/* Operation Selection */}
      {!selectedOp && !selectedJob && (
        <>
          <h3 className="text-sm font-medium text-gray-400">Choose an Operation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {operations.map(op => (
              <button
                key={op.type}
                onClick={() => handleSelectOp(op)}
                className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 hover:bg-gray-800/60 hover:border-indigo-700/50 transition-all text-left group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3 ${OP_COLORS[op.type] || 'bg-gray-700 text-gray-300'}`}>
                  {OP_ICONS[op.type] || '\u2022'}
                </div>
                <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{op.label}</h4>
                <p className="text-xs text-gray-500 mt-1">{op.description}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Preview + Execute */}
      {selectedOp && preview && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{selectedOp.label}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {preview.total_items} items found &middot; Total: ${Math.abs(preview.total_amount).toLocaleString()}
              </p>
            </div>
            <button onClick={() => { setSelectedOp(null); setPreview(null); }} className="text-gray-400 hover:text-white text-sm">Cancel</button>
          </div>

          {/* Confidence filter for transactions */}
          {selectedOp.type === 'approve_transactions' && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Min confidence:</label>
              <input type="range" min="50" max="100" value={confidenceMin}
                onChange={e => { setConfidenceMin(parseInt(e.target.value)); loadPreview(selectedOp.type); }}
                className="w-48 accent-indigo-500" />
              <span className="text-sm text-white font-medium">{confidenceMin}%</span>
            </div>
          )}

          {/* Items list */}
          {preview.items?.length > 0 && (
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox"
                    checked={selectedItems.size === preview.items.length && preview.items.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded bg-gray-900 border-gray-600 text-indigo-500 focus:ring-indigo-500" />
                  <span className="text-xs text-gray-400">
                    {selectedItems.size === preview.items.length ? 'Deselect all' : 'Select all'} ({selectedItems.size}/{preview.items.length})
                  </span>
                </label>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {preview.items.map(item => (
                  <label key={item.id}
                    className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-800/50 cursor-pointer transition-colors ${
                      selectedItems.has(item.id) ? 'bg-indigo-950/20' : 'hover:bg-gray-800/30'
                    }`}>
                    <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleItem(item.id)}
                      className="w-4 h-4 rounded bg-gray-900 border-gray-600 text-indigo-500 focus:ring-indigo-500" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white">{item.description}</span>
                      {item.account && <span className="text-xs text-gray-500 ml-2">{item.account}</span>}
                      {item.client && <span className="text-xs text-gray-500 ml-2">{item.client}</span>}
                    </div>
                    {item.confidence != null && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        item.confidence >= 95 ? 'bg-emerald-900/40 text-emerald-300' :
                        item.confidence >= 85 ? 'bg-amber-900/40 text-amber-300' :
                        'bg-red-900/40 text-red-300'
                      }`}>{item.confidence}%</span>
                    )}
                    <span className={`text-sm font-medium ${item.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      ${Math.abs(item.amount).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-600">{item.date}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleExecute} disabled={executing || selectedItems.size === 0}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors disabled:opacity-50">
              {executing ? 'Processing...' : `Execute — ${selectedItems.size} items`}
            </button>
            <button onClick={() => { setSelectedOp(null); setPreview(null); }}
              className="px-5 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Job Detail */}
      {selectedJob && (
        <div className={`border rounded-xl p-6 space-y-4 ${
          selectedJob.failed === 0 ? 'bg-emerald-950/20 border-emerald-700/40' : 'bg-amber-950/20 border-amber-700/40'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{selectedJob.label}</h3>
              <p className="text-sm text-gray-400">
                {selectedJob.succeeded}/{selectedJob.total_items} succeeded
                {selectedJob.failed > 0 && ` \u00B7 ${selectedJob.failed} failed`}
                &middot; {selectedJob.duration_seconds}s
              </p>
            </div>
            <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-gray-700/50 rounded-lg">&times;</button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <MiniStat label="Processed" value={selectedJob.processed} />
            <MiniStat label="Succeeded" value={selectedJob.succeeded} highlight />
            <MiniStat label="Failed" value={selectedJob.failed} error={selectedJob.failed > 0} />
            <MiniStat label="Duration" value={`${selectedJob.duration_seconds}s`} />
          </div>

          {selectedJob.errors?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2">Errors</h4>
              <div className="space-y-1">
                {selectedJob.errors.map((err, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 px-3 bg-red-950/20 border border-red-800/30 rounded-lg">
                    <span className="text-gray-300">{err.item}: {err.description}</span>
                    <span className="text-red-400">${err.amount?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Job History */}
      {!selectedOp && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Batch Jobs</h3>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">&#x26A1;</div>
              <p className="font-medium">No batch jobs yet</p>
              <p className="text-sm mt-1">Select an operation above to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map(job => (
                <div key={job.id}
                  className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 hover:bg-gray-800/60 transition-colors cursor-pointer"
                  onClick={() => setSelectedJob(job)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${OP_COLORS[job.type] || 'bg-gray-700 text-gray-300'}`}>
                        {OP_ICONS[job.type] || '\u2022'}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white">{job.label}</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {job.succeeded}/{job.total_items} succeeded
                          {job.failed > 0 && <span className="text-red-400"> &middot; {job.failed} failed</span>}
                          &middot; {job.duration_seconds}s
                          &middot; {new Date(job.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      job.status === 'completed' && job.failed === 0 ? 'bg-emerald-900/40 text-emerald-300' :
                      job.status === 'completed' ? 'bg-amber-900/40 text-amber-300' : 'bg-gray-700 text-gray-300'
                    }`}>{job.failed === 0 ? 'Success' : 'Partial'}</span>
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

function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'border-indigo-800/50 bg-indigo-950/20 text-indigo-400',
    emerald: 'border-emerald-800/50 bg-emerald-950/20 text-emerald-400',
    blue: 'border-blue-800/50 bg-blue-950/20 text-blue-400',
    amber: 'border-amber-800/50 bg-amber-950/20 text-amber-400',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, highlight, error }) {
  return (
    <div className="bg-gray-900/40 rounded-lg p-2.5">
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${error ? 'text-red-400' : highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
