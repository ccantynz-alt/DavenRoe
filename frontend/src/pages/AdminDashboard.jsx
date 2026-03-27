import { useState } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const TABS = ['Overview', 'Support', 'Users', 'System', 'Agents', 'Unit Economics', 'Operations Log'];

const MRR_DATA = [
  { month: 'Oct', value: 8400 },
  { month: 'Nov', value: 11200 },
  { month: 'Dec', value: 14800 },
  { month: 'Jan', value: 18500 },
  { month: 'Feb', value: 21100 },
  { month: 'Mar', value: 24350 },
];

const TICKETS = [
  { id: 'TK-1042', subject: 'Bank feed disconnected — ANZ AU', user: 'Sarah Chen', priority: 'high', status: 'open', created: '2026-03-25 09:14', aiStatus: null },
  { id: 'TK-1041', subject: 'Invoice PDF not rendering correctly', user: 'James Whitfield', priority: 'medium', status: 'in_progress', created: '2026-03-24 16:42', aiStatus: null },
  { id: 'TK-1040', subject: 'How to set up KiwiSaver rates?', user: 'Mei Lin', priority: 'low', status: 'auto_resolved', created: '2026-03-24 14:08', aiStatus: 'AI Resolved' },
  { id: 'TK-1039', subject: 'GST return showing wrong period', user: 'David Okonkwo', priority: 'high', status: 'open', created: '2026-03-24 11:30', aiStatus: null },
  { id: 'TK-1038', subject: 'Cannot add second entity to account', user: 'Rachel Torres', priority: 'medium', status: 'auto_resolved', created: '2026-03-23 22:17', aiStatus: 'AI Resolved' },
  { id: 'TK-1037', subject: 'Payroll tax calculation query — PAYG', user: 'Tom Bradley', priority: 'low', status: 'resolved', created: '2026-03-23 15:55', aiStatus: null },
];

const USERS = [
  { name: 'Sarah Chen', email: 'sarah@chenaccounting.com.au', plan: 'Practice', status: 'active', joined: '2025-11-02', mrr: 149, lastActive: '2 hours ago' },
  { name: 'James Whitfield', email: 'james@whitfieldadvisory.co.uk', plan: 'Firm', status: 'active', joined: '2025-10-18', mrr: 499, lastActive: '35 min ago' },
  { name: 'Mei Lin', email: 'mei@linbookkeeping.co.nz', plan: 'Solo', status: 'active', joined: '2026-01-09', mrr: 49, lastActive: '1 hour ago' },
  { name: 'David Okonkwo', email: 'david@okonkwo.com', plan: 'Practice', status: 'active', joined: '2025-12-14', mrr: 149, lastActive: '4 hours ago' },
  { name: 'Rachel Torres', email: 'rachel@torresgroup.com', plan: 'Enterprise', status: 'active', joined: '2025-09-22', mrr: 1200, lastActive: '12 min ago' },
  { name: 'Tom Bradley', email: 'tom@bradleytax.com.au', plan: 'Solo', status: 'active', joined: '2026-02-01', mrr: 49, lastActive: '1 day ago' },
  { name: 'Anika Sharma', email: 'anika@sharmafinance.com', plan: 'Practice', status: 'trial', joined: '2026-03-18', mrr: 0, lastActive: '3 hours ago' },
  { name: 'Marcus Webb', email: 'marcus@webbco.co.uk', plan: 'Firm', status: 'active', joined: '2025-11-30', mrr: 499, lastActive: '6 hours ago' },
  { name: 'Lisa Nguyen', email: 'lisa@nguyenpartners.com.au', plan: 'Solo', status: 'churned', joined: '2025-10-05', mrr: 0, lastActive: '14 days ago' },
  { name: 'Robert Kim', email: 'robert@kimadvisors.com', plan: 'Enterprise', status: 'active', joined: '2025-08-15', mrr: 1500, lastActive: '20 min ago' },
];

