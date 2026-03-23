import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats').then(r => r.data).catch(() => null),
      fetch('/api/v1/../').then(r => r.json()).catch(() => null),
    ]).then(([s, st]) => {
      setStats(s);
      setStatus(st);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
      <p className="text-gray-500 mb-8">Your autonomous accounting overview</p>

      {/* Pillar Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <PillarCard title="Tax Engine" description="US, AU, NZ, GB + 6 bilateral DTAs" status="active" pillar="1" />
        <PillarCard title="Autonomous Ledger" description="AI-drafted double-entry with review workflow" status="active" pillar="2" />
        <PillarCard title="Simple-Speak" description="Natural language financial queries" status="active" pillar="3" />
        <PillarCard title="Audit Shield" description="Real-time risk scoring & continuous audit" status="active" pillar="4" />
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Pending Review"
          value={loading ? '...' : stats?.pending_review ?? 0}
          note="Transactions awaiting approval"
          color={stats?.pending_review > 0 ? 'yellow' : 'green'}
        />
        <StatCard
          label="Risk Alerts"
          value={loading ? '...' : stats?.risk_alerts ?? 0}
          note="Items flagged by audit agent"
          color={stats?.risk_alerts > 0 ? 'red' : 'green'}
        />
        <StatCard
          label="Active Entities"
          value={loading ? '...' : stats?.active_entities ?? 0}
          note="Businesses under management"
        />
        <StatCard
          label="Jurisdictions"
          value="4"
          note="US, AU, NZ, GB active"
        />
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="This Month"
          value={loading ? '...' : stats?.transactions_this_month ?? 0}
          note={`${stats?.approved_this_month ?? 0} approved`}
        />
        <StatCard
          label="Outstanding"
          value={loading ? '...' : `$${(stats?.outstanding_amount ?? 0).toLocaleString('en', { minimumFractionDigits: 2 })}`}
          note={`${stats?.overdue_invoices ?? 0} overdue`}
          color={stats?.overdue_invoices > 0 ? 'red' : 'green'}
        />
        <StatCard
          label="Revenue Collected"
          value={loading ? '...' : `$${(stats?.total_revenue ?? 0).toLocaleString('en', { minimumFractionDigits: 2 })}`}
          note="Paid receivable invoices"
        />
      </div>

      {/* System Status */}
      {status && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">API Server</p>
                <p className="text-xs text-gray-400">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">AI Engine</p>
                <p className="text-xs text-gray-400">{status.ai_model || 'Claude Sonnet'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Version</p>
                <p className="text-xs text-gray-400">{status.version || '0.1.0'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PillarCard({ title, description, status, pillar }) {
  return (
    <div className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-gray-400">PILLAR {pillar}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
          {status}
        </span>
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

function StatCard({ label, value, note, color }) {
  const ring = color === 'red' ? 'border-l-red-500' : color === 'yellow' ? 'border-l-yellow-500' : color === 'green' ? 'border-l-green-500' : '';
  return (
    <div className={`bg-white rounded-xl border p-6 ${ring ? `border-l-4 ${ring}` : ''}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-xs text-gray-400">{note}</p>
    </div>
  );
}
