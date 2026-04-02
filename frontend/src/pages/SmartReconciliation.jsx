import { useState } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const MATCH_DATA = [
  { id: '1', bankDate: '01 Apr 2026', bankDesc: 'TRANSFER FROM COASTAL COFFEE', bankAmount: 4250.00, matchType: 'invoice', matchRef: 'INV-2041', matchEntity: 'Coastal Coffee Co', matchAmount: 4250.00, confidence: 99, status: 'pending' },
  { id: '2', bankDate: '01 Apr 2026', bankDesc: 'DIRECT DEBIT — ATO BAS', bankAmount: -3180.00, matchType: 'bill', matchRef: 'BAS-Q3-2026', matchEntity: 'Australian Tax Office', matchAmount: 3180.00, confidence: 98, status: 'pending' },
  { id: '3', bankDate: '31 Mar 2026', bankDesc: 'STRIPE PAYOUT 2903', bankAmount: 8420.00, matchType: 'invoice', matchRef: 'INV-2038 (+11 more)', matchEntity: 'Multiple Clients', matchAmount: 8420.00, confidence: 97, status: 'pending' },
  { id: '4', bankDate: '31 Mar 2026', bankDesc: 'BUNNINGS TRADE #4412', bankAmount: -1245.80, matchType: 'bill', matchRef: 'PO-0034', matchEntity: 'Bunnings Trade', matchAmount: 1245.80, confidence: 97, status: 'pending' },
  { id: '5', bankDate: '30 Mar 2026', bankDesc: 'PAYROLL RUN — MARCH', bankAmount: -14820.00, matchType: 'payroll', matchRef: 'PAY-2026-03', matchEntity: 'Staff Payroll', matchAmount: 14820.00, confidence: 96, status: 'pending' },
  { id: '6', bankDate: '30 Mar 2026', bankDesc: 'TRANSFER FROM NORTHSTAR', bankAmount: 6800.00, matchType: 'invoice', matchRef: 'INV-2036', matchEntity: 'NorthStar Consulting', matchAmount: 6800.00, confidence: 96, status: 'pending' },
  { id: '7', bankDate: '29 Mar 2026', bankDesc: 'XERO SUBSCRIPTION', bankAmount: -79.00, matchType: 'bill', matchRef: 'EXP-0891', matchEntity: 'Xero Ltd', matchAmount: 79.00, confidence: 95, status: 'pending' },
  { id: '8', bankDate: '28 Mar 2026', bankDesc: 'OFFICEWORKS #2281', bankAmount: -342.50, matchType: 'bill', matchRef: 'PO-0031', matchEntity: 'Officeworks', matchAmount: 342.50, confidence: 94, status: 'pending' },
  { id: '9', bankDate: '27 Mar 2026', bankDesc: 'CLIENT DEPOSIT — KIWI DESIGN', bankAmount: 2200.00, matchType: 'invoice', matchRef: 'INV-2030', matchEntity: 'Kiwi Design Studio', matchAmount: 2200.00, confidence: 92, status: 'pending' },
  { id: '10', bankDate: '27 Mar 2026', bankDesc: 'UBER EATS — TEAM LUNCH', bankAmount: -89.40, matchType: 'expense', matchRef: 'EXP-0887', matchEntity: 'Uber Eats', matchAmount: 89.40, confidence: 91, status: 'pending' },
  { id: '11', bankDate: '26 Mar 2026', bankDesc: 'TRANSFER 884521', bankAmount: 1500.00, matchType: 'invoice', matchRef: 'INV-2027', matchEntity: 'Summit Property Group', matchAmount: 1500.00, confidence: 88, status: 'pending' },
  { id: '12', bankDate: '25 Mar 2026', bankDesc: 'CANVA PTY LTD', bankAmount: -39.99, matchType: 'bill', matchRef: 'EXP-0882', matchEntity: 'Canva', matchAmount: 39.99, confidence: 86, status: 'pending' },
  { id: '13', bankDate: '24 Mar 2026', bankDesc: 'DEPOSIT — REF 77201', bankAmount: 3100.00, matchType: 'invoice', matchRef: 'INV-2024', matchEntity: 'Pacific Retail Co', matchAmount: 3250.00, confidence: 82, status: 'pending' },
  { id: '14', bankDate: '23 Mar 2026', bankDesc: 'PAYMENT — JOHNSON & ASSOC', bankAmount: -2750.00, matchType: 'bill', matchRef: 'BILL-0114', matchEntity: 'Johnson & Associates', matchAmount: 2750.00, confidence: 78, status: 'pending' },
  { id: '15', bankDate: '22 Mar 2026', bankDesc: 'UNKNOWN — DIGITAL SVCS', bankAmount: -199.00, matchType: 'expense', matchRef: 'EXP-0879', matchEntity: 'Digital Services Co', matchAmount: 215.00, confidence: 64, status: 'pending' },
];

