import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import LegalDisclaimer from '../components/LegalDisclaimer';

const PAYMENT_ICONS = {
  eftpos: 'EFTPOS', debit: 'Debit', credit: 'Credit',
  apple_pay: 'Apple Pay', google_pay: 'Google Pay', samsung_pay: 'Samsung Pay',
  bank_transfer: 'Transfer', direct_debit: 'DD', unknown: 'Card',
};

const QUICK_CATEGORIES = [
  { code: 'office_supplies', label: 'Office Supplies', color: 'bg-blue-100 text-blue-700' },
  { code: 'software', label: 'Software', color: 'bg-purple-100 text-purple-700' },
  { code: 'travel', label: 'Travel', color: 'bg-cyan-100 text-cyan-700' },
  { code: 'meals', label: 'Meals', color: 'bg-orange-100 text-orange-700' },
  { code: 'fuel', label: 'Fuel', color: 'bg-amber-100 text-amber-700' },
  { code: 'phone_internet', label: 'Phone/Internet', color: 'bg-teal-100 text-teal-700' },
  { code: 'advertising', label: 'Marketing', color: 'bg-pink-100 text-pink-700' },
  { code: 'professional_fees', label: 'Professional', color: 'bg-indigo-100 text-indigo-700' },
  { code: 'equipment', label: 'Equipment', color: 'bg-gray-200 text-gray-700' },
  { code: 'insurance', label: 'Insurance', color: 'bg-emerald-100 text-emerald-700' },
];

