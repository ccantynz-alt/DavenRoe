import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import api from '@/services/api';

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-gray-500 mb-8">Your autonomous accounting overview</p>
      </motion.div>

      {/* Pillar Status Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <PillarCard title="Tax Engine" description="US, AU, NZ, GB + 6 bilateral DTAs" status="active" pillar="1" />
        <PillarCard title="Autonomous Ledger" description="AI-drafted double-entry with review workflow" status="active" pillar="2" />
        <PillarCard title="Simple-Speak" description="Natural language financial queries" status="active" pillar="3" />
        <PillarCard title="Audit Shield" description="Real-time risk scoring & continuous audit" status="active" pillar="4" />
      </motion.div>

      {/* Live Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
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
      </motion.div>

      {/* Financial Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
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
      </motion.div>

      {/* System Status */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusIndicator label="API Server" detail="Connected" />
                <StatusIndicator label="AI Engine" detail={status.ai_model || 'Claude Sonnet'} />
                <StatusIndicator label="Version" detail={status.version || '0.1.0'} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function StatusIndicator({ label, detail }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-400">{detail}</p>
      </div>
    </div>
  );
}

function PillarCard({ title, description, status, pillar }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-gray-400">PILLAR {pillar}</span>
          <Badge variant="success">{status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="mb-1">{title}</CardTitle>
        <p className="text-sm text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, note, color }) {
  return (
    <Card
      className={cn(
        color === 'red' && 'border-l-4 border-l-red-500',
        color === 'yellow' && 'border-l-4 border-l-yellow-500',
        color === 'green' && 'border-l-4 border-l-green-500'
      )}
    >
      <CardContent className="pt-6">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold mb-1">{value}</p>
        <p className="text-xs text-gray-400">{note}</p>
      </CardContent>
    </Card>
  );
}
