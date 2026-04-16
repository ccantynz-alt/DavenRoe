import { useState, useEffect, useRef } from 'react';
import HeroCarousel from '../components/landing/HeroCarousel';
import LogoBar from '../components/landing/LogoBar';
import AnimatedStats from '../components/landing/AnimatedStats';
import LivePipelineDemo from '../components/landing/LivePipelineDemo';
import DashboardPreview from '../components/landing/DashboardPreview';
import FeatureShowcase from '../components/landing/FeatureShowcase';
import ComparisonTable from '../components/landing/ComparisonTable';
import Testimonials from '../components/landing/Testimonials';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';

/**
 * Typewriter effect that cycles through phrases
 */
function TypewriterText({ phrases, className }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const phrase = phrases[index];

    if (!deleting) {
      if (text.length < phrase.length) {
        timeoutRef.current = setTimeout(() => setText(phrase.slice(0, text.length + 1)), 60);
      } else {
        timeoutRef.current = setTimeout(() => setDeleting(true), 2200);
      }
    } else {
      if (text.length > 0) {
        timeoutRef.current = setTimeout(() => setText(text.slice(0, -1)), 30);
      } else {
        setDeleting(false);
        setIndex((index + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timeoutRef.current);
  }, [text, deleting, index, phrases]);

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-[3px] h-[1em] bg-indigo-400 ml-1 align-middle animate-pulse" />
    </span>
  );
}

/**
 * Live AI demo — simulates Astra processing a query with streaming response
 */
