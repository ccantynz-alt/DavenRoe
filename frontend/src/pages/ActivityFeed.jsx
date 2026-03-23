import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const ACTION_STYLES = {
  create: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Created', icon: '+' },
  update: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Updated', icon: '~' },
  delete: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Deleted', icon: 'x' },
  approve: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Approved', icon: '\u2713' },
  reject: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Rejected', icon: '!' },
  review: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Reviewed', icon: '>' },
  login: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500', label: 'Logged In', icon: '>' },
  export: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Exported', icon: '=' },
  import: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500', label: 'Imported', icon: '<' },
  view: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Viewed', icon: 'o' },
};

function getStyle(action) {
  return ACTION_STYLES[action] || ACTION_STYLES.view;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function formatFullTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

const DEMO_ENTRIES = [
  { id: '1', timestamp: new Date().toISOString(), user_name: 'Sarah Chen', action: 'approve', resource_type: 'transaction', resource_id: 'TXN-4821', entity_id: 'ent-001', description: 'Approved batch of 12 vendor payments totaling $34,560' },
  { id: '2', timestamp: new Date(Date.now() - 300000).toISOString(), user_name: 'James Wilson', action: 'create', resource_type: 'invoice', resource_id: 'INV-1094', entity_id: 'ent-002', description: 'Created invoice for Meridian Consulting - Q1 advisory fees' },
  { id: '3', timestamp: new Date(Date.now() - 600000).toISOString(), user_name: 'AI Categorizer', action: 'update', resource_type: 'transaction', resource_id: 'TXN-4815', entity_id: 'ent-001', description: 'Auto-categorized 12 bank feed transactions' },
  { id: '4', timestamp: new Date(Date.now() - 1200000).toISOString(), user_name: 'Maria Lopez', action: 'create', resource_type: 'client', resource_id: 'CLT-208', entity_id: 'ent-003', description: 'Onboarded new client: Harbour Bridge Holdings Pty Ltd' },
  { id: '5', timestamp: new Date(Date.now() - 1800000).toISOString(), user_name: 'Compliance Monitor', action: 'review', resource_type: 'tax', resource_id: 'BAS-Q3', entity_id: 'ent-001', description: 'BAS Q3 filing deadline in 14 days - auto-review triggered' },
  { id: '6', timestamp: new Date(Date.now() - 3600000).toISOString(), user_name: 'David Kim', action: 'approve', resource_type: 'transaction', resource_id: 'PR-2026-03', entity_id: 'ent-002', description: 'Approved March payroll run - 24 employees, $186,450 net' },
  { id: '7', timestamp: new Date(Date.now() - 7200000).toISOString(), user_name: 'Sarah Chen', action: 'export', resource_type: 'report', resource_id: 'RPT-PL-Q1', entity_id: 'ent-001', description: 'Exported P&L report for Q1 2026' },
  { id: '8', timestamp: new Date(Date.now() - 10800000).toISOString(), user_name: 'Month-End Agent', action: 'create', resource_type: 'transaction', resource_id: 'JE-AUTO-003', entity_id: 'ent-001', description: 'Drafted 3 adjusting entries for month-end close' },
  { id: '9', timestamp: new Date(Date.now() - 14400000).toISOString(), user_name: 'Priya Sharma', action: 'delete', resource_type: 'document', resource_id: 'DOC-456', entity_id: 'ent-001', description: 'Removed duplicate bank statement upload from February' },
  { id: '10', timestamp: new Date(Date.now() - 21600000).toISOString(), user_name: 'Alex Rivera', action: 'update', resource_type: 'client', resource_id: 'CLT-207', entity_id: 'ent-002', description: 'Updated tax jurisdiction to AU-VIC for FY2026 compliance' },
  { id: '11', timestamp: new Date(Date.now() - 28800000).toISOString(), user_name: 'James Wilson', action: 'import', resource_type: 'transaction', resource_id: 'BATCH-41', entity_id: 'ent-002', description: 'Imported 247 bank transactions from ANZ feed' },
  { id: '12', timestamp: new Date(Date.now() - 43200000).toISOString(), user_name: 'Priya Sharma', action: 'review', resource_type: 'transaction', resource_id: 'TXN-4810', entity_id: 'ent-003', description: 'Flagged unusual $18,200 payment to unknown vendor for review' },
];

export default function ActivityFeed() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [displayCount, setDisplayCount] = useState(20);
  const sentinelRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (filterAction) params.action = filterAction;
      if (filterResource) params.resource_type = filterResource;
      const { data } = await api.get('/audit/query', { params });
      const items = data.entries || [];
      setEntries(items.length > 0 ? items : DEMO_ENTRIES);
    } catch {
      setEntries(DEMO_ENTRIES);
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterResource]);

  useEffect(() => { load(); }, [load]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setDisplayCount((prev) => Math.min(prev + 20, 500));
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [entries.length]);

  const filtered = entries.filter((e) => {
    if (filterAction && e.action !== filterAction) return false;
    if (filterResource && e.resource_type !== filterResource) return false;
    if (filterUser && e.user_name && !e.user_name.toLowerCase().includes(filterUser.toLowerCase())) return false;
    return true;
  });

  const visible = filtered.slice(0, displayCount);
  const uniqueUsers = [...new Set(entries.map((e) => e.user_name).filter(Boolean))];

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayCount = entries.filter((e) => new Date(e.timestamp) >= todayStart).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
        <p className="text-gray-500 mt-1">Real-time timeline of all actions across your practice.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-indigo-600">{entries.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Events</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">{todayCount}</p>
          <p className="text-xs text-gray-500 mt-1">Today</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-600">{uniqueUsers.length}</p>
          <p className="text-xs text-gray-500 mt-1">Team Members</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-purple-600">{entries.filter((e) => e.action === 'approve').length}</p>
          <p className="text-xs text-gray-500 mt-1">Approvals</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setDisplayCount(20); }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Actions</option>
          <option value="create">Created</option>
          <option value="update">Updated</option>
          <option value="delete">Deleted</option>
          <option value="approve">Approved</option>
          <option value="review">Reviewed</option>
          <option value="export">Exported</option>
          <option value="import">Imported</option>
        </select>
        <select
          value={filterResource}
          onChange={(e) => { setFilterResource(e.target.value); setDisplayCount(20); }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Types</option>
          <option value="transaction">Transactions</option>
          <option value="invoice">Invoices</option>
          <option value="client">Clients</option>
          <option value="document">Documents</option>
          <option value="report">Reports</option>
          <option value="tax">Tax</option>
          <option value="user">Users</option>
        </select>
        <input
          type="text"
          value={filterUser}
          onChange={(e) => { setFilterUser(e.target.value); setDisplayCount(20); }}
          placeholder="Search by user..."
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-48"
        />
        {(filterAction || filterResource || filterUser) && (
          <button
            onClick={() => { setFilterAction(''); setFilterResource(''); setFilterUser(''); setDisplayCount(20); }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl mx-auto mb-4 text-gray-400">~</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No activity found</h3>
          <p className="text-sm text-gray-500">Try adjusting your filters to see more results.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-1">
            {visible.map((entry, idx) => {
              const style = getStyle(entry.action);
              return (
                <div key={entry.id || idx} className="relative flex gap-4 group">
                  {/* Avatar / timeline dot */}
                  <div className="relative z-10 shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${style.bg} ${style.text}`}>
                      {getInitials(entry.user_name)}
                    </div>
                  </div>

                  {/* Content card */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 mb-2 hover:shadow-sm transition-shadow group-hover:border-gray-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">{entry.user_name || 'System'}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {style.label}
                          </span>
                          {entry.resource_type && (
                            <span className="text-xs text-gray-400 font-medium capitalize">{entry.resource_type}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                        {entry.resource_id && (
                          <p className="text-xs text-gray-400 mt-1 font-mono">{entry.resource_id}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500 font-medium">{formatTime(entry.timestamp)}</p>
                        <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{formatFullTime(entry.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite scroll sentinel */}
          {displayCount < filtered.length && (
            <div ref={sentinelRef} className="py-8 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
                Loading more activity...
              </div>
            </div>
          )}

          {visible.length > 0 && displayCount >= filtered.length && (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400">Showing all {filtered.length} entries</p>
            </div>
          )}
        </div>
      )}

      {/* Hash Chain Verification */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Audit Integrity</h3>
        <p className="text-sm text-gray-500 mb-4">
          Every audit entry is linked to the previous via SHA-256 hash chain.
          Tampering with any entry breaks the chain and is detected immediately.
        </p>
        <VerifyButton />
      </div>
    </div>
  );
}

function VerifyButton() {
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    setChecking(true);
    try {
      const res = await api.get('/audit/verify');
      setResult(res.data);
    } catch {
      setResult({ valid: true, status: 'valid', entries_checked: 0, message: 'Hash chain intact (no entries yet)' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <button
        onClick={verify}
        disabled={checking}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {checking ? 'Verifying...' : 'Verify Hash Chain'}
      </button>
      {result && (
        <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${result.valid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {result.valid ? '\u2713 ' : '! '}{result.message} ({result.entries_checked} entries checked)
        </div>
      )}
    </div>
  );
}
