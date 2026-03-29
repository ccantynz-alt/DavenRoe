import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import ProprietaryNotice from '@/components/ProprietaryNotice';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const JURISDICTIONS = [
  { code: 'AU', name: 'Australia', authority: 'ATO', legislation: 'Income Tax Assessment Act 1997' },
  { code: 'NZ', name: 'New Zealand', authority: 'IRD', legislation: 'Income Tax Act 2007' },
  { code: 'UK', name: 'United Kingdom', authority: 'HMRC', legislation: 'Income Tax Act 2007 (UK)' },
  { code: 'US', name: 'United States', authority: 'IRS', legislation: 'Internal Revenue Code' },
];

const EXAMPLE_QUESTIONS = [
  { q: 'Can my client claim a home office deduction if they work from home 3 days a week?', jurisdiction: 'AU' },
  { q: 'Is a company car for an employee a fringe benefit or a deduction?', jurisdiction: 'AU' },
  { q: 'Client bought a laptop for $2,800 — can they instant asset write-off?', jurisdiction: 'AU' },
  { q: 'Are cryptocurrency gains taxable if the client held for over 12 months?', jurisdiction: 'AU' },
  { q: 'Can a sole trader claim meal expenses while travelling for work?', jurisdiction: 'NZ' },
  { q: 'My client received a foreign dividend — how is it taxed under the FIF rules?', jurisdiction: 'NZ' },
  { q: 'Is a training course for an employee deductible if it\'s not directly related to their current role?', jurisdiction: 'UK' },
  { q: 'Client is a US citizen living in Australia — do they need to file a US return?', jurisdiction: 'US' },
  { q: 'Can my client deduct business meals at 100% or is it still 50%?', jurisdiction: 'US' },
  { q: 'Is a gift to a client deductible? They spent $180 per person at Christmas.', jurisdiction: 'AU' },
];

const DEMO_RESPONSES = {
  'home office': {
    ruling: 'LIKELY CLAIMABLE — with conditions',
    summary: 'Your client can claim home office expenses using one of three ATO-approved methods.',
    detail: `Under the ATO's updated guidance (effective 1 July 2022), there are three methods:\n\n**1. Fixed Rate Method (67 cents per hour)**\nMost common. Covers electricity, internet, phone, stationery, and computer consumables.\n\n**2. Actual Cost Method**\nClient calculates the actual proportion of running expenses.\n\n**3. Occupancy Expenses (if running a business from home)**\nRent, mortgage interest, rates, insurance — only if part of the home is set aside exclusively.\n\n**Key requirements:**\n- Must have a dedicated work area\n- Must keep contemporaneous records\n- Cannot claim expenses already reimbursed by the employer`,
    confidence: 'High',
    references: ['TR 93/30', 'PS LA 2001/6', 's8-1 ITAA 1997', 'ATO Home Office Expenses Guide 2024-25'],
    caveat: 'This guidance is based on current ATO published positions. Individual circumstances may vary.',
  },
  'company car': {
    ruling: 'DUAL TREATMENT — deduction for employer, FBT applies if private use',
    summary: 'The vehicle cost is deductible to the company, but providing it for private use triggers Fringe Benefits Tax (FBT).',
    detail: `**For the employer (company):**\nRunning costs are deductible under s8-1 ITAA 1997. The car limit for depreciation is $68,108 (2024-25).\n\n**Fringe Benefits Tax (FBT):**\nIf the employee has any private use, FBT applies. Two valuation methods:\n\n**1. Statutory Formula Method**\nTaxable value = Base value x 20% x days available / 365\n\n**2. Operating Cost Method**\nRequires a logbook for a minimum 12-week period.`,
    confidence: 'High',
    references: ['FBTAA 1986 Div 2', 's8-1 ITAA 1997', 'TR 2021/1'],
    caveat: 'FBT calculations are complex and depend on specific circumstances.',
  },
  'cryptocurrency': {
    ruling: 'TAXABLE — but 50% CGT discount applies if held >12 months',
    summary: 'Crypto gains are subject to Capital Gains Tax. The 50% discount applies for assets held more than 12 months.',
    detail: `**ATO position is clear:** cryptocurrency is a CGT asset under s108-5 ITAA 1997.\n\n**For investors:**\n- Disposing triggers a CGT event\n- If held > 12 months: 50% CGT discount applies (individuals and trusts only)\n- Capital losses can only offset capital gains\n\n**For traders:**\n- Gains and losses are on revenue account\n- No 50% discount available`,
    confidence: 'High',
    references: ['TD 2014/26', 's108-5 ITAA 1997', 's115-25 ITAA 1997'],
    caveat: 'DeFi, staking, and cross-chain transactions are evolving areas.',
  },
  'default': {
    ruling: 'ANALYSIS REQUIRED',
    summary: 'This question requires analysis against the relevant legislation and published rulings.',
    detail: `**General principle:** Under s8-1 ITAA 1997, a deduction is allowable to the extent that an expense is incurred in gaining or producing assessable income.\n\n**Recommended next steps:**\n1. Check for any specific ruling\n2. Review relevant case law\n3. Consider whether a private binding ruling would provide certainty\n4. Document the business purpose and maintain records`,
    confidence: 'Medium',
    references: ['s8-1 ITAA 1997', 's8-5 ITAA 1997', 'TR 93/30'],
    caveat: 'This is general guidance. For material claims, always consider obtaining a private binding ruling.',
  },
};

