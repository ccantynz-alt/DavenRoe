import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function TimeTracker() {
  const [activeTimer, setActiveTimer] = useState(null);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [form, setForm] = useState({ client_name: '', project_name: '', description: '', hourly_rate: '', billable: true });
  const [manualForm, setManualForm] = useState({ date: new Date().toISOString().split('T')[0], hours: '', minutes: '', client_name: '', project_name: '', description: '', hourly_rate: '', billable: true });
  const intervalRef = useRef(null);
  const toast = useToast();

  const fetchData = () => {
    api.get('/time-tracker/active').then(r => {
      setActiveTimer(r.data.active);
      if (r.data.active) setElapsed(r.data.active.duration_seconds || 0);
    }).catch(() => null);
    api.get('/time-tracker/entries').then(r => setEntries(r.data.entries || [])).catch(() => null);
    api.get('/time-tracker/summary').then(r => setSummary(r.data)).catch(() => null);
  };

  useEffect(() => { fetchData(); }, []);

  // Live counter
  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(intervalRef.current);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
  }, [activeTimer]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startTimer = async () => {
    try {
      const res = await api.post('/time-tracker/start', {
        ...form,
        hourly_rate: parseFloat(form.hourly_rate) || 0,
      });
      setActiveTimer(res.data);
      setElapsed(0);
      toast.success('Timer started');
    } catch { toast.error('Failed to start timer'); }
  };

  const stopTimer = async () => {
    try {
      const res = await api.post('/time-tracker/stop');
      setActiveTimer(null);
      toast.success(`Tracked ${res.data.duration_display} (${res.data.billable ? '$' + res.data.billable_amount : 'non-billable'})`);
      fetchData();
    } catch { toast.error('Failed to stop timer'); }
  };

  const addManual = async () => {
    if (!manualForm.hours && !manualForm.minutes) return toast.error('Enter hours or minutes');
    try {
      await api.post('/time-tracker/manual', {
        ...manualForm,
        hours: parseFloat(manualForm.hours) || 0,
        minutes: parseFloat(manualForm.minutes) || 0,
        hourly_rate: parseFloat(manualForm.hourly_rate) || 0,
      });
      toast.success('Time entry added');
      setShowManual(false);
      setManualForm({ date: new Date().toISOString().split('T')[0], hours: '', minutes: '', client_name: '', project_name: '', description: '', hourly_rate: '', billable: true });
      fetchData();
    } catch { toast.error('Failed to add entry'); }
  };

  const deleteEntry = async (id) => {
    try {
      await api.delete(`/time-tracker/entries/${id}`);
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const billableAmount = activeTimer && form.hourly_rate ? (elapsed / 3600 * parseFloat(form.hourly_rate || 0)).toFixed(2) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Time Tracker</h2>
          <p className="text-gray-500 mt-1">Track billable hours with one click. Add time to invoices when you're done.</p>
        </div>
        <button onClick={() => setShowManual(true)}
          className="px-4 py-2 bg-white border text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
          Add Manual Entry
        </button>
      </div>

      {/* Timer widget */}
      <div className={`rounded-2xl p-8 mb-8 text-center transition-colors ${
        activeTimer ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-dashed border-gray-300'
      }`}>
        {/* Timer display */}
        <div className="text-6xl font-mono font-bold tracking-wider mb-4">
          {activeTimer ? formatTime(elapsed) : '00:00:00'}
        </div>

        {activeTimer && billableAmount && (
          <p className="text-indigo-200 text-lg mb-4">${billableAmount} earned</p>
        )}

        {activeTimer && (
          <div className="text-indigo-200 text-sm mb-6">
            {activeTimer.client_name && <span>{activeTimer.client_name}</span>}
            {activeTimer.project_name && <span> / {activeTimer.project_name}</span>}
            {activeTimer.description && <span> — {activeTimer.description}</span>}
          </div>
        )}

        {/* Controls */}
        {!activeTimer ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                placeholder="Client name" className="border rounded-lg px-3 py-2 text-sm text-gray-900" />
              <input value={form.project_name} onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))}
                placeholder="Project (optional)" className="border rounded-lg px-3 py-2 text-sm text-gray-900" />
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What are you working on?" className="border rounded-lg px-3 py-2 text-sm text-gray-900" />
              <input type="number" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                placeholder="$/hr rate" className="border rounded-lg px-3 py-2 text-sm text-gray-900" />
            </div>
            <div className="flex items-center justify-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" checked={form.billable} onChange={e => setForm(f => ({ ...f, billable: e.target.checked }))} />
                Billable
              </label>
              <button onClick={startTimer}
                className="px-8 py-4 bg-green-500 text-white rounded-xl text-lg font-bold hover:bg-green-600 shadow-lg hover:shadow-xl transition-all">
                Start Timer
              </button>
            </div>
          </div>
        ) : (
          <button onClick={stopTimer}
            className="px-10 py-4 bg-red-500 text-white rounded-xl text-lg font-bold hover:bg-red-600 shadow-lg hover:shadow-xl transition-all animate-pulse">
            Stop Timer
          </button>
        )}
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{summary.total_hours}h</p>
            <p className="text-xs text-gray-400">Total Hours</p>
          </div>
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{summary.billable_hours}h</p>
            <p className="text-xs text-gray-400">Billable</p>
          </div>
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">${summary.total_amount}</p>
            <p className="text-xs text-gray-400">Total Earned</p>
          </div>
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">${summary.uninvoiced_amount}</p>
            <p className="text-xs text-gray-400">Uninvoiced</p>
          </div>
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{summary.utilization}%</p>
            <p className="text-xs text-gray-400">Utilization</p>
          </div>
        </div>
      )}

      {/* By client breakdown */}
      {summary && Object.keys(summary.by_client || {}).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">By Client</h3>
            <div className="space-y-2">
              {Object.entries(summary.by_client).map(([name, data]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{name}</span>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>{data.hours}h</span>
                    <span className="font-medium text-gray-600">${data.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">By Project</h3>
            <div className="space-y-2">
              {Object.entries(summary.by_project || {}).map(([name, data]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{name}</span>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>{data.hours}h</span>
                    <span className="font-medium text-gray-600">${data.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Time entries */}
      <div>
        <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3">
          Recent Entries ({entries.length})
        </h3>
        {entries.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-2">No time entries yet</p>
            <p className="text-sm text-gray-300">Start a timer or add a manual entry to begin tracking</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className={`bg-white border rounded-lg p-4 flex items-center gap-4 ${
                entry.invoiced ? 'bg-green-50 border-green-200' : ''
              }`}>
                <div className="w-16 text-center">
                  <p className="font-mono font-bold text-sm">{entry.duration_display}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {entry.client_name && <span className="text-sm font-medium">{entry.client_name}</span>}
                    {entry.project_name && <span className="text-xs text-gray-400">/ {entry.project_name}</span>}
                    {entry.billable && <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded">billable</span>}
                    {entry.invoiced && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded">invoiced</span>}
                  </div>
                  {entry.description && <p className="text-xs text-gray-500 truncate">{entry.description}</p>}
                </div>
                <div className="text-right">
                  {entry.billable_amount > 0 && (
                    <p className="font-medium text-sm">${entry.billable_amount}</p>
                  )}
                  <p className="text-[10px] text-gray-400">{entry.started_at ? new Date(entry.started_at).toLocaleDateString() : ''}</p>
                </div>
                {!entry.invoiced && (
                  <button onClick={() => deleteEntry(entry.id)}
                    className="text-xs text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual entry modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add Time Manually</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={manualForm.date} onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                  <input type="number" value={manualForm.hours} onChange={e => setManualForm(f => ({ ...f, hours: e.target.value }))}
                    placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                  <input type="number" value={manualForm.minutes} onChange={e => setManualForm(f => ({ ...f, minutes: e.target.value }))}
                    placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <input value={manualForm.client_name} onChange={e => setManualForm(f => ({ ...f, client_name: e.target.value }))}
                placeholder="Client name" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input value={manualForm.description} onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What did you work on?" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={manualForm.hourly_rate} onChange={e => setManualForm(f => ({ ...f, hourly_rate: e.target.value }))}
                placeholder="Hourly rate ($)" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowManual(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={addManual}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Add Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
