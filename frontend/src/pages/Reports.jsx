import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';

const REPORT_TYPES = [
  { id: 'profit_and_loss', name: 'Profit & Loss', description: 'Revenue minus expenses for a period', icon: '$' },
  { id: 'balance_sheet', name: 'Balance Sheet', description: 'Assets, liabilities, and equity at a point in time', icon: '=' },
  { id: 'trial_balance', name: 'Trial Balance', description: 'All account balances — debits must equal credits', icon: '+' },
  { id: 'cash_flow', name: 'Cash Flow Statement', description: 'Operating, investing, and financing cash flows', icon: '~' },
  { id: 'general_ledger', name: 'General Ledger', description: 'Every transaction by account with running balances', icon: '#' },
  { id: 'aged_receivables', name: 'Aged Receivables', description: 'Who owes you money and how overdue it is', icon: '<' },
  { id: 'aged_payables', name: 'Aged Payables', description: 'Who you owe money to and how overdue it is', icon: '>' },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comparative, setComparative] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/reports/generate', {
        report_type: selectedReport.id,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        comparative,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate report. Ensure database is connected.');
      setResult(null);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (!result) return;
    const csv = jsonToCSV(result);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport?.id || 'report'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Reports</h2>
        <p className="text-gray-500 mt-1">Generate standard financial statements from your ledger</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report selector */}
        <motion.div
          className="lg:col-span-1 space-y-2"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {REPORT_TYPES.map((report) => (
            <Button
              key={report.id}
              variant="ghost"
              onClick={() => { setSelectedReport(report); setResult(null); setError(null); }}
              className={cn(
                'w-full justify-start text-left h-auto px-4 py-3 rounded-lg border transition-all',
                selectedReport?.id === report.id
                  ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-gray-400">{report.icon}</span>
                <div>
                  <div className="font-medium text-sm">{report.name}</div>
                  <div className="text-xs text-gray-400 font-normal whitespace-normal">{report.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </motion.div>

        {/* Report config & output */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          {selectedReport ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{selectedReport.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6 flex-wrap items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 pb-2">
                    <Switch checked={comparative} onCheckedChange={setComparative} />
                    Comparative
                  </label>
                  <Button onClick={handleGenerate} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>
                  {result && (
                    <Button variant="secondary" onClick={handleExportCSV}>
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  )}
                </div>

                {error && (
                  <Card className="mb-4 border-yellow-200 bg-yellow-50 shadow-none hover:shadow-none">
                    <CardContent className="p-4 pt-4">
                      <p className="text-yellow-800 text-sm">{error}</p>
                      <p className="text-yellow-600 text-xs mt-1">Reports pull from approved transactions in the ledger.</p>
                    </CardContent>
                  </Card>
                )}

                {result && <ReportRenderer report={result} type={selectedReport.id} />}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-gray-300 bg-gray-50 shadow-none hover:shadow-none">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Select a report type</p>
                <p className="text-gray-300 text-sm mt-1">Reports are generated from approved transactions in your ledger</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}


function ReportRenderer({ report, type }) {
  if (report.error) {
    return (
      <Card className="border-red-200 bg-red-50 shadow-none hover:shadow-none">
        <CardContent className="p-4 pt-4 text-red-600">{report.error}</CardContent>
      </Card>
    );
  }

  const meta = report.metadata;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Metadata */}
      {meta && (
        <Card className="bg-gray-50 shadow-none hover:shadow-none">
          <CardContent className="p-3 pt-3 flex gap-6 text-xs text-gray-500">
            {meta.period_start && <span>Period: {meta.period_start} to {meta.period_end}</span>}
            <span>Transactions: {meta.transactions_included}</span>
            <span>Generated: {meta.generated_at}</span>
          </CardContent>
        </Card>
      )}

      {/* P&L */}
      {type === 'profit_and_loss' && report.sections && (
        <div className="space-y-3">
          <ReportSection title="Revenue" data={report.sections.revenue} />
          <ReportSection title="Cost of Goods Sold" data={report.sections.cost_of_goods_sold} />
          <TotalRow label="Gross Profit" value={report.sections.gross_profit} sub={`${report.sections.gross_margin_pct}% margin`} />
          <ReportSection title="Operating Expenses" data={report.sections.operating_expenses} />
          <TotalRow label="Operating Profit (EBIT)" value={report.sections.operating_profit} />
          <ReportSection title="Other Income/Expenses" data={report.sections.other_income_expenses} />
          <ReportSection title="Tax" data={report.sections.tax} />
          <TotalRow label="Net Profit" value={report.net_profit} sub={`${report.net_margin_pct}% margin`} highlight />
        </div>
      )}

      {/* Balance Sheet */}
      {type === 'balance_sheet' && report.sections && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">As at: {report.as_at}</p>
          <ReportSection title="Assets" data={report.sections.assets} />
          <ReportSection title="Liabilities" data={report.sections.liabilities} />
          <Card className="bg-gray-50 shadow-none hover:shadow-none">
            <CardContent className="p-4 pt-4">
              <h4 className="font-semibold text-sm mb-2">Equity</h4>
              {report.sections.equity?.accounts && Object.entries(report.sections.equity.accounts).map(([k, v]) => (
                <AccountRow key={k} name={k} amount={v} />
              ))}
              <AccountRow name="Retained Earnings (Current Period)" amount={report.sections.equity?.retained_earnings_current_period} />
              <div className="border-t mt-2 pt-2 flex justify-between font-semibold text-sm">
                <span>Total Equity</span><span>{report.sections.equity?.total}</span>
              </div>
            </CardContent>
          </Card>
          <TotalRow label="Total Assets" value={report.total_assets} />
          <TotalRow label="Total Liabilities + Equity" value={report.total_liabilities_and_equity} />
          <Badge
            variant={report.balanced ? 'success' : 'destructive'}
            className="text-sm px-4 py-2 rounded-lg w-full justify-center"
          >
            {report.balanced ? 'Balance sheet is balanced' : `Out of balance by ${report.difference}`}
          </Badge>
        </div>
      )}

      {/* Trial Balance */}
      {type === 'trial_balance' && (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(report.lines || []).map((line, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{line.account}</TableCell>
                  <TableCell className="text-right">{line.debit !== '0.00' ? line.debit : ''}</TableCell>
                  <TableCell className="text-right">{line.credit !== '0.00' ? line.credit : ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{report.total_debit}</TableCell>
                <TableCell className="text-right">{report.total_credit}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          <Badge
            variant={report.balanced ? 'success' : 'destructive'}
            className="mt-3 text-sm px-4 py-2 rounded-lg w-full justify-center"
          >
            {report.balanced ? `Balanced (${report.account_count} accounts)` : `Out of balance by ${report.difference}`}
          </Badge>
        </div>
      )}

      {/* Cash Flow */}
      {type === 'cash_flow' && report.sections && (
        <div className="space-y-3">
          <Card className="bg-gray-50 shadow-none hover:shadow-none">
            <CardContent className="p-4 pt-4">
              <h4 className="font-semibold text-sm mb-2">Operating Activities</h4>
              <AccountRow name="Net Profit" amount={report.sections.operating_activities?.net_profit} />
              <AccountRow name="Add Back: Depreciation/Amortization" amount={report.sections.operating_activities?.add_back_depreciation_amortization} />
              {report.sections.operating_activities?.working_capital_changes &&
                Object.entries(report.sections.operating_activities.working_capital_changes).map(([k, v]) => (
                  <AccountRow key={k} name={k.replace(/_/g, ' ')} amount={v} />
                ))
              }
              <div className="border-t mt-2 pt-2 flex justify-between font-semibold text-sm">
                <span>Cash from Operations</span>
                <span>{report.sections.operating_activities?.cash_from_operations}</span>
              </div>
            </CardContent>
          </Card>
          <ReportSection title="Investing Activities" data={report.sections.investing_activities} />
          <ReportSection title="Financing Activities" data={report.sections.financing_activities} />
          <TotalRow label="Net Change in Cash" value={report.net_change_in_cash} highlight />
        </div>
      )}

      {/* General Ledger */}
      {type === 'general_ledger' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{report.total_accounts} accounts</p>
          {(report.accounts || []).map((acc, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="bg-gray-50 p-4 flex-row items-center justify-between">
                <span className="font-mono text-sm font-medium">{acc.account}</span>
                <Badge variant="secondary">Balance: {acc.closing_balance}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acc.entries.map((e, j) => (
                      <TableRow key={j}>
                        <TableCell className="font-mono text-xs py-1 px-4">{e.date}</TableCell>
                        <TableCell className="text-xs py-1 px-4">{e.description}</TableCell>
                        <TableCell className="text-right text-xs py-1 px-4">{e.debit}</TableCell>
                        <TableCell className="text-right text-xs py-1 px-4">{e.credit}</TableCell>
                        <TableCell className="text-right text-xs py-1 px-4 font-medium">{e.balance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Aged Reports */}
      {(type === 'aged_receivables' || type === 'aged_payables') && (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">1-30</TableHead>
                <TableHead className="text-right">31-60</TableHead>
                <TableHead className="text-right">61-90</TableHead>
                <TableHead className="text-right">90+</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(report.lines || []).map((line, i) => (
                <TableRow key={i}>
                  <TableCell>{line.name}</TableCell>
                  <TableCell className="text-right">{line.current}</TableCell>
                  <TableCell className="text-right">{line['1_30_days']}</TableCell>
                  <TableCell className="text-right">{line['31_60_days']}</TableCell>
                  <TableCell className="text-right">{line['61_90_days']}</TableCell>
                  <TableCell className="text-right text-red-600">{line.over_90_days}</TableCell>
                  <TableCell className="text-right font-bold">{line.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {report.totals && (
              <TableFooter>
                <TableRow className="font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{report.totals.current}</TableCell>
                  <TableCell className="text-right">{report.totals['1_30_days']}</TableCell>
                  <TableCell className="text-right">{report.totals['31_60_days']}</TableCell>
                  <TableCell className="text-right">{report.totals['61_90_days']}</TableCell>
                  <TableCell className="text-right text-red-600">{report.totals.over_90_days}</TableCell>
                  <TableCell className="text-right">{report.totals.grand_total}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
          <p className="text-xs text-gray-400 mt-2">{report.customer_count || 0} {type === 'aged_receivables' ? 'customers' : 'vendors'}</p>
        </div>
      )}

      {/* Empty state */}
      {meta?.transactions_included === 0 && (
        <Card className="bg-gray-50 shadow-none hover:shadow-none">
          <CardContent className="p-6 pt-6 text-center">
            <p className="text-gray-500">No approved transactions found for this period.</p>
            <p className="text-gray-400 text-sm mt-1">Approve transactions in the Review Queue to see them in reports.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}


function ReportSection({ title, data }) {
  if (!data) return null;
  const accounts = data.accounts || data.items || {};
  return (
    <Card className="bg-gray-50 shadow-none hover:shadow-none">
      <CardContent className="p-4 pt-4">
        <h4 className="font-semibold text-sm mb-2">{title}</h4>
        {Object.entries(accounts).map(([name, amount]) => (
          <AccountRow key={name} name={name} amount={amount} />
        ))}
        {data.total && (
          <div className="border-t mt-2 pt-2 flex justify-between font-semibold text-sm">
            <span>Total</span><span>{data.total}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AccountRow({ name, amount }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-gray-600 font-mono text-xs">{name}</span>
      <span>{amount}</span>
    </div>
  );
}

function TotalRow({ label, value, sub, highlight }) {
  return (
    <Card className={cn(
      'shadow-none hover:shadow-none',
      highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-white'
    )}>
      <CardContent className="p-4 pt-4 flex items-center justify-between">
        <div>
          <span className="font-bold">{label}</span>
          {sub && <Badge variant="secondary" className="ml-2 font-normal">{sub}</Badge>}
        </div>
        <span className={cn('text-xl font-bold', highlight && 'text-indigo-700')}>{value}</span>
      </CardContent>
    </Card>
  );
}


function jsonToCSV(data) {
  // For trial balance / aged reports with lines array
  if (data.lines && Array.isArray(data.lines)) {
    const headers = Object.keys(data.lines[0] || {});
    const rows = data.lines.map(line => headers.map(h => line[h] || '').join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  // For P&L / Balance Sheet — flatten sections
  const rows = [];
  const flatten = (obj, prefix = '') => {
    for (const [key, val] of Object.entries(obj)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        flatten(val, prefix ? `${prefix} > ${key}` : key);
      } else {
        rows.push(`"${prefix ? `${prefix} > ${key}` : key}","${val}"`);
      }
    }
  };
  flatten(data);
  return rows.join('\n');
}