export default function LiveReceipt() {
  const [userMode, setUserMode] = useState('owner'); // owner | employee | accountant
  const [pending, setPending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentClients, setRecentClients] = useState([]);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [assignMode, setAssignMode] = useState(null); // client | business | personal | employee
  const [clientSearch, setClientSearch] = useState('');
  const [expenseAccount, setExpenseAccount] = useState(null);
  const [employeeClaims, setEmployeeClaims] = useState([]);
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ project: '', department: '', cost_center: '', business_justification: '' });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ amount: '', merchant_name: '', payment_method: 'eftpos', currency: 'AUD' });
  const toast = useToast();

  const fetchData = () => {
    api.get('/live-receipt/pending').then(r => setPending(r.data.receipts || [])).catch(() => null);
    api.get('/live-receipt/recent?limit=10').then(r => setRecent(r.data.receipts || [])).catch(() => null);
    api.get('/live-receipt/stats').then(r => setStats(r.data)).catch(() => null);
    api.get('/live-receipt/clients').then(r => setRecentClients(r.data.clients || [])).catch(() => null);
  };

  const fetchEmployeeData = () => {
    api.get('/expense-accounts/accounts/me').then(r => setExpenseAccount(r.data)).catch(() => null);
    api.get('/expense-accounts/claims').then(r => setEmployeeClaims(r.data.claims || [])).catch(() => null);
    api.get('/expense-accounts/approvals').then(r => setApprovalQueue(r.data.claims || [])).catch(() => null);
  };

  useEffect(() => { fetchData(); fetchEmployeeData(); const id = setInterval(fetchData, 10000); return () => clearInterval(id); }, []);

  const submitExpenseClaim = async (receipt) => {
    if (!receipt) return;
    try {
      const claim = await api.post('/expense-accounts/claims', {
        receipt_id: receipt.id,
        amount: receipt.amount,
        currency: receipt.currency,
        merchant_name: receipt.merchant_clean || receipt.merchant_name,
        category_code: selectedCategory || receipt.category_code || 'other',
        project: expenseForm.project,
        department: expenseForm.department,
        cost_center: expenseForm.cost_center,
        business_justification: expenseForm.business_justification,
        payment_method: receipt.payment_method,
      });
      // Auto-submit after creating
      await api.post(`/expense-accounts/claims/${claim.data.id}/submit`);
      toast.success(claim.data.approval_path === 'auto_approve' ? 'Expense auto-approved!' : 'Submitted for approval');
      setActiveReceipt(null);
      setExpenseForm({ project: '', department: '', cost_center: '', business_justification: '' });
      fetchData(); fetchEmployeeData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit expense');
    }
  };

  const processApproval = async (claimId, decision, notes = '') => {
    try {
      await api.post(`/expense-accounts/approvals/${claimId}`, { decision, notes, reason: notes, question: notes });
      toast.success(decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Question sent');
      fetchEmployeeData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const openAssign = (receipt) => {
    setActiveReceipt(receipt);
    setAssignMode(null);
    setClientSearch('');
    setSelectedCategory(receipt.category_code);
    setNote('');
  };

  const assign = async (type, clientName = null) => {
    if (!activeReceipt) return;
    try {
      await api.post(`/live-receipt/${activeReceipt.id}/assign`, {
        assignment_type: type,
        client_name: clientName,
        category_code: selectedCategory,
        note: note,
      });
      toast.success(
        type === 'client_expense' ? `Assigned to ${clientName}` :
        type === 'personal' ? 'Marked as personal' : 'Categorized as business expense'
      );
      setActiveReceipt(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign');
    }
  };

  const skip = async (id) => {
    try {
      await api.post(`/live-receipt/${id}/skip`);
      fetchData();
    } catch { toast.error('Failed to skip'); }
  };

  const dismiss = async (id) => {
    try {
      await api.post(`/live-receipt/${id}/dismiss`);
      toast.success('Dismissed');
      fetchData();
    } catch { toast.error('Failed to dismiss'); }
  };

  const addManual = async () => {
    if (!manualForm.amount || !manualForm.merchant_name) return toast.error('Amount and merchant required');
    try {
      await api.post('/live-receipt/manual', {
        ...manualForm,
        amount: parseFloat(manualForm.amount),
      });
      toast.success('Transaction added');
      setShowManual(false);
      setManualForm({ amount: '', merchant_name: '', payment_method: 'eftpos', currency: 'AUD' });
      fetchData();
    } catch { toast.error('Failed to add'); }
  };

  const filteredClients = recentClients.filter(c =>
    !clientSearch || c.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Live Receipt</h2>
          <p className="text-gray-500 mt-1">Tap to assign expenses the moment they happen</p>
          <LegalDisclaimer type="live_receipt" className="mt-3" />
        </div>
        <button onClick={() => setShowManual(true)}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Manual
        </button>
      </div>

      {/* Mode selector */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          ['owner', 'Business Owner'],
          ['employee', 'Employee'],
          ['accountant', 'Accountant / Manager'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setUserMode(key)}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              userMode === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{label}</button>
        ))}
      </div>

      {/* Employee expense account banner */}
      {userMode === 'employee' && expenseAccount?.has_account && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-indigo-900">Expense Account</p>
              <p className="text-xs text-indigo-600">{expenseAccount.account?.org_name || 'Your Organization'} &middot; {expenseAccount.account?.department || 'General'}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-indigo-900">${(expenseAccount.account?.monthly_limit - expenseAccount.account?.spent_this_month)?.toFixed(0) || 0}</p>
              <p className="text-[10px] text-indigo-500">remaining this month</p>
            </div>
          </div>
          <div className="mt-2 bg-indigo-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (expenseAccount.account?.spent_this_month / expenseAccount.account?.monthly_limit) * 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-indigo-400">${expenseAccount.account?.spent_this_month?.toFixed(0)} spent</span>
            <span className="text-[10px] text-indigo-400">${expenseAccount.account?.monthly_limit?.toFixed(0)} limit</span>
          </div>
        </div>
      )}

      {userMode === 'employee' && !expenseAccount?.has_account && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-amber-800 font-medium">No expense account set up yet</p>
          <p className="text-xs text-amber-600 mt-1">Ask your manager or admin to create an expense account for you. Once set up, transactions from your company card will appear here automatically.</p>
        </div>
      )}

      {/* Manager approval queue */}
      {userMode === 'accountant' && approvalQueue.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Approval Queue ({approvalQueue.length})
          </h3>
          <div className="space-y-2">
            {approvalQueue.map(claim => (
              <div key={claim.id} className="bg-white border-2 border-amber-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold">${claim.amount.toFixed(2)} <span className="font-normal text-sm text-gray-500">at {claim.merchant_name}</span></p>
                    <p className="text-xs text-gray-500">{claim.employee_name} &middot; {claim.department || 'No dept'} &middot; {claim.project || 'No project'}</p>
                    {claim.business_justification && (
                      <p className="text-xs text-gray-600 mt-1 italic">"{claim.business_justification}"</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${claim.approval_path === 'dual_approval' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {claim.approval_path === 'dual_approval' ? 'High value' : 'Review'}
                  </span>
                </div>
                {claim.violations?.length > 0 && (
                  <div className="mb-2">
                    {claim.violations.map((v, i) => (
                      <p key={i} className="text-[10px] text-red-500 bg-red-50 rounded px-2 py-0.5 mb-0.5">{v}</p>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => processApproval(claim.id, 'approved')}
                    className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">Approve</button>
                  <button onClick={() => { const reason = window.prompt('Rejection reason:'); if (reason) processApproval(claim.id, 'rejected', reason); }}
                    className="py-2 px-4 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200">Reject</button>
                  <button onClick={() => { const q = window.prompt('Your question:'); if (q) processApproval(claim.id, 'query', q); }}
                    className="py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Ask</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee recent claims */}
      {userMode === 'employee' && employeeClaims.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">My Claims</h3>
          <div className="space-y-2">
            {employeeClaims.slice(0, 5).map(claim => (
              <div key={claim.id} className="bg-white border rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{claim.merchant_name}</p>
                  <p className="text-xs text-gray-400">{claim.project || claim.department || 'General'}</p>
                </div>
                <p className="font-bold text-sm">${claim.amount.toFixed(2)}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                  claim.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  claim.status === 'queried' ? 'bg-amber-100 text-amber-600' :
                  'bg-gray-100 text-gray-500'
                }`}>{claim.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.pending_count}</p>
            <p className="text-[10px] text-amber-500 uppercase tracking-wider">Pending</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.assigned_today}</p>
            <p className="text-[10px] text-green-500 uppercase tracking-wider">Done Today</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-indigo-700">{stats.auto_assign_rate}%</p>
            <p className="text-[10px] text-indigo-500 uppercase tracking-wider">Auto-Assigned</p>
          </div>
        </div>
      )}

      {/* Pending receipts — the main action area */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Waiting for You ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map(r => (
              <div key={r.id}
                className="bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => openAssign(r)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      ${r.amount.toFixed(2)}
                      <span className="text-xs font-normal text-gray-400 ml-1">{r.currency}</span>
                    </p>
                    <p className="text-base font-medium text-gray-700 mt-0.5">{r.merchant_clean || r.merchant_name}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                    {PAYMENT_ICONS[r.payment_method] || 'Card'}
                    {r.card_last_four ? ` ****${r.card_last_four}` : ''}
                  </span>
                </div>

                {/* AI suggestion */}
                {r.category_label && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                      {r.category_label}
                    </span>
                    {r.suggested_client && (
                      <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full font-medium">
                        {r.suggested_client}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">{Math.round(r.confidence * 100)}% confident</span>
                  </div>
                )}

                {/* Quick action buttons */}
                <div className="flex gap-2">
                  {r.suggested_client && (
                    <button onClick={e => { e.stopPropagation(); assign.call(null, 'client_expense', r.suggested_client); setActiveReceipt(r); assign('client_expense', r.suggested_client); }}
                      className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
                      {r.suggested_client}
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); openAssign(r); }}
                    className={`${r.suggested_client ? '' : 'flex-1'} py-2 px-4 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors`}>
                    Assign
                  </button>
                  {r.is_likely_personal && (
                    <button onClick={e => { e.stopPropagation(); setActiveReceipt(r); assign('personal'); }}
                      className="py-2 px-4 bg-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-300">
                      Personal
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); skip(r.id); }}
                    className="py-2 px-3 text-gray-400 hover:text-gray-600 text-sm">
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No pending */}
      {pending.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-green-800 mb-1">All caught up!</h3>
          <p className="text-sm text-green-600">No pending transactions. New ones will appear here instantly when you make a payment.</p>
        </div>
      )}

      {/* Recent history */}
      {recent.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Recently Assigned</h3>
          <div className="space-y-2">
            {recent.map(r => (
              <div key={r.id} className="bg-white border rounded-xl p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                  r.assignment_type === 'client_expense' ? 'bg-indigo-100 text-indigo-600' :
                  r.assignment_type === 'personal' ? 'bg-gray-100 text-gray-500' :
                  'bg-green-100 text-green-600'
                }`}>
                  {r.assignment_type === 'client_expense' ? 'C' :
                   r.assignment_type === 'personal' ? 'P' : 'B'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{r.merchant_clean || r.merchant_name}</p>
                  <p className="text-xs text-gray-400">
                    {r.assigned_client || (r.assignment_type === 'personal' ? 'Personal' : 'Business Expense')}
                    {r.category_label ? ` · ${r.category_label}` : ''}
                  </p>
                </div>
                <p className="font-bold text-sm">${r.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignment Modal — the core UX */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="p-6 pb-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <p className="text-3xl font-bold">${activeReceipt.amount.toFixed(2)}</p>
                <button onClick={() => setActiveReceipt(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-lg font-medium text-gray-700">{activeReceipt.merchant_clean || activeReceipt.merchant_name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {PAYMENT_ICONS[activeReceipt.payment_method] || 'Card'}
                {activeReceipt.card_last_four ? ` ****${activeReceipt.card_last_four}` : ''}
                {' · '}
                {new Date(activeReceipt.transaction_time).toLocaleString()}
              </p>
            </div>

            {/* Assignment type selection */}
            {!assignMode && (
              <div className="p-6 space-y-3">
                <p className="text-sm font-medium text-gray-500 mb-2">Who is this for?</p>

                <button onClick={() => setAssignMode('client')}
                  className="w-full p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl text-left hover:bg-indigo-100 transition-colors active:scale-[0.98]">
                  <p className="font-bold text-indigo-900">For a Client</p>
                  <p className="text-sm text-indigo-600">Bill this expense to a specific client</p>
                </button>

                <button onClick={() => { setAssignMode('business'); }}
                  className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-2xl text-left hover:bg-green-100 transition-colors active:scale-[0.98]">
                  <p className="font-bold text-green-900">My Business Expense</p>
                  <p className="text-sm text-green-600">General business cost, not billable to a client</p>
                </button>

                {userMode === 'employee' && (
                  <button onClick={() => setAssignMode('employee')}
                    className="w-full p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl text-left hover:bg-amber-100 transition-colors active:scale-[0.98]">
                    <p className="font-bold text-amber-900">Company Expense</p>
                    <p className="text-sm text-amber-600">Tag to project/department and submit for approval</p>
                  </button>
                )}

                <button onClick={() => { setActiveReceipt(activeReceipt); assign('personal'); }}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-left hover:bg-gray-100 transition-colors active:scale-[0.98]">
                  <p className="font-bold text-gray-700">Personal</p>
                  <p className="text-sm text-gray-500">Not a business expense — mark as drawings</p>
                </button>

                <button onClick={() => { dismiss(activeReceipt.id); setActiveReceipt(null); }}
                  className="w-full py-2 text-center text-xs text-gray-400 hover:text-red-500">
                  Dismiss (duplicate / not relevant)
                </button>
              </div>
            )}

            {/* Employee expense form */}
            {assignMode === 'employee' && (
              <div className="p-6">
                <button onClick={() => setAssignMode(null)} className="text-xs text-gray-400 hover:text-gray-600 mb-3">&larr; Back</button>
                <p className="text-sm font-medium text-gray-500 mb-3">Tag & Submit for Approval</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Project / Job</label>
                    <input value={expenseForm.project} onChange={e => setExpenseForm(f => ({ ...f, project: e.target.value }))}
                      placeholder="e.g., Smith Audit 2026, Website Redesign"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                      <input value={expenseForm.department} onChange={e => setExpenseForm(f => ({ ...f, department: e.target.value }))}
                        placeholder="e.g., Marketing"
                        className="w-full border rounded-xl px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cost Center</label>
                      <input value={expenseForm.cost_center} onChange={e => setExpenseForm(f => ({ ...f, cost_center: e.target.value }))}
                        placeholder="e.g., CC-100"
                        className="w-full border rounded-xl px-3 py-2.5 text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_CATEGORIES.slice(0, 6).map(cat => (
                        <button key={cat.code} onClick={() => setSelectedCategory(cat.code)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedCategory === cat.code ? 'bg-indigo-600 text-white' : cat.color
                          }`}>{cat.label}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Business Justification</label>
                    <input value={expenseForm.business_justification} onChange={e => setExpenseForm(f => ({ ...f, business_justification: e.target.value }))}
                      placeholder="e.g., Client meeting supplies, Training materials"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm" />
                  </div>

                  {expenseAccount?.account?.auto_approve_threshold && activeReceipt?.amount <= expenseAccount.account.auto_approve_threshold && (
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-xs text-green-600">Under ${expenseAccount.account.auto_approve_threshold} — will be auto-approved</p>
                    </div>
                  )}

                  <button onClick={() => submitExpenseClaim(activeReceipt)}
                    className="w-full p-3 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 active:scale-[0.98]">
                    Submit for Approval
                  </button>
                </div>
              </div>
            )}

            {/* Client selection */}
            {assignMode === 'client' && (
              <div className="p-6">
                <button onClick={() => setAssignMode(null)} className="text-xs text-gray-400 hover:text-gray-600 mb-3">&larr; Back</button>
                <p className="text-sm font-medium text-gray-500 mb-3">Select Client</p>

                <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                  placeholder="Search or type client name..."
                  autoFocus
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />

                {/* Recent clients */}
                <div className="space-y-1 max-h-48 overflow-y-auto mb-3">
                  {filteredClients.map(client => (
                    <button key={client} onClick={() => assign('client_expense', client)}
                      className="w-full text-left px-4 py-3 bg-white border rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-colors active:scale-[0.98]">
                      <p className="font-medium text-sm">{client}</p>
                    </button>
                  ))}
                </div>

                {/* Custom client name */}
                {clientSearch && !filteredClients.includes(clientSearch) && (
                  <button onClick={() => assign('client_expense', clientSearch)}
                    className="w-full p-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 active:scale-[0.98]">
                    Assign to "{clientSearch}"
                  </button>
                )}
              </div>
            )}

            {/* Business expense categorization */}
            {assignMode === 'business' && (
              <div className="p-6">
                <button onClick={() => setAssignMode(null)} className="text-xs text-gray-400 hover:text-gray-600 mb-3">&larr; Back</button>
                <p className="text-sm font-medium text-gray-500 mb-3">Category</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {QUICK_CATEGORIES.map(cat => (
                    <button key={cat.code} onClick={() => setSelectedCategory(cat.code)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                        selectedCategory === cat.code
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                          : cat.color + ' hover:ring-2 hover:ring-gray-200'
                      }`}>
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
                  <input value={note} onChange={e => setNote(e.target.value)}
                    placeholder="e.g., Printer ink for office"
                    className="w-full border rounded-xl px-3 py-2 text-sm" />
                </div>

                <button onClick={() => assign('business_expense')}
                  className="w-full p-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 active:scale-[0.98]">
                  Confirm Business Expense
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual entry modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add Cash Transaction</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input type="number" value={manualForm.amount} onChange={e => setManualForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="42.50" className="w-full border rounded-lg px-3 py-2 text-sm" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Where did you pay?</label>
                <input value={manualForm.merchant_name} onChange={e => setManualForm(f => ({ ...f, merchant_name: e.target.value }))}
                  placeholder="e.g., Officeworks, Uber, Coffee Shop"
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={manualForm.payment_method} onChange={e => setManualForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="eftpos">EFTPOS</option>
                  <option value="debit">Debit Card</option>
                  <option value="credit">Credit Card</option>
                  <option value="apple_pay">Apple Pay</option>
                  <option value="google_pay">Google Pay</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowManual(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={addManual}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Add</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
