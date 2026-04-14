import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Zap, DollarSign, Shield, RefreshCw } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';
import LegalDisclaimer from '@/components/LegalDisclaimer';

const QBO_PLAN_COST = { simple_start: 42, essentials: 75, plus: 110, advanced: 250 };

const FAQS = [
  { q: 'How long does the migration actually take?', a: 'The OAuth handshake and data pull run in about 60 seconds. Historical sync of 12 months of transactions completes in the background within 5-10 minutes depending on volume. You can start using DavenRoe immediately while history backfills.' },
  { q: 'What about my last partial month on QuickBooks?', a: 'We pull transactions through today. If you add more to QuickBooks after migration starts, run a delta sync from Settings — we fetch only the new items in under a minute.' },
  { q: 'Can I roll back?', a: 'Yes. Every migrated record retains original timestamps and IDs. If you cancel in the first 30 days, we export everything to QuickBooks-compatible format, and you can re-import on their side. Zero lock-in.' },
  { q: 'What if something doesn\'t map correctly?', a: 'Our AI field-mapper is ~95% accurate on first pass. For anything ambiguous, we surface it in the migration review step before we commit. You\'ll see every unmatched field and approve the mapping.' },
  { q: 'Does this work for QuickBooks Desktop too?', a: 'Yes. Export your .QBW/.IIF/.QBB file from Desktop, upload through our import wizard. Our parser handles QuickBooks Desktop 2015 through 2024. Given Intuit is sunsetting Desktop 2023 support on May 31 2026, now is the time to move.' },
];

const STEPS = [
  { num: '1', t: 'Connect', time: '10s', desc: 'OAuth sign-in to your QuickBooks Online account. One button, nothing to install.' },
  { num: '2', t: 'Map Fields', time: '15s', desc: 'Our AI pre-fills your chart of accounts, tax codes, and categories. You confirm in seconds.' },
  { num: '3', t: 'Import Data', time: '20s', desc: '12 months of invoices, bills, bank transactions, and attachments flow into DavenRoe.' },
  { num: '4', t: 'Verify', time: '10s', desc: 'Side-by-side balance reconciliation. We show you the numbers match before we commit.' },
  { num: '5', t: 'Done', time: '5s', desc: 'You\'re live on DavenRoe with full history. QuickBooks stays running in parallel until you cancel.' },
];

const TRANSFERS = [
  'Chart of accounts', 'Contacts (customers + suppliers)', '12 months of invoices', '12 months of bills',
  '12 months of bank transactions', 'Attachments (receipts, supporting docs)', 'Tax rates and codes',
  'Product / service catalog', 'Payroll history (if applicable)', 'User roles and permissions',
];

