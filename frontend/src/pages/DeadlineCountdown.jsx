import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_CONFIG = {
  overdue: { label: 'Overdue', color: 'bg-red-900/40 text-red-300 border-red-700/50', ring: 'ring-red-500/30' },
  due_soon: { label: 'Due Soon', color: 'bg-amber-900/40 text-amber-300 border-amber-700/50', ring: 'ring-amber-500/30' },
  upcoming: { label: 'Upcoming', color: 'bg-blue-900/40 text-blue-300 border-blue-700/50', ring: 'ring-blue-500/30' },
  on_track: { label: 'On Track', color: 'bg-gray-700/50 text-gray-300 border-gray-600', ring: '' },
  completed: { label: 'Done', color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50', ring: '' },
};
const JURISDICTION_FLAGS = { AU: '\uD83C\uDDE6\uD83C\uDDFA', NZ: '\uD83C\uDDF3\uD83C\uDDFF', UK: '\uD83C\uDDEC\uD83C\uDDE7', US: '\uD83C\uDDFA\uD83C\uDDF8' };

export default function DeadlineCountdown() {
  const toast = useToast();
  const [deadlines, setDeadlines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterJurisdiction, setFilterJurisdiction] = useState('all');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [dlRes, sumRes, alertRes] = await Promise.all([
      api.get('/deadline-countdown/').catch(() => ({ data: { deadlines: [] } })),
      api.get('/deadline-countdown/summary').catch(() => ({ data: null })),
      api.get('/deadline-countdown/alerts').catch(() => ({ data: { alerts: [] } })),
    ]);
    setDeadlines(dlRes.data.deadlines || []);
    setSummary(sumRes.data);
    setAlerts(alertRes.data.alerts || []);
    setLoading(false);
  }

  async function markComplete(id) {
    try {
      await api.post(`/deadline-countdown/${id}/complete`);
      toast.success('Marked as complete');
      loadData();
    } catch { toast.error('Failed to update'); }
  }

  const filtered = deadlines.filter(d => {
    if (filterStatus === 'active' && d.status === 'completed') return false;
    if (filterStatus === 'completed' && d.status !== 'completed') return false;
    if (filterJurisdiction !== 'all' && d.jurisdiction !== filterJurisdiction) return false;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Deadline Countdown</h2>
        <p className="text-gray-400 mt-1">Real-time countdown to every filing deadline across all clients and jurisdictions</p>
      </div>

      {/* Alerts Banner */}
      {alerts.filter(a => a.severity === 'critical' || a.severity === 'urgent').length > 0 && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-red-400">Urgent Alerts</h3>
          {alerts.filter(a => a.severity === 'critical' || a.severity === 'urgent').map((a, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className={`w-2 h-2 rounded-full ${a.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-gray-300">{a.client}</span>
              <span className="text-gray-500">\u2014</span>
              <span className={a.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Overdue" value={summary.overdue} color="red" urgent={summary.overdue > 0} />
          <StatCard label="Due This Week" value={summary.due_this_week} color="amber" />
          <StatCard label="Due This Month" value={summary.due_this_month} color="blue" />
          <StatCard label="Active" value={summary.total_active} color="indigo" />
          <StatCard label="Completed" value={summary.completed} color="emerald" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="active">Active Deadlines</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>
        <select value={filterJurisdiction} onChange={e => setFilterJurisdiction(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="all">All Jurisdictions</option>
          <option value="AU">Australia</option>
          <option value="NZ">New Zealand</option>
          <option value="UK">United Kingdom</option>
          <option value="US">United States</option>
        </select>
        <span className="text-sm text-gray-500">{filtered.length} deadline{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Deadline Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">&#x1F389;</div>
          <p className="font-medium">{filterStatus === 'completed' ? 'No completed deadlines' : 'All clear — no active deadlines'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.on_track;
            const days = d.days_remaining;
            return (
              <div key={d.id} className={`bg-gray-800/40 border rounded-xl p-4 transition-colors ${sc.ring ? `ring-1 ${sc.ring}` : ''} ${d.status === 'overdue' ? 'border-red-700/50' : 'border-gray-700'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Countdown circle */}
                    <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shrink-0 ${
                      d.status === 'completed' ? 'bg-emerald-900/30' :
                      d.status === 'overdue' ? 'bg-red-900/30' :
                      days <= 7 ? 'bg-amber-900/30' : 'bg-gray-800'
                    }`}>
                      {d.status === 'completed' ? (
                        <span className="text-emerald-400 text-lg">\u2713</span>
                      ) : (
                        <>
                          <span className={`text-lg font-bold ${d.status === 'overdue' ? 'text-red-400' : days <= 7 ? 'text-amber-400' : 'text-white'}`}>
                            {Math.abs(days)}
                          </span>
                          <span className="text-[9px] text-gray-500 -mt-0.5">{days < 0 ? 'LATE' : 'days'}</span>
                        </>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-white">{d.description}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                        <span className="text-xs">{JURISDICTION_FLAGS[d.jurisdiction] || d.jurisdiction}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                        <span>Client: <span className="text-gray-300">{d.client_name}</span></span>
                        <span>Type: <span className="text-gray-300">{d.type}</span></span>
                        <span>Due: <span className="text-gray-300">{d.due_date}</span></span>
                        {d.assigned_to && <span>Assigned: <span className="text-gray-300">{d.assigned_to}</span></span>}
                      </div>
                    </div>
                  </div>

                  {d.status !== 'completed' && (
                    <button onClick={() => markComplete(d.id)}
                      className="px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0">
                      Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, urgent }) {
  const colors = {
    indigo: 'border-indigo-800/50 bg-indigo-950/20 text-indigo-400',
    emerald: 'border-emerald-800/50 bg-emerald-950/20 text-emerald-400',
    amber: 'border-amber-800/50 bg-amber-950/20 text-amber-400',
    red: 'border-red-800/50 bg-red-950/20 text-red-400',
    blue: 'border-blue-800/50 bg-blue-950/20 text-blue-400',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]} ${urgent ? 'ring-1 ring-red-500/30' : ''}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
