import { useState } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const JURISDICTIONS = [
  { code: 'AU', name: 'Australia', structures: ['Pty Ltd', 'Sole Trader', 'Partnership', 'Trust', 'Public Company'], tax: '25-30%', liability: 'Limited (Pty Ltd)', regulator: 'ASIC', setup: '$500-2,000', time: '1-3 days' },
  { code: 'NZ', name: 'New Zealand', structures: ['Limited Company', 'Sole Trader', 'Partnership', 'LP', 'LTC'], tax: '28%', liability: 'Limited (Ltd)', regulator: 'Companies Office', setup: 'NZ$150-500', time: '1 day' },
  { code: 'UK', name: 'United Kingdom', structures: ['Ltd', 'LLP', 'Sole Trader', 'PLC', 'CIC'], tax: '19-25%', liability: 'Limited (Ltd/LLP)', regulator: 'Companies House', setup: '£12-100', time: 'Same day' },
  { code: 'US', name: 'United States', structures: ['LLC', 'C-Corp', 'S-Corp', 'Sole Prop', 'LP'], tax: '21% (C-Corp) / Pass-through', liability: 'Limited (LLC/Corp)', regulator: 'State SOS', setup: '$50-500', time: '1-7 days' },
  { code: 'SG', name: 'Singapore', structures: ['Pte Ltd', 'LLP', 'Sole Prop', 'Branch'], tax: '17%', liability: 'Limited (Pte Ltd)', regulator: 'ACRA', setup: 'S$300-1,000', time: '1-2 days' },
  { code: 'HK', name: 'Hong Kong', structures: ['Limited Company', 'Sole Prop', 'Partnership', 'Branch'], tax: '8.25-16.5%', liability: 'Limited', regulator: 'CR', setup: 'HK$2,000-5,000', time: '1-4 days' },
  { code: 'IE', name: 'Ireland', structures: ['DAC', 'Ltd', 'Sole Trader', 'Partnership'], tax: '12.5%', liability: 'Limited (Ltd/DAC)', regulator: 'CRO', setup: '€50-500', time: '5-10 days' },
  { code: 'AE', name: 'UAE (Dubai)', structures: ['Free Zone LLC', 'Mainland LLC', 'Branch', 'Sole Establishment'], tax: '9% (above AED 375K)', liability: 'Limited', regulator: 'DED / Free Zone', setup: 'AED 10,000-50,000', time: '2-7 days' },
];

const PROTECTION_STRATEGIES = [
  {
    name: 'Asset Protection Shield',
    description: 'Separate operating entities from asset-holding entities. If the operating company gets sued, the assets are in a different legal entity that the lawsuit can\'t reach.',
    structure: 'Operating Co (takes all risk) → Management fees → Holding Co (owns all assets)',
    risk_reduction: '85%',
  },
  {
    name: 'Multi-Jurisdiction Firewall',
    description: 'Incorporate in jurisdictions with strong creditor protection laws. US LLC in Wyoming/Nevada + NZ holding company creates multiple legal barriers for any single lawsuit.',
    structure: 'NZ Holding → US LLC (Wyoming) → Operating entities per market',
    risk_reduction: '90%',
  },
  {
    name: 'IP Licensing Structure',
    description: 'Hold intellectual property in a low-tax jurisdiction and license it to operating entities. Reduces taxable income in high-tax jurisdictions and protects IP from lawsuits against operating companies.',
    structure: 'IP Co (Ireland/Singapore) → License fees → Operating companies worldwide',
    risk_reduction: '75%',
  },
  {
    name: 'Trust + Company Combo',
    description: 'A discretionary trust owns the company shares. Personal assets are completely separated from business risk. The trust can distribute income tax-efficiently to beneficiaries.',
    structure: 'Discretionary Trust → owns 100% of → Pty Ltd / Ltd / LLC',
    risk_reduction: '80%',
  },
];

