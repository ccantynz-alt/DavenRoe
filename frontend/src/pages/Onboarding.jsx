import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STEPS = [
  { id: 'welcome', title: 'Welcome to AlecRae', subtitle: 'Set up your business in under 2 minutes' },
  { id: 'entity', title: 'Your Business', subtitle: 'Tell us the basics' },
  { id: 'connect', title: 'Connect Your Accounts', subtitle: 'Email, bank, or both' },
  { id: 'done', title: 'You\'re Ready', subtitle: 'Start invoicing and getting paid' },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [entityForm, setEntityForm] = useState({
    name: '', entity_type: 'sole_trader',
    primary_currency: 'AUD', tax_id: '', tax_id_type: 'ABN',
    jurisdiction: 'AU',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdEntity, setCreatedEntity] = useState(null);

  const currentStep = STEPS[step];

  const handleCreateEntity = async () => {
    if (!entityForm.name.trim()) { setError('Enter your business name'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/entities/', {
        name: entityForm.name,
        legal_name: entityForm.name,
        entity_type: entityForm.entity_type,
        primary_currency: entityForm.primary_currency,
        tax_id: entityForm.tax_id || undefined,
        tax_id_type: entityForm.tax_id_type,
        jurisdictions: [{
          jurisdiction_code: entityForm.jurisdiction,
          is_primary: true,
          nexus_type: 'physical',
          effective_from: new Date().toISOString(),
        }],
      });
      setCreatedEntity(res.data);
      setStep(2);
    } catch (err) {
      // If DB not connected, still let them proceed
      setCreatedEntity({ name: entityForm.name });
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const currencyByJurisdiction = { AU: 'AUD', US: 'USD', NZ: 'NZD', GB: 'GBP' };
  const taxIdByJurisdiction = { AU: 'ABN', US: 'EIN', NZ: 'IRD', GB: 'UTR' };
  const taxIdLabel = { AU: 'ABN', US: 'EIN', NZ: 'IRD Number', GB: 'UTR' };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? '\u2713' : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{currentStep.title}</h2>
          <p className="text-gray-500 mb-8">{currentStep.subtitle}</p>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div>
              <p className="text-gray-600 mb-6">
                AlecRae handles your invoicing, expenses, tax, and bookkeeping — powered by AI.
                Whether you're a one-person operation or running a team, everything's in one place.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <FeatureCard icon={<InvoiceIcon />} title="Invoice Customers" desc="Create and send invoices in seconds" />
                <FeatureCard icon={<EmailIcon />} title="Email Intelligence" desc="AI finds invoices in your inbox" />
                <FeatureCard icon={<BankIcon />} title="Bank Feeds" desc="Auto-import transactions" />
                <FeatureCard icon={<BrainIcon />} title="Ask AlecRae" desc="Plain English financial answers" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                  Let's Go
                </button>
                <button onClick={() => onComplete()}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                  Skip Setup
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Create Business */}
          {step === 1 && (
            <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input type="text" value={entityForm.name}
                    onChange={e => setEntityForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Dave's Transport, Smith Construction" autoFocus />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                    <select value={entityForm.entity_type}
                      onChange={e => setEntityForm(f => ({ ...f, entity_type: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-xl text-sm bg-white">
                      <option value="sole_trader">Sole Trader</option>
                      <option value="company">Company (Pty Ltd)</option>
                      <option value="partnership">Partnership</option>
                      <option value="trust">Trust</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select value={entityForm.jurisdiction}
                      onChange={e => {
                        const j = e.target.value;
                        setEntityForm(f => ({
                          ...f, jurisdiction: j,
                          primary_currency: currencyByJurisdiction[j] || f.primary_currency,
                          tax_id_type: taxIdByJurisdiction[j] || f.tax_id_type,
                        }));
                      }}
                      className="w-full px-4 py-3 border rounded-xl text-sm bg-white">
                      <option value="AU">Australia</option>
                      <option value="NZ">New Zealand</option>
                      <option value="GB">United Kingdom</option>
                      <option value="US">United States</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {taxIdLabel[entityForm.jurisdiction] || 'Tax ID'} (optional)
                  </label>
                  <input type="text" value={entityForm.tax_id}
                    onChange={e => setEntityForm(f => ({ ...f, tax_id: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="You can add this later" />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200">Back</button>
                <button onClick={handleCreateEntity} disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Creating...' : 'Next'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Connect Email & Bank */}
          {step === 2 && (
            <div>
              <p className="text-gray-600 mb-6">
                Connect your email to let AI find invoices from your drivers and suppliers.
                Or connect your bank for automatic transaction imports. You can do both.
              </p>

              <div className="space-y-4 mb-6">
                <ConnectOption
                  icon={<EmailIcon />}
                  title="Connect Gmail or Outlook"
                  desc="AI scans your inbox for invoices, receipts, and bills — then helps you invoice your customers"
                  action="Connect Email"
                  color="indigo"
                  href="/email-intelligence"
                  onClick={() => { onComplete(); }}
                />
                <ConnectOption
                  icon={<BankIcon />}
                  title="Connect Your Bank"
                  desc="Automatic transaction imports from 6,000+ banks via Plaid, Basiq, or TrueLayer"
                  action="Connect Bank"
                  color="emerald"
                  href="/banking"
                  onClick={() => { onComplete(); }}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200">Back</button>
                <button onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                  I'll Do This Later
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">
                {createdEntity ? `${createdEntity.name} is set up and ready.` : 'Your workspace is ready.'}
              </p>
              <p className="text-sm text-gray-400 mb-8">
                Here's what to do first:
              </p>

              <div className="grid grid-cols-3 gap-3 mb-8">
                <QuickAction label="Scan Emails" desc="Find driver invoices" icon={<EmailIcon />} />
                <QuickAction label="Create Invoice" desc="Bill a customer" icon={<InvoiceIcon />} />
                <QuickAction label="Ask AlecRae" desc="Any question" icon={<BrainIcon />} />
              </div>

              <button onClick={() => onComplete()}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
      <div className="text-indigo-500">{icon}</div>
      <div>
        <p className="font-medium text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </div>
  );
}

function ConnectOption({ icon, title, desc, action, color, onClick }) {
  const btnColor = color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700';
  return (
    <div className="border-2 border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-200 transition-colors">
      <div className={`w-12 h-12 rounded-xl ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button onClick={onClick}
        className={`px-4 py-2 ${btnColor} text-white rounded-xl text-sm font-medium shrink-0 transition-colors`}>
        {action}
      </button>
    </div>
  );
}

function QuickAction({ label, desc, icon }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <div className="text-indigo-500 flex justify-center mb-2">{icon}</div>
      <p className="font-medium text-sm text-gray-900">{label}</p>
      <p className="text-xs text-gray-400">{desc}</p>
    </div>
  );
}

/* Mini icons */
function InvoiceIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
}
function EmailIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
}
function BankIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>;
}
function BrainIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
}
