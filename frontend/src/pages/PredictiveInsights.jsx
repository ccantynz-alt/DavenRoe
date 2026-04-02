import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const PREDICTIONS = [
  {
    id: 1, type: 'cash_warning', severity: 'high', timeframe: '14 days',
    title: 'Cash flow will go negative in 14 days',
    detail: 'Based on current burn rate ($2,100/day), outstanding receivables ($18,200 with 40% at risk of late payment), and upcoming obligations ($28,400 due next 2 weeks), your operating account will hit zero around April 11.',
    recommendation: 'Accelerate collection on Invoice #1847 ($8,400, 32 days overdue) and Invoice #1903 ($4,200, 18 days overdue). Consider delaying the supplier payment to TechParts Ltd ($6,000, not due for 12 days).',
    confidence: 94,
    impact: '$12,600',
  },
  {
    id: 2, type: 'tax_threshold', severity: 'medium', timeframe: '3 months',
    title: 'Approaching VAT registration threshold (UK entity)',
    detail: 'Thames Legal Partners is on track to exceed the £85,000 VAT registration threshold within 3 months. Current rolling 12-month revenue: £72,400. Monthly growth rate: 6.2%.',
    recommendation: 'Begin VAT registration process now. Lead time is 4-6 weeks. Once registered, you must charge VAT from the registration date — not doing so is a penalty risk.',
    confidence: 87,
    impact: '£12,750 VAT liability',
  },
  {
    id: 3, type: 'expense_anomaly', severity: 'low', timeframe: 'This month',
    title: 'Software subscriptions up 34% vs 6-month average',
    detail: 'Total SaaS spend this month: $4,200 vs 6-month average of $3,130. New subscriptions detected: Figma ($45/mo), Notion Team ($48/mo), unused Slack upgrade ($25/mo difference).',
    recommendation: 'Review the Slack upgrade — usage data shows only 3 of 8 team members used advanced features. The Figma subscription hasn\'t been accessed in 12 days.',
    confidence: 91,
    impact: '$1,070/month savings',
  },
  {
    id: 4, type: 'revenue_opportunity', severity: 'positive', timeframe: '30 days',
    title: 'Client "Coastal Coffee" likely to need advisory services',
    detail: 'Based on transaction patterns: 3 new equipment purchases ($45K total), lease enquiry payment ($500), and ABN lookup for a new trading name. This suggests expansion — they may need restructuring, financing, or tax planning advice.',
    recommendation: 'Reach out proactively. Offer a business restructure consultation or advisory session. Estimated additional revenue: $3,000-5,000 for advisory engagement.',
    confidence: 78,
    impact: '$3,000-5,000 revenue',
  },
  {
    id: 5, type: 'compliance_risk', severity: 'high', timeframe: '7 days',
    title: 'PAYG withholding payment due — not yet lodged',
    detail: 'Q3 PAYG withholding for Coastal Coffee Co is due March 28. Amount: $14,200. The payment has been calculated but the IAS/BAS has not been lodged yet. Late lodgement penalty: $313 + interest.',
    recommendation: 'Lodge immediately. The draft BAS is ready in Tax Filing — review and submit today. Set up auto-lodge for future quarters.',
    confidence: 99,
    impact: '$313+ penalty avoided',
  },
  {
    id: 6, type: 'client_churn', severity: 'medium', timeframe: '60 days',
    title: 'Client "Kiwi Design Studio" may be disengaging',
    detail: 'No invoices created in 45 days (previously weekly). Bank feed disconnected 12 days ago and not reconnected. Last login: 18 days ago. Document uploads stopped.',
    recommendation: 'Send a check-in email. The Client Relationship Agent has drafted one — review and send from the Communications tab. Consider offering a free advisory call.',
    confidence: 72,
    impact: '$588/year revenue at risk',
  },
];

const SEVERITY_COLORS = {
  high: 'border-red-200 bg-red-50', medium: 'border-amber-200 bg-amber-50',
  low: 'border-blue-200 bg-blue-50', positive: 'border-green-200 bg-green-50',
};
const SEVERITY_BADGES = {
  high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700', positive: 'bg-green-100 text-green-700',
};
const TYPE_LABELS = {
  cash_warning: 'Cash Flow', tax_threshold: 'Tax', expense_anomaly: 'Expenses',
  revenue_opportunity: 'Opportunity', compliance_risk: 'Compliance', client_churn: 'Client Risk',
};

export default function PredictiveInsights() {
  const [predictions, setPredictions] = useState(PREDICTIONS);
  const [dismissed, setDismissed] = useState([]);
  const [scanning, setScanning] = useState(false);
  const toast = useToast();

  const active = predictions.filter(p => !dismissed.includes(p.id));
  const highCount = active.filter(p => p.severity === 'high').length;
  const actionableCount = active.length;

  const handleDismiss = (id) => {
    setDismissed(prev => [...prev, id]);
    toast.success('Prediction dismissed');
  };

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      toast.success('Predictive scan complete — 6 insights generated');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Predictive Insights</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI predicts problems before they happen and finds opportunities you'd miss</p>
        </div>
        <button onClick={handleScan} disabled={scanning}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {scanning ? 'Scanning...' : 'Run Predictive Scan'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Active Predictions</p>
          <p className="text-2xl font-bold text-gray-900">{actionableCount}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Urgent</p>
          <p className="text-2xl font-bold text-red-600">{highCount}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Potential Savings</p>
          <p className="text-2xl font-bold text-green-600">$14,983</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Revenue Opportunities</p>
          <p className="text-2xl font-bold text-blue-600">$5,000</p>
        </div>
      </div>

      {/* Predictions */}
      <div className="space-y-3">
        {active.map(p => (
          <div key={p.id} className={`border-2 rounded-xl p-5 ${SEVERITY_COLORS[p.severity]}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SEVERITY_BADGES[p.severity]}`}>
                  {p.severity === 'positive' ? 'OPPORTUNITY' : p.severity.toUpperCase()}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {TYPE_LABELS[p.type]}
                </span>
                <span className="text-[10px] text-gray-400">within {p.timeframe}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">{p.confidence}% confidence</span>
                <button onClick={() => handleDismiss(p.id)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">{p.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{p.detail}</p>

            <div className="bg-white/80 rounded-lg p-3 border">
              <p className="text-xs font-semibold text-gray-500 mb-1">AI RECOMMENDATION</p>
              <p className="text-sm text-gray-700">{p.recommendation}</p>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs font-medium text-gray-500">Impact: {p.impact}</span>
              <button onClick={() => toast.success('Action taken — see Activity Feed for details')}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
                Take Action
              </button>
            </div>
          </div>
        ))}
      </div>

      {active.length === 0 && (
        <div className="text-center py-16 bg-white border rounded-xl">
          <p className="text-3xl mb-3">✓</p>
          <h3 className="font-semibold text-gray-900 mb-1">All clear</h3>
          <p className="text-sm text-gray-500">No predictions requiring attention. Run a scan to check again.</p>
        </div>
      )}

      <ProprietaryNotice />
    </div>
  );
}
