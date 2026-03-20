import { useState, useEffect } from 'react';

/**
 * A simulated terminal that types out Astra performing
 * real accounting operations — forensics, tax calculations,
 * reconciliation, AI categorization — in real time.
 */

const SEQUENCES = [
  {
    title: 'Autonomous Month-End Close',
    lines: [
      { type: 'cmd', text: '> astra close --month 2026-02 --entity "Coastal Coffee Co"' },
      { type: 'info', text: 'Scanning 1,247 unreconciled transactions...' },
      { type: 'success', text: '  1,198 auto-matched to bank feed (95.9% accuracy)' },
      { type: 'warn', text: '  49 require manual review — queued for approval' },
      { type: 'info', text: 'Running accrual adjustments...' },
      { type: 'success', text: '  Prepaid insurance: $2,400/mo amortised' },
      { type: 'success', text: '  Depreciation: $8,340 (SL method, 42 assets)' },
      { type: 'info', text: 'Generating financial statements...' },
      { type: 'result', text: '  P&L:  Revenue $245,100  |  Expenses $189,400  |  Net Profit $55,700' },
      { type: 'result', text: '  BS:   Assets $1.2M  |  Liabilities $680K  |  Equity $520K  ✓ Balanced' },
      { type: 'success', text: 'Month-end close completed in 4.2 seconds.' },
    ],
  },
  {
    title: 'Forensic Anomaly Detection',
    lines: [
      { type: 'cmd', text: '> astra forensic --scan "vendor-payments" --period Q4-2025' },
      { type: 'info', text: "Running Benford's Law analysis on 3,841 payments..." },
      { type: 'success', text: '  First-digit distribution: χ² = 4.12 (normal range)' },
      { type: 'warn', text: '  ALERT: Vendor "GS Consulting" — 14 payments of $9,950 (just below $10K threshold)' },
      { type: 'error', text: '  RISK: Potential structuring detected. Confidence: 94.2%' },
      { type: 'info', text: 'Cross-referencing vendor registry...' },
      { type: 'warn', text: '  "GS Consulting" shares bank account with "G. Smith" (employee #412)' },
      { type: 'error', text: '  CRITICAL: Related-party transaction — undisclosed conflict of interest' },
      { type: 'info', text: 'Generating forensic report with evidence chain...' },
      { type: 'success', text: '  Report exported: forensic_Q4_2025_vendor_audit.pdf' },
    ],
  },
  {
    title: 'Cross-Border Tax Treaty Engine',
    lines: [
      { type: 'cmd', text: '> astra tax --treaty AU-US --income "royalties" --amount $180,000' },
      { type: 'info', text: 'Loading AU-US Double Tax Agreement (Article 12)...' },
      { type: 'result', text: '  Domestic withholding (US): 30% = $54,000' },
      { type: 'success', text: '  Treaty rate (AU-US DTA): 5% = $9,000' },
      { type: 'result', text: '  Treaty benefit: $45,000 saved' },
      { type: 'info', text: 'Checking AU foreign income tax offset...' },
      { type: 'success', text: '  FITO credit: $9,000 claimable against AU tax' },
      { type: 'result', text: '  Effective combined rate: 32.5% (vs 60% without treaty)' },
      { type: 'info', text: 'Generating IRS Form 1042-S + ATO schedule...' },
      { type: 'success', text: '  Compliance documents ready for both jurisdictions.' },
    ],
  },
  {
    title: 'AI Transaction Categorization',
    lines: [
      { type: 'cmd', text: '> astra categorize --bank-feed "ANZ Business" --batch 500' },
      { type: 'info', text: 'Processing 500 new bank transactions...' },
      { type: 'success', text: '  412 auto-categorised (82.4% confidence threshold met)' },
      { type: 'result', text: '    "OFFICEWORKS 2847"  → 6300 Office Supplies    [98.2%]' },
      { type: 'result', text: '    "UBER *TRIP"        → 6400 Travel & Transport [96.7%]' },
      { type: 'result', text: '    "STRIPE PYMT 4829"  → 4100 Sales Revenue     [99.1%]' },
      { type: 'result', text: '    "ATO PAYG INSTAL"   → 2150 PAYG Liability    [99.8%]' },
      { type: 'warn', text: '  88 queued for human review (confidence < 80%)' },
      { type: 'info', text: 'Learning from previous approvals...' },
      { type: 'success', text: '  Model accuracy this month: 91.3% (up from 78.4% in month 1)' },
      { type: 'success', text: '  Estimated time saved: 6.2 hours of manual data entry' },
    ],
  },
];

export default function LiveTerminal() {
  const [seqIndex, setSeqIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [displayLines, setDisplayLines] = useState([]);
  const [isTyping, setIsTyping] = useState(true);

  const seq = SEQUENCES[seqIndex];
  const currentLine = seq.lines[lineIndex];

  useEffect(() => {
    if (!isTyping) return;

    if (lineIndex >= seq.lines.length) {
      // Pause then move to next sequence
      const timeout = setTimeout(() => {
        setSeqIndex((seqIndex + 1) % SEQUENCES.length);
        setLineIndex(0);
        setCharIndex(0);
        setDisplayLines([]);
      }, 3000);
      return () => clearTimeout(timeout);
    }

    if (charIndex < currentLine.text.length) {
      // Type character by character (fast for non-commands)
      const speed = currentLine.type === 'cmd' ? 30 : 8;
      const timeout = setTimeout(() => setCharIndex(charIndex + 1), speed);
      return () => clearTimeout(timeout);
    } else {
      // Line complete — add to display and move on
      const timeout = setTimeout(() => {
        setDisplayLines(prev => [...prev, currentLine]);
        setLineIndex(lineIndex + 1);
        setCharIndex(0);
      }, currentLine.type === 'cmd' ? 600 : 200);
      return () => clearTimeout(timeout);
    }
  }, [seqIndex, lineIndex, charIndex, isTyping]);

  const colorMap = {
    cmd: 'text-white',
    info: 'text-blue-400',
    success: 'text-green-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    result: 'text-indigo-300',
  };

  return (
    <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl shadow-indigo-500/10">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-gray-500 ml-2 font-mono">{seq.title}</span>
        <div className="ml-auto flex gap-2 text-[10px] text-gray-600 font-mono">
          <span className="px-2 py-0.5 rounded bg-gray-800">astra v2.0</span>
          <span className="px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-400">LIVE</span>
        </div>
      </div>

      {/* Terminal body */}
      <div className="p-4 font-mono text-sm h-80 overflow-hidden">
        {/* Completed lines */}
        {displayLines.map((line, i) => (
          <div key={i} className={`${colorMap[line.type]} leading-relaxed`}>
            {line.text}
          </div>
        ))}

        {/* Currently typing line */}
        {lineIndex < seq.lines.length && (
          <div className={`${colorMap[currentLine.type]} leading-relaxed`}>
            {currentLine.text.substring(0, charIndex)}
            <span className="inline-block w-2 h-4 bg-indigo-400 ml-0.5 animate-pulse" />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex justify-between text-[10px] text-gray-600 font-mono">
        <span>Session: demo-{String(seqIndex + 1).padStart(3, '0')}</span>
        <span>{seqIndex + 1}/{SEQUENCES.length} sequences</span>
        <span className="text-green-500">Connected</span>
      </div>
    </div>
  );
}
