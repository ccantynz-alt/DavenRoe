import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

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

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25 },
};

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
      <motion.div {...fadeUp} className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Live Receipt</h2>
          <p className="text-gray-500 mt-1">Tap to assign expenses the moment they happen</p>
          <LegalDisclaimer type="live_receipt" className="mt-3" />
        </div>
        <Button onClick={() => setShowManual(true)} size="sm">
          + Manual
        </Button>
      </motion.div>

      {/* Mode selector */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <Tabs value={userMode} onValueChange={setUserMode} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="owner">Business Owner</TabsTrigger>
            <TabsTrigger value="employee">Employee</TabsTrigger>
            <TabsTrigger value="accountant">Accountant / Manager</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Employee expense account banner */}
      {userMode === 'employee' && expenseAccount?.has_account && (
        <motion.div {...fadeUp}>
          <Card className="border-indigo-200 bg-indigo-50 mb-6">
            <CardContent className="pt-4 pb-4">
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
              <Progress
                className="mt-2 bg-indigo-200"
                indicatorClassName="bg-indigo-600"
                value={Math.min(100, (expenseAccount.account?.spent_this_month / expenseAccount.account?.monthly_limit) * 100)}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-indigo-400">${expenseAccount.account?.spent_this_month?.toFixed(0)} spent</span>
                <span className="text-[10px] text-indigo-400">${expenseAccount.account?.monthly_limit?.toFixed(0)} limit</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {userMode === 'employee' && !expenseAccount?.has_account && (
        <motion.div {...fadeUp}>
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-amber-800 font-medium">No expense account set up yet</p>
              <p className="text-xs text-amber-600 mt-1">Ask your manager or admin to create an expense account for you. Once set up, transactions from your company card will appear here automatically.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Manager approval queue */}
      {userMode === 'accountant' && approvalQueue.length > 0 && (
        <motion.div {...fadeUp} className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Approval Queue ({approvalQueue.length})
          </h3>
          <div className="space-y-2">
            {approvalQueue.map(claim => (
              <Card key={claim.id} className="border-2 border-amber-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold">${claim.amount.toFixed(2)} <span className="font-normal text-sm text-gray-500">at {claim.merchant_name}</span></p>
                      <p className="text-xs text-gray-500">{claim.employee_name} &middot; {claim.department || 'No dept'} &middot; {claim.project || 'No project'}</p>
                      {claim.business_justification && (
                        <p className="text-xs text-gray-600 mt-1 italic">"{claim.business_justification}"</p>
                      )}
                    </div>
                    <Badge variant={claim.approval_path === 'dual_approval' ? 'destructive' : 'warning'}>
                      {claim.approval_path === 'dual_approval' ? 'High value' : 'Review'}
                    </Badge>
                  </div>
                  {claim.violations?.length > 0 && (
                    <div className="mb-2">
                      {claim.violations.map((v, i) => (
                        <p key={i} className="text-[10px] text-red-500 bg-red-50 rounded px-2 py-0.5 mb-0.5">{v}</p>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => processApproval(claim.id, 'approved')} className="flex-1" variant="default" size="sm">
                      Approve
                    </Button>
                    <Button onClick={() => { const reason = window.prompt('Rejection reason:'); if (reason) processApproval(claim.id, 'rejected', reason); }}
                      variant="destructive" size="sm">
                      Reject
                    </Button>
                    <Button onClick={() => { const q = window.prompt('Your question:'); if (q) processApproval(claim.id, 'query', q); }}
                      variant="outline" size="sm">
                      Ask
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Employee recent claims */}
      {userMode === 'employee' && employeeClaims.length > 0 && (
        <motion.div {...fadeUp} className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">My Claims</h3>
          <div className="space-y-2">
            {employeeClaims.slice(0, 5).map(claim => (
              <Card key={claim.id}>
                <CardContent className="pt-3 pb-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{claim.merchant_name}</p>
                    <p className="text-xs text-gray-400">{claim.project || claim.department || 'General'}</p>
                  </div>
                  <p className="font-bold text-sm">${claim.amount.toFixed(2)}</p>
                  <Badge
                    variant={
                      claim.status === 'approved' ? 'success' :
                      claim.status === 'rejected' ? 'destructive' :
                      claim.status === 'queried' ? 'warning' :
                      'secondary'
                    }
                  >
                    {claim.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {stats && (
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.pending_count}</p>
              <p className="text-[10px] text-amber-500 uppercase tracking-wider">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.assigned_today}</p>
              <p className="text-[10px] text-green-500 uppercase tracking-wider">Done Today</p>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50 border-indigo-200">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold text-indigo-700">{stats.auto_assign_rate}%</p>
              <p className="text-[10px] text-indigo-500 uppercase tracking-wider">Auto-Assigned</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pending receipts */}
      <AnimatePresence>
        {pending.length > 0 && (
          <motion.div {...fadeUp} className="mb-8">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Waiting for You ({pending.length})
            </h3>
            <div className="space-y-3">
              {pending.map((r, idx) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    className="border-2 border-amber-200 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => openAssign(r)}
                  >
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xl font-bold text-gray-900">
                            ${r.amount.toFixed(2)}
                            <span className="text-xs font-normal text-gray-400 ml-1">{r.currency}</span>
                          </p>
                          <p className="text-base font-medium text-gray-700 mt-0.5">{r.merchant_clean || r.merchant_name}</p>
                        </div>
                        <Badge variant="secondary">
                          {PAYMENT_ICONS[r.payment_method] || 'Card'}
                          {r.card_last_four ? ` ****${r.card_last_four}` : ''}
                        </Badge>
                      </div>

                      {/* AI suggestion */}
                      {r.category_label && (
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200">
                            {r.category_label}
                          </Badge>
                          {r.suggested_client && (
                            <Badge className="bg-green-50 text-green-600 border-green-200">
                              {r.suggested_client}
                            </Badge>
                          )}
                          <span className="text-[10px] text-gray-400">{Math.round(r.confidence * 100)}% confident</span>
                        </div>
                      )}

                      {/* Quick action buttons */}
                      <div className="flex gap-2">
                        {r.suggested_client && (
                          <Button
                            onClick={e => { e.stopPropagation(); assign.call(null, 'client_expense', r.suggested_client); setActiveReceipt(r); assign('client_expense', r.suggested_client); }}
                            className="flex-1 bg-green-500 hover:bg-green-600"
                            size="sm"
                          >
                            {r.suggested_client}
                          </Button>
                        )}
                        <Button
                          onClick={e => { e.stopPropagation(); openAssign(r); }}
                          className={cn(!r.suggested_client && 'flex-1')}
                          size="sm"
                        >
                          Assign
                        </Button>
                        {r.is_likely_personal && (
                          <Button
                            onClick={e => { e.stopPropagation(); setActiveReceipt(r); assign('personal'); }}
                            variant="secondary"
                            size="sm"
                          >
                            Personal
                          </Button>
                        )}
                        <Button
                          onClick={e => { e.stopPropagation(); skip(r.id); }}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          Skip
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No pending */}
      {pending.length === 0 && (
        <motion.div {...fadeUp}>
          <Card className="bg-green-50 border-green-200 mb-8">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-800 mb-1">All caught up!</h3>
              <p className="text-sm text-green-600">No pending transactions. New ones will appear here instantly when you make a payment.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent history */}
      {recent.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Recently Assigned</h3>
          <div className="space-y-2">
            {recent.map(r => (
              <Card key={r.id}>
                <CardContent className="pt-3 pb-3 flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold',
                    r.assignment_type === 'client_expense' ? 'bg-indigo-100 text-indigo-600' :
                    r.assignment_type === 'personal' ? 'bg-gray-100 text-gray-500' :
                    'bg-green-100 text-green-600'
                  )}>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Assignment Dialog */}
      <Dialog open={!!activeReceipt} onOpenChange={(open) => { if (!open) setActiveReceipt(null); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          {activeReceipt && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold">${activeReceipt.amount.toFixed(2)}</DialogTitle>
                <DialogDescription asChild>
                  <div>
                    <p className="text-lg font-medium text-gray-700">{activeReceipt.merchant_clean || activeReceipt.merchant_name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {PAYMENT_ICONS[activeReceipt.payment_method] || 'Card'}
                      {activeReceipt.card_last_four ? ` ****${activeReceipt.card_last_four}` : ''}
                      {' · '}
                      {new Date(activeReceipt.transaction_time).toLocaleString()}
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>

              {/* Assignment type selection */}
              {!assignMode && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium text-gray-500 mb-2">Who is this for?</p>

                  <Button
                    onClick={() => setAssignMode('client')}
                    variant="outline"
                    className="w-full h-auto p-4 bg-indigo-50 border-2 border-indigo-200 text-left hover:bg-indigo-100 justify-start flex-col items-start"
                  >
                    <p className="font-bold text-indigo-900">For a Client</p>
                    <p className="text-sm text-indigo-600 font-normal">Bill this expense to a specific client</p>
                  </Button>

                  <Button
                    onClick={() => setAssignMode('business')}
                    variant="outline"
                    className="w-full h-auto p-4 bg-green-50 border-2 border-green-200 text-left hover:bg-green-100 justify-start flex-col items-start"
                  >
                    <p className="font-bold text-green-900">My Business Expense</p>
                    <p className="text-sm text-green-600 font-normal">General business cost, not billable to a client</p>
                  </Button>

                  {userMode === 'employee' && (
                    <Button
                      onClick={() => setAssignMode('employee')}
                      variant="outline"
                      className="w-full h-auto p-4 bg-amber-50 border-2 border-amber-200 text-left hover:bg-amber-100 justify-start flex-col items-start"
                    >
                      <p className="font-bold text-amber-900">Company Expense</p>
                      <p className="text-sm text-amber-600 font-normal">Tag to project/department and submit for approval</p>
                    </Button>
                  )}

                  <Button
                    onClick={() => { setActiveReceipt(activeReceipt); assign('personal'); }}
                    variant="outline"
                    className="w-full h-auto p-4 bg-gray-50 border-2 border-gray-200 text-left hover:bg-gray-100 justify-start flex-col items-start"
                  >
                    <p className="font-bold text-gray-700">Personal</p>
                    <p className="text-sm text-gray-500 font-normal">Not a business expense — mark as drawings</p>
                  </Button>

                  <Button
                    onClick={() => { dismiss(activeReceipt.id); setActiveReceipt(null); }}
                    variant="ghost"
                    className="w-full text-xs text-gray-400 hover:text-red-500"
                    size="sm"
                  >
                    Dismiss (duplicate / not relevant)
                  </Button>
                </div>
              )}

              {/* Employee expense form */}
              {assignMode === 'employee' && (
                <div className="pt-2">
                  <Button onClick={() => setAssignMode(null)} variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-600 mb-3 px-0">
                    &larr; Back
                  </Button>
                  <p className="text-sm font-medium text-gray-500 mb-3">Tag & Submit for Approval</p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Project / Job</label>
                      <Input value={expenseForm.project} onChange={e => setExpenseForm(f => ({ ...f, project: e.target.value }))}
                        placeholder="e.g., Smith Audit 2026, Website Redesign" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                        <Input value={expenseForm.department} onChange={e => setExpenseForm(f => ({ ...f, department: e.target.value }))}
                          placeholder="e.g., Marketing" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Cost Center</label>
                        <Input value={expenseForm.cost_center} onChange={e => setExpenseForm(f => ({ ...f, cost_center: e.target.value }))}
                          placeholder="e.g., CC-100" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_CATEGORIES.slice(0, 6).map(cat => (
                          <Button key={cat.code} onClick={() => setSelectedCategory(cat.code)}
                            variant="outline"
                            size="sm"
                            className={cn(
                              'text-xs',
                              selectedCategory === cat.code ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:text-white' : cat.color
                            )}>
                            {cat.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Business Justification</label>
                      <Input value={expenseForm.business_justification} onChange={e => setExpenseForm(f => ({ ...f, business_justification: e.target.value }))}
                        placeholder="e.g., Client meeting supplies, Training materials" />
                    </div>

                    {expenseAccount?.account?.auto_approve_threshold && activeReceipt?.amount <= expenseAccount.account.auto_approve_threshold && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-2 pb-2">
                          <p className="text-xs text-green-600">Under ${expenseAccount.account.auto_approve_threshold} — will be auto-approved</p>
                        </CardContent>
                      </Card>
                    )}

                    <Button onClick={() => submitExpenseClaim(activeReceipt)} className="w-full bg-amber-500 hover:bg-amber-600">
                      Submit for Approval
                    </Button>
                  </div>
                </div>
              )}

              {/* Client selection */}
              {assignMode === 'client' && (
                <div className="pt-2">
                  <Button onClick={() => setAssignMode(null)} variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-600 mb-3 px-0">
                    &larr; Back
                  </Button>
                  <p className="text-sm font-medium text-gray-500 mb-3">Select Client</p>

                  <Input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                    placeholder="Search or type client name..."
                    autoFocus
                    className="mb-3" />

                  <div className="space-y-1 max-h-48 overflow-y-auto mb-3">
                    {filteredClients.map(client => (
                      <Button key={client} onClick={() => assign('client_expense', client)}
                        variant="outline"
                        className="w-full justify-start hover:bg-indigo-50 hover:border-indigo-200"
                      >
                        {client}
                      </Button>
                    ))}
                  </div>

                  {clientSearch && !filteredClients.includes(clientSearch) && (
                    <Button onClick={() => assign('client_expense', clientSearch)} className="w-full">
                      Assign to "{clientSearch}"
                    </Button>
                  )}
                </div>
              )}

              {/* Business expense categorization */}
              {assignMode === 'business' && (
                <div className="pt-2">
                  <Button onClick={() => setAssignMode(null)} variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-600 mb-3 px-0">
                    &larr; Back
                  </Button>
                  <p className="text-sm font-medium text-gray-500 mb-3">Category</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {QUICK_CATEGORIES.map(cat => (
                      <Button key={cat.code} onClick={() => setSelectedCategory(cat.code)}
                        variant="outline"
                        size="sm"
                        className={cn(
                          'text-xs',
                          selectedCategory === cat.code
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 border-indigo-600 hover:bg-indigo-700 hover:text-white'
                            : cn(cat.color, 'hover:ring-2 hover:ring-gray-200')
                        )}>
                        {cat.label}
                      </Button>
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
                    <Input value={note} onChange={e => setNote(e.target.value)}
                      placeholder="e.g., Printer ink for office" />
                  </div>

                  <Button onClick={() => assign('business_expense')} className="w-full bg-green-600 hover:bg-green-700">
                    Confirm Business Expense
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual entry dialog */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Cash Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <Input type="number" value={manualForm.amount} onChange={e => setManualForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="42.50" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Where did you pay?</label>
              <Input value={manualForm.merchant_name} onChange={e => setManualForm(f => ({ ...f, merchant_name: e.target.value }))}
                placeholder="e.g., Officeworks, Uber, Coffee Shop" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <Select value={manualForm.payment_method} onValueChange={val => setManualForm(f => ({ ...f, payment_method: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eftpos">EFTPOS</SelectItem>
                  <SelectItem value="debit">Debit Card</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="apple_pay">Apple Pay</SelectItem>
                  <SelectItem value="google_pay">Google Pay</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button onClick={() => setShowManual(false)} variant="outline">Cancel</Button>
            <Button onClick={addManual}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
