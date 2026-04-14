import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, TrendingUp, ShieldCheck, Globe2, Zap, FileSearch, Calendar, Users } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';
import LegalDisclaimer from '@/components/LegalDisclaimer';

const FEATURES = [
  { category: 'Pricing' },
  { name: 'Entry price (monthly)', qbo: '$42 Simple Start', davenroe: '$49 Solo', win: 'tie' },
  { name: 'Practice tier + Payroll (post-May 2026)', qbo: '$170-$215/mo', davenroe: '$149/mo all-inclusive', win: 'davenroe', note: 'Save up to $66/mo' },
  { name: 'Price-increase history', qbo: '15-25% hike May 2026', davenroe: '12-month price lock', win: 'davenroe' },
  { name: 'Add-ons required for parity', qbo: 'Dext ($30) + Fathom ($50) + Chaser ($40) + Gusto ($125)', davenroe: 'All included', win: 'davenroe', note: '$245/mo of add-ons gone' },

  { category: 'Unique DavenRoe Moats' },
  { name: 'Forensic intelligence (Benford\'s, ghost vendor, money trail)', qbo: false, davenroe: true, win: 'davenroe' },
  { name: 'Cross-border tax treaty engine (6 bilateral DTAs)', qbo: false, davenroe: true, win: 'davenroe' },
  { name: 'Multi-jurisdiction filing in ONE subscription', qbo: false, davenroe: 'AU / NZ / UK / US', win: 'davenroe' },
  { name: 'Native payroll countries', qbo: '2-3 (fragmented)', davenroe: '4 (AU / NZ / UK / US)', win: 'davenroe' },
  { name: 'Autonomous month-end close (seconds)', qbo: false, davenroe: '4.2s avg', win: 'davenroe' },
  { name: 'AI review queue with confidence scoring', qbo: false, davenroe: true, win: 'davenroe' },
  { name: 'Catch-up wizard for years-behind businesses', qbo: false, davenroe: true, win: 'davenroe' },
  { name: 'Compliance calendar (40+ deadlines across 4 jurisdictions)', qbo: false, davenroe: true, win: 'davenroe' },
  { name: 'Forensic audit pack generation', qbo: false, davenroe: true, win: 'davenroe' },

  { category: 'QuickBooks Still Leads' },
  { name: 'App marketplace size', qbo: '~750 apps', davenroe: '22 (growing fast)', win: 'qbo' },
  { name: 'Accountant/ProAdvisor network', qbo: '500K+ ProAdvisors', davenroe: 'Growing (free Practice tier for accountants)', win: 'qbo' },
  { name: 'Mobile native iOS + Android', qbo: '4.7★ App Store, 3.9★ Google', davenroe: 'PWA today, native in dev', win: 'qbo' },
  { name: 'Legacy customer history', qbo: '20+ years', davenroe: 'New and hungry', win: 'qbo' },

  { category: 'AI Capability' },
  { name: 'AI depth', qbo: 'Intuit Assist (5 agents, tier-gated)', davenroe: 'Multi-agent orchestrator (7 agents, all tiers)', win: 'davenroe' },
  { name: 'Autonomous actions', qbo: 'Limited to tier, read-mostly', davenroe: 'AI drafts, human approves on all transactions', win: 'davenroe' },
  { name: 'Natural language queries', qbo: 'Intuit Assist chat', davenroe: 'Ask DavenRoe + AI Command Center', win: 'tie' },

  { category: 'Support' },
  { name: 'Phone support', qbo: 'Poor (common complaint)', davenroe: 'Accountant concierge on Practice tier', win: 'davenroe' },
  { name: 'Free trial length', qbo: '30 days', davenroe: '30 days', win: 'tie' },
];

const FAQS = [
  { q: 'How does DavenRoe handle QuickBooks data migration?', a: 'OAuth to your QuickBooks account, we pull your chart of accounts, contacts, 12 months of invoices, bills, and bank transactions automatically. Attachments (receipts, supporting docs) come with them. AI pre-maps your fields — you confirm in 15 seconds. Most migrations complete in under a minute.' },
  { q: 'What about my ProAdvisor?', a: 'Your ProAdvisor can keep using DavenRoe alongside QuickBooks for other clients. We offer a free DavenRoe Practice tier to any certified accountant. If they want to move you too, our accountant concierge walks them through setup at no cost.' },
  { q: 'Will my bank feeds still work?', a: 'Yes. We use Plaid (US/CA), Basiq (AU/NZ), and TrueLayer (UK/EU) — the same bank-feed providers or better than QuickBooks. Most banks reconnect in under 2 minutes.' },
  { q: 'What happens to my historical transactions?', a: 'Everything transfers with original timestamps, original user IDs, and original references preserved. You can run reports spanning your pre-DavenRoe history seamlessly. If you need older data too, our catch-up wizard reconstructs from bank statements going back years.' },
  { q: 'Can I trial both side-by-side?', a: 'Yes. DavenRoe runs alongside QuickBooks during your 30-day trial. Export from QBO whenever you want — we never lock your data. Cancel QuickBooks only when you\'re confident.' },
];

