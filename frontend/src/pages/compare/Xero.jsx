import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';
import LegalDisclaimer from '@/components/LegalDisclaimer';

const FEATURES = [
  { category: 'Pricing' },
  { name: 'Starter plan (invoicing limit)', xero: '20 invoices/mo', davenroe: 'Unlimited on all plans', win: 'davenroe' },
  { name: 'Practice tier + Payroll', xero: '$79 Premium + $13/employee payroll add-on', davenroe: '$149/mo all-inclusive (unlimited employees)', win: 'davenroe', note: 'Save $50-200/mo for a 5-person team' },
  { name: 'Multi-entity pricing', xero: 'Separate subscription per entity', davenroe: 'One subscription covers all entities', win: 'davenroe', note: '3 entities = save $158/mo' },
  { name: 'Payroll add-on required?', xero: 'Yes — $13-26/employee/mo', davenroe: 'Included on all plans', win: 'davenroe' },

  { category: 'Where DavenRoe Is Years Ahead' },
  { name: 'Forensic intelligence (Benford\'s, ghost vendor, money trail)', xero: false, davenroe: true, win: 'davenroe' },
  { name: 'Autonomous month-end close', xero: false, davenroe: '4.2 seconds average', win: 'davenroe' },
  { name: 'Cross-border tax treaty engine (6 DTAs)', xero: false, davenroe: true, win: 'davenroe' },
  { name: 'AI review queue + confidence scoring', xero: false, davenroe: true, win: 'davenroe' },
  { name: 'Catch-up wizard (5+ years overdue)', xero: false, davenroe: true, win: 'davenroe' },
  { name: '"Get Ready for Accountant" pack', xero: false, davenroe: true, win: 'davenroe' },
  { name: 'Email Harvester (inbox → draft → GST)', xero: false, davenroe: true, win: 'davenroe' },
  { name: 'Compliance calendar (40+ deadlines, 4 jurisdictions)', xero: false, davenroe: true, win: 'davenroe' },
  { name: 'Multi-jurisdiction in one subscription (AU/NZ/UK/US)', xero: false, davenroe: true, win: 'davenroe' },
  { name: 'Scenario planning ("what if I hire 2 people?")', xero: false, davenroe: true, win: 'davenroe' },
  { name: 'Financial health score (0-100)', xero: false, davenroe: true, win: 'davenroe' },

  { category: 'Where Xero Still Leads' },
  { name: 'App marketplace', xero: '1,000+ apps', davenroe: '22 (growing fast)', win: 'xero' },
  { name: 'Accountant partner network', xero: '200,000+ accountants', davenroe: 'Growing (free Practice tier + 60-day trial)', win: 'xero' },
  { name: 'Mobile native iOS + Android', xero: '4.6★ App Store', davenroe: 'PWA today, native in dev', win: 'xero' },
  { name: 'Years in market', xero: '18 years', davenroe: 'New and hungry', win: 'xero' },

  { category: 'AI Capability' },
  { name: '"Just Ask Xero" AI', xero: 'Limited beta, read-only NLP', davenroe: 'Ask DavenRoe — reads, acts, and drafts', win: 'davenroe' },
  { name: 'Multi-agent AI', xero: false, davenroe: '7 autonomous agents', win: 'davenroe' },
  { name: 'AI categorisation accuracy', xero: '~70% (community reports)', davenroe: '94%+ with confidence scoring', win: 'davenroe' },
  { name: 'AI that takes actions', xero: false, davenroe: 'Drafts, reconciles, closes — human approves', win: 'davenroe' },

  { category: 'Reporting' },
  { name: 'Standard reports', xero: '~20 templates (rigid)', davenroe: 'P&L, BS, TB, GL, CF, AR/AP + dimensional', win: 'davenroe' },
  { name: 'Custom report builder', xero: 'Basic, #1 complaint', davenroe: 'Full drag-and-drop (roadmap Q3 2026)', win: 'tie' },
  { name: 'Project profitability', xero: 'Xero Projects add-on', davenroe: 'Built-in project tracking + P&L', win: 'davenroe' },
];

