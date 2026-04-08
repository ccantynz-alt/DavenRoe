import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const TYPE_CONFIG = {
  email: { label: 'Email', icon: '\u2709', color: 'bg-blue-900/40 text-blue-300' },
  call: { label: 'Call', icon: '\u260E', color: 'bg-emerald-900/40 text-emerald-300' },
  note: { label: 'Note', icon: '\u270E', color: 'bg-amber-900/40 text-amber-300' },
  document_request: { label: 'Doc Request', icon: '\u2B06', color: 'bg-purple-900/40 text-purple-300' },
  sms: { label: 'SMS', icon: '\u2709', color: 'bg-cyan-900/40 text-cyan-300' },
};

const DIRECTION_LABELS = { inbound: 'Received', outbound: 'Sent', internal: 'Internal' };

const CLIENTS = [
  { id: 'client-001', name: 'Meridian Corp' },
  { id: 'client-002', name: 'Pinnacle Ltd' },
  { id: 'client-003', name: 'Vortex Digital' },
  { id: 'client-004', name: 'Apex Advisory' },
  { id: 'client-005', name: 'Summit Holdings' },
  { id: 'client-006', name: 'Ironside Partners' },
];

export default function ClientComms() {
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterClient, setFilterClient] = useState('all');

  const [form, setForm] = useState({
    client_id: '', client_name: '', type: 'note', direction: 'internal',
    subject: '', body: '', contact_name: '', contact_email: '',
    tags: '', staff_name: 'Alex Chen', pinned: false,
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [entriesRes, statsRes] = await Promise.all([
      api.get('/client-comms/').catch(() => ({ data: { entries: [] } })),
      api.get('/client-comms/stats').catch(() => ({ data: null })),
    ]);
    setEntries(entriesRes.data.entries || []);
    setStats(statsRes.data);
    setLoading(false);
  }

  function resetForm() {
    setForm({ client_id: '', client_name: '', type: 'note', direction: 'internal', subject: '', body: '', contact_name: '', contact_email: '', tags: '', staff_name: 'Alex Chen', pinned: false });
    setShowCreate(false);
  }

  async function handleSave() {
    if (!form.client_id || !form.subject) {
      toast.error('Client and subject are required');
      return;
    }
    try {
      await api.post('/client-comms/', {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        linked_items: [],
      });
      toast.success('Communication logged');
      resetForm();
      loadData();
    } catch {
      toast.error('Failed to save');
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/client-comms/${id}`);
      toast.success('Entry deleted');
      if (selectedEntry?.id === id) setSelectedEntry(null);
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  }

  async function handlePin(id) {
    try {
      await api.post(`/client-comms/${id}/pin`);
      loadData();
    } catch {
      toast.error('Failed to update');
    }
  }

  function handleClientSelect(clientId) {
    const client = CLIENTS.find(c => c.id === clientId);
    setForm(f => ({ ...f, client_id: clientId, client_name: client?.name || '' }));
  }

  const filtered = useMemo(() => {
    let result = entries;
    if (filterType !== 'all') result = result.filter(e => e.type === filterType);
    if (filterClient !== 'all') result = result.filter(e => e.client_id === filterClient);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(e =>
        e.subject.toLowerCase().includes(s) ||
        e.body.toLowerCase().includes(s) ||
        e.client_name.toLowerCase().includes(s) ||
        e.contact_name.toLowerCase().includes(s)
      );
    }
    return result;
  }, [entries, filterType, filterClient, search]);

  const pinnedEntries = useMemo(() => filtered.filter(e => e.pinned), [filtered]);
  const unpinnedEntries = useMemo(() => filtered.filter(e => !e.pinned), [filtered]);

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
          <h2 className="text-2xl font-bold text-white">Client Communications</h2>
          <p className="text-gray-400 mt-1">Unified log of all client interactions — emails, calls, notes, and document requests</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors"
        >
          + Log Communication
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Entries" value={stats.total_entries} color="indigo" />
          <StatCard label="This Week" value={stats.this_week} color="emerald" />
          <StatCard label="Pinned" value={stats.pinned} color="amber" />
          <StatCard label="Follow-ups" value={stats.pending_follow_ups} color="red" />
          <StatCard label="Clients" value={stats.top_clients?.length || 0} color="blue" />
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Log New Communication</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white text-sm">Cancel</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Client *</label>
              <select
                value={form.client_id} onChange={e => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Select client...</option>
                {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Direction</label>
              <select
                value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="outbound">Outbound (Sent)</option>
                <option value="inbound">Inbound (Received)</option>
                <option value="internal">Internal Note</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Contact Name</label>
              <input
                value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Sarah Mitchell"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Contact Email</label>
              <input
                value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. sarah@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Subject *</label>
            <input
              value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Brief summary of the communication"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Details</label>
            <textarea
              value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Full notes, discussion points, action items..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tags (comma-separated)</label>
              <input
                value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. tax, follow-up, urgent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Staff Member</label>
              <input
                value={form.staff_name} onChange={e => setForm(f => ({ ...f, staff_name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" checked={form.pinned}
                onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                className="w-4 h-4 rounded bg-gray-900 border-gray-600 text-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-300">Pin this entry</span>
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors">
              Save Entry
            </button>
            <button onClick={resetForm} className="px-5 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none w-64"
          placeholder="Search communications..."
        />
        <select
          value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">All Types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={filterClient} onChange={e => setFilterClient(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">All Clients</option>
          {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-sm text-gray-500">{filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}</span>
      </div>

      {/* Detail View */}
      {selectedEntry && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_CONFIG[selectedEntry.type]?.color || 'bg-gray-700 text-gray-300'}`}>
                  {TYPE_CONFIG[selectedEntry.type]?.label || selectedEntry.type}
                </span>
                <span className="text-xs text-gray-500">{DIRECTION_LABELS[selectedEntry.direction]}</span>
                {selectedEntry.pinned && <span className="text-xs text-amber-400">Pinned</span>}
              </div>
              <h3 className="text-lg font-semibold text-white">{selectedEntry.subject}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {selectedEntry.client_name} {selectedEntry.contact_name && `\u2014 ${selectedEntry.contact_name}`}
                {selectedEntry.staff_name && <span className="text-gray-600"> \u00B7 by {selectedEntry.staff_name}</span>}
              </p>
            </div>
            <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-gray-700/50 rounded-lg">&times; Close</button>
          </div>
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-900/40 rounded-lg p-4">{selectedEntry.body}</div>
          {selectedEntry.tags?.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {selectedEntry.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">{tag}</span>
              ))}
            </div>
          )}
          {selectedEntry.linked_items?.length > 0 && (
            <div className="mt-3 text-xs text-gray-500">
              Linked: {selectedEntry.linked_items.map(li => li.label).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Pinned Entries */}
      {pinnedEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-1">\u2605 Pinned ({pinnedEntries.length})</h3>
          <div className="space-y-2">
            {pinnedEntries.map(entry => (
              <CommRow key={entry.id} entry={entry} onSelect={() => setSelectedEntry(entry)} onPin={() => handlePin(entry.id)} onDelete={() => handleDelete(entry.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        {pinnedEntries.length > 0 && <h3 className="text-sm font-medium text-gray-400 mb-3">All Communications</h3>}
        {unpinnedEntries.length === 0 && pinnedEntries.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">&#x1F4AC;</div>
            <p className="font-medium">No communications logged</p>
            <p className="text-sm mt-1">Start logging client interactions to build a complete communication history</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unpinnedEntries.map(entry => (
              <CommRow key={entry.id} entry={entry} onSelect={() => setSelectedEntry(entry)} onPin={() => handlePin(entry.id)} onDelete={() => handleDelete(entry.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'border-indigo-800/50 bg-indigo-950/20 text-indigo-400',
    emerald: 'border-emerald-800/50 bg-emerald-950/20 text-emerald-400',
    amber: 'border-amber-800/50 bg-amber-950/20 text-amber-400',
    red: 'border-red-800/50 bg-red-950/20 text-red-400',
    blue: 'border-blue-800/50 bg-blue-950/20 text-blue-400',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function CommRow({ entry, onSelect, onPin, onDelete }) {
  const typeConfig = TYPE_CONFIG[entry.type] || { label: entry.type, icon: '\u2022', color: 'bg-gray-700 text-gray-300' };
  const timeStr = new Date(entry.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 hover:bg-gray-800/60 transition-colors cursor-pointer group"
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${typeConfig.color}`}>
          {typeConfig.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-medium text-white truncate">{entry.subject}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
            <span className="text-[10px] text-gray-500">{DIRECTION_LABELS[entry.direction]}</span>
            {entry.pinned && <span className="text-amber-400 text-xs">\u2605</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="text-gray-300 font-medium">{entry.client_name}</span>
            {entry.contact_name && <span>\u2014 {entry.contact_name}</span>}
            {entry.staff_name && <span className="text-gray-600">\u00B7 {entry.staff_name}</span>}
            <span>{timeStr}</span>
          </div>
          {entry.body && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{entry.body.slice(0, 180)}{entry.body.length > 180 ? '...' : ''}</p>
          )}
          {entry.tags?.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {entry.tags.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-400">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={onPin} className={`p-1.5 rounded text-xs transition-colors ${entry.pinned ? 'text-amber-400 hover:bg-amber-900/30' : 'text-gray-500 hover:text-amber-400 hover:bg-gray-700/50'}`}>{entry.pinned ? 'Unpin' : 'Pin'}</button>
          <button onClick={onDelete} className="p-1.5 rounded text-xs text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}
