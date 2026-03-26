import { useState } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const PRESETS = [
  { id: 'hire', label: 'Hire new employees', icon: '👤', fields: ['num_hires', 'avg_salary', 'start_month'] },
  { id: 'revenue_drop', label: 'Revenue decline', icon: '📉', fields: ['drop_pct', 'duration_months'] },
  { id: 'revenue_grow', label: 'Revenue growth', icon: '📈', fields: ['growth_pct', 'duration_months'] },
  { id: 'new_location', label: 'Open new location', icon: '🏢', fields: ['setup_cost', 'monthly_rent', 'monthly_revenue', 'start_month'] },
  { id: 'price_increase', label: 'Raise prices', icon: '💰', fields: ['increase_pct'] },
  { id: 'lose_client', label: 'Lose a major client', icon: '⚠️', fields: ['client_revenue', 'month'] },
  { id: 'loan', label: 'Take on debt', icon: '🏦', fields: ['loan_amount', 'interest_rate', 'term_months'] },
  { id: 'custom', label: 'Custom scenario', icon: '✏️', fields: ['description', 'monthly_impact'] },
];

const FIELD_LABELS = {
  num_hires: 'Number of hires', avg_salary: 'Avg annual salary', start_month: 'Starting month (1-12)',
  drop_pct: 'Revenue drop %', growth_pct: 'Revenue growth %', duration_months: 'Over how many months',
  setup_cost: 'One-time setup cost', monthly_rent: 'Monthly rent/overheads', monthly_revenue: 'Expected monthly revenue',
  increase_pct: 'Price increase %', client_revenue: 'Annual revenue from client', month: 'Month lost (1-12)',
  loan_amount: 'Loan amount', interest_rate: 'Annual interest rate %', term_months: 'Repayment term (months)',
  description: 'Describe the scenario', monthly_impact: 'Monthly cash impact (+/-)',
};

// Simulates a 12-month projection based on baseline + scenarios
function runSimulation(baseline, scenarios) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: new Date(2026, i).toLocaleString('default', { month: 'short' }),
    revenue: baseline.monthly_revenue,
    expenses: baseline.monthly_expenses,
    cash: 0,
  }));

  // Apply each scenario
  for (const sc of scenarios) {
    const p = sc.params;
    switch (sc.type) {
      case 'hire': {
        const start = (parseInt(p.start_month) || 1) - 1;
        const monthlyCost = ((parseInt(p.num_hires) || 1) * (parseFloat(p.avg_salary) || 60000)) / 12;
        for (let i = start; i < 12; i++) months[i].expenses += monthlyCost;
        break;
      }
      case 'revenue_drop': {
        const dur = parseInt(p.duration_months) || 6;
        const drop = (parseFloat(p.drop_pct) || 10) / 100;
        for (let i = 0; i < Math.min(dur, 12); i++) months[i].revenue *= (1 - drop);
        break;
      }
      case 'revenue_grow': {
        const dur = parseInt(p.duration_months) || 12;
        const grow = (parseFloat(p.growth_pct) || 10) / 100;
        for (let i = 0; i < Math.min(dur, 12); i++) months[i].revenue *= (1 + (grow * (i + 1) / dur));
        break;
      }
      case 'new_location': {
        const start = (parseInt(p.start_month) || 3) - 1;
        if (start < 12) months[start].expenses += parseFloat(p.setup_cost) || 0;
        for (let i = start; i < 12; i++) {
          months[i].expenses += parseFloat(p.monthly_rent) || 0;
          months[i].revenue += parseFloat(p.monthly_revenue) || 0;
        }
        break;
      }
      case 'price_increase': {
        const inc = (parseFloat(p.increase_pct) || 5) / 100;
        for (let i = 0; i < 12; i++) months[i].revenue *= (1 + inc);
        break;
      }
      case 'lose_client': {
        const mo = (parseInt(p.month) || 1) - 1;
        const loss = (parseFloat(p.client_revenue) || 0) / 12;
        for (let i = mo; i < 12; i++) months[i].revenue -= loss;
        break;
      }
      case 'loan': {
        const amt = parseFloat(p.loan_amount) || 0;
        const rate = (parseFloat(p.interest_rate) || 5) / 100 / 12;
        const term = parseInt(p.term_months) || 36;
        const payment = amt * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
        months[0].cash += amt; // lump sum in
        for (let i = 0; i < 12; i++) months[i].expenses += payment;
        break;
      }
      case 'custom': {
        const impact = parseFloat(p.monthly_impact) || 0;
        for (let i = 0; i < 12; i++) {
          if (impact >= 0) months[i].revenue += impact;
          else months[i].expenses += Math.abs(impact);
        }
        break;
      }
    }
  }

  // Calculate running cash balance
  let runningCash = baseline.cash_on_hand;
  for (const m of months) {
    const net = m.revenue - m.expenses + m.cash;
    runningCash += net;
    m.net = net;
    m.cash_balance = runningCash;
  }

  return months;
}

