import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import LegalDisclaimer from '@/components/LegalDisclaimer';

/**
 * /au — Australia localised landing page.
 *
 * AUD pricing, ATO references, GST 10%, BAS, STP, PAYG,
 * AU-specific pain points, competitor teardowns (Xero AU, MYOB).
 */

const HERO_STATS = [
  { value: '10%', label: 'AU GST calculated automatically' },
  { value: '4.2s', label: 'Average month-end close time' },
  { value: 'A$54', label: 'AUD/mo founding member price' },
  { value: '40+', label: 'ATO deadlines tracked for you' },
];

const PAIN_POINTS = [
  {
    title: 'BAS lodgement nightmare?',
    desc: 'DavenRoe auto-drafts your quarterly BAS from bank transactions. AI validates against ATO rules before your accountant sees it. Multi-year BAS catch-up if you\'re behind — we reconstruct every missed quarter.',
    cta: 'Try the catch-up wizard',
    href: '/catch-up',
  },
  {
    title: 'Paying Xero + MYOB + add-ons?',
    desc: 'Australian practices spend A$300-500/month on Xero Premium + payroll add-on + Dext + Fathom + Float. DavenRoe includes all of it — payroll, STP, receipt capture, reporting, forensics — for A$164/mo.',
    cta: 'See the savings calculator',
    href: '/migrate/from-xero',
  },
  {
    title: 'STP, PAYG, Super — drowning in compliance?',
    desc: 'BAS quarterly, PAYG instalments, STP pay events, Superannuation Guarantee quarterly, FBT annual — DavenRoe tracks every ATO deadline and alerts you at 30, 14, 7, 3, and 1 day out.',
    cta: 'View compliance calendar',
    href: '/catch-up',
  },
];

const FEATURES_AU = [
  { name: 'BAS preparation (quarterly)', included: true },
  { name: 'Company tax return preparation', included: true },
  { name: 'Individual tax return preparation', included: true },
  { name: 'PAYG income tax instalments', included: true },
  { name: 'PAYG withholding', included: true },
  { name: 'Single Touch Payroll (STP)', included: true },
  { name: 'Superannuation Guarantee (11.5%)', included: true },
  { name: 'FBT return preparation', included: true },
  { name: 'Payroll tax (state-based)', included: true },
  { name: 'ATO deadline tracking (all filing types)', included: true },
  { name: 'Multi-year BAS catch-up reconstruction', included: true },
  { name: '"Get Ready for Accountant" pack', included: true },
  { name: 'AU bank feeds via Basiq (CBA, Westpac, ANZ, NAB)', included: true },
  { name: 'Forensic intelligence (Benford\'s, ghost vendor detection)', included: true },
  { name: 'Autonomous month-end close', included: true },
  { name: 'Email harvester (inbox → GST-calculated draft)', included: true },
];

const PRICING_AU = [
  {
    name: 'Solo',
    price: 'A$54',
    period: '/mo AUD',
    note: 'Founding member price — normally A$65',
    target: 'Sole traders + contractors',
    features: ['Unlimited invoicing', 'BAS preparation', 'Bank feeds', 'AI categorisation', 'Receipt capture', 'Individual tax return prep'],
  },
  {
    name: 'Practice',
    price: 'A$164',
    period: '/mo AUD',
    note: 'Founding member price — normally A$197',
    target: 'Accounting practices (1-10 staff)',
    popular: true,
    features: ['Everything in Solo', 'Payroll + STP (unlimited employees)', 'Multi-entity (one subscription)', 'Forensic intelligence', 'Client portal', 'Compliance calendar', '"Get Ready for Accountant" pack', 'Priority support'],
  },
  {
    name: 'Firm',
    price: 'A$549',
    period: '/mo AUD',
    note: 'Founding member price — normally A$659',
    target: 'Multi-jurisdiction firms',
    features: ['Everything in Practice', 'NZ + UK + US jurisdictions', 'Cross-border tax treaties', 'White-label branding', 'Dedicated onboarding', 'API access'],
  },
];

const COMPARE_XERO = [
  { feature: 'Monthly price (full features + payroll, 5 emp)', xero: 'A$79 + A$65', davenroe: 'A$164 flat' },
  { feature: 'Multi-entity', xero: 'A$79 per entity', davenroe: 'Included' },
  { feature: 'Forensic fraud detection', xero: 'Not available', davenroe: 'Included' },
  { feature: 'Autonomous month-end close', xero: 'Not available', davenroe: '4.2 seconds' },
  { feature: 'BAS catch-up (years behind)', xero: 'Not available', davenroe: 'Included' },
  { feature: 'AI that takes actions', xero: 'Read-only beta', davenroe: '7 autonomous agents' },
  { feature: 'Email → ledger pipeline', xero: 'Not available', davenroe: 'Included' },
  { feature: 'STP included', xero: 'Payroll add-on required', davenroe: 'Included' },
];

