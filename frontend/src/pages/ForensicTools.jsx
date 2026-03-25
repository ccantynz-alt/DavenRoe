import { useState } from 'react';
import { useToast } from '../components/Toast';

const RISK_COLORS = {
  critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-600',
};

const PATTERN_FLAGS = [
  { id: 1, date: '2026-03-22', vendor: 'Office World Supplies', amount: 9999.00, type: 'Just below $10K threshold', risk: 'critical', detail: 'Transaction is $1 below the $10,000 ATO reporting threshold. Pattern repeated 3 times in the last 6 months.' },
  { id: 2, date: '2026-03-15', vendor: 'JD Holdings Pty Ltd', amount: 5000.00, type: 'Round amount', risk: 'high', detail: 'Exact round amount of $5,000. No invoice reference. Vendor has no ABN on file.' },
  { id: 3, date: '2026-03-14', vendor: 'FastTech Solutions', amount: 3000.00, type: 'Duplicate payment', risk: 'high', detail: 'Same amount ($3,000) paid to this vendor on 2026-02-14 and 2026-01-14. No purchase orders exist.' },
  { id: 4, date: '2026-03-09', vendor: 'ABC Consulting', amount: 7500.00, type: 'Weekend transaction', risk: 'medium', detail: 'Payment processed on Saturday. All other payments to this vendor are on weekdays.' },
  { id: 5, date: '2026-03-08', vendor: 'GreenLeaf Services', amount: 2000.00, type: 'Round amount', risk: 'medium', detail: 'Exact round amount. However, vendor has valid ABN and regular invoicing pattern.' },
  { id: 6, date: '2026-03-01', vendor: 'JD Holdings Pty Ltd', amount: 4999.50, type: 'Just below threshold', risk: 'critical', detail: 'Second payment from JD Holdings just under $5,000 internal approval threshold. Pattern suggests structuring to avoid approval.' },
  { id: 7, date: '2026-02-28', vendor: 'Unknown Supplier #47', amount: 12500.00, type: 'New vendor, large amount', risk: 'high', detail: 'First-ever transaction with this vendor. Amount exceeds 90th percentile for new vendor first payments.' },
  { id: 8, date: '2026-02-25', vendor: 'Office World Supplies', amount: 1200.00, type: 'Period-end timing', risk: 'low', detail: 'Transaction on last business day of period. Amount is consistent with normal purchasing pattern.' },
];

const VENDOR_RISKS = [
  { name: 'JD Holdings Pty Ltd', total_spend: 42500, txn_count: 8, avg_amount: 5312, risk: 'critical', flags: ['No ABN on file', 'PO Box address only', 'Round amounts only', 'Below-threshold pattern'] },
  { name: 'Unknown Supplier #47', total_spend: 12500, txn_count: 1, avg_amount: 12500, risk: 'high', flags: ['No ABN', 'Single transaction', 'No invoice on file'] },
  { name: 'Office World Supplies', total_spend: 28400, txn_count: 12, avg_amount: 2367, risk: 'high', flags: ['Below-threshold payments (3x)', 'No purchase orders'] },
  { name: 'FastTech Solutions', total_spend: 18000, txn_count: 6, avg_amount: 3000, risk: 'medium', flags: ['Identical amounts each month'] },
  { name: 'ABC Consulting', total_spend: 45000, txn_count: 6, avg_amount: 7500, risk: 'medium', flags: ['Weekend transaction detected'] },
  { name: 'Premium Print Co', total_spend: 8200, txn_count: 4, avg_amount: 2050, risk: 'low', flags: [] },
  { name: 'CloudHost Pro', total_spend: 8400, txn_count: 12, avg_amount: 700, risk: 'low', flags: [] },
  { name: 'Legal Eagles LLP', total_spend: 24000, txn_count: 4, avg_amount: 6000, risk: 'low', flags: [] },
  { name: 'GreenLeaf Services', total_spend: 14000, txn_count: 7, avg_amount: 2000, risk: 'low', flags: [] },
  { name: 'DataSafe Security', total_spend: 3600, txn_count: 12, avg_amount: 300, risk: 'low', flags: [] },
];