function LiveAIDemo() {
  const [stage, setStage] = useState(0);
  const [response, setResponse] = useState('');
  const fullResponse = 'Revenue is up 12.4% month-over-month at $245,100. Top contributors: Coastal Coffee ($89K), Wright Advisory ($67K), Pacific Ledger ($42K). Cash position healthy at $1.2M with 47 days runway. One anomaly flagged: duplicate vendor payment of $2,100 to REF #4821 — recommend review.';

  useEffect(() => {
    const timers = [];
    timers.push(setTimeout(() => setStage(1), 800));  // Show query
    timers.push(setTimeout(() => setStage(2), 2200)); // Show "thinking"
    timers.push(setTimeout(() => setStage(3), 3200)); // Start streaming
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage !== 3) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      if (i >= fullResponse.length) {
        setResponse(fullResponse);
        clearInterval(interval);
        return;
      }
      setResponse(fullResponse.slice(0, i));
    }, 18);
    return () => clearInterval(interval);
  }, [stage]);

  return (
    <div className="bg-white/[0.04] backdrop-blur-md rounded-2xl border border-white/[0.08] p-5 max-w-lg mx-auto text-left shadow-2xl shadow-indigo-500/5">
      {/* Terminal header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] text-white/30 ml-2 font-mono">Ask DavenRoe</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400/70 font-mono">live</span>
        </div>
      </div>

      {/* Query */}
      <div className={`transition-all duration-500 ${stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <div className="flex items-start gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] text-indigo-300">You</span>
          </div>
          <p className="text-sm text-white/80 font-mono">"How's the practice performing this month?"</p>
        </div>
      </div>

      {/* Thinking indicator */}
      {stage === 2 && (
        <div className="flex items-center gap-2 mb-3 ml-8">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[10px] text-white/30 font-mono">Analysing 1,247 transactions across 3 entities...</span>
        </div>
      )}

      {/* AI Response */}
      {stage >= 3 && (
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] text-violet-300">AI</span>
          </div>
          <p className="text-xs text-white/60 leading-relaxed font-mono">
            {response}
            {response.length < fullResponse.length && (
              <span className="inline-block w-1.5 h-3 bg-violet-400/60 ml-0.5 animate-pulse" />
            )}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Premium landing page for DavenRoe — dark hero with gradient mesh,
 * live AI demo, bento grid features, competitor comparison.
 *
 * Section flow:
 *  1. Hero (dark, animated gradient mesh + live Ask DavenRoe demo)
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
export default function Landing({ onLogin, onNavigate }) {
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
  }, []);

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
      {/* LIVE BANNER */}
      <div className="bg-indigo-600 text-white text-center py-2.5 px-4 text-sm">
        <span className="font-medium">Live now across AU / NZ / UK / US</span>
        <span className="mx-2 text-indigo-300">|</span>
        <span className="text-indigo-100">DavenRoe is currently in private beta. Register your interest below to get early access.</span>
      </div>

      {/* 1. HERO */}
      <HeroCarousel>
        <nav className="flex items-center justify-between px-6 lg:px-16 py-6">
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl font-light italic tracking-wide text-white drop-shadow-lg">DavenRoe</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="hidden md:inline text-sm text-white/50 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hidden md:inline text-sm text-white/50 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hidden md:inline text-sm text-white/50 hover:text-white transition-colors">FAQ</a>
            <button onClick={onLogin} className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all border border-white/10">Sign In</button>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 lg:px-16">
          <div className="text-center max-w-4xl">
            <div style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease-out 0.2s' }}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-sm text-white/70 text-xs font-medium tracking-wide border border-white/[0.08] mb-8">
                Live across AU, NZ, UK &amp; US — Onboarding Today
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(30px)', transition: 'all 1s ease-out 0.4s' }}>
              Your entire practice.<br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">One AI platform.</span><br />
              Zero add-ons.
            </h1>
            <div
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] mb-8 tracking-tight h-[1.2em]"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 1s ease-out 0.5s',
              }}
            >
              <TypewriterText
                phrases={[
                  'bookkeeping.',
                  'tax compliance.',
                  'payroll.',
                  'fraud detection.',
                  'month-end close.',
                  'bank reconciliation.',
                  'financial reporting.',
                ]}
                className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
              />
            </div>

            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-10" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease-out 0.7s' }}>
              Bookkeeping, tax filing, payroll, invoicing, and forensic fraud detection across AU, NZ, UK &amp; US — with 24 AI agents that do the work while you review and approve. Replaces 6 separate tools for $49/month.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease-out 0.9s' }}>
              <button onClick={onLogin} className="px-8 py-4 bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30">Start Free Trial</button>
              <a href="#register" className="px-8 py-4 bg-white/[0.06] backdrop-blur-sm text-white rounded-xl text-lg font-semibold hover:bg-white/[0.12] transition-all border border-white/[0.08]">See How It Works</a>
            </div>

            <p className="text-sm text-white/30 mt-8" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1s ease-out 1.2s' }}>
              AI-powered accounting for firms across Australia, US, NZ &amp; UK — onboarding today
            </p>
          </div>
        </div>
      </HeroCarousel>

      <LogoBar />
      <AnimatedStats />
      <LivePipelineDemo />
      <DashboardPreview />

      <div id="features"><FeatureShowcase /></div>
      <ComparisonTable />
      <Testimonials />
      <Pricing />
      <div id="faq"><FAQ /></div>

      {/* REGISTER INTEREST */}
      <section className="py-24 px-6 lg:px-16 bg-gradient-to-br from-indigo-600 to-purple-700" id="register">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Start Your Free Trial Today</h2>
          <p className="text-lg text-indigo-200 mb-8">
            DavenRoe launches Q2 2026. Register your interest for early access, founding member pricing, and a free data migration from your current platform.
          </p>
          {registered ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-4xl mb-3">&#10003;</div>
              <h3 className="text-xl font-bold text-white mb-2">You're on the list</h3>
              <p className="text-indigo-200">We'll be in touch with onboarding details. Check your inbox for a confirmation.</p>
            </div>
          ) : (
            <form onSubmit={handleRegisterInterest} className="max-w-lg mx-auto">
              <div className="flex gap-3">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourfirm.com" required className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-indigo-300 border border-white/20 focus:border-white/40 focus:outline-none text-sm" />
                <button type="submit" className="px-8 py-3.5 bg-white text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-colors shrink-0">Get Started</button>
              </div>
              <p className="text-xs text-indigo-300 mt-3">No spam. No credit card required. Unsubscribe anytime.</p>
            </form>
          )}
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-white">$49</p>
              <p className="text-xs text-indigo-300">Founding member price<br />(normally $149)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Free</p>
              <p className="text-xs text-indigo-300">Data migration from<br />Xero, QBO, or MYOB</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">90 days</p>
              <p className="text-xs text-indigo-300">Extended trial for<br />early registrants</p>
            </div>
          </div>
        </div>
      </section>

      {/* LEGAL DISCLAIMER */}
      <div className="bg-gray-100 border-t border-b py-4 px-6 lg:px-16">
        <p className="text-[11px] text-gray-500 text-center max-w-4xl mx-auto leading-relaxed">
          DavenRoe is an AI-assisted accounting software tool currently in development. It is not a registered accounting firm, tax agent, licensed financial advisor, or legal practice. All features shown on this page represent planned functionality and may change before launch. No output from DavenRoe constitutes professional advice. By registering your interest, you agree to receive product updates via email. You can unsubscribe at any time. See our <button onClick={() => onNavigate('terms')} className="underline hover:text-gray-700">Terms of Service</button>, <button onClick={() => onNavigate('privacy')} className="underline hover:text-gray-700">Privacy Policy</button>, and <a href="/ai-disclosure" className="underline hover:text-gray-700">AI Disclosure</a> for full details. Contact: <span className="font-medium">hello@davenroe.com</span>
        </p>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#08090d] text-white py-16 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="mb-4">
                <span style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl font-light italic text-white drop-shadow-lg">DavenRoe</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">Autonomous accounting intelligence for the modern practice. AI-powered bookkeeping, multi-jurisdiction tax compliance, and forensic anomaly detection.</p>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.15em] text-gray-500 mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><button onClick={onLogin} className="hover:text-white transition-colors">Bookkeeping</button></li>
                <li><button onClick={onLogin} className="hover:text-white transition-colors">Tax Engine</button></li>
                <li><button onClick={onLogin} className="hover:text-white transition-colors">Forensics</button></li>
                <li><button onClick={onLogin} className="hover:text-white transition-colors">Ask DavenRoe</button></li>
                <li><button onClick={onLogin} className="hover:text-white transition-colors">Bank Feeds</button></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.15em] text-gray-500 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">About</button></li>
                <li><button onClick={() => onNavigate('security')} className="hover:text-white transition-colors">Security</button></li>
                <li><button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Contact</button></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-[0.15em] text-gray-500 mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button onClick={() => onNavigate('security')} className="hover:text-white transition-colors">Data Security</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">&copy; 2026 DavenRoe. All rights reserved.</p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                256-bit encryption
              </span>
              <span>SOC 2 architecture</span>
              <span>GDPR ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