export default function Australia() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
    document.title = 'DavenRoe AU — AI Accounting Software for Australia | BAS, STP, Payroll';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'DavenRoe: AI-powered accounting software built for Australia. BAS preparation, STP, PAYG, Superannuation, compliance calendar. Replaces Xero + MYOB + Dext + Fathom for A$164/mo AUD. Try free for 30 days.');

    // SEO: canonical + hreflang for multi-domain setup
    const setLink = (rel, href, hreflang) => {
      let el = document.querySelector(`link[hreflang="${hreflang || ''}"][rel="${rel}"]`) || document.createElement('link');
      el.setAttribute('rel', rel);
      el.setAttribute('href', href);
      if (hreflang) el.setAttribute('hreflang', hreflang);
      if (!el.parentNode) document.head.appendChild(el);
    };
    setLink('canonical', 'https://davenroe.com.au', '');
    setLink('alternate', 'https://davenroe.co.nz', 'en-NZ');
    setLink('alternate', 'https://davenroe.com.au', 'en-AU');
    setLink('alternate', 'https://davenroe.com', 'x-default');
  }, []);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'DavenRoe', applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '54', priceCurrency: 'AUD', description: 'Founding member pricing' },
        description: 'AI-powered accounting software for Australian businesses. BAS, STP, payroll, forensic intelligence.',
        url: 'https://davenroe.com/au',
      })}} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 text-white min-h-[80vh] flex flex-col">
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-blue-300 uppercase tracking-widest mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Live in Australia
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
              AI accounting built for<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Australian businesses</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
              BAS preparation, STP, PAYG, Superannuation Guarantee, FBT — all
              calculated automatically with 7 AI agents. Replaces Xero + MYOB +
              Dext + Fathom. Built with ATO compliance from day one.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link to="/catch-up" className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-500 transition shadow-lg shadow-blue-500/25">
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
          <h2 className="text-3xl font-bold text-center mb-4">Built for Australian problems</h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">These are the compliance headaches Australian businesses and accountants face daily. DavenRoe solves all of them.</p>
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

      {/* AU FEATURES */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Every ATO obligation, covered</h2>
          <p className="text-center text-gray-500 mb-12">All included in every plan. No add-ons.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURES_AU.map((f) => (
              <div key={f.name} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <Check className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-sm text-gray-700">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* XERO / MYOB COMPARISON */}
      <section className="py-20 px-6 bg-[#08090d] text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">DavenRoe vs Xero in Australia</h2>
          <p className="text-center text-gray-400 mb-12">Side by side. No spin.</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-4 px-6 font-semibold text-gray-400">Feature</th>
                  <th className="py-4 px-4 text-center font-semibold text-gray-500">Xero</th>
                  <th className="py-4 px-4 text-center font-semibold text-blue-400">DavenRoe</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_XERO.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.04] last:border-0">
                    <td className="py-3 px-6 text-gray-300">{row.feature}</td>
                    <td className="py-3 px-4 text-center text-gray-500">{row.xero}</td>
                    <td className="py-3 px-4 text-center text-blue-300 font-medium">{row.davenroe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-8 flex justify-center gap-6">
            <Link to="/compare/xero" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Full Xero comparison →</Link>
            <Link to="/compare/myob" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Full MYOB comparison →</Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">AU pricing — GST inclusive</h2>
          <p className="text-center text-gray-500 mb-12">Founding member pricing locked for 12 months. First 100 customers only.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_AU.map((tier) => (
              <div key={tier.name} className={`rounded-2xl border p-6 flex flex-col ${tier.popular ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20' : 'border-gray-200 bg-white'}`}>
                {tier.popular && <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Most popular</span>}
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{tier.target}</p>
                <div className="mt-4 mb-1">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-500 text-sm">{tier.period}</span>
                </div>
                <p className="text-[10px] text-blue-600 font-medium mb-4">{tier.note}</p>
                <ul className="space-y-2 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-blue-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/catch-up" className={`mt-6 block text-center py-3 rounded-lg text-sm font-semibold transition ${tier.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">All prices in AUD, GST inclusive. 30-day free trial on all plans. Cancel anytime.</p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-blue-600 to-cyan-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to simplify your accounting?</h2>
        <p className="text-lg text-blue-100 max-w-xl mx-auto mb-8">
          Start your 30-day free trial. No credit card required. Migrate from Xero or MYOB in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/catch-up" className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold py-3.5 px-8 rounded-lg hover:bg-blue-50 transition">
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
        <p className="text-xs">DavenRoe is not a registered tax agent. All tax calculations should be reviewed by a qualified accountant before lodgement with the ATO.</p>
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
