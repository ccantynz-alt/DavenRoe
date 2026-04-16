import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Zap, DollarSign, Shield } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';
import LegalDisclaimer from '@/components/LegalDisclaimer';

const XERO_PLAN_COST = { starter: 29, standard: 49, premium: 79 };

const FAQS = [
  { q: 'How long does the migration from Xero take?', a: 'OAuth connect takes 10 seconds. We pull chart of accounts, contacts, 12 months of invoices, bills, bank transactions, and attachments within 60 seconds. Full historical sync continues in the background. You can start working in DavenRoe immediately.' },
  { q: 'What about my Xero-connected apps?', a: 'If you use Dext, Hubdoc, Float, or Fathom alongside Xero — DavenRoe replaces all of them natively. For CRM (HubSpot, Salesforce) and e-commerce (Shopify) integrations, we support direct connections. We are adding 10+ integrations per quarter.' },
  { q: 'Can I keep Xero running while I trial DavenRoe?', a: 'Absolutely. We recommend it. Run them in parallel during your 30-day trial. Only cancel Xero when you are confident DavenRoe has everything you need. Zero lock-in.' },
  { q: 'What about multi-entity on Xero?', a: 'If you have 3 Xero subscriptions for 3 entities, you can migrate all 3 into one DavenRoe subscription. That alone saves $158/mo on Xero Premium.' },
  { q: 'What if my accountant uses Xero?', a: 'Your accountant gets a free 60-day DavenRoe Practice trial. If they want to keep some clients on Xero, DavenRoe exports standard reports they can ingest. We also generate a Get Ready for Accountant pack so the handoff is seamless.' },
];

const STEPS = [
  { num: '1', t: 'Connect Xero', time: '10s', desc: 'OAuth sign-in to your Xero account. One button — we ask for read-only access only.' },
  { num: '2', t: 'AI Maps Fields', time: '15s', desc: 'DavenRoe reads your chart of accounts, tax codes, and categories. AI pre-maps everything.' },
  { num: '3', t: 'Import Data', time: '20s', desc: '12 months of invoices, bills, bank transactions, contacts, and attachments flow in.' },
  { num: '4', t: 'Reconcile', time: '10s', desc: 'Side-by-side balance check. We show you the numbers match before we commit.' },
  { num: '5', t: 'Live', time: '5s', desc: 'Full history, full access. Xero stays live until you cancel — no rush.' },
];

const TRANSFERS = [
  'Chart of accounts + tracking categories', 'Contacts (customers + suppliers)',
  '12 months of invoices + credit notes', '12 months of bills + purchase orders',
  '12 months of bank transactions', 'Attachments (receipts, supporting docs)',
  'Tax rates and codes', 'Repeating invoices/bills', 'Fixed assets (if Xero Premium)',
  'Manual journals',
];

