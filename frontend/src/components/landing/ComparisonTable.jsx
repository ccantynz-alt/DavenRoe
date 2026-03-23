import { useRef, useState, useEffect } from 'react';

/**
 * Competitive comparison table — shows why Astra beats the competition.
 * Clean, factual, no trash-talking. Just checkmarks and Xs.
 */

const FEATURES = [
  { name: 'AI Transaction Categorisation', astra: true, xero: 'basic', qbo: 'basic', myob: 'basic', freshbooks: false },
  { name: 'Natural Language Queries', astra: true, xero: 'beta', qbo: 'basic', myob: false, freshbooks: false },
  { name: 'Autonomous Month-End Close', astra: true, xero: false, qbo: false, myob: false, freshbooks: false },
  { name: 'Multi-Agent AI Architecture', astra: true, xero: false, qbo: false, myob: false, freshbooks: false },
  { name: 'Forensic Intelligence', astra: true, xero: false, qbo: false, myob: false, freshbooks: false },
  { name: "Benford's Law Analysis", astra: true, xero: false, qbo: false, myob: false, freshbooks: false },
  { name: 'Multi-Jurisdiction Tax (4 countries)', astra: true, xero: false, qbo: false, myob: false, freshbooks: false },
  { name: 'Cross-Border Tax Treaties', astra: true, xero: false, qbo: false, myob: false, freshbooks: false },
  { name: 'Native Multi-Jurisdiction Payroll', astra: true, xero: 'partial', qbo: false, myob: 'partial', freshbooks: false },
  { name: 'Compliance Calendar (40+ deadlines)', astra: true, xero: false, qbo: false, myob: false, freshbooks: false },
  { name: 'Tax E-Filing (BAS/GST/VAT/Sales)', astra: true, xero: 'partial', qbo: 'partial', myob: 'partial', freshbooks: false },
  { name: 'Client Portal (built-in)', astra: true, xero: false, qbo: false, myob: false, freshbooks: true },
  { name: 'Multi-Entity (one subscription)', astra: true, xero: false, qbo: false, myob: false, freshbooks: false },
  { name: 'Inventory with Assemblies', astra: true, xero: false, qbo: 'basic', myob: true, freshbooks: false },
  { name: 'Payroll Included (no add-on)', astra: true, xero: false, qbo: false, myob: true, freshbooks: false },
];

const COMPETITORS = [
  { key: 'astra', name: 'Astra', highlight: true },
  { key: 'xero', name: 'Xero' },
  { key: 'qbo', name: 'QuickBooks' },
  { key: 'myob', name: 'MYOB' },
  { key: 'freshbooks', name: 'FreshBooks' },
];

function CellValue({ value }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
        {value}
      </span>
    </div>
  );
}

export default function ComparisonTable() {
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

  return (
    <section ref={ref} className="py-28 px-6 lg:px-12 bg-gray-50">
      <div
        className="max-w-6xl mx-auto"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out',
        }}
      >
        <div className="text-center mb-16">
          <p className="text-[11px] font-medium tracking-[0.2em] text-indigo-600 uppercase mb-3">Comparison</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">See the difference</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Features your current platform charges extra for — or doesn't offer at all.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Scrollable on mobile */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 w-[260px]">Feature</th>
                  {COMPETITORS.map(c => (
                    <th key={c.key} className={`py-4 px-4 text-center text-sm font-semibold ${c.highlight ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-500'}`}>
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-6 text-sm text-gray-700">{feature.name}</td>
                    {COMPETITORS.map(c => (
                      <td key={c.key} className={`py-3.5 px-4 ${c.highlight ? 'bg-indigo-50/30' : ''}`}>
                        <CellValue value={feature[c.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Based on publicly available feature lists as of March 2026. "basic" and "partial" indicate limited implementations.
        </p>
      </div>
    </section>
  );
}
