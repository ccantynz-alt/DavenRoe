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

const CATEGORIES = [
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'software', label: 'Software & SaaS' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'shipping', label: 'Shipping & Freight' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'rent', label: 'Rent & Property' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_TERMS = [7, 14, 20, 30, 45, 60, 90];

const STATUS_BADGE = {
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'secondary', label: 'Inactive' },
};

const STAT_COLORS = {
  indigo: 'bg-indigo-50 text-indigo-700',
  green: 'bg-green-50 text-green-700',
  gray: 'bg-gray-50 text-gray-600',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
};

const DEMO_SUPPLIERS = [
  { id: '1', name: 'Office Supplies Co', email: 'accounts@officesupplies.co', phone: '+61 2 9000 1111', contact_name: 'Sarah Chen', tax_id: '51 824 753 556', payment_terms: 30, currency: 'AUD', category: 'office_supplies', status: 'active', address: '42 George St, Sydney NSW 2000', notes: 'Preferred supplier — 10% volume discount', total_paid: 24500, outstanding: 1200 },
  { id: '2', name: 'CloudHost Pro', email: 'billing@cloudhost.pro', phone: '+1 415 555 0199', contact_name: 'Mike Johnson', tax_id: '94-3456789', payment_terms: 14, currency: 'USD', category: 'software', status: 'active', address: '100 Market St, San Francisco CA 94105', notes: 'Annual hosting contract', total_paid: 8400, outstanding: 700 },
  { id: '3', name: 'Premium Print & Design', email: 'hello@premiumprint.co.nz', phone: '+64 9 303 4455', contact_name: 'James Walker', tax_id: '123-456-789', payment_terms: 20, currency: 'NZD', category: 'marketing', status: 'active', address: '15 Queen St, Auckland 1010', notes: '', total_paid: 5600, outstanding: 0 },
  { id: '4', name: 'TechParts Ltd', email: 'orders@techparts.co.uk', phone: '+44 20 7946 0958', contact_name: 'Emily Taylor', tax_id: 'GB 123 4567 89', payment_terms: 45, currency: 'GBP', category: 'equipment', status: 'active', address: '10 Downing Business Park, London SE1 7PB', notes: 'Net 45 — hardware components', total_paid: 32000, outstanding: 4500 },
  { id: '5', name: 'Legal Eagles LLP', email: 'invoices@legaleagles.com.au', phone: '+61 3 8000 2222', contact_name: 'David Kim', tax_id: '53 004 085 616', payment_terms: 14, currency: 'AUD', category: 'professional_services', status: 'active', address: '200 Collins St, Melbourne VIC 3000', notes: 'Corporate counsel — retainer agreement', total_paid: 18000, outstanding: 3000 },
  { id: '6', name: 'FastFreight Logistics', email: 'ap@fastfreight.com', phone: '+61 7 3000 5555', contact_name: 'Tom Nguyen', tax_id: '61 153 245 789', payment_terms: 7, currency: 'AUD', category: 'shipping', status: 'active', address: '88 Wharf Rd, Brisbane QLD 4000', notes: 'Weekly deliveries', total_paid: 11200, outstanding: 800 },
  { id: '7', name: 'Stale Vendor Inc', email: 'old@stalevendor.com', phone: '', contact_name: '', tax_id: '', payment_terms: 30, currency: 'USD', category: 'other', status: 'inactive', address: '', notes: 'No longer used', total_paid: 2000, outstanding: 0 },
];

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  const fetchData = async () => {
    try {
      const [supRes, sumRes] = await Promise.all([
        api.get('/suppliers/').catch(() => null),
        api.get('/suppliers/summary').catch(() => null),
      ]);
      setSuppliers(supRes?.data?.suppliers || DEMO_SUPPLIERS);
      setSummary(sumRes?.data || { total_suppliers: DEMO_SUPPLIERS.length, active: 6, inactive: 1, total_outstanding: 10200, total_paid_ytd: 101700 });
    } catch { /* fallback */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = suppliers.filter(s => {
    if (filterStatus && s.status !== filterStatus) return false;
    if (filterCat && s.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.contact_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreate = async (data) => {
    try {
      await api.post('/suppliers/', data);
      toast.success('Supplier created');
      setShowCreate(false);
      fetchData();
    } catch {
      const newSup = { id: String(Date.now()), ...data, status: 'active', total_paid: 0, outstanding: 0 };
      setSuppliers(prev => [newSup, ...prev]);
      toast.success('Supplier created');
      setShowCreate(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Suppliers</h2>
          <p className="text-gray-500 mt-1">Manage vendors, payment terms, and supplier relationships</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Supplier'}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Suppliers', value: summary.total_suppliers, color: 'indigo' },
            { label: 'Active', value: summary.active, color: 'green' },
            { label: 'Inactive', value: summary.inactive, color: 'gray' },
            { label: 'Outstanding', value: `$${Number(summary.total_outstanding).toLocaleString()}`, color: 'amber' },
            { label: 'Paid YTD', value: `$${Number(summary.total_paid_ytd).toLocaleString()}`, color: 'blue' },
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
      )}

      {/* Create Form */}
      {showCreate && <CreateSupplierForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          type="text"
          placeholder="Search suppliers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={filterCat} onValueChange={v => setFilterCat(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Supplier Detail Modal */}
      {selected && <SupplierDetail supplier={selected} onClose={() => setSelected(null)} />}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Supplier</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right hidden md:table-cell">Total Paid</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(s => {
              const badge = STATUS_BADGE[s.status] || { variant: 'secondary', label: s.status };
              return (
                <TableRow key={s.id} onClick={() => setSelected(s)} className="cursor-pointer">
                  <TableCell>
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.email}</div>
                  </TableCell>
                  <TableCell className="text-gray-600 hidden md:table-cell">{s.contact_name || '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="secondary">{CATEGORIES.find(c => c.value === s.category)?.label || s.category}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">Net {s.payment_terms}</TableCell>
                  <TableCell className="text-right font-medium">
                    {s.outstanding > 0 ? <span className="text-amber-600">${Number(s.outstanding).toLocaleString()}</span> : <span className="text-gray-400">$0</span>}
                  </TableCell>
                  <TableCell className="text-right text-gray-600 hidden md:table-cell">${Number(s.total_paid).toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-12">No suppliers found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}

function CreateSupplierForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', contact_name: '', tax_id: '', payment_terms: 30, currency: 'AUD', category: 'other', address: '', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-4">New Supplier</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Business Name *</label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Email</label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Phone</label><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Contact Name</label><Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Tax ID / ABN / EIN</label><Input value={form.tax_id} onChange={e => set('tax_id', e.target.value)} /></div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
            <Select value={form.category} onValueChange={v => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Payment Terms</label>
            <Select value={String(form.payment_terms)} onValueChange={v => set('payment_terms', Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS.map(t => <SelectItem key={t} value={String(t)}>Net {t}</SelectItem>)}
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
          <div className="md:col-span-3"><label className="text-xs font-medium text-gray-600 block mb-1">Address</label><Input value={form.address} onChange={e => set('address', e.target.value)} /></div>
          <div className="md:col-span-3"><label className="text-xs font-medium text-gray-600 block mb-1">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-astra-500 focus:outline-none focus:ring-2 focus:ring-astra-500/20" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => form.name && onSubmit(form)} disabled={!form.name}>Create Supplier</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierDetail({ supplier: s, onClose }) {
  const badge = STATUS_BADGE[s.status] || { variant: 'secondary', label: s.status };
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
            <h3 className="text-xl font-bold text-gray-900">{s.name}</h3>
            <Badge variant={badge.variant} className="mt-1">{badge.label}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-gray-600">
            <span className="text-xl leading-none">&times;</span>
          </Button>
        </div>
        <div className="space-y-3 text-sm">
          {s.contact_name && <Row label="Contact" value={s.contact_name} />}
          {s.email && <Row label="Email" value={s.email} />}
          {s.phone && <Row label="Phone" value={s.phone} />}
          {s.address && <Row label="Address" value={s.address} />}
          {s.tax_id && <Row label="Tax ID" value={s.tax_id} />}
          <Row label="Payment Terms" value={`Net ${s.payment_terms} days`} />
          <Row label="Currency" value={s.currency} />
          <Row label="Category" value={CATEGORIES.find(c => c.value === s.category)?.label || s.category} />
          <div className="border-t pt-3 mt-3">
            <Row label="Total Paid" value={`$${Number(s.total_paid).toLocaleString()}`} />
            <Row label="Outstanding" value={s.outstanding > 0 ? `$${Number(s.outstanding).toLocaleString()}` : '$0'} />
          </div>
          {s.notes && <div className="border-t pt-3 mt-3"><p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-gray-700">{s.notes}</p></div>}
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between"><span className="text-gray-500">{label}</span><span className="text-gray-900 font-medium">{value}</span></div>;
}
