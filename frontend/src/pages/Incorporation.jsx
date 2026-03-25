import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import LegalDisclaimer from '../components/LegalDisclaimer';

const STEPS = ['Jurisdiction', 'Structure', 'Company Details', 'Directors & Shareholders', 'Review & Submit'];

const JURISDICTION_INFO = {
  AU: { name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', currency: 'AUD', authority: 'ASIC' },
  NZ: { name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}', currency: 'NZD', authority: 'Companies Office' },
  GB: { name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', currency: 'GBP', authority: 'Companies House' },
  US: { name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', currency: 'USD', authority: 'Secretary of State' },
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY',
];

const US_POPULAR_STATES = [
  { code: 'DE', reason: 'Most business-friendly laws, preferred by investors' },
  { code: 'WY', reason: 'No state income tax, strong privacy protections' },
  { code: 'NV', reason: 'No state income tax, no franchise tax' },
];

const AU_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

export default function Incorporation() {
  const [step, setStep] = useState(0);
  const [jurisdictions, setJurisdictions] = useState(null);
  const [form, setForm] = useState({
    jurisdiction: '', structure_code: '', company_name: '', trading_name: '',
    principal_activity: '', state_of_formation: '', registered_agent: '',
    financial_year_end: '06-30',
    registered_address: { street: '', suburb: '', city: '', state: '', postcode: '', zip: '' },
    directors: [{ full_name: '', email: '', is_resident: true }],
    shareholders: [{ full_name: '', shares: 100, share_class: 'Ordinary' }],
    share_capital: { total_shares: 100, share_price: 1.00, currency: 'AUD' },
  });
  const [costs, setCosts] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [applications, setApplications] = useState([]);
  const toast = useToast();

  useEffect(() => {
    api.get('/incorporation/jurisdictions').then(r => setJurisdictions(r.data.jurisdictions)).catch(() => null);
    api.get('/incorporation/applications').then(r => setApplications(r.data.applications || [])).catch(() => null);
  }, []);

  const currentJur = form.jurisdiction ? JURISDICTION_INFO[form.jurisdiction] : null;
  const structures = jurisdictions?.[form.jurisdiction]?.structures || [];
  const selectedStructure = structures.find(s => s.code === form.structure_code);

  const updateForm = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const updateAddress = (key, value) => setForm(f => ({ ...f, registered_address: { ...f.registered_address, [key]: value } }));

  const fetchCosts = async () => {
    if (!form.jurisdiction || !form.structure_code) return;
    try {
      const state = form.jurisdiction === 'US' ? form.state_of_formation : undefined;
      const url = `/incorporation/costs/${form.jurisdiction}/${form.structure_code}${state ? `?state=${state}` : ''}`;
      const res = await api.get(url);
      setCosts(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCosts(); }, [form.jurisdiction, form.structure_code, form.state_of_formation]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/incorporation/applications', form);
      setSubmitted(res.data);
      toast.success('Incorporation application created');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object') {
        toast.error(Object.values(detail).join('. '));
      } else {
        toast.error(detail || 'Failed to create application');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <SubmittedView application={submitted} onBack={() => { setSubmitted(null); setStep(0); setForm(f => ({ ...f, company_name: '' })); }} />;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Incorporate a Company</h2>
        <p className="text-gray-500 mt-1">Set up a new business entity across Australia, New Zealand, UK, or US</p>
        <LegalDisclaimer type="incorporation" className="mt-3" />
      </div>

      {/* Existing applications */}
      {applications.length > 0 && step === 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Recent Applications</h3>
          <div className="space-y-2">
            {applications.slice(0, 3).map(app => (
              <div key={app.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{app.company_name}</p>
                  <p className="text-sm text-gray-500">{app.structure_name} &middot; {app.jurisdiction}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  app.status === 'completed' ? 'bg-green-100 text-green-700' :
                  app.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{app.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                i === step ? 'bg-indigo-600 text-white' :
                i < step ? 'bg-indigo-100 text-indigo-700 cursor-pointer hover:bg-indigo-200' :
                'bg-gray-100 text-gray-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {i < step ? '\u2713' : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 0: Jurisdiction */}
      {step === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(JURISDICTION_INFO).map(([code, info]) => (
            <button
              key={code}
              onClick={() => { updateForm('jurisdiction', code); setStep(1); }}
              className={`bg-white border-2 rounded-xl p-6 text-center hover:shadow-lg transition-all ${
                form.jurisdiction === code ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <span className="text-4xl mb-3 block">{info.flag}</span>
              <h3 className="text-lg font-bold text-gray-900">{info.name}</h3>
              <p className="text-xs text-gray-400 mt-1">via {info.authority}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 1: Structure */}
      {step === 1 && (
        <div>
          <h3 className="font-semibold text-lg mb-4">Choose a Company Structure in {currentJur?.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {structures.map(s => (
              <button
                key={s.code}
                onClick={() => { updateForm('structure_code', s.code); setStep(2); }}
                className={`bg-white border-2 rounded-xl p-6 text-left hover:shadow-md transition-all ${
                  form.structure_code === s.code ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <h4 className="font-bold text-gray-900 mb-1">{s.name}</h4>
                <p className="text-sm text-gray-500 mb-3 leading-relaxed">{s.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {s.min_directors > 0 && <span>{s.min_directors}+ director{s.min_directors > 1 ? 's' : ''}</span>}
                  {s.requires_resident_director && <span className="text-amber-500">Resident director required</span>}
                  <span className="ml-auto font-medium text-gray-600">
                    {s.filing_fee > 0 ? `${currentJur.currency} $${s.filing_fee}` : 'Free'}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(0)} className="text-sm text-gray-500 hover:text-gray-700">
            &larr; Change jurisdiction
          </button>
        </div>
      )}

      {/* Step 2: Company Details */}
      {step === 2 && (
        <div className="max-w-2xl">
          <h3 className="font-semibold text-lg mb-4">Company Details</h3>
          <div className="bg-white border rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input value={form.company_name} onChange={e => updateForm('company_name', e.target.value)}
                placeholder={form.jurisdiction === 'AU' ? 'e.g., Acme Solutions Pty Ltd' : form.jurisdiction === 'US' ? 'e.g., Acme Solutions LLC' : 'e.g., Acme Solutions Ltd'}
                className="w-full border rounded-lg px-3 py-2 text-sm" required />
              <p className="text-xs text-gray-400 mt-1">Must be unique and not already registered</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trading Name (optional)</label>
              <input value={form.trading_name} onChange={e => updateForm('trading_name', e.target.value)}
                placeholder="If different from company name"
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Principal Business Activity *</label>
              <input value={form.principal_activity} onChange={e => updateForm('principal_activity', e.target.value)}
                placeholder="e.g., Professional accounting services"
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>

            {form.jurisdiction === 'US' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State of Formation *</label>
                  <select value={form.state_of_formation} onChange={e => updateForm('state_of_formation', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select state...</option>
                    <optgroup label="Popular Choices">
                      {US_POPULAR_STATES.map(s => (
                        <option key={s.code} value={s.code}>{s.code} — {s.reason}</option>
                      ))}
                    </optgroup>
                    <optgroup label="All States">
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registered Agent *</label>
                  <input value={form.registered_agent} onChange={e => updateForm('registered_agent', e.target.value)}
                    placeholder="Name of registered agent in formation state"
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <p className="text-xs text-gray-400 mt-1">Required in all US states. Must have a physical address in the state.</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registered Address *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Street address" value={form.registered_address.street}
                  onChange={e => updateAddress('street', e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm md:col-span-2" />
                <input placeholder={form.jurisdiction === 'AU' ? 'Suburb' : 'City'}
                  value={form.registered_address.city || form.registered_address.suburb}
                  onChange={e => updateAddress(form.jurisdiction === 'AU' ? 'suburb' : 'city', e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm" />
                {(form.jurisdiction === 'AU' || form.jurisdiction === 'US') && (
                  <select value={form.registered_address.state} onChange={e => updateAddress('state', e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm">
                    <option value="">State...</option>
                    {(form.jurisdiction === 'AU' ? AU_STATES : US_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <input placeholder={form.jurisdiction === 'US' ? 'ZIP Code' : 'Postcode'}
                  value={form.registered_address.postcode || form.registered_address.zip}
                  onChange={e => updateAddress(form.jurisdiction === 'US' ? 'zip' : 'postcode', e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            {costs && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-900 mb-2">Estimated Costs</p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-indigo-600 font-bold">{costs.currency} ${costs.filing_fee?.toLocaleString()}</p>
                    <p className="text-xs text-indigo-400">Filing fee</p>
                  </div>
                  <div>
                    <p className="text-indigo-600 font-bold">{costs.currency} ${costs.annual_review_fee?.toLocaleString()}/yr</p>
                    <p className="text-xs text-indigo-400">Annual fee</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Back</button>
            <button onClick={() => form.company_name ? setStep(3) : toast.error('Company name is required')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Directors & Shareholders */}
      {step === 3 && (
        <div className="max-w-2xl">
          <h3 className="font-semibold text-lg mb-4">Directors & Shareholders</h3>

          {/* Directors */}
          <div className="bg-white border rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Directors</h4>
              <button onClick={() => setForm(f => ({ ...f, directors: [...f.directors, { full_name: '', email: '', is_resident: false }] }))}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Add Director</button>
            </div>
            <div className="space-y-3">
              {form.directors.map((dir, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <input placeholder="Full legal name" value={dir.full_name}
                    onChange={e => {
                      const dirs = [...form.directors];
                      dirs[i] = { ...dirs[i], full_name: e.target.value };
                      updateForm('directors', dirs);
                    }}
                    className="border rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Email" type="email" value={dir.email}
                    onChange={e => {
                      const dirs = [...form.directors];
                      dirs[i] = { ...dirs[i], email: e.target.value };
                      updateForm('directors', dirs);
                    }}
                    className="border rounded-lg px-3 py-2 text-sm" />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" checked={dir.is_resident}
                        onChange={e => {
                          const dirs = [...form.directors];
                          dirs[i] = { ...dirs[i], is_resident: e.target.checked };
                          updateForm('directors', dirs);
                        }} />
                      Resident
                    </label>
                    {form.directors.length > 1 && (
                      <button onClick={() => updateForm('directors', form.directors.filter((_, j) => j !== i))}
                        className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {selectedStructure?.requires_resident_director && (
              <p className="text-xs text-amber-600 mt-3">At least one director must be a resident of {currentJur?.name}</p>
            )}
          </div>

          {/* Shareholders */}
          {selectedStructure && selectedStructure.min_directors !== 0 && (
            <div className="bg-white border rounded-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Shareholders</h4>
                <button onClick={() => setForm(f => ({ ...f, shareholders: [...f.shareholders, { full_name: '', shares: 0, share_class: 'Ordinary' }] }))}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Add Shareholder</button>
              </div>
              <div className="space-y-3">
                {form.shareholders.map((sh, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <input placeholder="Full legal name" value={sh.full_name}
                      onChange={e => {
                        const shs = [...form.shareholders];
                        shs[i] = { ...shs[i], full_name: e.target.value };
                        updateForm('shareholders', shs);
                      }}
                      className="border rounded-lg px-3 py-2 text-sm" />
                    <input placeholder="Number of shares" type="number" value={sh.shares}
                      onChange={e => {
                        const shs = [...form.shareholders];
                        shs[i] = { ...shs[i], shares: parseInt(e.target.value) || 0 };
                        updateForm('shareholders', shs);
                      }}
                      className="border rounded-lg px-3 py-2 text-sm" />
                    <div className="flex items-center gap-3">
                      <select value={sh.share_class}
                        onChange={e => {
                          const shs = [...form.shareholders];
                          shs[i] = { ...shs[i], share_class: e.target.value };
                          updateForm('shareholders', shs);
                        }}
                        className="border rounded-lg px-3 py-2 text-sm flex-1">
                        <option value="Ordinary">Ordinary</option>
                        <option value="Preference">Preference</option>
                      </select>
                      {form.shareholders.length > 1 && (
                        <button onClick={() => updateForm('shareholders', form.shareholders.filter((_, j) => j !== i))}
                          className="text-xs text-red-400 hover:text-red-600">Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Back</button>
            <button onClick={() => setStep(4)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Review Application
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <div className="max-w-2xl">
          <h3 className="font-semibold text-lg mb-4">Review & Submit</h3>

          <div className="bg-white border rounded-xl p-6 space-y-6">
            {/* Summary */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Company</p>
              <p className="text-xl font-bold text-gray-900">{form.company_name || 'Not specified'}</p>
              {form.trading_name && <p className="text-sm text-gray-500">Trading as: {form.trading_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Jurisdiction</p>
                <p className="font-medium">{currentJur?.flag} {currentJur?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Structure</p>
                <p className="font-medium">{selectedStructure?.name}</p>
              </div>
              {form.jurisdiction === 'US' && form.state_of_formation && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">State of Formation</p>
                  <p className="font-medium">{form.state_of_formation}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Activity</p>
                <p className="font-medium">{form.principal_activity || 'Not specified'}</p>
              </div>
            </div>

            {/* Directors */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Directors ({form.directors.length})</p>
              <div className="space-y-1">
                {form.directors.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{d.full_name || 'Unnamed'}</span>
                    {d.is_resident && <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded">Resident</span>}
                    <span className="text-gray-400 text-xs">{d.email}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shareholders */}
            {form.shareholders.length > 0 && form.shareholders[0].full_name && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Shareholders ({form.shareholders.length})</p>
                <div className="space-y-1">
                  {form.shareholders.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{s.full_name || 'Unnamed'}</span>
                      <span className="text-gray-400">{s.shares} {s.share_class} shares</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Address */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Registered Address</p>
              <p className="text-sm text-gray-700">
                {[form.registered_address.street, form.registered_address.suburb, form.registered_address.city, form.registered_address.state, form.registered_address.postcode || form.registered_address.zip].filter(Boolean).join(', ') || 'Not specified'}
              </p>
            </div>

            {/* Costs */}
            {costs && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Estimated Costs</p>
                <div className="flex gap-8">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{costs.currency} ${costs.total_initial?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Initial filing</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{costs.currency} ${costs.total_annual?.toLocaleString()}/yr</p>
                    <p className="text-xs text-gray-400">Annual renewal</p>
                  </div>
                </div>
              </div>
            )}

            {/* Registrations checklist */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Required Registrations</p>
              <div className="space-y-2">
                {(jurisdictions?.[form.jurisdiction]?.registrations || []).map((reg, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${reg.mandatory ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                    <span className="font-medium flex-1">{reg.name}</span>
                    <span className="text-xs text-gray-400">{reg.timeline}</span>
                    {!reg.mandatory && <span className="text-xs text-gray-300">Optional</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(3)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Back</button>
            <button onClick={handleSubmit} disabled={submitting}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Creating Application...' : 'Create Incorporation Application'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmittedView({ application, onBack }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Created</h2>
        <p className="text-gray-500">{application.company_name} — {application.structure_name}</p>
      </div>

      {/* Documents */}
      {application.documents && application.documents.length > 0 && (
        <div className="bg-white border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Generated Documents</h3>
          <div className="space-y-2">
            {application.documents.map((doc, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.type}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  doc.status === 'generated' ? 'bg-green-100 text-green-700' :
                  doc.status === 'requires_signature' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{doc.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration checklist */}
      {application.registrations && (
        <div className="bg-white border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Registration Checklist</h3>
          <div className="space-y-3">
            {application.registrations.map((reg, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  reg.status === 'completed' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}>
                  {reg.status === 'completed' && (
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{reg.name}</p>
                  <p className="text-xs text-gray-400">{reg.authority} &middot; {reg.timeline}</p>
                </div>
                {reg.mandatory && <span className="text-xs text-indigo-500 font-medium">Required</span>}
                {!reg.mandatory && <span className="text-xs text-gray-300">Optional</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost summary */}
      {application.estimated_costs && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-indigo-900 mb-3">Cost Summary</h3>
          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-bold text-indigo-700">{application.estimated_costs.currency} ${application.estimated_costs.total_initial}</p>
              <p className="text-xs text-indigo-500">Initial filing cost</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700">{application.estimated_costs.currency} ${application.estimated_costs.total_annual}/yr</p>
              <p className="text-xs text-indigo-500">Annual review/renewal</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200">
          Start Another
        </button>
      </div>
    </div>
  );
}
