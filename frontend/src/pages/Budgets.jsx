import { useState } from 'react';
import { useToast } from '../components/Toast';
import DemoDataBanner from '../components/DemoDataBanner';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-700',
  closed: 'bg-blue-100 text-blue-700',
};

const DEMO_BUDGETS = [
  {
    id: '1', name: 'FY2026 Operating Budget', period_type: 'annual', start_date: '2025-04-01', end_date: '2026-03-31', status: 'active', currency: 'AUD',
    lines: [
      { account_code: '4000', account_name: 'Sales Revenue', category: 'revenue', budgeted: 480000, actual: 462000 },
      { account_code: '4100', account_name: 'Service Revenue', category: 'revenue', budgeted: 120000, actual: 138500 },
      { account_code: '4200', account_name: 'Interest Income', category: 'revenue', budgeted: 2400, actual: 2100 },
      { account_code: '5200', account_name: 'Rent', category: 'expense', budgeted: 54000, actual: 54000 },
      { account_code: '5400', account_name: 'Wages', category: 'expense', budgeted: 342000, actual: 356200 },
      { account_code: '5500', account_name: 'Superannuation', category: 'expense', budgeted: 39330, actual: 40963 },
      { account_code: '5100', account_name: 'Office Supplies', category: 'expense', budgeted: 12000, actual: 8400 },
      { account_code: '5600', account_name: 'Insurance', category: 'expense', budgeted: 6000, actual: 5800 },
      { account_code: '5700', account_name: 'Depreciation', category: 'expense', budgeted: 15000, actual: 15000 },
      { account_code: '5300', account_name: 'Utilities', category: 'expense', budgeted: 7200, actual: 8100 },
      { account_code: '5800', account_name: 'Professional Fees', category: 'expense', budgeted: 24000, actual: 21000 },
      { account_code: '5900', account_name: 'Travel', category: 'expense', budgeted: 18000, actual: 22400 },
      { account_code: '5950', account_name: 'Marketing', category: 'expense', budgeted: 36000, actual: 28600 },
      { account_code: '5960', account_name: 'Bank Fees', category: 'expense', budgeted: 1800, actual: 1650 },
    ],
  },
  {
    id: '2', name: 'Q4 2026 Marketing Campaign', period_type: 'quarterly', start_date: '2026-01-01', end_date: '2026-03-31', status: 'active', currency: 'AUD',
    lines: [
      { account_code: '5950', account_name: 'Advertising', category: 'expense', budgeted: 15000, actual: 12300 },
      { account_code: '5951', account_name: 'Social Media', category: 'expense', budgeted: 5000, actual: 5800 },
      { account_code: '5952', account_name: 'Events', category: 'expense', budgeted: 8000, actual: 3200 },
      { account_code: '5953', account_name: 'Content', category: 'expense', budgeted: 4000, actual: 4100 },
    ],
  },
];

function calcVariance(budgeted, actual) {
  const diff = actual - budgeted;
  const pct = budgeted > 0 ? (actual / budgeted) * 100 : 0;
  return { diff, pct };
}

function varianceColor(pct, category) {
  // For revenue: over is good (green), under is amber/red
  // For expenses: under is good (green), over is bad (red)
  if (category === 'revenue') {
    if (pct >= 100) return 'text-green-600';
    if (pct >= 90) return 'text-amber-600';
    return 'text-red-600';
  }
  if (pct <= 100) return 'text-green-600';
  if (pct <= 110) return 'text-amber-600';
  return 'text-red-600';
}

function barColor(pct, category) {
  if (category === 'revenue') {
    if (pct >= 100) return 'bg-green-500';
    if (pct >= 90) return 'bg-amber-500';
    return 'bg-red-500';
  }
  if (pct <= 100) return 'bg-green-500';
  if (pct <= 110) return 'bg-amber-500';
  return 'bg-red-500';
}

