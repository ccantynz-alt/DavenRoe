import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, AlertTriangle, Clock, TrendingDown, ShieldCheck, Loader2 } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';
import api from '@/services/api';
import LegalDisclaimer from '@/components/LegalDisclaimer';

const JURISDICTIONS = [
  { code: 'AU', label: 'Australia', sub: 'BAS + GST + income tax' },
  { code: 'NZ', label: 'New Zealand', sub: 'GST + income tax' },
  { code: 'UK', label: 'United Kingdom', sub: 'VAT + corporation tax' },
  { code: 'US', label: 'United States', sub: 'Sales tax + federal + state' },
];

const YEARS_BEHIND = [
  { v: '3_months', l: '3 months behind', sub: 'A quarter or two missed' },
  { v: '1_year', l: '1 year behind', sub: 'Annual return missed' },
  { v: '2_years', l: '2 years behind', sub: 'Multiple periods missed' },
  { v: '3_plus_years', l: '3+ years behind', sub: 'Significant backlog' },
  { v: 'unsure', l: 'I have no idea', sub: 'We\'ll figure it out together' },
];

const DOCUMENTS = [
  { v: 'bank_statements', l: 'Bank statements' },
  { v: 'receipts', l: 'Receipts' },
  { v: 'invoices', l: 'Invoices' },
  { v: 'nothing', l: 'Nothing (lost / never kept)' },
];

const BUSINESS_TYPES = [
  { v: 'sole_trader', l: 'Sole trader' },
  { v: 'company', l: 'Company / Corporation' },
  { v: 'trust', l: 'Trust' },
  { v: 'partnership', l: 'Partnership' },
  { v: 'charity', l: 'Charity / Non-profit' },
];

const WORRIES = [
  { v: 'gst_bas_vat', l: 'GST / BAS / VAT' },
  { v: 'income_tax', l: 'Income tax' },
  { v: 'payroll', l: 'Payroll / PAYE / PAYG' },
  { v: 'all', l: 'All of it' },
];

