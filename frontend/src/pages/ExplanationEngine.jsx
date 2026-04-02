import { useState } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const EXPLANATIONS = [
  {
    id: 1, type: 'categorisation', timestamp: '2 min ago',
    decision: 'Categorised "OFFICEWORKS PTY LTD" ($245.80) → Account 5100 (Office Supplies)',
    agent: 'Transaction Categoriser',
    confidence: 97,
    reasoning: [
      { factor: 'Vendor match', weight: 40, detail: 'Vendor "Officeworks" has been categorised to 5100 in 47 of the last 48 transactions for this entity.' },
      { factor: 'Amount range', weight: 20, detail: 'Amount $245.80 falls within the typical range for office supply purchases ($15-$500).' },
      { factor: 'Description keywords', weight: 25, detail: 'Transaction description contains "PTY LTD" pattern consistent with AU business purchases.' },
      { factor: 'Time pattern', weight: 15, detail: 'Transaction occurred during business hours on a weekday, consistent with office supply purchasing.' },
    ],
    alternatives: [
      { account: '1500 (Equipment)', confidence: 12, reason: 'Amount could be equipment, but below typical equipment threshold ($500+).' },
      { account: '5200 (General Expenses)', confidence: 8, reason: 'Catch-all category, but specific vendor match overrides.' },
    ],
    memory_used: 'Pattern: vendor:officeworks → 5100 (learned from 47 approvals, last correction: never)',
  },
  {
    id: 2, type: 'anomaly', timestamp: '15 min ago',
    decision: 'Flagged transaction to "JD Holdings" ($9,999.00) as HIGH RISK',
    agent: 'Audit Shield',
    confidence: 94,
    reasoning: [
      { factor: 'Just-below threshold', weight: 35, detail: 'Amount is $1 below the $10,000 ATO cash transaction reporting threshold. This pattern is a known indicator of structuring.' },
      { factor: 'Vendor risk', weight: 30, detail: 'JD Holdings has no ABN on file, uses a PO Box address, and was added as a vendor 12 days ago.' },
      { factor: 'Round amount proximity', weight: 20, detail: '$9,999.00 is within 0.01% of a round $10,000. Round amounts to new vendors are a fraud indicator.' },
      { factor: 'Historical pattern', weight: 15, detail: 'This is the 3rd payment to JD Holdings in 6 months, all between $4,900-$9,999. Pattern suggests deliberate threshold avoidance.' },
    ],
    alternatives: [
      { account: 'Legitimate payment', confidence: 6, reason: 'Could be a legitimate purchase that happens to be near the threshold.' },
    ],
    memory_used: 'Baseline: normal vendor payment range for this entity is $200-$8,000. $9,999 is 2.1 standard deviations above mean.',
  },
  {
    id: 3, type: 'reconciliation', timestamp: '1 hr ago',
    decision: 'Auto-matched bank transaction ($2,400.00 from "Acme Corp") → Invoice #1847',
    agent: 'Bank Reconciler',
    confidence: 99,
    reasoning: [
      { factor: 'Exact amount match', weight: 40, detail: 'Bank transaction amount ($2,400.00) matches Invoice #1847 total ($2,400.00) exactly.' },
      { factor: 'Payer name match', weight: 30, detail: '"Acme Corp" in bank description matches client name on Invoice #1847.' },
      { factor: 'Date proximity', weight: 20, detail: 'Payment received 8 days after invoice was sent (within typical 14-day payment terms).' },
      { factor: 'Reference match', weight: 10, detail: 'Bank reference contains "1847" which matches the invoice number.' },
    ],
    alternatives: [
      { account: 'Invoice #1903 ($2,400.00)', confidence: 15, reason: 'Same amount but different client. Name match on #1847 takes priority.' },
    ],
    memory_used: 'Rule: "Acme Corp" payments always match to their oldest unpaid invoice first (learned from 12 successful matches).',
  },
  {
    id: 4, type: 'tax', timestamp: '3 hrs ago',
    decision: 'Applied 15% WHT reduction on $100,000 dividend (AU→UK) under DTA Article 10',
    agent: 'Tax Advisory Agent',
    confidence: 96,
    reasoning: [
      { factor: 'Treaty identification', weight: 35, detail: 'AU-UK Double Taxation Agreement (2003) applies. Both entities are tax residents of their respective jurisdictions.' },
      { factor: 'Income classification', weight: 25, detail: 'Payment classified as dividend under Article 10. Beneficial ownership confirmed (UK entity holds 100% of AU entity).' },
      { factor: 'Rate determination', weight: 25, detail: 'Article 10(2)(b) applies: 15% WHT rate for portfolio dividends. Could be reduced to 5% if shareholding exceeds 10% of voting power — needs verification.' },
      { factor: 'Compliance check', weight: 15, detail: 'UK entity has valid Certificate of Residence. No PE in Australia. No anti-avoidance provisions triggered.' },
    ],
    alternatives: [
      { account: '5% reduced rate', confidence: 45, reason: 'If UK entity holds >10% voting power (likely given 100% ownership), the rate should be 5% not 15%. Flagged for accountant review.' },
    ],
    memory_used: 'Client preference: Coastal Coffee Group uses portfolio dividend rate by default. Accountant can override to substantial holding rate.',
  },
  {
    id: 5, type: 'prediction', timestamp: '6 hrs ago',
    decision: 'Predicted cash flow will go negative in 14 days — severity HIGH',
    agent: 'Cash Flow Forecaster',
    confidence: 94,
    reasoning: [
      { factor: 'Burn rate analysis', weight: 30, detail: 'Current daily cash burn: $2,100/day. Operating account balance: $29,400. At current rate, zero in 14 days.' },
      { factor: 'Receivables risk', weight: 25, detail: '$18,200 outstanding. Of this, $12,600 is overdue >14 days with 40% historical collection rate for overdue invoices.' },
      { factor: 'Upcoming obligations', weight: 25, detail: '$28,400 in scheduled payments next 2 weeks (payroll $14,200, rent $8,000, suppliers $6,200).' },
      { factor: 'Seasonal pattern', weight: 20, detail: 'March-April historically sees 15% revenue dip for this entity (3 years of data).' },
    ],
    alternatives: [
      { account: 'Stable (no risk)', confidence: 6, reason: 'Only if all outstanding invoices are collected in full within 7 days.' },
    ],
    memory_used: 'Baseline: entity monthly cash requirement is $63,000. Current trajectory projects only $48,000 available.',
  },
];

