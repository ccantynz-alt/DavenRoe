import { useState, useEffect, useRef } from 'react';

/**
 * Animated number counters that tick up when scrolled into view.
 * Professional, clean — numbers roll up with easing.
 */

const STATS = [
  { value: 94.7, suffix: '%', label: 'AI Categorisation Accuracy', decimals: 1 },
  { value: 21000, suffix: '+', label: 'Financial Institutions Connected', decimals: 0 },
  { value: 4.2, suffix: 's', label: 'Average Month-End Close', decimals: 1 },
  { value: 40, suffix: '+', label: 'Hours Saved Per Client / Month', decimals: 0 },
  { value: 6, suffix: '', label: 'Bilateral Tax Treaties', decimals: 0 },
  { value: 90, suffix: '+', label: 'Specialist Automations', decimals: 0 },
];

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
    <section ref={ref} className="py-20 px-6 lg:px-16 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {STATS.map((stat, i) => (
            <CounterCell key={i} stat={stat} triggered={triggered} delay={i * 150} />
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
    <div className="text-center">
      <div className="text-3xl lg:text-4xl font-bold text-gray-900 tabular-nums font-mono tracking-tight">
        {triggered ? formatted : '0'}
        <span className="text-indigo-600">{stat.suffix}</span>
      </div>
      <div className="text-xs text-gray-500 mt-2 leading-snug">{stat.label}</div>
    </div>
  );
}