function fmtCurrency(v) {
  return '$' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtPct(v) {
  return v.toFixed(1) + '%';
}

function fmtVariance(diff) {
  const sign = diff >= 0 ? '+' : '';
  return sign + fmtCurrency(diff);
}

export default function Budgets() {
  const [budgets, setBudgets] = useState(DEMO_BUDGETS);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  const getBudgetSummary = (b) => {
    const totalBudgeted = b.lines.reduce((s, l) => s + l.budgeted, 0);
    const totalActual = b.lines.reduce((s, l) => s + l.actual, 0);
    const { diff, pct } = calcVariance(totalBudgeted, totalActual);
    return { totalBudgeted, totalActual, diff, pct };
  };

  if (selected) {
    return <BudgetDetail budget={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Budgets</h2>
          <p className="text-gray-500 mt-1">Track budgets vs actuals across your accounts</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          {showCreate ? 'Cancel' : '+ Create Budget'}
        </button>
      </div>

      <DemoDataBanner feature="Budgets" ctaTo="/reports" ctaLabel="Use my financials" />

      {showCreate && (
        <CreateBudgetForm
          onSubmit={(data) => {
            setBudgets(prev => [{ id: String(Date.now()), ...data, status: 'draft' }, ...prev]);
            setShowCreate(false);
            toast.success('Budget created');
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="Total Budgets" value={budgets.length} />
        <Card label="Active" value={budgets.filter(b => b.status === 'active').length} color="green" />
        <Card label="Draft" value={budgets.filter(b => b.status === 'draft').length} color="amber" />
        <Card label="Total Budgeted" value={fmtCurrency(budgets.reduce((s, b) => s + b.lines.reduce((ls, l) => ls + l.budgeted, 0), 0))} color="blue" />
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map(b => {
          const { totalBudgeted, totalActual, diff, pct } = getBudgetSummary(b);
          const overallColor = pct <= 100 ? 'text-green-600' : pct <= 110 ? 'text-amber-600' : 'text-red-600';
          return (
            <div key={b.id} onClick={() => setSelected(b)} className="bg-white rounded-xl border p-6 hover:shadow-md cursor-pointer transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{b.name}</h3>
                  <p className="text-gray-500 text-sm mt-0.5">{b.period_type.charAt(0).toUpperCase() + b.period_type.slice(1)} &middot; {b.start_date} to {b.end_date}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[b.status]}`}>
                  {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Budgeted</p>
                  <p className="font-bold text-gray-900">{fmtCurrency(totalBudgeted)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Actual</p>
                  <p className="font-bold text-gray-900">{fmtCurrency(totalActual)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Variance</p>
                  <p className={`font-bold ${overallColor}`}>{fmtVariance(diff)} ({fmtPct(pct)})</p>
                </div>
              </div>
              {/* Overall utilization bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${pct <= 100 ? 'bg-green-500' : pct <= 110 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{fmtPct(pct)} utilized</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({ label, value, color = 'indigo' }) {
  const c = { indigo: 'bg-indigo-50 text-indigo-700', green: 'bg-green-50 text-green-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-blue-50 text-blue-700' };
  return <div className={`rounded-xl p-4 ${c[color]}`}><p className="text-xs font-medium opacity-70">{label}</p><p className="text-xl font-bold mt-1">{value}</p></div>;
}

function BudgetDetail({ budget: b, onBack }) {
  const revenueLines = b.lines.filter(l => l.category === 'revenue');
  const expenseLines = b.lines.filter(l => l.category === 'expense');
  const totalBudgeted = b.lines.reduce((s, l) => s + l.budgeted, 0);
  const totalActual = b.lines.reduce((s, l) => s + l.actual, 0);
  const { diff, pct } = calcVariance(totalBudgeted, totalActual);
  const overallBarColor = pct <= 100 ? 'bg-green-500' : pct <= 110 ? 'bg-amber-500' : 'bg-red-500';
  const overallTextColor = pct <= 100 ? 'text-green-600' : pct <= 110 ? 'text-amber-600' : 'text-red-600';

  const renderLineRows = (lines) =>
    lines.map((l, i) => {
      const { diff: ld, pct: lp } = calcVariance(l.budgeted, l.actual);
      const vc = varianceColor(lp, l.category);
      const bc = barColor(lp, l.category);
      return (
        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
          <td className="px-4 py-3 font-mono text-gray-500 text-xs">{l.account_code}</td>
          <td className="px-4 py-3 text-gray-900 font-medium">{l.account_name}</td>
          <td className="px-4 py-3 text-center">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.category === 'revenue' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
              {l.category.charAt(0).toUpperCase() + l.category.slice(1)}
            </span>
          </td>
          <td className="px-4 py-3 text-right font-medium text-gray-900">{fmtCurrency(l.budgeted)}</td>
          <td className="px-4 py-3 text-right font-medium text-gray-900">{fmtCurrency(l.actual)}</td>
          <td className={`px-4 py-3 text-right font-medium ${vc}`}>{fmtVariance(ld)}</td>
          <td className={`px-4 py-3 text-right font-medium ${vc}`}>{fmtPct(lp)}</td>
          <td className="px-4 py-3 w-36">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${bc}`} style={{ width: `${Math.min(lp, 100)}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 text-right">{fmtPct(lp)}</p>
          </td>
        </tr>
      );
    });

  return (
    <div>
      {/* Back button + Header */}
      <button onClick={onBack} className="flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-4 transition-colors">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Budgets
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">{b.name}</h2>
          <p className="text-gray-500 mt-1">
            {b.period_type.charAt(0).toUpperCase() + b.period_type.slice(1)} &middot; {b.start_date} to {b.end_date} &middot; {b.currency}
          </p>
        </div>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_COLORS[b.status]}`}>
          {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
        </span>
      </div>

      {/* Summary Bar */}
      <div className="bg-white rounded-xl border p-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-gray-900">{fmtCurrency(totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Total Actual</p>
            <p className="text-2xl font-bold text-gray-900">{fmtCurrency(totalActual)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Variance ($)</p>
            <p className={`text-2xl font-bold ${overallTextColor}`}>{fmtVariance(diff)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Variance (%)</p>
            <p className={`text-2xl font-bold ${overallTextColor}`}>{fmtPct(pct)}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${overallBarColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{fmtPct(pct)} of total budget utilized</p>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Code</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Account</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Category</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Budgeted</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Actual</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Variance ($)</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Variance (%)</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {revenueLines.length > 0 && (
              <tr className="bg-blue-50/50">
                <td colSpan={8} className="px-4 py-2 text-xs font-bold text-blue-700 uppercase tracking-wider">Revenue</td>
              </tr>
            )}
            {renderLineRows(revenueLines)}
            {expenseLines.length > 0 && (
              <tr className="bg-orange-50/50">
                <td colSpan={8} className="px-4 py-2 text-xs font-bold text-orange-700 uppercase tracking-wider">Expenses</td>
              </tr>
            )}
            {renderLineRows(expenseLines)}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td colSpan={3} className="px-4 py-3 font-bold text-gray-900">Total</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">{fmtCurrency(totalBudgeted)}</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">{fmtCurrency(totalActual)}</td>
              <td className={`px-4 py-3 text-right font-bold ${overallTextColor}`}>{fmtVariance(diff)}</td>
              <td className={`px-4 py-3 text-right font-bold ${overallTextColor}`}>{fmtPct(pct)}</td>
              <td className="px-4 py-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${overallBarColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function CreateBudgetForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    period_type: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    currency: 'AUD',
    lines: [{ account_code: '', account_name: '', category: 'expense', budgeted: 0, actual: 0 }],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateLine = (i, k, v) => {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [k]: v };
    set('lines', lines);
  };
  const addLine = () => set('lines', [...form.lines, { account_code: '', account_name: '', category: 'expense', budgeted: 0, actual: 0 }]);
  const removeLine = (i) => { if (form.lines.length > 1) set('lines', form.lines.filter((_, idx) => idx !== i)); };
  const totalBudgeted = form.lines.reduce((s, l) => s + (Number(l.budgeted) || 0), 0);

  return (
    <div className="bg-white rounded-xl border p-6 mb-8">
      <h3 className="font-bold text-lg mb-4">New Budget</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Budget Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. FY2027 Operating Budget" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Period Type</label>
          <select value={form.period_type} onChange={e => set('period_type', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Start Date</label>
          <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">End Date</label>
          <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>
      <div className="mb-2">
        <label className="text-xs font-medium text-gray-600 block mb-1">Currency</label>
        <select value={form.currency} onChange={e => set('currency', e.target.value)} className="w-32 px-3 py-2 border rounded-lg text-sm bg-white">
          <option value="AUD">AUD</option>
          <option value="NZD">NZD</option>
          <option value="GBP">GBP</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <h4 className="font-semibold text-sm text-gray-700 mt-6 mb-3">Budget Lines</h4>
      <table className="w-full text-sm mb-3">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 text-gray-600">Account Code</th>
            <th className="text-left py-2 text-gray-600">Account Name</th>
            <th className="text-left py-2 text-gray-600 w-28">Category</th>
            <th className="text-right py-2 text-gray-600 w-32">Budgeted Amount</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {form.lines.map((l, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1">
                <input value={l.account_code} onChange={e => updateLine(i, 'account_code', e.target.value)} placeholder="e.g. 5100" className="w-full px-2 py-1 border rounded text-sm" />
              </td>
              <td className="py-1">
                <input value={l.account_name} onChange={e => updateLine(i, 'account_name', e.target.value)} placeholder="e.g. Office Supplies" className="w-full px-2 py-1 border rounded text-sm" />
              </td>
              <td className="py-1">
                <select value={l.category} onChange={e => updateLine(i, 'category', e.target.value)} className="w-full px-2 py-1 border rounded text-sm bg-white">
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </td>
              <td className="py-1">
                <input type="number" value={l.budgeted} onChange={e => updateLine(i, 'budgeted', Number(e.target.value))} className="w-full px-2 py-1 border rounded text-sm text-right" />
              </td>
              <td className="py-1 text-center">
                <button onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500 text-lg leading-none" title="Remove line">&times;</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addLine} className="text-xs text-indigo-600 font-medium hover:underline mb-4">+ Add line</button>

      <div className="flex justify-between items-end mt-4">
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
          <button
            onClick={() => form.name && form.lines.length > 0 && onSubmit(form)}
            disabled={!form.name}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
          >
            Create Budget
          </button>
        </div>
        <div className="text-sm text-right">
          <span className="text-gray-500">Total Budgeted:</span>{' '}
          <span className="font-bold text-base">{fmtCurrency(totalBudgeted)}</span>
        </div>
      </div>
    </div>
  );
}