function generateInsights(baseline, scenarioMonths, baselineMonths) {
  const insights = [];
  const scenarioEndCash = scenarioMonths[11].cash_balance;
  const baselineEndCash = baselineMonths[11].cash_balance;
  const diff = scenarioEndCash - baselineEndCash;

  if (diff > 0) insights.push(`This scenario improves your year-end cash position by ${fmt(Math.abs(diff))}.`);
  else if (diff < 0) insights.push(`This scenario reduces your year-end cash position by ${fmt(Math.abs(diff))}.`);
  else insights.push('This scenario has no net impact on your year-end cash position.');

  const negativeMonth = scenarioMonths.find(m => m.cash_balance < 0);
  if (negativeMonth) {
    insights.push(`Warning: Cash goes negative in ${negativeMonth.label}. You'd need additional funding or cost cuts by then.`);
  }

  const worstMonth = scenarioMonths.reduce((w, m) => m.net < w.net ? m : w, scenarioMonths[0]);
  if (worstMonth.net < 0) {
    insights.push(`Your tightest month is ${worstMonth.label} with a net outflow of ${fmt(Math.abs(worstMonth.net))}.`);
  }

  const totalRevenue = scenarioMonths.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = scenarioMonths.reduce((s, m) => s + m.expenses, 0);
  const margin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : 0;
  insights.push(`Projected annual margin: ${margin}% (Revenue ${fmt(totalRevenue)}, Expenses ${fmt(totalExpenses)}).`);

  return insights;
}

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

