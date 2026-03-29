import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

// ── Demo Data ──────────────────────────────────────────────────────────────────

const DEMO_CLIENTS = [
  { id: 1, name: 'Harbour Coffee Roasters', entity: 'Pty Ltd', jurisdiction: 'AU', lastActivity: 1, compliance: 'green', outstanding: 0, nextDeadline: '28 Mar — BAS Q3', risk: 0 },
  { id: 2, name: 'Kiwi Freight Solutions', entity: 'Ltd', jurisdiction: 'NZ', lastActivity: 2, compliance: 'green', outstanding: 1200, nextDeadline: '31 Mar — GST Return', risk: 1 },
  { id: 3, name: 'Melbourne Digital Agency', entity: 'Pty Ltd', jurisdiction: 'AU', lastActivity: 0, compliance: 'green', outstanding: 3400, nextDeadline: '21 Apr — PAYG', risk: 0 },
  { id: 4, name: 'Southland Timber Co', entity: 'Ltd', jurisdiction: 'NZ', lastActivity: 8, compliance: 'amber', outstanding: 5600, nextDeadline: '07 Apr — GST Return', risk: 2 },
  { id: 5, name: 'Brisbane Property Trust', entity: 'Trust', jurisdiction: 'AU', lastActivity: 3, compliance: 'green', outstanding: 0, nextDeadline: '28 Apr — BAS Q3', risk: 0 },
  { id: 6, name: 'Auckland Tech Ventures', entity: 'Ltd', jurisdiction: 'NZ', lastActivity: 14, compliance: 'red', outstanding: 8900, nextDeadline: '25 Mar — GST Return', risk: 4 },
  { id: 7, name: 'Outback Mining Services', entity: 'Pty Ltd', jurisdiction: 'AU', lastActivity: 5, compliance: 'amber', outstanding: 2100, nextDeadline: '28 Mar — BAS Q3', risk: 2 },
  { id: 8, name: 'Wellington Legal Partners', entity: 'LLP', jurisdiction: 'NZ', lastActivity: 1, compliance: 'green', outstanding: 0, nextDeadline: '15 Apr — PAYE', risk: 0 },
  { id: 9, name: 'Sydney Harbour Eats', entity: 'Pty Ltd', jurisdiction: 'AU', lastActivity: 22, compliance: 'red', outstanding: 12400, nextDeadline: '28 Mar — BAS Q3', risk: 5 },
  { id: 10, name: 'Christchurch Build Co', entity: 'Ltd', jurisdiction: 'NZ', lastActivity: 4, compliance: 'green', outstanding: 800, nextDeadline: '07 Apr — GST Return', risk: 1 },
  { id: 11, name: 'Gold Coast Surf School', entity: 'Sole Trader', jurisdiction: 'AU', lastActivity: 6, compliance: 'amber', outstanding: 1500, nextDeadline: '21 Apr — PAYG', risk: 2 },
  { id: 12, name: 'Tasman Agriculture Ltd', entity: 'Ltd', jurisdiction: 'NZ', lastActivity: 3, compliance: 'green', outstanding: 0, nextDeadline: '31 Mar — GST Return', risk: 0 },
];

const DEMO_DEADLINES = [
  { id: 1, client: 'Auckland Tech Ventures', filing: 'GST Return', due: '25 Mar 2026', status: 'overdue', daysLeft: -0 },
  { id: 2, client: 'Harbour Coffee Roasters', filing: 'BAS Q3', due: '28 Mar 2026', status: 'pending', daysLeft: 3 },
  { id: 3, client: 'Outback Mining Services', filing: 'BAS Q3', due: '28 Mar 2026', status: 'pending', daysLeft: 3 },
  { id: 4, client: 'Sydney Harbour Eats', filing: 'BAS Q3', due: '28 Mar 2026', status: 'filed', daysLeft: 3 },
  { id: 5, client: 'Kiwi Freight Solutions', filing: 'GST Return', due: '31 Mar 2026', status: 'pending', daysLeft: 6 },
  { id: 6, client: 'Tasman Agriculture Ltd', filing: 'GST Return', due: '31 Mar 2026', status: 'filed', daysLeft: 6 },
  { id: 7, client: 'Southland Timber Co', filing: 'GST Return', due: '07 Apr 2026', status: 'pending', daysLeft: 13 },
  { id: 8, client: 'Wellington Legal Partners', filing: 'PAYE', due: '15 Apr 2026', status: 'pending', daysLeft: 21 },
];

