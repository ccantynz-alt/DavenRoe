import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import api from '../services/api';

/**
 * My Business — personal admin hub for the business owner.
 *
 * Unlike the Practice Dashboard (managing clients) or Admin Dashboard
 * (platform metrics), this is YOUR accounting workspace. Shows your
 * entity, your GST position, your invoices, your compliance deadlines,
 * your catch-up status. Everything you need to run your own books.
 */

const QUICK_ACTIONS = [
  { label: 'Create invoice', href: '/invoicing', color: 'bg-indigo-600' },
  { label: 'Record expense', href: '/bills', color: 'bg-emerald-600' },
  { label: 'Run catch-up', href: '/accountant-pack', color: 'bg-violet-600' },
  { label: 'Ask Daven', href: '/ask-daven', color: 'bg-blue-600' },
  { label: 'File GST return', href: '/tax-filing', color: 'bg-amber-600' },
  { label: 'View reports', href: '/reports', color: 'bg-gray-700' },
];

export default function MyBusiness() {
  const [entity, setEntity] = useState(null);
  const [stats, setStats] = useState(null);
  const [invoiceSummary, setInvoiceSummary] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const entityId = localStorage.getItem('davenroe_active_entity');

      const [entityRes, statsRes, invoiceRes, complianceRes] = await Promise.allSettled([
        entityId ? api.get(`/clients/${entityId}`).catch(() => null) : null,
        api.get('/dashboard/stats').catch(() => null),
        api.get('/invoicing/summary/all').catch(() => null),
        api.get('/compliance/summary').catch(() => null),
      ]);

      if (entityRes.status === 'fulfilled' && entityRes.value?.data) {
        setEntity(entityRes.value.data);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (invoiceRes.status === 'fulfilled' && invoiceRes.value?.data) {
        setInvoiceSummary(invoiceRes.value.data);
      }
      if (complianceRes.status === 'fulfilled' && complianceRes.value?.data) {
        setCompliance(complianceRes.value.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Business</h1>
          <p className="text-gray-500 mt-1">
            {entity ? `${entity.name} · ${entity.entity_type?.replace('_', ' ')} · ${entity.primary_currency || 'NZD'}` : 'Your personal accounting workspace'}
          </p>
        </div>
        <Link to="/settings" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          Entity settings →
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className={`${action.color} text-white rounded-xl p-4 text-center hover:opacity-90 transition shadow-sm`}
          >
            <p className="text-sm font-semibold">{action.label}</p>
          </Link>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending review"
          value={stats?.pending_review ?? 0}
          accent="text-amber-600"
          href="/review"
        />
        <StatCard
          label="Outstanding invoices"
          value={invoiceSummary?.by_status?.sent ?? invoiceSummary?.by_status?.partially_paid ?? 0}
          sub={invoiceSummary?.total_outstanding ? `$${Number(invoiceSummary.total_outstanding).toLocaleString()}` : null}
          accent="text-indigo-600"
          href="/invoicing"
        />
        <StatCard
          label="Overdue deadlines"
          value={compliance?.overdue ?? 0}
          accent={compliance?.overdue > 0 ? 'text-rose-600' : 'text-emerald-600'}
          href="/compliance"
        />
        <StatCard
          label="Upcoming filings"
          value={compliance?.upcoming ?? 0}
          accent="text-blue-600"
          href="/compliance"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* GST / Tax position */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Tax position</h2>
            <Link to="/tax" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View tax engine →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MiniCard label="GST collected" value="—" sub="Run catch-up to calculate" />
            <MiniCard label="GST paid" value="—" sub="Connect bank feeds" />
            <MiniCard label="Net GST payable" value="—" sub="File via Tax Filing" />
            <MiniCard label="Income tax estimate" value="—" sub="Run catch-up engine" />
          </div>
          <Link to="/accountant-pack" className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Generate accountant pack <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Compliance deadlines */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Upcoming deadlines</h2>
            <Link to="/compliance" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Full calendar →</Link>
          </div>
          {compliance?.by_jurisdiction ? (
            <div className="space-y-3">
              {compliance.by_jurisdiction.map((j) => (
                <div key={j.jurisdiction} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{j.jurisdiction}</span>
                    {j.next && (
                      <p className="text-xs text-gray-500">{j.next.name} — {j.next.days_until}d</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {j.overdue > 0 && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{j.overdue} overdue</span>
                    )}
                    <span className="text-[10px] text-gray-400">{j.upcoming} upcoming</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading deadlines...</p>
          )}
        </div>
      </div>

      {/* Recent activity + tools */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">What to do next</h2>
          <div className="space-y-3">
            <TodoItem text="Connect your bank feeds to start auto-categorising transactions" href="/banking" />
            <TodoItem text="Run the Catch-Up Engine to reconstruct missed GST/income tax returns" href="/accountant-pack" />
            <TodoItem text="Scan your email for invoices and receipts using the Email Harvester" href="/email-harvester" />
            <TodoItem text="Generate your first accountant pack and send it to your tax agent" href="/accountant-pack" />
            <TodoItem text="Set up payroll for your employees (if applicable)" href="/payroll" />
            <TodoItem text="Ask Daven any tax question — by voice or text" href="/ask-daven" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Your tools</h2>
          <div className="space-y-2">
            {[
              { label: 'Timeline', href: '/timeline', desc: 'Chronological view of everything' },
              { label: 'Email Harvester', href: '/email-harvester', desc: 'Inbox → GST-calculated drafts' },
              { label: 'Ask Daven', href: '/ask-daven', desc: 'Voice AI tax advisor' },
              { label: 'Accountant Pack', href: '/accountant-pack', desc: 'Get ready for your accountant' },
              { label: 'Penalty Calculator', href: '/catchup/penalty-calculator', desc: 'Estimate late-filing costs' },
              { label: 'Forensic Tools', href: '/forensic-tools', desc: 'Benford\'s, ghost vendor, money trail' },
            ].map((tool) => (
              <Link
                key={tool.label}
                to={tool.href}
                className="block p-3 rounded-lg border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition"
              >
                <p className="text-sm font-semibold text-gray-900">{tool.label}</p>
                <p className="text-xs text-gray-500">{tool.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, href }) {
  return (
    <Link to={href} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </Link>
  );
}

function MiniCard({ label, value, sub }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

function TodoItem({ text, href }) {
  return (
    <Link to={href} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
      <div className="w-5 h-5 rounded border-2 border-gray-300 group-hover:border-indigo-400 shrink-0 mt-0.5" />
      <span className="text-sm text-gray-700 group-hover:text-gray-900">{text}</span>
    </Link>
  );
}
