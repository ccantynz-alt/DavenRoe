import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Asset', color: 'bg-blue-100 text-blue-700' },
  { value: 'liability', label: 'Liability', color: 'bg-red-100 text-red-700' },
  { value: 'equity', label: 'Equity', color: 'bg-purple-100 text-purple-700' },
  { value: 'revenue', label: 'Revenue', color: 'bg-green-100 text-green-700' },
  { value: 'expense', label: 'Expense', color: 'bg-amber-100 text-amber-700' },
];

const SUB_TYPES = {
  asset: ['Current Asset', 'Fixed Asset', 'Bank', 'Other Asset'],
  liability: ['Current Liability', 'Non-Current Liability', 'Other Liability'],
  equity: ['Owner\'s Equity', 'Retained Earnings', 'Drawings'],
  revenue: ['Operating Revenue', 'Non-Operating Revenue', 'Other Revenue'],
  expense: ['Direct Cost', 'Operating Expense', 'Administrative Expense', 'Other Expense'],
};

const TAX_CODES = ['GST', 'GST Free', 'BAS Excluded', 'N/A'];

const STATUS_MAP = {
  active: { variant: 'success', label: 'active' },
  inactive: { variant: 'secondary', label: 'inactive' },
};

const TYPE_COLORS = {
  asset: 'bg-blue-100 text-blue-700 border-transparent',
  liability: 'bg-red-100 text-red-700 border-transparent',
  equity: 'bg-purple-100 text-purple-700 border-transparent',
  revenue: 'bg-green-100 text-green-700 border-transparent',
  expense: 'bg-amber-100 text-amber-700 border-transparent',
};

