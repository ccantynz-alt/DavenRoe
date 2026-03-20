import { useState } from 'react';
import api from '../services/api';

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
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/reports/generate', {
        report_type: selectedReport.id,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        comparative,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate report. Ensure database is connected.');
      setResult(null);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (!result) return;
    const csv = jsonToCSV(result);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport?.id || 'report'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Reports</h2>
        <p className="text-gray-500 mt-1">Generate standard financial statements from your ledger</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report selector */}
        <div className="lg:col-span-1 space-y-2">
          {REPORT_TYPES.map((report) => (
            <button
              key={report.id}
              onClick={() => { setSelectedReport(report); setResult(null); setError(null); }}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                selectedReport?.id === report.id
                  ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
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

              <div className="flex gap-4 mb-6 flex-wrap items-end">
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
                <label className="flex items-center gap-2 text-sm text-gray-600 pb-2">
                  <input type="checkbox" checked={comparative} onChange={(e) => setComparative(e.target.checked)} />
                  Comparative
                </label>
                <button onClick={handleGenerate} disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? 'Generating...' : 'Generate'}
                </button>
                {result && (
                  <button onClick={handleExportCSV}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Export CSV
                  </button>
                )}
              </div>

              {error && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <p className="text-yellow-800 text-sm">{error}</p>
                  <p className="text-yellow-600 text-xs mt-1">Reports pull from approved transactions in the ledger.</p>
                </div>
              )}

              {result && <ReportRenderer report={result} type={selectedReport.id} />}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-400 text-lg">Select a report type</p>
              <p className="text-gray-300 text-sm mt-1">Reports are generated from approved transactions in your ledger</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function ReportRenderer({ report, type }) {
  if (report.error) {
    return <div className="text-red-600 p-4">{report.error}</div>;
  }

  const meta = report.metadata;

  return (
    <div className="space-y-4">
      {/* Metadata */}
      {meta && (
        <div className="bg-gray-50 rounded-lg p-3 flex gap-6 text-xs text-gray-500">
          {meta.period_start && <span>Period: {meta.period_start} to {meta.period_end}</span>}
          <span>Transactions: {meta.transactions_included}</span>
          <span>Generated: {meta.generated_at}</span>
        </div>
      )}

      {/* P&L */}
      {type === 'profit_and_loss' && report.sections && (
        <div className="space-y-3">
          <ReportSection title="Revenue" data={report.sections.revenue} />
          <ReportSection title="Cost of Goods Sold" data={report.sections.cost_of_goods_sold} />
          <TotalRow label="Gross Profit" value={report.sections.gross_profit} sub={`${report.sections.gross_margin_pct}% margin`} />
          <ReportSection title="Operating Expenses" data={report.sections.operating_expenses} />
          <TotalRow label="Operating Profit (EBIT)" value={report.sections.operating_profit} />
          <ReportSection title="Other Income/Expenses" data={report.sections.other_income_expenses} />
          <ReportSection title="Tax" data={report.sections.tax} />
          <TotalRow label="Net Profit" value={report.net_profit} sub={`${report.net_margin_pct}% margin`} highlight />
        </div>
      )}

      {/* Balance Sheet */}
      {type === 'balance_sheet' && report.sections && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">As at: {report.as_at}</p>
          <ReportSection title="Assets" data={report.sections.assets} />
          <ReportSection title="Liabilities" data={report.sections.liabilities} />
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">Equity</h4>
            {report.sections.equity?.accounts && Object.entries(report.sections.equity.accounts).map(([k, v]) => (
              <AccountRow key={k} name={k} amount={v} />
            ))}
            <AccountRow name="Retained Earnings (Current Period)" amount={report.sections.equity?.retained_earnings_current_period} />
            <div className="border-t mt-2 pt-2 flex justify-between font-semibold text-sm">
              <span>Total Equity</span><span>{report.sections.equity?.total}</span>
            </div>
          </div>
          <TotalRow label="Total Assets" value={report.total_assets} />
          <TotalRow label="Total Liabilities + Equity" value={report.total_liabilities_and_equity} />
          <div className={`p-3 rounded-lg text-sm font-medium ${report.balanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {report.balanced ? 'Balance sheet is balanced' : `Out of balance by ${report.difference}`}
          </div>
        </div>
      )}

      {/* Trial Balance */}
      {type === 'trial_balance' && (
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Account</th>
                <th className="py-2 text-right">Debit</th>
                <th className="py-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {(report.lines || []).map((line, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 font-mono text-xs">{line.account}</td>
                  <td className="py-2 text-right">{line.debit !== '0.00' ? line.debit : ''}</td>
                  <td className="py-2 text-right">{line.credit !== '0.00' ? line.credit : ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t-2">
                <td className="py-2">Total</td>
                <td className="py-2 text-right">{report.total_debit}</td>
                <td className="py-2 text-right">{report.total_credit}</td>
              </tr>
            </tfoot>
          </table>
          <div className={`mt-3 p-3 rounded-lg text-sm ${report.balanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {report.balanced ? `Balanced (${report.account_count} accounts)` : `Out of balance by ${report.difference}`}
          </div>
        </div>
      )}

      {/* Cash Flow */}
      {type === 'cash_flow' && report.sections && (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">Operating Activities</h4>
            <AccountRow name="Net Profit" amount={report.sections.operating_activities?.net_profit} />
            <AccountRow name="Add Back: Depreciation/Amortization" amount={report.sections.operating_activities?.add_back_depreciation_amortization} />
            {report.sections.operating_activities?.working_capital_changes &&
              Object.entries(report.sections.operating_activities.working_capital_changes).map(([k, v]) => (
                <AccountRow key={k} name={k.replace(/_/g, ' ')} amount={v} />
              ))
            }
            <div className="border-t mt-2 pt-2 flex justify-between font-semibold text-sm">
              <span>Cash from Operations</span>
              <span>{report.sections.operating_activities?.cash_from_operations}</span>
            </div>
          </div>
          <ReportSection title="Investing Activities" data={report.sections.investing_activities} />
          <ReportSection title="Financing Activities" data={report.sections.financing_activities} />
          <TotalRow label="Net Change in Cash" value={report.net_change_in_cash} highlight />
        </div>
      )}

      {/* General Ledger */}
      {type === 'general_ledger' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{report.total_accounts} accounts</p>
          {(report.accounts || []).map((acc, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 flex justify-between text-sm font-medium">
                <span className="font-mono">{acc.account}</span>
                <span>Balance: {acc.closing_balance}</span>
              </div>
              <table className="w-full text-xs">
                <thead><tr className="text-gray-400 border-b">
                  <th className="px-4 py-1 text-left">Date</th>
                  <th className="px-4 py-1 text-left">Description</th>
                  <th className="px-4 py-1 text-right">Debit</th>
                  <th className="px-4 py-1 text-right">Credit</th>
                  <th className="px-4 py-1 text-right">Balance</th>
                </tr></thead>
                <tbody>
                  {acc.entries.map((e, j) => (
                    <tr key={j} className="border-b border-gray-50">
                      <td className="px-4 py-1 font-mono">{e.date}</td>
                      <td className="px-4 py-1">{e.description}</td>
                      <td className="px-4 py-1 text-right">{e.debit}</td>
                      <td className="px-4 py-1 text-right">{e.credit}</td>
                      <td className="px-4 py-1 text-right font-medium">{e.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Aged Reports */}
      {(type === 'aged_receivables' || type === 'aged_payables') && (
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Name</th>
                <th className="py-2 text-right">Current</th>
                <th className="py-2 text-right">1-30</th>
                <th className="py-2 text-right">31-60</th>
                <th className="py-2 text-right">61-90</th>
                <th className="py-2 text-right">90+</th>
                <th className="py-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {(report.lines || []).map((line, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2">{line.name}</td>
                  <td className="py-2 text-right">{line.current}</td>
                  <td className="py-2 text-right">{line['1_30_days']}</td>
                  <td className="py-2 text-right">{line['31_60_days']}</td>
                  <td className="py-2 text-right">{line['61_90_days']}</td>
                  <td className="py-2 text-right text-red-600">{line.over_90_days}</td>
                  <td className="py-2 text-right font-bold">{line.total}</td>
                </tr>
              ))}
            </tbody>
            {report.totals && (
              <tfoot>
                <tr className="font-bold border-t-2">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right">{report.totals.current}</td>
                  <td className="py-2 text-right">{report.totals['1_30_days']}</td>
                  <td className="py-2 text-right">{report.totals['31_60_days']}</td>
                  <td className="py-2 text-right">{report.totals['61_90_days']}</td>
                  <td className="py-2 text-right text-red-600">{report.totals.over_90_days}</td>
                  <td className="py-2 text-right">{report.totals.grand_total}</td>
                </tr>
              </tfoot>
            )}
          </table>
          <p className="text-xs text-gray-400 mt-2">{report.customer_count || 0} {type === 'aged_receivables' ? 'customers' : 'vendors'}</p>
        </div>
      )}

      {/* Empty state */}
      {meta?.transactions_included === 0 && (
        <div className="bg-gray-50 border rounded-lg p-6 text-center">
          <p className="text-gray-500">No approved transactions found for this period.</p>
          <p className="text-gray-400 text-sm mt-1">Approve transactions in the Review Queue to see them in reports.</p>
        </div>
      )}
    </div>
  );
}


function ReportSection({ title, data }) {
  if (!data) return null;
  const accounts = data.accounts || data.items || {};
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      {Object.entries(accounts).map(([name, amount]) => (
        <AccountRow key={name} name={name} amount={amount} />
      ))}
      {data.total && (
        <div className="border-t mt-2 pt-2 flex justify-between font-semibold text-sm">
          <span>Total</span><span>{data.total}</span>
        </div>
      )}
    </div>
  );
}

function AccountRow({ name, amount }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-gray-600 font-mono text-xs">{name}</span>
      <span>{amount}</span>
    </div>
  );
}

function TotalRow({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-lg p-4 flex items-center justify-between ${highlight ? 'bg-indigo-50 border border-indigo-200' : 'bg-white border'}`}>
      <div>
        <span className="font-bold">{label}</span>
        {sub && <span className="text-xs text-gray-400 ml-2">{sub}</span>}
      </div>
      <span className={`text-xl font-bold ${highlight ? 'text-indigo-700' : ''}`}>{value}</span>
    </div>
  );
}


function jsonToCSV(data) {
  // For trial balance / aged reports with lines array
  if (data.lines && Array.isArray(data.lines)) {
    const headers = Object.keys(data.lines[0] || {});
    const rows = data.lines.map(line => headers.map(h => line[h] || '').join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  // For P&L / Balance Sheet — flatten sections
  const rows = [];
  const flatten = (obj, prefix = '') => {
    for (const [key, val] of Object.entries(obj)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        flatten(val, prefix ? `${prefix} > ${key}` : key);
      } else {
        rows.push(`"${prefix ? `${prefix} > ${key}` : key}","${val}"`);
      }
    }
  };
  flatten(data);
  return rows.join('\n');
}
