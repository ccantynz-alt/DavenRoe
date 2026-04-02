import { useState, useEffect, useRef } from 'react';

/**
 * Premium stat cards with animated gradient borders, glow effects,
 * and cinematic number roll-up. Dark section with depth.
 */

const STATS = [
  { value: 94.7, suffix: '%', label: 'AI Accuracy', sublabel: 'Transaction categorisation', decimals: 1, color: 'indigo', gradient: 'from-indigo-500 to-violet-500' },
  { value: 21000, suffix: '+', label: 'Institutions', sublabel: 'Bank feeds connected', decimals: 0, color: 'cyan', gradient: 'from-cyan-500 to-blue-500' },
  { value: 4.2, suffix: 's', label: 'Month-End Close', sublabel: 'Average processing time', decimals: 1, color: 'violet', gradient: 'from-violet-500 to-purple-500' },
  { value: 40, suffix: '+', label: 'Hours Saved', sublabel: 'Per client per month', decimals: 0, color: 'emerald', gradient: 'from-emerald-500 to-teal-500' },
  { value: 6, suffix: '', label: 'Tax Treaties', sublabel: 'Bilateral DTAs active', decimals: 0, color: 'amber', gradient: 'from-amber-500 to-orange-500' },
  { value: 90, suffix: '+', label: 'Automations', sublabel: 'Specialist workflows', decimals: 0, color: 'rose', gradient: 'from-rose-500 to-pink-500' },
];

const TEXT_COLORS = {
  indigo: 'text-indigo-400',
  cyan: 'text-cyan-400',
  violet: 'text-violet-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
};

const BG_GLOWS = {
  indigo: 'rgba(99,102,241,0.12)',
  cyan: 'rgba(6,182,212,0.12)',
  violet: 'rgba(139,92,246,0.12)',
  emerald: 'rgba(16,185,129,0.12)',
  amber: 'rgba(245,158,11,0.12)',
  rose: 'rgba(244,63,94,0.12)',
};

export default function AnimatedStats() {
  const ref = useRef(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-28 px-6 lg:px-16 bg-[#05060a] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10 blur-[120px]"
        style={{ background: 'radial-gradient(ellipse, #6366f1 0%, transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-20">
          <p className="text-[11px] font-medium tracking-[0.25em] text-indigo-400 uppercase mb-4">Performance Metrics</p>
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-3">Numbers that speak for themselves</h2>
          <p className="text-white/30 text-sm">Real-time platform intelligence across all jurisdictions</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="relative group"
              style={{
                opacity: triggered ? 1 : 0,
                transform: triggered ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 100}ms`,
              }}
            >
              {/* Animated gradient border */}
              <div className="absolute -inset-[1px] rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${stat.gradient}`}
                  style={{ animation: 'spin-slow 4s linear infinite' }}
                />
              </div>

              {/* Glow on hover */}
              <div
                className="absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl"
                style={{ background: BG_GLOWS[stat.color] }}
              />

              <div className="relative bg-[#0a0b10] rounded-2xl border border-white/[0.06] p-6 text-center group-hover:border-transparent transition-colors duration-300">
                <CounterCell stat={stat} triggered={triggered} delay={i * 150} />
                <div className="text-sm font-semibold text-white/90 mt-3">{stat.label}</div>
                <div className="text-[11px] text-white/30 mt-1">{stat.sublabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg) scale(3); }
          to { transform: rotate(360deg) scale(3); }
        }
      `}</style>
    </section>
  );
}

function CounterCell({ stat, triggered, delay }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!triggered) return;

    const timeout = setTimeout(() => {
      const duration = 2200;
      const start = Date.now();

      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        // Snappy cubic bezier ease
        const eased = 1 - Math.pow(1 - progress, 5);
        setDisplay(stat.value * eased);
        if (progress < 1) requestAnimationFrame(animate);
        else setDisplay(stat.value);
      };
      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [triggered, stat.value, delay]);

  const formatted = stat.decimals > 0
    ? display.toFixed(stat.decimals)
    : Math.floor(display).toLocaleString();

  return (
    <div className={`text-3xl lg:text-4xl font-bold tabular-nums font-mono tracking-tight ${TEXT_COLORS[stat.color]}`}>
      {triggered ? formatted : '0'}
      <span className="text-lg">{stat.suffix}</span>
    </div>
  );
}