export default function CatchUp() {
  const [step, setStep] = useState(0); // 0 = hero, 1-5 = wizard, 6 = results
  const [jurisdictions, setJurisdictions] = useState([]);
  const [yearsBehind, setYearsBehind] = useState(null);
  const [docs, setDocs] = useState([]);
  const [bizType, setBizType] = useState(null);
  const [worries, setWorries] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Years Behind on Your Books? The Catch-Up Rescue | DavenRoe';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Missed GST returns? Unfiled BAS? VAT penalties piling up? DavenRoe rescues businesses years behind on bookkeeping. 5-question assessment, penalty estimate in 60 seconds, full rescue plan. No judgment.');
  }, []);

  const toggle = (arr, setArr, value, exclusive = null) => {
    if (exclusive && value === exclusive) {
      setArr([exclusive]);
      return;
    }
    if (arr.includes(exclusive) && value !== exclusive) {
      setArr([value]);
      return;
    }
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return jurisdictions.length > 0;
      case 2: return yearsBehind !== null;
      case 3: return docs.length > 0;
      case 4: return bizType !== null;
      case 5: return worries.length > 0;
      default: return false;
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/v1/catch-up/assess', {
        jurisdictions, years_behind: yearsBehind, documents_available: docs,
        business_type: bizType, worries,
      });
      setPlan(res.data);
      setStep(6);
    } catch (e) {
      // Fallback: calculate client-side if API is unavailable
      setPlan(clientSidePlan({ jurisdictions, yearsBehind, docs, bizType, worries }));
      setStep(6);
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setStep(0); setJurisdictions([]); setYearsBehind(null); setDocs([]); setBizType(null); setWorries([]); setPlan(null);
  };

  // Wizard hero
  if (step === 0) {
    return (
      <div className="bg-white text-gray-900 min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Service',
          name: 'DavenRoe Catch-Up Rescue',
          description: 'Years-behind bookkeeping rescue service. 5-question wizard produces a full catch-up plan with penalty estimate, voluntary disclosure templates, and auto-generated missed returns.',
          provider: { '@type': 'Organization', name: 'DavenRoe' },
        })}} />

        <section className="bg-gradient-to-br from-gray-950 via-red-950 to-orange-950 text-white py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="inline-block px-3 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-medium mb-6">
              NO JUDGMENT. NO SHAME. JUST A CLEAN SLATE.
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Years Behind on Your Books?<br />
              <span className="text-orange-300">We'll Rescue You in 48 Hours.</span>
            </h1>
            <p className="text-xl text-gray-200 max-w-3xl mb-8">
              Missed GST returns. Unfiled BAS. VAT penalties piling up. Your accountant ghosted you. You're terrified of the tax department. Upload your bank statements, answer 5 questions, get a full rescue plan in 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setStep(1)} className="inline-flex items-center justify-center gap-2 bg-white text-red-900 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition">
                Start My 60-Second Assessment <ArrowRight className="w-5 h-5" />
              </button>
              <Link to="/catchup/penalty-calculator" className="inline-flex items-center justify-center gap-2 border border-gray-500 hover:border-gray-300 text-gray-200 font-semibold py-3 px-6 rounded-lg transition">
                Penalty calculator only
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">How Far Behind Are You?</h2>
            <div className="grid md:grid-cols-5 gap-3">
              {YEARS_BEHIND.map((y) => (
                <div key={y.v} className="bg-white rounded-lg p-4 border border-gray-200 text-center hover:border-davenRoe-500 transition cursor-pointer" onClick={() => { setYearsBehind(y.v); setStep(1); }}>
                  <div className="font-bold text-gray-900 text-sm">{y.l}</div>
                  <div className="text-xs text-gray-500 mt-1">{y.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 text-center">
            <div><Clock className="w-8 h-8 text-davenRoe-600 mx-auto mb-2" /><h3 className="font-bold">60-Second Assessment</h3><p className="text-sm text-gray-600">Instant penalty estimate + rescue plan</p></div>
            <div><ShieldCheck className="w-8 h-8 text-davenRoe-600 mx-auto mb-2" /><h3 className="font-bold">Voluntary Disclosure</h3><p className="text-sm text-gray-600">Reduce penalties by 40-60% with AI-drafted disclosures</p></div>
            <div><TrendingDown className="w-8 h-8 text-davenRoe-600 mx-auto mb-2" /><h3 className="font-bold">95%+ Accuracy</h3><p className="text-sm text-gray-600">Reconstruction from bank statements alone</p></div>
          </div>
        </section>

        <div className="bg-gray-100 py-6 px-6">
          <div className="max-w-4xl mx-auto"><LegalDisclaimer variant="tax" /></div>
        </div>
      </div>
    );
  }

  // Results page
  if (step === 6 && plan) {
    return (
      <div className="bg-white text-gray-900 min-h-screen py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={restart} className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1 mb-6"><ArrowLeft className="w-4 h-4" /> Start over</button>

          <h1 className="text-3xl md:text-4xl font-bold mb-2">Your Rescue Plan</h1>
          <p className="text-gray-600 mb-10">Based on your answers, here's what DavenRoe can do for you.</p>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Catch-Up Scope</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">{plan.total_periods}</div>
              <div className="text-sm text-gray-600">periods to reconstruct across {plan.jurisdictions.join(' + ')}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Penalty Exposure (if you do nothing)</div>
              <div className="text-4xl font-bold text-red-900 mb-1">${Number(plan.penalty_worst_case).toLocaleString()}</div>
              <div className="text-sm text-red-700">Best case if voluntary disclosure: ${Number(plan.penalty_best_case).toLocaleString()}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">DavenRoe Saves You Up To</div>
              <div className="text-4xl font-bold text-green-900 mb-1">${Number(plan.penalty_savings_via_davenroe).toLocaleString()}</div>
              <div className="text-sm text-green-700">via voluntary disclosure + hardship remission</div>
            </div>
            <div className="bg-davenRoe-50 rounded-xl p-6 border border-davenRoe-200">
              <div className="text-xs font-semibold text-davenRoe-700 uppercase tracking-wider mb-2">Time to Complete</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">{plan.davenroe_time_hours}h</div>
              <div className="text-sm text-gray-600">vs {plan.human_time_hours}h with a traditional accountant — {Math.round(plan.human_time_hours / plan.davenroe_time_hours)}× faster</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-10">
            <h2 className="text-xl font-bold mb-4">Recommended Order of Operations</h2>
            <ol className="space-y-3">
              {plan.recommended_steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-davenRoe-600 text-white flex items-center justify-center font-bold text-sm">{i + 1}</div>
                  <div className="text-gray-700 pt-0.5">{s}</div>
                </li>
              ))}
            </ol>
          </div>

          {/* CTAs */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`rounded-xl p-6 border-2 ${plan.recommended_plan === 'basic_299' ? 'border-davenRoe-500 bg-davenRoe-50' : 'border-gray-200 bg-white'}`}>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Up to 2 years</div>
              <div className="text-3xl font-bold mb-2">$299<span className="text-lg font-normal text-gray-500"> one-time</span></div>
              <ul className="text-sm text-gray-700 space-y-2 mb-6">
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> All missed returns auto-generated</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Penalty calculator + filing order</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Full reconstruction from bank data</li>
              </ul>
              <button className="w-full bg-davenRoe-600 hover:bg-davenRoe-700 text-white font-semibold py-2.5 rounded-lg transition">Rescue me now — $299</button>
            </div>

            <div className={`rounded-xl p-6 border-2 ${plan.recommended_plan === 'plus_799' ? 'border-davenRoe-500 bg-davenRoe-50' : 'border-gray-200 bg-white'}`}>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Up to 5 years</div>
              <div className="text-3xl font-bold mb-2">$799<span className="text-lg font-normal text-gray-500"> one-time</span></div>
              <ul className="text-sm text-gray-700 space-y-2 mb-6">
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Everything in Catch-Up</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Voluntary disclosure drafting</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Hardship remission templates</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Audit defense pack</li>
              </ul>
              <button className="w-full bg-davenRoe-600 hover:bg-davenRoe-700 text-white font-semibold py-2.5 rounded-lg transition">Rescue me now — $799</button>
            </div>

            <div className={`rounded-xl p-6 border-2 ${plan.recommended_plan === 'enterprise' ? 'border-davenRoe-500 bg-davenRoe-50' : 'border-gray-200 bg-white'}`}>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">5+ years / complex</div>
              <div className="text-3xl font-bold mb-2">Custom</div>
              <ul className="text-sm text-gray-700 space-y-2 mb-6">
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Dedicated specialist</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Multi-entity reconstruction</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Complex restructures</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Expert witness testimony</li>
              </ul>
              <Link to="/contact" className="block w-full text-center bg-gray-900 hover:bg-black text-white font-semibold py-2.5 rounded-lg transition">Talk to a specialist</Link>
            </div>
          </div>

          <div className="mt-10"><LegalDisclaimer variant="tax" /></div>
        </div>
      </div>
    );
  }

  // Wizard steps 1-5
  const progress = (step / 5) * 100;
  return (
    <div className="bg-white text-gray-900 min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setStep(Math.max(0, step - 1))} className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
          <span className="text-sm text-gray-500">Step {step} of 5</span>
        </div>
        <Progress.Root value={progress} className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-10">
          <Progress.Indicator className="h-full bg-davenRoe-600 transition-transform" style={{ transform: `translateX(-${100 - progress}%)` }} />
        </Progress.Root>

        {step === 1 && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Which jurisdictions?</h2>
            <p className="text-gray-600 mb-6">Pick every country your business operates in.</p>
            <div className="space-y-3">
              {JURISDICTIONS.map((j) => (
                <label key={j.code} className={`flex items-center gap-3 rounded-lg p-4 border-2 cursor-pointer transition ${jurisdictions.includes(j.code) ? 'border-davenRoe-500 bg-davenRoe-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="checkbox" checked={jurisdictions.includes(j.code)} onChange={() => toggle(jurisdictions, setJurisdictions, j.code)} className="w-5 h-5 text-davenRoe-600" />
                  <div>
                    <div className="font-semibold">{j.label}</div>
                    <div className="text-xs text-gray-500">{j.sub}</div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">How far behind?</h2>
            <p className="text-gray-600 mb-6">Honest answer. We've seen every situation — nothing surprises us.</p>
            <div className="space-y-3">
              {YEARS_BEHIND.map((y) => (
                <label key={y.v} className={`flex items-center gap-3 rounded-lg p-4 border-2 cursor-pointer transition ${yearsBehind === y.v ? 'border-davenRoe-500 bg-davenRoe-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="years" checked={yearsBehind === y.v} onChange={() => setYearsBehind(y.v)} className="w-5 h-5 text-davenRoe-600" />
                  <div>
                    <div className="font-semibold">{y.l}</div>
                    <div className="text-xs text-gray-500">{y.sub}</div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">What do you have?</h2>
            <p className="text-gray-600 mb-6">Bank statements alone are enough for us to reconstruct your entire history.</p>
            <div className="space-y-3">
              {DOCUMENTS.map((d) => (
                <label key={d.v} className={`flex items-center gap-3 rounded-lg p-4 border-2 cursor-pointer transition ${docs.includes(d.v) ? 'border-davenRoe-500 bg-davenRoe-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="checkbox" checked={docs.includes(d.v)} onChange={() => toggle(docs, setDocs, d.v, 'nothing')} className="w-5 h-5 text-davenRoe-600" />
                  <div className="font-semibold">{d.l}</div>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Business type?</h2>
            <p className="text-gray-600 mb-6">Determines which returns you need to file.</p>
            <div className="space-y-3">
              {BUSINESS_TYPES.map((b) => (
                <label key={b.v} className={`flex items-center gap-3 rounded-lg p-4 border-2 cursor-pointer transition ${bizType === b.v ? 'border-davenRoe-500 bg-davenRoe-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="biz" checked={bizType === b.v} onChange={() => setBizType(b.v)} className="w-5 h-5 text-davenRoe-600" />
                  <div className="font-semibold">{b.l}</div>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">What's worrying you most?</h2>
            <p className="text-gray-600 mb-6">We'll file the most painful ones first to stop the penalty bleed.</p>
            <div className="space-y-3">
              {WORRIES.map((w) => (
                <label key={w.v} className={`flex items-center gap-3 rounded-lg p-4 border-2 cursor-pointer transition ${worries.includes(w.v) ? 'border-davenRoe-500 bg-davenRoe-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="checkbox" checked={worries.includes(w.v)} onChange={() => toggle(worries, setWorries, w.v, 'all')} className="w-5 h-5 text-davenRoe-600" />
                  <div className="font-semibold">{w.l}</div>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 flex gap-3">
          {step < 5 && (
            <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="bg-davenRoe-600 hover:bg-davenRoe-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg inline-flex items-center gap-2 transition">
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          )}
          {step === 5 && (
            <button onClick={submit} disabled={!canProceed() || loading} className="bg-davenRoe-600 hover:bg-davenRoe-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg inline-flex items-center gap-2 transition">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating…</> : <>Generate My Rescue Plan <ArrowRight className="w-5 h-5" /></>}
            </button>
          )}
        </div>

        {error && <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
      </div>
    </div>
  );
}

// Client-side fallback if backend unavailable
function clientSidePlan({ jurisdictions, yearsBehind, docs, bizType, worries }) {
  const yearMap = { '3_months': 0.25, '1_year': 1, '2_years': 2, '3_plus_years': 4, 'unsure': 3 };
  const years = yearMap[yearsBehind] ?? 1;
  const periodsPerYear = { AU: 5, NZ: 7, UK: 5, US: 17 };
  const totalPeriods = Math.round(jurisdictions.reduce((a, j) => a + (periodsPerYear[j] || 5) * years, 0));
  const penaltyPerPeriod = { AU: 600, NZ: 450, UK: 350, US: 400 };
  const worstPenalty = Math.round(jurisdictions.reduce((a, j) => a + (penaltyPerPeriod[j] || 500) * (periodsPerYear[j] || 5) * years, 0));
  const bestPenalty = Math.round(worstPenalty * 0.45);
  const savings = worstPenalty - bestPenalty;
  const recommendedPlan = years <= 2 ? 'basic_299' : years <= 5 ? 'plus_799' : 'enterprise';
  return {
    total_periods: totalPeriods, jurisdictions,
    penalty_best_case: bestPenalty, penalty_worst_case: worstPenalty, penalty_savings_via_davenroe: savings,
    recommended_steps: [
      'File most recent 3 returns first (biggest penalties per day overdue)',
      'Lodge voluntary disclosure for older periods to unlock penalty relief',
      'Apply for hardship remission on penalty interest where business circumstances qualify',
      'Reconstruct missing periods from bank statements using AI-powered matching',
      'Set up continuous deadline monitoring — never fall behind again',
    ],
    davenroe_time_hours: 4, human_time_hours: Math.round(totalPeriods * 2.5),
    recommended_plan: recommendedPlan,
  };
}
