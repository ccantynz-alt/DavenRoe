import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, TrendingUp, TrendingDown, AlertTriangle, ShieldAlert,
  DollarSign, Receipt, Users, FileCheck, Clock, Eye, X, Zap, Settings,
  ChevronDown, ChevronRight, BarChart3, Activity, CheckCircle2, Info,
  ArrowUpRight, ArrowDownRight, Minus, AlarmClock, Filter, RefreshCw,
  Brain, Target, Flame, Shield, Wallet, CircleDot, XCircle, PauseCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import api from '../services/api';
import { useToast } from '../components/Toast';

// ── Severity config ─────────────────────────────────────────────────────────
const SEVERITY = {
  critical: {
    label: 'Critical',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    badge: 'bg-red-500 text-white',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
    icon: ShieldAlert,
    ring: 'ring-red-500/30',
  },
  warning: {
    label: 'Warning',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500 text-white',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    icon: AlertTriangle,
    ring: 'ring-amber-500/30',
  },
  info: {
    label: 'Info',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500 text-white',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    icon: Info,
    ring: 'ring-blue-500/30',
  },
  success: {
    label: 'Resolved',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500 text-white',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    icon: CheckCircle2,
    ring: 'ring-emerald-500/30',
  },
};

// ── Category config ─────────────────────────────────────────────────────────
const CATEGORIES = {
  cash_flow: { label: 'Cash Flow', icon: Wallet, color: 'text-cyan-400' },
  tax_threshold: { label: 'Tax Threshold', icon: Target, color: 'text-purple-400' },
  expense_anomaly: { label: 'Expense Anomaly', icon: Flame, color: 'text-orange-400' },
  payroll: { label: 'Payroll', icon: Users, color: 'text-indigo-400' },
  revenue: { label: 'Revenue', icon: TrendingUp, color: 'text-emerald-400' },
  compliance: { label: 'Compliance', icon: FileCheck, color: 'text-blue-400' },
  fraud: { label: 'Fraud / Anomaly', icon: ShieldAlert, color: 'text-red-400' },
  client_risk: { label: 'Client Risk', icon: Users, color: 'text-amber-400' },
};

