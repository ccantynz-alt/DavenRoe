import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

/**
 * Operations Centre — platform owner's command centre for monitoring
 * all customer accounts, payment status, service health, and revenue.
 *
 * This is the CRM + payment management + service monitor in one view.
 * The owner sees every customer, their plan, payment status, last active,
 * overdue invoices, and can take action (chase, suspend, upgrade).
 */

const DEMO_CUSTOMERS = [
  { id: 'c1', name: 'Harbour Coffee Roasters', email: 'accounts@harbourcoffee.co.nz', plan: 'Practice', status: 'active', mrr: 149, currency: 'NZD', payment_status: 'current', last_payment: '2026-04-01', last_active: '2h ago', entities: 2, jurisdiction: 'NZ', joined: '2026-02-15' },
  { id: 'c2', name: 'Wright Advisory Group', email: 'billing@wrightadvisory.com.au', plan: 'Firm', status: 'active', mrr: 499, currency: 'AUD', payment_status: 'current', last_payment: '2026-04-01', last_active: '35m ago', entities: 8, jurisdiction: 'AU', joined: '2026-01-10' },
  { id: 'c3', name: 'Kiwi Design Studio', email: 'hello@kiwidesign.co.nz', plan: 'Solo', status: 'active', mrr: 49, currency: 'NZD', payment_status: 'overdue', last_payment: '2026-03-01', last_active: '3d ago', entities: 1, jurisdiction: 'NZ', joined: '2026-03-01' },
  { id: 'c4', name: 'Pacific Ledger Partners', email: 'admin@pacificledger.com.au', plan: 'Practice', status: 'active', mrr: 149, currency: 'AUD', payment_status: 'current', last_payment: '2026-04-03', last_active: '1h ago', entities: 12, jurisdiction: 'AU', joined: '2025-11-20' },
  { id: 'c5', name: 'Queenstown Ventures', email: 'ops@queenstownventures.co.nz', plan: 'Solo', status: 'trial', mrr: 0, currency: 'NZD', payment_status: 'trial', last_payment: null, last_active: '6h ago', entities: 1, jurisdiction: 'NZ', joined: '2026-04-10' },
  { id: 'c6', name: 'Melbourne Tax Solutions', email: 'team@meltax.com.au', plan: 'Firm', status: 'active', mrr: 499, currency: 'AUD', payment_status: 'current', last_payment: '2026-04-02', last_active: '20m ago', entities: 24, jurisdiction: 'AU', joined: '2025-12-05' },
  { id: 'c7', name: 'Nelson Builders Ltd', email: 'accounts@nelsonbuilders.co.nz', plan: 'Practice', status: 'active', mrr: 149, currency: 'NZD', payment_status: 'failed', last_payment: '2026-03-15', last_active: '5d ago', entities: 3, jurisdiction: 'NZ', joined: '2026-01-22' },
  { id: 'c8', name: 'Sydney Cloud Consulting', email: 'finance@sydneycloud.com.au', plan: 'Solo', status: 'churned', mrr: 0, currency: 'AUD', payment_status: 'cancelled', last_payment: '2026-02-01', last_active: '28d ago', entities: 1, jurisdiction: 'AU', joined: '2025-10-15' },
];

const SERVICES = [
  { name: 'AI Categoriser', status: 'running', uptime: '99.97%', requests_24h: 1247, avg_latency: '0.3s' },
  { name: 'Month-End Close Agent', status: 'idle', uptime: '100%', requests_24h: 3, avg_latency: '4.2s' },
  { name: 'Tax Filing Engine', status: 'running', uptime: '99.99%', requests_24h: 42, avg_latency: '1.8s' },
  { name: 'Email Harvester', status: 'running', uptime: '99.95%', requests_24h: 89, avg_latency: '2.1s' },
  { name: 'Ask Daven (Claude)', status: 'running', uptime: '99.9%', requests_24h: 156, avg_latency: '1.4s' },
  { name: 'Bank Feed Sync (Basiq)', status: 'degraded', uptime: '98.2%', requests_24h: 512, avg_latency: '3.8s' },
  { name: 'Catch-Up Engine', status: 'running', uptime: '100%', requests_24h: 7, avg_latency: '0.8s' },
  { name: 'Forensic Auditor', status: 'idle', uptime: '100%', requests_24h: 4, avg_latency: '8.4s' },
];

