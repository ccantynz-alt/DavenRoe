import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const SECTION_STATUS_COLORS = {
  included: 'text-emerald-400 bg-emerald-900/30',
  missing: 'text-red-400 bg-red-900/30',
  partial: 'text-amber-400 bg-amber-900/30',
};

const SEVERITY_COLORS = {
  high: 'text-red-400 bg-red-900/30 border-red-800/50',
  medium: 'text-amber-400 bg-amber-900/30 border-amber-800/50',
  low: 'text-blue-400 bg-blue-900/30 border-blue-800/50',
};

const CLIENTS = [
  { id: 'client-001', name: 'Meridian Corp', jurisdiction: 'AU', fy_end: 'June 30' },
  { id: 'client-002', name: 'Pinnacle Ltd', jurisdiction: 'NZ', fy_end: 'December 31' },
  { id: 'client-003', name: 'Vortex Digital', jurisdiction: 'AU', fy_end: 'June 30' },
  { id: 'client-004', name: 'Apex Advisory', jurisdiction: 'AU', fy_end: 'June 30' },
  { id: 'client-005', name: 'Summit Holdings', jurisdiction: 'UK', fy_end: 'March 31' },
];

export default function AuditPack() {
  const toast = useToast();
  const [packs, setPacks] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedSections, setSelectedSections] = useState([]);

  const [form, setForm] = useState({
    client_id: '', client_name: '', period: 'FY2026',
    period_start: '2025-07-01', period_end: '2026-06-30',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [packsRes, sectionsRes] = await Promise.all([
      api.get('/audit-pack/').catch(() => ({ data: { packs: [] } })),
      api.get('/audit-pack/sections').catch(() => ({ data: { sections: [] } })),
    ]);
    setPacks(packsRes.data.packs || []);
    const secs = sectionsRes.data.sections || [];
    setSections(secs);
    setSelectedSections(secs.filter(s => s.required).map(s => s.id));
    setLoading(false);
  }

  function handleClientChange(clientId) {
    const client = CLIENTS.find(c => c.id === clientId);
    setForm(f => ({ ...f, client_id: clientId, client_name: client?.name || '' }));
  }

  function toggleSection(sectionId) {
    setSelectedSections(prev =>
      prev.includes(sectionId) ? prev.filter(s => s !== sectionId) : [...prev, sectionId]
    );
  }

  async function handleGenerate() {
    if (!form.client_id) { toast.error('Select a client'); return; }
    if (selectedSections.length === 0) { toast.error('Select at least one section'); return; }
    setGenerating(true);
    try {
      const res = await api.post('/audit-pack/generate', {
        ...form,
        sections: selectedSections,
      });
      toast.success(`Audit pack generated — ${res.data.total_pages} pages`);
      setShowGenerate(false);
      setSelectedPack(res.data);
      loadData();
    } catch {
      toast.error('Failed to generate audit pack');
    }
    setGenerating(false);
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/audit-pack/${id}`);
      toast.success('Audit pack deleted');
      if (selectedPack?.id === id) setSelectedPack(null);
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
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
          <h2 className="text-2xl font-bold text-white">Audit Preparation Pack</h2>
          <p className="text-gray-400 mt-1">One-click audit pack generation — trial balance, GL, bank statements, receipts, tax returns in a single bundle</p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors"
        >
          + Generate Audit Pack
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Packs" value={packs.length} color="indigo" />
        <StatCard label="Completed" value={packs.filter(p => p.status === 'completed').length} color="emerald" />
        <StatCard label="In Progress" value={packs.filter(p => p.status === 'in_progress').length} color="amber" />
        <StatCard label="With Issues" value={packs.filter(p => p.issues?.length > 0).length} color="red" />
      </div>

      {/* Generate Form */}
      {showGenerate && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Generate New Audit Pack</h3>
            <button onClick={() => setShowGenerate(false)} className="text-gray-400 hover:text-white text-sm">Cancel</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Client *</label>
              <select
                value={form.client_id} onChange={e => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Select client...</option>
                {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.jurisdiction})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Period</label>
              <input
                value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. FY2026"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input
                type="date" value={form.period_start}
                onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input
                type="date" value={form.period_end}
                onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Sections to Include</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map(section => (
                <label
                  key={section.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSections.includes(section.id)
                      ? 'bg-indigo-950/30 border-indigo-700/50'
                      : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(section.id)}
                    onChange={() => toggleSection(section.id)}
                    className="mt-0.5 w-4 h-4 rounded bg-gray-900 border-gray-600 text-indigo-500 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{section.name}</span>
                      {section.required && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300">Required</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGenerate} disabled={generating}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : `Generate Pack (${selectedSections.length} sections)`}
            </button>
            <button onClick={() => setShowGenerate(false)} className="px-5 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Selected Pack Detail */}
      {selectedPack && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">{selectedPack.client_name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  selectedPack.status === 'completed' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/40 text-amber-300'
                }`}>{selectedPack.status === 'completed' ? 'Complete' : 'In Progress'}</span>
              </div>
              <p className="text-sm text-gray-400">
                {selectedPack.period} ({selectedPack.period_start} to {selectedPack.period_end})
                &middot; {selectedPack.total_pages} pages
                {selectedPack.file_size_mb && ` \u00B7 ${selectedPack.file_size_mb} MB`}
                &middot; Generated by {selectedPack.generated_by}
              </p>
            </div>
            <button onClick={() => setSelectedPack(null)} className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-gray-700/50 rounded-lg">&times; Close</button>
          </div>

          {/* Issues */}
          {selectedPack.issues?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-400">Issues ({selectedPack.issues.length})</h4>
              {selectedPack.issues.map((issue, i) => (
                <div key={i} className={`text-sm px-3 py-2 rounded-lg border ${SEVERITY_COLORS[issue.severity]}`}>
                  <span className="font-medium capitalize">{issue.severity}:</span> {issue.description}
                </div>
              ))}
            </div>
          )}

          {/* Sections */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Sections</h4>
            <div className="space-y-1">
              {selectedPack.sections.map((section, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-900/30 hover:bg-gray-900/50">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${SECTION_STATUS_COLORS[section.status]}`}>
                      {section.status === 'included' ? '\u2713' : section.status === 'partial' ? '\u25CB' : '\u2717'}
                    </span>
                    <span className="text-sm text-white">{section.name}</span>
                    {section.notes && <span className="text-xs text-gray-500">\u2014 {section.notes}</span>}
                  </div>
                  <span className="text-xs text-gray-500">{section.pages > 0 ? `${section.pages} pages` : '\u2014'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pack List */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Generated Packs</h3>
        {packs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">&#x1F4E6;</div>
            <p className="font-medium">No audit packs generated yet</p>
            <p className="text-sm mt-1">Generate your first audit pack to compile all documents for your auditor</p>
          </div>
        ) : (
          <div className="space-y-2">
            {packs.map(pack => (
              <div
                key={pack.id}
                className={`bg-gray-800/40 border rounded-xl p-4 hover:bg-gray-800/60 transition-colors cursor-pointer ${
                  selectedPack?.id === pack.id ? 'border-indigo-600' : 'border-gray-700'
                }`}
                onClick={() => setSelectedPack(pack)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      pack.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'
                    }`}>
                      {pack.status === 'completed' ? '\u2713' : '\u25CB'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{pack.client_name}</span>
                        <span className="text-xs text-gray-500">{pack.period}</span>
                        {pack.issues?.length > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/30 text-red-400">{pack.issues.length} issue{pack.issues.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {pack.total_pages} pages
                        {pack.file_size_mb && ` \u00B7 ${pack.file_size_mb} MB`}
                        &middot; {pack.sections.filter(s => s.status === 'included').length}/{pack.sections.length} sections
                        &middot; {new Date(pack.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      className="px-3 py-1.5 text-xs text-indigo-400 hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(pack.id)}
                      className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
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
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