const DEMO_STAFF = [
  { id: 1, name: 'Sarah Mitchell', role: 'Senior Accountant', clients: 14, hours: 38, capacity: 40, status: 'active' },
  { id: 2, name: 'James Chen', role: 'Tax Specialist', clients: 11, hours: 42, capacity: 40, status: 'overloaded' },
  { id: 3, name: 'Emma Kapoor', role: 'Junior Accountant', clients: 9, hours: 32, capacity: 40, status: 'active' },
  { id: 4, name: 'Liam O\'Brien', role: 'Bookkeeper', clients: 8, hours: 28, capacity: 40, status: 'active' },
  { id: 5, name: 'Aroha Ngata', role: 'Practice Manager', clients: 5, hours: 36, capacity: 40, status: 'active' },
];

const DEMO_REVENUE = [
  { client: 'Brisbane Property Trust', revenue: 6800 },
  { client: 'Sydney Harbour Eats', revenue: 5200 },
  { client: 'Melbourne Digital Agency', revenue: 4900 },
  { client: 'Auckland Tech Ventures', revenue: 4600 },
  { client: 'Outback Mining Services', revenue: 4100 },
  { client: 'Southland Timber Co', revenue: 3800 },
  { client: 'Wellington Legal Partners', revenue: 3500 },
  { client: 'Harbour Coffee Roasters', revenue: 3200 },
  { client: 'Kiwi Freight Solutions', revenue: 2900 },
  { client: 'Tasman Agriculture Ltd', revenue: 2400 },
];

// ── Helper Components ──────────────────────────────────────────────────────────

function OverviewCard({ label, value, sub, icon, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-lg', colorMap[color])}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Card>
  );
}

