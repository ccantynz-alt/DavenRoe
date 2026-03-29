import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

const STATUS_BADGE = {
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  completed: { variant: 'secondary', label: 'Completed' },
};

const TYPE_LABELS = { bill: 'Bill', invoice: 'Invoice', journal: 'Journal' };
const FREQ_LABELS = { weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually' };

const STAT_COLORS = {
  indigo: 'bg-indigo-50 text-indigo-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
};

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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Recurring Transactions</h2>
          <p className="text-gray-500 mt-1">Automate repeating bills, invoices, and journal entries</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Recurring'}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Active', value: summary.active, color: 'indigo' },
          { label: 'Monthly Value', value: `$${Math.round(summary.monthlyValue).toLocaleString()}`, color: 'green' },
          { label: 'Next Due Today', value: summary.dueToday, color: 'blue' },
          { label: 'Paused', value: summary.paused, color: 'amber' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={cn('border-0 shadow-none', STAT_COLORS[stat.color])}>
              <CardContent className="p-4">
                <p className="text-xs font-medium opacity-70">{stat.label}</p>
                <p className="text-xl font-bold mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create */}
      {showCreate && <CreateForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'active', 'paused', 'completed'].map(s => (
          <Button
            key={s}
            onClick={() => setFilterStatus(s)}
            variant={filterStatus === s ? 'default' : 'secondary'}
            size="sm"
          >
            {s ? s.replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Frequency</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden md:table-cell">Next Date</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(i => {
              const badge = STATUS_BADGE[i.status] || { variant: 'secondary', label: i.status };
              return (
                <TableRow key={i.id}>
                  <TableCell>
                    <p className="font-medium text-gray-900">{i.name}</p>
                    <p className="text-xs text-gray-500">{i.supplier}</p>
                  </TableCell>
                  <TableCell className="text-gray-600">{TYPE_LABELS[i.type] || i.type}</TableCell>
                  <TableCell className="text-gray-500 hidden md:table-cell">{FREQ_LABELS[i.frequency] || i.frequency}</TableCell>
                  <TableCell className="text-right font-medium text-gray-900">${Number(i.amount).toLocaleString()}</TableCell>
                  <TableCell className="text-gray-500 hidden md:table-cell">{i.next_date}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {i.status === 'active' && <Button variant="ghost" size="sm" onClick={() => handlePause(i)} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">Pause</Button>}
                      {i.status === 'paused' && <Button variant="ghost" size="sm" onClick={() => handleResume(i)} className="text-green-600 hover:text-green-700 hover:bg-green-50">Resume</Button>}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(i)} className="text-red-600 hover:text-red-700 hover:bg-red-50">Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
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
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-4">New Recurring Transaction</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Name *</label><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Office Rent" /></div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
            <Select value={form.type} onValueChange={v => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bill">Bill</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="journal">Journal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Frequency</label>
            <Select value={form.frequency} onValueChange={v => set('frequency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="fortnightly">Fortnightly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Amount *</label><Input type="number" value={form.amount} onChange={e => set('amount', Number(e.target.value))} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Account Code</label><Input value={form.account_code} onChange={e => set('account_code', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Supplier / Client</label><Input value={form.supplier} onChange={e => set('supplier', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Start Date</label><Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">End Date</label><Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.name || !form.amount}>Create Recurring</Button>
        </div>
      </CardContent>
    </Card>
  );
}