const UNMATCHED_DATA = [
  { id: 'u1', bankDate: '20 Mar 2026', bankDesc: 'ATM WITHDRAWAL — SYDNEY CBD', bankAmount: -500.00, suggestions: ['Create new expense — Petty Cash', 'Ask client for receipt', 'Flag for review'] },
  { id: 'u2', bankDate: '18 Mar 2026', bankDesc: 'TFR 993201 — NO REFERENCE', bankAmount: 1250.00, suggestions: ['Split transaction — partial invoice match', 'Create new income — Miscellaneous', 'Ask client to identify'] },
  { id: 'u3', bankDate: '15 Mar 2026', bankDesc: 'REFUND — ORDER #UNKNOWN', bankAmount: 82.50, suggestions: ['Match to credit note CN-0018', 'Create new income — Refund received', 'Ask client for details'] },
];

const RULES_DATA = [
  { id: 'r1', vendor: 'Bunnings Trade', account: '5100 — Cost of Goods Sold', matches: 23, created: '3 months ago' },
  { id: 'r2', vendor: 'Officeworks', account: '6200 — Office Supplies', matches: 18, created: '2 months ago' },
  { id: 'r3', vendor: 'Xero Ltd', account: '6400 — Software Subscriptions', matches: 12, created: '6 months ago' },
  { id: 'r4', vendor: 'Uber Eats', account: '6500 — Meals & Entertainment', matches: 8, created: '1 month ago' },
  { id: 'r5', vendor: 'Canva', account: '6400 — Software Subscriptions', matches: 6, created: '4 months ago' },
];

const MONTHLY_STATS = [
  { month: 'Nov', manual: 7.2, ai: 1.8, total: 128 },
  { month: 'Dec', manual: 5.4, ai: 1.2, total: 141 },
  { month: 'Jan', manual: 3.1, ai: 0.8, total: 134 },
  { month: 'Feb', manual: 1.6, ai: 0.5, total: 148 },
  { month: 'Mar', manual: 0.8, ai: 0.3, total: 156 },
  { month: 'Apr', manual: 0.4, ai: 0.2, total: 162 },
];