const FAQS = [
  { q: 'How do I migrate from Xero to DavenRoe?', a: 'One-click OAuth migration: connect your Xero account, we pull your chart of accounts, contacts, 12-month transaction history, invoices, bills, and receipts. AI maps every field — you confirm in seconds. Most migrations complete in under 2 minutes. Your Xero stays active during trial so you can compare side-by-side.' },
  { q: 'What about my Xero-connected apps?', a: 'If you use Xero add-ons for payroll, expense management, or document capture — DavenRoe includes all of those natively. For CRM (HubSpot, Salesforce) and e-commerce (Shopify) integrations, we support direct connections already. We\'re adding 10+ integrations per quarter.' },
  { q: 'Will my accountant need to switch too?', a: 'Your accountant gets a free 60-day DavenRoe Practice trial — no credit card. If they like it, they can manage all their clients from one platform. If they prefer to stay on Xero for other clients, DavenRoe exports standard reports they can ingest.' },
  { q: 'What about my historical data?', a: 'Everything transfers with original dates and references. Our catch-up wizard can also reconstruct years of missing data from bank statements alone — something Xero can\'t do at all.' },
  { q: 'Is the reporting really better than Xero?', a: 'Xero\'s limited reporting is their #1 user complaint (check r/xero). DavenRoe ships with P&L, Balance Sheet, Trial Balance, General Ledger, Cash Flow, Aged AR/AP, and dimensional filtering. Custom report builder launches Q3 2026.' },
];

export default function CompareXero() {
  useEffect(() => {
    document.title = 'DavenRoe vs Xero 2026 | Full Feature Comparison for AU & NZ Accountants';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'DavenRoe vs Xero 2026: forensic intelligence, autonomous month-end close, 4-country payroll included, compliance calendar — all in one subscription. See why AU/NZ accountants are switching.');
  }, []);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Product',
        name: 'DavenRoe vs Xero', description: 'Head-to-head comparison: DavenRoe vs Xero. Forensic intelligence, autonomous close, catch-up wizard, and multi-jurisdiction tax filing that Xero doesn\'t offer.',
        brand: { '@type': 'Brand', name: 'DavenRoe' }, url: 'https://davenroe.com/compare/xero',
      })}} />

      {/* HERO */}
      <section className="bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs font-medium mb-6">XERO ALTERNATIVE FOR AU & NZ</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Everything Xero Does.<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Plus 16 Features Xero Will Never Ship.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Forensic fraud detection. Autonomous month-end close in 4.2 seconds.
            Multi-jurisdiction tax filing. Native payroll included. Email-to-ledger
            AI pipeline. One subscription — no add-ons.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/catch-up" className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg shadow-indigo-500/25">Start Free Trial <ArrowRight className="w-5 h-5" /></Link>
            <a href="#comparison" className="inline-flex items-center justify-center gap-2 border border-gray-600 hover:border-gray-400 text-gray-200 font-semibold py-3 px-6 rounded-lg transition">Full Comparison Table</a>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Xero users complain about most</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Weak reporting', desc: '#1 complaint on every Xero forum. Limited templates, no dimensional analysis, can\'t filter by department. DavenRoe ships 7 core reports + dimensional pivot from day one.' },
              { title: 'Per-entity pricing', desc: '3 entities = 3 subscriptions. On Xero Premium that\'s $237/mo just for accounting — before payroll add-ons. DavenRoe: unlimited entities, one subscription.' },
              { title: 'No fraud detection', desc: 'Xero has zero forensic tools. No Benford\'s analysis, no ghost vendor detection, no money trail tracking. DavenRoe runs all of them on every transaction automatically.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section id="comparison" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Feature-by-feature comparison</h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 w-[300px]">Feature</th>
                    <th className="py-4 px-4 text-center font-semibold text-gray-500">Xero</th>
                    <th className="py-4 px-4 text-center font-semibold text-indigo-600 bg-indigo-50/50">DavenRoe</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((row, i) => {
                    if (row.category) {
                      return (
                        <tr key={i} className="bg-gray-50">
                          <td colSpan={3} className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{row.category}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-3 px-6 text-gray-700">
                          {row.name}
                          {row.note && <span className="block text-[10px] text-indigo-600 font-medium mt-0.5">{row.note}</span>}
                        </td>
                        <td className="py-3 px-4 text-center">{renderCell(row.xero)}</td>
                        <td className="py-3 px-4 text-center bg-indigo-50/30">{renderCell(row.davenroe)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">Based on publicly available feature lists as of April 2026.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to switch?</h2>
        <p className="text-lg text-indigo-100 max-w-xl mx-auto mb-8">Start your 30-day free trial. Migrate your Xero data in 60 seconds. No credit card required.</p>
        <Link to="/catch-up" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold py-3.5 px-8 rounded-lg hover:bg-indigo-50 transition">Start Free Trial <ArrowRight className="w-5 h-5" /></Link>
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

function renderCell(value) {
  if (value === true) return <Check className="w-5 h-5 text-green-600 mx-auto" />;
  if (value === false) return <X className="w-5 h-5 text-red-500 mx-auto" />;
  return <span className="text-sm text-gray-700">{value}</span>;
}
