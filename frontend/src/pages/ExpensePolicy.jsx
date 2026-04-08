import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const RULE_TYPE_LABELS = {
  max_amount: 'Max Amount', receipt_required: 'Receipt Required',
  blocked_category: 'Blocked', approval_required: 'Approval Required',
  monthly_limit: 'Monthly Limit',
};
const RULE_TYPE_COLORS = {
  max_amount: 'bg-amber-900/40 text-amber-300',
  receipt_required: 'bg-blue-900/40 text-blue-300',
  blocked_category: 'bg-red-900/40 text-red-300',
  approval_required: 'bg-purple-900/40 text-purple-300',
  monthly_limit: 'bg-indigo-900/40 text-indigo-300',
};
const STATUS_CONFIG = {
  pending_review: { label: 'Pending', color: 'bg-amber-900/40 text-amber-300' },
  rejected: { label: 'Rejected', color: 'bg-red-900/40 text-red-300' },
  approved_with_exception: { label: 'Exception', color: 'bg-blue-900/40 text-blue-300' },
  approved: { label: 'Approved', color: 'bg-emerald-900/40 text-emerald-300' },
};
const SEVERITY_COLORS = { high: 'text-red-400', medium: 'text-amber-400', low: 'text-blue-400' };

export default function ExpensePolicy() {
  const toast = useToast();
  const [policies, setPolicies] = useState([]);
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('violations');
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: '', category: 'all', rule_type: 'max_amount', threshold: 50,
    description: '', require_receipt: false, receipt_threshold: 25,
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [polRes, violRes, statsRes] = await Promise.all([
      api.get('/expense-policy/').catch(() => ({ data: { policies: [] } })),
      api.get('/expense-policy/violations').catch(() => ({ data: { violations: [] } })),
      api.get('/expense-policy/stats').catch(() => ({ data: null })),
    ]);
    setPolicies(polRes.data.policies || []);
    setViolations(violRes.data.violations || []);
    setStats(statsRes.data);
    setLoading(false);
  }

  async function handleCreatePolicy() {
    if (!form.name) { toast.error('Policy name is required'); return; }
    try {
      await api.post('/expense-policy/', form);
      toast.success('Policy created');
      setShowCreate(false);
      loadData();
    } catch { toast.error('Failed to create policy'); }
  }

  async function handleToggle(id) {
    try { await api.post(`/expense-policy/${id}/toggle`); loadData(); }
    catch { toast.error('Failed to toggle'); }
  }

  async function handleDeletePolicy(id) {
    try { await api.delete(`/expense-policy/${id}`); toast.success('Policy deleted'); loadData(); }
    catch { toast.error('Failed to delete'); }
  }

  async function resolveViolation(id, action, notes = '') {
    try {
      await api.post(`/expense-policy/violations/${id}/resolve`, { action, notes });
      toast.success(`Violation ${action.replace('_', ' ')}`);
      loadData();
    } catch { toast.error('Failed to resolve'); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Expense Policy</h2>
          <p className="text-gray-400 mt-1">Define spending rules and auto-flag violations before approval</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors">
          + New Policy
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Active Policies" value={stats.active_policies} color="indigo" />
          <StatCard label="Pending Review" value={stats.pending_review} color="amber" />
          <StatCard label="Total Flagged" value={`$${stats.total_flagged_amount.toLocaleString()}`} color="red" />
          <StatCard label="Rejected" value={stats.rejected} color="red" />
          <StatCard label="Savings" value={`$${stats.savings.toLocaleString()}`} color="emerald" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1 w-fit">
        {[
          { id: 'violations', label: 'Violations', count: violations.filter(v => v.status === 'pending_review').length },
          { id: 'policies', label: 'Policies', count: policies.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${tab === t.id ? 'bg-indigo-500' : 'bg-gray-700'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Create Policy Form */}
      {showCreate && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Create Expense Policy</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white text-sm">Cancel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Policy Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Max Meal Expense" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="all">All Categories</option>
                <option value="Meals & Entertainment">Meals & Entertainment</option>
                <option value="Travel & Accommodation">Travel & Accommodation</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Software & Subscriptions">Software & Subscriptions</option>
                <option value="Client Gifts">Client Gifts</option>
                <option value="Equipment">Equipment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rule Type</label>
              <select value={form.rule_type} onChange={e => setForm(f => ({ ...f, rule_type: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="max_amount">Maximum Amount</option>
                <option value="receipt_required">Receipt Required</option>
                <option value="blocked_category">Blocked Category</option>
                <option value="approval_required">Approval Required</option>
                <option value="monthly_limit">Monthly Limit</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Threshold ($)</label>
              <input type="number" min="0" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="What does this policy enforce?" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.require_receipt} onChange={e => setForm(f => ({ ...f, require_receipt: e.target.checked }))}
              className="w-4 h-4 rounded bg-gray-900 border-gray-600 text-indigo-500 focus:ring-indigo-500" />
            <span className="text-sm text-gray-300">Require receipt</span>
          </label>
          <div className="flex gap-3">
            <button onClick={handleCreatePolicy} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors">Create Policy</button>
            <button onClick={() => setShowCreate(false)} className="px-5 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Violations Tab */}
      {tab === 'violations' && (
        <div className="space-y-3">
          {violations.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">&#x2705;</div>
              <p className="font-medium">No violations detected</p>
              <p className="text-sm mt-1">All expenses comply with your policies</p>
            </div>
          ) : (
            violations.map(v => (
              <div key={v.id} className="bg-gray-800/40 border border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium text-white">{v.expense_description}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[v.status]?.color || 'bg-gray-700 text-gray-300'}`}>
                        {STATUS_CONFIG[v.status]?.label || v.status}
                      </span>
                      <span className={`text-xs font-medium ${SEVERITY_COLORS[v.severity]}`}>{v.severity}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                      <span>Policy: <span className="text-gray-300">{v.policy_name}</span></span>
                      <span>Amount: <span className="text-red-400 font-medium">${v.expense_amount.toFixed(2)}</span></span>
                      {v.threshold > 0 && <span>Limit: <span className="text-gray-300">${v.threshold.toFixed(2)}</span></span>}
                      <span>Employee: <span className="text-gray-300">{v.employee_name}</span></span>
                      <span>{v.date}</span>
                    </div>
                    {v.notes && <p className="text-xs text-gray-500 mt-1.5 italic">{v.notes}</p>}
                  </div>
                  {v.status === 'pending_review' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => resolveViolation(v.id, 'approved_with_exception', 'Approved with exception')}
                        className="px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors">Exception</button>
                      <button onClick={() => resolveViolation(v.id, 'approved')}
                        className="px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-900/30 rounded-lg transition-colors">Approve</button>
                      <button onClick={() => resolveViolation(v.id, 'rejected', 'Policy violation — rejected')}
                        className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Policies Tab */}
      {tab === 'policies' && (
        <div className="space-y-2">
          {policies.map(p => (
            <div key={p.id} className={`bg-gray-800/40 border border-gray-700 rounded-xl p-4 ${!p.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RULE_TYPE_COLORS[p.rule_type]}`}>
                      {RULE_TYPE_LABELS[p.rule_type]}
                    </span>
                    {!p.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Inactive</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Category: <span className="text-gray-300">{p.category === 'all' ? 'All' : p.category}</span></span>
                    {p.threshold > 0 && <span>Threshold: <span className="text-gray-300">${p.threshold.toFixed(2)}</span></span>}
                    <span>Violations: <span className="text-amber-400 font-medium">{p.violations_count}</span></span>
                    {p.require_receipt && <span className="text-blue-400">Receipt required</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleToggle(p.id)} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${p.active ? 'text-amber-400 hover:bg-amber-900/30' : 'text-emerald-400 hover:bg-emerald-900/30'}`}>
                    {p.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDeletePolicy(p.id)} className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'border-indigo-800/50 bg-indigo-950/20 text-indigo-400',
    emerald: 'border-emerald-800/50 bg-emerald-950/20 text-emerald-400',
    amber: 'border-amber-800/50 bg-amber-950/20 text-amber-400',
    red: 'border-red-800/50 bg-red-950/20 text-red-400',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
