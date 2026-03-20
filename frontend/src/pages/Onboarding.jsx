import { useState } from 'react';
import api from '../services/api';

const STEPS = [
  { id: 'welcome', title: 'Welcome to Astra', subtitle: 'Let\'s set up your accounting in under 2 minutes' },
  { id: 'entity', title: 'Create Your Business', subtitle: 'Tell us about your company' },
  { id: 'bank', title: 'Connect Your Bank', subtitle: 'Automatic transaction import' },
  { id: 'done', title: 'You\'re All Set', subtitle: 'Start working with Astra' },
];

const SAMPLE_ENTITIES = [
  { name: 'Coastal Coffee Co', type: 'company', currency: 'AUD', jurisdiction: 'AU', tax_id_type: 'ABN', description: 'Cafe chain with 3 locations' },
  { name: 'NorthStar Consulting LLC', type: 'company', currency: 'USD', jurisdiction: 'US', tax_id_type: 'EIN', description: 'Management consulting firm' },
  { name: 'Kiwi Design Studio', type: 'sole_trader', currency: 'NZD', jurisdiction: 'NZ', tax_id_type: 'IRD', description: 'Freelance graphic designer' },
  { name: 'Thames Legal Partners', type: 'partnership', currency: 'GBP', jurisdiction: 'GB', tax_id_type: 'UTR', description: 'UK law firm' },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [entityForm, setEntityForm] = useState({
    name: '', legal_name: '', entity_type: 'company',
    primary_currency: 'AUD', tax_id: '', tax_id_type: 'ABN',
    jurisdiction: 'AU',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdEntity, setCreatedEntity] = useState(null);

  const currentStep = STEPS[step];

  const handleCreateEntity = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/entities/', {
        name: entityForm.name,
        legal_name: entityForm.legal_name || entityForm.name,
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
      setError(err.response?.data?.detail || 'Failed to create entity. Database may not be connected yet — you can skip this step.');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleData = async (sample) => {
    setEntityForm({
      name: sample.name,
      legal_name: sample.name,
      entity_type: sample.type,
      primary_currency: sample.currency,
      tax_id: '',
      tax_id_type: sample.tax_id_type,
      jurisdiction: sample.jurisdiction,
    });
  };

  const currencyByJurisdiction = { AU: 'AUD', US: 'USD', NZ: 'NZD', GB: 'GBP' };
  const taxIdByJurisdiction = { AU: 'ABN', US: 'EIN', NZ: 'IRD', GB: 'UTR' };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i < step ? 'bg-green-500 text-white'
                : i === step ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-1">{currentStep.title}</h2>
          <p className="text-gray-500 mb-8">{currentStep.subtitle}</p>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <FeatureCard icon="$" title="Tax Engine" desc="US, AU, NZ, GB + 6 treaties" />
                <FeatureCard icon=">" title="AI Ledger" desc="Auto-categorize & review" />
                <FeatureCard icon="?" title="Ask Astra" desc="Natural language queries" />
                <FeatureCard icon="!" title="Forensic Tools" desc="Anomaly detection & audit" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                  Set Up My Business
                </button>
                <button onClick={() => onComplete()}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  Explore First
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Create Entity */}
          {step === 1 && (
            <div>
              {/* Sample data quick-start */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick start with sample data:</p>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_ENTITIES.map(s => (
                    <button key={s.name} onClick={() => handleSampleData(s)}
                      className={`text-left p-3 border rounded-lg text-sm hover:border-indigo-400 transition-colors ${
                        entityForm.name === s.name ? 'border-indigo-500 bg-indigo-50' : ''
                      }`}>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input type="text" value={entityForm.name}
                      onChange={e => setEntityForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg" placeholder="My Business Pty Ltd" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                    <select value={entityForm.entity_type}
                      onChange={e => setEntityForm(f => ({ ...f, entity_type: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg">
                      <option value="company">Company</option>
                      <option value="sole_trader">Sole Trader</option>
                      <option value="partnership">Partnership</option>
                      <option value="trust">Trust</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                    <select value={entityForm.jurisdiction}
                      onChange={e => {
                        const j = e.target.value;
                        setEntityForm(f => ({
                          ...f,
                          jurisdiction: j,
                          primary_currency: currencyByJurisdiction[j] || f.primary_currency,
                          tax_id_type: taxIdByJurisdiction[j] || f.tax_id_type,
                        }));
                      }}
                      className="w-full px-3 py-2 border rounded-lg">
                      <option value="AU">Australia</option>
                      <option value="US">United States</option>
                      <option value="NZ">New Zealand</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select value={entityForm.primary_currency}
                      onChange={e => setEntityForm(f => ({ ...f, primary_currency: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg">
                      {['AUD', 'USD', 'NZD', 'GBP', 'EUR', 'CAD'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{entityForm.tax_id_type || 'Tax ID'}</label>
                    <input type="text" value={entityForm.tax_id}
                      onChange={e => setEntityForm(f => ({ ...f, tax_id: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg" placeholder="Optional" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200">Back</button>
                <button onClick={handleCreateEntity} disabled={loading || !entityForm.name}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create & Continue'}
                </button>
                <button onClick={() => setStep(2)}
                  className="px-6 py-3 text-gray-400 hover:text-gray-600 text-sm">Skip</button>
              </div>
            </div>
          )}

          {/* Step 2: Connect Bank */}
          {step === 2 && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <BankProviderCard name="Plaid" countries="US, CA" institutions="1,000+" />
                <BankProviderCard name="Basiq" countries="AU, NZ" institutions="170+" />
                <BankProviderCard name="TrueLayer" countries="UK, EU" institutions="5,000+" />
              </div>

              <div className="bg-gray-50 border rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  Your bank credentials never touch our servers. Authentication happens
                  directly between you and your bank via secure OAuth flows.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                  Connect Later (Dashboard)
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">
                You can connect bank accounts anytime from the Bank Feeds page.
              </p>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center">
              <div className="text-6xl mb-4">&#10003;</div>
              <p className="text-gray-600 mb-2">
                {createdEntity
                  ? `"${createdEntity.name}" is ready to go.`
                  : 'Your workspace is ready.'}
              </p>
              <p className="text-sm text-gray-400 mb-8">
                Start by importing transactions, creating invoices, or asking Astra anything.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-8">
                <QuickAction label="Import CSV" desc="Upload existing data" />
                <QuickAction label="Create Invoice" desc="Send your first invoice" />
                <QuickAction label="Ask Astra" desc="Ask anything in plain English" />
              </div>

              <button onClick={() => onComplete()}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
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
    <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
      <span className="text-2xl font-mono text-indigo-500 w-8 text-center">{icon}</span>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </div>
  );
}

function BankProviderCard({ name, countries, institutions }) {
  return (
    <div className="bg-white border rounded-lg p-4 text-center">
      <p className="font-semibold mb-1">{name}</p>
      <p className="text-xs text-gray-500">{countries}</p>
      <p className="text-xs text-gray-400">{institutions} banks</p>
    </div>
  );
}

function QuickAction({ label, desc }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="font-medium text-sm">{label}</p>
      <p className="text-xs text-gray-400">{desc}</p>
    </div>
  );
}
