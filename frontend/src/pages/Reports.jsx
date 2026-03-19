import { useState } from 'react';
import axios from 'axios';

const REPORT_TYPES = [
  { id: 'profit_and_loss', name: 'Profit & Loss', description: 'Revenue minus expenses for a period', icon: '$' },
  { id: 'balance_sheet', name: 'Balance Sheet', description: 'Assets, liabilities, and equity at a point in time', icon: '=' },
  { id: 'trial_balance', name: 'Trial Balance', description: 'All account balances — debits must equal credits', icon: '+' },
  { id: 'cash_flow', name: 'Cash Flow Statement', description: 'Operating, investing, and financing cash flows', icon: '~' },
  { id: 'general_ledger', name: 'General Ledger', description: 'Every transaction by account with running balances', icon: '#' },
  { id: 'aged_receivables', name: 'Aged Receivables', description: 'Who owes you money and how overdue it is', icon: '<' },
  { id: 'aged_payables', name: 'Aged Payables', description: 'Who you owe money to and how overdue it is', icon: '>' },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comparative, setComparative] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/v1/reports/generate', {
        report_type: selectedReport.id,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        comparative,
        transactions: [],  // In production, fetched from the ledger
      });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Reports</h2>
        <p className="text-gray-500 mt-1">Generate standard financial statements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report selector */}
        <div className="lg:col-span-1 space-y-2">
          {REPORT_TYPES.map((report) => (
            <button
              key={report.id}
              onClick={() => { setSelectedReport(report); setResult(null); }}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                selectedReport?.id === report.id
                  ? 'border-astra-500 bg-astra-50 ring-1 ring-astra-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-gray-400">{report.icon}</span>
                <div>
                  <div className="font-medium text-sm">{report.name}</div>
                  <div className="text-xs text-gray-400">{report.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Report config & output */}
        <div className="lg:col-span-3">
          {selectedReport ? (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-xl font-bold mb-4">{selectedReport.name}</h3>

              <div className="flex gap-4 mb-6 flex-wrap">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={comparative} onChange={(e) => setComparative(e.target.checked)} />
                    Comparative period
                  </label>
                </div>
                <div className="flex items-end">
                  <button onClick={handleGenerate} disabled={loading}
                    className="px-6 py-2 bg-astra-600 text-white rounded-lg text-sm font-medium hover:bg-astra-700 disabled:opacity-50">
                    {loading ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </div>

              {result && (
                <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[600px]">
                  {result.error ? (
                    <p className="text-red-600">{result.error}</p>
                  ) : (
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-400 text-lg">Select a report type</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
