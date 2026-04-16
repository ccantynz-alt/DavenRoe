import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, FileText, Building2,
  ShieldCheck, Users, Clock, AlertTriangle, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Plus, Zap, MessageSquare,
  Receipt, Wallet, Globe, ChevronRight, Sparkles,
  Activity, CircleDot, RefreshCw, Send, BarChart3,
  CalendarClock, BrainCircuit, Landmark, UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Animation Variants ────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ─── Mock Data ─────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const CASH_FLOW_MONTHLY = [
  { name: 'May', inflow: 82400, outflow: 61200 },
  { name: 'Jun', inflow: 91800, outflow: 67500 },
  { name: 'Jul', inflow: 78300, outflow: 59800 },
  { name: 'Aug', inflow: 95200, outflow: 72100 },
  { name: 'Sep', inflow: 88600, outflow: 64300 },
  { name: 'Oct', inflow: 104500, outflow: 78900 },
  { name: 'Nov', inflow: 97800, outflow: 71200 },
  { name: 'Dec', inflow: 112400, outflow: 84600 },
  { name: 'Jan', inflow: 86900, outflow: 68400 },
  { name: 'Feb', inflow: 93200, outflow: 69800 },
  { name: 'Mar', inflow: 108700, outflow: 76500 },
  { name: 'Apr', inflow: 118200, outflow: 82100 },
];

const CASH_FLOW_WEEKLY = [
  { name: 'W1', inflow: 24800, outflow: 18200 },
  { name: 'W2', inflow: 31200, outflow: 22400 },
  { name: 'W3', inflow: 27600, outflow: 19800 },
  { name: 'W4', inflow: 34600, outflow: 21700 },
];

const CASH_FLOW_QUARTERLY = [
  { name: 'Q1 25', inflow: 252500, outflow: 188500 },
  { name: 'Q2 25', inflow: 274200, outflow: 196600 },
  { name: 'Q3 25', inflow: 292300, outflow: 215200 },
  { name: 'Q4 25', inflow: 314900, outflow: 234700 },
];

const SPARKLINE_REVENUE = [
  { v: 72 }, { v: 78 }, { v: 74 }, { v: 82 }, { v: 88 }, { v: 91 }, { v: 97 }, { v: 104 },
];
const SPARKLINE_INVOICES = [
  { v: 14 }, { v: 18 }, { v: 12 }, { v: 22 }, { v: 19 }, { v: 16 }, { v: 21 }, { v: 18 },
];
const SPARKLINE_BANK = [
  { v: 142 }, { v: 138 }, { v: 145 }, { v: 152 }, { v: 148 }, { v: 157 }, { v: 163 }, { v: 168 },
];
const SPARKLINE_CLIENTS = [
  { v: 38 }, { v: 40 }, { v: 42 }, { v: 41 }, { v: 44 }, { v: 46 }, { v: 48 }, { v: 52 },
];
const SPARKLINE_TASKS = [
  { v: 8 }, { v: 6 }, { v: 9 }, { v: 5 }, { v: 7 }, { v: 4 }, { v: 3 }, { v: 2 },
];
const SPARKLINE_COMPLIANCE = [
  { v: 88 }, { v: 90 }, { v: 92 }, { v: 91 }, { v: 94 }, { v: 96 }, { v: 97 }, { v: 98 },
];

const METRICS = [
  {
    label: 'Total Revenue',
    value: '$104,280',
    change: '+12.4%',
    trend: 'up',
    icon: DollarSign,
    color: 'emerald',
    sparkline: SPARKLINE_REVENUE,
  },
  {
    label: 'Outstanding Invoices',
    value: '$18,420',
    change: '-8.2%',
    trend: 'down',
    icon: FileText,
    color: 'violet',
    sparkline: SPARKLINE_INVOICES,
    subtitle: '12 invoices',
  },
  {
    label: 'Bank Balance',
    value: '$168,340',
    change: '+3.6%',
    trend: 'up',
    icon: Landmark,
    color: 'sky',
    sparkline: SPARKLINE_BANK,
  },
  {
    label: 'Active Clients',
    value: '52',
    change: '+6',
    trend: 'up',
    icon: Users,
    color: 'amber',
    sparkline: SPARKLINE_CLIENTS,
    subtitle: 'this quarter',
  },
  {
    label: 'Overdue Tasks',
    value: '2',
    change: '-75%',
    trend: 'down',
    icon: Clock,
    color: 'rose',
    sparkline: SPARKLINE_TASKS,
  },
  {
    label: 'Compliance Score',
    value: '98%',
    change: '+2pts',
    trend: 'up',
    icon: ShieldCheck,
    color: 'indigo',
    sparkline: SPARKLINE_COMPLIANCE,
  },
];

