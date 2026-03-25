import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-400',
};

const TYPE_LABELS = { bill: 'Bill', invoice: 'Invoice', journal: 'Journal' };
const FREQ_LABELS = { weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually' };

const DEMO_RECURRING = [
  { id: '1', name: 'Office Rent', type: 'bill', frequency: 'monthly', amount: 4500, account_code: '4100', supplier: 'CBD Commercial Leasing', start_date: '2025-01-01', end_date: '2027-12-31', next_date: '2026-04-01', status: 'active' },
  { id: '2', name: 'Xero Subscription', type: 'bill', frequency: 'monthly', amount: 79, account_code: '5200', supplier: 'Xero Ltd', start_date: '2025-06-01', end_date: '', next_date: '2026-04-01', status: 'active' },
  { id: '3', name: 'Business Insurance', type: 'bill', frequency: 'quarterly', amount: 500, account_code: '5600', supplier: 'Allianz Insurance', start_date: '2025-01-01', end_date: '2026-12-31', next_date: '2026-04-01', status: 'active' },
  { id: '4', name: 'Internet', type: 'bill', frequency: 'monthly', amount: 120, account_code: '5210', supplier: 'Telstra', start_date: '2025-03-01', end_date: '', next_date: '2026-04-01', status: 'active' },
  { id: '5', name: 'Cleaning Service', type: 'bill', frequency: 'fortnightly', amount: 350, account_code: '5700', supplier: 'Sparkle Clean Co', start_date: '2025-06-01', end_date: '', next_date: '2026-03-28', status: 'paused' },
  { id: '6', name: 'Loan Repayment', type: 'journal', frequency: 'monthly', amount: 2800, account_code: '2300', supplier: 'ANZ Bank', start_date: '2024-01-01', end_date: '2029-01-01', next_date: '2026-04-01', status: 'active' },
  { id: '7', name: 'Phone Plan', type: 'bill', frequency: 'monthly', amount: 89, account_code: '5220', supplier: 'Optus Business', start_date: '2025-09-01', end_date: '', next_date: '2026-04-01', status: 'active' },
];

export default function RecurringTransactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/recurring-transactions/').catch(() => null);
        setItems(res?.data?.items || DEMO_RECURRING);
      } catch { /* fallback */ } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filtered = items.filter(i => !filterStatus || i.status === filterStatus);

  const today = new Date().toISOString().split('T')[0];
  const summary = {
    active: items.filter(i => i.status === 'active').length,
    monthlyValue: items.filter(i => i.status === 'active').reduce((s, i) => {
      const multipliers = { weekly: 4.33, fortnightly: 2.17, monthly: 1, quarterly: 1 / 3, annually: 1 / 12 };
      return s + i.amount * (multipliers[i.frequency] || 1);
    }, 0),
    dueToday: items.filter(i => i.next_date === today && i.status === 'active').length,
    paused: items.filter(i => i.status === 'paused').length,
  };

  const handlePause = (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'paused' } : i));
    toast.success(`${item.name} paused`);
  };
  const handleResume = (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'active' } : i));
    toast.success(`${item.name} resumed`);
  };
  const handleDelete = (item) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
    toast.success(`${item.name} deleted`);
  };

  const handleCreate = (data) => {
    setItems(prev => [{ id: String(Date.now()), ...data, status: 'active' }, ...prev]);
    setShowCreate(false);
    toast.success('Recurring transaction created');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Recurring Transactions</h2>
          <p className="text-gray-500 mt-1">Automate repeating bills, invoices, and journal entries</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          {showCreate ? 'Cancel' : '+ New Recurring'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="Total Active" value={summary.active} />
        <Card label="Monthly Value" value={`$${Math.round(summary.monthlyValue).toLocaleString()}`} color="green" />
        <Card label="Next Due Today" value={summary.dueToday} color="blue" />
        <Card label="Paused" value={summary.paused} color="amber" />
      </div>

      {/* Create */}
      {showCreate && <CreateForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'active', 'paused', 'completed'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s ? s.replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Frequency</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Amount</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Next Date</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{i.name}</p>
                  <p className="text-xs text-gray-500">{i.supplier}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[i.type] || i.type}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{FREQ_LABELS[i.frequency] || i.frequency}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">${Number(i.amount).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{i.next_date}</td>
                <td className="px-4 py-3 text-center"><span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[i.status]}`}>{i.status}</span></td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {i.status === 'active' && <button onClick={() => handlePause(i)} className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded">Pause</button>}
                    {i.status === 'paused' && <button onClick={() => handleResume(i)} className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded">Resume</button>}
                    <button onClick={() => handleDelete(i)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">Delete</button>
                  </div>
                </td>
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

function CreateForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', type: 'bill', frequency: 'monthly', amount: 0, account_code: '', supplier: '', start_date: new Date().toISOString().split('T')[0], end_date: '', next_date: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name || !form.amount) return;
    const next = form.start_date || new Date().toISOString().split('T')[0];
    onSubmit({ ...form, next_date: form.next_date || next });
  };

  return (
    <div className="bg-white rounded-xl border p-6 mb-8">
      <h3 className="font-bold text-lg mb-4">New Recurring Transaction</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Office Rent" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="bill">Bill</option><option value="invoice">Invoice</option><option value="journal">Journal</option>
          </select>
        </div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Frequency</label>
          <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="weekly">Weekly</option><option value="fortnightly">Fortnightly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annually">Annually</option>
          </select>
        </div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Amount *</label><input type="number" value={form.amount} onChange={e => set('amount', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Account Code</label><input value={form.account_code} onChange={e => set('account_code', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Supplier / Client</label><input value={form.supplier} onChange={e => set('supplier', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Start Date</label><input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">End Date</label><input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
        <button onClick={handleSubmit} disabled={!form.name || !form.amount} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40">Create Recurring</button>
      </div>
    </div>
  );
}