const AGENTS = [
  { name: 'Transaction Categorizer', status: 'active', tasks: 847, avgTime: '0.3s' },
  { name: 'Month-End Close Agent', status: 'idle', tasks: 3, avgTime: '4.2s' },
  { name: 'Compliance Monitor', status: 'active', tasks: 156, avgTime: '1.1s' },
  { name: 'Cash Flow Forecaster', status: 'active', tasks: 42, avgTime: '2.8s' },
  { name: 'Receipt OCR Scanner', status: 'active', tasks: 234, avgTime: '1.5s' },
  { name: 'Support Auto-Responder', status: 'active', tasks: 18, avgTime: '0.8s' },
  { name: 'Bank Feed Reconciler', status: 'active', tasks: 512, avgTime: '0.4s' },
  { name: 'Invoice Generator', status: 'idle', tasks: 67, avgTime: '1.2s' },
  { name: 'Anomaly Detector', status: 'active', tasks: 98, avgTime: '3.1s' },
  { name: 'Tax Withholding Calculator', status: 'active', tasks: 31, avgTime: '0.6s' },
  { name: 'Document Chaser', status: 'idle', tasks: 8, avgTime: '0.9s' },
  { name: 'Forensic Auditor', status: 'active', tasks: 4, avgTime: '8.4s' },
  { name: 'Client Relationship Agent', status: 'active', tasks: 15, avgTime: '1.3s' },
  { name: 'Profit Optimiser', status: 'active', tasks: 7, avgTime: '4.2s' },
  { name: 'Regulatory Change Monitor', status: 'active', tasks: 3, avgTime: '2.1s' },
  { name: 'Client Communications Agent', status: 'active', tasks: 11, avgTime: '2.8s' },
  { name: 'Scenario Modeller', status: 'idle', tasks: 3, avgTime: '5.2s' },
  { name: 'Health Scorer', status: 'active', tasks: 8, avgTime: '3.6s' },
  { name: 'Tax Advisory Agent', status: 'idle', tasks: 4, avgTime: '2.3s' },
  { name: 'Payroll Processor', status: 'idle', tasks: 0, avgTime: '7.1s' },
  { name: 'Vendor Intelligence', status: 'idle', tasks: 0, avgTime: '4.5s' },
  { name: 'Onboarding Agent', status: 'active', tasks: 2, avgTime: '12.3s' },
];

const OPS_LOG = [
  { time: '2026-03-25 10:42', action: 'Auto-resolved support ticket TK-1040', type: 'support', agent: 'Support Auto-Responder' },
  { time: '2026-03-25 10:38', action: 'Categorized 23 bank feed transactions for Sarah Chen', type: 'categorization', agent: 'Transaction Categorizer' },
  { time: '2026-03-25 10:15', action: 'Compliance deadline alert sent: AU BAS Q3 due April 28', type: 'compliance', agent: 'Compliance Monitor' },
  { time: '2026-03-25 09:58', action: 'Cash flow forecast updated for all active entities', type: 'forecast', agent: 'Cash Flow Forecaster' },
  { time: '2026-03-25 09:30', action: 'Auto-resolved support ticket TK-1038', type: 'support', agent: 'Support Auto-Responder' },
  { time: '2026-03-25 09:12', action: 'Scanned and categorized 7 receipts for David Okonkwo', type: 'ocr', agent: 'Receipt OCR Scanner' },
  { time: '2026-03-25 08:45', action: 'Anomaly detected: Unusual vendor payment pattern — flagged for review', type: 'anomaly', agent: 'Anomaly Detector' },
  { time: '2026-03-25 08:00', action: 'Scheduled month-end close initiated for February (3 entities)', type: 'close', agent: 'Month-End Close Agent' },
  { time: '2026-03-24 23:50', action: 'Trial expiry notification sent to Anika Sharma (7 days remaining)', type: 'notification', agent: 'Support Auto-Responder' },
  { time: '2026-03-24 22:30', action: 'Reconciled 156 bank feed transactions across 12 accounts', type: 'reconciliation', agent: 'Bank Feed Reconciler' },
  { time: '2026-03-24 20:15', action: 'Generated 4 recurring invoices for Marcus Webb', type: 'invoicing', agent: 'Invoice Generator' },
  { time: '2026-03-24 18:00', action: 'PAYG withholding recalculated for Q3 — 8 employees affected', type: 'tax', agent: 'Tax Withholding Calculator' },
  { time: '2026-03-24 16:45', action: 'Document chase email sent to 3 clients (missing bank statements)', type: 'chasing', agent: 'Document Chaser' },
  { time: '2026-03-24 14:20', action: 'Compliance alert: NZ GST return due April 7 for Mei Lin', type: 'compliance', agent: 'Compliance Monitor' },
  { time: '2026-03-24 12:00', action: 'Forensic Auditor agent encountered error — restarted automatically', type: 'error', agent: 'Forensic Auditor' },
];