const ACTIVITY = [
  { id: 1, text: 'Invoice #1024 paid', detail: '$4,500 from Meridian Corp', time: '2m ago', icon: CheckCircle2, color: 'text-emerald-400' },
  { id: 2, text: 'Bank feed synced', detail: '23 new transactions imported', time: '18m ago', icon: RefreshCw, color: 'text-sky-400' },
  { id: 3, text: 'BAS Q3 filed successfully', detail: 'Australian Tax Office', time: '1h ago', icon: Send, color: 'text-violet-400' },
  { id: 4, text: 'Payroll processed', detail: '14 employees — $48,200 total', time: '3h ago', icon: Wallet, color: 'text-amber-400' },
  { id: 5, text: 'New client onboarded', detail: 'Vertex Solutions Pty Ltd', time: '5h ago', icon: UserCheck, color: 'text-indigo-400' },
  { id: 6, text: 'Receipt matched', detail: '34 receipts auto-matched by AI', time: '6h ago', icon: Receipt, color: 'text-teal-400' },
];

const AI_INSIGHTS = [
  {
    severity: 'warning',
    title: 'Anomaly detected',
    text: 'Duplicate payment of $2,100 to vendor REF#4821 — flagged for review',
    icon: AlertTriangle,
  },
  {
    severity: 'success',
    title: 'Cash flow projection',
    text: 'Positive cash position for the next 90 days based on current trajectory',
    icon: TrendingUp,
  },
  {
    severity: 'info',
    title: '3 invoices overdue > 30 days',
    text: '$12,400 total outstanding — automated chase sequence initiated',
    icon: FileText,
  },
  {
    severity: 'insight',
    title: 'Revenue trend',
    text: 'Practice revenue up 12.4% month-over-month — strongest Q1 growth in 2 years',
    icon: Sparkles,
  },
];

const QUICK_ACTIONS = [
  { label: 'Create Invoice', icon: FileText, route: '/invoicing', color: 'from-indigo-500/20 to-indigo-600/10' },
  { label: 'Record Expense', icon: Receipt, route: '/banking', color: 'from-emerald-500/20 to-emerald-600/10' },
  { label: 'Run Payroll', icon: Wallet, route: '/payroll', color: 'from-violet-500/20 to-violet-600/10' },
  { label: 'Ask Astra', icon: BrainCircuit, route: '/ask', color: 'from-amber-500/20 to-amber-600/10' },
];

const COMPLIANCE = [
  { jurisdiction: 'AU', flag: '🇦🇺', label: 'Australia', next: 'BAS Q4', deadline: 'Apr 28, 2026', days: 23, status: 'on-track' },
  { jurisdiction: 'NZ', flag: '🇳🇿', label: 'New Zealand', next: 'GST Return', deadline: 'May 7, 2026', days: 32, status: 'on-track' },
  { jurisdiction: 'UK', flag: '🇬🇧', label: 'United Kingdom', next: 'VAT Return', deadline: 'Apr 12, 2026', days: 7, status: 'attention' },
  { jurisdiction: 'US', flag: '🇺🇸', label: 'United States', next: 'Q1 941', deadline: 'Apr 30, 2026', days: 25, status: 'on-track' },
];

const TEAM = [
  { name: 'Sarah Chen', role: 'Senior Accountant', task: 'Month-end close — Vertex Solutions', utilization: 92, online: true },
  { name: 'James Liu', role: 'Tax Specialist', task: 'BAS preparation — 3 clients', utilization: 87, online: true },
  { name: 'Emma Wilson', role: 'Bookkeeper', task: 'Bank reconciliation — Meridian Corp', utilization: 78, online: true },
  { name: 'Tom Richards', role: 'Junior Accountant', task: 'Invoice processing', utilization: 64, online: false },
];

