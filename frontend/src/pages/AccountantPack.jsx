import { useState } from 'react';
import api from '../services/api';

/**
 * Get Ready for Accountant — pack builder.
 *
 * Flow: user picks jurisdiction + entity details + enters annual totals for
 * the years they are behind on. On submit, backend reconstructs every
 * indirect-tax return, annual income tax, and provisional schedule and
 * assembles a pack the user can hand to a registered tax agent.
 */

const JURISDICTIONS = [
  { code: 'NZ', label: 'New Zealand (IRD)', gstRate: '15%' },
  { code: 'AU', label: 'Australia (ATO)',   gstRate: '10%' },
  { code: 'GB', label: 'United Kingdom (HMRC)', gstRate: '20% VAT' },
  { code: 'US', label: 'United States (IRS)', gstRate: 'state varies' },
];

function currentYear() {
  return new Date().getFullYear();
}

function emptyYear(year) {
  return {
    year,
    revenue: '',
    expenses: '',
    payroll: '',
    gst_registered: true,
    entity_type: 'sole_trader',
  };
}

export default function AccountantPack() {
  const [step, setStep] = useState(1);
  const [jurisdiction, setJurisdiction] = useState('NZ');
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState('sole_trader');
  const [accountantName, setAccountantName] = useState('');
  const [accountantEmail, setAccountantEmail] = useState('');
  const [gstFrequency, setGstFrequency] = useState('2_monthly');
  const [notes, setNotes] = useState('');
  const [yearsBack, setYearsBack] = useState(5);
  const [years, setYears] = useState(() =>
    Array.from({ length: 5 }, (_, i) => emptyYear(currentYear() - 5 + i)),
  );

  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateYear = (idx, field, value) => {
    setYears((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const regenerateYears = (n) => {
    setYearsBack(n);
    setYears(Array.from({ length: n }, (_, i) => emptyYear(currentYear() - n + i)));
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        jurisdiction,
        entity_name: entityName || 'Unnamed Entity',
        entity_type: entityType,
        accountant_name: accountantName || null,
        accountant_email: accountantEmail || null,
        gst_registered: true,
        gst_filing_frequency: gstFrequency,
        notes: notes || null,
        years: years.map((y) => ({
          year: Number(y.year),
          revenue: Number(y.revenue) || 0,
          expenses: Number(y.expenses) || 0,
          payroll: Number(y.payroll) || 0,
          gst_registered: y.gst_registered,
          entity_type: entityType,
        })),
      };
      const { data } = await api.post('/accountant-pack/generate', payload);
      setPack(data);
      setStep(4);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Could not generate pack');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/accountant-pack/sample');
      setPack(data);
      setStep(4);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Could not load sample');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setPack(null);
    setStep(1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Get Ready for Accountant</h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Reconstruct every missed tax period and assemble a 99.99%-accurate pack your
            registered tax agent can review and lodge in minutes, not weeks.
          </p>
        </div>
        {!pack && (
          <button
            onClick={loadSample}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Load sample pack →
          </button>
        )}
      </div>

      {/* Stepper */}
      {!pack && <Stepper step={step} />}

      {/* Wizard */}
      {!pack && step === 1 && (
        <Card title="1. Which country are you catching up in?">
          <div className="grid sm:grid-cols-2 gap-3">
            {JURISDICTIONS.map((j) => (
              <button
                key={j.code}
                onClick={() => setJurisdiction(j.code)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  jurisdiction === j.code
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">{j.label}</p>
                <p className="text-xs text-gray-500 mt-1">GST / sales tax: {j.gstRate}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Next →
            </button>
          </div>
        </Card>
      )}

      {!pack && step === 2 && (
        <Card title="2. Entity + accountant details">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Entity name">
              <input
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="e.g. Smith Holdings Ltd"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </Field>
            <Field label="Entity type">
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="sole_trader">Sole trader</option>
                <option value="company">Company</option>
                <option value="trust">Trust</option>
                <option value="partnership">Partnership</option>
              </select>
            </Field>
            <Field label="GST filing frequency (during catch-up period)">
              <select
                value={gstFrequency}
                onChange={(e) => setGstFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="2_monthly">2-monthly (NZ default)</option>
                <option value="quarterly">Quarterly (AU/UK/US default)</option>
                <option value="6_monthly">6-monthly</option>
              </select>
            </Field>
            <Field label="Years to reconstruct">
              <select
                value={yearsBack}
                onChange={(e) => regenerateYears(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n} year{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </Field>
            <Field label="Accountant name (optional)">
              <input
                value={accountantName}
                onChange={(e) => setAccountantName(e.target.value)}
                placeholder="e.g. Jane Accountant"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </Field>
            <Field label="Accountant email (optional)">
              <input
                type="email"
                value={accountantEmail}
                onChange={(e) => setAccountantEmail(e.target.value)}
                placeholder="e.g. jane@practice.co.nz"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </Field>
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-800">← Back</button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Next →
            </button>
          </div>
        </Card>
      )}

      {!pack && step === 3 && (
        <Card title={`3. Annual totals for each year (${jurisdiction})`}>
          <p className="text-sm text-gray-600 mb-4">
            Enter your best estimate. DavenRoe reconstructs every period automatically. Once you
            connect bank feeds we uplift accuracy from ~99.1% to 99.99%.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                  <th className="py-2 pr-3">Year</th>
                  <th className="py-2 pr-3">Revenue</th>
                  <th className="py-2 pr-3">Deductible expenses</th>
                  <th className="py-2 pr-3">Payroll (if any)</th>
                  <th className="py-2 pr-3">GST registered</th>
                </tr>
              </thead>
              <tbody>
                {years.map((y, idx) => (
                  <tr key={y.year} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-mono text-gray-900">{y.year}</td>
                    <td className="py-2 pr-3">
                      <CurrencyInput value={y.revenue} onChange={(v) => updateYear(idx, 'revenue', v)} />
                    </td>
                    <td className="py-2 pr-3">
                      <CurrencyInput value={y.expenses} onChange={(v) => updateYear(idx, 'expenses', v)} />
                    </td>
                    <td className="py-2 pr-3">
                      <CurrencyInput value={y.payroll} onChange={(v) => updateYear(idx, 'payroll', v)} />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={y.gst_registered}
                        onChange={(e) => updateYear(idx, 'gst_registered', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Field label="Notes for the accountant (optional)" className="mt-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything else the accountant should know — change in entity structure, missing records, unusual items..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </Field>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-800">← Back</button>
            <button
              onClick={submit}
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? 'Reconstructing…' : 'Generate pack →'}
            </button>
          </div>
        </Card>
      )}

      {pack && step === 4 && (
        <PackView pack={pack} onReset={resetWizard} />
      )}
    </div>
  );
}

function Stepper({ step }) {
  const steps = ['Jurisdiction', 'Entity', 'Numbers'];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                done
                  ? 'bg-emerald-500 text-white'
                  : active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {done ? '✓' : n}
            </div>
            <span className={`text-sm ${active ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>{label}</span>
            {i < steps.length - 1 && <div className="w-6 h-px bg-gray-300 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function CurrencyInput({ value, onChange }) {
  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
      <input
        type="number"
        min="0"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-32 pl-6 pr-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      />
    </div>
  );
}

function PackView({ pack, onReset }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl p-6 shadow">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Pack {pack.pack_id}</p>
            <h2 className="text-xl font-bold mt-1">{pack.entity_name}</h2>
            <p className="text-sm text-indigo-100 mt-1">{pack.executive_summary}</p>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-indigo-100 hover:text-white underline"
          >
            Start over
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <PackTotal label="GST / BAS / VAT" value={pack.totals.gst_total} />
          <PackTotal label="Income tax" value={pack.totals.income_tax_total} />
          <PackTotal label="Provisional / PAYG" value={pack.totals.provisional_total} />
          <PackTotal label="Aggregate exposure" value={pack.totals.aggregate_exposure} highlight />
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
        <p className="font-semibold mb-1">Confidence</p>
        <p>{pack.confidence}</p>
      </div>

      {pack.sections.map((section, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-2">{section.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{section.body}</p>
          {section.data?.returns && section.data.returns.length > 0 && (
            <ReturnsTable rows={section.data.returns} kind={section.title.includes('Income') ? 'income' : 'gst'} />
          )}
          {section.data?.instalments && section.data.instalments.length > 0 && (
            <InstalmentTable rows={section.data.instalments} />
          )}
          {section.data?.steps && (
            <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
              {section.data.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          )}
        </div>
      ))}

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Pre-lodgement checklist</h3>
        <div className="space-y-2">
          {pack.checklist.map((item, i) => (
            <label key={i} className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" defaultChecked={item.done} className="mt-0.5 h-4 w-4 text-indigo-600 rounded" />
              <span>
                {item.task}
                {item.required && <span className="ml-2 text-[10px] font-bold text-rose-600">REQUIRED</span>}
                {item.optional && <span className="ml-2 text-[10px] text-gray-400">(optional)</span>}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <p className="font-semibold mb-1">Sign-off</p>
        <p>{pack.sign_off.disclaimer}</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">For your accountant</p>
        <p className="text-lg font-semibold text-gray-900 mt-1">{pack.trial_accountant_offer.headline}</p>
        <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
          <li>• {pack.trial_accountant_offer.offer.duration_days}-day free trial</li>
          <li>• Up to {pack.trial_accountant_offer.offer.seat_limit} seats</li>
          <li>• {pack.trial_accountant_offer.offer.client_workspaces} client workspaces</li>
          <li>• {pack.trial_accountant_offer.offer.support}</li>
        </ul>
        <p className="text-sm text-indigo-700 mt-3 font-medium">{pack.trial_accountant_offer.cta}</p>
      </div>
    </div>
  );
}

function PackTotal({ label, value, highlight }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-white text-gray-900' : 'bg-indigo-800/50 text-indigo-50'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${highlight ? 'text-indigo-600' : 'text-indigo-200'}`}>{label}</p>
      <p className="text-lg font-bold mt-0.5">${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
  );
}

function ReturnsTable({ rows, kind }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500 font-semibold uppercase tracking-wider border-b">
            <th className="py-2 pr-3">Period</th>
            <th className="py-2 pr-3">{kind === 'income' ? 'Filing' : 'Type'}</th>
            {kind === 'income' ? (
              <>
                <th className="py-2 pr-3 text-right">Taxable income</th>
                <th className="py-2 pr-3 text-right">Tax payable</th>
                <th className="py-2 pr-3 text-right">Effective rate</th>
              </>
            ) : (
              <>
                <th className="py-2 pr-3 text-right">Collected</th>
                <th className="py-2 pr-3 text-right">Paid</th>
                <th className="py-2 pr-3 text-right">Net payable</th>
              </>
            )}
            <th className="py-2 pr-3">Due date</th>
            <th className="py-2 pr-3">Overdue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-2 pr-3 font-medium text-gray-900">{r.period || r.year}</td>
              <td className="py-2 pr-3 font-mono text-gray-600">{r.filing_type}</td>
              {kind === 'income' ? (
                <>
                  <td className="py-2 pr-3 text-right">${Number(r.taxable_income).toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-semibold">${Number(r.tax_payable).toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right">{r.effective_rate}</td>
                </>
              ) : (
                <>
                  <td className="py-2 pr-3 text-right">${Number(r.gst_collected).toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right">${Number(r.gst_paid).toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-semibold">${Number(r.net_gst_payable).toLocaleString()}</td>
                </>
              )}
              <td className="py-2 pr-3 text-gray-600">{r.due_date}</td>
              <td className="py-2 pr-3">
                {r.days_overdue > 0 ? (
                  <span className="text-rose-600 font-semibold">{r.days_overdue}d</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InstalmentTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500 font-semibold uppercase tracking-wider border-b">
            <th className="py-2 pr-3">Year</th>
            <th className="py-2 pr-3">Instalment</th>
            <th className="py-2 pr-3 text-right">Amount</th>
            <th className="py-2 pr-3">Due date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 pr-3 font-medium text-gray-900">{r.year}</td>
              <td className="py-2 pr-3">{r.period}</td>
              <td className="py-2 pr-3 text-right font-semibold">${Number(r.amount).toLocaleString()}</td>
              <td className="py-2 pr-3 text-gray-600">{r.due_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
