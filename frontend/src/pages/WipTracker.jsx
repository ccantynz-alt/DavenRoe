import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const STAFF = [
  { id: 'staff-001', name: 'Alex Chen', role: 'Senior Accountant', rate: 180 },
  { id: 'staff-002', name: 'Priya Sharma', role: 'Bookkeeper', rate: 120 },
  { id: 'staff-003', name: 'Jordan Lee', role: 'Junior Accountant', rate: 90 },
];

const CLIENTS = [
  { id: 'client-001', name: 'Meridian Corp' },
  { id: 'client-002', name: 'Pinnacle Ltd' },
  { id: 'client-003', name: 'Vortex Digital' },
  { id: 'client-004', name: 'Apex Advisory' },
  { id: 'client-005', name: 'Summit Holdings' },
];

export default function WipTracker() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [byStaff, setByStaff] = useState([]);
  const [byClient, setByClient] = useState([]);
  const [aging, setAging] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    staff_id: 'staff-001', staff_name: 'Alex Chen', client_id: 'client-001',
    client_name: 'Meridian Corp', engagement: 'Monthly Bookkeeping',
    description: '', hours: '', rate: 180, billable: true,
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [sumRes, staffRes, clientRes, agingRes, entriesRes] = await Promise.all([
      api.get('/wip/summary').catch(() => ({ data: null })),
      api.get('/wip/by-staff').catch(() => ({ data: { staff: [] } })),
      api.get('/wip/by-client').catch(() => ({ data: { clients: [] } })),
      api.get('/wip/aging').catch(() => ({ data: null })),
      api.get('/wip/?status=unbilled').catch(() => ({ data: { entries: [] } })),
    ]);
    setSummary(sumRes.data);
    setByStaff(staffRes.data.staff || []);
    setByClient(clientRes.data.clients || []);
    setAging(agingRes.data);
    setEntries(entriesRes.data.entries || []);
    setLoading(false);
  }

  function handleStaffChange(staffId) {
    const staff = STAFF.find(s => s.id === staffId);
    setForm(f => ({ ...f, staff_id: staffId, staff_name: staff?.name || '', rate: staff?.rate || 0 }));
  }

  function handleClientChange(clientId) {
    const client = CLIENTS.find(c => c.id === clientId);
    setForm(f => ({ ...f, client_id: clientId, client_name: client?.name || '' }));
  }

  async function handleSave() {
    if (!form.description || !form.hours) { toast.error('Description and hours are required'); return; }
    try {
      await api.post('/wip/', { ...form, hours: parseFloat(form.hours) });
      toast.success('WIP entry added');
      setShowCreate(false);
      loadData();
    } catch { toast.error('Failed to save'); }
  }

  async function handleWriteOff(id) {
    try {
      await api.post(`/wip/${id}/write-off`);
      toast.success('Entry written off');
      loadData();
    } catch { toast.error('Failed to write off'); }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/wip/${id}`);
      toast.success('Entry deleted');
      loadData();
    } catch { toast.error('Failed to delete'); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Work in Progress</h2>
          <p className="text-gray-400 mt-1">Track unbilled work by staff, client, and engagement</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors">
          + Add WIP Entry
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Unbilled Value" value={`$${summary.total_unbilled_value.toLocaleString()}`} color="indigo" />
          <StatCard label="Unbilled Hours" value={summary.total_unbilled_hours} color="blue" />
          <StatCard label="Utilisation" value={`${summary.utilisation_pct}%`} color={summary.utilisation_pct >= 75 ? 'emerald' : 'amber'} />
          <StatCard label="Billable Hours" value={summary.billable_hours} color="emerald" />
          <StatCard label="Non-Billable" value={summary.non_billable_hours} color="red" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1 w-fit">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'by-staff', label: 'By Staff' },
          { id: 'by-client', label: 'By Client' },
          { id: 'aging', label: 'Aging' },
          { id: 'entries', label: 'Entries', count: entries.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t.label}{t.count != null && <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${tab === t.id ? 'bg-indigo-500' : 'bg-gray-700'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Add WIP Entry</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white text-sm">Cancel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Staff</label>
              <select value={form.staff_id} onChange={e => handleStaffChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {STAFF.map(s => <option key={s.id} value={s.id}>{s.name} — ${s.rate}/hr</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Client</label>
              <select value={form.client_id} onChange={e => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Engagement</label>
              <input value={form.engagement} onChange={e => setForm(f => ({ ...f, engagement: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm text-gray-400 mb-1">Hours *</label>
              <input type="number" step="0.25" min="0" value={form.hours}
                onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. 2.5" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Description *</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="What work was performed?" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.billable} onChange={e => setForm(f => ({ ...f, billable: e.target.checked }))}
                className="w-4 h-4 rounded bg-gray-900 border-gray-600 text-indigo-500 focus:ring-indigo-500" />
              <span className="text-sm text-gray-300">Billable</span>
            </label>
            {form.hours && <span className="text-sm text-gray-400">Value: <span className="text-white font-medium">${(parseFloat(form.hours || 0) * form.rate).toFixed(2)}</span></span>}
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors">Save Entry</button>
            <button onClick={() => setShowCreate(false)} className="px-5 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Staff Summary */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4">WIP by Staff</h3>
            <div className="space-y-3">
              {byStaff.map(s => (
                <div key={s.staff_id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{s.staff_name}</p>
                    <p className="text-xs text-gray-500">{s.billable_hours}h billable &middot; {s.client_count} clients &middot; {s.utilisation_pct}% utilisation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-400">${s.unbilled_value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">unbilled</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Client Summary */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4">WIP by Client</h3>
            <div className="space-y-3">
              {byClient.filter(c => c.client_id !== 'internal').map(c => (
                <div key={c.client_id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{c.client_name}</p>
                    <p className="text-xs text-gray-500">{c.unbilled_hours}h unbilled &middot; {c.engagements.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-400">${c.unbilled_value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{c.staff.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* By Staff Tab */}
      {tab === 'by-staff' && (
        <div className="space-y-4">
          {byStaff.map(s => (
            <div key={s.staff_id} className="bg-gray-800/40 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-white">{s.staff_name}</h4>
                  <p className="text-xs text-gray-500">{s.client_count} clients &middot; {s.clients.join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-400">${s.unbilled_value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">unbilled</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <MiniStat label="Total Hours" value={s.total_hours} />
                <MiniStat label="Billable Hours" value={s.billable_hours} />
                <MiniStat label="Utilisation" value={`${s.utilisation_pct}%`} highlight={s.utilisation_pct >= 75} />
                <MiniStat label="Billed Value" value={`$${s.billed_value.toLocaleString()}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* By Client Tab */}
      {tab === 'by-client' && (
        <div className="space-y-4">
          {byClient.map(c => (
            <div key={c.client_id} className="bg-gray-800/40 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-base font-semibold text-white">{c.client_name}</h4>
                  <p className="text-xs text-gray-500">{c.engagements.join(', ')} &middot; Staff: {c.staff.join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-400">${c.unbilled_value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{c.unbilled_hours}h unbilled / {c.total_hours}h total</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aging Tab */}
      {tab === 'aging' && aging && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">WIP Aging Report</h3>
          <div className="space-y-3">
            {aging.aging.map(bucket => (
              <div key={bucket.bucket} className="flex items-center gap-4">
                <span className="text-sm text-gray-300 w-24">{bucket.bucket}</span>
                <div className="flex-1 h-6 bg-gray-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      bucket.bucket.includes('60+') ? 'bg-red-500' :
                      bucket.bucket.includes('31') ? 'bg-amber-500' :
                      bucket.bucket.includes('15') ? 'bg-yellow-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(2, (bucket.value / Math.max(aging.total_unbilled, 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-white w-24 text-right">${bucket.value.toLocaleString()}</span>
                <span className="text-xs text-gray-500 w-16 text-right">{bucket.hours}h</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-sm">
            <span className="text-gray-400">Total Unbilled</span>
            <span className="font-bold text-white">${aging.total_unbilled.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Entries Tab */}
      {tab === 'entries' && (
        <div>
          {entries.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">&#x23F1;</div>
              <p className="font-medium">No unbilled WIP entries</p>
              <p className="text-sm mt-1">All work has been billed or no entries exist</p>
            </div>
          ) : (
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[140px_140px_1fr_80px_80px_90px_100px] gap-3 px-5 py-3 text-xs font-medium text-gray-500 border-b border-gray-700 uppercase tracking-wider">
                <span>Staff</span><span>Client</span><span>Description</span><span>Hours</span><span>Rate</span><span>Value</span><span>Actions</span>
              </div>
              {entries.map(e => (
                <div key={e.id} className="grid grid-cols-[140px_140px_1fr_80px_80px_90px_100px] gap-3 px-5 py-3 text-sm border-b border-gray-800/50 hover:bg-gray-800/30">
                  <span className="text-gray-300 truncate">{e.staff_name}</span>
                  <span className="text-gray-400 truncate">{e.client_name}</span>
                  <span className="text-gray-300 truncate">{e.description}</span>
                  <span className="text-white font-medium">{e.hours}h</span>
                  <span className="text-gray-400">${e.rate}</span>
                  <span className="text-indigo-400 font-medium">${(e.hours * e.rate).toFixed(0)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleWriteOff(e.id)} className="text-xs text-amber-400 hover:bg-amber-900/30 px-2 py-0.5 rounded transition-colors">W/O</button>
                    <button onClick={() => handleDelete(e.id)} className="text-xs text-red-400 hover:bg-red-900/30 px-2 py-0.5 rounded transition-colors">Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'border-indigo-800/50 bg-indigo-950/20 text-indigo-400',
    emerald: 'border-emerald-800/50 bg-emerald-950/20 text-emerald-400',
    amber: 'border-amber-800/50 bg-amber-950/20 text-amber-400',
    blue: 'border-blue-800/50 bg-blue-950/20 text-blue-400',
    red: 'border-red-800/50 bg-red-950/20 text-red-400',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, highlight }) {
  return (
    <div className="bg-gray-900/40 rounded-lg p-2.5">
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
