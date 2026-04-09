import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const METHOD_LABELS = { exact: 'Exact', fuzzy: 'Fuzzy', amount_date: 'Amount+Date', manual: 'Manual' };
const METHOD_COLORS = {
  exact: 'bg-emerald-900/40 text-emerald-300',
  fuzzy: 'bg-amber-900/40 text-amber-300',
  amount_date: 'bg-blue-900/40 text-blue-300',
  manual: 'bg-gray-700 text-gray-300',
};

export default function ReceiptMatching() {
  const toast = useToast();
  const [matches, setMatches] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [unmatched, setUnmatched] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [matching, setMatching] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [matchRes, sugRes, unmRes, statsRes] = await Promise.all([
      api.get('/receipt-matching/?status=confirmed').catch(() => ({ data: { matches: [] } })),
      api.get('/receipt-matching/?status=suggested').catch(() => ({ data: { matches: [] } })),
      api.get('/receipt-matching/unmatched').catch(() => ({ data: { unmatched_receipts: [], unmatched_transactions: [] } })),
      api.get('/receipt-matching/stats').catch(() => ({ data: null })),
    ]);
    setMatches(matchRes.data.matches || []);
    setSuggested(sugRes.data.matches || []);
    setUnmatched(unmRes.data);
    setStats(statsRes.data);
    setLoading(false);
  }

  async function runAutoMatch() {
    setMatching(true);
    try {
      const res = await api.post('/receipt-matching/auto-match');
      toast.success(`Found ${res.data.new_matches} new matches`);
      loadData();
    } catch { toast.error('Auto-match failed'); }
    setMatching(false);
  }

  async function confirmMatch(id) {
    try { await api.post(`/receipt-matching/${id}/confirm`); toast.success('Match confirmed'); loadData(); }
    catch { toast.error('Failed to confirm'); }
  }

  async function rejectMatch(id) {
    try { await api.post(`/receipt-matching/${id}/reject`); toast.success('Match rejected'); loadData(); }
    catch { toast.error('Failed to reject'); }
  }

  async function manualMatch(receiptId, transactionId) {
    try {
      await api.post('/receipt-matching/manual-match', { receipt_id: receiptId, transaction_id: transactionId });
      toast.success('Manually matched');
      setManualMode(false);
      setSelectedReceipt(null);
      loadData();
    } catch { toast.error('Failed to match'); }
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
          <h2 className="text-2xl font-bold text-white">Smart Receipt Matching</h2>
          <p className="text-gray-400 mt-1">AI matches receipts to transactions by amount, date, and vendor</p>
        </div>
        <button onClick={runAutoMatch} disabled={matching}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors disabled:opacity-50">
          {matching ? 'Matching...' : 'Run Auto-Match'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Matched" value={stats.total_matched} sub={`${stats.match_rate}% match rate`} color="emerald" />
          <StatCard label="Pending Review" value={stats.pending_review} color="amber" />
          <StatCard label="Unmatched Receipts" value={stats.unmatched_receipts} color="red" />
          <StatCard label="Avg Confidence" value={`${stats.avg_confidence}%`} color="indigo" />
        </div>
      )}

      <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1 w-fit">
        {[
          { id: 'pending', label: 'Pending Review', count: suggested.length },
          { id: 'matched', label: 'Confirmed', count: matches.length },
          { id: 'unmatched', label: 'Unmatched', count: (unmatched?.receipt_count || 0) + (unmatched?.transaction_count || 0) },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t.label}<span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${tab === t.id ? 'bg-indigo-500' : 'bg-gray-700'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Pending Review */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {suggested.length === 0 ? (
            <EmptyState icon="&#x1F50D;" title="No pending matches" desc="Run Auto-Match to find new receipt-transaction matches" />
          ) : (
            suggested.map(m => (
              <div key={m.id} className="bg-gray-800/40 border border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-900/40 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Receipt</p>
                        <p className="text-sm text-white">{m.receipt_vendor}</p>
                        <p className="text-xs text-gray-400 mt-1">${m.receipt_amount.toFixed(2)} &middot; {m.receipt_date}</p>
                      </div>
                      <div className="bg-gray-900/40 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Transaction</p>
                        <p className="text-sm text-white">{m.txn_description}</p>
                        <p className="text-xs text-gray-400 mt-1">${Math.abs(m.txn_amount).toFixed(2)} &middot; {m.txn_date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${METHOD_COLORS[m.match_method]}`}>{METHOD_LABELS[m.match_method]}</span>
                      <span>Confidence: <span className={`font-medium ${m.match_confidence >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{m.match_confidence}%</span></span>
                      {m.note && <span className="text-amber-400 italic">{m.note}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => confirmMatch(m.id)} className="px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-900/30 rounded-lg transition-colors">Confirm</button>
                    <button onClick={() => rejectMatch(m.id)} className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">Reject</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirmed Matches */}
      {tab === 'matched' && (
        <div className="space-y-2">
          {matches.length === 0 ? (
            <EmptyState icon="&#x2705;" title="No confirmed matches yet" desc="Confirm suggested matches or run Auto-Match" />
          ) : (
            matches.map(m => (
              <div key={m.id} className="bg-gray-800/40 border border-gray-700 rounded-xl p-3 flex items-center gap-4">
                <span className="text-emerald-400">\u2713</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-white font-medium truncate">{m.receipt_vendor}</span>
                    <span className="text-gray-600">\u2194</span>
                    <span className="text-gray-300 truncate">{m.txn_description}</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-white">${m.receipt_amount.toFixed(2)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${METHOD_COLORS[m.match_method]}`}>{METHOD_LABELS[m.match_method]}</span>
                <span className="text-xs text-gray-500">{m.match_confidence}%</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Unmatched */}
      {tab === 'unmatched' && unmatched && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400">Unmatched Receipts ({unmatched.receipt_count})</h3>
              {!manualMode && <button onClick={() => setManualMode(true)} className="text-xs text-indigo-400 hover:text-indigo-300">Manual Match</button>}
            </div>
            {unmatched.unmatched_receipts?.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">All receipts matched</p>
            ) : (
              <div className="space-y-2">
                {unmatched.unmatched_receipts.map(r => (
                  <div key={r.id}
                    onClick={() => manualMode && setSelectedReceipt(r)}
                    className={`bg-gray-800/40 border rounded-xl p-3 transition-colors ${
                      manualMode ? 'cursor-pointer hover:border-indigo-600' : ''
                    } ${selectedReceipt?.id === r.id ? 'border-indigo-600 bg-indigo-950/20' : 'border-gray-700'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{r.vendor}</p>
                        <p className="text-xs text-gray-500">{r.date} &middot; {r.file_name}</p>
                      </div>
                      <span className="text-sm font-medium text-red-400">${r.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Unmatched Transactions ({unmatched.transaction_count})</h3>
            {unmatched.unmatched_transactions?.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">All transactions matched</p>
            ) : (
              <div className="space-y-2">
                {unmatched.unmatched_transactions.map(t => (
                  <div key={t.id}
                    onClick={() => selectedReceipt && manualMatch(selectedReceipt.id, t.id)}
                    className={`bg-gray-800/40 border border-gray-700 rounded-xl p-3 transition-colors ${
                      selectedReceipt ? 'cursor-pointer hover:border-emerald-600 hover:bg-emerald-950/10' : ''
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{t.description}</p>
                        <p className="text-xs text-gray-500">{t.date}</p>
                      </div>
                      <span className="text-sm font-medium text-red-400">${Math.abs(t.amount).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {manualMode && (
            <div className="lg:col-span-2 bg-indigo-950/20 border border-indigo-800/40 rounded-lg p-3 text-sm text-indigo-300">
              {selectedReceipt ? `Selected: ${selectedReceipt.vendor} ($${selectedReceipt.amount}) — click a transaction to match` : 'Click a receipt, then click a transaction to match them'}
              <button onClick={() => { setManualMode(false); setSelectedReceipt(null); }} className="ml-3 text-xs text-gray-400 hover:text-white">Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  const colors = {
    indigo: 'border-indigo-800/50 bg-indigo-950/20 text-indigo-400',
    emerald: 'border-emerald-800/50 bg-emerald-950/20 text-emerald-400',
    amber: 'border-amber-800/50 bg-amber-950/20 text-amber-400',
    red: 'border-red-800/50 bg-red-950/20 text-red-400',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="text-center py-16 text-gray-500">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className="text-sm mt-1">{desc}</p>
    </div>
  );
}
