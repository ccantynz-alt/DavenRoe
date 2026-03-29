import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';

const STATUS_COLORS = {
  planning: 'bg-gray-100 text-gray-700', active: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_BADGE_VARIANT = {
  planning: 'secondary', active: 'default', on_hold: 'warning',
  completed: 'success', cancelled: 'destructive',
};

const TASK_STATUS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const TASK_COLORS = {
  todo: 'bg-gray-50 border-gray-200', in_progress: 'bg-blue-50 border-blue-200',
  review: 'bg-amber-50 border-amber-200', done: 'bg-green-50 border-green-200',
};

const PRIORITY_VARIANT = {
  low: 'secondary', medium: 'outline', high: 'warning', urgent: 'destructive',
};

const DEMO_PROJECTS = [
  {
    id: '1', name: 'Website Redesign', client: 'Acme Corp', status: 'active',
    start_date: '2026-02-01', due_date: '2026-04-30', budget: 45000, spent: 28500,
    billable_hours: 142, non_billable_hours: 18, hourly_rate: 200,
    revenue: 32400, description: 'Complete website redesign including UX audit, design, and development',
    milestones: [
      { id: 'm1', name: 'UX Audit Complete', due: '2026-02-15', done: true },
      { id: 'm2', name: 'Design Approval', due: '2026-03-01', done: true },
      { id: 'm3', name: 'Development Complete', due: '2026-04-15', done: false },
      { id: 'm4', name: 'Launch', due: '2026-04-30', done: false },
    ],
    tasks: [
      { id: 't1', title: 'Stakeholder interviews', status: 'done', assignee: 'Sarah M.', priority: 'high', hours: 12, due: '2026-02-10' },
      { id: 't2', title: 'Wireframes v2', status: 'done', assignee: 'James K.', priority: 'high', hours: 24, due: '2026-02-20' },
      { id: 't3', title: 'Visual design — homepage', status: 'done', assignee: 'James K.', priority: 'high', hours: 16, due: '2026-02-28' },
      { id: 't4', title: 'Visual design — inner pages', status: 'review', assignee: 'James K.', priority: 'medium', hours: 20, due: '2026-03-10' },
      { id: 't5', title: 'Frontend development — homepage', status: 'in_progress', assignee: 'Li W.', priority: 'high', hours: 30, due: '2026-03-25' },
      { id: 't6', title: 'Frontend development — inner pages', status: 'in_progress', assignee: 'Li W.', priority: 'medium', hours: 40, due: '2026-04-10' },
      { id: 't7', title: 'Backend API integration', status: 'todo', assignee: 'Dev P.', priority: 'high', hours: 0, due: '2026-04-15' },
      { id: 't8', title: 'QA testing', status: 'todo', assignee: 'Sarah M.', priority: 'medium', hours: 0, due: '2026-04-22' },
      { id: 't9', title: 'Performance optimization', status: 'todo', assignee: 'Li W.', priority: 'low', hours: 0, due: '2026-04-25' },
    ],
  },
  {
    id: '2', name: 'Annual Tax Compliance', client: 'BrightStar Holdings', status: 'active',
    start_date: '2026-01-15', due_date: '2026-03-31', budget: 18000, spent: 14200,
    billable_hours: 71, non_billable_hours: 8, hourly_rate: 200,
    revenue: 16800, description: 'FY2025 tax preparation and lodgement for 3 entities',
    milestones: [
      { id: 'm1', name: 'Data collection', due: '2026-02-01', done: true },
      { id: 'm2', name: 'Draft returns', due: '2026-03-01', done: true },
      { id: 'm3', name: 'Client review & sign-off', due: '2026-03-15', done: false },
      { id: 'm4', name: 'Lodgement', due: '2026-03-31', done: false },
    ],
    tasks: [
      { id: 't1', title: 'Collect source documents', status: 'done', assignee: 'Maria L.', priority: 'high', hours: 8, due: '2026-02-01' },
      { id: 't2', title: 'Reconcile bank accounts', status: 'done', assignee: 'Maria L.', priority: 'high', hours: 16, due: '2026-02-10' },
      { id: 't3', title: 'Prepare Entity A return', status: 'done', assignee: 'Tom R.', priority: 'high', hours: 12, due: '2026-02-20' },
      { id: 't4', title: 'Prepare Entity B return', status: 'done', assignee: 'Tom R.', priority: 'high', hours: 12, due: '2026-02-25' },
      { id: 't5', title: 'Prepare Entity C return', status: 'review', assignee: 'Tom R.', priority: 'high', hours: 12, due: '2026-03-05' },
      { id: 't6', title: 'Client review meeting', status: 'todo', assignee: 'Maria L.', priority: 'medium', hours: 0, due: '2026-03-15' },
      { id: 't7', title: 'Lodge with ATO', status: 'todo', assignee: 'Tom R.', priority: 'urgent', hours: 0, due: '2026-03-31' },
    ],
  },
  {
    id: '3', name: 'ERP Migration', client: 'NovaTech Solutions', status: 'planning',
    start_date: '2026-04-01', due_date: '2026-09-30', budget: 120000, spent: 0,
    billable_hours: 0, non_billable_hours: 6, hourly_rate: 180,
    revenue: 0, description: 'Migrate from legacy ERP to Astra platform, including data migration and staff training',
    milestones: [
      { id: 'm1', name: 'Requirements gathering', due: '2026-04-30', done: false },
      { id: 'm2', name: 'Data migration plan', due: '2026-05-31', done: false },
      { id: 'm3', name: 'Parallel run', due: '2026-08-31', done: false },
      { id: 'm4', name: 'Go-live', due: '2026-09-30', done: false },
    ],
    tasks: [
      { id: 't1', title: 'Scope and requirements doc', status: 'in_progress', assignee: 'Sarah M.', priority: 'high', hours: 6, due: '2026-04-15' },
      { id: 't2', title: 'Legacy system audit', status: 'todo', assignee: 'Dev P.', priority: 'high', hours: 0, due: '2026-04-20' },
      { id: 't3', title: 'Data mapping document', status: 'todo', assignee: 'Dev P.', priority: 'medium', hours: 0, due: '2026-05-01' },
    ],
  },
  {
    id: '4', name: 'Q1 Advisory Report', client: 'GreenLeaf Organics', status: 'completed',
    start_date: '2026-01-05', due_date: '2026-02-28', budget: 8000, spent: 6800,
    billable_hours: 34, non_billable_hours: 4, hourly_rate: 200,
    revenue: 8000, description: 'Quarterly advisory report covering cash flow analysis, KPIs, and growth recommendations',
    milestones: [
      { id: 'm1', name: 'Data analysis', due: '2026-01-20', done: true },
      { id: 'm2', name: 'Draft report', due: '2026-02-10', done: true },
      { id: 'm3', name: 'Client presentation', due: '2026-02-20', done: true },
      { id: 'm4', name: 'Final delivery', due: '2026-02-28', done: true },
    ],
    tasks: [
      { id: 't1', title: 'Pull financial data', status: 'done', assignee: 'Maria L.', priority: 'high', hours: 6, due: '2026-01-15' },
      { id: 't2', title: 'KPI dashboard build', status: 'done', assignee: 'Li W.', priority: 'medium', hours: 10, due: '2026-01-25' },
      { id: 't3', title: 'Write advisory narrative', status: 'done', assignee: 'Tom R.', priority: 'high', hours: 8, due: '2026-02-05' },
      { id: 't4', title: 'Design presentation deck', status: 'done', assignee: 'James K.', priority: 'medium', hours: 6, due: '2026-02-15' },
      { id: 't5', title: 'Client meeting', status: 'done', assignee: 'Maria L.', priority: 'high', hours: 2, due: '2026-02-20' },
    ],
  },
  {
    id: '5', name: 'Payroll Outsource Setup', client: 'Swift Logistics', status: 'on_hold',
    start_date: '2026-02-15', due_date: '2026-05-31', budget: 22000, spent: 5400,
    billable_hours: 27, non_billable_hours: 3, hourly_rate: 200,
    revenue: 7200, description: 'Set up managed payroll for 85 employees across AU and NZ',
    milestones: [
      { id: 'm1', name: 'Employee data import', due: '2026-03-01', done: true },
      { id: 'm2', name: 'Parallel payroll run', due: '2026-04-15', done: false },
      { id: 'm3', name: 'Go-live', due: '2026-05-31', done: false },
    ],
    tasks: [
      { id: 't1', title: 'Import employee records', status: 'done', assignee: 'Maria L.', priority: 'high', hours: 12, due: '2026-02-28' },
      { id: 't2', title: 'Configure tax tables', status: 'done', assignee: 'Tom R.', priority: 'high', hours: 8, due: '2026-03-05' },
      { id: 't3', title: 'Test pay run — AU', status: 'in_progress', assignee: 'Tom R.', priority: 'high', hours: 4, due: '2026-03-15' },
      { id: 't4', title: 'Test pay run — NZ', status: 'todo', assignee: 'Tom R.', priority: 'high', hours: 0, due: '2026-03-20' },
      { id: 't5', title: 'Client sign-off on process', status: 'todo', assignee: 'Maria L.', priority: 'medium', hours: 0, due: '2026-04-01' },
    ],
  },
];

const StatCard = ({ label, value, sub, color = 'text-gray-900' }) => (
  <Card className="p-4">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={cn('text-xl font-bold', color)}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </Card>
);

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' } }),
};

