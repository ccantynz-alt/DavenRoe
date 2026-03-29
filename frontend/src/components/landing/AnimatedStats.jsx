import { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

/**
 * Glass morphism stat cards with glow effects.
 * Numbers roll up when scrolled into view. Premium dark section.
 */

const STATS = [
  { value: 94.7, suffix: '%', label: 'AI Accuracy', sublabel: 'Transaction categorisation', decimals: 1, color: 'indigo' },
  { value: 21000, suffix: '+', label: 'Institutions', sublabel: 'Bank feeds connected', decimals: 0, color: 'cyan' },
  { value: 4.2, suffix: 's', label: 'Month-End Close', sublabel: 'Average processing time', decimals: 1, color: 'violet' },
  { value: 40, suffix: '+', label: 'Hours Saved', sublabel: 'Per client per month', decimals: 0, color: 'emerald' },
  { value: 6, suffix: '', label: 'Tax Treaties', sublabel: 'Bilateral DTAs active', decimals: 0, color: 'amber' },
  { value: 90, suffix: '+', label: 'Automations', sublabel: 'Specialist workflows', decimals: 0, color: 'rose' },
];

const GLOW_COLORS = {
  indigo: 'rgba(99,102,241,0.15)',
  cyan: 'rgba(6,182,212,0.15)',
  violet: 'rgba(139,92,246,0.15)',
  emerald: 'rgba(16,185,129,0.15)',
  amber: 'rgba(245,158,11,0.15)',
  rose: 'rgba(244,63,94,0.15)',
};

const TEXT_COLORS = {
  indigo: 'text-indigo-400',
  cyan: 'text-cyan-400',
  violet: 'text-violet-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
};

export default function AnimatedStats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="py-24 px-6 lg:px-16 bg-[#08090d] relative overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-medium tracking-[0.2em] text-indigo-400 uppercase mb-3">Performance</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">Numbers that speak for themselves</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
            >
              {/* Glow */}
              <div
                className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: GLOW_COLORS[stat.color] }}
              />

              <Card className="relative bg-white/[0.04] backdrop-blur-sm rounded-2xl border-white/[0.06] p-5 text-center hover:border-white/[0.12] transition-colors duration-300 shadow-none">
                <CounterCell stat={stat} triggered={isInView} delay={i * 150} />
                <div className="text-sm font-semibold text-white/90 mt-2">{stat.label}</div>
                <div className="text-[11px] text-white/40 mt-1">{stat.sublabel}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CounterCell({ stat, triggered, delay }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!triggered) return;

    const timeout = setTimeout(() => {
      const duration = 2000;
      const start = Date.now();

      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
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
    <div className={cn('text-3xl lg:text-4xl font-bold tabular-nums font-mono tracking-tight', TEXT_COLORS[stat.color])}>
      {triggered ? formatted : '0'}
      <span className="text-lg">{stat.suffix}</span>
    </div>
  );
}
