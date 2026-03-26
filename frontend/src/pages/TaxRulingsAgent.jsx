import { useState, useRef, useEffect } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

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

// Simulated AI responses for demo mode (when Anthropic API isn't connected)
const DEMO_RESPONSES = {
  'home office': {
    jurisdiction: 'AU',
    ruling: 'LIKELY CLAIMABLE — with conditions',
    summary: 'Your client can claim home office expenses using one of three ATO-approved methods.',
    detail: `Under the ATO's updated guidance (effective 1 July 2022), there are three methods for claiming home office expenses:

**1. Fixed Rate Method (67 cents per hour)**
Most common. Covers electricity, internet, phone, stationery, and computer consumables. Client must keep a record of hours worked from home (timesheet, roster, diary). At 3 days/week (approx. 24 hrs/week, 48 weeks), the claim would be approximately $770/year.

**2. Actual Cost Method**
Client calculates the actual proportion of running expenses (electricity, internet, phone, depreciation of furniture/equipment). Requires detailed records — bills, receipts, and a reasonable basis for calculating the work-related percentage. Floor area and time-use calculations are common.

**3. Occupancy Expenses (if running a business from home)**
Rent, mortgage interest, rates, insurance — only if part of the home is set aside exclusively as a place of business. This may trigger CGT implications on the sale of the home.

**Key requirements:**
- Must have a dedicated work area (doesn't need to be a separate room for the fixed rate method)
- Must keep contemporaneous records of hours worked from home
- Cannot claim expenses already reimbursed by the employer
- The shortcut method (80c/hour) ended 30 June 2022 — no longer available

**References:** TR 93/30 (home office expenses), ATO PS LA 2001/6, s8-1 ITAA 1997`,
    confidence: 'High',
    references: ['TR 93/30', 'PS LA 2001/6', 's8-1 ITAA 1997', 'ATO Home Office Expenses Guide 2024-25'],
    caveat: 'This guidance is based on current ATO published positions. Individual circumstances may vary. For claims above $5,000 or unusual arrangements, consider a private binding ruling.',
  },
  'company car': {
    jurisdiction: 'AU',
    ruling: 'DUAL TREATMENT — deduction for employer, FBT applies if private use',
    summary: 'The vehicle cost is deductible to the company, but providing it for private use triggers Fringe Benefits Tax (FBT).',
    detail: `**For the employer (company):**
Running costs (fuel, insurance, registration, maintenance, depreciation) are deductible under s8-1 ITAA 1997 to the extent the car is used for business purposes. The car limit for depreciation is $68,108 (2024-25) — costs above this are not deductible.

**Fringe Benefits Tax (FBT):**
If the employee has any private use (including commuting), FBT applies. Two valuation methods:

**1. Statutory Formula Method**
Taxable value = Base value × 20% × days available / 365
FBT rate is 47%. So a $60,000 car available all year = $60,000 × 20% = $12,000 taxable value × 47% = $5,640 FBT.

**2. Operating Cost Method**
Requires a logbook for a minimum 12-week period. Taxable value = total operating costs × private use percentage.
Generally better if business use exceeds 80%.

**Employee salary packaging:**
If structured as a salary sacrifice, the employee effectively receives a tax benefit because FBT is paid by the employer but the employee's pre-tax salary is reduced. ECB (Employee Contribution Base) payments can reduce the FBT liability.

**References:** FBTAA 1986 Division 2, s8-1 ITAA 1997, TR 2021/1`,
    confidence: 'High',
    references: ['FBTAA 1986 Div 2', 's8-1 ITAA 1997', 'TR 2021/1', 'ATO Car Fringe Benefits Guide'],
    caveat: 'FBT calculations are complex and depend on specific circumstances. Novated lease arrangements have additional rules. Consider seeking a private ruling for non-standard arrangements.',
  },
  'cryptocurrency': {
    jurisdiction: 'AU',
    ruling: 'TAXABLE — but 50% CGT discount applies if held >12 months',
    summary: 'Crypto gains are subject to Capital Gains Tax. The 50% discount applies for assets held more than 12 months (individuals and trusts only).',
    detail: `**ATO position is clear:** cryptocurrency is a CGT asset under s108-5 ITAA 1997.

**For investors (holding as investment):**
- Disposing of crypto (selling, exchanging, gifting, or using to purchase goods) triggers a CGT event
- Cost base = purchase price + gas fees + exchange fees
- If held > 12 months: 50% CGT discount applies (individuals and trusts only, NOT companies)
- If held < 12 months: full capital gain included in assessable income
- Capital losses can only be offset against capital gains (not ordinary income)

**For traders (carrying on a business of trading):**
- Gains and losses are on revenue account (not CGT)
- No 50% discount available
- Losses can be offset against other income
- ATO applies the same "badges of trade" tests as for share trading

**Record keeping requirements:**
- Date of acquisition and disposal
- Value in AUD at time of each transaction
- Purpose of holding
- Exchange records and wallet addresses
- The ATO data-matches with Australian exchanges (mandatory reporting since 2019)

**Common grey areas:**
- DeFi staking rewards: assessable as ordinary income when received
- Airdrops: assessable at market value when received
- NFTs: same CGT rules as crypto
- Mining: if a business, income when mined; if a hobby, CGT on disposal

**References:** TD 2014/26, s108-5 ITAA 1997, s115-25 (CGT discount), ATO Guide to Crypto Assets`,
    confidence: 'High',
    references: ['TD 2014/26', 's108-5 ITAA 1997', 's115-25 ITAA 1997', 'ATO Guide to Crypto Assets 2024'],
    caveat: 'DeFi, staking, and cross-chain transactions are evolving areas. The ATO has issued limited guidance on some newer protocols. For complex DeFi positions, consider a private binding ruling.',
  },
  'default': {
    jurisdiction: 'AU',
    ruling: 'ANALYSIS REQUIRED',
    summary: 'This question requires analysis against the relevant legislation and ATO/IRD/HMRC/IRS guidance.',
    detail: `I've analysed your question against the relevant tax legislation and published rulings. Here's my assessment:

**General principle:** Under s8-1 of the Income Tax Assessment Act 1997 (AU), a deduction is allowable to the extent that an expense is incurred in gaining or producing assessable income, or is necessarily incurred in carrying on a business for that purpose. The expense must not be of a capital, private, or domestic nature.

**For your specific question:**
The deductibility depends on several factors including:
- The nexus between the expense and income-producing activity
- Whether the expense is of a revenue or capital nature
- Whether any specific provisions override the general deduction rules
- The taxpayer's specific circumstances and industry

**Recommended next steps:**
1. Check for any specific ATO ruling or determination that directly addresses this type of expense
2. Review relevant case law (particularly Federal Court and AAT decisions)
3. Consider whether a private binding ruling from the ATO would provide certainty
4. Document the business purpose and maintain contemporaneous records

I can provide more specific guidance if you share additional details about the client's circumstances.`,
    confidence: 'Medium',
    references: ['s8-1 ITAA 1997', 's8-5 ITAA 1997 (specific deductions)', 'TR 93/30 (general deductions)'],
    caveat: 'This is general guidance based on published legislation and rulings. For material claims or unusual circumstances, always consider obtaining a private binding ruling from the relevant tax authority.',
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    const userQ = question;
    setQuestion('');
    setConversation(prev => [...prev, { role: 'user', content: userQ, jurisdiction }]);
    setLoading(true);

    // Simulate API delay (in production, this calls Claude API)
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

    const response = getResponse(userQ);
    setConversation(prev => [...prev, {
      role: 'agent',
      ruling: response.ruling,
      summary: response.summary,
      detail: response.detail,
      confidence: response.confidence,
      references: response.references,
      caveat: response.caveat,
      jurisdiction,
    }]);
    setLoading(false);
  };

  const handleExample = (example) => {
    setJurisdiction(example.jurisdiction);
    setQuestion(example.q);
  };

  const jur = JURISDICTIONS.find(j => j.code === jurisdiction);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Rulings Agent</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ask grey-area tax questions and get instant guidance with legislative references — like calling the {jur?.authority} without the hold time
        </p>
      </div>

      {/* Jurisdiction selector */}
      <div className="flex gap-2">
        {JURISDICTIONS.map(j => (
          <button key={j.code} onClick={() => setJurisdiction(j.code)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${jurisdiction === j.code ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {j.code} — {j.authority}
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        This agent provides guidance based on published legislation, rulings, and determinations. It does not constitute tax advice and should not be relied upon as a substitute for professional judgement. Always verify material positions with the relevant tax authority or a private binding ruling.
      </div>

      {/* Chat area */}
      <div className="bg-white border rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '400px', maxHeight: '600px' }}>
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
                    <button key={i} onClick={() => handleExample(example)}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-indigo-50 rounded-lg text-sm text-gray-700 hover:text-indigo-700 transition">
                      "{example.q}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {conversation.map((msg, i) => (
            <div key={i} className={`${msg.role === 'user' ? 'flex justify-end' : ''}`}>
              {msg.role === 'user' ? (
                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-lg">
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-[10px] text-indigo-300 mt-1">{JURISDICTIONS.find(j => j.code === msg.jurisdiction)?.authority} jurisdiction</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-5 max-w-2xl border">
                  {/* Ruling badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      msg.ruling?.includes('CLAIMABLE') || msg.ruling?.includes('TAXABLE') ? 'bg-green-100 text-green-700 border border-green-200' :
                      msg.ruling?.includes('DUAL') ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {msg.ruling}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${msg.confidence === 'High' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {msg.confidence} confidence
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-sm font-medium text-gray-900 mb-3">{msg.summary}</p>

                  {/* Detail */}
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {msg.detail?.split('\n\n').map((p, j) => (
                      <p key={j} className="mb-2">
                        {p.split(/\*\*(.*?)\*\*/g).map((seg, k) =>
                          k % 2 === 1 ? <strong key={k}>{seg}</strong> : seg
                        )}
                      </p>
                    ))}
                  </div>

                  {/* References */}
                  {msg.references?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">Legislative References</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.references.map((ref, j) => (
                          <span key={j} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-mono">{ref}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Caveat */}
                  {msg.caveat && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-[10px] text-gray-400 italic">{msg.caveat}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Researching {jur?.legislation}...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={e => { e.preventDefault(); handleAsk(); }} className="flex gap-3">
            <input value={question} onChange={e => setQuestion(e.target.value)}
              placeholder={`Ask a ${jur?.code} tax question... e.g. "Can my client claim..."`}
              className="flex-1 px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              disabled={loading} />
            <button type="submit" disabled={loading || !question.trim()}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition shrink-0">
              Ask
            </button>
          </form>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Powered by AI. Always verify with the {jur?.authority} or a registered tax agent before relying on this guidance.
          </p>
        </div>
      </div>

      <ProprietaryNotice />
    </div>
  );
}
