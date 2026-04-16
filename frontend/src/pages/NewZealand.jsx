import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import LegalDisclaimer from '@/components/LegalDisclaimer';

/**
 * /nz — New Zealand localised landing page.
 *
 * NZD pricing, IRD references, GST 15%, NZ-specific pain points,
 * NZ-specific competitor teardowns (Xero NZ, MYOB NZ), NZ testimonials.
 * Public marketing page — no login required.
 */

const HERO_STATS = [
  { value: '15%', label: 'NZ GST calculated automatically' },
  { value: '4.2s', label: 'Average month-end close time' },
  { value: '$49', label: 'NZD/mo founding member price' },
  { value: '40+', label: 'IRD deadlines tracked for you' },
];

const PAIN_POINTS = [
  {
    title: 'Years behind on GST?',
    desc: 'DavenRoe reconstructs every missed 2-monthly GST return from your bank statements. 5 years of overdue IRD filings prepared in minutes, not weeks. Your accountant gets a ready-to-lodge pack.',
    cta: 'Try the catch-up wizard',
    href: '/catch-up',
  },
  {
    title: 'Paying for Xero + Dext + Fathom?',
    desc: 'NZ accountants spend $200-400/month across Xero, payroll add-ons, Dext for receipts, and Fathom for reports. DavenRoe includes all of it — payroll, document capture, reporting, forensics — for $149/mo.',
    cta: 'See the savings calculator',
    href: '/migrate/from-xero',
  },
  {
    title: 'IRD deadlines keeping you up?',
    desc: 'GST returns, provisional tax, PAYE, FBT, IR3, IR4 — DavenRoe tracks 40+ IRD deadlines and alerts you at 30, 14, 7, 3, and 1 day. Never pay a late filing penalty again.',
    cta: 'View compliance calendar',
    href: '/catch-up',
  },
];

const FEATURES_NZ = [
  { name: 'GST returns (2-monthly, 6-monthly)', included: true },
  { name: 'Income tax (IR3 individuals, IR4 companies)', included: true },
  { name: 'Provisional tax (standard uplift method)', included: true },
  { name: 'PAYE employer deductions', included: true },
  { name: 'FBT quarterly returns', included: true },
  { name: 'KiwiSaver employer contributions (3-8%)', included: true },
  { name: 'ACC levy calculations', included: true },
  { name: 'IRD deadline tracking (all filing types)', included: true },
  { name: 'Multi-year catch-up reconstruction', included: true },
  { name: '"Get Ready for Accountant" pack', included: true },
  { name: 'NZ bank feeds via Basiq (ANZ, ASB, BNZ, Westpac, Kiwibank)', included: true },
  { name: 'Forensic intelligence (Benford\'s, ghost vendor detection)', included: true },
  { name: 'Autonomous month-end close', included: true },
  { name: 'Email harvester (inbox → GST-calculated draft)', included: true },
];

const PRICING_NZ = [
  {
    name: 'Solo',
    price: '$49',
    period: '/mo NZD',
    note: 'Founding member price — normally $59',
    target: 'Sole traders + freelancers',
    features: ['Unlimited invoicing', 'GST returns', 'Bank feeds', 'AI categorisation', 'Receipt capture', 'IR3 preparation'],
  },
  {
    name: 'Practice',
    price: '$149',
    period: '/mo NZD',
    note: 'Founding member price — normally $179',
    target: 'Accounting practices (1-10 staff)',
    popular: true,
    features: ['Everything in Solo', 'Payroll (unlimited employees)', 'Multi-entity', 'Forensic intelligence', 'Client portal', 'Compliance calendar', '"Get Ready for Accountant" pack', 'Priority support'],
  },
  {
    name: 'Firm',
    price: '$499',
    period: '/mo NZD',
    note: 'Founding member price — normally $599',
    target: 'Multi-jurisdiction firms',
    features: ['Everything in Practice', 'AU + UK + US jurisdictions', 'Cross-border tax treaties', 'White-label branding', 'Dedicated onboarding', 'API access'],
  },
];

const COMPARE_XERO = [
  { feature: 'Monthly price (full features + payroll)', xero: '$79 + $13/emp', davenroe: '$149 flat' },
  { feature: 'Multi-entity', xero: '$79 per entity', davenroe: 'Included' },
  { feature: 'Forensic fraud detection', xero: 'Not available', davenroe: 'Included' },
  { feature: 'Autonomous month-end close', xero: 'Not available', davenroe: '4.2 seconds' },
  { feature: 'Catch-up (years behind)', xero: 'Not available', davenroe: 'Included' },
  { feature: 'AI that takes actions', xero: 'Read-only beta', davenroe: '7 autonomous agents' },
  { feature: 'Email → ledger pipeline', xero: 'Not available', davenroe: 'Included' },
  { feature: 'Compliance calendar', xero: 'Not available', davenroe: '40+ deadlines' },
];

