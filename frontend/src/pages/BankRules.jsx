import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const MATCH_TYPES = [
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'exact', label: 'Exact match' },
];

const MATCH_FIELDS = [
  { value: 'description', label: 'Description' },
  { value: 'reference', label: 'Reference' },
  { value: 'amount', label: 'Amount' },
];

const ACCOUNT_OPTIONS = [
  { code: '4100', name: 'Sales Revenue' },
  { code: '4200', name: 'Service Revenue' },
  { code: '2000', name: 'Accounts Payable' },
  { code: '6100', name: 'Salaries & Wages' },
  { code: '6200', name: 'Rent Expense' },
  { code: '6250', name: 'Office Supplies' },
  { code: '6300', name: 'Insurance' },
  { code: '6350', name: 'Cloud & Hosting' },
  { code: '6400', name: 'Utilities' },
  { code: '6410', name: 'Telephone & Internet' },
  { code: '6500', name: 'Meals & Entertainment' },
  { code: '6700', name: 'Advertising & Marketing' },
  { code: '6800', name: 'Bank Charges' },
];

const TAX_CODES = ['GST', 'GST-Free', 'BAS Excluded', 'N/A'];

const SOURCE_LABELS = { manual: 'Manual', ai_suggested: 'AI Suggested', ai_learned: 'AI Learned' };
const SOURCE_COLORS = {
  manual: 'bg-gray-700 text-gray-300',
  ai_suggested: 'bg-indigo-900/50 text-indigo-300',
  ai_learned: 'bg-emerald-900/50 text-emerald-300',
};

