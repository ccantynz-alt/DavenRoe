import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' } }),
};

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

  const summaryCards = summary ? [
    { label: 'Total Hours', value: `${summary.total_hours}h`, color: 'text-gray-900' },
    { label: 'Billable', value: `${summary.billable_hours}h`, color: 'text-indigo-600' },
    { label: 'Total Earned', value: `$${summary.total_amount}`, color: 'text-green-600' },
    { label: 'Uninvoiced', value: `$${summary.uninvoiced_amount}`, color: 'text-amber-600' },
    { label: 'Utilization', value: `${summary.utilization}%`, color: 'text-gray-900' },
  ] : [];

  return (
    <div>
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Time Tracker</h2>
          <p className="text-gray-500 mt-1">Track billable hours with one click. Add time to invoices when you're done.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowManual(true)}>
          Add Manual Entry
        </Button>
      </motion.div>

      {/* Timer widget */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <Card
          className={cn(
            'p-8 mb-8 text-center transition-colors border-2',
            activeTimer
              ? 'bg-indigo-600 text-white border-indigo-600 hover:shadow-lg'
              : 'border-dashed border-gray-300 bg-white'
          )}
        >
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
                <Input
                  value={form.client_name}
                  onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                  placeholder="Client name"
                />
                <Input
                  value={form.project_name}
                  onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))}
                  placeholder="Project (optional)"
                />
                <Input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What are you working on?"
                />
                <Input
                  type="number"
                  value={form.hourly_rate}
                  onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                  placeholder="$/hr rate"
                />
              </div>
              <div className="flex items-center justify-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-500">
                  <Switch
                    checked={form.billable}
                    onCheckedChange={checked => setForm(f => ({ ...f, billable: checked }))}
                  />
                  Billable
                </label>
                <Button
                  variant="success"
                  size="xl"
                  className="shadow-lg hover:shadow-xl"
                  onClick={startTimer}
                >
                  Start Timer
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="destructive"
              size="xl"
              className="shadow-lg hover:shadow-xl animate-pulse"
              onClick={stopTimer}
            >
              Stop Timer
            </Button>
          )}
        </Card>
      </motion.div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={i + 2}
            >
              <Card className="p-4 text-center">
                <p className={cn('text-2xl font-bold', card.color)}>{card.value}</p>
                <p className="text-xs text-gray-400">{card.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* By client / project breakdown */}
      {summary && Object.keys(summary.by_client || {}).length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={7}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">By Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(summary.by_client).map(([name, data]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{name}</span>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>{data.hours}h</span>
                    <span className="font-medium text-gray-600">${data.amount}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">By Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(summary.by_project || {}).map(([name, data]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{name}</span>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>{data.hours}h</span>
                    <span className="font-medium text-gray-600">${data.amount}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Time entries */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={8}
      >
        <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3">
          Recent Entries ({entries.length})
        </h3>
        {entries.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-400 mb-2">No time entries yet</p>
            <p className="text-sm text-gray-300">Start a timer or add a manual entry to begin tracking</p>
          </Card>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -20 }}
                  custom={i * 0.5}
                >
                  <Card
                    className={cn(
                      'p-4 flex items-center gap-4',
                      entry.invoiced && 'bg-green-50 border-green-200'
                    )}
                  >
                    <div className="w-16 text-center">
                      <p className="font-mono font-bold text-sm">{entry.duration_display}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {entry.client_name && <span className="text-sm font-medium">{entry.client_name}</span>}
                        {entry.project_name && <span className="text-xs text-gray-400">/ {entry.project_name}</span>}
                        {entry.billable && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                            billable
                          </Badge>
                        )}
                        {entry.invoiced && (
                          <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
                            invoiced
                          </Badge>
                        )}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-300 hover:text-red-500"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Manual entry dialog */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Time Manually</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={manualForm.date}
                onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                <Input
                  type="number"
                  value={manualForm.hours}
                  onChange={e => setManualForm(f => ({ ...f, hours: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                <Input
                  type="number"
                  value={manualForm.minutes}
                  onChange={e => setManualForm(f => ({ ...f, minutes: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <Input
              value={manualForm.client_name}
              onChange={e => setManualForm(f => ({ ...f, client_name: e.target.value }))}
              placeholder="Client name"
            />
            <Input
              value={manualForm.description}
              onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What did you work on?"
            />
            <Input
              type="number"
              value={manualForm.hourly_rate}
              onChange={e => setManualForm(f => ({ ...f, hourly_rate: e.target.value }))}
              placeholder="Hourly rate ($)"
            />
          </div>
          <DialogFooter className="mt-2">
            <Button variant="secondary" onClick={() => setShowManual(false)}>
              Cancel
            </Button>
            <Button onClick={addManual}>
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
