import { useState } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const TREATIES = {
  'AU-NZ': { dividends: 15, interest: 10, royalties: 5, services: 0, source: 'AU-NZ DTA 2009' },
  'AU-UK': { dividends: 15, interest: 10, royalties: 5, services: 0, source: 'AU-UK DTA 2003' },
  'AU-US': { dividends: 15, interest: 10, royalties: 5, services: 0, source: 'AU-US DTA 1982' },
  'NZ-UK': { dividends: 15, interest: 10, royalties: 10, services: 0, source: 'NZ-UK DTA 1984' },
  'NZ-US': { dividends: 15, interest: 10, royalties: 5, services: 0, source: 'NZ-US DTA 1982' },
  'UK-US': { dividends: 15, interest: 0, royalties: 0, services: 0, source: 'UK-US DTA 2001' },
};

const DOMESTIC_WHT = { AU: 30, NZ: 30, UK: 20, US: 30 };
const COUNTRIES = [
  { code: 'AU', name: 'Australia' }, { code: 'NZ', name: 'New Zealand' },
  { code: 'UK', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
];
const INCOME_TYPES = ['dividends', 'interest', 'royalties', 'services'];

const TAX_RATES = {
  AU: {
    label: 'Australia', currency: 'AUD', gst: 10, company: 25, small_company: 25,
    brackets: [
      { from: 0, to: 18200, rate: 0 }, { from: 18201, to: 45000, rate: 19 },
      { from: 45001, to: 120000, rate: 32.5 }, { from: 120001, to: 180000, rate: 37 },
      { from: 180001, to: Infinity, rate: 45 },
    ],
    cgt: '50% discount (held >12mo)', super: '11.5%', payroll_tax: 'PAYG withholding',
  },
  NZ: {
    label: 'New Zealand', currency: 'NZD', gst: 15, company: 28, small_company: 28,
    brackets: [
      { from: 0, to: 14000, rate: 10.5 }, { from: 14001, to: 48000, rate: 17.5 },
      { from: 48001, to: 70000, rate: 30 }, { from: 70001, to: 180000, rate: 33 },
      { from: 180001, to: Infinity, rate: 39 },
    ],
    cgt: 'No general CGT', super: 'KiwiSaver 3% employer', payroll_tax: 'PAYE withholding',
  },
  UK: {
    label: 'United Kingdom', currency: 'GBP', gst: 20, company: 25, small_company: 19,
    brackets: [
      { from: 0, to: 12570, rate: 0 }, { from: 12571, to: 50270, rate: 20 },
      { from: 50271, to: 125140, rate: 40 }, { from: 125141, to: Infinity, rate: 45 },
    ],
    cgt: '10-20% (basic/higher)', super: '3% employer auto-enrolment', payroll_tax: 'PAYE + NIC',
  },
  US: {
    label: 'United States', currency: 'USD', gst: 0, company: 21, small_company: 21,
    brackets: [
      { from: 0, to: 11600, rate: 10 }, { from: 11601, to: 47150, rate: 12 },
      { from: 47151, to: 100525, rate: 22 }, { from: 100526, to: 191950, rate: 24 },
      { from: 191951, to: 243725, rate: 32 }, { from: 243726, to: 609350, rate: 35 },
      { from: 609351, to: Infinity, rate: 37 },
    ],
    cgt: '0-20% (income-dependent)', super: 'N/A (401k voluntary)', payroll_tax: 'Federal + FICA',
  },
};

const STRUCTURES = {
  sole_trader: { label: 'Sole Trader / Sole Proprietor', setup_cost: '$0-500', compliance_cost: 'Low', asset_protection: 'None' },
  company: { label: 'Company / Corporation', setup_cost: '$500-2,000', compliance_cost: 'Medium', asset_protection: 'Strong' },
  trust: { label: 'Trust', setup_cost: '$1,000-3,000', compliance_cost: 'High', asset_protection: 'Strong' },
  partnership: { label: 'Partnership / LLP', setup_cost: '$500-1,500', compliance_cost: 'Medium', asset_protection: 'Moderate' },
};

const COMPLIANCE_CHECKLISTS = {
  AU: [
    { filing: 'BAS (Quarterly)', due: 'Oct 28 / Jan 28 / Apr 28 / Jul 28', desc: 'Business Activity Statement — GST, PAYG withholding, PAYG instalments', docs: 'Bank statements, sales records, purchase records, payroll summaries', penalty: '$313 per 28-day period late (up to $1,565)' },
    { filing: 'PAYG Summary', due: 'Aug 14', desc: 'Annual payment summary for employees and contractors', docs: 'Payroll records, contractor payments, tax file declarations', penalty: '$313 per 28 days (up to $1,565)' },
    { filing: 'Income Tax Return', due: 'Oct 31 (self) / May 15 (agent-lodged)', desc: 'Annual company or individual tax return', docs: 'Financial statements, depreciation schedule, trust distributions', penalty: '$313 per 28 days' },
    { filing: 'Superannuation Guarantee', due: 'Jan 28 / Apr 28 / Jul 28 / Oct 28', desc: 'Quarterly employer super contributions (11.5%)', docs: 'Payroll records, employee super fund details', penalty: 'Super guarantee charge + $20/employee/quarter' },
    { filing: 'FBT Return', due: 'May 21', desc: 'Fringe Benefits Tax return for benefits provided to employees', docs: 'Motor vehicle logs, entertainment records, expense reports', penalty: '$313 per 28 days' },
    { filing: 'TPAR', due: 'Aug 28', desc: 'Taxable Payments Annual Report for building/cleaning/courier/IT services', docs: 'Contractor payment records with ABNs', penalty: '$313 per 28 days' },
  ],
  NZ: [
    { filing: 'GST Return', due: 'Jan 28 / Mar 28 / May 28 / Jul 28 / Sep 28 / Nov 28 (2-monthly)', desc: 'Goods and Services Tax return (15%)', docs: 'Sales invoices, purchase invoices, adjustment notes', penalty: '$250 initial + $250/month' },
    { filing: 'Income Tax Return (IR4)', due: 'Jul 7 (or extension via agent)', desc: 'Annual company income tax return', docs: 'Financial statements, shareholder details, dividend records', penalty: '$250 initial + $250/month' },
    { filing: 'PAYE/Employer Monthly Schedule', due: '20th of following month', desc: 'Monthly employer deductions return', docs: 'Payroll records, KiwiSaver contributions, student loan deductions', penalty: '$250/month late' },
    { filing: 'FBT Return', due: 'Quarterly by 20th of following month', desc: 'Fringe Benefit Tax return', docs: 'Motor vehicle records, low interest loans, employer-provided benefits', penalty: '10% late payment penalty' },
  ],
  UK: [
    { filing: 'VAT Return', due: '1 month + 7 days after quarter end', desc: 'Quarterly Value Added Tax return (20%)', docs: 'Sales invoices, purchase invoices, import records', penalty: 'Points-based system, then 2-4% of outstanding VAT' },
    { filing: 'Corporation Tax Return (CT600)', due: '12 months after accounting period end', desc: 'Annual company tax return', docs: 'Full accounts, computations, capital allowances', penalty: '£100 (3 months late) to £1,500+ (12 months)' },
    { filing: 'Corporation Tax Payment', due: '9 months + 1 day after period end', desc: 'Payment of corporation tax liability', docs: 'CT600 computation', penalty: 'Interest from due date + surcharges' },
    { filing: 'RTI FPS', due: 'On or before each payday', desc: 'Real Time Information Full Payment Submission', docs: 'Payroll records, NIC calculations, pension contributions', penalty: '£100-400/month depending on employer size' },
    { filing: 'Annual Accounts', due: '9 months after year end (private)', desc: 'File accounts with Companies House', docs: 'Full statutory accounts, director report', penalty: '£150 to £1,500 (escalating)' },
  ],
  US: [
    { filing: 'Form 941 (Quarterly)', due: 'Apr 30 / Jul 31 / Oct 31 / Jan 31', desc: 'Employer\'s quarterly federal tax return', docs: 'Payroll records, federal tax deposits, W-4 forms', penalty: '5% of unpaid tax per month (up to 25%)' },
    { filing: 'Form 1120 (Annual)', due: 'Apr 15 (or 6-month extension)', desc: 'U.S. Corporation Income Tax Return', docs: 'Financial statements, depreciation schedules, state apportionment', penalty: '5% per month of unpaid tax (up to 25%)' },
    { filing: 'Sales Tax (varies by state)', due: 'Monthly or quarterly depending on state', desc: 'State sales tax collection and remittance', docs: 'Sales records by state, exempt sales certificates', penalty: 'Varies by state (typically 5-25%)' },
    { filing: 'Form 1099-NEC', due: 'Jan 31', desc: 'Non-employee compensation reporting ($600+)', docs: 'Contractor payment records, W-9 forms', penalty: '$60-310 per form depending on lateness' },
    { filing: 'State Tax Returns', due: 'Varies by state', desc: 'State income tax returns (most states)', docs: 'Federal return, state-specific adjustments, apportionment', penalty: 'Varies by state' },
  ],
};

const TABS = ['DTA Calculator', 'WHT Optimizer', 'Compliance Checklists', 'Entity Structure Advisor', 'Tax Rate Reference'];
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

export default function TaxAdvisorToolkit() {
  const [tab, setTab] = useState(0);
  const toast = useToast();

  // DTA state
  const [dtaSource, setDtaSource] = useState('AU');
  const [dtaDest, setDtaDest] = useState('UK');
  const [dtaType, setDtaType] = useState('dividends');
  const [dtaAmount, setDtaAmount] = useState(100000);

  // WHT state
  const [whtPayer, setWhtPayer] = useState('AU');
  const [whtRecipient, setWhtRecipient] = useState('US');
  const [whtType, setWhtType] = useState('dividends');
  const [whtAmount, setWhtAmount] = useState(50000);
  const [whtPE, setWhtPE] = useState(false);

  // Compliance state
  const [compJurisdiction, setCompJurisdiction] = useState('AU');
  const [checkedItems, setCheckedItems] = useState({});

  // Entity structure state
  const [structJurisdiction, setStructJurisdiction] = useState('AU');
  const [structRevenue, setStructRevenue] = useState(250000);
  const [structOwners, setStructOwners] = useState(1);

  // Tax rates state
  const [rateJurisdiction, setRateJurisdiction] = useState('AU');

  const getTreetyKey = (a, b) => {
    const sorted = [a, b].sort();
    return `${sorted[0]}-${sorted[1]}`;
  };

  const treaty = TREATIES[getTreetyKey(dtaSource, dtaDest)];
  const domesticRate = DOMESTIC_WHT[dtaSource];
  const treatyRate = treaty ? treaty[dtaType] : null;
  const withoutTreaty = dtaAmount * (domesticRate / 100);
  const withTreaty = treatyRate !== null ? dtaAmount * (treatyRate / 100) : null;
  const saving = withTreaty !== null ? withoutTreaty - withTreaty : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Advisory Toolkit</h1>
        <p className="text-sm text-gray-500 mt-0.5">DTA calculations, compliance checklists, and entity structure advice</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${tab === i ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* DTA Calculator */}
      {tab === 0 && (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Double Taxation Agreement Calculator</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Source Country</label>
              <select value={dtaSource} onChange={e => setDtaSource(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Destination Country</label>
              <select value={dtaDest} onChange={e => setDtaDest(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                {COUNTRIES.filter(c => c.code !== dtaSource).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Income Type</label>
              <select value={dtaType} onChange={e => setDtaType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                {INCOME_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Gross Amount</label>
              <input type="number" value={dtaAmount} onChange={e => setDtaAmount(parseFloat(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {dtaSource === dtaDest ? (
            <p className="text-sm text-gray-500">Source and destination must be different countries.</p>
          ) : treaty ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs text-red-600 font-medium mb-1">Without Treaty</p>
                <p className="text-2xl font-bold text-red-700">{fmt(withoutTreaty)}</p>
                <p className="text-xs text-red-500 mt-1">Domestic WHT rate: {domesticRate}%</p>
                <p className="text-xs text-red-500">Net to recipient: {fmt(dtaAmount - withoutTreaty)}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs text-green-600 font-medium mb-1">With Treaty</p>
                <p className="text-2xl font-bold text-green-700">{fmt(withTreaty)}</p>
                <p className="text-xs text-green-500 mt-1">Treaty rate: {treatyRate}% ({treaty.source})</p>
                <p className="text-xs text-green-500">Net to recipient: {fmt(dtaAmount - withTreaty)}</p>
              </div>
              <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 font-medium">Treaty Saving</p>
                <p className="text-3xl font-bold text-blue-700">{fmt(saving)}</p>
                <p className="text-xs text-blue-500">({((saving / dtaAmount) * 100).toFixed(1)}% of gross amount)</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No treaty found between {dtaSource} and {dtaDest}.</p>
          )}
        </div>
      )}

      {/* WHT Optimizer */}
      {tab === 1 && (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Withholding Tax Optimizer</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payer Jurisdiction</label>
              <select value={whtPayer} onChange={e => setWhtPayer(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Recipient Jurisdiction</label>
              <select value={whtRecipient} onChange={e => setWhtRecipient(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                {COUNTRIES.filter(c => c.code !== whtPayer).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment Type</label>
              <select value={whtType} onChange={e => setWhtType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                {INCOME_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
              <input type="number" value={whtAmount} onChange={e => setWhtAmount(parseFloat(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <input type="checkbox" checked={whtPE} onChange={e => setWhtPE(e.target.checked)} className="rounded" />
            Recipient has a permanent establishment (PE) in source country
          </label>

          {(() => {
            const key = getTreetyKey(whtPayer, whtRecipient);
            const t = TREATIES[key];
            const standard = DOMESTIC_WHT[whtPayer];
            const treatyR = t ? t[whtType] : standard;
            const peRate = whtPE ? Math.min(standard, treatyR) : treatyR;
            const taxStd = whtAmount * standard / 100;
            const taxTreaty = whtAmount * peRate / 100;

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white border rounded-xl p-4">
                    <p className="text-xs text-gray-500">Standard WHT</p>
                    <p className="text-xl font-bold text-red-600">{standard}%</p>
                    <p className="text-xs text-gray-400">{fmt(taxStd)} withheld</p>
                  </div>
                  <div className="bg-white border rounded-xl p-4">
                    <p className="text-xs text-gray-500">Treaty Rate</p>
                    <p className="text-xl font-bold text-green-600">{peRate}%</p>
                    <p className="text-xs text-gray-400">{fmt(taxTreaty)} withheld</p>
                  </div>
                  <div className="bg-white border rounded-xl p-4">
                    <p className="text-xs text-gray-500">Saving</p>
                    <p className="text-xl font-bold text-blue-600">{fmt(taxStd - taxTreaty)}</p>
                    <p className="text-xs text-gray-400">{((1 - peRate / standard) * 100).toFixed(0)}% reduction</p>
                  </div>
                </div>
                {whtPE && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-700">
                      PE in source country: The recipient may be subject to full domestic tax rates on income attributable to the PE, rather than the reduced treaty WHT rate. Consult a cross-border specialist.
                    </p>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">Recommendation</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {treatyR < standard
                      ? `Apply for treaty relief using ${t?.source}. The recipient should provide a Certificate of Residence from their home jurisdiction to claim the reduced ${treatyR}% rate.`
                      : 'No treaty benefit available for this payment type. Consider restructuring the payment as a different income category if commercially appropriate.'}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Compliance Checklists */}
      {tab === 2 && (
        <div className="bg-white border rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Compliance Checklist</h3>
            <div className="flex gap-2">
              {COUNTRIES.map(c => (
                <button key={c.code} onClick={() => { setCompJurisdiction(c.code); setCheckedItems({}); }}
                  className={`px-3 py-1 text-xs rounded-lg font-medium ${compJurisdiction === c.code ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.code}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {COMPLIANCE_CHECKLISTS[compJurisdiction].map((item, i) => {
              const key = `${compJurisdiction}-${i}`;
              return (
                <div key={i} className={`border rounded-lg p-4 ${checkedItems[key] ? 'bg-green-50 border-green-200' : ''}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${checkedItems[key] ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                      {checkedItems[key] && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-medium ${checkedItems[key] ? 'text-green-700 line-through' : 'text-gray-900'}`}>{item.filing}</h4>
                        <span className="text-xs text-blue-600 font-medium shrink-0 ml-2">Due: {item.due}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-gray-400">Required:</span> <span className="text-gray-600">{item.docs}</span></div>
                        <div><span className="text-gray-400">Late penalty:</span> <span className="text-red-500">{item.penalty}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => toast.success('Compliance checklist exported to PDF')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Export as PDF
            </button>
          </div>
        </div>
      )}

      {/* Entity Structure Advisor */}
      {tab === 3 && (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Entity Structure Advisor</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Jurisdiction</label>
              <select value={structJurisdiction} onChange={e => setStructJurisdiction(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Expected Annual Revenue</label>
              <input type="number" value={structRevenue} onChange={e => setStructRevenue(parseFloat(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Number of Owners</label>
              <input type="number" value={structOwners} onChange={e => setStructOwners(parseInt(e.target.value) || 1)}
                className="w-full border rounded-lg px-3 py-2 text-sm" min="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(STRUCTURES).map(([key, s]) => {
              const rates = TAX_RATES[structJurisdiction];
              const taxRate = key === 'sole_trader' ? rates.brackets[rates.brackets.length - 1].rate : rates.company;
              const recommended = (structRevenue > 100000 && structOwners === 1 && key === 'company') ||
                (structOwners > 1 && key === 'partnership') ||
                (structRevenue <= 100000 && structOwners === 1 && key === 'sole_trader');

              return (
                <div key={key} className={`border-2 rounded-xl p-4 ${recommended ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                  {recommended && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">Recommended</span>}
                  <h4 className="text-sm font-semibold text-gray-900 mt-2">{s.label}</h4>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Tax Rate</span><span className="font-medium">{key === 'sole_trader' ? 'Marginal' : `${taxRate}%`}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Setup Cost</span><span>{s.setup_cost}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Compliance</span><span>{s.compliance_cost}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Asset Protection</span><span>{s.asset_protection}</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800">AI Recommendation</p>
            <p className="text-sm text-blue-700 mt-1">
              {structRevenue > 100000 && structOwners === 1
                ? `At ${fmt(structRevenue)} annual revenue with a single owner, a Company structure is recommended. The flat ${TAX_RATES[structJurisdiction].company}% company tax rate is lower than the top marginal rate of ${TAX_RATES[structJurisdiction].brackets[TAX_RATES[structJurisdiction].brackets.length - 1].rate}%, and provides liability protection for personal assets.`
                : structOwners > 1
                ? `With ${structOwners} owners, a Partnership or Company structure provides clearer profit sharing and liability separation. At ${fmt(structRevenue)} revenue, consider the compliance costs of each.`
                : `At ${fmt(structRevenue)} annual revenue as a sole owner, a Sole Trader structure keeps things simple with minimal compliance costs. Consider incorporating when revenue exceeds $100,000 for tax optimisation.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Tax Rate Reference */}
      {tab === 4 && (
        <div className="bg-white border rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Tax Rate Quick Reference</h3>
            <div className="flex gap-2">
              {COUNTRIES.map(c => (
                <button key={c.code} onClick={() => setRateJurisdiction(c.code)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium ${rateJurisdiction === c.code ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.code}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const r = TAX_RATES[rateJurisdiction];
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">GST/VAT Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{r.gst}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Company Tax</p>
                    <p className="text-2xl font-bold text-gray-900">{r.company}%</p>
                    {r.small_company !== r.company && <p className="text-xs text-gray-400">Small: {r.small_company}%</p>}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">CGT</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{r.cgt}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Super/Pension</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{r.super}</p>
                  </div>
                </div>

                <h4 className="font-medium text-gray-800 mt-4">Individual Income Tax Brackets — {r.label}</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2 font-medium">From</th>
                      <th className="pb-2 font-medium">To</th>
                      <th className="pb-2 font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.brackets.map((b, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{fmt(b.from)}</td>
                        <td className="py-2">{b.to === Infinity ? 'and above' : fmt(b.to)}</td>
                        <td className="py-2 font-medium">{b.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}
      <ProprietaryNotice />
    </div>
  );
}
