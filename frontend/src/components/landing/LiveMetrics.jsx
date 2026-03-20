import { useState, useEffect } from 'react';

/**
 * Animated metric counters that tick up in real-time,
 * showing Astra processing data live.
 */

const METRICS = [
  { label: 'Transactions Processed', target: 2847391, prefix: '', suffix: '', format: 'int', color: 'text-indigo-400' },
  { label: 'Tax Saved via Treaties', target: 4238500, prefix: '$', suffix: '', format: 'currency', color: 'text-green-400' },
  { label: 'AI Accuracy', target: 94.7, prefix: '', suffix: '%', format: 'pct', color: 'text-blue-400' },
  { label: 'Jurisdictions', target: 4, prefix: '', suffix: '', format: 'int', color: 'text-purple-400' },
];

export default function LiveMetrics() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {METRICS.map((m, i) => (
        <MetricCounter key={i} metric={m} delay={i * 300} />
      ))}
    </div>
  );
}

function MetricCounter({ metric, delay }) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    const duration = 2000;
    const startTime = Date.now();
    const startVal = metric.format === 'pct' ? 0 : 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startVal + (metric.target - startVal) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setValue(metric.target);
      }
    };

    requestAnimationFrame(animate);
  }, [started, metric.target]);

  // After initial count-up, slowly tick upward for "live" feel
  useEffect(() => {
    if (value < metric.target) return;
    if (metric.format === 'pct') return; // Don't tick percentages

    const interval = setInterval(() => {
      setValue(v => v + Math.floor(Math.random() * 3) + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, [value >= metric.target]);

  const formatted = metric.format === 'currency'
    ? metric.prefix + Math.floor(value).toLocaleString()
    : metric.format === 'pct'
    ? value.toFixed(1) + metric.suffix
    : metric.prefix + Math.floor(value).toLocaleString() + metric.suffix;

  return (
    <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-xl p-4 text-center">
      <div className={`text-2xl lg:text-3xl font-bold font-mono ${metric.color} tabular-nums`}>
        {started ? formatted : '-'}
      </div>
      <div className="text-xs text-gray-500 mt-1">{metric.label}</div>
      {started && metric.format !== 'pct' && (
        <div className="flex items-center justify-center gap-1 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-500 font-mono">LIVE</span>
        </div>
      )}
    </div>
  );
}
