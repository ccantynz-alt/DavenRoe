import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  posted: 'bg-green-100 text-green-700',
  reversed: 'bg-amber-100 text-amber-700',
  voided: 'bg-red-100 text-red-700',
};

const DEMO_ENTRIES = [
  { id: '1', entry_number: 'JE-0001', date: '2026-03-31', description: 'Month-end accrual — March rent', status: 'posted', lines: [
    { account_code: '5200', account_name: 'Rent Expense', debit: 4500, credit: 0, description: 'March office rent' },
    { account_code: '2000', account_name: 'Accounts Payable', debit: 0, credit: 4500, description: 'Rent payable' },
  ]},
  { id: '2', entry_number: 'JE-0002', date: '2026-03-31', description: 'Depreciation — March 2026', status: 'posted', lines: [
    { account_code: '5700', account_name: 'Depreciation Expense', debit: 1250, credit: 0, description: 'Monthly depreciation' },
    { account_code: '1510', account_name: 'Accumulated Depreciation', debit: 0, credit: 1250, description: 'Accumulated depreciation' },
  ]},
  { id: '3', entry_number: 'JE-0003', date: '2026-03-31', description: 'Payroll accrual — March', status: 'posted', lines: [
    { account_code: '5400', account_name: 'Wages & Salaries', debit: 28500, credit: 0, description: 'March wages' },
    { account_code: '5500', account_name: 'Superannuation Expense', debit: 3277.50, credit: 0, description: 'March super contribution' },
    { account_code: '2200', account_name: 'PAYG Withholding', debit: 0, credit: 6270, description: 'PAYG payable' },
    { account_code: '2300', account_name: 'Super Payable', debit: 0, credit: 3277.50, description: 'Super payable' },
    { account_code: '2000', account_name: 'Accounts Payable', debit: 0, credit: 22230, description: 'Net wages payable' },
  ]},
  { id: '4', entry_number: 'JE-0004', date: '2026-03-24', description: 'Bad debt write-off', status: 'draft', lines: [
    { account_code: '5800', account_name: 'Bad Debts Expense', debit: 1500, credit: 0, description: 'Write-off uncollectable' },
    { account_code: '1100', account_name: 'Accounts Receivable', debit: 0, credit: 1500, description: 'Remove receivable' },
  ]},
  { id: '5', entry_number: 'JE-0005', date: '2026-03-31', description: 'Prepaid insurance allocation', status: 'posted', lines: [
    { account_code: '5600', account_name: 'Insurance Expense', debit: 416.67, credit: 0, description: 'Monthly insurance allocation' },
    { account_code: '1300', account_name: 'Prepaid Expenses', debit: 0, credit: 416.67, description: 'Reduce prepaid' },
  ]},
  { id: '6', entry_number: 'JE-0006', date: '2026-03-22', description: 'Correction: misallocated expense', status: 'draft', lines: [
    { account_code: '5900', account_name: 'Travel Expense', debit: 320, credit: 0, description: 'Reclassify to travel' },
    { account_code: '5100', account_name: 'Office Supplies', debit: 0, credit: 320, description: 'Remove from office supplies' },
  ]},
];

