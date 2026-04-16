import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

// Kinds of events rendered on the timeline. Keep in sync with backend.
const KIND_META = {
  audit:       { label: 'Activity',    accent: 'bg-blue-500',   tint: 'bg-blue-50 text-blue-700 border-blue-200' },
  deadline:    { label: 'Deadline',    accent: 'bg-amber-500',  tint: 'bg-amber-50 text-amber-700 border-amber-200' },
  filing:      { label: 'Tax Filing',  accent: 'bg-indigo-500', tint: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  close:       { label: 'Close',       accent: 'bg-emerald-500',tint: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  catchup:     { label: 'Catch-up',    accent: 'bg-purple-500', tint: 'bg-purple-50 text-purple-700 border-purple-200' },
  transaction: { label: 'Transaction', accent: 'bg-gray-500',   tint: 'bg-gray-50 text-gray-700 border-gray-200' },
  alert:       { label: 'Alert',       accent: 'bg-rose-500',   tint: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const SEVERITY_TINT = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  info:    'bg-gray-50 text-gray-700 border-gray-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-rose-50 text-rose-700 border-rose-200',
};

const DEMO_EVENTS = [
  {
    id: 'demo-1', timestamp: new Date().toISOString(), kind: 'alert',
    title: 'Cash flow alert — March', description: 'Forecast shows $12,400 shortfall in 18 days. Suggested: delay vendor #VEN-44 by 5 days.',
    actor: 'Cash Flow Agent', severity: 'warning', jurisdiction: null,
  },
  {
    id: 'demo-2', timestamp: new Date(Date.now() - 2 * 3600_000).toISOString(), kind: 'close',
    title: 'Month-end close — March 2026 completed',
    description: 'Autonomous close: reconciled 247 txns, posted 3 accruals, produced financials in 4.2s.',
    actor: 'Month-End Agent', severity: 'success',
  },
  {
    id: 'demo-3', timestamp: new Date(Date.now() + 5 * 86400_000).toISOString(), kind: 'deadline',
    title: 'NZ GST (2-monthly) — due in 5d', description: 'GST filing in NZ', actor: 'Compliance Monitor',
    severity: 'warning', jurisdiction: 'NZ', status: 'due_soon',
  },
  {
    id: 'demo-4', timestamp: new Date(Date.now() - 1 * 86400_000).toISOString(), kind: 'filing',
    title: 'BAS Q3 FY26', description: 'AI-drafted BAS passed 14/14 validation checks, awaiting partner sign-off.',
    actor: 'Tax Filing Engine', severity: 'info', jurisdiction: 'AU', status: 'validated',
  },
  {
    id: 'demo-5', timestamp: new Date(Date.now() - 3 * 3600_000).toISOString(), kind: 'audit',
    title: 'Sarah Chen approved transaction', description: 'Approved batch of 12 vendor payments totalling $34,560.',
    actor: 'Sarah Chen', severity: 'success', status: 'approve',
  },
  {
    id: 'demo-6', timestamp: new Date(Date.now() - 7 * 86400_000).toISOString(), kind: 'filing',
    title: 'NZ GST Mar/Apr 2026', description: 'Lodged to IRD successfully. Return number IRD-GST-2026-02.',
    actor: 'Tax Filing Engine', severity: 'success', jurisdiction: 'NZ', status: 'lodged',
  },
  {
    id: 'demo-7', timestamp: new Date(Date.now() + 12 * 86400_000).toISOString(), kind: 'deadline',
    title: 'AU BAS Q3 FY26', description: 'GST filing in AU', actor: 'Compliance Monitor',
    severity: 'info', jurisdiction: 'AU', status: 'scheduled',
  },
  {
    id: 'demo-8', timestamp: new Date(Date.now() - 12 * 3600_000).toISOString(), kind: 'audit',
    title: 'AI Categorizer auto-categorised 28 txns', description: '26/28 at 94%+ confidence, 2 sent to Review Queue.',
    actor: 'AI Categorizer', severity: 'info', status: 'update',
  },
];

function formatRelative(ts) {
  const d = new Date(ts);
  const diff = (d - new Date()) / 1000;
  const abs = Math.abs(diff);
  const future = diff > 0;
  const fmt = (n, unit) => `${n}${unit} ${future ? 'from now' : 'ago'}`;
  if (abs < 60) return future ? 'Soon' : 'Just now';
  if (abs < 3600) return fmt(Math.floor(abs / 60), 'm');
  if (abs < 86400) return fmt(Math.floor(abs / 3600), 'h');
  if (abs < 86400 * 7) return fmt(Math.floor(abs / 86400), 'd');
  if (abs < 86400 * 30) return fmt(Math.floor(abs / 86400 / 7), 'w');
  return d.toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAbsolute(ts) {
  return new Date(ts).toLocaleString('en-NZ', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function groupByDay(events) {
  const groups = new Map();
  for (const ev of events) {
    const d = new Date(ev.timestamp);
    const key = d.toDateString();
    if (!groups.has(key)) groups.set(key, { key, date: d, events: [] });
    groups.get(key).events.push(ev);
  }
  return Array.from(groups.values()).sort((a, b) => b.date - a.date);
}

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState('all');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (kindFilter !== 'all') params.kind = kindFilter;
      if (jurisdictionFilter !== 'all') params.jurisdiction = jurisdictionFilter;
      const [eventsRes, statsRes] = await Promise.all([
        api.get('/timeline/events', { params }).catch(() => null),
        api.get('/timeline/stats').catch(() => null),
      ]);
      const fetched = eventsRes?.data?.events || [];
      setEvents(fetched.length > 0 ? fetched : DEMO_EVENTS);
      setStats(statsRes?.data || null);
    } catch {
      setEvents(DEMO_EVENTS);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [kindFilter, jurisdictionFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      (e.title || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q) ||
      (e.actor || '').toLowerCase().includes(q),
    );
  }, [events, searchQuery]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const upcoming = useMemo(
    () => filtered.filter((e) => new Date(e.timestamp) > new Date()).length,
    [filtered],
  );
  const overdueCount = useMemo(
    () => filtered.filter((e) => e.status === 'overdue').length,
    [filtered],
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
        <p className="text-gray-500 mt-1">
          One chronological view of every event — audit trail, deadlines, filings, closes and alerts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total events" value={stats?.total_events ?? filtered.length} accent="text-indigo-600" />
        <StatCard label="Today" value={stats?.events_today ?? filtered.filter((e) => {
          const d = new Date(e.timestamp); const t = new Date(); t.setHours(0, 0, 0, 0);
          return d >= t && d <= new Date();
        }).length} accent="text-emerald-600" />
        <StatCard label="Upcoming" value={upcoming} accent="text-blue-600" />
        <StatCard
          label="Overdue"
          value={stats?.overdue_deadlines ?? overdueCount}
          accent={(stats?.overdue_deadlines ?? overdueCount) > 0 ? 'text-rose-600' : 'text-gray-400'}
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">All kinds</option>
          <option value="audit">Activity</option>
          <option value="deadline">Deadlines</option>
          <option value="filing">Tax filings</option>
          <option value="close">Closes</option>
          <option value="alert">Alerts</option>
        </select>
        <select
          value={jurisdictionFilter}
          onChange={(e) => setJurisdictionFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">All jurisdictions</option>
          <option value="NZ">New Zealand</option>
          <option value="AU">Australia</option>
          <option value="GB">United Kingdom</option>
          <option value="US">United States</option>
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search title, description, actor..."
          className="flex-1 min-w-[200px] px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        {(kindFilter !== 'all' || jurisdictionFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => { setKindFilter('all'); setJurisdictionFilter('all'); setSearchQuery(''); }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl mx-auto mb-3 text-gray-400">~</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Nothing in this window</h3>
          <p className="text-sm text-gray-500">Adjust your filters to see more events.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <DayGroup key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function DayGroup({ group }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isToday = group.date.toDateString() === today.toDateString();
  const dateLabel = isToday
    ? 'Today'
    : group.date.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 sticky top-0 bg-gray-50/80 backdrop-blur py-2 z-10">
        <h3 className="text-sm font-semibold text-gray-900">{dateLabel}</h3>
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">{group.events.length} event{group.events.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
        <div className="space-y-2">
          {group.events.map((ev) => (
            <TimelineEvent key={ev.id} event={ev} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineEvent({ event }) {
  const meta = KIND_META[event.kind] || KIND_META.audit;
  const severity = SEVERITY_TINT[event.severity] || SEVERITY_TINT.info;
  return (
    <div className="relative flex gap-4 group">
      <div className="relative z-10 shrink-0">
        <div className={`w-10 h-10 rounded-full ${meta.accent} text-white flex items-center justify-center text-[10px] font-bold uppercase tracking-wide shadow-sm`}>
          {meta.label.slice(0, 3)}
        </div>
      </div>
      <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow group-hover:border-gray-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${meta.tint}`}>
                {meta.label}
              </span>
              {event.jurisdiction && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${severity}`}>
                  {event.jurisdiction}
                </span>
              )}
              {event.status && event.status !== 'info' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 capitalize">
                  {String(event.status).replace(/_/g, ' ')}
                </span>
              )}
            </div>
            {event.description && (
              <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              {event.actor && <span>{event.actor}</span>}
              {event.reference && <span className="font-mono">{event.reference}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500 font-medium">{formatRelative(event.timestamp)}</p>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{formatAbsolute(event.timestamp)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
