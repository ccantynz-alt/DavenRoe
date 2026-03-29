import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { cn } from '@/lib/utils';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export default function AIInsights() {
  return (
    <motion.div initial="initial" animate="animate" variants={stagger}>
      <motion.div variants={fadeIn} className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">AI Command Center</h2>
          <p className="text-gray-500 mt-1">AI-powered insights, forecasts, and automation</p>
        </div>
        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
          Powered by Claude
        </Badge>
      </motion.div>

      <motion.div variants={fadeIn}>
        <Tabs defaultValue="forecast">
          <TabsList className="mb-6 overflow-x-auto h-auto flex-wrap gap-1">
            <TabsTrigger value="forecast">Cash Flow Forecast</TabsTrigger>
            <TabsTrigger value="anomalies">Anomaly Alerts</TabsTrigger>
            <TabsTrigger value="receipt">Receipt Scanner</TabsTrigger>
            <TabsTrigger value="reports">Natural Language Reports</TabsTrigger>
            <TabsTrigger value="insights">Weekly Digest</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast">
            <CashFlowForecast />
          </TabsContent>
          <TabsContent value="anomalies">
            <AnomalyAlerts />
          </TabsContent>
          <TabsContent value="receipt">
            <ReceiptScanner />
          </TabsContent>
          <TabsContent value="reports">
            <NaturalLanguageReports />
          </TabsContent>
          <TabsContent value="insights">
            <WeeklyDigest />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

function CashFlowForecast() {
  const [forecast, setForecast] = useState(DEMO_FORECAST);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/cash-flow-forecast');
      setForecast(res.data);
    } catch { /* use demo data */ }
    setLoading(false);
  };

  const maxAmount = Math.max(...forecast.weeks.map(w => Math.abs(w.projected_balance)));

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: '30-Day Forecast', value: forecast.day_30, color: 'green', border: 'border-l-green-500' },
          { label: '60-Day Forecast', value: forecast.day_60, color: 'blue', border: 'border-l-blue-500' },
          { label: '90-Day Forecast', value: forecast.day_90, color: 'purple', border: 'border-l-purple-500' },
        ].map((item, i) => (
          <motion.div key={i} variants={fadeIn}>
            <Card className={cn('border-l-4', item.border)}>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={cn('text-2xl font-bold', `text-${item.color}-600`)}>
                  ${item.value?.toLocaleString() || '0'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div variants={fadeIn}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>13-Week Rolling Forecast</CardTitle>
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {forecast.weeks.map((week, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">{week.label}</span>
                <div className="flex-1">
                  <Progress
                    value={Math.min(Math.abs(week.projected_balance) / maxAmount * 100, 100)}
                    className={cn(
                      'h-6',
                      week.projected_balance < 0 && '[&>div]:bg-red-500'
                    )}
                  />
                </div>
                <span className={cn(
                  'text-sm font-medium w-24 text-right',
                  week.projected_balance >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  ${week.projected_balance.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function AnomalyAlerts() {
  const severityBadgeVariant = (severity) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'warning';
      default: return 'secondary';
    }
  };

  const severityBorder = (severity) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-blue-500';
    }
  };

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-4">
      {DEMO_ANOMALIES.map((alert, i) => (
        <motion.div key={i} variants={fadeIn}>
          <Card className={cn('border-l-4', severityBorder(alert.severity))}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={severityBadgeVariant(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="text-xs text-gray-400">{alert.type}</span>
                  </div>
                  <h4 className="font-semibold">{alert.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{alert.timestamp}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="secondary" size="sm" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                  Investigate
                </Button>
                <Button variant="secondary" size="sm">
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ReceiptScanner() {
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [input, setInput] = useState('Uber Eats - $42.50 on 15 March 2024\nRef: UE-2024-0315\nPayment: Visa ending 4242');

  const scan = async () => {
    setScanning(true);
    try {
      const res = await api.post('/ai/receipt-scan', { text: input });
      setResult(res.data);
    } catch {
      setResult({
        merchant: 'Uber Eats',
        amount: 42.50,
        date: '2024-03-15',
        category: 'Meals & Entertainment',
        account_code: '6400',
        tax_deductible: true,
        gst_amount: 3.86,
        confidence: 0.94,
      });
    }
    setScanning(false);
    toast.success('Receipt scanned and categorized');
  };

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <motion.div variants={fadeIn}>
        <Card>
          <CardHeader>
            <CardTitle>Scan Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm mb-4 focus:border-astra-500 focus:outline-none focus:ring-2 focus:ring-astra-500/20"
              placeholder="Paste receipt text or details here..."
            />
            <Button onClick={scan} disabled={scanning} className="w-full">
              {scanning ? 'Scanning...' : 'Scan & Categorize'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {result && (
        <motion.div variants={fadeIn}>
          <Card>
            <CardHeader>
              <CardTitle>AI Result</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <ResultRow label="Merchant" value={result.merchant} />
                  <ResultRow label="Amount" value={`$${result.amount?.toFixed(2)}`} />
                  <ResultRow label="Date" value={result.date} />
                  <ResultRow label="Category" value={result.category} />
                  <ResultRow label="Account Code" value={result.account_code} />
                  <ResultRow label="GST Amount" value={result.gst_amount ? `$${result.gst_amount.toFixed(2)}` : 'N/A'} />
                  <ResultRow label="Tax Deductible" value={result.tax_deductible ? 'Yes' : 'No'} />
                  <ResultRow label="AI Confidence" value={`${(result.confidence * 100).toFixed(0)}%`} />
                </TableBody>
              </Table>
              <Button variant="success" className="w-full mt-4">
                Create Transaction
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

function NaturalLanguageReports() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const suggested = [
    'Show me revenue by client last quarter',
    'What were our top 5 expenses this month?',
    'Compare this quarter to last quarter',
    'Which clients have overdue invoices?',
  ];

  const run = async (q) => {
    const question = q || query;
    if (!question.trim()) return;
    setLoading(true);
    setQuery(question);
    try {
      const res = await api.post('/ai/natural-report', { query: question });
      setResult(res.data);
    } catch {
      setResult({
        answer: 'Based on the available data, your top revenue sources this quarter were: Harbour Bridge Holdings ($45,200), Pacific Ventures ($32,800), and Southern Cross Ltd ($28,500). Total quarterly revenue is $156,700, up 12% from last quarter.',
        data_points: [
          { label: 'Total Revenue', value: '$156,700' },
          { label: 'Growth', value: '+12%' },
          { label: 'Top Client', value: 'Harbour Bridge Holdings' },
        ],
      });
    }
    setLoading(false);
  };

  return (
    <motion.div initial="initial" animate="animate" variants={stagger}>
      <motion.div variants={fadeIn}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ask Astra About Your Finances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              <Input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && run()}
                placeholder="Type a question about your financial data..."
                className="flex-1"
              />
              <Button onClick={() => run()} disabled={loading}>
                {loading ? 'Thinking...' : 'Ask'}
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {suggested.map((s, i) => (
                <Button key={i} variant="ghost" size="sm" onClick={() => run(s)}
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full text-xs">
                  {s}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {result && (
        <motion.div variants={fadeIn}>
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">{result.answer}</p>
              {result.data_points && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.data_points.map((dp, i) => (
                    <Card key={i} className="bg-gray-50 border-0 shadow-none">
                      <CardContent className="p-4">
                        <p className="text-xs text-gray-500">{dp.label}</p>
                        <p className="text-xl font-bold">{dp.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

function WeeklyDigest() {
  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-4">
      <motion.div variants={fadeIn}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Weekly Financial Digest</CardTitle>
            <Badge variant="outline">Week of March 18, 2024</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <InsightCard emoji="↑" title="Revenue up 8%" body="Total revenue this week was $42,300, compared to $39,100 last week. Primary growth came from Harbour Bridge Holdings ($12,500 invoice paid)." type="positive" />
            <InsightCard emoji="!" title="3 invoices now overdue" body="Pacific Ventures ($8,200), Southern Cross ($3,400), and Kiwi Imports ($1,800) have passed their due dates. Consider sending automated reminders." type="warning" />
            <InsightCard emoji="$" title="Cash position strong" body="Current bank balance of $186,400 covers 4.2 months of operating expenses at current burn rate of $44,200/month." type="positive" />
            <InsightCard emoji="%" title="BAS deadline in 21 days" body="Q3 BAS is due April 28. Estimated GST payable is $12,450. All source transactions have been categorized and reconciled." type="info" />
            <InsightCard emoji="~" title="Anomaly detected" body="Unusual payment of $15,000 to 'Consulting Services Pty Ltd' — no prior transactions with this vendor. Flagged for review." type="alert" />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function InsightCard({ emoji, title, body, type }) {
  const variant = type === 'positive' ? 'success' : type === 'warning' ? 'warning' : type === 'alert' ? 'destructive' : 'default';
  const bgClass = type === 'positive' ? 'bg-green-50 border-green-200' : type === 'warning' ? 'bg-yellow-50 border-yellow-200' : type === 'alert' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';

  return (
    <Card className={cn('shadow-none', bgClass)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Badge variant={variant} className="mt-0.5 shrink-0">{emoji}</Badge>
          <div>
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">{body}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultRow({ label, value }) {
  return (
    <TableRow>
      <TableCell className="text-sm text-gray-500 py-2 pl-0">{label}</TableCell>
      <TableCell className="text-sm font-medium text-right py-2 pr-0">{value}</TableCell>
    </TableRow>
  );
}

const DEMO_FORECAST = {
  day_30: 185000,
  day_60: 172000,
  day_90: 164000,
  weeks: [
    { label: 'Week 1', projected_balance: 186400 },
    { label: 'Week 2', projected_balance: 182100 },
    { label: 'Week 3', projected_balance: 188500 },
    { label: 'Week 4', projected_balance: 185000 },
    { label: 'Week 5', projected_balance: 179200 },
    { label: 'Week 6', projected_balance: 175800 },
    { label: 'Week 7', projected_balance: 180400 },
    { label: 'Week 8', projected_balance: 172000 },
    { label: 'Week 9', projected_balance: 168500 },
    { label: 'Week 10', projected_balance: 171200 },
    { label: 'Week 11', projected_balance: 166800 },
    { label: 'Week 12', projected_balance: 164000 },
    { label: 'Week 13', projected_balance: 162500 },
  ],
};

const DEMO_ANOMALIES = [
  { severity: 'critical', type: 'Unusual Vendor', title: 'New vendor with large payment', description: 'First-time payment of $15,000 to "Consulting Services Pty Ltd" — no ABN on record, no prior transactions.', timestamp: '2h ago' },
  { severity: 'high', type: 'Payment Splitting', title: 'Possible payment splitting detected', description: '3 payments of $9,900 each to "Office Supplies Co" within 48 hours — just under $10,000 reporting threshold.', timestamp: '5h ago' },
  { severity: 'medium', type: 'Round Numbers', title: 'Cluster of round-number payments', description: '8 transactions this week with amounts ending in .00 — statistically unusual compared to normal distribution.', timestamp: '1d ago' },
  { severity: 'low', type: 'Weekend Activity', title: 'Transactions posted on Sunday', description: '2 manual journal entries posted on Sunday at 2:14 AM — outside normal business hours.', timestamp: '2d ago' },
];