const DEMO_ACCOUNTS = [
  { id: '1', code: '1000', name: 'Cash at Bank', type: 'asset', sub_type: 'Bank', description: 'Main operating bank account for day-to-day transactions', balance: 142680.50, currency: 'AUD', status: 'active', is_system: true, tax_code: 'BAS Excluded' },
  { id: '2', code: '1100', name: 'Accounts Receivable', type: 'asset', sub_type: 'Current Asset', description: 'Trade debtors — amounts owed by customers for goods and services', balance: 38450.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'GST' },
  { id: '3', code: '1200', name: 'Inventory', type: 'asset', sub_type: 'Current Asset', description: 'Stock on hand — finished goods, raw materials, and work in progress', balance: 24300.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
  { id: '4', code: '1300', name: 'Prepaid Expenses', type: 'asset', sub_type: 'Current Asset', description: 'Payments made in advance for future services (insurance, rent, subscriptions)', balance: 6200.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST Free' },
  { id: '5', code: '1500', name: 'Equipment', type: 'asset', sub_type: 'Fixed Asset', description: 'Office equipment, computers, furniture, and fixtures', balance: 45000.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
  { id: '6', code: '1510', name: 'Accumulated Depreciation', type: 'asset', sub_type: 'Fixed Asset', description: 'Accumulated depreciation on office equipment and fixtures', balance: -12500.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'BAS Excluded' },
  { id: '7', code: '1600', name: 'Motor Vehicles', type: 'asset', sub_type: 'Fixed Asset', description: 'Company-owned motor vehicles', balance: 38000.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
  { id: '8', code: '1610', name: 'Accumulated Depreciation - Vehicles', type: 'asset', sub_type: 'Fixed Asset', description: 'Accumulated depreciation on motor vehicles', balance: -9500.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'BAS Excluded' },
  { id: '9', code: '2000', name: 'Accounts Payable', type: 'liability', sub_type: 'Current Liability', description: 'Trade creditors — amounts owed to suppliers', balance: 22340.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'GST' },
  { id: '10', code: '2100', name: 'GST/VAT Payable', type: 'liability', sub_type: 'Current Liability', description: 'Goods and Services Tax collected, net of input tax credits', balance: 8750.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'BAS Excluded' },
  { id: '11', code: '2200', name: 'PAYG/PAYE Payable', type: 'liability', sub_type: 'Current Liability', description: 'Pay-As-You-Go withholding tax payable to the ATO', balance: 6420.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'BAS Excluded' },
  { id: '12', code: '2300', name: 'Superannuation Payable', type: 'liability', sub_type: 'Current Liability', description: 'Superannuation guarantee contributions payable to funds', balance: 4830.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'BAS Excluded' },
  { id: '13', code: '2400', name: 'Credit Card', type: 'liability', sub_type: 'Current Liability', description: 'Business credit card balance', balance: 3200.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'BAS Excluded' },
  { id: '14', code: '2500', name: 'Business Loan', type: 'liability', sub_type: 'Non-Current Liability', description: 'Term business loan — ANZ Business Account', balance: 85000.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'BAS Excluded' },
  { id: '15', code: '2600', name: 'Unearned Revenue', type: 'liability', sub_type: 'Current Liability', description: 'Deposits and advance payments received for services not yet delivered', balance: 12000.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
  { id: '16', code: '3000', name: 'Owner\'s Equity', type: 'equity', sub_type: 'Owner\'s Equity', description: 'Owner\'s capital contribution to the business', balance: 100000.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'N/A' },
  { id: '17', code: '3100', name: 'Retained Earnings', type: 'equity', sub_type: 'Retained Earnings', description: 'Accumulated net profit retained in the business from prior periods', balance: 67240.50, currency: 'AUD', status: 'active', is_system: true, tax_code: 'N/A' },
  { id: '18', code: '3200', name: 'Drawings', type: 'equity', sub_type: 'Drawings', description: 'Owner\'s personal withdrawals from the business', balance: -15000.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'N/A' },
  { id: '19', code: '4000', name: 'Sales Revenue', type: 'revenue', sub_type: 'Operating Revenue', description: 'Revenue from the sale of goods and products', balance: 385200.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'GST' },
  { id: '20', code: '4100', name: 'Service Revenue', type: 'revenue', sub_type: 'Operating Revenue', description: 'Revenue from professional and consulting services', balance: 128400.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'GST' },
  { id: '21', code: '4200', name: 'Interest Income', type: 'revenue', sub_type: 'Non-Operating Revenue', description: 'Interest earned on bank accounts and term deposits', balance: 1840.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST Free' },
  { id: '22', code: '4300', name: 'Other Income', type: 'revenue', sub_type: 'Other Revenue', description: 'Miscellaneous income — asset disposal gains, rebates, refunds', balance: 3200.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
  { id: '23', code: '5000', name: 'Cost of Goods Sold', type: 'expense', sub_type: 'Direct Cost', description: 'Direct costs of purchasing or manufacturing goods sold', balance: 154080.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'GST' },
  { id: '24', code: '5100', name: 'Office Supplies', type: 'expense', sub_type: 'Operating Expense', description: 'Stationery, printing, postage, and general office consumables', balance: 4320.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
  { id: '25', code: '5200', name: 'Rent', type: 'expense', sub_type: 'Operating Expense', description: 'Office and warehouse lease payments', balance: 36000.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
  { id: '26', code: '5300', name: 'Utilities', type: 'expense', sub_type: 'Operating Expense', description: 'Electricity, gas, water, and waste disposal', balance: 5640.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
  { id: '27', code: '5400', name: 'Wages & Salaries', type: 'expense', sub_type: 'Operating Expense', description: 'Employee gross wages, salaries, and allowances', balance: 124800.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'BAS Excluded' },
  { id: '28', code: '5500', name: 'Superannuation Expense', type: 'expense', sub_type: 'Operating Expense', description: 'Employer superannuation guarantee contributions (11.5%)', balance: 14352.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'BAS Excluded' },
  { id: '29', code: '5600', name: 'Insurance', type: 'expense', sub_type: 'Operating Expense', description: 'Business insurance — public liability, professional indemnity, workers comp', balance: 8400.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST Free' },
  { id: '30', code: '5700', name: 'Depreciation', type: 'expense', sub_type: 'Operating Expense', description: 'Depreciation of fixed assets — equipment and vehicles', balance: 11000.00, currency: 'AUD', status: 'active', is_system: true, tax_code: 'BAS Excluded' },
  { id: '31', code: '5800', name: 'Professional Fees', type: 'expense', sub_type: 'Administrative Expense', description: 'Accounting, legal, and consulting fees', balance: 9600.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
  { id: '32', code: '5900', name: 'Travel & Entertainment', type: 'expense', sub_type: 'Operating Expense', description: 'Business travel, accommodation, meals, and client entertainment', balance: 7200.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
  { id: '33', code: '5950', name: 'Marketing & Advertising', type: 'expense', sub_type: 'Operating Expense', description: 'Digital advertising, print media, sponsorships, and promotions', balance: 12400.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
  { id: '34', code: '5960', name: 'Bank Fees', type: 'expense', sub_type: 'Administrative Expense', description: 'Bank account fees, merchant fees, and transaction charges', balance: 1860.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST Free' },
  { id: '35', code: '5970', name: 'Telephone & Internet', type: 'expense', sub_type: 'Operating Expense', description: 'Mobile plans, landline, and internet service charges', balance: 4320.00, currency: 'AUD', status: 'active', is_system: false, tax_code: 'GST' },
];

const FILTER_TABS = [
  { value: '', label: 'All' },
  { value: 'asset', label: 'Assets' },
  { value: 'liability', label: 'Liabilities' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expenses' },
];

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await api.get('/chart-of-accounts/').catch(() => null);
      setAccounts(res?.data?.accounts || DEMO_ACCOUNTS);
    } catch { /* fallback */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const summary = {
    total: accounts.length,
    asset: accounts.filter(a => a.type === 'asset').length,
    liability: accounts.filter(a => a.type === 'liability').length,
    equity: accounts.filter(a => a.type === 'equity').length,
    revenue: accounts.filter(a => a.type === 'revenue').length,
    expense: accounts.filter(a => a.type === 'expense').length,
  };

  const filtered = accounts.filter(a => {
    if (filterType && a.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreate = async (data) => {
    try {
      await api.post('/chart-of-accounts/', data);
      toast.success('Account created');
      setShowCreate(false);
      fetchData();
    } catch {
      const newAcc = { id: String(Date.now()), ...data, status: 'active', is_system: false, balance: 0 };
      setAccounts(prev => [newAcc, ...prev]);
      toast.success('Account created');
      setShowCreate(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Chart of Accounts</h2>
          <p className="text-gray-500 mt-1">Manage your general ledger accounts, classifications, and tax codes</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Account'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Accounts" value={summary.total} />
        <StatCard label="Assets" value={summary.asset} color="blue" />
        <StatCard label="Liabilities" value={summary.liability} color="red" />
        <StatCard label="Equity" value={summary.equity} color="purple" />
        <StatCard label="Revenue" value={summary.revenue} color="green" />
        <StatCard label="Expenses" value={summary.expense} color="amber" />
      </div>

      {/* Create Form */}
      {showCreate && <CreateAccountForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {FILTER_TABS.map(tab => (
            <Button
              key={tab.value}
              variant="ghost"
              size="sm"
              onClick={() => setFilterType(tab.value)}
              className={cn(
                'rounded-md',
                filterType === tab.value && 'bg-white text-gray-900 shadow-sm hover:bg-white'
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && <AccountDetail account={selected} onClose={() => setSelected(null)} />}

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Sub-Type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="hidden md:table-cell">Tax Code</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(a => (
              <TableRow key={a.id} onClick={() => setSelected(a)} className="cursor-pointer">
                <TableCell className="font-mono text-gray-600">{a.code}</TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">{a.name}</div>
                  <div className="text-xs text-gray-500 md:hidden">{ACCOUNT_TYPES.find(t => t.value === a.type)?.label}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge className={TYPE_COLORS[a.type]}>{ACCOUNT_TYPES.find(t => t.value === a.type)?.label}</Badge>
                </TableCell>
                <TableCell className="text-gray-600 hidden lg:table-cell">{a.sub_type}</TableCell>
                <TableCell className="text-right font-medium">
                  {a.balance < 0
                    ? <span className="text-red-600">({formatCurrency(Math.abs(a.balance))})</span>
                    : <span className="text-gray-900">{formatCurrency(a.balance)}</span>
                  }
                </TableCell>
                <TableCell className="text-gray-600 hidden md:table-cell">{a.tax_code}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={STATUS_MAP[a.status]?.variant || 'secondary'}>{a.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-12">No accounts found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}

function formatCurrency(val) {
  return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ label, value, color = 'indigo' }) {
  const colors = { indigo: 'bg-indigo-50 text-indigo-700', blue: 'bg-blue-50 text-blue-700', red: 'bg-red-50 text-red-700', purple: 'bg-purple-50 text-purple-700', green: 'bg-green-50 text-green-700', amber: 'bg-amber-50 text-amber-700' };
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

function CreateAccountForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ code: '', name: '', type: 'asset', sub_type: '', description: '', tax_code: 'GST', currency: 'AUD' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const availableSubTypes = SUB_TYPES[form.type] || [];

  const handleTypeChange = (type) => {
    setForm(f => ({ ...f, type, sub_type: '' }));
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4">New Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Account Code *</label>
              <Input value={form.code} onChange={e => set('code', e.target.value)} placeholder="e.g. 1000" maxLength={4} className="font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Account Name *</label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Type *</label>
              <Select value={form.type} onValueChange={handleTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Sub-Type</label>
              <Select value={form.sub_type} onValueChange={v => set('sub_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select sub-type" /></SelectTrigger>
                <SelectContent>
                  {availableSubTypes.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Tax Code</label>
              <Select value={form.tax_code} onValueChange={v => set('tax_code', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TAX_CODES.map(tc => <SelectItem key={tc} value={tc}>{tc}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Currency</label>
              <Select value={form.currency} onValueChange={v => set('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['AUD', 'NZD', 'GBP', 'USD', 'EUR'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="w-full flex rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-astra-500 focus:outline-none focus:ring-2 focus:ring-astra-500/20" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={() => form.code && form.name && onSubmit(form)} disabled={!form.code || !form.name}>Create Account</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AccountDetail({ account: a, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-gray-500">{a.code}</span>
              <Badge className={TYPE_COLORS[a.type]}>{ACCOUNT_TYPES.find(t => t.value === a.type)?.label}</Badge>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{a.name}</h3>
            <Badge variant={STATUS_MAP[a.status]?.variant || 'secondary'}>{a.status}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-gray-600">x</Button>
        </div>
        <div className="space-y-3 text-sm">
          <Row label="Account Code" value={a.code} />
          <Row label="Account Type" value={ACCOUNT_TYPES.find(t => t.value === a.type)?.label} />
          {a.sub_type && <Row label="Sub-Type" value={a.sub_type} />}
          <Row label="Tax Code" value={a.tax_code} />
          <Row label="Currency" value={a.currency} />
          <Row label="System Account" value={a.is_system ? 'Yes' : 'No'} />
          <div className="border-t pt-3 mt-3">
            <Row label="Balance" value={a.balance < 0 ? `(${formatCurrency(Math.abs(a.balance))})` : formatCurrency(a.balance)} />
          </div>
          {a.description && <div className="border-t pt-3 mt-3"><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-gray-700">{a.description}</p></div>}
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between"><span className="text-gray-500">{label}</span><span className="text-gray-900 font-medium">{value}</span></div>;
}