export default function MigrateFromQuickBooks() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState('plus');
  const [users, setUsers] = useState(3);
  const [payrollEmployees, setPayrollEmployees] = useState(5);
  const [usingDext, setUsingDext] = useState(true);
  const [usingFathom, setUsingFathom] = useState(false);
  const [usingChaser, setUsingChaser] = useState(false);

  useEffect(() => {
    document.title = 'Switch from QuickBooks to DavenRoe in 60 Seconds | Migration & Savings';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Move from QuickBooks to DavenRoe in 60 seconds. One-click OAuth import. Zero data loss. We reimburse your last QuickBooks bill. Full migration of chart of accounts, invoices, bills, bank transactions, and attachments.');
  }, []);

  const totals = useMemo(() => {
    const planCost = QBO_PLAN_COST[plan];
    const payrollCost = payrollEmployees > 0 ? Math.min(60 + payrollEmployees * 7, 125) : 0;
    const dextCost = usingDext ? 30 : 0;
    const fathomCost = usingFathom ? 50 : 0;
    const chaserCost = usingChaser ? 40 : 0;
    const monthly = planCost + payrollCost + dextCost + fathomCost + chaserCost;
    const davenroe = 149;
    const savingsMo = Math.max(0, monthly - davenroe);
    const savingsYr = savingsMo * 12;
    return { monthly, davenroe, savingsMo, savingsYr, items: (dextCost ? 1 : 0) + (fathomCost ? 1 : 0) + (chaserCost ? 1 : 0) + (payrollCost ? 1 : 0) + 1 };
  }, [plan, users, payrollEmployees, usingDext, usingFathom, usingChaser]);

  const startMigration = () => navigate('/import?source=quickbooks');

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'HowTo',
        name: 'Migrate from QuickBooks to DavenRoe',
        description: 'Switch from QuickBooks to DavenRoe in 60 seconds with zero data loss',
        step: STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.t, text: s.desc })),
      })}} />

      <section className="bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-green-500/20 border border-green-400/40 text-green-200 text-xs font-medium mb-6">WE'LL REIMBURSE YOUR LAST QUICKBOOKS BILL</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Switch from QuickBooks to DavenRoe<br /><span className="text-davenRoe-400">in 60 Seconds</span></h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">Bring your chart of accounts, contacts, invoices, bills, and 12 months of bank transactions. Zero data loss. Roll back anytime. Full onboarding support from a real accountant.</p>
          <a href="#calculator" className="inline-flex items-center gap-2 bg-davenRoe-600 hover:bg-davenRoe-700 text-white font-semibold py-3 px-6 rounded-lg transition">Calculate Your Savings <ArrowRight className="w-5 h-5" /></a>
        </div>
      </section>

      <section id="calculator" className="py-20 px-6 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">What Are You Paying QuickBooks Today?</h2>
          <p className="text-gray-600 text-center mb-12">Tell us your stack — we'll show you the savings.</p>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Your Current Stack</h3>
              <label className="block mb-4">
                <span className="text-sm font-medium text-gray-700 block mb-1">QuickBooks Online plan (post-May 2026)</span>
                <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 bg-white focus:ring-2 focus:ring-davenRoe-500 focus:border-davenRoe-500">
                  <option value="simple_start">Simple Start — $42/mo</option>
                  <option value="essentials">Essentials — $75/mo</option>
                  <option value="plus">Plus — $110/mo</option>
                  <option value="advanced">Advanced — $250/mo</option>
                </select>
              </label>
              <label className="block mb-4">
                <span className="text-sm font-medium text-gray-700 block mb-1">Number of users</span>
                <input type="number" min="1" max="99" value={users} onChange={(e) => setUsers(Math.max(1, parseInt(e.target.value) || 1))} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-davenRoe-500 focus:border-davenRoe-500" />
              </label>
              <label className="block mb-4">
                <span className="text-sm font-medium text-gray-700 block mb-1">QBO Payroll — employees</span>
                <input type="number" min="0" max="999" value={payrollEmployees} onChange={(e) => setPayrollEmployees(Math.max(0, parseInt(e.target.value) || 0))} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-davenRoe-500 focus:border-davenRoe-500" />
                <span className="text-xs text-gray-500 block mt-1">0 = not using QBO Payroll</span>
              </label>
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={usingDext} onChange={(e) => setUsingDext(e.target.checked)} className="w-4 h-4 text-davenRoe-600 rounded" /><span className="text-sm text-gray-700">Dext / Hubdoc — $30/mo</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={usingFathom} onChange={(e) => setUsingFathom(e.target.checked)} className="w-4 h-4 text-davenRoe-600 rounded" /><span className="text-sm text-gray-700">Fathom / reporting tool — $50/mo</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={usingChaser} onChange={(e) => setUsingChaser(e.target.checked)} className="w-4 h-4 text-davenRoe-600 rounded" /><span className="text-sm text-gray-700">Chaser / collections — $40/mo</span></label>
              </div>
            </div>
            <div className="bg-gradient-to-br from-davenRoe-700 to-indigo-900 text-white rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-sm text-indigo-200 uppercase tracking-wider font-semibold mb-1">You're currently paying</div>
                <div className="text-5xl font-bold">${totals.monthly.toLocaleString()}<span className="text-lg font-normal text-indigo-200">/mo</span></div>
                <div className="text-sm text-indigo-200 mt-1">across {totals.items} tools</div>
                <div className="border-t border-indigo-400/30 my-6"></div>
                <div className="text-sm text-indigo-200 uppercase tracking-wider font-semibold mb-1">DavenRoe Practice (all-inclusive)</div>
                <div className="text-5xl font-bold">${totals.davenroe}<span className="text-lg font-normal text-indigo-200">/mo</span></div>
                <div className="border-t border-indigo-400/30 my-6"></div>
                <div className="text-sm text-green-300 uppercase tracking-wider font-semibold mb-1">You save</div>
                <div className="text-5xl font-bold text-green-200">${totals.savingsYr.toLocaleString()}<span className="text-lg font-normal text-green-300">/year</span></div>
                <div className="text-sm text-indigo-200 mt-1">${totals.savingsMo.toLocaleString()}/month</div>
                <div className="mt-6 text-sm text-indigo-100"><strong className="text-white">Plus:</strong> forensic intelligence, native 4-country payroll, catch-up wizard, cross-border tax treaties — not available anywhere else at any price.</div>
              </div>
              <button onClick={startMigration} className="w-full bg-white text-davenRoe-700 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition mt-6 inline-flex items-center justify-center gap-2">Start Migration Now <ArrowRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">5 Steps. 60 Seconds.</h2>
          <p className="text-gray-600 text-center mb-12">This is what the actual migration looks like.</p>
          <div className="grid md:grid-cols-5 gap-4">
            {STEPS.map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm relative">
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-davenRoe-600 text-white rounded-full flex items-center justify-center font-bold">{s.num}</div>
                <div className="text-xs text-davenRoe-700 font-semibold mb-1 mt-3">{s.time}</div>
                <h3 className="font-bold text-gray-900 mb-2">{s.t}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Everything Transfers</h2>
          <p className="text-gray-600 text-center mb-12">Zero data loss. Original timestamps and IDs preserved. Audit trail intact.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {TRANSFERS.map((t, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-4 border border-gray-200">
                <Check className="w-5 h-5 text-green-600 shrink-0" />
                <span className="text-sm text-gray-900">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl p-10 text-center">
          <DollarSign className="w-12 h-12 text-green-200 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">We'll Reimburse Your Last QuickBooks Bill</h2>
          <p className="text-green-50 mb-6">Show us proof of cancellation within 60 days of migration and we'll credit your final QuickBooks invoice up to $500 to your first DavenRoe bill. No fine print.</p>
          <button onClick={startMigration} className="inline-flex items-center gap-2 bg-white text-green-700 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition">Start Your Migration <ArrowRight className="w-5 h-5" /></button>
        </div>
      </section>

      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 text-center">
          <div><Zap className="w-8 h-8 text-davenRoe-600 mx-auto mb-2" /><h3 className="font-bold">Fast</h3><p className="text-sm text-gray-600">Most migrations complete in 60 seconds</p></div>
          <div><Shield className="w-8 h-8 text-davenRoe-600 mx-auto mb-2" /><h3 className="font-bold">Safe</h3><p className="text-sm text-gray-600">Zero data loss. Rollback anytime in 30 days.</p></div>
          <div><RefreshCw className="w-8 h-8 text-davenRoe-600 mx-auto mb-2" /><h3 className="font-bold">Concurrent</h3><p className="text-sm text-gray-600">QuickBooks stays live until you cancel</p></div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <Accordion.Root type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <Accordion.Item key={i} value={`item-${i}`} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between py-4 px-5 text-left font-semibold text-gray-900 hover:bg-gray-50 transition">{faq.q}<span className="text-davenRoe-600 text-xl group-data-[state=open]:rotate-45 transition-transform">+</span></Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-slide-in data-[state=closed]:hidden">
                  <div className="px-5 pb-4 text-sm text-gray-700 border-t border-gray-100 pt-3">{faq.a}</div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>

      <div className="bg-gray-100 py-6 px-6">
        <div className="max-w-4xl mx-auto"><LegalDisclaimer variant="general" /></div>
      </div>
    </div>
  );
}