export default function NewZealand() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
    document.title = 'DavenRoe NZ — AI Accounting Software for New Zealand | GST, IR3, Payroll';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'DavenRoe: AI-powered accounting software built for New Zealand. GST returns, IR3/IR4, provisional tax, PAYE, KiwiSaver, compliance calendar. Replaces Xero + Dext + Fathom for $149/mo NZD. Try free for 30 days.');
  }, []);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'DavenRoe', applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '49', priceCurrency: 'NZD', description: 'Founding member pricing' },
        description: 'AI-powered accounting software for New Zealand businesses. GST, IR3, payroll, forensic intelligence.',
        url: 'https://davenroe.com/nz',
      })}} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 text-white min-h-[80vh] flex flex-col">
        <nav className="flex items-center justify-between px-6 lg:px-16 py-6">
          <span style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl font-light italic tracking-wide text-white">DavenRoe</span>
          <div className="flex items-center gap-4">
            <Link to="/compare/xero" className="hidden md:inline text-sm text-white/50 hover:text-white">vs Xero</Link>
            <Link to="/compare/myob" className="hidden md:inline text-sm text-white/50 hover:text-white">vs MYOB</Link>
            <a href="#pricing" className="hidden md:inline text-sm text-white/50 hover:text-white">Pricing</a>
            <Link to="/" className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 border border-white/10">Sign In</Link>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 lg:px-16 pb-16">
          <div className="text-center max-w-4xl" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease-out' }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live in Aotearoa New Zealand
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
              AI accounting built for<br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">New Zealand businesses</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
              GST returns, IR3/IR4, provisional tax, PAYE, KiwiSaver, ACC — all
              calculated automatically with 7 AI agents. Replaces Xero + Dext +
              Fathom for a fraction of the price. Built with NZ tax law from day one.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link to="/catch-up" className="px-8 py-4 bg-emerald-600 text-white rounded-xl text-lg font-semibold hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/25">
                Start Free — 30 Days
              </Link>
              <Link to="/compare/xero" className="px-8 py-4 bg-white/[0.06] text-white rounded-xl text-lg font-semibold hover:bg-white/[0.12] border border-white/[0.08]">
                Compare to Xero
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {HERO_STATS.map((s) => (
                <div key={s.label} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/40 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Built for NZ problems</h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">These are the things NZ business owners and accountants deal with every day. DavenRoe solves all of them.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {PAIN_POINTS.map((p) => (
              <div key={p.title} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{p.desc}</p>
                <Link to={p.href} className="text-sm text-indigo-600 font-semibold mt-4 inline-flex items-center gap-1 hover:text-indigo-800">
                  {p.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NZ FEATURES */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Every NZ tax obligation, covered</h2>
          <p className="text-center text-gray-500 mb-12">All included in every plan. No add-ons.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURES_NZ.map((f) => (
              <div key={f.name} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-gray-700">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* XERO COMPARISON */}
      <section className="py-20 px-6 bg-[#08090d] text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">DavenRoe vs Xero in New Zealand</h2>
          <p className="text-center text-gray-400 mb-12">Side by side. No spin.</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-4 px-6 font-semibold text-gray-400">Feature</th>
                  <th className="py-4 px-4 text-center font-semibold text-gray-500">Xero</th>
                  <th className="py-4 px-4 text-center font-semibold text-emerald-400">DavenRoe</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_XERO.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.04] last:border-0">
                    <td className="py-3 px-6 text-gray-300">{row.feature}</td>
                    <td className="py-3 px-4 text-center text-gray-500">{row.xero}</td>
                    <td className="py-3 px-4 text-center text-emerald-300 font-medium">{row.davenroe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-8">
            <Link to="/compare/xero" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
              See full 30-row comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">NZ pricing — GST inclusive</h2>
          <p className="text-center text-gray-500 mb-12">Founding member pricing locked for 12 months. First 100 customers only.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_NZ.map((tier) => (
              <div key={tier.name} className={`rounded-2xl border p-6 flex flex-col ${tier.popular ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20' : 'border-gray-200 bg-white'}`}>
                {tier.popular && <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">Most popular</span>}
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{tier.target}</p>
                <div className="mt-4 mb-1">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-500 text-sm">{tier.period}</span>
                </div>
                <p className="text-[10px] text-indigo-600 font-medium mb-4">{tier.note}</p>
                <ul className="space-y-2 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/catch-up" className={`mt-6 block text-center py-3 rounded-lg text-sm font-semibold transition ${tier.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">All prices in NZD, GST inclusive. 30-day free trial on all plans. Cancel anytime.</p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to simplify your accounting?</h2>
        <p className="text-lg text-emerald-100 max-w-xl mx-auto mb-8">
          Start your 30-day free trial. No credit card required. Migrate from Xero in 60 seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/catch-up" className="inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold py-3.5 px-8 rounded-lg hover:bg-emerald-50 transition">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/migrate/from-xero" className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold py-3.5 px-8 rounded-lg hover:bg-white/10 transition">
            Migrate from Xero
          </Link>
        </div>
      </section>

      <LegalDisclaimer />

      <footer className="bg-[#08090d] text-gray-500 py-12 px-6 text-center">
        <p className="text-sm mb-2">&copy; 2026 DavenRoe Limited. All rights reserved.</p>
        <p className="text-xs">DavenRoe is not a registered tax agent. All tax calculations should be reviewed by a qualified accountant before lodgement with IRD.</p>
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <Link to="/terms" className="hover:text-white">Terms</Link>
          <Link to="/privacy" className="hover:text-white">Privacy</Link>
          <Link to="/ai-disclosure" className="hover:text-white">AI Disclosure</Link>
          <Link to="/contact" className="hover:text-white">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