const JOURNAL_FLAGS = [
  { id: 1, date: '2026-03-22', time: '23:47', user: 'admin@firm.com', amount: 45000, type: 'After hours', risk: 'high', detail: 'Journal entry posted at 11:47 PM. All other entries by this user are between 8 AM — 6 PM.' },
  { id: 2, date: '2026-03-31', time: '17:55', user: 'tom.r@firm.com', amount: 28000, type: 'Period-end adjustment', risk: 'high', detail: 'Large adjustment ($28,000) posted 5 minutes before period close. Reverses a revenue recognition entry.' },
  { id: 3, date: '2026-03-15', time: '09:12', user: 'new.hire@firm.com', amount: 15000, type: 'New user, large entry', risk: 'medium', detail: 'User account created 3 days ago. This is their first journal entry and exceeds $10,000.' },
  { id: 4, date: '2026-02-28', time: '16:30', user: 'admin@firm.com', amount: 10000, type: 'Round amount', risk: 'medium', detail: 'Round $10,000 journal entry. No supporting documentation attached.' },
  { id: 5, date: '2026-02-15', time: '14:20', user: 'tom.r@firm.com', amount: 5200, type: 'Back-dated entry', risk: 'medium', detail: 'Entry posted on Feb 15 but dated Jan 28. This is 18 days backdated.' },
  { id: 6, date: '2026-01-31', time: '17:58', user: 'admin@firm.com', amount: 8400, type: 'Period-end', risk: 'low', detail: 'Period-end entry but amount is consistent with monthly accrual pattern.' },
];

const CASH_ANOMALIES = [
  { month: 'Jan', revenue: 82000, expenses: 61000, net: 21000, anomaly: false },
  { month: 'Feb', revenue: 78000, expenses: 58000, net: 20000, anomaly: false },
  { month: 'Mar', revenue: 91000, expenses: 64000, net: 27000, anomaly: false },
  { month: 'Apr', revenue: 85000, expenses: 62000, net: 23000, anomaly: false },
  { month: 'May', revenue: 42000, expenses: 63000, net: -21000, anomaly: true, detail: 'Revenue dropped 51% with no corresponding business event. Investigate missing invoices or delayed billing.' },
  { month: 'Jun', revenue: 88000, expenses: 59000, net: 29000, anomaly: false },
  { month: 'Jul', revenue: 84000, expenses: 95000, net: -11000, anomaly: true, detail: 'Expenses spiked 61% above 6-month average. Single payment of $38,000 to new vendor "JD Holdings".' },
  { month: 'Aug', revenue: 90000, expenses: 61000, net: 29000, anomaly: false },
  { month: 'Sep', revenue: 87000, expenses: 60000, net: 27000, anomaly: false },
  { month: 'Oct', revenue: 92000, expenses: 63000, net: 29000, anomaly: false },
  { month: 'Nov', revenue: 86000, expenses: 62000, net: 24000, anomaly: false },
  { month: 'Dec', revenue: 79000, expenses: 58000, net: 21000, anomaly: false },
];

const TABS = ['Transaction Patterns', 'Vendor Risk Matrix', 'Journal Entry Test', 'Cash Flow Anomalies'];

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

