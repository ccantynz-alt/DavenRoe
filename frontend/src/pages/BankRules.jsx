import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const CONDITION_TYPES = [
  { value: 'merchant_exact', label: 'Merchant (exact match)' },
  { value: 'merchant_contains', label: 'Merchant (contains)' },
  { value: 'description_contains', label: 'Description (contains)' },
  { value: 'amount_range', label: 'Amount range' },
  { value: 'amount_exact', label: 'Amount (exact)' },
  { value: 'category_code', label: 'Merchant category code' },
];

const STATUS_STYLES = {
  active: { bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  paused: { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  draft: { bg: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

const SOURCE_LABELS = {
  manual: { label: 'Manual', icon: '✏️' },
  ai_learned: { label: 'AI Learned', icon: '🧠' },
  ai_suggested: { label: 'AI Suggested', icon: '💡' },
};

const DEMO_RULES = [
  {
    id: 'demo-1', name: 'Office Supplies — Officeworks', status: 'active', source: 'manual', priority: 10,
    conditions: [{ type: 'merchant_contains', value: 'officeworks' }],
    action_category: 'Office Supplies', action_account: '6100 — Office Expenses', action_tax_code: 'GST',
    auto_approve: true, confidence_threshold: 0.95,
    notes: 'All Officeworks purchases go to office supplies',
    stats: { total_matches: 87, auto_approved: 82, manually_overridden: 3, false_positives: 1, accuracy_pct: 98.9 },
  },
  {
    id: 'demo-2', name: 'Rent — Monthly Lease Payment', status: 'active', source: 'manual', priority: 5,
    conditions: [{ type: 'merchant_exact', value: 'Ray White Commercial' }, { type: 'amount_range', min: 4000, max: 6000 }],
    action_category: 'Rent', action_account: '6200 — Rent Expense', action_tax_code: 'GST',
    auto_approve: true, confidence_threshold: 0.98,
    notes: 'Monthly office lease payment',
    stats: { total_matches: 12, auto_approved: 12, manually_overridden: 0, false_positives: 0, accuracy_pct: 100 },
  },
  {
    id: 'demo-3', name: 'AWS Cloud Services', status: 'active', source: 'ai_learned', priority: 15,
    conditions: [{ type: 'merchant_contains', value: 'aws' }, { type: 'description_contains', value: 'amazon web services' }],
    action_category: 'Cloud & Hosting', action_account: '6310 — IT & Software', action_tax_code: 'GST',
    auto_approve: false, confidence_threshold: 0.90,
    notes: 'Learned from 23 approved transactions',
    stats: { total_matches: 23, auto_approved: 0, manually_overridden: 2, false_positives: 0, accuracy_pct: 100 },
  },
  {
    id: 'demo-4', name: 'Staff Meals — Under $50', status: 'active', source: 'ai_suggested', priority: 20,
    conditions: [{ type: 'category_code', value: '5812' }, { type: 'amount_range', min: 0, max: 50 }],
    action_category: 'Meals & Entertainment', action_account: '6410 — Meals & Entertainment', action_tax_code: 'GST',
    auto_approve: false, confidence_threshold: 0.85,
    notes: 'AI detected pattern: 47 similar transactions categorized this way',
    stats: { total_matches: 47, auto_approved: 0, manually_overridden: 5, false_positives: 2, accuracy_pct: 95.7 },
  },
  {
    id: 'demo-5', name: 'Xero Subscription', status: 'active', source: 'ai_learned', priority: 8,
    conditions: [{ type: 'merchant_exact', value: 'Xero' }, { type: 'amount_exact', value: 79 }],
    action_category: 'Software Subscriptions', action_account: '6310 — IT & Software', action_tax_code: 'GST',
    auto_approve: true, confidence_threshold: 0.99,
    notes: 'Learned from 12 months of identical charges.',
    stats: { total_matches: 12, auto_approved: 12, manually_overridden: 0, false_positives: 0, accuracy_pct: 100 },
  },
  {
    id: 'demo-6', name: 'Uber / Taxi Rides', status: 'paused', source: 'ai_suggested', priority: 25,
    conditions: [{ type: 'merchant_contains', value: 'uber' }],
    action_category: 'Travel & Transport', action_account: '6500 — Travel Expenses', action_tax_code: 'GST',
    auto_approve: false, confidence_threshold: 0.88,
    notes: 'Paused — need to split business vs personal rides',
    stats: { total_matches: 31, auto_approved: 0, manually_overridden: 8, false_positives: 4, accuracy_pct: 87.1 },
  },
];

const DEMO_SUGGESTIONS = [
  {
    name: 'Telstra — Telecommunications', confidence: 0.94, match_count: 15,
    reason: '15 transactions to "Telstra" in the last 6 months, all categorized as Telecommunications',
    conditions: [{ type: 'merchant_contains', value: 'telstra' }],
    action_category: 'Telecommunications', action_account: '6320 — Telecommunications', action_tax_code: 'GST',
  },
  {
    name: 'BP / Shell — Vehicle Fuel', confidence: 0.91, match_count: 22,
    reason: '22 fuel purchases across BP and Shell, consistently categorized as Vehicle Expenses',
    conditions: [{ type: 'merchant_contains', value: 'bp' }, { type: 'category_code', value: '5541' }],
    action_category: 'Vehicle Expenses', action_account: '6520 — Vehicle Expenses', action_tax_code: 'GST',
  },
  {
    name: 'Woolworths — Office Pantry', confidence: 0.82, match_count: 8,
    reason: '8 small Woolworths transactions ($10–$60) categorized as Office Expenses',
    conditions: [{ type: 'merchant_contains', value: 'woolworths' }, { type: 'amount_range', min: 5, max: 60 }],
    action_category: 'Office Expenses', action_account: '6100 — Office Expenses', action_tax_code: 'GST',
  },
];

function conditionLabel(c) {
  const t = CONDITION_TYPES.find(ct => ct.value === c.type);
  const label = t ? t.label : c.type;
  if (c.type === 'amount_range') return `${label}: $${c.min ?? 0} – $${c.max ?? '∞'}`;
  return `${label}: "${c.value}"`;
}

export default function BankRules() {
  const toast = useToast();
  const [rules, setRules] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [expandedRule, setExpandedRule] = useState(null);
  const [tab, setTab] = useState('rules');

  const [formName, setFormName] = useState('');
  const [formConditions, setFormConditions] = useState([{ type: 'merchant_contains', value: '' }]);
  const [formCategory, setFormCategory] = useState('');
  const [formAccount, setFormAccount] = useState('');
  const [formTaxCode, setFormTaxCode] = useState('GST');
  const [formAutoApprove, setFormAutoApprove] = useState(false);
  const [formThreshold, setFormThreshold] = useState(0.90);
  const [formPriority, setFormPriority] = useState(50);
  const [formNotes, setFormNotes] = useState('');

  const fetchData = useCallback(() => {
    api.get('/bank-rules/rules').then(r => setRules(r.data.rules || r.data || [])).catch(() => setRules(DEMO_RULES));
    api.get('/bank-rules/suggestions').then(r => setSuggestions(r.data.suggestions || [])).catch(() => setSuggestions(DEMO_SUGGESTIONS));
    api.get('/bank-rules/stats').then(r => setStats(r.data)).catch(() => setStats({
      total_rules: 6, active_rules: 5, paused_rules: 1, draft_rules: 0,
      manual_rules: 2, ai_learned_rules: 2, ai_suggested_rules: 2,
      total_matches: 212, total_auto_approved: 106, total_overrides: 18, total_false_positives: 7,
      overall_accuracy: 96.7, automation_rate: 50.0, time_saved_hours: 0.9,
    }));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormName(''); setFormConditions([{ type: 'merchant_contains', value: '' }]);
    setFormCategory(''); setFormAccount(''); setFormTaxCode('GST');
    setFormAutoApprove(false); setFormThreshold(0.90); setFormPriority(50); setFormNotes('');
  };

  const openEdit = (rule) => {
    setEditRule(rule);
    setFormName(rule.name); setFormConditions([...rule.conditions]);
    setFormCategory(rule.action_category); setFormAccount(rule.action_account);
    setFormTaxCode(rule.action_tax_code); setFormAutoApprove(rule.auto_approve);
    setFormThreshold(rule.confidence_threshold); setFormPriority(rule.priority);
    setFormNotes(rule.notes || '');
    setShowCreate(true);
  };

  const saveRule = async () => {
    if (!formName.trim()) { toast.error('Rule name is required'); return; }
    const payload = {
      name: formName, conditions: formConditions.filter(c => c.value || c.min != null),
      action_category: formCategory, action_account: formAccount, action_tax_code: formTaxCode,
      auto_approve: formAutoApprove, confidence_threshold: formThreshold,
      priority: formPriority, notes: formNotes, status: 'active',
    };
    try {
      if (editRule) {
        await api.put(`/bank-rules/rules/${editRule.id}`, payload);
        toast.success('Rule updated');
      } else {
        await api.post('/bank-rules/rules', payload);
        toast.success('Rule created');
      }
      setShowCreate(false); setEditRule(null); resetForm(); fetchData();
    } catch {
      if (editRule) {
        setRules(prev => prev.map(r => r.id === editRule.id ? { ...r, ...payload } : r));
        toast.success('Rule updated (local)');
      } else {
        const newRule = { id: `local-${Date.now()}`, ...payload, source: 'manual', stats: { total_matches: 0, auto_approved: 0, manually_overridden: 0, false_positives: 0, accuracy_pct: 100 } };
        setRules(prev => [...prev, newRule]);
        toast.success('Rule created (local)');
      }
      setShowCreate(false); setEditRule(null); resetForm();
    }
  };

  const toggleRule = async (rule) => {
    const newStatus = rule.status === 'active' ? 'paused' : 'active';
    try {
      await api.post(`/bank-rules/rules/${rule.id}/toggle`);
      toast.success(`Rule ${newStatus}`);
      fetchData();
    } catch {
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, status: newStatus } : r));
      toast.success(`Rule ${newStatus} (local)`);
    }
  };

  const deleteRule = async (rule) => {
    if (!window.confirm(`Delete rule "${rule.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/bank-rules/rules/${rule.id}`);
      toast.success('Rule deleted');
      fetchData();
    } catch {
      setRules(prev => prev.filter(r => r.id !== rule.id));
      toast.success('Rule deleted (local)');
    }
  };

  const acceptSuggestion = (suggestion) => {
    const newRule = {
      id: `suggested-${Date.now()}`, ...suggestion, status: 'active', source: 'ai_suggested',
      auto_approve: false, confidence_threshold: suggestion.confidence, priority: 50,
      notes: suggestion.reason,
      stats: { total_matches: suggestion.match_count, auto_approved: 0, manually_overridden: 0, false_positives: 0, accuracy_pct: 100 },
    };
    setRules(prev => [...prev, newRule]);
    setSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
    toast.success(`Rule "${suggestion.name}" created from suggestion`);
  };

  const filtered = rules.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !(r.action_category || '').toLowerCase().includes(q) && !(r.notes || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const addCondition = () => setFormConditions(prev => [...prev, { type: 'merchant_contains', value: '' }]);
  const removeCondition = (idx) => setFormConditions(prev => prev.filter((_, i) => i !== idx));
  const updateCondition = (idx, field, val) => setFormConditions(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Rules</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-learning auto-categorization rules for bank transactions</p>
        </div>
        <button onClick={() => { resetForm(); setEditRule(null); setShowCreate(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          + Create Rule
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Active Rules</p>
            <p className="text-2xl font-bold text-gray-900">{stats.active_rules}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">AI-Learned</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.ai_learned_rules}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Matches</p>
            <p className="text-2xl font-bold text-gray-900">{(stats.total_matches || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Auto-Approved</p>
            <p className="text-2xl font-bold text-green-600">{(stats.total_auto_approved || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Accuracy</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.overall_accuracy}%</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Time Saved</p>
            <p className="text-2xl font-bold text-blue-600">{stats.time_saved_hours}h</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[{ id: 'rules', label: `Rules (${rules.length})` }, { id: 'suggestions', label: `AI Suggestions (${suggestions.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rules' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <input type="text" placeholder="Search rules..." value={search} onChange={e => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-64" />
            <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option value="all">All sources</option>
              <option value="manual">Manual</option>
              <option value="ai_learned">AI Learned</option>
              <option value="ai_suggested">AI Suggested</option>
            </select>
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} rule{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Rule list */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-12 bg-white border rounded-xl">
                <p className="text-gray-400 text-sm">No rules match your filters</p>
                <button onClick={() => { resetForm(); setEditRule(null); setShowCreate(true); }}
                  className="mt-3 text-sm text-indigo-600 hover:underline">Create your first rule</button>
              </div>
            )}
            {filtered.map(rule => {
              const style = STATUS_STYLES[rule.status] || STATUS_STYLES.draft;
              const src = SOURCE_LABELS[rule.source] || SOURCE_LABELS.manual;
              const st = rule.stats || {};
              const isExpanded = expandedRule === rule.id;

              return (
                <div key={rule.id} className={`border rounded-xl overflow-hidden transition ${style.bg}`}>
                  <div className="p-4 cursor-pointer" onClick={() => setExpandedRule(isExpanded ? null : rule.id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 truncate">{rule.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${style.badge}`}>{rule.status}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{src.icon} {src.label}</span>
                            {rule.auto_approve && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Auto-approve</span>}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {(rule.conditions || []).map((c, i) => (
                              <span key={i} className="text-xs bg-white/80 border rounded px-2 py-0.5 text-gray-600">{conditionLabel(c)}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Categorize as: <strong className="text-gray-700">{rule.action_category}</strong></span>
                            <span>Account: <strong className="text-gray-700">{rule.action_account}</strong></span>
                            <span>Tax: <strong className="text-gray-700">{rule.action_tax_code}</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-semibold text-gray-800">{(st.total_matches || 0).toLocaleString()} matches</p>
                          <p className="text-xs text-gray-500">{st.accuracy_pct || 100}% accurate</p>
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-3 bg-white/60">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                        <div><p className="text-xs text-gray-500">Total Matches</p><p className="font-semibold">{(st.total_matches || 0).toLocaleString()}</p></div>
                        <div><p className="text-xs text-gray-500">Auto-Approved</p><p className="font-semibold text-green-600">{(st.auto_approved || 0).toLocaleString()}</p></div>
                        <div><p className="text-xs text-gray-500">Manual Overrides</p><p className="font-semibold text-amber-600">{st.manually_overridden || 0}</p></div>
                        <div><p className="text-xs text-gray-500">False Positives</p><p className="font-semibold text-red-600">{st.false_positives || 0}</p></div>
                        <div><p className="text-xs text-gray-500">Confidence Threshold</p><p className="font-semibold">{((rule.confidence_threshold || 0.9) * 100).toFixed(0)}%</p></div>
                      </div>
                      {rule.notes && <p className="text-sm text-gray-600 mb-3">{rule.notes}</p>}
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(rule); }}
                          className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition">Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); toggleRule(rule); }}
                          className="px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition">
                          {rule.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteRule(rule); }}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'suggestions' && (
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="text-center py-12 bg-white border rounded-xl">
              <p className="text-2xl mb-2">🧠</p>
              <p className="text-gray-600 font-medium">No suggestions right now</p>
              <p className="text-sm text-gray-400 mt-1">The AI engine learns from your approvals in the Review Queue.<br/>Approve more transactions to generate smarter rules.</p>
            </div>
          ) : (
            <>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <p className="text-sm text-indigo-800">
                  <strong>How it works:</strong> AlecRae analyzes your approved transactions and identifies patterns.
                  When 3+ similar transactions are categorized the same way, it suggests a rule. Accept to automate future matches.
                </p>
              </div>
              {suggestions.map((s, i) => (
                <div key={i} className="bg-white border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💡</span>
                        <h3 className="font-semibold text-gray-900">{s.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{(s.confidence * 100).toFixed(0)}% confidence</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{s.reason}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {s.conditions.map((c, ci) => (
                          <span key={ci} className="text-xs bg-gray-100 border rounded px-2 py-0.5 text-gray-600">{conditionLabel(c)}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Category: <strong className="text-gray-700">{s.action_category}</strong></span>
                        <span>Account: <strong className="text-gray-700">{s.action_account}</strong></span>
                        <span>Based on: <strong className="text-gray-700">{s.match_count} transactions</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => acceptSuggestion(s)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                        Accept
                      </button>
                      <button onClick={() => setSuggestions(prev => prev.filter((_, idx) => idx !== i))}
                        className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Create/Edit modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setShowCreate(false); setEditRule(null); resetForm(); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editRule ? 'Edit Rule' : 'Create Bank Rule'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Office Supplies — Officeworks"
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Conditions (all must match)</label>
                  <button onClick={addCondition} className="text-xs text-indigo-600 hover:underline">+ Add condition</button>
                </div>
                <div className="space-y-2">
                  {formConditions.map((c, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <select value={c.type} onChange={e => updateCondition(i, 'type', e.target.value)}
                        className="border rounded-lg px-2 py-2 text-sm w-48">
                        {CONDITION_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                      </select>
                      {c.type === 'amount_range' ? (
                        <div className="flex gap-2 flex-1">
                          <input type="number" placeholder="Min" value={c.min || ''} onChange={e => updateCondition(i, 'min', parseFloat(e.target.value) || 0)}
                            className="border rounded-lg px-3 py-2 text-sm flex-1" />
                          <input type="number" placeholder="Max" value={c.max || ''} onChange={e => updateCondition(i, 'max', parseFloat(e.target.value) || 0)}
                            className="border rounded-lg px-3 py-2 text-sm flex-1" />
                        </div>
                      ) : (
                        <input type={c.type === 'amount_exact' ? 'number' : 'text'} value={c.value || ''} onChange={e => updateCondition(i, 'value', e.target.value)}
                          placeholder={c.type.includes('merchant') ? 'Merchant name...' : c.type.includes('description') ? 'Keyword...' : 'Value...'}
                          className="border rounded-lg px-3 py-2 text-sm flex-1" />
                      )}
                      {formConditions.length > 1 && (
                        <button onClick={() => removeCondition(i)} className="text-red-400 hover:text-red-600 px-2 py-2">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input type="text" value={formCategory} onChange={e => setFormCategory(e.target.value)}
                    placeholder="e.g. Office Supplies" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                  <input type="text" value={formAccount} onChange={e => setFormAccount(e.target.value)}
                    placeholder="e.g. 6100 — Office Expenses" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Code</label>
                  <select value={formTaxCode} onChange={e => setFormTaxCode(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="GST">GST (10%)</option>
                    <option value="GST-Free">GST-Free</option>
                    <option value="Input Taxed">Input Taxed</option>
                    <option value="VAT">VAT (20%)</option>
                    <option value="Zero Rated">Zero Rated</option>
                    <option value="Exempt">Exempt</option>
                    <option value="No Tax">No Tax</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Threshold</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min="0.5" max="1" step="0.01" value={formThreshold}
                      onChange={e => setFormThreshold(parseFloat(e.target.value))}
                      className="flex-1" />
                    <span className="text-sm font-medium w-12 text-right">{(formThreshold * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority (lower = higher)</label>
                  <input type="number" value={formPriority} onChange={e => setFormPriority(parseInt(e.target.value) || 50)}
                    min="1" max="100" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formAutoApprove} onChange={e => setFormAutoApprove(e.target.checked)}
                      className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Auto-approve matches</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)}
                  rows={2} placeholder="Any notes about this rule..." className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowCreate(false); setEditRule(null); resetForm(); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={saveRule}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                {editRule ? 'Save Changes' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ProprietaryNotice />
    </div>
  );
}
