import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

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

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Suppliers</h2>
          <p className="text-gray-500 mt-1">Manage vendors, payment terms, and supplier relationships</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          {showCreate ? 'Cancel' : '+ New Supplier'}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Suppliers" value={summary.total_suppliers} />
          <StatCard label="Active" value={summary.active} color="green" />
          <StatCard label="Inactive" value={summary.inactive} color="gray" />
          <StatCard label="Outstanding" value={`$${Number(summary.total_outstanding).toLocaleString()}`} color="amber" />
          <StatCard label="Paid YTD" value={`$${Number(summary.total_paid_ytd).toLocaleString()}`} color="blue" />
        </div>
      )}

      {/* Create Form */}
      {showCreate && <CreateSupplierForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Supplier Detail Modal */}
      {selected && <SupplierDetail supplier={selected} onClose={() => setSelected(null)} />}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Supplier</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Contact</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Terms</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Outstanding</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Total Paid</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} onClick={() => setSelected(s)} className="border-b hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{s.contact_name || '—'}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{CATEGORIES.find(c => c.value === s.category)?.label || s.category}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">Net {s.payment_terms}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {s.outstanding > 0 ? <span className="text-amber-600">${Number(s.outstanding).toLocaleString()}</span> : <span className="text-gray-400">$0</span>}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 hidden md:table-cell">${Number(s.total_paid).toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No suppliers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'indigo' }) {
  const colors = { indigo: 'bg-indigo-50 text-indigo-700', green: 'bg-green-50 text-green-700', gray: 'bg-gray-50 text-gray-600', amber: 'bg-amber-50 text-amber-700', blue: 'bg-blue-50 text-blue-700' };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function CreateSupplierForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', contact_name: '', tax_id: '', payment_terms: 30, currency: 'AUD', category: 'other', address: '', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="bg-white rounded-xl border p-6 mb-8">
      <h3 className="font-bold text-lg mb-4">New Supplier</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Business Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Contact Name</label><input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Tax ID / ABN / EIN</label><input value={form.tax_id} onChange={e => set('tax_id', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Payment Terms</label>
          <select value={form.payment_terms} onChange={e => set('payment_terms', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
            {PAYMENT_TERMS.map(t => <option key={t} value={t}>Net {t}</option>)}
          </select>
        </div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
            {['AUD', 'NZD', 'GBP', 'USD', 'EUR'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="md:col-span-3"><label className="text-xs font-medium text-gray-600 block mb-1">Address</label><input value={form.address} onChange={e => set('address', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div className="md:col-span-3"><label className="text-xs font-medium text-gray-600 block mb-1">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button onClick={onCancel} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={() => form.name && onSubmit(form)} disabled={!form.name} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40">Create Supplier</button>
      </div>
    </div>
  );
}

function SupplierDetail({ supplier: s, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{s.name}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[s.status]}`}>{s.status}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
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
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between"><span className="text-gray-500">{label}</span><span className="text-gray-900 font-medium">{value}</span></div>;
}