const DEMO_PLANS = [
  {
    scenario: 'E-commerce selling AU + US + UK',
    recommendation: {
      holding: { jurisdiction: 'NZ', structure: 'Limited Company', purpose: 'Hold IP, receive royalties, low compliance cost' },
      entities: [
        { jurisdiction: 'AU', structure: 'Pty Ltd', purpose: 'AU operations, GST registered, employs AU staff' },
        { jurisdiction: 'US', structure: 'LLC (Wyoming)', purpose: 'US sales, no state income tax in Wyoming, pass-through taxation' },
        { jurisdiction: 'UK', structure: 'Ltd', purpose: 'UK/EU sales, VAT registered, employs UK staff' },
      ],
      protection: 'Multi-Jurisdiction Firewall + IP Licensing',
      tax_saving: '$18,000-35,000/year vs single-entity structure',
      setup_cost: '$3,000-5,000 total',
      ongoing_cost: '$2,000-4,000/year compliance',
    },
  },
];

export default function OracleBrain() {
  const [step, setStep] = useState(0); // 0: select countries, 1: business details, 2: AI analysis, 3: plan
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [businessType, setBusinessType] = useState('');
  const [revenue, setRevenue] = useState('');
  const [employees, setEmployees] = useState('');
  const [industry, setIndustry] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [plan, setPlan] = useState(null);
  const [showProtection, setShowProtection] = useState(null);
  const toast = useToast();

  const toggleCountry = (code) => {
    setSelectedCountries(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const runAnalysis = async () => {
    if (selectedCountries.length === 0) { toast.error('Select at least one country'); return; }
    setAnalysing(true);
    setStep(2);
    await new Promise(r => setTimeout(r, 3000));
    setPlan(DEMO_PLANS[0]);
    setAnalysing(false);
    setStep(3);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Oracle Brain — Incorporation & Protection</h1>
        <p className="text-sm text-gray-500 mt-0.5">AI plans your multi-jurisdiction corporate structure for maximum protection and tax efficiency</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        This tool provides general guidance on corporate structures and is not legal, tax, or financial advice. Always engage qualified legal and tax professionals in each jurisdiction before incorporating. AlecRae does not register companies on your behalf.
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {['Select Countries', 'Business Details', 'AI Analysis', 'Your Plan'].map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-indigo-500' : 'bg-gray-200'}`} />
            <p className={`text-[10px] mt-1 ${i <= step ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Step 0: Select Countries */}
      {step === 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Where will this business operate?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {JURISDICTIONS.map(j => {
              const selected = selectedCountries.includes(j.code);
              return (
                <button key={j.code} onClick={() => toggleCountry(j.code)}
                  className={`p-4 border-2 rounded-xl text-left transition ${selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="text-sm font-semibold text-gray-900">{j.name}</p>
                  <p className="text-[10px] text-gray-500 mt-1">Tax: {j.tax} · Setup: {j.setup}</p>
                  <p className="text-[10px] text-gray-400">{j.time} · {j.regulator}</p>
                  {selected && <p className="text-[10px] text-indigo-600 font-medium mt-1">Selected</p>}
                </button>
              );
            })}
          </div>
          <button onClick={() => selectedCountries.length > 0 ? setStep(1) : toast.error('Select at least one country')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Continue
          </button>
        </div>
      )}

      {/* Step 1: Business Details */}
      {step === 1 && (
        <div className="bg-white border rounded-xl p-6 max-w-lg space-y-4">
          <h3 className="font-semibold text-gray-900">Tell us about the business</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
            <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Select...</option>
              <option>E-commerce / Online Retail</option>
              <option>SaaS / Technology</option>
              <option>Professional Services / Consulting</option>
              <option>Manufacturing / Import-Export</option>
              <option>Real Estate / Property</option>
              <option>Healthcare / Medical</option>
              <option>Construction / Trades</option>
              <option>Creative / Media / Agency</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Annual Revenue</label>
            <select value={revenue} onChange={e => setRevenue(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Select...</option>
              <option>Under $100K</option>
              <option>$100K - $500K</option>
              <option>$500K - $1M</option>
              <option>$1M - $5M</option>
              <option>$5M - $20M</option>
              <option>$20M+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Employees</label>
            <select value={employees} onChange={e => setEmployees(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Select...</option>
              <option>Just me</option>
              <option>2-5</option>
              <option>6-20</option>
              <option>21-50</option>
              <option>50+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Online accounting software"
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Back</button>
            <button onClick={runAnalysis} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Run Oracle Analysis
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Analysing */}
      {step === 2 && analysing && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Oracle Brain is analysing...</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Researching tax treaties, liability structures, compliance requirements, and asset protection strategies
            across {selectedCountries.length} jurisdictions...
          </p>
          <div className="mt-6 space-y-2 text-xs text-gray-400 max-w-sm mx-auto">
            <p className="animate-pulse">Checking bilateral tax treaties...</p>
            <p className="animate-pulse" style={{ animationDelay: '0.5s' }}>Evaluating corporate structures...</p>
            <p className="animate-pulse" style={{ animationDelay: '1s' }}>Calculating tax optimisation...</p>
            <p className="animate-pulse" style={{ animationDelay: '1.5s' }}>Designing asset protection...</p>
          </div>
        </div>
      )}

      {/* Step 3: The Plan */}
      {step === 3 && plan && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Your Oracle Incorporation Plan</h3>
            <p className="text-indigo-200 text-sm">Multi-jurisdiction structure optimised for protection and tax efficiency</p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-2xl font-bold">{plan.recommendation.entities.length + 1}</p>
                <p className="text-xs text-indigo-200">Entities</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{plan.recommendation.tax_saving}</p>
                <p className="text-xs text-indigo-200">Estimated Annual Tax Saving</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{plan.recommendation.setup_cost}</p>
                <p className="text-xs text-indigo-200">Total Setup Cost</p>
              </div>
            </div>
          </div>

          {/* Holding Company */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-semibold">HOLDING</span>
              <span className="text-xs text-purple-600">{plan.recommendation.holding.jurisdiction}</span>
            </div>
            <h4 className="font-semibold text-gray-900">{plan.recommendation.holding.structure}</h4>
            <p className="text-sm text-gray-600 mt-1">{plan.recommendation.holding.purpose}</p>
          </div>

          <div className="flex justify-center"><span className="text-gray-300 text-2xl">↓</span></div>

          {/* Operating Entities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {plan.recommendation.entities.map((entity, i) => (
              <div key={i} className="bg-white border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">OPERATING</span>
                  <span className="text-xs text-gray-500">{entity.jurisdiction}</span>
                </div>
                <h4 className="font-semibold text-gray-900">{entity.structure}</h4>
                <p className="text-sm text-gray-600 mt-1">{entity.purpose}</p>
              </div>
            ))}
          </div>

          {/* Protection Strategy */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h4 className="font-semibold text-green-900 mb-2">Asset Protection Strategy</h4>
            <p className="text-sm text-green-800">{plan.recommendation.protection}</p>
            <p className="text-xs text-green-600 mt-2">Ongoing compliance: {plan.recommendation.ongoing_cost}</p>
          </div>

          {/* Protection Strategies Detail */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Available Protection Strategies</h3>
            <div className="grid grid-cols-2 gap-3">
              {PROTECTION_STRATEGIES.map((strategy, i) => (
                <button key={i} onClick={() => setShowProtection(showProtection === i ? null : i)}
                  className="border rounded-xl p-4 text-left hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">{strategy.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{strategy.risk_reduction} risk reduction</span>
                  </div>
                  <p className="text-xs text-gray-500">{strategy.description}</p>
                  {showProtection === i && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-[10px] font-semibold text-gray-400 mb-1">STRUCTURE</p>
                      <p className="text-xs text-indigo-700 font-mono">{strategy.structure}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => toast.success('Plan saved to your documents')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Save Plan
            </button>
            <button onClick={() => toast.info('PDF export generated')}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
              Export as PDF
            </button>
            <button onClick={() => toast.info('Sent to your accountant for review')}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
              Send to Accountant
            </button>
            <button onClick={() => { setStep(0); setPlan(null); setSelectedCountries([]); }}
              className="px-6 py-2.5 text-gray-500 text-sm hover:text-gray-700">
              Start Over
            </button>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            This plan is generated by AI and represents general guidance only. Corporate structures, tax obligations, and asset protection strategies vary significantly based on individual circumstances. You must engage qualified legal counsel and tax advisors in each jurisdiction before implementing any structure. AlecRae does not provide legal or tax advice and accepts no liability for structural decisions.
          </div>
        </div>
      )}

      <ProprietaryNotice />
    </div>
  );
}
