import { useState, useEffect } from 'react';
import { getReviewQueue, reviewTransaction } from '../services/api';

export default function ReviewQueue() {
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await getReviewQueue();
      setTransactions(res.data);
      setError(null);
    } catch (err) {
      setError('Unable to load review queue. Database may not be connected.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleAction = async (id, action) => {
    try {
      await reviewTransaction(id, { action });
      fetchQueue();
    } catch (err) {
      alert(err.response?.data?.detail || 'Action failed');
    }
  };

  const filtered = filter === 'all'
    ? transactions
    : filter === 'flagged'
      ? transactions.filter(t => (t.risk_score || 0) >= 40)
      : transactions.filter(t => t.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Review Queue</h2>
          <p className="text-gray-500 mt-1">
            {loading ? 'Loading...' : `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''} awaiting your approval`}
          </p>
        </div>
        <div className="flex gap-2">
          {['all', 'draft', 'pending_review', 'flagged'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'pending_review' ? 'Pending' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <p className="text-yellow-800 font-medium">{error}</p>
          <p className="text-yellow-600 text-sm mt-1">Transactions will appear here once the database is connected and data is flowing.</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-green-800 font-semibold text-lg">All clear</p>
          <p className="text-green-600 text-sm mt-1">No transactions pending review.</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((txn) => (
          <TransactionCard key={txn.id} txn={txn} onAction={handleAction} />
        ))}
      </div>
    </div>
  );
}

function TransactionCard({ txn, onAction }) {
  const riskScore = txn.risk_score || 0;
  const riskBg = riskScore < 20 ? 'bg-green-100 text-green-700'
    : riskScore < 40 ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';

  const confidence = txn.ai_confidence ? `${(txn.ai_confidence * 100).toFixed(0)}%` : null;

  return (
    <div className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-400 font-mono">{txn.transaction_date}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${riskBg}`}>
              Risk: {riskScore}
            </span>
            {txn.tax_jurisdiction && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {txn.tax_jurisdiction}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {txn.source}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              txn.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'
            }`}>
              {txn.status}
            </span>
          </div>
          <h3 className="font-semibold text-lg">{txn.description}</h3>
          {txn.ai_reasoning && (
            <p className="text-sm text-gray-500 mt-1">
              AI: {txn.ai_reasoning}
              {confidence && <span className="ml-2 text-gray-400">({confidence} confidence)</span>}
            </p>
          )}
          {txn.reference && (
            <p className="text-xs text-gray-400 mt-1">Ref: {txn.reference}</p>
          )}
        </div>
        <div className="text-right ml-6">
          <p className="text-2xl font-bold">${Number(txn.total_amount).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400">{txn.currency}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t">
        <button
          onClick={() => onAction(txn.id, 'approve')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => onAction(txn.id, 'flag')}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
        >
          Flag for Review
        </button>
        <button
          onClick={() => onAction(txn.id, 'void')}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors ml-auto"
        >
          Void
        </button>
      </div>
    </div>
  );
}
