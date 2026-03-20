import { useState, useEffect, useRef } from 'react';

/**
 * Animated background showing cascading financial data —
 * account codes, amounts, currencies, tax rates — falling
 * like the Matrix but with accounting data.
 */

const STREAMS = [
  { items: ['4100', '$12,450.00', 'Revenue', 'CR', 'AUD', '10% GST', 'Approved'], speed: 12, delay: 0 },
  { items: ['2100', '$3,200.00', 'AP', 'DR', 'USD', 'Net 30', 'Posted'], speed: 15, delay: 2 },
  { items: ['1000', '$87,341.20', 'Cash', 'DR', 'NZD', '15% GST', 'Cleared'], speed: 10, delay: 1 },
  { items: ['6200', '$1,800.00', 'Rent', 'DR', 'GBP', '20% VAT', 'Accrued'], speed: 18, delay: 3 },
  { items: ['3000', '$50,000.00', 'Equity', 'CR', 'AUD', 'Exempt', 'Verified'], speed: 14, delay: 0.5 },
  { items: ['5100', '$22,100.00', 'COGS', 'DR', 'USD', 'Zero-rated', 'Matched'], speed: 11, delay: 4 },
  { items: ['1100', '$15,600.00', 'AR', 'DR', 'EUR', '21% VAT', 'Overdue'], speed: 16, delay: 1.5 },
  { items: ['8100', '$4,200.00', 'Tax', 'CR', 'AUD', 'BAS Q3', 'Lodged'], speed: 13, delay: 2.5 },
  { items: ['7100', '$900.00', 'Interest', 'CR', 'NZD', 'RWT 33%', 'Withheld'], speed: 17, delay: 3.5 },
  { items: ['1300', '$125,000', 'PPE', 'DR', 'USD', 'Sec 179', 'Capitalised'], speed: 19, delay: 0.8 },
  { items: ['4200', '$8,750.00', 'Services', 'CR', 'GBP', 'Reverse', 'Treaty'], speed: 12, delay: 5 },
  { items: ['6100', '$45,000', 'Payroll', 'DR', 'AUD', 'PAYG', 'STP Filed'], speed: 14, delay: 1.2 },
];

export default function MatrixRain() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STREAMS.map((stream, i) => (
        <CascadeColumn key={i} stream={stream} index={i} total={STREAMS.length} />
      ))}
    </div>
  );
}

function CascadeColumn({ stream, index, total }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 800);
    return () => clearInterval(interval);
  }, []);

  const left = `${(index / total) * 100 + 2}%`;
  const currentItem = stream.items[tick % stream.items.length];

  return (
    <div
      className="absolute top-0 flex flex-col items-center gap-4"
      style={{ left, width: '7%' }}
    >
      {stream.items.map((item, j) => (
        <span
          key={`${j}-${tick}`}
          className="text-[10px] font-mono animate-cascade whitespace-nowrap"
          style={{
            animationDuration: `${stream.speed}s`,
            animationDelay: `${stream.delay + j * 1.5}s`,
            color: j === tick % stream.items.length
              ? 'rgba(99, 102, 241, 0.9)'
              : 'rgba(99, 102, 241, 0.15)',
            textShadow: j === tick % stream.items.length
              ? '0 0 8px rgba(99, 102, 241, 0.6)'
              : 'none',
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