export default function CompareQuickBooks() {
  useEffect(() => {
    document.title = 'DavenRoe vs QuickBooks | Full Feature Comparison & Savings Calculator';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'DavenRoe vs QuickBooks Online April 2026: full feature comparison. Save $66/month after QuickBooks May 2026 price hike, get forensic intelligence + 4-country payroll + catch-up wizard that QuickBooks will never have.');
  }, []);

  const renderCell = (value) => {
    if (value === true) return <Check className="w-5 h-5 text-green-600 mx-auto" />;
    if (value === false) return <X className="w-5 h-5 text-red-500 mx-auto" />;
    return <span className="text-sm text-gray-700">{value}</span>;
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Product',
        name: 'DavenRoe vs QuickBooks',
        description: 'Head-to-head comparison: DavenRoe AI-native accounting platform vs QuickBooks Online. Multi-jurisdiction tax filing, forensic intelligence, native 4-country payroll, catch-up rescue.',
        brand: { '@type': 'Brand', name: 'DavenRoe' },
        url: 'https://davenroe.com/compare/quickbooks',
      })}} />

      <section className="bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs font-medium mb-6">QUICKBOOKS PRICE HIKE • MAY 1, 2026</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">The QuickBooks Alternative That Ships<br /><span className="text-davenRoe-400">Payroll, Tax Filing and Forensic Intelligence</span><br />in One Subscription</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">QuickBooks Online is raising prices 15-25% in May 2026. DavenRoe replaces QuickBooks + Payroll + Dext + Fathom + Float for <span className="text-white font-semibold">$66/month less</span> — and adds forensic fraud detection you can't buy anywhere else.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/migrate/from-quickbooks" className="inline-flex items-center justify-center gap-2 bg-davenRoe-600 hover:bg-davenRoe-700 text-white font-semibold py-3 px-6 rounded-lg transition">Start 60-Second Migration <ArrowRight className="w-5 h-5" /></Link>
            <a href="#comparison" className="inline-flex items-center justify-center gap-2 border border-gray-600 hover:border-gray-400 text-gray-200 font-semibold py-3 px-6 rounded-lg transition">See Live Comparison</a>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-green-50 to-emerald-50 border-y border-green-200 py-12 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 text-center">
          <div><div className="text-3xl md:text-4xl font-bold text-gray-900">$792</div><div className="text-sm text-gray-600 mt-1">Saved per year vs QBO Plus + Payroll (post-May 2026)</div></div>
          <div><div className="text-3xl md:text-4xl font-bold text-gray-900">6</div><div className="text-sm text-gray-600 mt-1">Other tools DavenRoe replaces (Dext, Fathom, Gusto, Chaser, Float, more)</div></div>
          <div><div className="text-3xl md:text-4xl font-bold text-gray-900">13</div><div className="text-sm text-gray-600 mt-1">Capabilities where DavenRoe beats QuickBooks outright</div></div>
        </div>
      </section>

      <section id="comparison" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Feature-by-Feature Comparison</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Every capability that matters, head-to-head. Data current as of April 2026.</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Capability</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider w-48">QuickBooks Online</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-davenRoe-700 uppercase tracking-wider bg-davenRoe-50 w-48">DavenRoe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {FEATURES.map((row, i) => {
                  if (row.category) {
                    return (<tr key={i} className="bg-gray-100"><td colSpan={3} className="py-2 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">{row.category}</td></tr>);
                  }
                  return (
                    <tr key={i} className={row.win === 'davenroe' ? 'bg-green-50/30' : 'hover:bg-gray-50'}>
                      <td className="py-3 px-4 text-sm text-gray-900">{row.name}{row.note && <span className="block text-xs text-green-700 font-medium mt-1">{row.note}</span>}</td>
                      <td className="py-3 px-4 text-center">{renderCell(row.qbo)}</td>
                      <td className="py-3 px-4 text-center bg-davenRoe-50/50">{renderCell(row.davenroe)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">What DavenRoe Has That QuickBooks <span className="text-davenRoe-700">Will Never Build</span></h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">These aren't features on a roadmap. These are capabilities in production today.</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><FileSearch className="w-8 h-8 text-davenRoe-600 mb-3" /><h3 className="text-lg font-bold mb-2">Forensic Intelligence</h3><p className="text-sm text-gray-600">Benford's Law analysis, ghost vendor detection, money trail, payroll cross-reference. Built into every tier. Zero competitors have this at any price.</p></div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><Globe2 className="w-8 h-8 text-davenRoe-600 mb-3" /><h3 className="text-lg font-bold mb-2">Cross-Border Tax Treaties</h3><p className="text-sm text-gray-600">6 bilateral DTAs built into our tax engine (US-AU, US-NZ, US-GB, AU-NZ, AU-GB, NZ-GB). Automatic WHT optimization for cross-border businesses.</p></div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><ShieldCheck className="w-8 h-8 text-davenRoe-600 mb-3" /><h3 className="text-lg font-bold mb-2">Multi-Jurisdiction Payroll</h3><p className="text-sm text-gray-600">AU, NZ, UK, US native payroll in one subscription. QuickBooks fragments this across 3 separate products with 3 separate bills.</p></div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><Zap className="w-8 h-8 text-davenRoe-600 mb-3" /><h3 className="text-lg font-bold mb-2">Autonomous Month-End Close</h3><p className="text-sm text-gray-600">4.2 seconds average. QuickBooks month-end is manual. Sage Copilot comes close — but only on Intacct at $25K/year and up.</p></div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><Calendar className="w-8 h-8 text-davenRoe-600 mb-3" /><h3 className="text-lg font-bold mb-2">Catch-Up Wizard</h3><p className="text-sm text-gray-600">Years behind on GST, BAS, or VAT? Upload bank statements, get a rescue plan in 60 seconds. QuickBooks has no equivalent — this is a new category.</p></div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><TrendingUp className="w-8 h-8 text-davenRoe-600 mb-3" /><h3 className="text-lg font-bold mb-2">Compliance Calendar</h3><p className="text-sm text-gray-600">40+ deadlines across 4 jurisdictions tracked automatically. QuickBooks users keep external spreadsheets. DavenRoe replaces the spreadsheet.</p></div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">What QuickBooks Still Does Better</h2>
          <p className="text-gray-600 text-center mb-12">We're going to tell you the truth. These are their genuine moats.</p>
          <div className="space-y-4">
            <div className="flex gap-4 items-start bg-gray-50 rounded-lg p-5 border border-gray-200"><Users className="w-6 h-6 text-gray-600 shrink-0 mt-0.5" /><div><h4 className="font-semibold text-gray-900">500,000+ ProAdvisors</h4><p className="text-sm text-gray-600 mt-1">QuickBooks has 20 years of accountant loyalty. We're building our partner program now with outcome-based revenue share. We'll close this gap — but today, QuickBooks has the density of local accountants who know their product.</p></div></div>
            <div className="flex gap-4 items-start bg-gray-50 rounded-lg p-5 border border-gray-200"><div className="w-6 h-6 rounded-full bg-gray-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">A</div><div><h4 className="font-semibold text-gray-900">~750 apps in their marketplace</h4><p className="text-sm text-gray-600 mt-1">We have 22 integrations today, targeting 200 by end of Q4 2026. Our public REST API launches this quarter. If a specific integration is critical for your business, check our marketplace first.</p></div></div>
            <div className="flex gap-4 items-start bg-gray-50 rounded-lg p-5 border border-gray-200"><div className="w-6 h-6 rounded-full bg-gray-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">M</div><div><h4 className="font-semibold text-gray-900">Native mobile apps</h4><p className="text-sm text-gray-600 mt-1">QuickBooks iOS app averages 4.7 stars. DavenRoe ships a Progressive Web App today with offline support and receipt capture. Native iOS and Android apps are in development — we'll ship them this year.</p></div></div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 px-6">
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

      <section className="bg-gradient-to-br from-davenRoe-700 to-indigo-900 text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Migrate from QuickBooks in 60 Seconds</h2>
          <p className="text-lg text-indigo-100 mb-8">Zero data loss. All history preserved. We'll even reimburse your last QuickBooks bill.</p>
          <Link to="/migrate/from-quickbooks" className="inline-flex items-center gap-2 bg-white text-davenRoe-700 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition">Start Migration Now <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </section>

      <div className="bg-gray-100 py-6 px-6">
        <div className="max-w-4xl mx-auto"><LegalDisclaimer variant="general" /></div>
      </div>
    </div>
  );
}