export default function MigrateFromXero() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState('premium');
  const [entities, setEntities] = useState(1);
  const [payrollEmp, setPayrollEmp] = useState(3);
  const [usingDext, setUsingDext] = useState(true);
  const [usingFathom, setUsingFathom] = useState(false);
  const [usingFloat, setUsingFloat] = useState(false);

  useEffect(() => {
    document.title = 'Switch from Xero to DavenRoe in 60 Seconds | Migration & Savings Calculator';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Move from Xero to DavenRoe in 60 seconds. One-click OAuth import, zero data loss. Full migration of chart of accounts, invoices, bank transactions. Includes payroll, forensics, AI — no add-ons.');
  }, []);

  const totals = useMemo(() => {
    const planCost = XERO_PLAN_COST[plan] * entities;
    const payrollCost = payrollEmp > 0 ? payrollEmp * 13 : 0;
    const dextCost = usingDext ? 30 : 0;
    const fathomCost = usingFathom ? 50 : 0;
    const floatCost = usingFloat ? 49 : 0;
    const monthly = planCost + payrollCost + dextCost + fathomCost + floatCost;
    const davenroe = 149;
    const savingsMo = Math.max(0, monthly - davenroe);
    const savingsYr = savingsMo * 12;
    return { monthly, davenroe, savingsMo, savingsYr };
  }, [plan, entities, payrollEmp, usingDext, usingFathom, usingFloat]);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'HowTo',
        name: 'Migrate from Xero to DavenRoe',
        description: 'Switch from Xero to DavenRoe in 60 seconds with zero data loss.',
        step: STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.t, text: s.desc })),
      })}} />

      {/* HERO */}
      <section className="bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-medium mb-6">ONE-CLICK XERO MIGRATION</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Everything You Have in Xero.<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Plus 16 Features Xero Doesn't.</span><br />
            60 Seconds to Switch.
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Connect your Xero account, DavenRoe pulls 12 months of data, AI maps
            every field, and you're live — with forensic intelligence, autonomous
            AI, and native payroll included from day one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#calculator" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg shadow-indigo-500/25">Calculate Your Savings <ArrowRight className="w-5 h-5" /></a>
            <a href="#steps" className="inline-flex items-center gap-2 border border-gray-600 hover:border-gray-400 text-gray-200 font-semibold py-3 px-6 rounded-lg transition">See Migration Steps</a>
          </div>
        </div>
      </section>

      {/* SAVINGS CALCULATOR */}
      <section id="calculator" className="py-20 px-6 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How much will you save?</h2>
          <p className="text-center text-gray-600 mb-10">Configure your current Xero stack below.</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h3 className="font-semibold text-gray-900">Your Xero setup</h3>
              <Field label="Xero plan (per entity)">
                <select value={plan} onChange={(e) => setPlan(e.target.value)} className="input">
                  <option value="starter">Starter ($29/mo)</option>
                  <option value="standard">Standard ($49/mo)</option>
                  <option value="premium">Premium ($79/mo)</option>
                </select>
              </Field>
              <Field label="Number of entities (each needs a subscription)">
                <input type="range" min={1} max={10} value={entities} onChange={(e) => setEntities(Number(e.target.value))} className="w-full" />
                <p className="text-sm text-gray-600 mt-1">{entities} entit{entities > 1 ? 'ies' : 'y'}</p>
              </Field>
              <Field label="Payroll employees (Xero Payroll = $13/emp/mo)">
                <input type="range" min={0} max={30} value={payrollEmp} onChange={(e) => setPayrollEmp(Number(e.target.value))} className="w-full" />
                <p className="text-sm text-gray-600 mt-1">{payrollEmp} employees</p>
              </Field>
              <div className="space-y-2">
                <Toggle label="Dext / Hubdoc ($30/mo)" checked={usingDext} onChange={setUsingDext} />
                <Toggle label="Fathom reporting ($50/mo)" checked={usingFathom} onChange={setUsingFathom} />
                <Toggle label="Float cash flow ($49/mo)" checked={usingFloat} onChange={setUsingFloat} />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-500 mb-1">Current monthly spend</p>
                <p className="text-4xl font-bold text-gray-900">${totals.monthly}<span className="text-lg font-normal text-gray-500">/mo</span></p>
                <div className="my-4 h-px bg-gray-200" />
                <p className="text-sm text-gray-500 mb-1">DavenRoe (everything included)</p>
                <p className="text-4xl font-bold text-indigo-600">$149<span className="text-lg font-normal text-gray-500">/mo</span></p>
              </div>
              {totals.savingsMo > 0 && (
                <div className="mt-4 bg-emerald-600 text-white rounded-2xl p-6 text-center">
                  <p className="text-sm text-emerald-100 mb-1">You save</p>
                  <p className="text-4xl font-bold">${totals.savingsMo}/mo</p>
                  <p className="text-emerald-200 text-sm mt-1">${totals.savingsYr.toLocaleString()}/year</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section id="steps" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">5 steps, 60 seconds</h2>
          <div className="space-y-6">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{s.num}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{s.t}</h3>
                    <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">{s.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT TRANSFERS */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">What transfers from Xero</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {TRANSFERS.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to switch?</h2>
        <p className="text-lg text-indigo-100 max-w-xl mx-auto mb-8">Start your 30-day free trial. No credit card. Your Xero stays running until you cancel.</p>
        <button onClick={() => navigate('/import?source=xero')} className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold py-3.5 px-8 rounded-lg hover:bg-indigo-50 transition">
          Start Migration <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ — switching from Xero</h2>
          <Accordion.Root type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <Accordion.Item key={i} value={`faq-${i}`} className="border border-gray-200 rounded-xl overflow-hidden">
                <Accordion.Header>
                  <Accordion.Trigger className="w-full text-left px-6 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 flex items-center justify-between group">
                    {faq.q}
                    <span className="text-gray-400 group-data-[state=open]:rotate-180 transition-transform">&#9660;</span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>

      <LegalDisclaimer />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors relative ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