export default function JournalEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await api.get('/journal-entries/').catch(() => null);
      setEntries(res?.data?.entries || DEMO_ENTRIES);
    } catch { /* fallback */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = entries.filter(e => !filterStatus || e.status === filterStatus);

  const totalDebits = (entry) => entry.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredits = (entry) => entry.lines.reduce((s, l) => s + (l.credit || 0), 0);

  const summary = {
    total: entries.length,
    posted: entries.filter(e => e.status === 'posted').length,
    draft: entries.filter(e => e.status === 'draft').length,
    totalDebits: entries.reduce((s, e) => s + totalDebits(e), 0),
  };

  const handlePost = (entry) => {
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'posted' } : e));
    toast.success(`${entry.entry_number} posted`);
    setSelected(null);
  };

  const handleReverse = (entry) => {
    const nextNum = entries.length + 1;
    const reversingEntry = {
      id: String(Date.now()),
      entry_number: `JE-${String(nextNum).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      description: `Reversal of ${entry.entry_number}: ${entry.description}`,
      status: 'posted',
      lines: entry.lines.map(l => ({
        ...l,
        debit: l.credit,
        credit: l.debit,
        description: `Reversal: ${l.description}`,
      })),
    };
    setEntries(prev => [
      reversingEntry,
      ...prev.map(e => e.id === entry.id ? { ...e, status: 'reversed' } : e),
    ]);
    toast.success(`${entry.entry_number} reversed — ${reversingEntry.entry_number} created`);
    setSelected(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Journal Entries</h2>
          <p className="text-gray-500 mt-1">Create, review, and post manual journal entries</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          {showCreate ? 'Cancel' : '+ New Entry'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="Total Entries" value={summary.total} />
        <Card label="Posted" value={summary.posted} color="green" />
        <Card label="Draft" value={summary.draft} color="amber" />
        <Card label="Total Debits" value={`$${summary.totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="blue" />
      </div>

      {/* Create */}
      {showCreate && <CreateEntryForm entries={entries} onSubmit={(data) => { setEntries(prev => [{ id: String(Date.now()), ...data }, ...prev]); setShowCreate(false); toast.success('Journal entry created'); }} onCancel={() => setShowCreate(false)} />}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'draft', 'posted', 'reversed'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s ? s.replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {/* Detail */}
      {selected && <EntryDetail entry={selected} onClose={() => setSelected(null)} onPost={handlePost} onReverse={handleReverse} />}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Entry #</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Date</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Description</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Debit Total</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Credit Total</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} onClick={() => setSelected(e)} className="border-b hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-medium text-indigo-600">{e.entry_number}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{e.date}</td>
                <td className="px-4 py-3 text-gray-900">{e.description}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">${totalDebits(e).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">${totalCredits(e).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-center"><span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[e.status]}`}>{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value, color = 'indigo' }) {
  const c = { indigo: 'bg-indigo-50 text-indigo-700', green: 'bg-green-50 text-green-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-blue-50 text-blue-700' };
  return <div className={`rounded-xl p-4 ${c[color]}`}><p className="text-xs font-medium opacity-70">{label}</p><p className="text-xl font-bold mt-1">{value}</p></div>;
}

function EntryDetail({ entry: e, onClose, onPost, onReverse }) {
  const totalDebits = e.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredits = e.lines.reduce((s, l) => s + (l.credit || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto" onClick={ev => ev.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold">{e.entry_number}</h3>
            <p className="text-gray-500">{e.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[e.status]}`}>{e.status}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-2">x</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
          <div><p className="text-gray-500 text-xs">Date</p><p className="font-medium">{e.date}</p></div>
          <div><p className="text-gray-500 text-xs">Status</p><p className="font-medium capitalize">{e.status}</p></div>
          <div><p className="text-gray-500 text-xs">Lines</p><p className="font-medium">{e.lines.length}</p></div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead><tr className="border-b">
            <th className="text-left py-2 text-gray-600">Account</th>
            <th className="text-left py-2 text-gray-600">Name</th>
            <th className="text-left py-2 text-gray-600 hidden md:table-cell">Description</th>
            <th className="text-right py-2 text-gray-600">Debit</th>
            <th className="text-right py-2 text-gray-600">Credit</th>
          </tr></thead>
          <tbody>
            {e.lines.map((l, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 font-mono text-gray-700">{l.account_code}</td>
                <td className="py-2">{l.account_name}</td>
                <td className="py-2 text-gray-500 hidden md:table-cell">{l.description}</td>
                <td className="py-2 text-right font-medium">{l.debit > 0 ? `$${l.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}</td>
                <td className="py-2 text-right font-medium">{l.credit > 0 ? `$${l.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="text-sm space-y-1 w-48">
            <div className="flex justify-between"><span className="text-gray-500">Total Debits</span><span className="font-medium">${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Credits</span><span className="font-medium">${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1">
              <span>Difference</span>
              <span className={totalDebits === totalCredits ? 'text-green-600' : 'text-red-600'}>${Math.abs(totalDebits - totalCredits).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          {e.status === 'draft' && <button onClick={() => onPost(e)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Post Entry</button>}
          {e.status === 'posted' && <button onClick={() => onReverse(e)} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">Reverse Entry</button>}
        </div>
      </div>
    </div>
  );
}

function CreateEntryForm({ entries, onSubmit, onCancel }) {
  const nextNum = entries.length + 1;
  const [form, setForm] = useState({
    entry_number: `JE-${String(nextNum).padStart(4, '0')}`,
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'draft',
    lines: [
      { account_code: '', account_name: '', debit: 0, credit: 0, description: '' },
      { account_code: '', account_name: '', debit: 0, credit: 0, description: '' },
    ],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateLine = (i, k, v) => {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [k]: v };
    if (k === 'debit' && Number(v) > 0) lines[i].credit = 0;
    if (k === 'credit' && Number(v) > 0) lines[i].debit = 0;
    set('lines', lines);
  };
  const addLine = () => set('lines', [...form.lines, { account_code: '', account_name: '', debit: 0, credit: 0, description: '' }]);
  const removeLine = (i) => { if (form.lines.length > 2) set('lines', form.lines.filter((_, idx) => idx !== i)); };

  const totalDebits = form.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredits = form.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const isBalanced = totalDebits > 0 && totalDebits === totalCredits;
  const hasDescription = form.description.trim().length > 0;
  const hasAccounts = form.lines.every(l => l.account_code.trim().length > 0);
  const canSubmit = isBalanced && hasDescription && hasAccounts;

  return (
    <div className="bg-white rounded-xl border p-6 mb-8">
      <h3 className="font-bold text-lg mb-4">New Journal Entry</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Entry Number</label><input value={form.entry_number} onChange={e => set('entry_number', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" readOnly /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Date *</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Description *</label><input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Month-end accrual" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
      </div>

      <table className="w-full text-sm mb-3">
        <thead><tr className="border-b">
          <th className="text-left py-2 w-24">Account Code</th>
          <th className="text-left py-2">Account Name</th>
          <th className="text-left py-2 hidden md:table-cell">Description</th>
          <th className="text-right py-2 w-28">Debit</th>
          <th className="text-right py-2 w-28">Credit</th>
          <th className="text-center py-2 w-10"></th>
        </tr></thead>
        <tbody>{form.lines.map((l, i) => (
          <tr key={i} className="border-b border-gray-100">
            <td className="py-1"><input value={l.account_code} onChange={e => updateLine(i, 'account_code', e.target.value)} placeholder="5200" className="w-full px-2 py-1 border rounded text-sm font-mono" /></td>
            <td className="py-1"><input value={l.account_name} onChange={e => updateLine(i, 'account_name', e.target.value)} placeholder="Rent Expense" className="w-full px-2 py-1 border rounded text-sm" /></td>
            <td className="py-1 hidden md:table-cell"><input value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Line memo" className="w-full px-2 py-1 border rounded text-sm" /></td>
            <td className="py-1"><input type="number" min="0" step="0.01" value={l.debit || ''} onChange={e => updateLine(i, 'debit', Number(e.target.value) || 0)} placeholder="0.00" className="w-full px-2 py-1 border rounded text-sm text-right" /></td>
            <td className="py-1"><input type="number" min="0" step="0.01" value={l.credit || ''} onChange={e => updateLine(i, 'credit', Number(e.target.value) || 0)} placeholder="0.00" className="w-full px-2 py-1 border rounded text-sm text-right" /></td>
            <td className="py-1 text-center">{form.lines.length > 2 && <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>}</td>
          </tr>
        ))}</tbody>
      </table>
      <button onClick={addLine} className="text-xs text-indigo-600 font-medium hover:underline mb-4">+ Add line</button>

      <div className="flex justify-between items-end">
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
          <button onClick={() => canSubmit && onSubmit(form)} disabled={!canSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40">Create Entry</button>
        </div>
        <div className="text-sm text-right space-y-1">
          <div>Total Debits: <span className="font-medium">${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div>Total Credits: <span className="font-medium">${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className={`font-bold text-base ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
            {isBalanced ? 'Balanced' : `Out of balance: $${Math.abs(totalDebits - totalCredits).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
      </div>
    </div>
  );
}