export default function ForensicTools() {
  const [tab, setTab] = useState(0);
  const [scanned, setScanned] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const toast = useToast();

  const summary = {
    critical: PATTERN_FLAGS.filter(f => f.risk === 'critical').length + VENDOR_RISKS.filter(v => v.risk === 'critical').length,
    high: PATTERN_FLAGS.filter(f => f.risk === 'high').length + JOURNAL_FLAGS.filter(j => j.risk === 'high').length,
    medium: PATTERN_FLAGS.filter(f => f.risk === 'medium').length,
    anomalies: CASH_ANOMALIES.filter(c => c.anomaly).length,
  };

  const handleScan = () => {
    setScanned(false);
    setTimeout(() => { setScanned(true); toast.success('Forensic scan complete — results updated'); }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forensic Analysis</h1>
          <p className="text-sm text-gray-500 mt-0.5">Advanced fraud detection and anomaly scanning</p>
        </div>
        <button onClick={handleScan} disabled={!scanned}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
          {scanned ? 'Run Full Scan' : 'Scanning...'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Critical Risks</p>
          <p className="text-xl font-bold text-red-600">{summary.critical}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">High Risks</p>
          <p className="text-xl font-bold text-orange-600">{summary.high}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Medium Risks</p>
          <p className="text-xl font-bold text-amber-600">{summary.medium}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Cash Anomalies</p>
          <p className="text-xl font-bold text-purple-600">{summary.anomalies}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${tab === i ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Transaction Patterns */}
      {tab === 0 && (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Flagged Transactions ({PATTERN_FLAGS.length})</h3>
          <div className="space-y-2">
            {PATTERN_FLAGS.map(flag => (
              <div key={flag.id} className="border rounded-lg">
                <button onClick={() => setExpanded(expanded === `p${flag.id}` ? null : `p${flag.id}`)}
                  className="w-full text-left p-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[flag.risk]}`}>{flag.risk}</span>
                    <span className="text-sm text-gray-800">{flag.vendor}</span>
                    <span className="text-sm font-medium text-gray-900">{fmt(flag.amount)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{flag.type}</span>
                    <span className="text-xs text-gray-400">{flag.date}</span>
                    <span className="text-gray-300">{expanded === `p${flag.id}` ? '−' : '+'}</span>
                  </div>
                </button>
                {expanded === `p${flag.id}` && (
                  <div className="px-3 pb-3 border-t bg-gray-50">
                    <p className="text-sm text-gray-600 py-2">{flag.detail}</p>
                    <div className="flex gap-2">
                      <button onClick={() => toast.success('Marked as reviewed')} className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded font-medium">Mark Reviewed</button>
                      <button onClick={() => toast.info('Investigation opened')} className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded font-medium">Open Investigation</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendor Risk Matrix */}
      {tab === 1 && (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Vendor Risk Assessment</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium">Vendor</th>
                  <th className="pb-2 font-medium">Total Spend</th>
                  <th className="pb-2 font-medium">Transactions</th>
                  <th className="pb-2 font-medium">Avg Amount</th>
                  <th className="pb-2 font-medium">Risk</th>
                  <th className="pb-2 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {VENDOR_RISKS.map(v => (
                  <tr key={v.name} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-800">{v.name}</td>
                    <td className="py-2.5">{fmt(v.total_spend)}</td>
                    <td className="py-2.5 text-gray-500">{v.txn_count}</td>
                    <td className="py-2.5">{fmt(v.avg_amount)}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[v.risk]}`}>{v.risk}</span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {v.flags.length > 0 ? v.flags.map(f => (
                          <span key={f} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">{f}</span>
                        )) : <span className="text-[10px] text-gray-400">Clean</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Journal Entry Test */}
      {tab === 2 && (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Journal Entry Irregularities ({JOURNAL_FLAGS.length})</h3>
          <div className="space-y-2">
            {JOURNAL_FLAGS.map(j => (
              <div key={j.id} className="border rounded-lg">
                <button onClick={() => setExpanded(expanded === `j${j.id}` ? null : `j${j.id}`)}
                  className="w-full text-left p-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[j.risk]}`}>{j.risk}</span>
                    <span className="text-sm text-gray-600">{j.user}</span>
                    <span className="text-sm font-medium text-gray-900">{fmt(j.amount)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{j.type}</span>
                    <span className="text-xs text-gray-400">{j.date} {j.time}</span>
                    <span className="text-gray-300">{expanded === `j${j.id}` ? '−' : '+'}</span>
                  </div>
                </button>
                {expanded === `j${j.id}` && (
                  <div className="px-3 pb-3 border-t bg-gray-50">
                    <p className="text-sm text-gray-600 py-2">{j.detail}</p>
                    <div className="flex gap-2">
                      <button onClick={() => toast.success('Marked as reviewed')} className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded font-medium">Mark Reviewed</button>
                      <button onClick={() => toast.info('Flagged for partner review')} className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded font-medium">Escalate</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cash Flow Anomalies */}
      {tab === 3 && (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">12-Month Cash Flow Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                  <th className="pb-2 font-medium text-right">Expenses</th>
                  <th className="pb-2 font-medium text-right">Net</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {CASH_ANOMALIES.map(m => (
                  <tr key={m.month} className={`border-b last:border-0 ${m.anomaly ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="py-2.5 font-medium text-gray-800">{m.month}</td>
                    <td className="py-2.5 text-right text-gray-600">{fmt(m.revenue)}</td>
                    <td className="py-2.5 text-right text-gray-600">{fmt(m.expenses)}</td>
                    <td className={`py-2.5 text-right font-medium ${m.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(m.net)}</td>
                    <td className="py-2.5">
                      {m.anomaly ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">ANOMALY</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {CASH_ANOMALIES.filter(m => m.anomaly).map(m => (
            <div key={m.month} className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800">{m.month}: Anomaly Detected</p>
              <p className="text-xs text-red-600 mt-1">{m.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