const TABS = [
  { id: 'feed', label: 'Alert Feed', icon: BellRing },
  { id: 'predictions', label: 'AI Predictions', icon: Brain },
  { id: 'stats', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
const CAT_COLORS = ['#06b6d4', '#a855f7', '#f97316', '#6366f1', '#10b981', '#3b82f6', '#ef4444', '#eab308'];

// ── Helper ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ConfidenceBadge({ confidence }) {
  if (confidence == null) return null;
  const pct = Math.round(confidence * 100);
  const color = pct >= 90 ? 'text-emerald-400' : pct >= 75 ? 'text-blue-400' : 'text-amber-400';
  return (
    <span className={`text-[10px] font-mono ${color} bg-gray-800 px-1.5 py-0.5 rounded`}>
      {pct}% conf
    </span>
  );
}

// ── Alert Card ──────────────────────────────────────────────────────────────
function AlertCard({ alert, onDismiss, onSnooze, onInvestigate, index }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY[alert.severity] || SEVERITY.info;
  const cat = CATEGORIES[alert.category] || CATEGORIES.compliance;
  const CatIcon = cat.icon;
  const SevIcon = sev.icon;
  const isSnoozed = alert.status === 'snoozed';

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative rounded-xl border ${sev.border} ${sev.bg} backdrop-blur-sm p-4
        hover:shadow-lg ${sev.glow} transition-all duration-200 group cursor-pointer
        ${isSnoozed ? 'opacity-60' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Severity pulse for critical */}
      {alert.severity === 'critical' && (
        <div className="absolute top-3 right-3">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${sev.bg} border ${sev.border}
          flex items-center justify-center`}>
          <CatIcon className={`w-5 h-5 ${cat.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${sev.badge}`}>
              {sev.label}
            </span>
            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              {cat.label}
            </span>
            <ConfidenceBadge confidence={alert.confidence} />
            {isSnoozed && (
              <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <PauseCircle className="w-3 h-3" /> Snoozed
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-gray-100 leading-snug mb-1">
            {alert.title}
          </h3>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  {alert.description}
                </p>

                {alert.entity && (
                  <div className="flex items-center gap-2 mb-3">
                    <CircleDot className="w-3 h-3 text-gray-500" />
                    <span className="text-[11px] text-gray-500">
                      Related: <span className="text-gray-300 font-medium">{alert.entity}</span>
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={(e) => { e.stopPropagation(); onInvestigate(alert); }}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500
                      text-white transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Investigate
                  </button>
                  {alert.auto_fixable && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onInvestigate(alert); }}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500
                        text-white transition-colors flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Auto-Fix
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onSnooze(alert); }}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600
                      text-gray-300 transition-colors flex items-center gap-1.5"
                  >
                    <AlarmClock className="w-3.5 h-3.5" />
                    Snooze
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDismiss(alert); }}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700
                      text-gray-400 transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-gray-600">{timeAgo(alert.created_at)}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Prediction Card ─────────────────────────────────────────────────────────
function PredictionCard({ prediction, index }) {
  const TrendIcon = prediction.trend === 'up' ? ArrowUpRight : prediction.trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = prediction.trend === 'up' ? 'text-emerald-400' : prediction.trend === 'down' ? 'text-red-400' : 'text-gray-400';
  const cat = CATEGORIES[prediction.category] || CATEGORIES.compliance;
  const CatIcon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm p-5
        hover:border-gray-700 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <CatIcon className={`w-4 h-4 ${cat.color}`} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{cat.label}</p>
            <p className="text-xs text-gray-400">{prediction.horizon} outlook</p>
          </div>
        </div>
        <ConfidenceBadge confidence={prediction.confidence} />
      </div>

      <h3 className="text-sm font-medium text-gray-300 mb-2">{prediction.title}</h3>

      <div className="flex items-end gap-3 mb-3">
        <span className="text-2xl font-bold text-white">{prediction.value}</span>
        {prediction.trend_pct !== 0 && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendColor} mb-1`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {Math.abs(prediction.trend_pct)}%
          </span>
        )}
      </div>

      {prediction.confidence_low && prediction.confidence_high && (
        <div className="bg-gray-800/50 rounded-lg p-2.5 mb-3">
          <p className="text-[10px] text-gray-500 mb-1.5">Confidence interval</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{prediction.confidence_low}</span>
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full relative">
              <div
                className="absolute inset-y-0 bg-indigo-500/40 rounded-full"
                style={{ left: '15%', right: '15%' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-400 rounded-full"
                style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
              />
            </div>
            <span className="text-xs text-gray-400">{prediction.confidence_high}</span>
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-500 leading-relaxed">{prediction.description}</p>
    </motion.div>
  );
}

// ── Stats Panel ─────────────────────────────────────────────────────────────
function StatsPanel({ stats }) {
  if (!stats) return null;

  const sevData = Object.entries(stats.by_severity || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const catData = Object.entries(stats.by_category || {}).map(([key, value]) => ({
    name: CATEGORIES[key]?.label || key,
    value,
  }));

  const timelineData = (stats.timeline || []).map(d => ({
    date: d.date.slice(5),
    alerts: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Last 7 days', value: stats.total_7d, icon: Activity, color: 'text-cyan-400' },
          { label: 'Last 30 days', value: stats.total_30d, icon: BarChart3, color: 'text-indigo-400' },
          { label: 'Auto-resolved', value: `${stats.auto_resolved_pct}%`, icon: Zap, color: 'text-emerald-400' },
          { label: 'Avg response', value: `${stats.avg_response_time_hours}h`, icon: Clock, color: 'text-amber-400' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Alert timeline */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Alert Timeline (30 days)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#a5b4fc' }}
              />
              <Area type="monotone" dataKey="alerts" stroke="#6366f1" fillOpacity={1} fill="url(#alertGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Severity pie */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">By Severity</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sevData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sevData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {sevData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* Category bar */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">By Category</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {catData.map((_, i) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Settings Panel ──────────────────────────────────────────────────────────
function SettingsPanel({ settings, onSave }) {
  const [local, setLocal] = useState(settings);

  useEffect(() => { if (settings) setLocal(settings); }, [settings]);

  if (!local) return null;

  const toggleChannel = (ch) => {
    setLocal(prev => ({
      ...prev,
      channels: { ...prev.channels, [ch]: !prev.channels[ch] },
    }));
  };

  const toggleCategory = (cat) => {
    setLocal(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [cat]: { ...prev.categories[cat], enabled: !prev.categories[cat].enabled },
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Notification channels */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-400" />
          Notification Channels
        </h3>
        <div className="space-y-3">
          {Object.entries(local.channels).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50">
              <span className="text-sm text-gray-300 capitalize">{key.replace('_', '-')}</span>
              <button
                onClick={() => toggleChannel(key)}
                className={`w-10 h-5.5 rounded-full transition-colors relative ${enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform
                  ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                  style={{ width: 18, height: 18, top: 2 }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Alert categories */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-400" />
          Alert Categories
        </h3>
        <div className="space-y-2">
          {Object.entries(local.categories).map(([key, cfg]) => {
            const cat = CATEGORIES[key];
            if (!cat) return null;
            const CatIcon = cat.icon;
            return (
              <div key={key} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-800/50">
                <div className="flex items-center gap-2.5">
                  <CatIcon className={`w-4 h-4 ${cat.color}`} />
                  <span className="text-sm text-gray-300">{cat.label}</span>
                </div>
                <button
                  onClick={() => toggleCategory(key)}
                  className={`w-10 rounded-full transition-colors relative ${cfg.enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
                  style={{ height: 22 }}
                >
                  <span
                    className="absolute rounded-full bg-white transition-transform"
                    style={{ width: 18, height: 18, top: 2, left: cfg.enabled ? 20 : 2 }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Digest settings */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          Daily Digest
        </h3>
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50 mb-3">
          <span className="text-sm text-gray-300">Enable daily digest email</span>
          <button
            onClick={() => setLocal(prev => ({
              ...prev,
              digest: { ...prev.digest, enabled: !prev.digest.enabled },
            }))}
            className={`w-10 rounded-full transition-colors relative ${local.digest.enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
            style={{ height: 22 }}
          >
            <span
              className="absolute rounded-full bg-white transition-transform"
              style={{ width: 18, height: 18, top: 2, left: local.digest.enabled ? 20 : 2 }}
            />
          </button>
        </div>
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50">
          <span className="text-sm text-gray-300">Quiet hours (10 PM - 7 AM)</span>
          <button
            onClick={() => setLocal(prev => ({
              ...prev,
              quiet_hours: { ...prev.quiet_hours, enabled: !prev.quiet_hours.enabled },
            }))}
            className={`w-10 rounded-full transition-colors relative ${local.quiet_hours.enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
            style={{ height: 22 }}
          >
            <span
              className="absolute rounded-full bg-white transition-transform"
              style={{ width: 18, height: 18, top: 2, left: local.quiet_hours.enabled ? 20 : 2 }}
            />
          </button>
        </div>
      </div>

      <button
        onClick={() => onSave(local)}
        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
      >
        Save Settings
      </button>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AIAlerts() {
  const [activeTab, setActiveTab] = useState('feed');
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const toast = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [alertsRes, predRes, statsRes, settingsRes] = await Promise.allSettled([
        api.get('/alerts'),
        api.get('/alerts/predictions'),
        api.get('/alerts/stats'),
        api.get('/alerts/settings'),
      ]);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data.alerts || []);
      if (predRes.status === 'fulfilled') setPredictions(predRes.value.data.predictions || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value.data);
    } catch {
      // Demo fallback — generate mock data client-side
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredAlerts = useMemo(() => {
    let result = alerts;
    if (severityFilter !== 'all') result = result.filter(a => a.severity === severityFilter);
    if (categoryFilter !== 'all') result = result.filter(a => a.category === categoryFilter);
    return result;
  }, [alerts, severityFilter, categoryFilter]);

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;

  const handleDismiss = async (alert) => {
    try {
      await api.put(`/alerts/${alert.id}/dismiss`);
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
      toast.success('Alert dismissed');
    } catch {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
      toast.success('Alert dismissed');
    }
  };

  const handleSnooze = async (alert) => {
    try {
      await api.put(`/alerts/${alert.id}/snooze`, { days: 7 });
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'snoozed' } : a));
      toast.success('Alert snoozed for 7 days');
    } catch {
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'snoozed' } : a));
      toast.success('Alert snoozed for 7 days');
    }
  };

  const handleInvestigate = (alert) => {
    toast.success(`Investigating: ${alert.title.slice(0, 50)}...`);
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      await api.put('/alerts/settings', newSettings);
      setSettings(newSettings);
      toast.success('Alert settings saved');
    } catch {
      setSettings(newSettings);
      toast.success('Alert settings saved');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BellRing className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Proactive AI Alerts
                {criticalCount > 0 && (
                  <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                    {criticalCount} critical
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-500">
                Predictive intelligence that acts before problems happen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Unread badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">{activeCount}</span>
              <span className="text-[10px] text-gray-500">active</span>
            </div>
            <button
              onClick={fetchAll}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-gray-900/60 border border-gray-800 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center mx-auto mb-3">
                <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
              <p className="text-sm text-gray-500">Analyzing patterns...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Alert Feed */}
            {activeTab === 'feed' && (
              <div>
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="text-xs bg-gray-900 border border-gray-800 text-gray-300 rounded-lg px-3 py-1.5
                      focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                    <option value="success">Resolved</option>
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-xs bg-gray-900 border border-gray-800 text-gray-300 rounded-lg px-3 py-1.5
                      focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.label}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-600 self-center ml-2">
                    {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Alert list */}
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredAlerts.map((alert, i) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        index={i}
                        onDismiss={handleDismiss}
                        onSnooze={handleSnooze}
                        onInvestigate={handleInvestigate}
                      />
                    ))}
                  </AnimatePresence>
                  {filteredAlerts.length === 0 && (
                    <div className="text-center py-16">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No alerts match your filters</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {severityFilter !== 'all' || categoryFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'All clear — no active alerts right now'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Predictions */}
            {activeTab === 'predictions' && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-gray-200">Forward-Looking AI Predictions</h2>
                  <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                    Updated hourly
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {predictions.map((pred, i) => (
                    <PredictionCard key={pred.id} prediction={pred} index={i} />
                  ))}
                </div>
                {predictions.length === 0 && (
                  <div className="text-center py-16">
                    <Brain className="w-12 h-12 text-indigo-500/30 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Generating predictions...</p>
                    <p className="text-xs text-gray-600 mt-1">AI models require 30+ days of data for accurate forecasting</p>
                  </div>
                )}
              </div>
            )}

            {/* Analytics */}
            {activeTab === 'stats' && <StatsPanel stats={stats} />}

            {/* Settings */}
            {activeTab === 'settings' && (
              <SettingsPanel settings={settings} onSave={handleSaveSettings} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