export default function OperationsCentre() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [customers] = useState(DEMO_CUSTOMERS);

  const filtered = customers.filter((c) => {
    if (filter === 'overdue' && c.payment_status !== 'overdue' && c.payment_status !== 'failed') return false;
    if (filter === 'trial' && c.status !== 'trial') return false;
    if (filter === 'churned' && c.status !== 'churned') return false;
    if (filter === 'active' && c.status !== 'active') return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalMRR = customers.filter((c) => c.status === 'active').reduce((s, c) => s + c.mrr, 0);
  const totalCustomers = customers.filter((c) => c.status === 'active').length;
  const overdueCount = customers.filter((c) => c.payment_status === 'overdue' || c.payment_status === 'failed').length;
  const trialCount = customers.filter((c) => c.status === 'trial').length;
  const totalEntities = customers.reduce((s, c) => s + c.entities, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operations Centre</h1>
        <p className="text-gray-500 mt-1">Customer accounts, payments, service health — everything in one view.</p>
      </div>

      {/* Revenue + customer stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="MRR" value={`$${totalMRR.toLocaleString()}`} accent="text-emerald-600" />
        <StatCard label="Active customers" value={totalCustomers} accent="text-indigo-600" />
        <StatCard label="Payment issues" value={overdueCount} accent={overdueCount > 0 ? 'text-rose-600' : 'text-gray-400'} />
        <StatCard label="In trial" value={trialCount} accent="text-amber-600" />
        <StatCard label="Total entities" value={totalEntities} accent="text-blue-600" />
      </div>

      {/* Customer table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <span className="text-sm font-semibold text-gray-700">Customers</span>
          <div className="flex gap-1">
            {['all', 'active', 'overdue', 'trial', 'churned'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="ml-auto px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">MRR</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Entities</th>
                <th className="py-3 px-4">Last active</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.plan === 'Firm' ? 'bg-violet-100 text-violet-700' :
                      c.plan === 'Practice' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{c.plan}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {c.mrr > 0 ? `${c.currency} ${c.mrr}` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <PaymentBadge status={c.payment_status} />
                  </td>
                  <td className="py-3 px-4 text-gray-600">{c.entities}</td>
                  <td className="py-3 px-4 text-gray-500">{c.last_active}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {(c.payment_status === 'overdue' || c.payment_status === 'failed') && (
                        <button className="text-[10px] px-2 py-1 bg-rose-50 text-rose-600 rounded font-medium hover:bg-rose-100">Chase</button>
                      )}
                      {c.status === 'trial' && (
                        <button className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-600 rounded font-medium hover:bg-emerald-100">Convert</button>
                      )}
                      <button className="text-[10px] px-2 py-1 bg-gray-50 text-gray-600 rounded font-medium hover:bg-gray-100">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service health */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Service health</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SERVICES.map((svc) => (
            <div key={svc.name} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  svc.status === 'running' ? 'bg-emerald-500' :
                  svc.status === 'degraded' ? 'bg-amber-500 animate-pulse' :
                  'bg-gray-300'
                }`} />
                <span className="text-sm font-medium text-gray-900">{svc.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-500">
                <span>{svc.uptime}</span>
                <span>{svc.requests_24h} req/24h</span>
                <span>{svc.avg_latency} avg</span>
              </div>
            </div>
          ))}
        </div>
      </div>
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

function PaymentBadge({ status }) {
  const styles = {
    current: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-rose-100 text-rose-700',
    failed: 'bg-red-100 text-red-700',
    trial: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.current}`}>
      {status}
    </span>
  );
}