const TYPE_COLORS = {
  categorisation: 'bg-blue-100 text-blue-700', anomaly: 'bg-red-100 text-red-700',
  reconciliation: 'bg-green-100 text-green-700', tax: 'bg-purple-100 text-purple-700',
  prediction: 'bg-amber-100 text-amber-700',
};

export default function ExplanationEngine() {
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const filtered = filter === 'all' ? EXPLANATIONS : EXPLANATIONS.filter(e => e.type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Explanation Engine</h1>
        <p className="text-sm text-gray-500 mt-0.5">Every AI decision explained — see exactly why each action was taken</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Transparency by design.</strong> Every decision made by AlecRae's 25 AI agents can be explained. Click any decision to see the reasoning factors, alternative options considered, and memory patterns used. This builds trust and meets audit requirements.
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Decisions Today</p>
          <p className="text-2xl font-bold text-gray-900">1,247</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Avg Confidence</p>
          <p className="text-2xl font-bold text-green-600">96.2%</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">User Corrections</p>
          <p className="text-2xl font-bold text-amber-600">3</p>
          <p className="text-[10px] text-gray-400">0.24% correction rate</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Memory Patterns Used</p>
          <p className="text-2xl font-bold text-indigo-600">847</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'categorisation', 'anomaly', 'reconciliation', 'tax', 'prediction'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${filter === f ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {f === 'all' ? 'All Decisions' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(exp => (
          <div key={exp.id} className="bg-white border rounded-xl overflow-hidden">
            <button onClick={() => setExpanded(expanded === exp.id ? null : exp.id)}
              className="w-full text-left p-5 hover:bg-gray-50 transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[exp.type]}`}>{exp.type}</span>
                  <span className="text-xs text-gray-500">{exp.agent}</span>
                  <span className="text-xs text-gray-400">{exp.timestamp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${exp.confidence >= 95 ? 'text-green-600' : exp.confidence >= 85 ? 'text-amber-600' : 'text-red-600'}`}>
                    {exp.confidence}% confidence
                  </span>
                  <span className="text-gray-300">{expanded === exp.id ? '▼' : '▶'}</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">{exp.decision}</p>
            </button>

            {expanded === exp.id && (
              <div className="px-5 pb-5 border-t bg-gray-50">
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reasoning Factors</p>
                    <div className="space-y-2">
                      {exp.reasoning.map((r, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{r.factor}</span>
                            <span className="text-xs font-medium text-indigo-600">{r.weight}% weight</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${r.weight}%` }} />
                          </div>
                          <p className="text-xs text-gray-600">{r.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Alternatives Considered</p>
                    <div className="space-y-1">
                      {exp.alternatives.map((alt, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2 border text-xs">
                          <span className="text-gray-700">{alt.account}</span>
                          <span className="text-gray-400">{alt.confidence}% — {alt.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                    <p className="text-[10px] font-semibold text-indigo-500 uppercase mb-1">Memory Pattern Used</p>
                    <p className="text-xs text-indigo-700 font-mono">{exp.memory_used}</p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => toast.success('Decision confirmed — memory reinforced')}
                      className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200">
                      Confirm Decision
                    </button>
                    <button onClick={() => toast.info('Override mode — select the correct action')}
                      className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200">
                      Override
                    </button>
                    <button onClick={() => toast.info('Audit trail exported')}
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200">
                      Export for Audit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ProprietaryNotice />
    </div>
  );
}
