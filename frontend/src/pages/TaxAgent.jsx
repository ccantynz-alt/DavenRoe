import { useState } from 'react';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const JURISDICTIONS = [
  { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', authority: 'ATO' },
  { code: 'NZ', name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}', authority: 'IRD' },
  { code: 'GB', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', authority: 'HMRC' },
  { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', authority: 'IRS' },
];

const QUICK_QUESTIONS = [
  'What expenses can I claim?',
  'Can I claim bank fees?',
  'How do I claim vehicle expenses?',
  'What are the current tax rates?',
  'Can I claim home office expenses?',
  'When are tax returns due?',
  'What is the GST/VAT threshold?',
  'How does superannuation/401(k) work?',
];

export default function TaxAgent() {
  const [jurisdiction, setJurisdiction] = useState('AU');
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bankFees, setBankFees] = useState(null);
  const [expenses, setExpenses] = useState(null);
  const [showBankFees, setShowBankFees] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const toast = useToast();

  const currentJur = JURISDICTIONS.find(j => j.code === jurisdiction);

  const askQuestion = async (q) => {
    const text = q || question;
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setConversation(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await api.post('/tax-agent/ask', { question: text, jurisdiction });
      const botMsg = {
        role: 'assistant', content: res.data.answer, jurisdiction: res.data.jurisdiction,
        authority: res.data.authority, topic: res.data.topic, sources: res.data.sources,
        related_topics: res.data.related_topics, disclaimer: res.data.disclaimer, timestamp: new Date(),
      };
      setConversation(prev => [...prev, botMsg]);
    } catch (err) {
      toast.error('Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const loadBankFees = async () => {
    try {
      const res = await api.get(`/tax-agent/bank-fees/${jurisdiction}`);
      setBankFees(res.data);
      setShowBankFees(true);
    } catch { toast.error('Failed to load bank fee rules'); }
  };

  const loadExpenses = async () => {
    try {
      const res = await api.get(`/tax-agent/expenses/${jurisdiction}`);
      setExpenses(res.data.categories);
      setShowExpenses(true);
    } catch { toast.error('Failed to load expense categories'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Tax Agent</h2>
        <p className="text-gray-500 mt-1">Ask questions about tax deductions, claimable expenses, limits, and compliance</p>
      </div>

      <div className="flex gap-2 mb-6">
        {JURISDICTIONS.map(j => (
          <Button key={j.code} variant={jurisdiction === j.code ? 'default' : 'outline'}
            onClick={() => { setJurisdiction(j.code); setBankFees(null); setExpenses(null); setShowBankFees(false); setShowExpenses(false); }}>
            <span>{j.flag}</span>
            <span className="hidden sm:inline">{j.name}</span>
            <span className="sm:hidden">{j.code}</span>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden" style={{ minHeight: '500px' }}>
            <CardContent className="p-0">
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {conversation.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Ask me about {currentJur?.name} tax</h3>
                    <p className="text-sm text-gray-500 mb-6">I know about deductions, claimable expenses, tax rates, deadlines, bank fees, and more</p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                      {QUICK_QUESTIONS.map((q, i) => (
                        <Button key={i} variant="secondary" size="sm" onClick={() => askQuestion(q)}>{q}</Button>
                      ))}
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {conversation.map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <Card className={cn('max-w-[85%]', msg.role === 'user' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50')}>
                        <CardContent className="px-4 py-3">
                          {msg.role === 'assistant' && msg.authority && (
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                              <Badge variant="default">{msg.authority}</Badge>
                              <span className="text-xs text-gray-400">{msg.topic?.replace('_', ' ')}</span>
                            </div>
                          )}
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.content.split('\n').map((line, li) => {
                              if (line.startsWith('**') && line.endsWith('**')) return <p key={li} className="font-bold mt-2 mb-1">{line.replace(/\*\*/g, '')}</p>;
                              if (line.startsWith('- ')) return <p key={li} className="ml-4">{line}</p>;
                              if (line.startsWith('**') && line.includes('**')) {
                                const parts = line.split('**');
                                return <p key={li} className="mt-1">{parts.map((part, pi) => pi % 2 === 1 ? <strong key={pi}>{part}</strong> : part)}</p>;
                              }
                              return line ? <p key={li}>{line}</p> : <br key={li} />;
                            })}
                          </div>
                          {msg.role === 'assistant' && msg.disclaimer && (
                            <p className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-200 italic">{msg.disclaimer}</p>
                          )}
                          {msg.role === 'assistant' && msg.related_topics?.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-200">
                              <p className="text-[10px] text-gray-400 mb-1">Related topics:</p>
                              <div className="flex flex-wrap gap-1">
                                {msg.related_topics.slice(0, 4).map((t, ti) => (
                                  <Button key={ti} variant="outline" size="sm" className="text-[10px] h-auto py-0.5 px-2"
                                    onClick={() => askQuestion(`Tell me about ${t.toLowerCase()}`)}>{t}</Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <Card className="bg-gray-50"><CardContent className="px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </CardContent></Card>
                  </motion.div>
                )}
              </div>

              <div className="border-t p-4">
                <form onSubmit={e => { e.preventDefault(); askQuestion(); }} className="flex gap-2">
                  <Input value={question} onChange={e => setQuestion(e.target.value)}
                    placeholder={`Ask about ${currentJur?.name} tax...`} disabled={loading} />
                  <Button type="submit" disabled={loading || !question.trim()}>Ask</Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Quick Lookups</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={loadBankFees}>Bank Fee Rules ({currentJur?.code})</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={loadExpenses}>All Claimable Expenses ({currentJur?.code})</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => askQuestion('What are the current tax rates?')}>Tax Rates & Brackets</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => askQuestion('When are tax returns due?')}>Key Dates & Deadlines</Button>
            </CardContent>
          </Card>

          <AnimatePresence>
            {showBankFees && bankFees && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Bank Fees — {bankFees.jurisdiction}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowBankFees(false)}>Close</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={bankFees.deductible ? 'success' : 'destructive'} className="mb-3">
                      {bankFees.deductible ? 'Generally Deductible' : 'Not Deductible'}
                    </Badge>
                    {bankFees.deductible_fees?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-green-600 mb-1">Deductible:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {bankFees.deductible_fees.map((f, i) => <li key={i} className="flex gap-1"><span className="text-green-500 mt-0.5">+</span> {f}</li>)}
                        </ul>
                      </div>
                    )}
                    {bankFees.non_deductible_fees?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-red-500 mb-1">NOT Deductible:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {bankFees.non_deductible_fees.map((f, i) => <li key={i} className="flex gap-1"><span className="text-red-400 mt-0.5">-</span> {f}</li>)}
                        </ul>
                      </div>
                    )}
                    {bankFees.apportionment_rule && (
                      <Card className="bg-amber-50 border-amber-200"><CardContent className="pt-3 pb-3">
                        <p className="text-xs text-gray-500"><strong>Mixed-use:</strong> {bankFees.apportionment_rule}</p>
                      </CardContent></Card>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {showExpenses && expenses && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Expense Categories</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowExpenses(false)}>Close</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {expenses.map((cat, i) => (
                      <Button key={i} variant="ghost" className="w-full justify-start flex-col items-start h-auto py-2"
                        onClick={() => askQuestion(`Tell me about ${cat.name} deductions`)}>
                        <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                        {cat.deductible !== undefined && (
                          <p className={cn('text-[10px]', cat.deductible ? 'text-green-600' : 'text-red-500')}>
                            {cat.deductible ? 'Deductible' : 'Conditions apply'}
                          </p>
                        )}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4">
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Disclaimer:</strong> This is general guidance only and does not constitute tax advice.
                Tax laws change frequently. Please consult a qualified tax professional for advice specific to your circumstances.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