const SYSTEM_HEALTH = [
  { label: 'API Response Time', value: '142ms', note: 'avg (p99: 380ms)', status: 'good' },
  { label: 'Uptime', value: '99.97%', note: 'last 30 days', status: 'good' },
  { label: 'Active Sessions', value: '23', note: 'right now', status: 'good' },
  { label: 'Database Size', value: '2.4 GB', note: 'Neon PostgreSQL', status: 'good' },
  { label: 'Bank Feed Connections', value: '156', note: 'active (Plaid/Basiq/TrueLayer)', status: 'good' },
  { label: 'Failed Jobs (24h)', value: '0', note: 'all clear', status: 'good' },
  { label: 'AI API Usage', value: '12,400 / 50,000', note: 'calls this month (24.8%)', status: 'good' },
];

function priorityColor(p) {
  if (p === 'high') return 'bg-red-100 text-red-700';
  if (p === 'medium') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
}

function statusColor(s) {
  if (s === 'open') return 'bg-orange-100 text-orange-700';
  if (s === 'in_progress') return 'bg-blue-100 text-blue-700';
  if (s === 'resolved') return 'bg-green-100 text-green-700';
  if (s === 'auto_resolved') return 'bg-emerald-100 text-emerald-700';
  return 'bg-gray-100 text-gray-600';
}

