import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';
import LegalDisclaimer from '@/components/LegalDisclaimer';

const FEATURES = [
  { category: 'Pricing' },
  { name: 'Starter price', myob: '$13/mo Lite', davenroe: '$49/mo Solo (all features)', win: 'myob', note: 'MYOB Lite has very limited features' },
  { name: 'Full-feature business tier', myob: '$60-100/mo Business', davenroe: '$149/mo Practice (payroll + tax + forensics + AI)', win: 'davenroe' },
  { name: 'Payroll add-on', myob: 'Included on Business plans', davenroe: 'Included on all plans', win: 'tie' },
  { name: 'Multi-entity', myob: 'Separate subscriptions', davenroe: 'One subscription covers all', win: 'davenroe' },

  { category: 'Where DavenRoe Leapfrogs' },
  { name: 'AI-powered anything', myob: false, davenroe: '7 autonomous AI agents', win: 'davenroe' },
  { name: 'Natural language queries', myob: false, davenroe: 'Ask DavenRoe — NLP + action', win: 'davenroe' },
  { name: 'Autonomous month-end close', myob: false, davenroe: '4.2s average', win: 'davenroe' },
  { name: 'Forensic intelligence', myob: false, davenroe: 'Benford\'s, ghost vendor, money trail', win: 'davenroe' },
  { name: 'Cross-border tax treaties', myob: false, davenroe: '6 bilateral DTAs', win: 'davenroe' },
  { name: 'Multi-jurisdiction (beyond AU/NZ)', myob: 'AU + NZ only', davenroe: 'AU + NZ + UK + US', win: 'davenroe' },
  { name: 'Tax e-filing (BAS/GST)', myob: 'BAS + STP only', davenroe: 'BAS + GST_NZ + VAT_UK + Sales Tax US', win: 'davenroe' },
  { name: 'Compliance calendar', myob: false, davenroe: '40+ deadlines, 4 jurisdictions', win: 'davenroe' },
  { name: 'Catch-up wizard (years behind)', myob: false, davenroe: true, win: 'davenroe' },
  { name: '"Get Ready for Accountant" pack', myob: false, davenroe: true, win: 'davenroe' },
  { name: 'Email-to-ledger AI pipeline', myob: false, davenroe: true, win: 'davenroe' },
  { name: 'Financial health score', myob: false, davenroe: true, win: 'davenroe' },
  { name: 'Scenario planning', myob: false, davenroe: true, win: 'davenroe' },

  { category: 'Where MYOB Still Leads' },
  { name: 'AU payroll specialisation', myob: 'Deep AU payroll (STP Phase 2)', davenroe: 'STP Phase 1 (Phase 2 in dev)', win: 'myob' },
  { name: 'Desktop app (legacy)', myob: 'AccountRight Desktop', davenroe: 'Cloud only', win: 'myob' },
  { name: 'AU market presence', myob: '1.2M+ users', davenroe: 'New and hungry', win: 'myob' },
  { name: 'BAS direct lodgement', myob: 'Direct to ATO', davenroe: 'Via tax agent (auto-lodgement Q3 2026)', win: 'myob' },

  { category: 'Technology' },
  { name: 'Mobile app quality', myob: '3.1★ App Store (common crashes)', davenroe: 'PWA (4.8★ equivalent, native in dev)', win: 'davenroe' },
  { name: 'UI modernity', myob: 'Desktop-era interface', davenroe: 'Modern React SPA, dark mode, animations', win: 'davenroe' },
  { name: 'Feature development pace', myob: 'Slow (users report stagnation)', davenroe: 'Weekly feature releases', win: 'davenroe' },
  { name: 'Integration ecosystem', myob: '~200 apps', davenroe: '22 (growing fast)', win: 'myob' },
];