export default function ScenarioPlanning() {
  const toast = useToast();
  const [baseline, setBaseline] = useState({
    monthly_revenue: 85000, monthly_expenses: 62000, cash_on_hand: 145000,
  });
  const [scenarios, setScenarios] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState(null);
  const [addParams, setAddParams] = useState({});
  const [comparing, setComparing] = useState(false);

  const baselineMonths = runSimulation(baseline, []);
  const scenarioMonths = scenarios.length > 0 ? runSimulation(baseline, scenarios) : null;
  const insights = scenarioMonths ? generateInsights(baseline, scenarioMonths, baselineMonths) : [];

  const addScenario = () => {
    if (!addType) return;
    setScenarios(prev => [...prev, { type: addType, params: { ...addParams }, label: PRESETS.find(p => p.id === addType)?.label || addType }]);
    setShowAdd(false);
    setAddType(null);
    setAddParams({});
    toast.success('Scenario added');
  };

  const removeScenario = (idx) => {
    setScenarios(prev => prev.filter((_, i) => i !== idx));
    toast.success('Scenario removed');
  };

  const maxCash = Math.max(
    ...baselineMonths.map(m => m.cash_balance),
    ...(scenarioMonths || []).map(m => m.cash_balance),
    1,
  );
  const minCash = Math.min(
    ...baselineMonths.map(m => m.cash_balance),
    ...(scenarioMonths || []).map(m => m.cash_balance),
    0,
  );
  const range = maxCash - minCash || 1;
  const chartH = 200;
  const toY = (v) => chartH - ((v - minCash) / range) * chartH;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scenario Planning</h1>
        <p className="text-sm text-gray-500 mt-0.5">Model "what if" scenarios and see the 12-month financial impact</p>
      </div>

      {/* Baseline inputs */}
      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Current Baseline</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Revenue</label>
            <input type="number" value={baseline.monthly_revenue}
              onChange={e => setBaseline(b => ({ ...b, monthly_revenue: parseFloat(e.target.value) || 0 }))}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Expenses</label>
            <input type="number" value={baseline.monthly_expenses}
              onChange={e => setBaseline(b => ({ ...b, monthly_expenses: parseFloat(e.target.value) || 0 }))}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cash On Hand</label>
            <input type="number" value={baseline.cash_on_hand}
              onChange={e => setBaseline(b => ({ ...b, cash_on_hand: parseFloat(e.target.value) || 0 }))}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {/* Active scenarios */}
      <div className="bg-white border rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-900">Scenarios ({scenarios.length})</h3>
          <button onClick={() => setShowAdd(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Add Scenario
          </button>
        </div>
        {scenarios.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Add scenarios above to model different outcomes</p>
        ) : (
          <div className="space-y-2">
            {scenarios.map((sc, idx) => {
              const preset = PRESETS.find(p => p.id === sc.type);
              return (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{preset?.icon || '📋'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{sc.label}</p>
                      <p className="text-xs text-gray-400">
                        {Object.entries(sc.params).filter(([, v]) => v).map(([k, v]) =>
                          `${FIELD_LABELS[k]?.split(' ').slice(0, 2).join(' ') || k}: ${v}`
                        ).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => removeScenario(idx)} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart: Cash flow projection */}
      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">12-Month Cash Flow Projection</h3>
        <div className="relative" style={{ height: chartH + 40 }}>
          {/* Zero line */}
          {minCash < 0 && (
            <div className="absolute left-0 right-0 border-t border-dashed border-red-300"
              style={{ top: toY(0) }}>
              <span className="text-[10px] text-red-400 absolute -top-3 left-0">$0</span>
            </div>
          )}

          {/* Baseline line */}
          <svg className="absolute inset-0 w-full" style={{ height: chartH }} viewBox={`0 0 100 ${chartH}`} preserveAspectRatio="none">
            <polyline fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 2"
              points={baselineMonths.map((m, i) => `${(i / 11) * 100},${toY(m.cash_balance)}`).join(' ')} />
            {scenarioMonths && (
              <polyline fill="none" stroke="#3b82f6" strokeWidth="2"
                points={scenarioMonths.map((m, i) => `${(i / 11) * 100},${toY(m.cash_balance)}`).join(' ')} />
            )}
          </svg>

          {/* Month labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between">
            {baselineMonths.map(m => (
              <span key={m.month} className="text-[10px] text-gray-400">{m.label}</span>
            ))}
          </div>

          {/* Legend */}
          <div className="absolute top-0 right-0 flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-gray-400 inline-block" style={{ borderTop: '2px dashed #94a3b8' }} />
              Baseline
            </span>
            {scenarioMonths && (
              <span className="flex items-center gap-1">
                <span className="w-4 h-0.5 bg-blue-500 inline-block" />
                With Scenarios
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-side comparison table */}
      {scenarioMonths && (
        <div className="bg-white border rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Month-by-Month Comparison</h3>
            <button onClick={() => setComparing(!comparing)}
              className="text-sm text-blue-600 hover:underline">{comparing ? 'Hide' : 'Show'} details</button>
          </div>
          {comparing && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b">
                    <th className="pb-2 text-left font-medium">Month</th>
                    <th className="pb-2 text-right font-medium">Baseline Cash</th>
                    <th className="pb-2 text-right font-medium">Scenario Cash</th>
                    <th className="pb-2 text-right font-medium">Difference</th>
                    <th className="pb-2 text-right font-medium">Scenario Revenue</th>
                    <th className="pb-2 text-right font-medium">Scenario Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {baselineMonths.map((bm, i) => {
                    const sm = scenarioMonths[i];
                    const diff = sm.cash_balance - bm.cash_balance;
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 text-gray-700">{bm.label}</td>
                        <td className="py-2 text-right text-gray-500">{fmt(bm.cash_balance)}</td>
                        <td className={`py-2 text-right font-medium ${sm.cash_balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {fmt(sm.cash_balance)}
                        </td>
                        <td className={`py-2 text-right ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff >= 0 ? '+' : ''}{fmt(diff)}
                        </td>
                        <td className="py-2 text-right text-gray-500">{fmt(sm.revenue)}</td>
                        <td className="py-2 text-right text-gray-500">{fmt(sm.expenses)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-3">AI Analysis</h3>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className={`text-sm ${insight.startsWith('Warning') ? 'text-red-700 font-medium' : 'text-blue-800'}`}>
                {insight}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      {scenarioMonths && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Year-End Cash (Baseline)</p>
            <p className="text-xl font-bold text-gray-600">{fmt(baselineMonths[11].cash_balance)}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Year-End Cash (Scenario)</p>
            <p className={`text-xl font-bold ${scenarioMonths[11].cash_balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {fmt(scenarioMonths[11].cash_balance)}
            </p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Net Impact</p>
            <p className={`text-xl font-bold ${scenarioMonths[11].cash_balance - baselineMonths[11].cash_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(scenarioMonths[11].cash_balance - baselineMonths[11].cash_balance)}
            </p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Months Until Negative</p>
            <p className="text-xl font-bold text-gray-900">
              {scenarioMonths.find(m => m.cash_balance < 0)
                ? scenarioMonths.findIndex(m => m.cash_balance < 0) + 1
                : 'Never'}
            </p>
          </div>
        </div>
      )}

      {/* Add scenario modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setShowAdd(false); setAddType(null); setAddParams({}); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Add Scenario</h2>

            {!addType ? (
              <div className="grid grid-cols-2 gap-3">
                {PRESETS.map(p => (
                  <button key={p.id} onClick={() => setAddType(p.id)}
                    className="flex items-center gap-3 p-4 border rounded-xl hover:bg-gray-50 text-left transition">
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-sm font-medium text-gray-800">{p.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={() => { setAddType(null); setAddParams({}); }}
                  className="text-sm text-blue-600 hover:underline mb-2">&larr; Back to scenarios</button>
                <h3 className="font-medium text-gray-800">{PRESETS.find(p => p.id === addType)?.icon} {PRESETS.find(p => p.id === addType)?.label}</h3>
                {PRESETS.find(p => p.id === addType)?.fields.map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{FIELD_LABELS[field]}</label>
                    {field === 'description' ? (
                      <textarea value={addParams[field] || ''} onChange={e => setAddParams(p => ({ ...p, [field]: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
                    ) : (
                      <input type="number" value={addParams[field] || ''} onChange={e => setAddParams(p => ({ ...p, [field]: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm" />
                    )}
                  </div>
                ))}
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => { setShowAdd(false); setAddType(null); setAddParams({}); }}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button onClick={addScenario}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Scenario</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <ProprietaryNotice />
    </div>
  );
}
