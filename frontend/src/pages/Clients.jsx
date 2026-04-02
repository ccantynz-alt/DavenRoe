import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const ENTITY_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'sole_trader', label: 'Sole Trader' },
  { value: 'trust', label: 'Trust' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'individual', label: 'Individual' },
  { value: 'smsf', label: 'SMSF' },
  { value: 'not_for_profit', label: 'Not-for-Profit' },
];

const JURISDICTIONS = [
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
];

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  archived: 'bg-gray-100 text-gray-400',
  prospect: 'bg-blue-100 text-blue-700',
  overdue: 'bg-red-100 text-red-600',
};

const DEMO_CLIENTS = [
  { id: '1', name: 'Smith Construction', entity_type: 'company', jurisdiction: 'AU', status: 'active', contact_name: 'Dave Smith', contact_email: 'dave@smithconstruction.com.au', contact_phone: '+61 4 1234 5678', tax_id: '51 824 753 556', address: '12 Builder St, Parramatta NSW 2150', notes: 'Main client — weekly invoicing for transport', outstanding: 4800, total_billed: 87500, invoices_count: 24, last_invoice: '2026-03-28' },
  { id: '2', name: 'ABC Transport Co', entity_type: 'company', jurisdiction: 'AU', status: 'active', contact_name: 'Lisa Chen', contact_email: 'lisa@abctransport.com.au', contact_phone: '+61 4 9876 5432', tax_id: '61 153 245 789', address: '88 Industrial Rd, Botany NSW 2019', notes: 'Fortnightly billing, Net 14', outstanding: 2200, total_billed: 45000, invoices_count: 16, last_invoice: '2026-03-20' },
  { id: '3', name: 'Metro Earthworks', entity_type: 'company', jurisdiction: 'AU', status: 'active', contact_name: 'Tony Russo', contact_email: 'tony@metroearthworks.com.au', contact_phone: '+61 4 5555 0199', tax_id: '53 004 085 616', address: '5 Quarry Lane, Penrith NSW 2750', notes: 'Large jobs, progress billing monthly', outstanding: 12500, total_billed: 156000, invoices_count: 42, last_invoice: '2026-03-30' },
  { id: '4', name: 'Coastal Developments', entity_type: 'company', jurisdiction: 'AU', status: 'active', contact_name: 'Sam Mitchell', contact_email: 'sam@coastaldev.com.au', contact_phone: '+61 4 7777 8888', tax_id: '72 456 789 012', address: '200 Marine Pde, Gold Coast QLD 4217', notes: 'Retainer client — fixed monthly rate', outstanding: 0, total_billed: 36000, invoices_count: 12, last_invoice: '2026-03-01' },
  { id: '5', name: 'Jim Peterson', entity_type: 'sole_trader', jurisdiction: 'AU', status: 'active', contact_name: 'Jim Peterson', contact_email: 'jim.peterson@gmail.com', contact_phone: '+61 4 3333 2222', tax_id: '44 123 456 789', address: '15 High St, Richmond VIC 3121', notes: 'Small jobs, pays on time', outstanding: 650, total_billed: 8200, invoices_count: 8, last_invoice: '2026-03-15' },
  { id: '6', name: 'Hillside Property Trust', entity_type: 'trust', jurisdiction: 'AU', status: 'inactive', contact_name: 'Karen Wright', contact_email: 'karen@hillsideproperty.com.au', contact_phone: '+61 2 9000 1111', tax_id: '33 987 654 321', address: '1 Trust Ave, North Sydney NSW 2060', notes: 'Project completed — no active work', outstanding: 0, total_billed: 22000, invoices_count: 6, last_invoice: '2025-11-20' },
];

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterJurisdiction, setFilterJurisdiction] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: '', entity_type: 'company', jurisdiction: 'AU', contact_name: '',
    contact_email: '', contact_phone: '', tax_id: '', address: '', notes: '',
  });
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await api.get('/clients/', { params: { search, jurisdiction: filterJurisdiction, type: filterType } }).catch(() => null);
      if (res?.data?.entities?.length > 0) {
        setClients(res.data.entities);
      } else {
        setClients(DEMO_CLIENTS);
      }
    } catch {
      setClients(DEMO_CLIENTS);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Client name is required'); return; }
    try {
      await api.post('/clients/', form);
      toast.success(`${form.name} added`);
      setShowCreate(false);
      setForm({ name: '', entity_type: 'company', jurisdiction: 'AU', contact_name: '', contact_email: '', contact_phone: '', tax_id: '', address: '', notes: '' });
      fetchData();
    } catch (err) {
      // Fallback: add to local state
      const newClient = {
        ...form,
        id: crypto.randomUUID(),
        status: 'active',
        outstanding: 0,
        total_billed: 0,
        invoices_count: 0,
        last_invoice: null,
      };
      setClients(prev => [newClient, ...prev]);
      toast.success(`${form.name} added`);
      setShowCreate(false);
      setForm({ name: '', entity_type: 'company', jurisdiction: 'AU', contact_name: '', contact_email: '', contact_phone: '', tax_id: '', address: '', notes: '' });
    }
  };

  // Filtering
  const filtered = clients.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !(c.contact_email || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterJurisdiction && c.jurisdiction !== filterJurisdiction) return false;
    if (filterType && c.entity_type !== filterType) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  // Summary stats
  const active = clients.filter(c => c.status === 'active').length;
  const totalOutstanding = clients.reduce((sum, c) => sum + (c.outstanding || 0), 0);
  const totalBilled = clients.reduce((sum, c) => sum + (c.total_billed || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Clients</h2>
          <p className="text-gray-500 mt-1">Manage your customers and track what they owe</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
          + Add Client
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Clients" value={clients.length} />
        <SummaryCard label="Active" value={active} color="green" />
        <SummaryCard label="Outstanding" value={`$${totalOutstanding.toLocaleString()}`} color={totalOutstanding > 0 ? 'amber' : 'green'} />
        <SummaryCard label="Total Billed" value={`$${totalBilled.toLocaleString()}`} color="indigo" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input type="text" placeholder="Search by name or email..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-xl px-4 py-2.5 text-sm flex-1 min-w-[200px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        <select value={filterJurisdiction} onChange={(e) => setFilterJurisdiction(e.target.value)}
          className="border rounded-xl px-3 py-2.5 text-sm bg-white">
          <option value="">All Countries</option>
          {JURISDICTIONS.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-xl px-3 py-2.5 text-sm bg-white">
          <option value="">All Types</option>
          {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-xl px-3 py-2.5 text-sm bg-white">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* New Client Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">New Client</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Business / Client Name *</label>
              <input placeholder="e.g. Smith Construction" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contact Name</label>
              <input placeholder="e.g. Dave Smith" value={form.contact_name}
                onChange={e => setForm({ ...form, contact_name: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input type="email" placeholder="dave@smithconstruction.com.au" value={form.contact_email}
                onChange={e => setForm({ ...form, contact_email: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              <input placeholder="+61 4 1234 5678" value={form.contact_phone}
                onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Business Type</label>
              <select value={form.entity_type} onChange={e => setForm({ ...form, entity_type: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white">
                {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
              <select value={form.jurisdiction} onChange={e => setForm({ ...form, jurisdiction: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white">
                {JURISDICTIONS.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ABN / Tax ID</label>
              <input placeholder="51 824 753 556" value={form.tax_id}
                onChange={e => setForm({ ...form, tax_id: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
              <input placeholder="12 Builder St, Parramatta NSW 2150" value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <input placeholder="Any notes about this client" value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
              Add Client
            </button>
            <button onClick={() => setShowCreate(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Client List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <p className="text-gray-400 text-lg mb-2">No clients found</p>
          <p className="text-gray-400 text-sm mb-4">
            {search || filterJurisdiction || filterType ? 'Try adjusting your filters' : 'Add your first client to get started'}
          </p>
          {!search && !filterJurisdiction && !filterType && (
            <button onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
              + Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => (
            <div key={client.id}
              onClick={() => setSelected(selected?.id === client.id ? null : client)}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                selected?.id === client.id ? 'border-indigo-400 shadow-md' : 'hover:border-gray-300'
              }`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <span className="text-indigo-600 font-bold text-sm">{client.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[client.status] || STATUS_COLORS.active}`}>
                      {client.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {client.jurisdiction}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {client.contact_name && <span>{client.contact_name}</span>}
                    {client.contact_email && <span>{client.contact_email}</span>}
                    {client.contact_phone && <span>{client.contact_phone}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0 hidden md:block">
                  {client.outstanding > 0 ? (
                    <p className="font-bold text-amber-600 text-sm">${client.outstanding.toLocaleString()} owed</p>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">Paid up</p>
                  )}
                  <p className="text-[10px] text-gray-400">{client.invoices_count || 0} invoices &middot; ${(client.total_billed || 0).toLocaleString()} total</p>
                </div>
              </div>

              {/* Expanded detail */}
              {selected?.id === client.id && (
                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">Details</p>
                    <p className="text-sm text-gray-700">{ENTITY_TYPES.find(t => t.value === client.entity_type)?.label || client.entity_type}</p>
                    {client.tax_id && <p className="text-xs text-gray-500 mt-1">ABN: {client.tax_id}</p>}
                    {client.address && <p className="text-xs text-gray-500 mt-1">{client.address}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">Billing Summary</p>
                    <p className="text-sm text-gray-700">Total Billed: <span className="font-semibold">${(client.total_billed || 0).toLocaleString()}</span></p>
                    <p className="text-sm text-gray-700">Outstanding: <span className={`font-semibold ${client.outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>${(client.outstanding || 0).toLocaleString()}</span></p>
                    <p className="text-xs text-gray-400 mt-1">{client.invoices_count || 0} invoices sent</p>
                    {client.last_invoice && <p className="text-xs text-gray-400">Last invoice: {client.last_invoice}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">Notes</p>
                    <p className="text-sm text-gray-500">{client.notes || 'No notes'}</p>
                    <div className="flex gap-2 mt-3">
                      <a href={`/invoicing?client=${encodeURIComponent(client.name)}`}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
                        Create Invoice
                      </a>
                      <a href={`mailto:${client.contact_email}`}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200">
                        Email
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const textColor = color === 'green' ? 'text-emerald-600' : color === 'amber' ? 'text-amber-600' : color === 'indigo' ? 'text-indigo-600' : 'text-gray-900';
  return (
    <div className="bg-white rounded-xl border p-4 text-center">
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