const FAQS = [
  { q: 'I\'ve been on MYOB for 15 years. Why switch now?', a: 'MYOB is losing market share for a reason: the interface hasn\'t evolved in years, the mobile app crashes constantly (3.1★), and they have zero AI capability while every competitor is shipping it. DavenRoe gives you everything MYOB does — plus forensic intelligence, autonomous AI, multi-jurisdiction support, and a modern interface — for a similar total price. The longer you wait, the harder migration gets.' },
  { q: 'Can I import from MYOB AccountRight Desktop?', a: 'Yes. Export your MYOB data to CSV (AccountRight → File → Export), then use DavenRoe\'s Data Import tool to pull in chart of accounts, contacts, transactions, invoices, and bills. AI auto-maps MYOB\'s field names. Full migration typically takes 5-10 minutes.' },
  { q: 'What about my STP reporting?', a: 'DavenRoe supports STP Phase 1 lodgement today. STP Phase 2 (itemised reporting) is in development for Q3 2026. During the transition, you can use both platforms for payroll or pause MYOB payroll while DavenRoe catches up on Phase 2.' },
  { q: 'Does DavenRoe work for AU + NZ simultaneously?', a: 'Absolutely. One subscription covers AU and NZ (plus UK and US). Xero makes you pay separately for each country. MYOB doesn\'t support NZ in depth. DavenRoe is truly multi-jurisdiction from a single workspace.' },
  { q: 'Will my accountant support this?', a: 'We give accountants a free 60-day Practice tier trial. Many accountants are looking for MYOB alternatives themselves — the stagnation frustrates them too. Our "Get Ready for Accountant" pack makes the first handoff seamless.' },
];

export default function CompareMYOB() {
  useEffect(() => {
    document.title = 'DavenRoe vs MYOB 2026 | Modern AI Alternative for Australian Businesses';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'DavenRoe vs MYOB 2026: modern AI-powered accounting vs legacy desktop software. 7 AI agents, forensic fraud detection, multi-jurisdiction tax filing. See why Australian businesses are switching.');
  }, []);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Product',
        name: 'DavenRoe vs MYOB', description: 'Modern AI accounting platform vs legacy MYOB. Forensic intelligence, autonomous close, catch-up wizard, and 4-country tax filing that MYOB can\'t match.',
        brand: { '@type': 'Brand', name: 'DavenRoe' }, url: 'https://davenroe.com/compare/myob',
      })}} />

      {/* HERO */}
      <section className="bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-medium mb-6">MYOB ALTERNATIVE FOR AUSTRALIA & NZ</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            MYOB Was Built for 2006.<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">DavenRoe Was Built for 2026.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            MYOB has zero AI, a 3.1-star mobile app, and an interface from the desktop era.
            DavenRoe brings 7 AI agents, forensic intelligence, autonomous month-end
            close, and a modern cloud experience — with full AU + NZ support from day one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/catch-up" className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg shadow-indigo-500/25">Start Free Trial <ArrowRight className="w-5 h-5" /></Link>
            <a href="#comparison" className="inline-flex items-center justify-center gap-2 border border-gray-600 hover:border-gray-400 text-gray-200 font-semibold py-3 px-6 rounded-lg transition">See Full Comparison</a>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why MYOB users are looking for alternatives</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Zero AI capability', desc: 'No AI assistant, no NLP, no chatbot, no autonomous features. While Xero and QBO are shipping AI, MYOB has nothing. DavenRoe has 7 AI agents that draft, reconcile, and close autonomously.' },
              { title: 'Desktop-era UX', desc: 'The interface hasn\'t meaningfully changed in years. Navigation is confusing, the mobile app is rated 3.1 stars, and modern expectations like dark mode or responsive design are absent.' },
              { title: 'AU/NZ only', desc: 'MYOB only covers Australia and New Zealand. If you have any international clients or business, you need a second platform. DavenRoe covers AU, NZ, UK, and US in one subscription.' },
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
                    <th className="py-4 px-4 text-center font-semibold text-gray-500">MYOB</th>
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
                        <td className="py-3 px-4 text-center">{renderCell(row.myob)}</td>
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
        <h2 className="text-3xl font-bold mb-4">Time to modernise</h2>
        <p className="text-lg text-indigo-100 max-w-xl mx-auto mb-8">Start your 30-day free trial. Import your MYOB data via CSV. No credit card required.</p>
        <Link to="/catch-up" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold py-3.5 px-8 rounded-lg hover:bg-indigo-50 transition">Start Free Trial <ArrowRight className="w-5 h-5" /></Link>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ — switching from MYOB</h2>
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
