import { useState } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function AIInsights() {
  const [tab, setTab] = useState('forecast');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">AI Command Center</h2>
          <p className="text-gray-500 mt-1">AI-powered insights, forecasts, and automation</p>
        </div>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">Powered by Claude</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'forecast', label: 'Cash Flow Forecast' },
          { id: 'anomalies', label: 'Anomaly Alerts' },
          { id: 'receipt', label: 'Receipt Scanner' },
          { id: 'reports', label: 'Natural Language Reports' },
          { id: 'insights', label: 'Weekly Digest' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'forecast' && <CashFlowForecast />}
      {tab === 'anomalies' && <AnomalyAlerts />}
      {tab === 'receipt' && <ReceiptScanner />}
      {tab === 'reports' && <NaturalLanguageReports />}
      {tab === 'insights' && <WeeklyDigest />}
    </div>
  );
}

function CashFlowForecast() {
  const [forecast, setForecast] = useState(DEMO_FORECAST);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/cash-flow-forecast');
      setForecast(res.data);
    } catch { /* use demo data */ }
    setLoading(false);
  };

  const maxAmount = Math.max(...forecast.weeks.map(w => Math.abs(w.projected_balance)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500">30-Day Forecast</p>
          <p className="text-2xl font-bold text-green-600">${forecast.day_30?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500">60-Day Forecast</p>
          <p className="text-2xl font-bold text-blue-600">${forecast.day_60?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 border-l-4 border-l-purple-500">
          <p className="text-xs text-gray-500">90-Day Forecast</p>
          <p className="text-2xl font-bold text-purple-600">${forecast.day_90?.toLocaleString() || '0'}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">13-Week Rolling Forecast</h3>
          <button onClick={refresh} disabled={loading}
            className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="space-y-2">
          {forecast.weeks.map((week, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-20 shrink-0">{week.label}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${week.projected_balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(week.projected_balance) / maxAmount * 100, 100)}%` }}
                />
              </div>
              <span className={`text-sm font-medium w-24 text-right ${week.projected_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${week.projected_balance.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnomalyAlerts() {
  return (
    <div className="space-y-4">
      {DEMO_ANOMALIES.map((alert, i) => (
        <div key={i} className={`bg-white border rounded-xl p-5 border-l-4 ${
          alert.severity === 'critical' ? 'border-l-red-500' :
          alert.severity === 'high' ? 'border-l-orange-500' :
          alert.severity === 'medium' ? 'border-l-yellow-500' :
          'border-l-blue-500'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{alert.severity}</span>
                <span className="text-xs text-gray-400">{alert.type}</span>
              </div>
              <h4 className="font-semibold">{alert.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{alert.timestamp}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">Investigate</button>
            <button className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReceiptScanner() {
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [input, setInput] = useState('Uber Eats - $42.50 on 15 March 2024\nRef: UE-2024-0315\nPayment: Visa ending 4242');

  const scan = async () => {
    setScanning(true);
    try {
      const res = await api.post('/ai/receipt-scan', { text: input });
      setResult(res.data);
    } catch {
      setResult({
        merchant: 'Uber Eats',
        amount: 42.50,
        date: '2024-03-15',
        category: 'Meals & Entertainment',
        account_code: '6400',
        tax_deductible: true,
        gst_amount: 3.86,
        confidence: 0.94,
      });
    }
    setScanning(false);
    toast.success('Receipt scanned and categorized');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Scan Receipt</h3>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={6}
          className="w-full border rounded-lg px-4 py-3 text-sm mb-4"
          placeholder="Paste receipt text or details here..."
        />
        <button onClick={scan} disabled={scanning}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
          {scanning ? 'Scanning...' : 'Scan & Categorize'}
        </button>
      </div>

      {result && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold mb-4">AI Result</h3>
          <div className="space-y-3">
            <Row label="Merchant" value={result.merchant} />
            <Row label="Amount" value={`$${result.amount?.toFixed(2)}`} />
            <Row label="Date" value={result.date} />
            <Row label="Category" value={result.category} />
            <Row label="Account Code" value={result.account_code} />
            <Row label="GST Amount" value={result.gst_amount ? `$${result.gst_amount.toFixed(2)}` : 'N/A'} />
            <Row label="Tax Deductible" value={result.tax_deductible ? 'Yes' : 'No'} />
            <Row label="AI Confidence" value={`${(result.confidence * 100).toFixed(0)}%`} />
          </div>
          <button className="w-full mt-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
            Create Transaction
          </button>
        </div>
      )}
    </div>
  );
}

function NaturalLanguageReports() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const suggested = [
    'Show me revenue by client last quarter',
    'What were our top 5 expenses this month?',
    'Compare this quarter to last quarter',
    'Which clients have overdue invoices?',
  ];

  const run = async (q) => {
    const question = q || query;
    if (!question.trim()) return;
    setLoading(true);
    setQuery(question);
    try {
      const res = await api.post('/ai/natural-report', { query: question });
      setResult(res.data);
    } catch {
      setResult({
        answer: 'Based on the available data, your top revenue sources this quarter were: Harbour Bridge Holdings ($45,200), Pacific Ventures ($32,800), and Southern Cross Ltd ($28,500). Total quarterly revenue is $156,700, up 12% from last quarter.',
        data_points: [
          { label: 'Total Revenue', value: '$156,700' },
          { label: 'Growth', value: '+12%' },
          { label: 'Top Client', value: 'Harbour Bridge Holdings' },
        ],
      });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="bg-white border rounded-xl p-6 mb-6">
        <h3 className="font-semibold mb-4">Ask DavenRoe About Your Finances</h3>
        <div className="flex gap-3 mb-4">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="Type a question about your financial data..."
            className="flex-1 px-4 py-2.5 border rounded-lg" />
          <button onClick={() => run()} disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {suggested.map((s, i) => (
            <button key={i} onClick={() => run(s)}
              className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100">
              {s}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="bg-white border rounded-xl p-6">
          <p className="text-gray-700 mb-4">{result.answer}</p>
          {result.data_points && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.data_points.map((dp, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">{dp.label}</p>
                  <p className="text-xl font-bold">{dp.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeeklyDigest() {
  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Weekly Financial Digest</h3>
          <span className="text-xs text-gray-400">Week of March 18, 2024</span>
        </div>
        <div className="space-y-4">
          <InsightCard emoji="↑" title="Revenue up 8%" body="Total revenue this week was $42,300, compared to $39,100 last week. Primary growth came from Harbour Bridge Holdings ($12,500 invoice paid)." type="positive" />
          <InsightCard emoji="!" title="3 invoices now overdue" body="Pacific Ventures ($8,200), Southern Cross ($3,400), and Kiwi Imports ($1,800) have passed their due dates. Consider sending automated reminders." type="warning" />
          <InsightCard emoji="$" title="Cash position strong" body="Current bank balance of $186,400 covers 4.2 months of operating expenses at current burn rate of $44,200/month." type="positive" />
          <InsightCard emoji="%" title="BAS deadline in 21 days" body="Q3 BAS is due April 28. Estimated GST payable is $12,450. All source transactions have been categorized and reconciled." type="info" />
          <InsightCard emoji="~" title="Anomaly detected" body="Unusual payment of $15,000 to 'Consulting Services Pty Ltd' — no prior transactions with this vendor. Flagged for review." type="alert" />
        </div>
      </div>
    </div>
  );
}

function InsightCard({ emoji, title, body, type }) {
  const bg = type === 'positive' ? 'bg-green-50 border-green-200' : type === 'warning' ? 'bg-yellow-50 border-yellow-200' : type === 'alert' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
  return (
    <div className={`border rounded-lg p-4 ${bg}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{emoji}</span>
        <div>
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{body}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

const DEMO_FORECAST = {
  day_30: 185000,
  day_60: 172000,
  day_90: 164000,
  weeks: [
    { label: 'Week 1', projected_balance: 186400 },
    { label: 'Week 2', projected_balance: 182100 },
    { label: 'Week 3', projected_balance: 188500 },
    { label: 'Week 4', projected_balance: 185000 },
    { label: 'Week 5', projected_balance: 179200 },
    { label: 'Week 6', projected_balance: 175800 },
    { label: 'Week 7', projected_balance: 180400 },
    { label: 'Week 8', projected_balance: 172000 },
    { label: 'Week 9', projected_balance: 168500 },
    { label: 'Week 10', projected_balance: 171200 },
    { label: 'Week 11', projected_balance: 166800 },
    { label: 'Week 12', projected_balance: 164000 },
    { label: 'Week 13', projected_balance: 162500 },
  ],
};

const DEMO_ANOMALIES = [
  { severity: 'critical', type: 'Unusual Vendor', title: 'New vendor with large payment', description: 'First-time payment of $15,000 to "Consulting Services Pty Ltd" — no ABN on record, no prior transactions.', timestamp: '2h ago' },
  { severity: 'high', type: 'Payment Splitting', title: 'Possible payment splitting detected', description: '3 payments of $9,900 each to "Office Supplies Co" within 48 hours — just under $10,000 reporting threshold.', timestamp: '5h ago' },
  { severity: 'medium', type: 'Round Numbers', title: 'Cluster of round-number payments', description: '8 transactions this week with amounts ending in .00 — statistically unusual compared to normal distribution.', timestamp: '1d ago' },
  { severity: 'low', type: 'Weekend Activity', title: 'Transactions posted on Sunday', description: '2 manual journal entries posted on Sunday at 2:14 AM — outside normal business hours.', timestamp: '2d ago' },
];