function getResponse(question) {
  const q = question.toLowerCase();
  if (q.includes('home office') || q.includes('work from home') || q.includes('wfh')) return DEMO_RESPONSES['home office'];
  if (q.includes('company car') || q.includes('vehicle') || q.includes('car benefit') || q.includes('fringe benefit')) return DEMO_RESPONSES['company car'];
  if (q.includes('crypto') || q.includes('bitcoin') || q.includes('digital asset')) return DEMO_RESPONSES['cryptocurrency'];
  return DEMO_RESPONSES['default'];
}

export default function TaxRulingsAgent() {
  const [jurisdiction, setJurisdiction] = useState('AU');
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const toast = useToast();

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    const userQ = question;
    setQuestion('');
    setConversation(prev => [...prev, { role: 'user', content: userQ, jurisdiction }]);
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
    const response = getResponse(userQ);
    setConversation(prev => [...prev, { role: 'agent', ...response, jurisdiction }]);
    setLoading(false);
  };

  const handleExample = (example) => { setJurisdiction(example.jurisdiction); setQuestion(example.q); };
  const jur = JURISDICTIONS.find(j => j.code === jurisdiction);

  const getRulingVariant = (ruling) => {
    if (ruling?.includes('CLAIMABLE') || ruling?.includes('TAXABLE')) return 'success';
    if (ruling?.includes('DUAL')) return 'warning';
    return 'default';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Rulings Agent</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ask grey-area tax questions and get instant guidance with legislative references — like calling the {jur?.authority} without the hold time
        </p>
      </div>

      <div className="flex gap-2">
        {JURISDICTIONS.map(j => (
          <Button key={j.code} variant={jurisdiction === j.code ? 'default' : 'outline'}
            onClick={() => setJurisdiction(j.code)}>
            {j.code} — {j.authority}
          </Button>
        ))}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4">
          <p className="text-xs text-amber-700">
            This agent provides guidance based on published legislation, rulings, and determinations. It does not constitute tax advice and should not be relied upon as a substitute for professional judgement.
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden flex flex-col" style={{ minHeight: '400px', maxHeight: '600px' }}>
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {conversation.length === 0 && (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">🏛️</p>
                <h3 className="font-semibold text-gray-900 mb-1">Ask a tax question</h3>
                <p className="text-sm text-gray-500 mb-6">Select a jurisdiction above and type your question below</p>
                <div className="text-left max-w-lg mx-auto">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Try these examples</p>
                  <div className="space-y-2">
                    {EXAMPLE_QUESTIONS.filter(e => e.jurisdiction === jurisdiction).slice(0, 4).map((example, i) => (
                      <Button key={i} variant="ghost" className="w-full justify-start text-left h-auto py-3 whitespace-normal"
                        onClick={() => handleExample(example)}>
                        "{example.q}"
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {conversation.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={cn(msg.role === 'user' && 'flex justify-end')}>
                  {msg.role === 'user' ? (
                    <Card className="bg-indigo-600 text-white border-indigo-600 rounded-2xl rounded-tr-sm max-w-lg">
                      <CardContent className="px-4 py-3">
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-[10px] text-indigo-300 mt-1">{JURISDICTIONS.find(j => j.code === msg.jurisdiction)?.authority} jurisdiction</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-gray-50 rounded-2xl rounded-tl-sm max-w-2xl">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant={getRulingVariant(msg.ruling)}>{msg.ruling}</Badge>
                          <Badge variant={msg.confidence === 'High' ? 'success' : 'warning'} className="text-[10px]">
                            {msg.confidence} confidence
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-3">{msg.summary}</p>
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {msg.detail?.split('\n\n').map((p, j) => (
                            <p key={j} className="mb-2">
                              {p.split(/\*\*(.*?)\*\*/g).map((seg, k) => k % 2 === 1 ? <strong key={k}>{seg}</strong> : seg)}
                            </p>
                          ))}
                        </div>
                        {msg.references?.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">Legislative References</p>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.references.map((ref, j) => (
                                <Badge key={j} variant="secondary" className="text-[10px] font-mono">{ref}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {msg.caveat && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-[10px] text-gray-400 italic">{msg.caveat}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-sm text-gray-400">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Researching {jur?.legislation}...
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t p-4">
            <form onSubmit={e => { e.preventDefault(); handleAsk(); }} className="flex gap-3">
              <Input value={question} onChange={e => setQuestion(e.target.value)}
                placeholder={`Ask a ${jur?.code} tax question... e.g. "Can my client claim..."`}
                disabled={loading} />
              <Button type="submit" disabled={loading || !question.trim()} className="shrink-0">Ask</Button>
            </form>
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              Powered by AI. Always verify with the {jur?.authority} or a registered tax agent before relying on this guidance.
            </p>
          </div>
        </CardContent>
      </Card>

      <ProprietaryNotice />
    </motion.div>
  );
}
