import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/Toast';
import ProprietaryNotice from '@/components/ProprietaryNotice';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

// ─── Demo Data ──────────────────────────────────────────────────────────────────

const FLAGGED_TRANSACTIONS = [
  { id: 'TXN-4821', date: '2026-03-14', vendor: 'Apex Consulting Group', amount: 10000.00, type: 'Round Amount', pattern: 'Exact $10,000 — common in fraudulent disbursements', risk: 'Critical' },
  { id: 'TXN-4837', date: '2026-03-16', vendor: 'GreenLeaf Services Pty Ltd', amount: 9999.00, type: 'Just-Below Threshold', pattern: 'Just below $10,000 AML reporting threshold', risk: 'Critical' },
  { id: 'TXN-4802', date: '2026-03-09', vendor: 'Delta Office Supplies', amount: 5000.00, type: 'Round Amount', pattern: 'Exact $5,000 — repeated 3 times in 30 days', risk: 'High' },
  { id: 'TXN-4856', date: '2026-03-22', vendor: 'Delta Office Supplies', amount: 5000.00, type: 'Duplicate Amount', pattern: 'Duplicate $5,000 to same vendor within 13 days', risk: 'High' },
  { id: 'TXN-4819', date: '2026-03-08', vendor: 'Pinnacle Freight Co', amount: 14750.00, type: 'Weekend Transaction', pattern: 'Saturday transaction — outside normal business operations', risk: 'Medium' },
  { id: 'TXN-4844', date: '2026-03-15', vendor: 'Orion Digital Media', amount: 9950.00, type: 'Just-Below Threshold', pattern: '$50 below $10,000 threshold — structuring indicator', risk: 'High' },
  { id: 'TXN-4811', date: '2026-03-02', vendor: 'Metro Cleaning Solutions', amount: 2500.00, type: 'Round Amount', pattern: 'Exact $2,500 — 8th consecutive round-amount payment', risk: 'Medium' },
  { id: 'TXN-4860', date: '2026-03-23', vendor: 'TechVantage LLC', amount: 3200.00, type: 'Weekend Transaction', pattern: 'Sunday 11:42 PM — highly unusual timing for B2B payment', risk: 'Low' },
];

const VENDOR_RISK_DATA = [
  { vendor: 'Apex Consulting Group', totalSpend: 47500.00, txnCount: 6, avgAmount: 7916.67, riskScore: 92, flags: ['No ABN/EIN on file', 'PO Box address only', 'Round amounts only'] },
  { vendor: 'GreenLeaf Services Pty Ltd', totalSpend: 38420.00, txnCount: 9, avgAmount: 4268.89, riskScore: 85, flags: ['Newly added (< 90 days)', 'Just-below-threshold payments'] },
  { vendor: 'Delta Office Supplies', totalSpend: 22400.00, txnCount: 7, avgAmount: 3200.00, riskScore: 78, flags: ['Duplicate amounts', 'Round amounts only'] },
  { vendor: 'Orion Digital Media', totalSpend: 19900.00, txnCount: 4, avgAmount: 4975.00, riskScore: 71, flags: ['Employee address match'] },
  { vendor: 'Metro Cleaning Solutions', totalSpend: 15000.00, txnCount: 6, avgAmount: 2500.00, riskScore: 58, flags: ['Round amounts only', '8 consecutive identical payments'] },
  { vendor: 'Pinnacle Freight Co', totalSpend: 31200.00, txnCount: 5, avgAmount: 6240.00, riskScore: 45, flags: ['Weekend transactions'] },
  { vendor: 'TechVantage LLC', totalSpend: 28600.00, txnCount: 11, avgAmount: 2600.00, riskScore: 32, flags: [] },
  { vendor: 'Summit Logistics', totalSpend: 54300.00, txnCount: 14, avgAmount: 3878.57, riskScore: 18, flags: [] },
  { vendor: 'Riverstone Legal', totalSpend: 12750.00, txnCount: 3, avgAmount: 4250.00, riskScore: 15, flags: [] },
  { vendor: 'Cascade IT Services', totalSpend: 41200.00, txnCount: 12, avgAmount: 3433.33, riskScore: 22, flags: [] },
];

