import { useState } from 'react';

export default function ReviewQueue() {
  const [filter, setFilter] = useState('all');

  // Placeholder data — will connect to /api/v1/transactions/review
  const mockTransactions = [
    {
      id: '1',
      date: '2024-12-15',
      description: 'AWS Monthly Invoice',
      amount: '$2,450.00',
      currency: 'USD',
      category: 'Cloud Infrastructure',
      confidence: 0.95,
      status: 'draft',
      riskScore: 5,
      source: 'bank_feed',
    },
    {
      id: '2',
      date: '2024-12-14',
      description: 'Payment to NZ Contractor — Design Services',
      amount: '$8,500.00',
      currency: 'USD',
      category: 'Professional Services',
      confidence: 0.82,
      status: 'pending_review',
      riskScore: 35,
      source: 'ai_draft',
      crossBorder: 'US → NZ',
    },
    {
      id: '3',
      date: '2024-12-13',
      description: 'Transfer — Round number',
      amount: '$10,000.00',
      currency: 'USD',
      category: 'Uncategorized',
      confidence: 0.45,
      status: 'pending_review',
      riskScore: 55,
      source: 'bank_feed',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Review Queue</h2>
          <p className="text-gray-500 mt-1">AI-drafted transactions awaiting your approval</p>
        </div>
        <div className="flex gap-2">
          {['all', 'draft', 'flagged'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-astra-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {mockTransactions.map((txn) => (
          <TransactionCard key={txn.id} txn={txn} />
        ))}
      </div>
    </div>
  );
}

function TransactionCard({ txn }) {
  const riskColor =
    txn.riskScore < 20 ? 'green' : txn.riskScore < 40 ? 'yellow' : 'red';

  return (
    <div className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-400 font-mono">{txn.date}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full bg-${riskColor}-100 text-${riskColor}-700`}>
              Risk: {txn.riskScore}
            </span>
            {txn.crossBorder && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {txn.crossBorder}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {txn.source}
            </span>
          </div>
          <h3 className="font-semibold text-lg">{txn.description}</h3>
          <p className="text-sm text-gray-500 mt-1">
            AI suggests: <strong>{txn.category}</strong>
            <span className="ml-2 text-gray-400">
              ({(txn.confidence * 100).toFixed(0)}% confidence)
            </span>
          </p>
        </div>
        <div className="text-right ml-6">
          <p className="text-2xl font-bold">{txn.amount}</p>
          <p className="text-xs text-gray-400">{txn.currency}</p>
        </div>
      </div>

      {/* Action buttons — the human-in-the-loop */}
      <div className="flex gap-3 mt-4 pt-4 border-t">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
          Approve
        </button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">
          Flag for Review
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
          Edit
        </button>
        <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors ml-auto">
          Void
        </button>
      </div>
    </div>
  );
}
