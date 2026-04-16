import { useState, useEffect, useRef } from 'react';

/**
 * Cinematic testimonials — dark with animated gradient backdrop,
 * glass card, auto-rotation with smooth crossfade.
 */

const TESTIMONIALS = [
  {
    quote: "We closed month-end for 47 clients in the time it used to take us to do one. DavenRoe didn't just save us hours — it changed the economics of our entire practice.",
    name: 'Sarah Chen',
    role: 'Managing Partner',
    firm: 'Chen & Associates',
    location: 'Sydney, Australia',
    metric: '47x faster month-end',
    metricValue: '47x',
    avatar: 'SC',
  },
  {
    quote: "The treaty engine caught $180,000 in withholding tax we were overpaying on cross-border royalties. It paid for itself in the first week.",
    name: 'James Wright',
    role: 'International Tax Director',
    firm: 'Wright Advisory Group',
    location: 'New York, United States',
    metric: '$180K recovered',
    metricValue: '$180K',
    avatar: 'JW',
  },
  {
    quote: "DavenRoe's forensic module flagged a $140,000 vendor fraud scheme that our annual audit missed two years running. The Benford's analysis is extraordinary.",
    name: 'David Kapoor',
    role: 'Forensic Accounting Lead',
    firm: 'Kapoor Whitfield',
    location: 'London, United Kingdom',
    metric: '$140K fraud detected',
    metricValue: '$140K',
    avatar: 'DK',
  },
  {
    quote: "My clients can photograph a receipt on their phone and it's categorised, coded, and filed before they put it back in their pocket. That's the future of bookkeeping.",
    name: 'Emma Tauroa',
    role: 'Cloud Practice Manager',
    firm: 'Pacific Ledger',
    location: 'Auckland, New Zealand',
    metric: '95% auto-categorised',
    metricValue: '95%',
    avatar: 'ET',
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent(c => (c + 1) % TESTIMONIALS.length);
        setFade(true);
      }, 400);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const t = TESTIMONIALS[current];

  return (
    <section ref={ref} className="py-32 px-6 lg:px-16 bg-[#05060a] relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* Large accent orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.07] blur-[150px]"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 60%)' }}
      />

      <div
        className="max-w-4xl mx-auto relative"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out',
        }}
      >
        <p className="text-[11px] font-medium tracking-[0.25em] text-indigo-400 uppercase mb-4 text-center">What Practitioners Could Achieve</p>

        {/* Large metric */}
        <div className="text-center mb-12">
          <div
            className="transition-all duration-400"
            style={{ opacity: fade ? 1 : 0, transform: fade ? 'scale(1)' : 'scale(0.9)' }}
          >
            <span className="text-6xl lg:text-8xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              {t.metricValue}
            </span>
            <p className="text-sm text-white/30 mt-2">{t.metric}</p>
          </div>
        </div>

        {/* Quote card */}
        <div
          className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.06] p-10 mb-8 transition-all duration-400"
          style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(10px)' }}
        >
          {/* Large quote mark */}
          <div className="text-5xl text-indigo-500/20 font-serif leading-none mb-4">"</div>

          <blockquote className="text-xl lg:text-2xl font-light text-white/80 leading-relaxed mb-8">
            {t.quote}
          </blockquote>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
              {t.avatar}
            </div>
            <div>
              <div className="text-white font-semibold">{t.name}</div>
              <div className="text-white/40 text-sm">{t.role}, {t.firm}</div>
              <div className="text-white/20 text-xs">{t.location}</div>
            </div>
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true); }, 400); }}
              className={`transition-all duration-300 rounded-full ${
                i === current ? 'w-10 h-2.5 bg-gradient-to-r from-indigo-500 to-violet-500' : 'w-2.5 h-2.5 bg-white/10 hover:bg-white/20'
              }`}
            />
          ))}
        </div>

        <p className="text-[10px] text-white/15 mt-10 text-center">Illustrative scenarios based on platform capabilities. Names and firms are representative examples.</p>
      </div>
    </section>
  );
}