const JOURNAL_ENTRY_FINDINGS = [
  { entryId: 'JE-1094', date: '2026-03-20', postedBy: 'M. Chen (Intern)', amount: 45000.00, type: 'Unusual User', severity: 'Critical', explanation: 'Intern posted $45,000 journal entry — exceeds expected authority level. Entry creates a debit to "Consulting Expense" and credit to "Accounts Payable" for vendor with no purchase order on file.' },
  { entryId: 'JE-1087', date: '2026-03-18', postedBy: 'S. Williams', amount: 28000.00, type: 'After-Hours Entry', severity: 'High', explanation: 'Journal entry posted at 11:47 PM on a Tuesday. User typically posts between 9 AM and 5 PM. Entry reclassifies $28,000 from "Revenue" to "Deferred Revenue" — potential earnings manipulation.' },
  { entryId: 'JE-1091', date: '2026-03-19', postedBy: 'R. Patel', amount: 15000.00, type: 'Period-Close Entry', severity: 'High', explanation: 'Posted 2 hours before March period close. Adjusting entry increases "Other Income" by $15,000 with offset to "Accrued Liabilities" — may be used to meet revenue targets.' },
  { entryId: 'JE-1076', date: '2026-03-12', postedBy: 'S. Williams', amount: 10000.00, type: 'Round Amount', severity: 'Medium', explanation: 'Exactly $10,000 manual journal entry. Debits "Miscellaneous Expense" — a catch-all account frequently used to obscure transaction purpose. No supporting documentation attached.' },
  { entryId: 'JE-1063', date: '2026-03-05', postedBy: 'A. Rodriguez', amount: 7500.00, type: 'Back-Dated Entry', severity: 'High', explanation: 'Entry posted on March 5 but back-dated to February 28. Creates a credit note against Invoice #2847 — effectively reversing a receivable that was already reported in February financials.' },
  { entryId: 'JE-1099', date: '2026-03-22', postedBy: 'J. Thompson', amount: 3200.00, type: 'After-Hours Entry', severity: 'Low', explanation: 'Posted at 6:32 PM — slightly outside core hours but within reasonable range. Entry is a standard prepaid expense amortization. Low risk but logged for completeness.' },
];

const CASH_FLOW_DATA = [
  { month: 'Apr 2025', inflow: 182000, outflow: 156000, net: 26000, anomaly: false },
  { month: 'May 2025', inflow: 195000, outflow: 162000, net: 33000, anomaly: false },
  { month: 'Jun 2025', inflow: 178000, outflow: 171000, net: 7000, anomaly: false },
  { month: 'Jul 2025', inflow: 201000, outflow: 158000, net: 43000, anomaly: false },
  { month: 'Aug 2025', inflow: 188000, outflow: 164000, net: 24000, anomaly: false },
  { month: 'Sep 2025', inflow: 192000, outflow: 310000, net: -118000, anomaly: true, reason: 'Outflow exceeded 2.1 SD — $148,000 single payment to Apex Consulting Group (no PO on file)' },
  { month: 'Oct 2025', inflow: 205000, outflow: 169000, net: 36000, anomaly: false },
  { month: 'Nov 2025', inflow: 199000, outflow: 172000, net: 27000, anomaly: false },
  { month: 'Dec 2025', inflow: 87000, outflow: 181000, net: -94000, anomaly: true, reason: 'Inflow dropped 2.4 SD below mean — possible revenue diversion or unrecorded receipts' },
  { month: 'Jan 2026', inflow: 210000, outflow: 165000, net: 45000, anomaly: false },
  { month: 'Feb 2026', inflow: 196000, outflow: 174000, net: 22000, anomaly: false },
  { month: 'Mar 2026', inflow: 203000, outflow: 289000, net: -86000, anomaly: true, reason: 'Three payments totalling $112,000 to newly added vendors — all just below $10K reporting threshold (structured as 12 payments)' },
];

// ─── Animation Variants ─────────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

const RISK_BADGE_MAP = {
  Critical: { variant: 'destructive', className: 'border border-red-200' },
  High: { variant: 'warning', className: 'bg-orange-100 text-orange-800 border border-orange-200' },
  Medium: { variant: 'warning', className: 'border border-amber-200' },
  Low: { variant: 'outline', className: 'border-gray-200 text-gray-600' },
};