function ComplianceBadge({ status }) {
  const map = {
    green: { variant: 'success', label: 'Compliant' },
    amber: { variant: 'warning', label: 'Attention' },
    red: { variant: 'destructive', label: 'Action Required' },
  };
  const s = map[status] || map.green;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function DeadlineStatusBadge({ status }) {
  const map = {
    filed: { variant: 'success', label: 'Filed' },
    pending: { variant: 'warning', label: 'Pending' },
    overdue: { variant: 'destructive', label: 'Overdue' },
  };
  const s = map[status] || map.pending;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PracticeDashboard() {
  const toast = useToast();

  // Client Health Grid state
  const [sortBy, setSortBy] = useState('risk');
  const [filterJurisdiction, setFilterJurisdiction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sort clients
  const sortedClients = [...DEMO_CLIENTS]
    .filter(c => filterJurisdiction === 'all' || c.jurisdiction === filterJurisdiction)
    .filter(c => filterStatus === 'all' || c.compliance === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'risk') return b.risk - a.risk;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'activity') return b.lastActivity - a.lastActivity;
      if (sortBy === 'deadline') return a.nextDeadline.localeCompare(b.nextDeadline);
      return 0;
    });

  const maxRevenue = Math.max(...DEMO_REVENUE.map(r => r.revenue));
  const totalRevenue = DEMO_REVENUE.reduce((s, r) => s + r.revenue, 0);

  const borderColor = (status) => {
    if (status === 'red') return 'border-l-red-500';
    if (status === 'amber') return 'border-l-amber-400';
    return 'border-l-emerald-500';
  };

  const handleQuickAction = (action) => {
    toast.success(`${action} initiated successfully. Processing in background.`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-bold">Practice Dashboard</h2>
          <p className="text-gray-500 mt-1">Manage your entire practice from one view</p>
        </div>
        <span className="text-sm text-gray-400">Last synced: 2 minutes ago</span>
      </div>

      {/* ── Practice Overview Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-6 mb-8">
        <OverviewCard label="Total Clients" value="47" sub="12 AU · 9 NZ · 14 UK · 12 US" icon="&#128101;" color="blue" />
        <OverviewCard label="Active This Month" value="38" sub="81% engagement rate" icon="&#128202;" color="green" />
        <OverviewCard label="Revenue MTD" value="$42,800" sub="+12% vs last month" icon="&#128176;" color="purple" />
        <OverviewCard label="Outstanding Invoices" value="$18,200" sub="14 invoices unpaid" icon="&#128196;" color="amber" />
        <OverviewCard label="Compliance Alerts" value="6" sub="2 overdue · 4 due soon" icon="&#9888;&#65039;" color="red" />
        <OverviewCard label="Staff Utilisation" value="78%" sub="5 team members" icon="&#9201;&#65039;" color="indigo" />
      </div>

      {/* ── Client Health Grid ──────────────────────────────────────────── */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Client Health Grid</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk">Sort: Highest Risk</SelectItem>
                  <SelectItem value="name">Sort: Name A-Z</SelectItem>
                  <SelectItem value="activity">Sort: Least Active</SelectItem>
                  <SelectItem value="deadline">Sort: Nearest Deadline</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterJurisdiction} onValueChange={setFilterJurisdiction}>
                <SelectTrigger className="w-[170px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="NZ">New Zealand</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[170px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="green">Compliant</SelectItem>
                  <SelectItem value="amber">Attention</SelectItem>
                  <SelectItem value="red">Action Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedClients.map((client, idx) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className={cn('border border-l-4 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer', borderColor(client.compliance))}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                    <p className="text-xs text-gray-400">{client.entity} · {client.jurisdiction}</p>
                  </div>
                  <ComplianceBadge status={client.compliance} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div>
                    <p className="text-gray-400">Last Activity</p>
                    <p className={cn('font-medium', client.lastActivity > 14 ? 'text-red-600' : client.lastActivity > 7 ? 'text-amber-600' : 'text-gray-700')}>
                      {client.lastActivity === 0 ? 'Today' : `${client.lastActivity}d ago`}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Outstanding</p>
                    <p className={cn('font-medium', client.outstanding > 5000 ? 'text-red-600' : client.outstanding > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                      {client.outstanding > 0 ? `$${client.outstanding.toLocaleString()}` : '\u2014'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Next Deadline</p>
                    <p className="font-medium text-gray-700">{client.nextDeadline}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {sortedClients.length === 0 && (
            <p className="text-center text-gray-400 py-8">No clients match the current filters.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Two-column: Compliance Timeline + Staff Workload ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Compliance Deadline Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Deadlines — Next 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DEMO_DEADLINES.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', d.status === 'filed' ? 'bg-emerald-500' : d.status === 'overdue' ? 'bg-red-500' : 'bg-amber-400')} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.client}</p>
                      <p className="text-xs text-gray-400">{d.filing}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-500">{d.due}</span>
                    <DeadlineStatusBadge status={d.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Staff Workload */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEMO_STAFF.map(s => {
                const util = Math.round((s.hours / s.capacity) * 100);
                const indicatorColor = util > 100 ? 'bg-red-500' : util > 85 ? 'bg-amber-500' : 'bg-blue-500';
                return (
                  <div key={s.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{s.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{s.role}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{s.clients} clients</span>
                        <span>{s.hours}/{s.capacity}h</span>
                        <span className={cn('font-semibold', util > 100 ? 'text-red-600' : util > 85 ? 'text-amber-600' : 'text-blue-600')}>
                          {util}%
                        </span>
                      </div>
                    </div>
                    <Progress value={Math.min(util, 100)} indicatorClassName={indicatorColor} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Two-column: Revenue by Client + Quick Actions ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue by Client */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Client — Top 10</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DEMO_REVENUE.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 truncate">{r.client}</span>
                      <span className="text-sm font-medium text-gray-900 flex-shrink-0 ml-2">${r.revenue.toLocaleString()}</span>
                    </div>
                    <Progress value={(r.revenue / maxRevenue) * 100} className="h-1.5" indicatorClassName="bg-blue-500" />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">
                    {((r.revenue / totalRevenue) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleQuickAction('Month-end close for all clients')}
                className="w-full justify-start gap-3 px-4 py-3 h-auto border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <span className="text-lg">&#128260;</span>
                Run Month-End Close for All Clients
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickAction('Compliance report generation')}
                className="w-full justify-start gap-3 px-4 py-3 h-auto border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              >
                <span className="text-lg">&#128203;</span>
                Generate Compliance Report
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickAction('Outstanding invoice reminders')}
                className="w-full justify-start gap-3 px-4 py-3 h-auto border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              >
                <span className="text-lg">&#128232;</span>
                Send Outstanding Invoice Reminders
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickAction('Bulk bank feed reconciliation')}
                className="w-full justify-start gap-3 px-4 py-3 h-auto border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
              >
                <span className="text-lg">&#127974;</span>
                Bulk Reconcile Bank Feeds
              </Button>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500">
                Quick actions run across all active clients. Processing typically completes within 2-5 minutes depending on the number of clients and transaction volume. You will receive a notification when complete.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
