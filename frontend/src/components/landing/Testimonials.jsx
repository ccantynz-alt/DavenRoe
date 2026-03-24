import { useState, useEffect } from 'react';

/**
 * Premium testimonials section — dark with glass morphism cards.
 * Auto-rotating with manual controls. Shows real quantified impact.
 */

const TESTIMONIALS = [
  {
    quote: "We closed month-end for 47 clients in the time it used to take us to do one. Astra didn't just save us hours — it changed the economics of our entire practice.",
    name: 'Sarah Chen',
    role: 'Managing Partner',
    firm: 'Chen & Associates',
    location: 'Sydney, Australia',
    metric: '47x faster month-end',
    avatar: 'SC',
  },
  {
    quote: "The treaty engine caught $180,000 in withholding tax we were overpaying on cross-border royalties. It paid for itself in the first week.",
    name: 'James Wright',
    role: 'International Tax Director',
    firm: 'Wright Advisory Group',
    location: 'New York, United States',
    metric: '$180K recovered',
    avatar: 'JW',
  },
  {
    quote: "Astra's forensic module flagged a $140,000 vendor fraud scheme that our annual audit missed two years running. The Benford's analysis is extraordinary.",
    name: 'David Kapoor',
    role: 'Forensic Accounting Lead',
    firm: 'Kapoor Whitfield',
    location: 'London, United Kingdom',
    metric: '$140K fraud detected',
    avatar: 'DK',
  },
  {
    quote: "My clients can photograph a receipt on their phone and it's categorised, coded, and filed before they put it back in their pocket. That's the future of bookkeeping.",
    name: 'Emma Tauroa',
    role: 'Cloud Practice Manager',
    firm: 'Pacific Ledger',
    location: 'Auckland, New Zealand',
    metric: '95% auto-categorised',
    avatar: 'ET',
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent(c => (c + 1) % TESTIMONIALS.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const t = TESTIMONIALS[current];

  return (
    <section className="py-28 px-6 lg:px-16 bg-[#08090d] relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* Accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
      />

      <div className="max-w-4xl mx-auto text-center relative">
        <p className="text-[11px] font-medium tracking-[0.2em] text-indigo-400 uppercase mb-12">What Practitioners Could Achieve</p>

        <div
          className="transition-all duration-300"
          style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(10px)' }}
        >
          <blockquote className="text-2xl lg:text-3xl font-light text-white leading-relaxed mb-8">
            "{t.quote}"
          </blockquote>

          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
            {t.metric}
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-semibold text-indigo-300 border border-indigo-500/20">
              {t.avatar}
            </div>
            <div className="text-left">
              <div className="text-white font-semibold text-sm">{t.name}</div>
              <div className="text-white/40 text-xs">{t.role}, {t.firm}</div>
              <div className="text-white/25 text-[11px]">{t.location}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-12">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true); }, 300); }}
              className={`transition-all duration-300 rounded-full ${
                i === current ? 'w-8 h-2 bg-indigo-500' : 'w-2 h-2 bg-white/10 hover:bg-white/20'
              }`}
            />
          ))}
        </div>

        <p className="text-[10px] text-white/20 mt-8">Illustrative scenarios based on platform capabilities. Names and firms are representative examples.</p>
      </div>
    </section>
  );
}