function RiskBadge({ level }) {
  const config = RISK_BADGE_MAP[level] || RISK_BADGE_MAP.Low;
  return <Badge variant={config.variant} className={config.className}>{level}</Badge>;
}

function RiskScoreBar({ score }) {
  let colorClass = 'bg-green-400';
  if (score >= 80) colorClass = 'bg-red-500';
  else if (score >= 60) colorClass = 'bg-orange-500';
  else if (score >= 40) colorClass = 'bg-amber-500';
  else if (score >= 20) colorClass = 'bg-green-500';

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-24 h-2 overflow-hidden rounded-full bg-gray-200">
        <div className={cn('h-full rounded-full transition-all', colorClass)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-mono font-semibold text-gray-700">{score}</span>
    </div>
  );
}

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Summary Cards ──────────────────────────────────────────────────────────────

function SummaryCards({ flags, critical, high, lastScan }) {
  const cards = [
    { label: 'Total Flags', value: flags, color: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50' },
    { label: 'Critical Risks', value: critical, color: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50' },
    { label: 'High Risks', value: high, color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50' },
    { label: 'Last Scan', value: lastScan, color: 'text-green-600', border: 'border-green-200', bg: 'bg-green-50' },
  ];

  return (
    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" variants={staggerContainer} initial="initial" animate="animate">
      {cards.map((c) => (
        <motion.div key={c.label} variants={staggerItem}>
          <Card className={cn('hover:shadow-md', c.border, c.bg)}>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-gray-500">{c.label}</p>
              <p className={cn('text-2xl font-bold mt-1', c.color)}>{c.value}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Spinner ────────────────────────────────────────────────────────────────────

function ScanSpinner({ message }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <p className="font-medium text-gray-500">No scan results</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  );
}

// ─── Tool Panels ────────────────────────────────────────────────────────────────

function TransactionPatternScanner({ toast }) {
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);

  const runAnalysis = () => {
    setScanning(true);
    setTimeout(() => {
      setResults(FLAGGED_TRANSACTIONS);
      setScanning(false);
      toast.success('Transaction pattern scan complete — 8 flags identified');
    }, 1400);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Transaction Pattern Scanner</h3>
          <p className="text-sm text-gray-500 mt-1">Detects round amounts, threshold structuring, weekend activity, and duplicate payments</p>
        </div>
        <Button onClick={runAnalysis} disabled={scanning}>
          {scanning ? 'Scanning...' : 'Run Analysis'}
        </Button>
      </div>

      {scanning && <ScanSpinner message="Analysing 2,847 transactions across all entities..." />}

      {results && !scanning && (
        <motion.div {...fadeInUp}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Pattern Type</TableHead>
                <TableHead>Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-blue-600 font-medium">{txn.id}</TableCell>
                  <TableCell className="text-gray-700">{txn.date}</TableCell>
                  <TableCell className="text-gray-900 font-medium">{txn.vendor}</TableCell>
                  <TableCell className="text-right font-mono text-gray-900">${fmt(txn.amount)}</TableCell>
                  <TableCell>
                    <span className="text-gray-700">{txn.type}</span>
                    <p className="text-xs text-gray-400 mt-0.5 max-w-xs">{txn.pattern}</p>
                  </TableCell>
                  <TableCell><RiskBadge level={txn.risk} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {!results && !scanning && <EmptyState message='Click "Run Analysis" to scan transactions for suspicious patterns' />}
    </div>
  );
}

function VendorRiskMatrix({ toast }) {
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);

  const runAnalysis = () => {
    setScanning(true);
    setTimeout(() => {
      setResults(VENDOR_RISK_DATA);
      setScanning(false);
      toast.success('Vendor risk analysis complete — 4 vendors flagged');
    }, 1800);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Vendor Risk Matrix</h3>
          <p className="text-sm text-gray-500 mt-1">Evaluates vendors for ghost vendor indicators, address anomalies, and payment pattern irregularities</p>
        </div>
        <Button onClick={runAnalysis} disabled={scanning}>
          {scanning ? 'Analysing...' : 'Run Analysis'}
        </Button>
      </div>

      {scanning && <ScanSpinner message="Cross-referencing 142 vendors against risk indicators..." />}

      {results && !scanning && (
        <motion.div {...fadeInUp}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Total Spend</TableHead>
                <TableHead className="text-right">Txns</TableHead>
                <TableHead className="text-right">Avg Amount</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((v) => (
                <TableRow key={v.vendor} className={cn(v.riskScore >= 70 && 'bg-red-50/40')}>
                  <TableCell className="text-gray-900 font-medium">{v.vendor}</TableCell>
                  <TableCell className="text-right font-mono text-gray-900">${fmt(v.totalSpend)}</TableCell>
                  <TableCell className="text-right text-gray-700">{v.txnCount}</TableCell>
                  <TableCell className="text-right font-mono text-gray-700">${fmt(v.avgAmount)}</TableCell>
                  <TableCell><RiskScoreBar score={v.riskScore} /></TableCell>
                  <TableCell>
                    {v.flags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {v.flags.map((f, i) => (
                          <Badge key={i} variant="destructive" className="border border-red-200">{f}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No flags</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {!results && !scanning && <EmptyState message='Click "Run Analysis" to evaluate vendor risk profiles' />}
    </div>
  );
}

function JournalEntryTester({ toast }) {
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);

  const runAnalysis = () => {
    setScanning(true);
    setTimeout(() => {
      setResults(JOURNAL_ENTRY_FINDINGS);
      setScanning(false);
      toast.success('Journal entry testing complete — 6 irregularities found');
    }, 1600);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Journal Entry Tester</h3>
          <p className="text-sm text-gray-500 mt-1">Identifies irregular journal entries: after-hours postings, unusual users, back-dated entries, and period-close manipulation</p>
        </div>
        <Button onClick={runAnalysis} disabled={scanning}>
          {scanning ? 'Testing...' : 'Run Analysis'}
        </Button>
      </div>

      {scanning && <ScanSpinner message="Testing 1,204 journal entries against 12 irregularity rules..." />}

      {results && !scanning && (
        <motion.div className="space-y-4" variants={staggerContainer} initial="initial" animate="animate">
          {results.map((entry) => (
            <motion.div key={entry.entryId} variants={staggerItem}>
              <Card className={cn(
                entry.severity === 'Critical' ? 'border-red-200 bg-red-50/50' :
                entry.severity === 'High' ? 'border-orange-200 bg-orange-50/30' :
                entry.severity === 'Medium' ? 'border-amber-200 bg-amber-50/30' :
                'border-gray-200 bg-gray-50/30'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-semibold text-blue-600">{entry.entryId}</span>
                        <RiskBadge level={entry.severity} />
                        <Badge variant="secondary">{entry.type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2 flex-wrap">
                        <span>Date: {entry.date}</span>
                        <span>Posted by: <span className="font-medium text-gray-700">{entry.postedBy}</span></span>
                        <span>Amount: <span className="font-mono font-semibold text-gray-900">${fmt(entry.amount)}</span></span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{entry.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!results && !scanning && <EmptyState message='Click "Run Analysis" to test journal entries for irregularities' />}
    </div>
  );
}

function CashFlowAnomalyDetector({ toast }) {
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);

  const runAnalysis = () => {
    setScanning(true);
    setTimeout(() => {
      setResults(CASH_FLOW_DATA);
      setScanning(false);
      toast.success('Cash flow anomaly detection complete — 3 anomalies detected');
    }, 2000);
  };

  const maxAbsNet = results ? Math.max(...results.map((d) => Math.abs(d.net))) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cash Flow Anomaly Detector</h3>
          <p className="text-sm text-gray-500 mt-1">Identifies months with cash flow deviating more than 2 standard deviations from the rolling mean</p>
        </div>
        <Button onClick={runAnalysis} disabled={scanning}>
          {scanning ? 'Detecting...' : 'Run Analysis'}
        </Button>
      </div>

      {scanning && <ScanSpinner message="Analysing 12 months of cash flow data across all bank accounts..." />}

      {results && !scanning && (
        <motion.div {...fadeInUp}>
          {/* Visual bar chart */}
          <div className="mb-8">
            <div className="flex items-end gap-1.5 h-48 px-2">
              {results.map((d) => {
                const height = maxAbsNet > 0 ? (Math.abs(d.net) / maxAbsNet) * 100 : 0;
                const isNegative = d.net < 0;
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                    {isNegative ? (
                      <div className="w-full flex flex-col items-center justify-start" style={{ height: '100%' }}>
                        <div className="flex-1" />
                        <div
                          className={cn('w-full rounded-t', d.anomaly ? 'bg-red-500' : 'bg-red-300')}
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center justify-end" style={{ height: '100%' }}>
                        <div
                          className={cn('w-full rounded-t', d.anomaly ? 'bg-red-500' : 'bg-blue-500')}
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                      </div>
                    )}
                    <span className="text-[10px] text-gray-400 mt-1.5 whitespace-nowrap">{d.month.slice(0, 3)}</span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        <p className="font-semibold">{d.month}</p>
                        <p>Net: <span className={d.net >= 0 ? 'text-green-400' : 'text-red-400'}>${fmt(d.net)}</span></p>
                        {d.anomaly && <p className="text-red-400 font-semibold mt-1">ANOMALY DETECTED</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 px-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 rounded bg-blue-500" /> Normal (positive)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 rounded bg-red-300" /> Normal (negative)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 rounded bg-red-500" /> Anomaly detected
              </div>
            </div>
          </div>

          {/* Detail table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Inflow</TableHead>
                <TableHead className="text-right">Outflow</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Finding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((d) => (
                <TableRow key={d.month} className={cn(d.anomaly && 'bg-red-50/50')}>
                  <TableCell className="font-medium text-gray-900">{d.month}</TableCell>
                  <TableCell className="text-right font-mono text-green-700">${d.inflow.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-red-600">${d.outflow.toLocaleString()}</TableCell>
                  <TableCell className={cn('text-right font-mono font-semibold', d.net >= 0 ? 'text-green-700' : 'text-red-600')}>
                    {d.net >= 0 ? '' : '-'}${Math.abs(d.net).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {d.anomaly ? (
                      <Badge variant="destructive" className="border border-red-200">Anomaly</Badge>
                    ) : (
                      <Badge variant="success" className="border border-green-200">Normal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-sm">{d.reason || '\u2014'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {!results && !scanning && <EmptyState message='Click "Run Analysis" to detect cash flow anomalies over the trailing 12 months' />}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ForensicTools() {
  const [activeTab, setActiveTab] = useState('patterns');
  const toast = useToast();

  const totalFlags = FLAGGED_TRANSACTIONS.length + VENDOR_RISK_DATA.filter(v => v.flags.length > 0).length + JOURNAL_ENTRY_FINDINGS.length + CASH_FLOW_DATA.filter(d => d.anomaly).length;
  const criticalCount = FLAGGED_TRANSACTIONS.filter(t => t.risk === 'Critical').length + JOURNAL_ENTRY_FINDINGS.filter(e => e.severity === 'Critical').length;
  const highCount = FLAGGED_TRANSACTIONS.filter(t => t.risk === 'High').length + JOURNAL_ENTRY_FINDINGS.filter(e => e.severity === 'High').length + CASH_FLOW_DATA.filter(d => d.anomaly).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold">Forensic Accounting Tools</h2>
        <Button
          variant="outline"
          onClick={() => toast.info('Forensic report generation will export all findings to PDF.')}
        >
          Export Report
        </Button>
      </div>
      <p className="text-gray-500 mb-8">Advanced fraud detection and financial irregularity analysis — powered by Astra AI</p>

      <SummaryCards
        flags={totalFlags}
        critical={criticalCount}
        high={highCount}
        lastScan="2026-03-25 09:14 AM"
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start rounded-none border-b border-gray-200 bg-transparent p-0 h-auto mb-6">
          <TabsTrigger value="patterns" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3">
            Transaction Patterns
          </TabsTrigger>
          <TabsTrigger value="vendors" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3">
            Vendor Risk Matrix
          </TabsTrigger>
          <TabsTrigger value="journals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3">
            Journal Entry Tester
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3">
            Cash Flow Anomalies
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-6">
            <TabsContent value="patterns" className="mt-0">
              <TransactionPatternScanner toast={toast} />
            </TabsContent>
            <TabsContent value="vendors" className="mt-0">
              <VendorRiskMatrix toast={toast} />
            </TabsContent>
            <TabsContent value="journals" className="mt-0">
              <JournalEntryTester toast={toast} />
            </TabsContent>
            <TabsContent value="cashflow" className="mt-0">
              <CashFlowAnomalyDetector toast={toast} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <ProprietaryNotice />
    </motion.div>
  );
}