function confidenceColor(c) {
  if (c >= 95) return 'text-green-600 bg-green-50';
  if (c >= 80) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

function confidenceDot(c) {
  if (c >= 95) return 'bg-green-500';
  if (c >= 80) return 'bg-amber-500';
  return 'bg-red-500';
}

function typeLabel(t) {
  const map = { invoice: 'Invoice', bill: 'Bill', payroll: 'Payroll', expense: 'Expense' };
  return map[t] || t;
}

function typeBadge(t) {
  const map = {
    invoice: 'bg-green-100 text-green-700',
    bill: 'bg-blue-100 text-blue-700',
    payroll: 'bg-purple-100 text-purple-700',
    expense: 'bg-gray-100 text-gray-700',
  };
  return map[t] || 'bg-gray-100 text-gray-700';
}

export default function SmartReconciliation() {
  const [matches, setMatches] = useState(MATCH_DATA);
  const [unmatched, setUnmatched] = useState(UNMATCHED_DATA);
  const [rules, setRules] = useState(RULES_DATA);
  const [autoReconciling, setAutoReconciling] = useState(false);
  const [reconcileProgress, setReconcileProgress] = useState(0);
  const [reconcileDone, setReconcileDone] = useState(false);
  const [tab, setTab] = useState('matches');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRuleVendor, setNewRuleVendor] = useState('');
  const [newRuleAccount, setNewRuleAccount] = useState('');
  const toast = useToast();

  const totalUnreconciled = 156;
  const aiMatched = matches.filter(m => m.confidence >= 80).length;
  const needsReview = matches.filter(m => m.confidence >= 60 && m.confidence < 80).length;
  const approvedCount = matches.filter(m => m.status === 'approved').length;
  const rejectedCount = matches.filter(m => m.status === 'rejected').length;
  const remaining = totalUnreconciled - approvedCount - (reconcileDone ? (aiMatched - approvedCount - rejectedCount) : 0);

  function handleAutoReconcile() {
    setAutoReconciling(true);
    setReconcileProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setReconcileProgress(100);
        setAutoReconciling(false);
        setReconcileDone(true);
        setMatches(prev => prev.map(m =>
          m.confidence >= 80 && m.status === 'pending' ? { ...m, status: 'approved' } : m
        ));
        toast.success('Auto-reconciled 142 transactions. 3 remaining for manual review.');
      } else {
        setReconcileProgress(Math.min(progress, 100));
      }
    }, 200);
  }

  function handleApprove(id) {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, status: 'approved' } : m));
    toast.success('Match approved');
  }

  function handleReject(id) {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, status: 'rejected' } : m));
    toast.info('Match rejected — moved to unmatched');
  }

  function handleUnmatchedAction(id, action) {
    setUnmatched(prev => prev.filter(u => u.id !== id));
    toast.success(action);
  }

  function handleCreateRule() {
    if (!newRuleVendor.trim() || !newRuleAccount.trim()) {
      toast.error('Please enter both vendor name and account code');
      return;
    }
    const newRule = {
      id: `r${rules.length + 1}`,
      vendor: newRuleVendor.trim(),
      account: newRuleAccount.trim(),
      matches: 0,
      created: 'Just now',
    };
    setRules(prev => [...prev, newRule]);
    setNewRuleVendor('');
    setNewRuleAccount('');
    setShowRuleModal(false);
    toast.success(`Rule created: "${newRuleVendor}" → ${newRuleAccount}`);
  }

  const visibleMatches = tab === 'matches'
    ? matches.filter(m => m.status === 'pending')
    : tab === 'approved'
    ? matches.filter(m => m.status === 'approved')
    : matches.filter(m => m.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Reconciliation</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI matches bank transactions to invoices, bills, and expenses — approve in one click</p>
        </div>
        <button
          onClick={handleAutoReconcile}
          disabled={autoReconciling || reconcileDone}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            reconcileDone
              ? 'bg-green-100 text-green-700 cursor-default'
              : autoReconciling
              ? 'bg-indigo-400 text-white cursor-wait'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
          }`}
        >
          {reconcileDone ? '✓ Auto-Reconciled' : autoReconciling ? 'Reconciling...' : 'Auto-Reconcile All (142)'}
        </button>
      </div>

      {/* Auto-reconcile progress bar */}
      {(autoReconciling || reconcileDone) && (
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {reconcileDone ? 'Reconciliation complete' : `Processing ${Math.round(reconcileProgress * 1.42)} of 142 transactions...`}
            </span>
            <span className="text-sm font-bold text-indigo-600">{Math.round(reconcileProgress)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${reconcileDone ? 'bg-green-500' : 'bg-indigo-600'}`}
              style={{ width: `${reconcileProgress}%` }}
            />
          </div>
          {reconcileDone && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">Before:</span>
              <span className="text-xs font-medium text-red-600 line-through">156 unreconciled</span>
              <span className="text-xs text-gray-400">→</span>
              <span className="text-xs text-gray-500">After:</span>
              <span className="text-xs font-medium text-green-600">{unmatched.length + matches.filter(m => m.status === 'pending' || m.status === 'rejected').length} remaining</span>
              <span className="ml-2 text-xs text-gray-400">|</span>
              <span className="text-xs text-green-600 font-medium">12.4 hours saved this month</span>
            </div>
          )}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Unreconciled</p>
          <p className="text-2xl font-bold text-gray-900">156</p>
          <p className="text-[10px] text-gray-400 mt-0.5">This month</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">AI Auto-Matched</p>
          <p className="text-2xl font-bold text-green-600">142</p>
          <p className="text-[10px] text-green-500 mt-0.5">91% match rate</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Needs Review</p>
          <p className="text-2xl font-bold text-amber-600">11</p>
          <p className="text-[10px] text-amber-500 mt-0.5">Below 80% confidence</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Unmatched</p>
          <p className="text-2xl font-bold text-red-600">3</p>
          <p className="text-[10px] text-red-400 mt-0.5">Manual action needed</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Time Saved</p>
          <p className="text-2xl font-bold text-indigo-600">12.4h</p>
          <p className="text-[10px] text-indigo-400 mt-0.5">This month</p>
        </div>
      </div>

      {/* Smart Match Table */}
      <div className="bg-white border rounded-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Smart Match Table</h2>
            <p className="text-xs text-gray-500 mt-0.5">AI-suggested matches sorted by confidence — review and approve</p>
          </div>
          <div className="flex gap-1.5">
            {[
              { key: 'matches', label: 'Pending', count: matches.filter(m => m.status === 'pending').length },
              { key: 'approved', label: 'Approved', count: approvedCount },
              { key: 'rejected', label: 'Rejected', count: rejectedCount },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tab === t.key ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">Date</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">Bank Transaction</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-500">Amount</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">AI Match</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">Entity</th>
                <th className="text-center py-2.5 px-4 text-xs font-medium text-gray-500">Confidence</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleMatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    {tab === 'matches' ? 'All matches processed — nothing pending' : `No ${tab} matches yet`}
                  </td>
                </tr>
              ) : (
                visibleMatches.map(m => (
                  <tr key={m.id} className="border-b last:border-b-0 hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{m.bankDate}</td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-medium text-gray-900 truncate max-w-[200px]">{m.bankDesc}</p>
                    </td>
                    <td className={`py-3 px-4 text-xs font-semibold text-right whitespace-nowrap ${m.bankAmount >= 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {m.bankAmount >= 0 ? '+' : ''}{m.bankAmount < 0 ? '-' : ''}${Math.abs(m.bankAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeBadge(m.matchType)}`}>
                          {typeLabel(m.matchType)}
                        </span>
                        <span className="text-xs text-gray-700 font-medium">{m.matchRef}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700 truncate max-w-[140px]">{m.matchEntity}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${confidenceDot(m.confidence)}`} />
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${confidenceColor(m.confidence)}`}>
                          {m.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {m.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleApprove(m.id)} className="px-2.5 py-1 rounded text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                            Approve
                          </button>
                          <button onClick={() => handleReject(m.id)} className="px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          m.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {m.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unmatched Transactions */}
      <div className="bg-white border rounded-xl">
        <div className="p-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Unmatched Transactions</h2>
          <p className="text-xs text-gray-500 mt-0.5">{unmatched.length} transaction{unmatched.length !== 1 ? 's' : ''} could not be automatically matched — AI suggests next steps</p>
        </div>
        <div className="divide-y">
          {unmatched.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">All transactions matched — nothing remaining</div>
          ) : (
            unmatched.map(u => (
              <div key={u.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{u.bankDate}</span>
                    <span className="text-sm font-medium text-gray-900">{u.bankDesc}</span>
                    <span className={`text-sm font-semibold ${u.bankAmount >= 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {u.bankAmount >= 0 ? '+' : ''}{u.bankAmount < 0 ? '-' : ''}${Math.abs(u.bankAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">AI suggestions:</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {u.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleUnmatchedAction(u.id, s)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        i === 0
                          ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reconciliation Rules */}
      <div className="bg-white border rounded-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Reconciliation Rules</h2>
            <p className="text-xs text-gray-500 mt-0.5">Auto-match rules learn from your approvals — future reconciliation gets faster</p>
          </div>
          <button
            onClick={() => setShowRuleModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            + Create Rule
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">Vendor / Description</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">Account Code</th>
                <th className="text-center py-2.5 px-4 text-xs font-medium text-gray-500">Matches Applied</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">Created</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 text-xs font-medium text-gray-900">{r.vendor}</td>
                  <td className="py-3 px-4 text-xs text-gray-700">{r.account}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold">{r.matches}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400">{r.created}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setRules(prev => prev.filter(rule => rule.id !== r.id));
                        toast.info(`Rule for "${r.vendor}" removed`);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white border rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900">Monthly Reconciliation Summary</h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">AI learns from your approvals — reconciliation gets faster every month</p>

        <div className="grid grid-cols-6 gap-3 mb-4">
          {MONTHLY_STATS.map(s => (
            <div key={s.month} className="text-center">
              <p className="text-xs font-medium text-gray-500 mb-2">{s.month}</p>
              <div className="bg-gray-100 rounded-lg h-32 flex flex-col justify-end overflow-hidden relative">
                <div
                  className="bg-red-200 transition-all"
                  style={{ height: `${(s.manual / 8) * 100}%` }}
                  title={`${s.manual}h manual`}
                />
                <div
                  className="bg-indigo-400 transition-all"
                  style={{ height: `${(s.ai / 8) * 100}%` }}
                  title={`${s.ai}h AI-assisted`}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{s.total} txns</p>
              <p className="text-xs font-semibold text-gray-700">{(s.manual + s.ai).toFixed(1)}h</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-green-50 rounded-lg px-4 py-3">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500">First month (Nov)</p>
              <p className="text-sm font-bold text-red-600">9.0 hours manual</p>
            </div>
            <div className="text-gray-300 text-lg">→</div>
            <div>
              <p className="text-xs text-gray-500">This month (Apr)</p>
              <p className="text-sm font-bold text-green-600">0.6 hours total</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Time reduction</p>
            <p className="text-lg font-bold text-indigo-600">93%</p>
            <p className="text-[10px] text-gray-400">AI accuracy improving every month</p>
          </div>
        </div>

        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-200" />
            <span className="text-[10px] text-gray-500">Manual reconciliation time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-400" />
            <span className="text-[10px] text-gray-500">AI-assisted review time</span>
          </div>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowRuleModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Create Reconciliation Rule</h3>
            <p className="text-xs text-gray-500 mb-4">Transactions matching this vendor will auto-categorize in the future</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Vendor / Description Contains</label>
                <input
                  type="text"
                  value={newRuleVendor}
                  onChange={e => setNewRuleVendor(e.target.value)}
                  placeholder="e.g., BUNNINGS TRADE"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Map to Account</label>
                <input
                  type="text"
                  value={newRuleAccount}
                  onChange={e => setNewRuleAccount(e.target.value)}
                  placeholder="e.g., 5100 — Cost of Goods Sold"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowRuleModal(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      <ProprietaryNotice />
    </div>
  );
}