export default function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [taskView, setTaskView] = useState('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [dragTask, setDragTask] = useState(null);
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await api.get('/projects/').catch(() => null);
      setProjects(res?.data?.projects || DEMO_PROJECTS);
    } catch { /* fallback */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = projects.filter(p => !filterStatus || p.status === filterStatus);

  const summary = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    total_budget: projects.reduce((s, p) => s + p.budget, 0),
    total_spent: projects.reduce((s, p) => s + p.spent, 0),
    total_revenue: projects.reduce((s, p) => s + p.revenue, 0),
    total_hours: projects.reduce((s, p) => s + p.billable_hours, 0),
    profit: projects.reduce((s, p) => s + (p.revenue - p.spent), 0),
  };

  const handleStatusChange = (projectId, newStatus) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    toast.success(`Project status updated to ${newStatus.replace('_', ' ')}`);
    if (selected?.id === projectId) setSelected(prev => ({ ...prev, status: newStatus }));
  };

  const handleTaskStatusChange = (projectId, taskId, newStatus) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t) };
    }));
    if (selected?.id === projectId) {
      setSelected(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t),
      }));
    }
  };

  const handleDragStart = (task) => setDragTask(task);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (newStatus) => {
    if (dragTask && selected) {
      handleTaskStatusChange(selected.id, dragTask.id, newStatus);
      toast.success(`"${dragTask.title}" moved to ${TASK_STATUS[newStatus]}`);
    }
    setDragTask(null);
  };

  const [createForm, setCreateForm] = useState({
    name: '', client: '', description: '', budget: '', hourly_rate: '200',
    start_date: '', due_date: '',
  });

  const handleCreate = () => {
    if (!createForm.name || !createForm.client) { toast.error('Name and client are required'); return; }
    const np = {
      id: String(Date.now()), ...createForm,
      budget: parseFloat(createForm.budget) || 0,
      hourly_rate: parseFloat(createForm.hourly_rate) || 200,
      status: 'planning', spent: 0, billable_hours: 0, non_billable_hours: 0,
      revenue: 0, milestones: [], tasks: [],
    };
    setProjects(prev => [np, ...prev]);
    setShowCreate(false);
    setCreateForm({ name: '', client: '', description: '', budget: '', hourly_rate: '200', start_date: '', due_date: '' });
    toast.success(`Project "${np.name}" created`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Project detail view
  if (selected) {
    const proj = selected;
    const budgetPct = pct(proj.spent, proj.budget);
    const milestonePct = proj.milestones.length ? pct(proj.milestones.filter(m => m.done).length, proj.milestones.length) : 0;
    const taskDone = proj.tasks.filter(t => t.status === 'done').length;
    const taskTotal = proj.tasks.length;
    const profitMargin = proj.revenue ? pct(proj.revenue - proj.spent, proj.revenue) : 0;

    return (
      <motion.div className="space-y-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">
              &larr;
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{proj.name}</h1>
              <p className="text-sm text-gray-500">{proj.client} &middot; {proj.start_date} — {proj.due_date}</p>
            </div>
            <Badge variant={STATUS_BADGE_VARIANT[proj.status]}>{proj.status.replace('_', ' ')}</Badge>
          </div>
          <div className="flex gap-2">
            {proj.status === 'planning' && (
              <Button size="sm" onClick={() => handleStatusChange(proj.id, 'active')}>Start Project</Button>
            )}
            {proj.status === 'active' && (
              <>
                <Button variant="outline" size="sm" className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" onClick={() => handleStatusChange(proj.id, 'on_hold')}>
                  Put On Hold
                </Button>
                <Button variant="success" size="sm" onClick={() => handleStatusChange(proj.id, 'completed')}>Mark Complete</Button>
              </>
            )}
            {proj.status === 'on_hold' && (
              <Button size="sm" onClick={() => handleStatusChange(proj.id, 'active')}>Resume Project</Button>
            )}
          </div>
        </motion.div>

        {proj.description && <motion.p variants={fadeUp} className="text-sm text-gray-600 -mt-2">{proj.description}</motion.p>}

        {/* Summary row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Budget" value={fmt(proj.budget)} />
          <StatCard label="Spent" value={fmt(proj.spent)} sub={`${budgetPct}% of budget`} color={budgetPct > 90 ? 'text-red-600' : budgetPct > 70 ? 'text-amber-600' : 'text-gray-900'} />
          <StatCard label="Revenue" value={fmt(proj.revenue)} color="text-green-600" />
          <StatCard label="Profit Margin" value={`${profitMargin}%`} color={profitMargin < 0 ? 'text-red-600' : profitMargin < 20 ? 'text-amber-600' : 'text-green-600'} />
          <StatCard label="Billable Hours" value={proj.billable_hours} sub={`${proj.non_billable_hours}h non-billable`} />
          <StatCard label="Tasks Done" value={`${taskDone}/${taskTotal}`} sub={`${pct(taskDone, taskTotal)}% complete`} />
        </motion.div>

        {/* Budget burn bar */}
        <motion.div variants={fadeUp}>
          <Card className="p-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Budget Utilisation</span>
              <span>{fmt(proj.spent)} of {fmt(proj.budget)} ({budgetPct}%)</span>
            </div>
            <Progress
              value={Math.min(budgetPct, 100)}
              className="h-3"
              indicatorClassName={cn(
                budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-blue-500'
              )}
            />
          </Card>
        </motion.div>

        {/* Milestones */}
        {proj.milestones.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Milestones</CardTitle>
                  <span className="text-xs text-gray-500">{milestonePct}% complete</span>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={milestonePct} className="h-2 mb-4" indicatorClassName="bg-green-500" />
                <div className="space-y-2">
                  {proj.milestones.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          const updated = { ...proj, milestones: proj.milestones.map(mm => mm.id === m.id ? { ...mm, done: !mm.done } : mm) };
                          setSelected(updated);
                          setProjects(prev => prev.map(p => p.id === proj.id ? updated : p));
                        }}
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                            m.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                          )}>
                          {m.done && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <span className={cn('text-sm', m.done ? 'text-gray-400 line-through' : 'text-gray-700')}>{m.name}</span>
                      </div>
                      <span className={cn('text-xs', m.done ? 'text-green-600' : new Date(m.due) < new Date() ? 'text-red-600' : 'text-gray-400')}>
                        {m.done ? 'Done' : m.due}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tasks section */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Tasks</CardTitle>
                <Tabs value={taskView} onValueChange={setTaskView}>
                  <TabsList className="h-8">
                    <TabsTrigger value="kanban" className="text-xs px-3 py-1">Kanban</TabsTrigger>
                    <TabsTrigger value="list" className="text-xs px-3 py-1">List</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {taskView === 'kanban' ? (
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(TASK_STATUS).map(([key, label]) => {
                    const colTasks = proj.tasks.filter(t => t.status === key);
                    return (
                      <div key={key} className={cn('rounded-xl border p-3 min-h-[200px]', TASK_COLORS[key])}
                        onDragOver={handleDragOver} onDrop={() => handleDrop(key)}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-semibold text-gray-600 uppercase">{label}</span>
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">{colTasks.length}</Badge>
                        </div>
                        <div className="space-y-2">
                          {colTasks.map(t => (
                            <motion.div
                              key={t.id}
                              draggable
                              onDragStart={() => handleDragStart(t)}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-white rounded-lg border p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                            >
                              <p className="text-sm font-medium text-gray-800 mb-1.5">{t.title}</p>
                              <div className="flex items-center justify-between">
                                <Badge variant={PRIORITY_VARIANT[t.priority]} className="text-[10px] px-1.5 py-0.5">{t.priority}</Badge>
                                <span className="text-[10px] text-gray-400">{t.assignee}</span>
                              </div>
                              {t.hours > 0 && <p className="text-[10px] text-gray-400 mt-1">{t.hours}h logged</p>}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proj.tasks.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium text-gray-800">{t.title}</TableCell>
                        <TableCell className="text-gray-500">{t.assignee}</TableCell>
                        <TableCell>
                          <Badge variant={PRIORITY_VARIANT[t.priority]} className="text-[10px] px-1.5 py-0.5">{t.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select value={t.status} onValueChange={(val) => handleTaskStatusChange(proj.id, t.id, val)}>
                            <SelectTrigger className="h-7 w-[120px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(TASK_STATUS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-gray-500">{t.hours || '—'}</TableCell>
                        <TableCell className={cn(new Date(t.due) < new Date() && t.status !== 'done' ? 'text-red-600' : 'text-gray-500')}>{t.due}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Profitability summary */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Profitability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Revenue</p>
                  <p className="text-lg font-bold text-green-600">{fmt(proj.revenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Costs</p>
                  <p className="text-lg font-bold text-red-600">{fmt(proj.spent)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Profit</p>
                  <p className={cn('text-lg font-bold', proj.revenue - proj.spent >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {fmt(proj.revenue - proj.spent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Effective Rate</p>
                  <p className="text-lg font-bold text-gray-900">
                    {proj.billable_hours ? fmt(Math.round(proj.revenue / proj.billable_hours)) + '/hr' : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // Main list view
  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track budgets, tasks, milestones, and profitability</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Project</Button>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Projects" value={summary.total} />
        <StatCard label="Active" value={summary.active} color="text-blue-600" />
        <StatCard label="Total Budget" value={fmt(summary.total_budget)} />
        <StatCard label="Total Spent" value={fmt(summary.total_spent)} sub={`${pct(summary.total_spent, summary.total_budget)}% utilised`} />
        <StatCard label="Total Revenue" value={fmt(summary.total_revenue)} color="text-green-600" />
        <StatCard label="Net Profit" value={fmt(summary.profit)} color={summary.profit >= 0 ? 'text-green-600' : 'text-red-600'} />
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex gap-2 flex-wrap">
        {['', 'planning', 'active', 'on_hold', 'completed', 'cancelled'].map(s => (
          <Button
            key={s}
            variant={filterStatus === s ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus(s)}
          >
            {s ? s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All'}
          </Button>
        ))}
      </motion.div>

      {/* Project cards */}
      <div className="space-y-3">
        {filtered.map((proj, index) => {
          const budgetPct = pct(proj.spent, proj.budget);
          const taskDone = proj.tasks.filter(t => t.status === 'done').length;
          const taskTotal = proj.tasks.length;
          const taskPct = pct(taskDone, taskTotal);
          const milestoneDone = proj.milestones.filter(m => m.done).length;
          const milestoneTotal = proj.milestones.length;

          return (
            <motion.div key={proj.id} custom={index} variants={fadeUp}>
              <Card
                className="p-5 cursor-pointer"
                onClick={() => setSelected(proj)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{proj.name}</h3>
                      <Badge variant={STATUS_BADGE_VARIANT[proj.status]} className="text-[10px]">
                        {proj.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{proj.client} &middot; {proj.start_date} — {proj.due_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{fmt(proj.budget)}</p>
                    <p className="text-xs text-gray-400">budget</p>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Budget</span>
                      <span>{budgetPct}%</span>
                    </div>
                    <Progress
                      value={Math.min(budgetPct, 100)}
                      className="h-1.5"
                      indicatorClassName={cn(
                        budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-blue-500'
                      )}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Tasks</span>
                      <span>{taskDone}/{taskTotal}</span>
                    </div>
                    <Progress value={taskPct} className="h-1.5" indicatorClassName="bg-green-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Milestones</span>
                      <span>{milestoneDone}/{milestoneTotal}</span>
                    </div>
                    <Progress value={pct(milestoneDone, milestoneTotal)} className="h-1.5" indicatorClassName="bg-purple-500" />
                  </div>
                </div>

                {/* Bottom stats */}
                <div className="flex gap-6 text-xs text-gray-500">
                  <span>{proj.billable_hours}h billable</span>
                  <span>Revenue: {fmt(proj.revenue)}</span>
                  <span className={proj.revenue - proj.spent >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Profit: {fmt(proj.revenue - proj.spent)}
                  </span>
                  <span>Margin: {proj.revenue ? pct(proj.revenue - proj.spent, proj.revenue) + '%' : '—'}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <motion.div variants={fadeUp}>
          <Card className="text-center py-16">
            <p className="text-gray-400 text-lg mb-2">No projects match this filter</p>
            <Button variant="link" onClick={() => setFilterStatus('')}>Show all projects</Button>
          </Card>
        </motion.div>
      )}

      {/* Create modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
              <Input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Annual Audit — Acme Corp" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <Input value={createForm.client} onChange={e => setCreateForm(f => ({ ...f, client: e.target.value }))}
                  placeholder="Client name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <Input type="number" value={createForm.budget} onChange={e => setCreateForm(f => ({ ...f, budget: e.target.value }))}
                  placeholder="45000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                <Input type="date" value={createForm.start_date} onChange={e => setCreateForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                <Input type="date" value={createForm.due_date} onChange={e => setCreateForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly rate</label>
              <Input type="number" value={createForm.hourly_rate} onChange={e => setCreateForm(f => ({ ...f, hourly_rate: e.target.value }))}
                placeholder="200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                className={cn(
                  'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors',
                  'placeholder:text-gray-400 focus:border-astra-500 focus:outline-none focus:ring-2 focus:ring-astra-500/20'
                )}
                rows={2} placeholder="Brief project description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
