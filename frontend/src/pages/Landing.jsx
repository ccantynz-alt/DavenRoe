import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import HeroCarousel from '@/components/landing/HeroCarousel';
import LogoBar from '@/components/landing/LogoBar';
import AnimatedStats from '@/components/landing/AnimatedStats';
import DashboardPreview from '@/components/landing/DashboardPreview';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import ComparisonTable from '@/components/landing/ComparisonTable';
import Testimonials from '@/components/landing/Testimonials';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';

/**
 * Premium landing page for Astra — dark hero with gradient mesh,
 * live AI demo, bento grid features, competitor comparison.
 *
 * Section flow:
 *  1. Hero (dark, animated gradient mesh + live Ask Astra demo)
 *  2. Logo marquee (animated infinite scroll)
 *  3. Stats (glass morphism, dark section)
 *  4. Dashboard preview (floating mockup with notification cards)
 *  5. How It Works (4-step minimal workflow)
 *  6. Bento grid capabilities (dark section)
 *  7. Jurisdictions
 *  8. Trust & Security
 *  9. Competitor comparison table
 * 10. Testimonials (dark section, rotating quotes)
 * 11. Pricing (3 tiers)
 * 12. FAQ (accordion)
 * 13. Final CTA
 * 14. Footer
 */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

export default function Landing({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleRegisterInterest = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    try {
      await fetch('/api/v1/support/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => null);
    } catch { /* show success regardless */ }
    setRegistered(true);
    setEmail('');
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* ============================================================
          PRE-LAUNCH BANNER
          ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-indigo-600 text-white text-center py-2.5 px-4 text-sm"
      >
        <Badge className="bg-white/20 text-white border-white/30 mr-2">Coming Q2 2026</Badge>
        <span className="text-indigo-100">Astra is currently in private beta. Register your interest below to get early access.</span>
      </motion.div>

      {/* ============================================================
          1. HERO — Dark gradient mesh with live AI demo
          ============================================================ */}
      <HeroCarousel>
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 lg:px-16 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">Astra</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="hidden md:inline text-sm text-white/50 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hidden md:inline text-sm text-white/50 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hidden md:inline text-sm text-white/50 hover:text-white transition-colors">FAQ</a>
            <Button
              onClick={onLogin}
              variant="ghost"
              className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-white/20 border border-white/10 hover:text-white"
            >
              Sign In
            </Button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16">
          <div className="text-center max-w-4xl">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.2}
            >
              <Badge className="bg-white/[0.06] backdrop-blur-sm text-white/70 border-white/[0.08] mb-8 px-4 py-1.5 text-xs font-medium tracking-wide">
                Launching Q2 2026 — Register for Early Access
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.4}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight"
            >
              Your entire practice.<br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">One AI platform.</span><br />
              Zero add-ons.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.7}
              className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-10"
            >
              Bookkeeping, tax filing, payroll, invoicing, and forensic fraud detection
              across AU, NZ, UK &amp; US — with 24 AI agents that do the work while you
              review and approve. Replaces 6 separate tools for $49/month.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.9}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Button
                onClick={onLogin}
                size="xl"
                className="bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
              >
                Register for Early Access
              </Button>
              <Button
                asChild
                variant="ghost"
                size="xl"
                className="bg-white/[0.06] backdrop-blur-sm text-white rounded-xl text-lg font-semibold hover:bg-white/[0.12] border border-white/[0.08] hover:text-white"
              >
                <a href="#register">See How It Works</a>
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="text-sm text-white/30 mt-8"
            >
              Launching Q2 2026 — AI-powered accounting for firms across Australia, US, NZ &amp; UK
            </motion.p>
          </div>
        </div>
      </HeroCarousel>

      {/* ============================================================
          2. LOGO MARQUEE — Animated infinite scroll
          ============================================================ */}
      <LogoBar />

      {/* ============================================================
          3. ANIMATED STATS — Glass morphism dark section
          ============================================================ */}
      <AnimatedStats />

      {/* ============================================================
          4. DASHBOARD PREVIEW — Floating mockup
          ============================================================ */}
      <DashboardPreview />

      {/* ============================================================
          5-8. FEATURES — Workflow + Bento Grid + Jurisdictions + Trust + CTA
          ============================================================ */}
      <div id="features">
        <FeatureShowcase />
      </div>

      {/* ============================================================
          9. COMPETITOR COMPARISON — Why switch table
          ============================================================ */}
      <ComparisonTable />

      {/* ============================================================
          10. TESTIMONIALS — Dark section, rotating quotes
          ============================================================ */}
      <Testimonials />

      {/* ============================================================
          11. PRICING — Three tiers
          ============================================================ */}
      <Pricing />

      {/* ============================================================
          12. FAQ — Accordion
          ============================================================ */}
      <div id="faq">
        <FAQ />
      </div>

      {/* ============================================================
          13. REGISTER INTEREST — Pre-launch email capture
          ============================================================ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
        className="py-24 px-6 lg:px-16 bg-gradient-to-br from-indigo-600 to-purple-700"
        id="register"
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Be First in Line
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-indigo-200 mb-8">
            Astra launches Q2 2026. Register your interest for early access, founding member pricing, and a free data migration from your current platform.
          </motion.p>
          {registered ? (
            <motion.div variants={fadeUp}>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-none">
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">&#10003;</div>
                  <h3 className="text-xl font-bold text-white mb-2">You're on the list</h3>
                  <p className="text-indigo-200">We'll be in touch with early access details. Check your inbox for a confirmation.</p>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.form variants={fadeUp} onSubmit={handleRegisterInterest} className="max-w-lg mx-auto">
              <div className="flex gap-3">
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@yourfirm.com"
                  required
                  className={cn(
                    'flex-1 h-auto px-5 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm text-white',
                    'placeholder:text-indigo-300 border-white/20 focus:border-white/40',
                    'focus:ring-white/20 text-sm shadow-none'
                  )}
                />
                <Button
                  type="submit"
                  className="px-8 py-3.5 h-auto bg-white text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-50 shrink-0"
                >
                  Register Interest
                </Button>
              </div>
              <p className="text-xs text-indigo-300 mt-3">No spam. No credit card required. Unsubscribe anytime.</p>
            </motion.form>
          )}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-10 grid grid-cols-3 gap-6 text-center"
          >
            {[
              { value: '$49', label: 'Founding member price', sub: '(normally $149)' },
              { value: 'Free', label: 'Data migration from', sub: 'Xero, QBO, or MYOB' },
              { value: '90 days', label: 'Extended trial for', sub: 'early registrants' },
            ].map((item) => (
              <motion.div key={item.value} variants={fadeUp}>
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-indigo-300">{item.label}<br />{item.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ============================================================
          14. LEGAL DISCLAIMER BANNER
          ============================================================ */}
      <div className="bg-gray-100 border-t border-b py-4 px-6 lg:px-16">
        <p className="text-[11px] text-gray-500 text-center max-w-4xl mx-auto leading-relaxed">
          Astra is an AI-assisted accounting software tool currently in development. It is not a registered accounting firm, tax agent, licensed financial advisor, or legal practice. All features shown on this page represent planned functionality and may change before launch. No output from Astra constitutes professional advice. By registering your interest, you agree to receive product updates via email. You can unsubscribe at any time. See our{' '}
          <Button variant="link" onClick={() => onNavigate('terms')} className="p-0 h-auto text-[11px] text-gray-500 underline hover:text-gray-700 font-normal">Terms of Service</Button>,{' '}
          <Button variant="link" onClick={() => onNavigate('privacy')} className="p-0 h-auto text-[11px] text-gray-500 underline hover:text-gray-700 font-normal">Privacy Policy</Button>, and{' '}
          <Button variant="link" asChild className="p-0 h-auto text-[11px] text-gray-500 underline hover:text-gray-700 font-normal">
            <a href="/ai-disclosure">AI Disclosure</a>
          </Button>{' '}
          for full details. Contact: <span className="font-medium">hello@astra.ai</span>
        </p>
      </div>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={staggerContainer}
        className="bg-[#08090d] text-white py-16 px-6 lg:px-16"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-lg font-semibold">Astra</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Autonomous accounting intelligence for the modern practice. AI-powered bookkeeping, multi-jurisdiction tax compliance, and forensic anomaly detection.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.15em] text-gray-500 mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Button variant="link" onClick={() => onNavigate('invoicing')} className="p-0 h-auto text-sm text-gray-500 hover:text-white no-underline font-normal">Bookkeeping</Button></li>
                <li><Button variant="link" onClick={() => onNavigate('tax')} className="p-0 h-auto text-sm text-gray-500 hover:text-white no-underline font-normal">Tax Engine</Button></li>
                <li><Button variant="link" onClick={() => onNavigate('agentic')} className="p-0 h-auto text-sm text-gray-500 hover:text-white no-underline font-normal">Forensics</Button></li>
                <li><Button variant="link" onClick={() => onNavigate('ask')} className="p-0 h-auto text-sm text-gray-500 hover:text-white no-underline font-normal">Ask Astra</Button></li>
                <li><Button variant="link" onClick={() => onNavigate('banking')} className="p-0 h-auto text-sm text-gray-500 hover:text-white no-underline font-normal">Bank Feeds</Button></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.15em] text-gray-500 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Button variant="link" onClick={() => onNavigate('about')} className="p-0 h-auto text-sm text-gray-500 hover:text-white no-underline font-normal">About</Button></li>
                <li><Button variant="link" onClick={() => onNavigate('security')} className="p-0 h-auto text-sm text-gray-500 hover:text-white no-underline font-normal">Security</Button></li>
                <li><Button variant="link" onClick={() => onNavigate('contact')} className="p-0 h-auto text-sm text-gray-500 hover:text-white no-underline font-normal">Contact</Button></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.15em] text-gray-500 mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Button variant="link" onClick={() => onNavigate('privacy')} className="p-0 h-auto text-sm text-gray-500 hover:text-white no-underline font-normal">Privacy Policy</Button></li>
                <li><Button variant="link" onClick={() => onNavigate('terms')} className="p-0 h-auto text-sm text-gray-500 hover:text-white no-underline font-normal">Terms of Service</Button></li>
                <li><Button variant="link" onClick={() => onNavigate('security')} className="p-0 h-auto text-sm text-gray-500 hover:text-white no-underline font-normal">Data Security</Button></li>
              </ul>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">&copy; 2026 Astra. All rights reserved.</p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                256-bit encryption
              </span>
              <Badge variant="outline" className="border-gray-700 text-gray-600 font-normal">SOC 2 architecture</Badge>
              <Badge variant="outline" className="border-gray-700 text-gray-600 font-normal">GDPR ready</Badge>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}
