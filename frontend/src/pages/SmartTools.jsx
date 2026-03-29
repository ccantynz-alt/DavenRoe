import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

export default function SmartTools() {
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseVendor, setExpenseVendor] = useState('');
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [pnlForm, setPnlForm] = useState({ revenue: '', expenses: '', prev_revenue: '' });
  const [pnlResult, setPnlResult] = useState(null);
  const [bsForm, setBsForm] = useState({ total_assets: '', total_liabilities: '', cash: '', receivables: '', payables: '', monthly_expenses: '' });
  const [bsResult, setBsResult] = useState(null);
  const [setupChecklist, setSetupChecklist] = useState(null);
  const [monthlyChecklist, setMonthlyChecklist] = useState(null);
  const [jurisdiction, setJurisdiction] = useState('AU');
  const toast = useToast();

  useEffect(() => {
    api.get('/smart-tools/expense-categories').then(r => setCategories(r.data.categories || [])).catch(() => null);
    api.get(`/smart-tools/setup-checklist?jurisdiction=${jurisdiction}`).then(r => setSetupChecklist(r.data)).catch(() => null);
    api.get(`/smart-tools/monthly-checklist?jurisdiction=${jurisdiction}`).then(r => setMonthlyChecklist(r.data)).catch(() => null);
  }, [jurisdiction]);

  const categorize = async () => {
    if (!expenseDesc || !expenseAmount) return toast.error('Enter a description and amount');
    try {
      const res = await api.post('/smart-tools/categorize', {
        description: expenseDesc,
        amount: parseFloat(expenseAmount),
        vendor: expenseVendor,
      });
      setResult(res.data);
    } catch { toast.error('Failed to categorize'); }
  };

  const translatePnl = async () => {
    try {
      const data = {
        revenue: parseFloat(pnlForm.revenue) || 0,
        expenses: parseFloat(pnlForm.expenses) || 0,
        prev_revenue: pnlForm.prev_revenue ? parseFloat(pnlForm.prev_revenue) : null,
      };
      data.net_profit = data.revenue - data.expenses;
      const res = await api.post('/smart-tools/translate/pnl', data);
      setPnlResult(res.data);
    } catch { toast.error('Failed to translate'); }
  };

  const translateBs = async () => {
    try {
      const data = {
        total_assets: parseFloat(bsForm.total_assets) || 0,
        total_liabilities: parseFloat(bsForm.total_liabilities) || 0,
        cash: parseFloat(bsForm.cash) || 0,
        receivables: parseFloat(bsForm.receivables) || 0,
        payables: parseFloat(bsForm.payables) || 0,
        monthly_expenses: parseFloat(bsForm.monthly_expenses) || 0,
      };
      const res = await api.post('/smart-tools/translate/balance-sheet', data);
      setBsResult(res.data);
    } catch { toast.error('Failed to translate'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Smart Tools</h2>
        <p className="text-gray-500 mt-1">No accounting knowledge needed. We'll translate everything into plain English.</p>
      </div>

      {/* Jurisdiction */}
      <div className="flex gap-2 mb-6">
        {[['AU', '\u{1F1E6}\u{1F1FA}'], ['NZ', '\u{1F1F3}\u{1F1FF}'], ['GB', '\u{1F1EC}\u{1F1E7}'], ['US', '\u{1F1FA}\u{1F1F8}']].map(([code, flag]) => (
          <Button key={code} onClick={() => setJurisdiction(code)} size="sm"
            variant={jurisdiction === code ? 'default' : 'outline'}>
            {flag} {code}
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="expense">Can I Claim This?</TabsTrigger>
          <TabsTrigger value="translate">Plain English Reports</TabsTrigger>
          <TabsTrigger value="checklist">What Should I Do?</TabsTrigger>
        </TabsList>

        {/* TAB: Expense Wizard */}
        <TabsContent value="expense">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Can I Claim This?</CardTitle>
                  <CardDescription>Describe what you bought and we'll tell you if it's a business deduction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">What did you buy?</label>
                      <Input value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)}
                        placeholder="e.g., New laptop for work, Uber to client meeting, Office supplies" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">How much?</label>
                        <Input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)}
                          placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Where from? (optional)</label>
                        <Input value={expenseVendor} onChange={e => setExpenseVendor(e.target.value)}
                          placeholder="e.g., Officeworks, Uber, Adobe" />
                      </div>
                    </div>
                    <Button onClick={categorize} className="w-full">
                      Check If Claimable
                    </Button>
                  </div>

                  {/* Result */}
                  {result && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={cn('mt-6 p-5 rounded-xl border-2',
                        result.claimable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      )}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xl',
                          result.claimable ? 'bg-green-100' : 'bg-red-100'
                        )}>
                          {result.claimable ? '\u2705' : '\u274C'}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{result.claimable ? 'Yes, you can claim this!' : 'Not claimable'}</p>
                          <p className="text-sm text-gray-500">Category: {result.label}</p>
                        </div>
                      </div>

                      {result.claimable && result.percentage !== null && result.percentage < 100 && (
                        <div className="bg-white rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium">You can claim <strong>{result.percentage}%</strong> = <strong>${result.claimable_amount?.toFixed(2)}</strong></p>
                          <p className="text-xs text-gray-400">The remaining {100 - result.percentage}% is considered personal</p>
                        </div>
                      )}

                      {result.claimable && result.percentage === 100 && (
                        <div className="bg-white rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium">Claim the <strong>full amount: ${parseFloat(expenseAmount || 0).toFixed(2)}</strong></p>
                        </div>
                      )}

                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-sm text-gray-700"><strong>Tip:</strong> {result.tip}</p>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Progress
                          value={result.confidence * 100}
                          className="flex-1"
                          indicatorClassName={cn(
                            result.confidence > 0.7 ? 'bg-green-500' : result.confidence > 0.4 ? 'bg-amber-500' : 'bg-gray-400'
                          )}
                        />
                        <span className="text-xs text-gray-400">{Math.round(result.confidence * 100)}% confident</span>
                      </div>

                      {result.alternatives?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          Could also be: {result.alternatives.map(a => a.label).join(', ')}
                        </p>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              <Button variant="link" onClick={() => setShowCategories(!showCategories)} className="mt-4">
                {showCategories ? 'Hide' : 'Show'} all expense categories
              </Button>

              {showCategories && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-2">
                  {categories.map(cat => (
                    <Card key={cat.id} className="hover:shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{cat.label}</span>
                          <Badge variant={cat.claimable ? 'success' : 'destructive'}>
                            {cat.claimable ? (cat.percentage ? `${cat.percentage}%` : 'Varies') : 'No'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{cat.examples}</p>
                        <p className="text-xs text-gray-500">{cat.tip}</p>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Quick examples */}
            <div>
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3">Try These Examples</h3>
              <div className="space-y-2">
                {[
                  { desc: 'New MacBook Pro for work', amount: 2499, vendor: 'Apple' },
                  { desc: 'Uber to client meeting', amount: 32, vendor: 'Uber' },
                  { desc: 'Monthly internet bill', amount: 89, vendor: 'NBN' },
                  { desc: 'Lunch with client', amount: 65, vendor: 'Restaurant' },
                  { desc: 'Groceries for home', amount: 120, vendor: 'Woolworths' },
                  { desc: 'Adobe Creative Cloud subscription', amount: 54.99, vendor: 'Adobe' },
                  { desc: 'Stripe processing fees', amount: 147.30, vendor: 'Stripe' },
                  { desc: 'Coffee machine for office', amount: 299, vendor: '' },
                  { desc: 'Accountant fees', amount: 800, vendor: '' },
                  { desc: 'Google Ads campaign', amount: 500, vendor: 'Google' },
                ].map((ex, i) => (
                  <Card key={i}
                    className="cursor-pointer hover:border-indigo-200 hover:bg-indigo-50"
                    onClick={() => { setExpenseDesc(ex.desc); setExpenseAmount(String(ex.amount)); setExpenseVendor(ex.vendor); setResult(null); }}>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">{ex.desc}</p>
                      <p className="text-xs text-gray-400">${ex.amount.toFixed(2)} {ex.vendor ? `from ${ex.vendor}` : ''}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: Plain English Reports */}
        <TabsContent value="translate">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* P&L Translator */}
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss — In English</CardTitle>
                <CardDescription>Enter your numbers and we'll explain what they mean</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Revenue (money earned)</label>
                    <Input type="number" value={pnlForm.revenue} onChange={e => setPnlForm(f => ({ ...f, revenue: e.target.value }))}
                      placeholder="e.g., 150000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Expenses (money spent)</label>
                    <Input type="number" value={pnlForm.expenses} onChange={e => setPnlForm(f => ({ ...f, expenses: e.target.value }))}
                      placeholder="e.g., 95000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last period's revenue (optional — for trend)</label>
                    <Input type="number" value={pnlForm.prev_revenue} onChange={e => setPnlForm(f => ({ ...f, prev_revenue: e.target.value }))}
                      placeholder="e.g., 130000" />
                  </div>
                  <Button onClick={translatePnl} className="w-full">
                    Explain My Numbers
                  </Button>
                </div>

                {pnlResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={cn('mt-6 p-5 rounded-xl',
                      pnlResult.verdict === 'profitable' ? 'bg-green-50' : pnlResult.verdict === 'loss' ? 'bg-red-50' : 'bg-gray-50'
                    )}>
                    <div className="prose prose-sm max-w-none">
                      {pnlResult.summary.split('\n\n').map((p, i) => (
                        <p key={i} className="text-sm text-gray-700 mb-2">
                          {p.split(/\*\*(.*?)\*\*/g).map((seg, j) =>
                            j % 2 === 1 ? <strong key={j}>{seg}</strong> : seg
                          )}
                        </p>
                      ))}
                    </div>
                    {pnlResult.actionable_tips?.length > 0 && (
                      <div className="mt-4 border-t pt-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">What you could do:</p>
                        {pnlResult.actionable_tips.map((tip, i) => (
                          <p key={i} className="text-xs text-gray-600 mb-1">- {tip}</p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Balance Sheet Translator */}
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet — In English</CardTitle>
                <CardDescription>What does your business actually own and owe?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total assets (what you own)</label>
                      <Input type="number" value={bsForm.total_assets} onChange={e => setBsForm(f => ({ ...f, total_assets: e.target.value }))}
                        placeholder="250000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total liabilities (what you owe)</label>
                      <Input type="number" value={bsForm.total_liabilities} onChange={e => setBsForm(f => ({ ...f, total_liabilities: e.target.value }))}
                        placeholder="80000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cash in bank</label>
                      <Input type="number" value={bsForm.cash} onChange={e => setBsForm(f => ({ ...f, cash: e.target.value }))}
                        placeholder="45000" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Clients owe you</label>
                      <Input type="number" value={bsForm.receivables} onChange={e => setBsForm(f => ({ ...f, receivables: e.target.value }))}
                        placeholder="12000" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">You owe suppliers</label>
                      <Input type="number" value={bsForm.payables} onChange={e => setBsForm(f => ({ ...f, payables: e.target.value }))}
                        placeholder="8000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly expenses (approx)</label>
                    <Input type="number" value={bsForm.monthly_expenses} onChange={e => setBsForm(f => ({ ...f, monthly_expenses: e.target.value }))}
                      placeholder="8000" />
                  </div>
                  <Button onClick={translateBs} className="w-full">
                    Explain My Balance Sheet
                  </Button>
                </div>

                {bsResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-5 rounded-xl bg-blue-50">
                    <div className="prose prose-sm max-w-none">
                      {bsResult.summary.split('\n\n').map((p, i) => (
                        <p key={i} className="text-sm text-gray-700 mb-2">
                          {p.split(/\*\*(.*?)\*\*/g).map((seg, j) =>
                            j % 2 === 1 ? <strong key={j}>{seg}</strong> : seg
                          )}
                        </p>
                      ))}
                    </div>
                    {bsResult.actionable_tips?.length > 0 && (
                      <div className="mt-4 border-t border-blue-200 pt-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">Suggested actions:</p>
                        {bsResult.actionable_tips.map((tip, i) => (
                          <p key={i} className="text-xs text-gray-600 mb-1">- {tip}</p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Checklists */}
        <TabsContent value="checklist">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Setup checklist */}
            {setupChecklist && (
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>Follow these steps to set up your business on Astra</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Progress
                        value={(setupChecklist.completed / setupChecklist.total) * 100}
                        className="flex-1"
                        indicatorClassName="bg-indigo-600"
                      />
                      <span className="text-xs text-gray-400">{setupChecklist.completed}/{setupChecklist.total}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {setupChecklist.items?.map(item => (
                      <div key={item.id} className={cn('rounded-lg border p-4', item.done ? 'bg-green-50 border-green-200' : 'bg-white')}>
                        <div className="flex items-start gap-3">
                          <div className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0',
                            item.done ? 'border-green-500 bg-green-100' : 'border-gray-300'
                          )}>
                            {item.done && (
                              <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={cn('font-medium text-sm', item.done ? 'text-green-700 line-through' : 'text-gray-900')}>{item.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                            <p className="text-[10px] text-gray-400 mt-1 italic">{item.why}</p>
                            {!item.done && (
                              <Button asChild size="sm" className="mt-2">
                                <a href={item.action}>{item.action_label}</a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly checklist */}
            {monthlyChecklist && (
              <Card>
                <CardHeader>
                  <CardTitle>This Month's Tasks</CardTitle>
                  <CardDescription>Regular tasks to keep your books in good shape</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyChecklist.items?.map(item => (
                      <div key={item.id} className="rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-sm text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                            <div className="flex gap-3 mt-2">
                              <Badge variant="secondary" className="text-[10px]">{item.frequency}</Badge>
                              <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-500 border-transparent">{item.effort}</Badge>
                            </div>
                          </div>
                          <Button asChild variant="secondary" size="sm" className="flex-shrink-0">
                            <a href={item.action}>{item.action_label}</a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
