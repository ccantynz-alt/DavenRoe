import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, TrendingDown } from 'lucide-react';
import LegalDisclaimer from '@/components/LegalDisclaimer';

const JURISDICTIONS = [
  { v: 'AU', label: 'Australia (BAS/GST)' },
  { v: 'NZ', label: 'New Zealand (GST)' },
  { v: 'UK', label: 'United Kingdom (VAT)' },
  { v: 'US', label: 'United States (Sales Tax / 941)' },
];

const REVENUE_BANDS = [
  { v: 'under_100k', label: 'Under $100K / year', multiplier: 1 },
  { v: '100_500k', label: '$100K – $500K / year', multiplier: 2.5 },
  { v: '500k_1m', label: '$500K – $1M / year', multiplier: 5 },
  { v: '1_5m', label: '$1M – $5M / year', multiplier: 10 },
  { v: '5m_plus', label: '$5M+ / year', multiplier: 20 },
];

// Conservative penalty calculations per jurisdiction (per missed period)
const PENALTY_PER_PERIOD = {
  AU: { fixed: 1110, interest_pct: 0.1117 }, // ATO FTL penalty + GIC
  NZ: { fixed: 250, interest_pct: 0.1088 },  // IRD late filing + UOMI
  UK: { fixed: 400, interest_pct: 0.025 },   // HMRC VAT + 2.5%/mo
  US: { fixed: 250, interest_pct: 0.08 },    // IRS 5%/mo capped + interest
};

export default function PenaltyCalculator() {
  const [jurisdiction, setJurisdiction] = useState('AU');
  const [periods, setPeriods] = useState(4);
  const [revenueBand, setRevenueBand] = useState('100_500k');
  const [avgMonthsOverdue, setAvgMonthsOverdue] = useState(6);

  useEffect(() => {
    document.title = 'Penalty Calculator — How Much Will You Owe? | DavenRoe Catch-Up';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Free penalty calculator for missed GST, BAS, VAT, and sales tax returns. AU, NZ, UK, US. See your exposure in 30 seconds. DavenRoe\'s catch-up rescue reduces penalties by 40-60% via voluntary disclosure.');
  }, []);

  const results = useMemo(() => {
    const rule = PENALTY_PER_PERIOD[jurisdiction];
    const band = REVENUE_BANDS.find((r) => r.v === revenueBand);
    const multiplier = band?.multiplier || 1;

    // Base penalty per period scaled by revenue
    const basePenalty = rule.fixed * multiplier * periods;

    // Interest accrual
    const interestMonths = avgMonthsOverdue * periods / 2; // roughly
    const interestAmount = basePenalty * rule.interest_pct * (interestMonths / 12);

    const low = basePenalty * 0.7; // tax authority discretion favourable
    const high = basePenalty + interestAmount; // no relief
    const savings = high - (high * 0.5); // 50% reduction via voluntary disclosure
    const withDavenRoe = high - savings;

    return {
      low: Math.round(low),
      high: Math.round(high),
      savings: Math.round(savings),
      withDavenRoe: Math.round(withDavenRoe),
    };
  }, [jurisdiction, periods, revenueBand, avgMonthsOverdue]);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <section className="bg-gradient-to-br from-gray-950 via-red-950 to-orange-950 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-200 text-xs font-medium mb-4">
            FREE • NO SIGNUP REQUIRED
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How Much Will You Owe?</h1>
          <p className="text-lg text-gray-200">Honest penalty estimate in 30 seconds. Real formulas from the ATO, IRD, HMRC, and IRS.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="font-bold text-lg mb-5">Your Situation</h2>

            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700 block mb-1">Jurisdiction</span>
              <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 bg-white focus:ring-2 focus:ring-davenRoe-500">
                {JURISDICTIONS.map((j) => <option key={j.v} value={j.v}>{j.label}</option>)}
              </select>
            </label>

            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700 block mb-1">Number of missed returns</span>
              <input type="number" min="1" max="999" value={periods} onChange={(e) => setPeriods(Math.max(1, parseInt(e.target.value) || 1))} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-davenRoe-500" />
            </label>

            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700 block mb-1">Business revenue</span>
              <select value={revenueBand} onChange={(e) => setRevenueBand(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 bg-white focus:ring-2 focus:ring-davenRoe-500">
                {REVENUE_BANDS.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 block mb-1">Average months overdue per return</span>
              <input type="number" min="1" max="120" value={avgMonthsOverdue} onChange={(e) => setAvgMonthsOverdue(Math.max(1, parseInt(e.target.value) || 1))} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-davenRoe-500" />
            </label>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm uppercase tracking-wider mb-2"><AlertTriangle className="w-4 h-4" /> Worst case (if tax authority catches you first)</div>
              <div className="text-4xl font-bold text-red-900">${results.high.toLocaleString()}</div>
              <div className="text-sm text-red-700 mt-1">Full penalty + interest, no relief</div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm uppercase tracking-wider mb-2">Best case (tax authority discretion)</div>
              <div className="text-3xl font-bold text-orange-900">${results.low.toLocaleString()}</div>
              <div className="text-sm text-orange-700 mt-1">Favourable discretion — not guaranteed</div>
            </div>

            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
              <div className="flex items-center gap-2 text-green-700 font-semibold text-sm uppercase tracking-wider mb-2"><TrendingDown className="w-4 h-4" /> With DavenRoe voluntary disclosure</div>
              <div className="text-4xl font-bold text-green-900">${results.withDavenRoe.toLocaleString()}</div>
              <div className="text-sm text-green-700 mt-1">You save up to <strong>${results.savings.toLocaleString()}</strong> via voluntary disclosure + hardship remission</div>
            </div>

            <Link to="/catch-up" className="block bg-davenRoe-600 hover:bg-davenRoe-700 text-white font-bold py-3 rounded-lg text-center transition">
              Get full rescue plan — 60 seconds <ArrowRight className="w-5 h-5 inline ml-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-xl font-bold mb-3">Penalty formulas used in this calculator</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>AU ATO</strong>: Failure-to-lodge penalty up to $1,110 per return × GIC interest (currently 11.17% pa)</p>
            <p><strong>NZ IRD</strong>: Late filing fee $250 + late payment penalty (1% + 4% after 7 days) + UOMI 10.88% pa</p>
            <p><strong>UK HMRC</strong>: £200 first late + £15-£400 subsequent under points system + 2.5% per month overdue</p>
            <p><strong>US IRS</strong>: 5% per month (capped at 25%) + interest ~8% pa</p>
          </div>
          <p className="text-xs text-gray-500 mt-6">Estimates are conservative. Actual penalties depend on tax authority discretion, voluntary disclosure status, hardship application, and your specific circumstances. These numbers are a starting point, not a guarantee.</p>
        </div>
      </section>

      <div className="bg-gray-100 py-6 px-6">
        <div className="max-w-4xl mx-auto"><LegalDisclaimer variant="tax" /></div>
      </div>
    </div>
  );
}