function statusLabel(s) {
  if (s === 'in_progress') return 'In Progress';
  if (s === 'auto_resolved') return 'Auto Resolved';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function userStatusColor(s) {
  if (s === 'active') return 'bg-green-100 text-green-700';
  if (s === 'trial') return 'bg-blue-100 text-blue-700';
  if (s === 'churned') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

function planColor(p) {
  if (p === 'Enterprise') return 'bg-purple-100 text-purple-700';
  if (p === 'Firm') return 'bg-indigo-100 text-indigo-700';
  if (p === 'Practice') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
}

function agentStatusDot(s) {
  if (s === 'active') return 'bg-green-500';
  if (s === 'idle') return 'bg-gray-400';
  return 'bg-red-500';
}

function opsTypeColor(t) {
  if (t === 'support') return 'bg-blue-100 text-blue-700';
  if (t === 'categorization') return 'bg-purple-100 text-purple-700';
  if (t === 'compliance') return 'bg-yellow-100 text-yellow-700';
  if (t === 'forecast') return 'bg-cyan-100 text-cyan-700';
  if (t === 'ocr') return 'bg-pink-100 text-pink-700';
  if (t === 'anomaly') return 'bg-red-100 text-red-700';
  if (t === 'close') return 'bg-green-100 text-green-700';
  if (t === 'notification') return 'bg-orange-100 text-orange-700';
  if (t === 'reconciliation') return 'bg-indigo-100 text-indigo-700';
  if (t === 'invoicing') return 'bg-emerald-100 text-emerald-700';
  if (t === 'tax') return 'bg-amber-100 text-amber-700';
  if (t === 'chasing') return 'bg-teal-100 text-teal-700';
  if (t === 'error') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [planFilter, setPlanFilter] = useState('All');
  const toast = useToast();

  const maxMRR = Math.max(...MRR_DATA.map(d => d.value));

  const filteredUsers = planFilter === 'All' ? USERS : USERS.filter(u => u.plan === planFilter);

  function handleAction(action, detail) {
    toast.showSuccess(`${action}: ${detail}`);
  }

  // --- OVERVIEW TAB ---
  function renderOverview() {
    return (
      <>
        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">MRR</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">$24,350</p>
            <p className="text-xs text-green-600 mt-1">+15.4% vs last month</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">ARR</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">$292,200</p>
            <p className="text-xs text-green-600 mt-1">Annualized run rate</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Subscribers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">87</p>
            <p className="text-xs text-gray-500 mt-1">42 Solo / 31 Practice / 12 Firm / 2 Enterprise</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Churn Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">1.8%</p>
            <p className="text-xs text-green-600 mt-1">Below 3% target</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trial Conversions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">34%</p>
            <p className="text-xs text-green-600 mt-1">This month</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Support Tickets</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">4</p>
            <p className="text-xs text-orange-600 mt-1">2 open / 2 in progress</p>
          </div>
        </div>

        {/* MRR Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">MRR Trend — Last 6 Months</h3>
          <div className="flex items-end gap-4 h-56">
            {MRR_DATA.map(d => (
              <div key={d.month} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-sm font-semibold text-gray-900 mb-1">${(d.value / 1000).toFixed(1)}K</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500"
                  style={{ height: `${(d.value / maxMRR) * 80}%`, minHeight: 16 }}
                />
                <span className="text-xs text-gray-500 mt-2 font-medium">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Agent Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Admin Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Admin Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => handleAction('Broadcast', 'Email composer opened')} className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Send Broadcast Email
              </button>
              <button onClick={() => handleAction('Health Check', 'All systems nominal')} className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Run System Health Check
              </button>
              <button onClick={() => handleAction('Export', 'Revenue report downloading')} className="flex items-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export Revenue Report
              </button>
              <button onClick={() => handleAction('Error Logs', 'Opening error log viewer')} className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                View Error Logs
              </button>
              <button onClick={() => handleAction('Agent Sweep', 'AI agent sweep triggered across all entities')} className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Trigger AI Agent Sweep
              </button>
            </div>
          </div>

          {/* Agent Fleet Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Fleet Summary</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{AGENTS.filter(a => a.status === 'active').length}</p>
                <p className="text-xs text-green-600 font-medium">Active</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{AGENTS.filter(a => a.status === 'idle').length}</p>
                <p className="text-xs text-gray-500 font-medium">Idle</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-700">{AGENTS.filter(a => a.status === 'error').length}</p>
                <p className="text-xs text-red-600 font-medium">Error</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{AGENTS.reduce((s, a) => s + a.tasks, 0).toLocaleString()}</span> total tasks completed in last 24 hours
            </p>
          </div>
        </div>
      </>
    );
  }

  // --- SUPPORT TAB ---
  function renderSupport() {
    return (
      <>
        {/* Support Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Open Tickets</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{TICKETS.filter(t => t.status === 'open').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Response Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">14 min</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">AI Resolution Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-1">78%</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">CSAT Score</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">4.8 / 5</p>
          </div>
        </div>

        {/* Ticket Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Ticket ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Subject</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">AI Response</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {TICKETS.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{t.id}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium max-w-xs truncate">{t.subject}</td>
                    <td className="px-4 py-3 text-gray-600">{t.user}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(t.priority)}`}>{t.priority}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(t.status)}`}>{statusLabel(t.status)}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.created}</td>
                    <td className="px-4 py-3">
                      {t.aiStatus ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{t.aiStatus}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleAction('Viewing ticket', t.id)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition">View</button>
                        <button onClick={() => handleAction('Responding to', t.id)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition">Respond</button>
                        <button onClick={() => handleAction('Closed ticket', t.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition">Close</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  // --- USERS TAB ---
  function renderUsers() {
    return (
      <>
        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-500 font-medium">Filter by plan:</span>
          {['All', 'Solo', 'Practice', 'Firm', 'Enterprise'].map(p => (
            <button
              key={p}
              onClick={() => setPlanFilter(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${planFilter === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* User Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">MRR</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Last Active</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(u => (
                  <tr key={u.email} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColor(u.plan)}`}>{u.plan}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${userStatusColor(u.status)}`}>{u.status}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.joined}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{u.mrr > 0 ? `$${u.mrr}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.lastActive}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleAction('Viewing user', u.name)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition">View</button>
                        <button onClick={() => handleAction('Suspended', u.name)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition">Suspend</button>
                        <button onClick={() => handleAction('Plan change for', u.name)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition">Upgrade</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  // --- SYSTEM TAB ---
  function renderSystem() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {SYSTEM_HEALTH.map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
              <span className="w-2 h-2 rounded-full bg-green-500" title="Healthy" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.note}</p>
          </div>
        ))}

        {/* AI Usage Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:col-span-2 lg:col-span-3 xl:col-span-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">AI API Usage — March 2026</h4>
            <span className="text-xs text-gray-500">12,400 / 50,000 calls</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-700" style={{ width: '24.8%' }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">24.8% consumed — on track for 19,800 calls by month-end (projected)</p>
        </div>
      </div>
    );
  }

  // --- AGENTS TAB ---
  function renderAgents() {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Agent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Tasks (24h)</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Avg Execution</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {AGENTS.map(a => (
                <tr key={a.name} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${agentStatusDot(a.status)}`} />
                      <span className={`text-xs font-medium capitalize ${a.status === 'error' ? 'text-red-600' : a.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>{a.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{a.tasks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{a.avgTime}</td>
                  <td className="px-4 py-3 text-right">
                    {a.status === 'error' ? (
                      <button onClick={() => handleAction('Restarting agent', a.name)} className="px-3 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition font-medium">Restart</button>
                    ) : a.status === 'idle' ? (
                      <button onClick={() => handleAction('Triggering agent', a.name)} className="px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium">Trigger</button>
                    ) : (
                      <button onClick={() => handleAction('Viewing logs for', a.name)} className="px-3 py-1 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium">Logs</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- OPERATIONS LOG TAB ---
  function renderOpsLog() {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {OPS_LOG.map((entry, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition">
              <div className="flex-shrink-0 mt-0.5">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${opsTypeColor(entry.type)}`}>
                  {entry.type}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{entry.action}</p>
                <p className="text-xs text-gray-500 mt-0.5">Agent: <span className="font-medium text-gray-600">{entry.agent}</span></p>
              </div>
              <div className="flex-shrink-0 text-xs text-gray-400 font-mono">{entry.time}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderUnitEconomics() {
    const tiers = [
      { name: 'Solo', price: 49, dbCost: 0.10, apiCost: 0.50, bandwidthCost: 0.05, stripeFee: 1.72, emailCost: 0.01, bankCost: 0 },
      { name: 'Practice', price: 149, dbCost: 0.20, apiCost: 1.00, bandwidthCost: 0.10, stripeFee: 4.62, emailCost: 0.03, bankCost: 0.25 },
      { name: 'Firm', price: 499, dbCost: 0.30, apiCost: 2.00, bandwidthCost: 0.15, stripeFee: 14.77, emailCost: 0.05, bankCost: 0.50 },
      { name: 'Enterprise', price: 999, dbCost: 0.50, apiCost: 3.00, bandwidthCost: 0.20, stripeFee: 29.27, emailCost: 0.10, bankCost: 0.50 },
    ];
    const subs = { Solo: 42, Practice: 31, Firm: 12, Enterprise: 2 };
    const fixedCosts = { vercel: 20, neon: 19, domain: 5 };
    const totalFixed = Object.values(fixedCosts).reduce((s, v) => s + v, 0);
    const totalMRR = Object.entries(subs).reduce((s, [tier, count]) => s + count * tiers.find(t => t.name === tier).price, 0);
    const totalCosts = Object.entries(subs).reduce((s, [tier, count]) => {
      const t = tiers.find(x => x.name === tier);
      return s + count * (t.dbCost + t.apiCost + t.bandwidthCost + t.stripeFee + t.emailCost + t.bankCost);
    }, 0) + totalFixed;

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-1">${totalMRR.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Costs</p>
            <p className="text-2xl font-bold text-red-600 mt-1">${totalCosts.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</p>
            <p className="text-2xl font-bold text-green-600 mt-1">${(totalMRR - totalCosts).toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Margin</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{((1 - totalCosts / totalMRR) * 100).toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Cost Per Customer by Tier</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium">Tier</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                  <th className="pb-2 font-medium text-right">Database</th>
                  <th className="pb-2 font-medium text-right">Claude API</th>
                  <th className="pb-2 font-medium text-right">Bandwidth</th>
                  <th className="pb-2 font-medium text-right">Stripe Fee</th>
                  <th className="pb-2 font-medium text-right">Email</th>
                  <th className="pb-2 font-medium text-right">Bank Feeds</th>
                  <th className="pb-2 font-medium text-right">Total Cost</th>
                  <th className="pb-2 font-medium text-right">Net/Customer</th>
                  <th className="pb-2 font-medium text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map(t => {
                  const totalCost = t.dbCost + t.apiCost + t.bandwidthCost + t.stripeFee + t.emailCost + t.bankCost;
                  const net = t.price - totalCost;
                  const margin = ((net / t.price) * 100).toFixed(1);
                  return (
                    <tr key={t.name} className="border-b last:border-0">
                      <td className="py-2.5 font-medium text-gray-900">{t.name}</td>
                      <td className="py-2.5 text-right text-green-600 font-medium">${t.price}</td>
                      <td className="py-2.5 text-right text-gray-500">${t.dbCost.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-gray-500">${t.apiCost.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-gray-500">${t.bandwidthCost.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-gray-500">${t.stripeFee.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-gray-500">${t.emailCost.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-gray-500">${t.bankCost.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-red-600 font-medium">${totalCost.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-green-600 font-bold">${net.toFixed(2)}</td>
                      <td className="py-2.5 text-right"><span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{margin}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Fixed Monthly Costs</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Vercel Pro Hosting</span><span className="font-medium">${fixedCosts.vercel}/mo</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Neon PostgreSQL</span><span className="font-medium">${fixedCosts.neon}/mo</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Domain</span><span className="font-medium">${fixedCosts.domain}/mo</span></div>
              <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-900 font-semibold">Total Fixed</span><span className="font-bold">${totalFixed}/mo</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Breakeven Analysis</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Fixed costs covered by</span><span className="font-medium">1 Solo customer</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Profit at 10 customers</span><span className="font-medium text-green-600">$1,400+/mo</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Profit at 50 customers</span><span className="font-medium text-green-600">$7,000+/mo</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Profit at 100 customers</span><span className="font-medium text-green-600">$14,000+/mo</span></div>
              <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-900 font-semibold">Current profit</span><span className="font-bold text-green-600">${(totalMRR - totalCosts).toFixed(0)}/mo</span></div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>Key insight:</strong> Your average cost per customer is $2-5/month. Your average revenue per customer is $280/month. That&apos;s a 93-97% margin — significantly higher than the SaaS industry average of 70-80%. This is because AI handles support (no staff), Vercel handles hosting (no servers), and Neon handles database (no DBA).
        </div>
      </>
    );
  }

  const tabContent = {
    Overview: renderOverview,
    Support: renderSupport,
    Users: renderUsers,
    System: renderSystem,
    Agents: renderAgents,
    'Unit Economics': renderUnitEconomics,
    'Operations Log': renderOpsLog,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold text-gray-900">Admin Command Center</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-600">All Systems Operational</span>
        </div>
      </div>
      <p className="text-gray-500 mb-6">SaaS business operations and platform monitoring</p>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-8 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tabContent[activeTab]?.()}
      <ProprietaryNotice />
    </div>
  );
}