const TOP_CLIENTS = [
  { name: 'Meridian Corp', revenue: 24800, pct: 100 },
  { name: 'Vertex Solutions', revenue: 18600, pct: 75 },
  { name: 'Atlas Industries', revenue: 14200, pct: 57 },
  { name: 'Pacific Trading Co', revenue: 11400, pct: 46 },
  { name: 'Quantum Health', revenue: 9800, pct: 40 },
];

// ─── Sub-Components ────────────────────────────────────────────────

function GlassCard({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      variants={item}
      className={`
        relative rounded-2xl border border-white/[0.06]
        bg-white/[0.03] backdrop-blur-md
        ${hover ? 'transition-all duration-300 hover:scale-[1.01] hover:border-white/[0.1] hover:bg-white/[0.05]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function Sparkline({ data, color, height = 32, width = 80 }) {
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const SPARK_COLORS = {
  emerald: '#34d399',
  violet: '#a78bfa',
  sky: '#38bdf8',
  amber: '#fbbf24',
  rose: '#fb7185',
  indigo: '#818cf8',
};

function MetricCard({ metric }) {
  const Icon = metric.icon;
  const isPositive = metric.trend === 'up' && !metric.label.includes('Overdue');
  const isGoodDown = metric.trend === 'down' && metric.label.includes('Overdue');
  const changeColor = isPositive || isGoodDown ? 'text-emerald-400' : 'text-rose-400';
  const ArrowIcon = metric.trend === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl bg-${metric.color}-500/10`}>
          <Icon className={`w-4 h-4 text-${metric.color}-400`} />
        </div>
        <Sparkline data={metric.sparkline} color={SPARK_COLORS[metric.color]} />
      </div>
      <p className="text-sm text-gray-400 mb-1">{metric.label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold text-white tracking-tight">{metric.value}</p>
        <div className={`flex items-center gap-0.5 text-xs font-medium ${changeColor}`}>
          <ArrowIcon className="w-3 h-3" />
          {metric.change}
        </div>
      </div>
      {metric.subtitle && (
        <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
      )}
    </GlassCard>
  );
}

function CashFlowTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-gray-900/95 backdrop-blur-lg p-3 shadow-2xl">
      <p className="text-xs text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300 capitalize">{p.name}:</span>
          <span className="text-white font-medium">${(p.value / 1000).toFixed(1)}k</span>
        </div>
      ))}
    </div>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    insight: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${styles[severity]}`}>
      {severity}
    </span>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [cashFlowPeriod, setCashFlowPeriod] = useState('monthly');

  const cashFlowData = useMemo(() => {
    if (cashFlowPeriod === 'weekly') return CASH_FLOW_WEEKLY;
    if (cashFlowPeriod === 'quarterly') return CASH_FLOW_QUARTERLY;
    return CASH_FLOW_MONTHLY;
  }, [cashFlowPeriod]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-screen pb-12"
    >
      {/* ─── Welcome Header ────────────────────────────────── */}
      <motion.div variants={item} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {getGreeting()}, Alex
            </h1>
            <p className="text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              <span className="mx-2 text-gray-600">|</span>
              <span className="text-gray-500">Rae & Associates</span>
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <p className="text-sm text-indigo-200">
              Practice revenue is <span className="text-indigo-300 font-semibold">up 12.4%</span> this month
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── Key Metrics ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {METRICS.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      {/* ─── Main Grid: Cash Flow + Activity ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Cash Flow Chart */}
        <GlassCard className="lg:col-span-2 p-6" hover={false}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Cash Flow</h2>
              <p className="text-sm text-gray-500">Inflows vs outflows over time</p>
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              {['weekly', 'monthly', 'quarterly'].map((p) => (
                <button
                  key={p}
                  onClick={() => setCashFlowPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 capitalize
                    ${cashFlowPeriod === p
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-gray-400 hover:text-gray-300 border border-transparent'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cashFlowData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f472b6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip content={<CashFlowTooltip />} />
              <Area
                type="monotone"
                dataKey="inflow"
                stroke="#818cf8"
                strokeWidth={2}
                fill="url(#inflowGrad)"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stroke="#f472b6"
                strokeWidth={2}
                fill="url(#outflowGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-full bg-indigo-400" />
              <span className="text-xs text-gray-400">Inflow</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-full bg-pink-400" />
              <span className="text-xs text-gray-400">Outflow</span>
            </div>
          </div>
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Activity className="w-4 h-4 text-gray-500" />
          </div>
          <div className="space-y-4">
            {ACTIVITY.map((a) => {
              const AIcon = a.icon;
              return (
                <div key={a.id} className="flex items-start gap-3 group">
                  <div className="mt-0.5">
                    <AIcon className={`w-4 h-4 ${a.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate">{a.text}</p>
                    <p className="text-xs text-gray-500 truncate">{a.detail}</p>
                  </div>
                  <span className="text-[10px] text-gray-600 whitespace-nowrap mt-0.5">{a.time}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/activity')}
            className="flex items-center gap-1 mt-5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all activity <ChevronRight className="w-3 h-3" />
          </button>
        </GlassCard>
      </div>

      {/* ─── AI Insights + Quick Actions ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* AI Insights */}
        <GlassCard className="lg:col-span-2 p-6" hover={false}>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 rounded-lg bg-violet-500/10">
              <BrainCircuit className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">AI Insights</h2>
          </div>
          <div className="space-y-3">
            {AI_INSIGHTS.map((insight, idx) => {
              const IIcon = insight.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="mt-0.5">
                    <IIcon className={`w-4 h-4 ${
                      insight.severity === 'warning' ? 'text-amber-400' :
                      insight.severity === 'success' ? 'text-emerald-400' :
                      insight.severity === 'info' ? 'text-sky-400' : 'text-violet-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-gray-200 font-medium">{insight.title}</p>
                      <SeverityBadge severity={insight.severity} />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{insight.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="p-6" hover={false}>
          <h2 className="text-lg font-semibold text-white mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const AIcon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.route)}
                  className={`
                    flex flex-col items-center gap-2.5 p-4 rounded-xl
                    bg-gradient-to-b ${action.color}
                    border border-white/[0.06]
                    hover:border-white/[0.12] hover:scale-[1.03]
                    transition-all duration-200
                    group
                  `}
                >
                  <AIcon className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
                  <span className="text-xs text-gray-400 group-hover:text-gray-200 font-medium transition-colors">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.04]">
            <button
              onClick={() => navigate('/ask')}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-sm text-gray-400 hover:text-gray-200"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Astra anything...</span>
            </button>
          </div>
        </GlassCard>
      </div>

      {/* ─── Compliance + Team + Top Clients ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Status */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-4 h-4 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Compliance</h2>
          </div>
          <div className="space-y-3">
            {COMPLIANCE.map((c) => (
              <div
                key={c.jurisdiction}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <span className="text-lg">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-200 font-medium">{c.next}</p>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      c.status === 'on-track' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`} />
                  </div>
                  <p className="text-xs text-gray-500">{c.deadline}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    c.days <= 7 ? 'text-amber-400' : c.days <= 14 ? 'text-yellow-400' : 'text-emerald-400'
                  }`}>
                    {c.days}d
                  </p>
                  <p className="text-[10px] text-gray-600">remaining</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/compliance')}
            className="flex items-center gap-1 mt-4 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View calendar <ChevronRight className="w-3 h-3" />
          </button>
        </GlassCard>

        {/* Team Overview */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Team</h2>
          </div>
          <div className="space-y-3">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs text-gray-300 font-medium">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {member.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-gray-950" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate">{member.name}</p>
                    <p className="text-[10px] text-gray-500">{member.role}</p>
                  </div>
                  <span className={`text-xs font-semibold ${
                    member.utilization >= 85 ? 'text-emerald-400' :
                    member.utilization >= 70 ? 'text-amber-400' : 'text-gray-500'
                  }`}>
                    {member.utilization}%
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 pl-9 truncate">{member.task}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Clients */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Top Clients</h2>
          </div>
          <div className="space-y-3">
            {TOP_CLIENTS.map((client, idx) => (
              <div key={client.name} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-mono w-4">{idx + 1}.</span>
                    <p className="text-sm text-gray-300 font-medium group-hover:text-gray-100 transition-colors">
                      {client.name}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400 font-medium">
                    ${(client.revenue / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="ml-6 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${client.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + idx * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-500/60 to-amber-400/40"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-1 mt-5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all clients <ChevronRight className="w-3 h-3" />
          </button>
        </GlassCard>
      </div>
    </motion.div>
  );
}
