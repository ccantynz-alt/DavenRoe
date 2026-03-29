import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700 border-transparent',
  posted: 'bg-green-100 text-green-700 border-transparent',
  reversed: 'bg-amber-100 text-amber-700 border-transparent',
  voided: 'bg-red-100 text-red-700 border-transparent',
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

function fmtAmount(val) {
  return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Journal Entries</h2>
          <p className="text-gray-500 mt-1">Create, review, and post manual journal entries</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Entry'}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Entries" value={summary.total} />
        <StatCard label="Posted" value={summary.posted} color="green" />
        <StatCard label="Draft" value={summary.draft} color="amber" />
        <StatCard label="Total Debits" value={fmtAmount(summary.totalDebits)} color="blue" />
      </div>

      {/* Create */}
      {showCreate && <CreateEntryForm entries={entries} onSubmit={(data) => { setEntries(prev => [{ id: String(Date.now()), ...data }, ...prev]); setShowCreate(false); toast.success('Journal entry created'); }} onCancel={() => setShowCreate(false)} />}

      {/* Filters */}
      <div className="flex gap-1 mb-6 flex-wrap bg-gray-100 rounded-lg p-1 w-fit">
        {['', 'draft', 'posted', 'reversed'].map(s => (
          <Button
            key={s}
            variant="ghost"
            size="sm"
            onClick={() => setFilterStatus(s)}
            className={cn(
              'rounded-md',
              filterStatus === s && 'bg-white text-gray-900 shadow-sm hover:bg-white'
            )}
          >
            {s ? s.replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
          </Button>
        ))}
      </div>

      {/* Detail */}
      {selected && <EntryDetail entry={selected} onClose={() => setSelected(null)} onPost={handlePost} onReverse={handleReverse} />}

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Entry #</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit Total</TableHead>
              <TableHead className="text-right">Credit Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(e => (
              <TableRow key={e.id} onClick={() => setSelected(e)} className="cursor-pointer">
                <TableCell className="font-medium text-indigo-600">{e.entry_number}</TableCell>
                <TableCell className="text-gray-500 hidden md:table-cell">{e.date}</TableCell>
                <TableCell className="text-gray-900">{e.description}</TableCell>
                <TableCell className="text-right font-medium text-gray-900">{fmtAmount(totalDebits(e))}</TableCell>
                <TableCell className="text-right font-medium text-gray-900">{fmtAmount(totalCredits(e))}</TableCell>
                <TableCell className="text-center"><Badge className={STATUS_COLORS[e.status]}>{e.status}</Badge></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-12">No journal entries found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
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

function EntryDetail({ entry: e, onClose, onPost, onReverse }) {
  const totalDebitVal = e.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCreditVal = e.lines.reduce((s, l) => s + (l.credit || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto"
        onClick={ev => ev.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold">{e.entry_number}</h3>
            <p className="text-gray-500">{e.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[e.status]}>{e.status}</Badge>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-gray-600">x</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
          <div><p className="text-gray-500 text-xs">Date</p><p className="font-medium">{e.date}</p></div>
          <div><p className="text-gray-500 text-xs">Status</p><p className="font-medium capitalize">{e.status}</p></div>
          <div><p className="text-gray-500 text-xs">Lines</p><p className="font-medium">{e.lines.length}</p></div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {e.lines.map((l, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-gray-700">{l.account_code}</TableCell>
                <TableCell>{l.account_name}</TableCell>
                <TableCell className="text-gray-500 hidden md:table-cell">{l.description}</TableCell>
                <TableCell className="text-right font-medium">{l.debit > 0 ? fmtAmount(l.debit) : ''}</TableCell>
                <TableCell className="text-right font-medium">{l.credit > 0 ? fmtAmount(l.credit) : ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-end mt-4">
          <div className="text-sm space-y-1 w-48">
            <div className="flex justify-between"><span className="text-gray-500">Total Debits</span><span className="font-medium">{fmtAmount(totalDebitVal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Credits</span><span className="font-medium">{fmtAmount(totalCreditVal)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1">
              <span>Difference</span>
              <span className={totalDebitVal === totalCreditVal ? 'text-green-600' : 'text-red-600'}>{fmtAmount(Math.abs(totalDebitVal - totalCreditVal))}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          {e.status === 'draft' && <Button variant="success" onClick={() => onPost(e)}>Post Entry</Button>}
          {e.status === 'posted' && <Button variant="default" className="bg-amber-600 hover:bg-amber-700" onClick={() => onReverse(e)}>Reverse Entry</Button>}
        </div>
      </motion.div>
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

  const totalDebitVal = form.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCreditVal = form.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const isBalanced = totalDebitVal > 0 && totalDebitVal === totalCreditVal;
  const hasDescription = form.description.trim().length > 0;
  const hasAccounts = form.lines.every(l => l.account_code.trim().length > 0);
  const canSubmit = isBalanced && hasDescription && hasAccounts;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4">New Journal Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Entry Number</label>
              <Input value={form.entry_number} onChange={e => set('entry_number', e.target.value)} className="bg-gray-50" readOnly />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Date *</label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Description *</label>
              <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Month-end accrual" />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right w-28">Debit</TableHead>
                <TableHead className="text-right w-28">Credit</TableHead>
                <TableHead className="text-center w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.lines.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="p-1"><Input value={l.account_code} onChange={e => updateLine(i, 'account_code', e.target.value)} placeholder="5200" className="h-8 font-mono" /></TableCell>
                  <TableCell className="p-1"><Input value={l.account_name} onChange={e => updateLine(i, 'account_name', e.target.value)} placeholder="Rent Expense" className="h-8" /></TableCell>
                  <TableCell className="p-1 hidden md:table-cell"><Input value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Line memo" className="h-8" /></TableCell>
                  <TableCell className="p-1"><Input type="number" min="0" step="0.01" value={l.debit || ''} onChange={e => updateLine(i, 'debit', Number(e.target.value) || 0)} placeholder="0.00" className="h-8 text-right" /></TableCell>
                  <TableCell className="p-1"><Input type="number" min="0" step="0.01" value={l.credit || ''} onChange={e => updateLine(i, 'credit', Number(e.target.value) || 0)} placeholder="0.00" className="h-8 text-right" /></TableCell>
                  <TableCell className="p-1 text-center">{form.lines.length > 2 && <Button variant="ghost" size="icon" onClick={() => removeLine(i)} className="h-7 w-7 text-red-400 hover:text-red-600">&times;</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="link" size="sm" onClick={addLine} className="mb-4 mt-2">+ Add line</Button>

          <div className="flex justify-between items-end">
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button onClick={() => canSubmit && onSubmit(form)} disabled={!canSubmit}>Create Entry</Button>
            </div>
            <div className="text-sm text-right space-y-1">
              <div>Total Debits: <span className="font-medium">{fmtAmount(totalDebitVal)}</span></div>
              <div>Total Credits: <span className="font-medium">{fmtAmount(totalCreditVal)}</span></div>
              <div className={cn('font-bold text-base', isBalanced ? 'text-green-600' : 'text-red-600')}>
                {isBalanced ? 'Balanced' : `Out of balance: ${fmtAmount(Math.abs(totalDebitVal - totalCreditVal))}`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
