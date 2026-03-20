import { useState, useEffect } from 'react';
import MatrixRain from '../components/landing/MatrixRain';
import LiveTerminal from '../components/landing/LiveTerminal';
import LiveMetrics from '../components/landing/LiveMetrics';
import FeatureShowcase from '../components/landing/FeatureShowcase';

/**
 * The cinematic landing page for Astra.
 *
 * Hero: Dark background with cascading financial data (Matrix-style),
 * a live terminal showing Astra performing real operations,
 * and animated metric counters ticking upward.
 *
 * Below: Feature showcase with scroll-triggered animations,
 * jurisdiction cards, comparison table, CTA.
 */
export default function Landing({ onLogin }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Trigger entrance animations after mount
    requestAnimationFrame(() => setLoaded(true));
  }, []);

  return (
    <div className="bg-gray-950 text-white min-h-screen overflow-x-hidden">
      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background: Matrix rain of accounting data */}
        <MatrixRain />

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-950/80 to-gray-950 pointer-events-none" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none animate-grid-pulse"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Scanning line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute left-0 right-0 h-px animate-scan-line"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.4) 50%, transparent 100%)',
              animationDuration: '6s',
            }}
          />
        </div>

        {/* Navigation */}
        <nav className="relative z-20 flex items-center justify-between px-6 lg:px-12 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg">
              A
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">Astra</span>
              <span className="hidden sm:inline text-xs text-gray-500 ml-2">Autonomous Accounting</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hidden md:inline text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hidden md:inline text-sm text-gray-400 hover:text-white transition-colors">Demo</a>
            <button
              onClick={onLogin}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              Sign In
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-24">
          {/* Pulse rings behind the heading */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-64 h-64 rounded-full border border-indigo-500/20 animate-pulse-ring" />
            <div className="absolute inset-0 w-64 h-64 rounded-full border border-indigo-500/10" style={{ animation: 'pulse-ring-2 4s ease-out infinite 0.5s' }} />
            <div className="absolute inset-0 w-64 h-64 rounded-full border border-indigo-500/5" style={{ animation: 'pulse-ring-3 5s ease-out infinite 1s' }} />
          </div>

          {/* Title */}
          <div
            className="text-center mb-12"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(40px)',
              transition: 'all 1s ease-out',
            }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-6">
              The World's First Autonomous Global Accounting Agent
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                Accounting
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-glow-text">
                that thinks.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              AI-powered double-entry bookkeeping. Multi-jurisdiction tax compliance.
              Forensic anomaly detection. All running autonomously while you sleep.
            </p>
          </div>

          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 mb-16"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s ease-out 0.3s',
            }}
          >
            <button
              onClick={onLogin}
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105"
            >
              Try Astra Free
            </button>
            <a
              href="#demo"
              className="px-8 py-4 bg-gray-800/80 backdrop-blur text-gray-300 rounded-xl text-lg font-semibold hover:bg-gray-700 transition-all border border-gray-700 hover:border-gray-600 flex items-center justify-center gap-2"
            >
              <span className="w-6 h-6 rounded-full border-2 border-gray-500 flex items-center justify-center text-xs">&#9654;</span>
              See It Work
            </a>
          </div>

          {/* Live metrics */}
          <div
            className="w-full max-w-4xl"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s ease-out 0.6s',
            }}
          >
            <LiveMetrics />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
          <span className="text-xs text-gray-600">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-gray-700 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 rounded-full bg-indigo-500 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ============================================================
          LIVE DEMO SECTION
          ============================================================ */}
      <section id="demo" className="relative py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Watch Astra <span className="text-indigo-400">Think</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Month-end close. Forensic scanning. Cross-border tax calculations.
              AI categorization. All happening live.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Terminal — takes 3 columns */}
            <div className="lg:col-span-3">
              <LiveTerminal />
            </div>

            {/* Side info cards */}
            <div className="lg:col-span-2 space-y-4">
              <InfoCard
                title="4.2 seconds"
                subtitle="Average month-end close time"
                detail="Down from 5-10 business days with manual processes. Astra reconciles, adjusts, and generates statements autonomously."
                color="indigo"
              />
              <InfoCard
                title="$45,000 saved"
                subtitle="Average treaty benefit per client"
                detail="The AU-US royalty example alone saves $45K. Multiply across 6 treaties and multiple income types."
                color="green"
              />
              <InfoCard
                title="94.2% detection"
                subtitle="Forensic anomaly confidence"
                detail="Structured payments, ghost vendors, related-party transactions — caught before the auditor arrives."
                color="red"
              />
              <InfoCard
                title="6.2 hours/month"
                subtitle="Time saved on data entry"
                detail="Per client. For a firm with 100 clients, that's 620 hours/month of manual work eliminated."
                color="purple"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          DATA STREAM DIVIDER
          ============================================================ */}
      <div className="relative h-24 overflow-hidden">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gray-800" />
        </div>
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 overflow-hidden h-6">
          <div className="animate-stream-left text-[10px] font-mono text-indigo-500/30 whitespace-nowrap">
            CR 4100 $12,450.00 | DR 1000 $12,450.00 | GST $1,245.00 | NET $11,205.00 | APPROVED | POSTED |
            CR 4200 $8,750.00 | DR 1100 $8,750.00 | VAT $1,750.00 | TREATY AU-GB 5% | RECONCILED |
            CR 4100 $45,000.00 | DR 1000 $45,000.00 | PAYG $13,500.00 | STP FILED | VERIFIED |
          </div>
        </div>
        <div className="absolute top-1/2 left-0 right-0 translate-y-1 overflow-hidden h-6">
          <div className="animate-stream-right text-[10px] font-mono text-purple-500/20 whitespace-nowrap">
            BENFORD X2=4.12 PASS | VENDOR AUDIT CLEAN | AP AGING 30D $22,100 | AR CURRENT $15,600 |
            TREATY AU-US ART12 5% WHT | FITO $9,000 CLAIMABLE | BAS Q3 DUE 28-APR | MTD SUBMITTED |
          </div>
        </div>
      </div>

      {/* ============================================================
          FEATURES SECTION
          ============================================================ */}
      <section id="features" className="py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <FeatureShowcase />
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="border-t border-gray-800 py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm">A</div>
            <div>
              <span className="font-bold">Astra</span>
              <span className="text-xs text-gray-500 ml-2">Autonomous Global Accounting</span>
            </div>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-xs text-gray-600">
            256-bit encryption. SOC 2 compliant. Your data never leaves our secure infrastructure.
          </div>
        </div>
      </footer>
    </div>
  );
}


function InfoCard({ title, subtitle, detail, color }) {
  const colors = {
    indigo: 'border-indigo-500/30 bg-indigo-900/20',
    green: 'border-green-500/30 bg-green-900/20',
    red: 'border-red-500/30 bg-red-900/20',
    purple: 'border-purple-500/30 bg-purple-900/20',
  };
  const titleColors = {
    indigo: 'text-indigo-400',
    green: 'text-green-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <div className={`text-xl font-bold font-mono ${titleColors[color]}`}>{title}</div>
      <div className="text-sm text-white font-medium mb-1">{subtitle}</div>
      <div className="text-xs text-gray-400">{detail}</div>
    </div>
  );
}