export default function BankRules() {
  const toast = useToast();
  const [rules, setRules] = useState([]);
  const [stats, setStats] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('rules');
  const [showCreate, setShowCreate] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', match_field: 'description', match_type: 'contains', match_value: '',
    account_code: '6400', account_name: 'Utilities', tax_code: 'GST',
    confidence_threshold: 90, auto_approve: false, priority: 10,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [rulesRes, statsRes, suggestRes, actRes] = await Promise.all([
      api.get('/bank-rules/').catch(() => ({ data: { rules: [] } })),
      api.get('/bank-rules/stats').catch(() => ({ data: null })),
      api.get('/bank-rules/suggestions').catch(() => ({ data: { suggestions: [] } })),
      api.get('/bank-rules/activity').catch(() => ({ data: { activity: [] } })),
    ]);
    setRules(rulesRes.data.rules || []);
    setStats(statsRes.data);
    setSuggestions(suggestRes.data.suggestions || []);
    setActivity(actRes.data.activity || []);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      name: '', match_field: 'description', match_type: 'contains', match_value: '',
      account_code: '6400', account_name: 'Utilities', tax_code: 'GST',
      confidence_threshold: 90, auto_approve: false, priority: 10,
    });
    setTestResult(null);
    setEditRule(null);
    setShowCreate(false);
  }

  function openEdit(rule) {
    setForm({
      name: rule.name, match_field: rule.match_field, match_type: rule.match_type,
      match_value: rule.match_value, account_code: rule.account_code,
      account_name: rule.account_name, tax_code: rule.tax_code,
      confidence_threshold: rule.confidence_threshold, auto_approve: rule.auto_approve,
      priority: rule.priority,
    });
    setEditRule(rule);
    setShowCreate(true);
    setTestResult(null);
  }

  async function handleSave() {
    if (!form.name || !form.match_value || !form.account_code) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      if (editRule) {
        await api.put(`/bank-rules/${editRule.id}`, form);
        toast.success('Rule updated');
      } else {
        await api.post('/bank-rules/', form);
        toast.success('Rule created');
      }
      resetForm();
      loadData();
    } catch {
      toast.error('Failed to save rule');
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/bank-rules/${id}`);
      toast.success('Rule deleted');
      loadData();
    } catch {
      toast.error('Failed to delete rule');
    }
  }

  async function handleToggle(id) {
    try {
      await api.post(`/bank-rules/${id}/toggle`);
      loadData();
    } catch {
      toast.error('Failed to toggle rule');
    }
  }

  async function handleTest() {
    if (!form.match_value) { toast.error('Enter a match value first'); return; }
    setTesting(true);
    try {
      const res = await api.post('/bank-rules/test', {
        match_field: form.match_field, match_type: form.match_type, match_value: form.match_value,
      });
      setTestResult(res.data);
    } catch {
      toast.error('Test failed');
    }
    setTesting(false);
  }

  async function handleAcceptSuggestion(suggestion) {
    try {
      await api.post(`/bank-rules/suggestions/${suggestion.id}/accept`);
      toast.success(`Rule created from suggestion: ${suggestion.suggested_name}`);
      loadData();
    } catch {
      toast.error('Failed to accept suggestion');
    }
  }

  function handleAccountChange(code) {
    const acct = ACCOUNT_OPTIONS.find(a => a.code === code);
    setForm(f => ({ ...f, account_code: code, account_name: acct?.name || '' }));
  }

  const filtered = useMemo(() => {
    let result = rules;
    if (filterSource !== 'all') result = result.filter(r => r.source === filterSource);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(s) ||
        r.match_value.toLowerCase().includes(s) ||
        r.account_name.toLowerCase().includes(s)
      );
    }
    return result;
  }, [rules, filterSource, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Auto Bank Rules</h2>
          <p className="text-gray-400 mt-1">AI-powered categorisation rules that learn from your approvals</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors"
        >
          + New Rule
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Rules" value={stats.total_rules} sub={`${stats.ai_generated_rules} AI-generated`} color="indigo" />
          <StatCard label="Transactions Matched" value={stats.total_matches.toLocaleString()} sub={`${stats.total_approved.toLocaleString()} approved`} color="emerald" />
          <StatCard label="Accuracy" value={`${stats.accuracy_pct}%`} sub={`${stats.total_overridden} overridden`} color="blue" />
          <StatCard label="Hours Saved" value={stats.hours_saved} sub="vs manual categorisation" color="amber" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1 w-fit">
        {[
          { id: 'rules', label: 'Rules', count: rules.length },
          { id: 'suggestions', label: 'AI Suggestions', count: suggestions.length },
          { id: 'activity', label: 'Activity Log', count: activity.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                tab === t.id ? 'bg-indigo-500' : 'bg-gray-700'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showCreate && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{editRule ? 'Edit Rule' : 'Create New Rule'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white text-sm">Cancel</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rule Name *</label>
              <input
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="e.g. AGL Energy — Electricity"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Priority (1 = highest)</label>
              <input
                type="number" min="1" max="100"
                value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 10 }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Match criteria */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Match Criteria</label>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Field</label>
                <select
                  value={form.match_field} onChange={e => setForm(f => ({ ...f, match_field: e.target.value }))}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {MATCH_FIELDS.map(mf => <option key={mf.value} value={mf.value}>{mf.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  value={form.match_type} onChange={e => setForm(f => ({ ...f, match_type: e.target.value }))}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {MATCH_TYPES.map(mt => <option key={mt.value} value={mt.value}>{mt.label}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1">Value *</label>
                <input
                  value={form.match_value} onChange={e => setForm(f => ({ ...f, match_value: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. AGL Energy"
                />
              </div>
              <button
                onClick={handleTest} disabled={testing}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Pattern'}
              </button>
            </div>
          </div>

          {/* Test results */}
          {testResult && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">
                  Test Results: {testResult.matched_count} of {testResult.tested_count} transactions matched
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${testResult.matched_count > 0 ? 'bg-emerald-900/50 text-emerald-300' : 'bg-gray-700 text-gray-400'}`}>
                  {testResult.matched_count > 0 ? 'Pattern matches found' : 'No matches'}
                </span>
              </div>
              {testResult.matches.length > 0 && (
                <div className="space-y-1">
                  {testResult.matches.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-sm py-1.5 px-3 bg-gray-800/50 rounded">
                      <span className="text-gray-300">{m.description}</span>
                      <span className={m.amount < 0 ? 'text-red-400' : 'text-emerald-400'}>${Math.abs(m.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categorisation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Account *</label>
              <select
                value={form.account_code} onChange={e => handleAccountChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {ACCOUNT_OPTIONS.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tax Code</label>
              <select
                value={form.tax_code} onChange={e => setForm(f => ({ ...f, tax_code: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {TAX_CODES.map(tc => <option key={tc} value={tc}>{tc}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confidence Threshold (%)</label>
              <input
                type="number" min="0" max="100"
                value={form.confidence_threshold} onChange={e => setForm(f => ({ ...f, confidence_threshold: parseInt(e.target.value) || 90 }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" checked={form.auto_approve}
                onChange={e => setForm(f => ({ ...f, auto_approve: e.target.checked }))}
                className="w-4 h-4 rounded bg-gray-900 border-gray-600 text-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-300">Auto-approve above confidence threshold</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors"
            >
              {editRule ? 'Update Rule' : 'Create Rule'}
            </button>
            <button onClick={resetForm} className="px-5 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {tab === 'rules' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none w-64"
              placeholder="Search rules..."
            />
            <select
              value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual</option>
              <option value="ai_suggested">AI Suggested</option>
              <option value="ai_learned">AI Learned</option>
            </select>
            <span className="text-sm text-gray-500">{filtered.length} rule{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Rules List */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">&#x2699;</div>
              <p className="font-medium">No rules found</p>
              <p className="text-sm mt-1">Create your first rule or accept an AI suggestion</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(rule => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onEdit={() => openEdit(rule)}
                  onToggle={() => handleToggle(rule.id)}
                  onDelete={() => handleDelete(rule.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Suggestions Tab */}
      {tab === 'suggestions' && (
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">&#x2728;</div>
              <p className="font-medium">No new suggestions</p>
              <p className="text-sm mt-1">The AI analyses your bank feed transactions and suggests rules when it detects patterns</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400">
                The AI detected recurring patterns in your bank feed. Review and accept to automate categorisation.
              </p>
              <div className="space-y-3">
                {suggestions.map(s => (
                  <SuggestionCard key={s.id} suggestion={s} onAccept={() => handleAcceptSuggestion(s)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {tab === 'activity' && (
        <div className="space-y-3">
          {activity.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">&#x1F4CB;</div>
              <p className="font-medium">No activity yet</p>
              <p className="text-sm mt-1">Rule match activity will appear here as transactions are processed</p>
            </div>
          ) : (
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_100px_120px_140px] gap-4 px-5 py-3 text-xs font-medium text-gray-500 border-b border-gray-700 uppercase tracking-wider">
                <span>Rule</span><span>Transaction</span><span>Amount</span><span>Action</span><span>Time</span>
              </div>
              {activity.map(a => (
                <div key={a.id} className="grid grid-cols-[1fr_1fr_100px_120px_140px] gap-4 px-5 py-3 text-sm border-b border-gray-800/50 hover:bg-gray-800/30">
                  <span className="text-gray-300 truncate">{a.rule_name}</span>
                  <span className="text-gray-400 truncate">{a.transaction_desc}</span>
                  <span className={a.amount < 0 ? 'text-red-400' : 'text-emerald-400'}>${Math.abs(a.amount).toFixed(2)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded w-fit ${
                    a.action === 'auto_approved' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-amber-900/50 text-amber-300'
                  }`}>
                    {a.action === 'auto_approved' ? 'Auto-approved' : 'Queued'}
                  </span>
                  <span className="text-gray-500 text-xs">{new Date(a.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  const colors = {
    indigo: 'border-indigo-800/50 bg-indigo-950/20',
    emerald: 'border-emerald-800/50 bg-emerald-950/20',
    blue: 'border-blue-800/50 bg-blue-950/20',
    amber: 'border-amber-800/50 bg-amber-950/20',
  };
  const textColors = { indigo: 'text-indigo-400', emerald: 'text-emerald-400', blue: 'text-blue-400', amber: 'text-amber-400' };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${textColors[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function RuleRow({ rule, onEdit, onToggle, onDelete }) {
  const accuracy = rule.times_matched > 0
    ? Math.round((rule.times_approved / rule.times_matched) * 100)
    : 100;

  return (
    <div className={`bg-gray-800/40 border border-gray-700 rounded-xl p-4 hover:bg-gray-800/60 transition-colors ${!rule.active ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-white truncate">{rule.name}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[rule.source]}`}>
              {SOURCE_LABELS[rule.source]}
            </span>
            {rule.auto_approve && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 font-medium">Auto-approve</span>
            )}
            {!rule.active && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 font-medium">Inactive</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>When <span className="text-gray-300">{rule.match_field}</span> {rule.match_type.replace('_', ' ')} <span className="text-indigo-400">&quot;{rule.match_value}&quot;</span></span>
            <span className="text-gray-700">|</span>
            <span>Assign to <span className="text-gray-300">{rule.account_code} — {rule.account_name}</span></span>
            <span className="text-gray-700">|</span>
            <span>Tax: <span className="text-gray-300">{rule.tax_code}</span></span>
          </div>
          <div className="flex items-center gap-5 mt-2 text-xs text-gray-500">
            <span>Matched <span className="text-white font-medium">{rule.times_matched}</span> times</span>
            <span>Accuracy <span className={`font-medium ${accuracy >= 95 ? 'text-emerald-400' : accuracy >= 80 ? 'text-amber-400' : 'text-red-400'}`}>{accuracy}%</span></span>
            <span>Confidence &ge;{rule.confidence_threshold}%</span>
            <span>Priority #{rule.priority}</span>
            {rule.last_matched && (
              <span>Last match: {new Date(rule.last_matched).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onEdit} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">Edit</button>
          <button onClick={onToggle} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${rule.active ? 'text-amber-400 hover:bg-amber-900/30' : 'text-emerald-400 hover:bg-emerald-900/30'}`}>
            {rule.active ? 'Disable' : 'Enable'}
          </button>
          <button onClick={onDelete} className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion, onAccept }) {
  return (
    <div className="bg-gradient-to-r from-indigo-950/30 to-gray-800/40 border border-indigo-800/40 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 text-lg">&#x2728;</span>
            <h4 className="text-sm font-semibold text-white">{suggestion.suggested_name}</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 font-medium">
              {suggestion.confidence}% confidence
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">{suggestion.reason}</p>
          <div className="flex items-center gap-5 mt-3 text-xs text-gray-500">
            <span>Pattern: <span className="text-indigo-400">&quot;{suggestion.match_value}&quot;</span></span>
            <span>Account: <span className="text-gray-300">{suggestion.account_code} — {suggestion.account_name}</span></span>
            <span>Avg amount: <span className="text-gray-300">${Math.abs(suggestion.avg_amount).toFixed(2)}</span></span>
            <span>Occurrences: <span className="text-white font-medium">{suggestion.occurrences}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors"
          >
            Accept Rule
          </button>
        </div>
      </div>
    </div>
  );
}
