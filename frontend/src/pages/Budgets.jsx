import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700 border-transparent',
  draft: 'bg-gray-100 text-gray-700 border-transparent',
  closed: 'bg-blue-100 text-blue-700 border-transparent',
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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Budgets</h2>
          <p className="text-gray-500 mt-1">Track budgets vs actuals across your accounts</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Create Budget'}
        </Button>
      </div>

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
        <StatCard label="Total Budgets" value={budgets.length} />
        <StatCard label="Active" value={budgets.filter(b => b.status === 'active').length} color="green" />
        <StatCard label="Draft" value={budgets.filter(b => b.status === 'draft').length} color="amber" />
        <StatCard label="Total Budgeted" value={fmtCurrency(budgets.reduce((s, b) => s + b.lines.reduce((ls, l) => ls + l.budgeted, 0), 0))} color="blue" />
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map(b => {
          const { totalBudgeted, totalActual, diff, pct } = getBudgetSummary(b);
          const overallColor = pct <= 100 ? 'text-green-600' : pct <= 110 ? 'text-amber-600' : 'text-red-600';
          return (
            <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <Card onClick={() => setSelected(b)} className="cursor-pointer hover:shadow-lg transition-all p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{b.name}</h3>
                    <p className="text-gray-500 text-sm mt-0.5">{b.period_type.charAt(0).toUpperCase() + b.period_type.slice(1)} &middot; {b.start_date} to {b.end_date}</p>
                  </div>
                  <Badge className={STATUS_COLORS[b.status]}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </Badge>
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
                    <p className={cn('font-bold', overallColor)}>{fmtVariance(diff)} ({fmtPct(pct)})</p>
                  </div>
                </div>
                {/* Overall utilization bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={cn('h-2 rounded-full transition-all', pct <= 100 ? 'bg-green-500' : pct <= 110 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{fmtPct(pct)} utilized</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, color = 'indigo' }) {
  const colors = { indigo: 'bg-indigo-50 text-indigo-700', green: 'bg-green-50 text-green-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-blue-50 text-blue-700' };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card className={cn('border-none shadow-none', colors[color])}>
        <CardContent className="p-4">
          <p className="text-xs font-medium opacity-70">{label}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
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
        <TableRow key={i}>
          <TableCell className="font-mono text-gray-500 text-xs">{l.account_code}</TableCell>
          <TableCell className="text-gray-900 font-medium">{l.account_name}</TableCell>
          <TableCell className="text-center">
            <Badge className={cn(l.category === 'revenue' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700', 'border-transparent')}>
              {l.category.charAt(0).toUpperCase() + l.category.slice(1)}
            </Badge>
          </TableCell>
          <TableCell className="text-right font-medium text-gray-900">{fmtCurrency(l.budgeted)}</TableCell>
          <TableCell className="text-right font-medium text-gray-900">{fmtCurrency(l.actual)}</TableCell>
          <TableCell className={cn('text-right font-medium', vc)}>{fmtVariance(ld)}</TableCell>
          <TableCell className={cn('text-right font-medium', vc)}>{fmtPct(lp)}</TableCell>
          <TableCell className="w-36">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className={cn('h-2 rounded-full transition-all', bc)} style={{ width: `${Math.min(lp, 100)}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 text-right">{fmtPct(lp)}</p>
          </TableCell>
        </TableRow>
      );
    });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {/* Back button + Header */}
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Budgets
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">{b.name}</h2>
          <p className="text-gray-500 mt-1">
            {b.period_type.charAt(0).toUpperCase() + b.period_type.slice(1)} &middot; {b.start_date} to {b.end_date} &middot; {b.currency}
          </p>
        </div>
        <Badge className={STATUS_COLORS[b.status]}>
          {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
        </Badge>
      </div>

      {/* Summary Bar */}
      <Card className="mb-8">
        <CardContent className="p-6">
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
              <p className={cn('text-2xl font-bold', overallTextColor)}>{fmtVariance(diff)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Variance (%)</p>
              <p className={cn('text-2xl font-bold', overallTextColor)}>{fmtPct(pct)}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className={cn('h-3 rounded-full transition-all', overallBarColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">{fmtPct(pct)} of total budget utilized</p>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Code</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-center">Category</TableHead>
              <TableHead className="text-right">Budgeted</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Variance ($)</TableHead>
              <TableHead className="text-right">Variance (%)</TableHead>
              <TableHead>Utilization</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenueLines.length > 0 && (
              <TableRow className="bg-blue-50/50 hover:bg-blue-50/50">
                <TableCell colSpan={8} className="text-xs font-bold text-blue-700 uppercase tracking-wider py-2">Revenue</TableCell>
              </TableRow>
            )}
            {renderLineRows(revenueLines)}
            {expenseLines.length > 0 && (
              <TableRow className="bg-orange-50/50 hover:bg-orange-50/50">
                <TableCell colSpan={8} className="text-xs font-bold text-orange-700 uppercase tracking-wider py-2">Expenses</TableCell>
              </TableRow>
            )}
            {renderLineRows(expenseLines)}
          </TableBody>
          <TableFooter>
            <TableRow className="border-t-2 border-gray-200">
              <TableCell colSpan={3} className="font-bold text-gray-900">Total</TableCell>
              <TableCell className="text-right font-bold text-gray-900">{fmtCurrency(totalBudgeted)}</TableCell>
              <TableCell className="text-right font-bold text-gray-900">{fmtCurrency(totalActual)}</TableCell>
              <TableCell className={cn('text-right font-bold', overallTextColor)}>{fmtVariance(diff)}</TableCell>
              <TableCell className={cn('text-right font-bold', overallTextColor)}>{fmtPct(pct)}</TableCell>
              <TableCell>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={cn('h-2 rounded-full', overallBarColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </motion.div>
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
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4">New Budget</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">Budget Name *</label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. FY2027 Operating Budget" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Period Type</label>
              <Select value={form.period_type} onValueChange={v => set('period_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Start Date</label>
              <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">End Date</label>
              <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>
          <div className="mb-2">
            <label className="text-xs font-medium text-gray-600 block mb-1">Currency</label>
            <Select value={form.currency} onValueChange={v => set('currency', v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AUD">AUD</SelectItem>
                <SelectItem value="NZD">NZD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <h4 className="font-semibold text-sm text-gray-700 mt-6 mb-3">Budget Lines</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="w-28">Category</TableHead>
                <TableHead className="text-right w-32">Budgeted Amount</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.lines.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="p-1">
                    <Input value={l.account_code} onChange={e => updateLine(i, 'account_code', e.target.value)} placeholder="e.g. 5100" className="h-8" />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input value={l.account_name} onChange={e => updateLine(i, 'account_name', e.target.value)} placeholder="e.g. Office Supplies" className="h-8" />
                  </TableCell>
                  <TableCell className="p-1">
                    <Select value={l.category} onValueChange={v => updateLine(i, 'category', v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                    <Input type="number" value={l.budgeted} onChange={e => updateLine(i, 'budgeted', Number(e.target.value))} className="h-8 text-right" />
                  </TableCell>
                  <TableCell className="p-1 text-center">
                    <Button variant="ghost" size="icon" onClick={() => removeLine(i)} className="h-7 w-7 text-gray-400 hover:text-red-500" title="Remove line">&times;</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="link" size="sm" onClick={addLine} className="mb-4 mt-2">+ Add line</Button>

          <div className="flex justify-between items-end mt-4">
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button
                onClick={() => form.name && form.lines.length > 0 && onSubmit(form)}
                disabled={!form.name}
              >
                Create Budget
              </Button>
            </div>
            <div className="text-sm text-right">
              <span className="text-gray-500">Total Budgeted:</span>{' '}
              <span className="font-bold text-base">{fmtCurrency(totalBudgeted)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
