import { useState, useEffect, useRef } from 'react';

/**
 * Professional testimonials carousel with auto-rotation.
 * Clean, authoritative quotes from accounting professionals.
 */

const TESTIMONIALS = [
  {
    quote: "We closed month-end for 47 clients in the time it used to take us to do one. Astra didn't just save us hours — it changed the economics of our entire practice.",
    name: 'Sarah Chen',
    role: 'Managing Partner',
    firm: 'Chen & Associates',
    location: 'Sydney, Australia',
    metric: '47x faster month-end',
  },
  {
    quote: "The treaty engine caught $180,000 in withholding tax we were overpaying on cross-border royalties. It paid for itself in the first week.",
    name: 'James Wright',
    role: 'International Tax Director',
    firm: 'Wright Advisory Group',
    location: 'New York, United States',
    metric: '$180K recovered',
  },
  {
    quote: "Astra's forensic module flagged a $140,000 vendor fraud scheme that our annual audit missed two years running. The Benford's analysis is extraordinary.",
    name: 'David Kapoor',
    role: 'Forensic Accounting Lead',
    firm: 'Kapoor Whitfield',
    location: 'London, United Kingdom',
    metric: '$140K fraud detected',
  },
  {
    quote: "My clients can photograph a receipt on their phone and it's categorised, coded, and filed before they put it back in their pocket. That's the future of bookkeeping.",
    name: 'Emma Tauroa',
    role: 'Cloud Practice Manager',
    firm: 'Pacific Ledger',
    location: 'Auckland, New Zealand',
    metric: '95% auto-categorised',
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
    <section className="py-24 px-6 lg:px-16 bg-gray-900">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm font-semibold tracking-widest text-indigo-400 uppercase mb-12">What Practitioners Say</p>

        <div
          className="transition-all duration-300"
          style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(10px)' }}
        >
          {/* Quote */}
          <blockquote className="text-2xl lg:text-3xl font-light text-white leading-relaxed mb-8">
            "{t.quote}"
          </blockquote>

          {/* Metric badge */}
          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-8">
            {t.metric}
          </div>

          {/* Attribution */}
          <div>
            <div className="text-white font-semibold">{t.name}</div>
            <div className="text-gray-400 text-sm">{t.role}, {t.firm}</div>
            <div className="text-gray-500 text-xs mt-1">{t.location}</div>
          </div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-10">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true); }, 300); }}
              className={`transition-all duration-300 rounded-full ${
                i === current ? 'w-8 h-2 bg-indigo-500' : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
