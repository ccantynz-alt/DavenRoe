import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { cn } from '@/lib/utils';

// All major tax deadlines across US, AU, NZ, GB
const DEADLINES = [
  // Australia
  { jurisdiction: 'AU', name: 'BAS Q1 (Jul-Sep)', date: '2026-10-28', type: 'gst', recurrence: 'quarterly' },
  { jurisdiction: 'AU', name: 'BAS Q2 (Oct-Dec)', date: '2027-02-28', type: 'gst', recurrence: 'quarterly' },
  { jurisdiction: 'AU', name: 'BAS Q3 (Jan-Mar)', date: '2026-04-28', type: 'gst', recurrence: 'quarterly' },
  { jurisdiction: 'AU', name: 'BAS Q4 (Apr-Jun)', date: '2026-07-28', type: 'gst', recurrence: 'quarterly' },
  { jurisdiction: 'AU', name: 'Company Tax Return', date: '2026-10-31', type: 'income_tax', recurrence: 'annual' },
  { jurisdiction: 'AU', name: 'Individual Tax Return', date: '2026-10-31', type: 'income_tax', recurrence: 'annual' },
  { jurisdiction: 'AU', name: 'STP Finalisation', date: '2026-07-14', type: 'payroll', recurrence: 'annual' },
  { jurisdiction: 'AU', name: 'FBT Return', date: '2026-05-21', type: 'fringe_benefits', recurrence: 'annual' },
  { jurisdiction: 'AU', name: 'PAYG Instalment Q3', date: '2026-04-28', type: 'payg', recurrence: 'quarterly' },

  // United States
  { jurisdiction: 'US', name: 'Q1 Estimated Tax', date: '2026-04-15', type: 'income_tax', recurrence: 'quarterly' },
  { jurisdiction: 'US', name: 'Q2 Estimated Tax', date: '2026-06-15', type: 'income_tax', recurrence: 'quarterly' },
  { jurisdiction: 'US', name: 'Q3 Estimated Tax', date: '2026-09-15', type: 'income_tax', recurrence: 'quarterly' },
  { jurisdiction: 'US', name: 'Q4 Estimated Tax', date: '2027-01-15', type: 'income_tax', recurrence: 'quarterly' },
  { jurisdiction: 'US', name: 'Individual Tax Return (1040)', date: '2026-04-15', type: 'income_tax', recurrence: 'annual' },
  { jurisdiction: 'US', name: 'Corporate Tax Return (1120)', date: '2026-04-15', type: 'income_tax', recurrence: 'annual' },
  { jurisdiction: 'US', name: 'W-2 / 1099 Filing', date: '2026-01-31', type: 'payroll', recurrence: 'annual' },
  { jurisdiction: 'US', name: 'Quarterly Payroll (941)', date: '2026-04-30', type: 'payroll', recurrence: 'quarterly' },
  { jurisdiction: 'US', name: 'Sales Tax (varies by state)', date: '2026-04-20', type: 'sales_tax', recurrence: 'monthly' },

  // New Zealand
  { jurisdiction: 'NZ', name: 'GST Return (2-monthly)', date: '2026-04-28', type: 'gst', recurrence: 'bimonthly' },
  { jurisdiction: 'NZ', name: 'GST Return (6-monthly)', date: '2026-05-07', type: 'gst', recurrence: 'biannual' },
  { jurisdiction: 'NZ', name: 'Income Tax Return (IR3)', date: '2026-07-07', type: 'income_tax', recurrence: 'annual' },
  { jurisdiction: 'NZ', name: 'Provisional Tax P1', date: '2026-08-28', type: 'income_tax', recurrence: 'tri-annual' },
  { jurisdiction: 'NZ', name: 'Provisional Tax P2', date: '2027-01-15', type: 'income_tax', recurrence: 'tri-annual' },
  { jurisdiction: 'NZ', name: 'Employer Deductions (PAYE)', date: '2026-04-20', type: 'payroll', recurrence: 'monthly' },

  // United Kingdom
  { jurisdiction: 'GB', name: 'VAT Return Q1', date: '2026-05-07', type: 'vat', recurrence: 'quarterly' },
  { jurisdiction: 'GB', name: 'VAT Return Q2', date: '2026-08-07', type: 'vat', recurrence: 'quarterly' },
  { jurisdiction: 'GB', name: 'Corporation Tax', date: '2027-01-01', type: 'income_tax', recurrence: 'annual' },
  { jurisdiction: 'GB', name: 'Self Assessment', date: '2027-01-31', type: 'income_tax', recurrence: 'annual' },
  { jurisdiction: 'GB', name: 'PAYE RTI Submission', date: '2026-04-19', type: 'payroll', recurrence: 'monthly' },
  { jurisdiction: 'GB', name: 'Making Tax Digital (MTD)', date: '2026-05-07', type: 'vat', recurrence: 'quarterly' },
];

const jurisdictionColors = {
  AU: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  US: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  NZ: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  GB: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
};

const jurisdictionNames = { AU: 'Australia', US: 'United States', NZ: 'New Zealand', GB: 'United Kingdom' };

const typeIcons = {
  gst: '$', vat: '$', income_tax: '%', payroll: '@', sales_tax: '#',
  fringe_benefits: '*', payg: '+',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ComplianceCalendar() {
  const [filterJurisdiction, setFilterJurisdiction] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [view, setView] = useState('timeline');

  const today = new Date().toISOString().split('T')[0];

  const filtered = DEADLINES
    .filter(d => filterJurisdiction === 'all' || d.jurisdiction === filterJurisdiction)
    .filter(d => filterType === 'all' || d.type === filterType)
    .sort((a, b) => a.date.localeCompare(b.date));

  const upcoming = filtered.filter(d => d.date >= today);
  const overdue = filtered.filter(d => d.date < today);

  const daysUntil = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date(today)) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    if (diff <= 7) return `${diff} days`;
    if (diff <= 30) return `${Math.ceil(diff / 7)} weeks`;
    return `${Math.ceil(diff / 30)} months`;
  };

  const urgencyBadgeVariant = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date(today)) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'destructive';
    if (diff <= 7) return 'destructive';
    if (diff <= 30) return 'warning';
    return 'success';
  };

  const urgencyBadgeClassName = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date(today)) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'bg-red-500 text-white border-red-500';
    return '';
  };

  const types = [...new Set(DEADLINES.map(d => d.type))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Compliance Calendar</h2>
          <p className="text-gray-500 mt-1">Every tax deadline across all jurisdictions, in one place</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'timeline' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setView('timeline')}
          >
            Timeline
          </Button>
          <Button
            variant={view === 'grid' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setView('grid')}
          >
            By Jurisdiction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex gap-1">
          <FilterButton label="All" active={filterJurisdiction === 'all'} onClick={() => setFilterJurisdiction('all')} />
          {['AU', 'US', 'NZ', 'GB'].map(j => (
            <FilterButton key={j} label={j} active={filterJurisdiction === j} onClick={() => setFilterJurisdiction(j)}
              color={jurisdictionColors[j]} />
          ))}
        </div>
        <div className="border-l pl-3 flex gap-1">
          <FilterButton label="All Types" active={filterType === 'all'} onClick={() => setFilterType('all')} />
          {types.map(t => (
            <FilterButton key={t} label={t.replace(/_/g, ' ')} active={filterType === t} onClick={() => setFilterType(t)} />
          ))}
        </div>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-800 text-base">
                {overdue.length} Overdue Deadline{overdue.length > 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {overdue.map((d, i) => (
                    <TableRow key={i} className="border-red-100 hover:bg-red-100/50">
                      <TableCell className="py-2 px-2 w-16">
                        <Badge className={cn(jurisdictionColors[d.jurisdiction].bg, jurisdictionColors[d.jurisdiction].text, 'border-transparent')}>
                          {d.jurisdiction}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-2 font-medium text-red-800">{d.name}</TableCell>
                      <TableCell className="py-2 px-2 text-right">
                        <Badge className="bg-red-500 text-white border-red-500">{daysUntil(d.date)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-4 gap-4 mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {['AU', 'US', 'NZ', 'GB'].map(j => {
          const jDeadlines = upcoming.filter(d => d.jurisdiction === j);
          const next = jDeadlines[0];
          const c = jurisdictionColors[j];
          return (
            <motion.div key={j} variants={itemVariants}>
              <Card className={cn(c.bg, c.border)}>
                <CardContent className="p-4">
                  <p className={cn('text-xs font-medium', c.text)}>{jurisdictionNames[j]}</p>
                  <p className={cn('text-2xl font-bold', c.text)}>{jDeadlines.length}</p>
                  <p className="text-xs text-gray-500">upcoming deadlines</p>
                  {next && <p className="text-xs mt-2 text-gray-600">Next: {next.name} ({daysUntil(next.date)})</p>}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Timeline View */}
      {view === 'timeline' && (
        <motion.div
          className="space-y-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {upcoming.map((d, i) => {
            const c = jurisdictionColors[d.jurisdiction];
            return (
              <motion.div key={i} variants={itemVariants}>
                <Card className="hover:shadow-md">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg font-mono', c.bg, c.text)}>
                        {typeIcons[d.type] || '$'}
                      </div>
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={cn(c.bg, c.text, 'border-transparent')}>{d.jurisdiction}</Badge>
                          <span className="text-xs text-gray-400">{d.type.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-gray-400">{d.recurrence}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{d.date}</p>
                      <Badge
                        variant={urgencyBadgeVariant(d.date)}
                        className={urgencyBadgeClassName(d.date)}
                      >
                        {daysUntil(d.date)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {['AU', 'US', 'NZ', 'GB'].map(j => {
            const jDeadlines = upcoming.filter(d => d.jurisdiction === j);
            const c = jurisdictionColors[j];
            return (
              <motion.div key={j} variants={itemVariants}>
                <Card className={cn('overflow-hidden', c.border)}>
                  <CardHeader className={cn('py-3 px-4', c.bg)}>
                    <CardTitle className={cn('text-base', c.text)}>{jurisdictionNames[j]}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {jDeadlines.map((d, i) => (
                          <TableRow key={i}>
                            <TableCell className="py-3 px-4">
                              <p className="font-medium text-sm">{d.name}</p>
                              <p className="text-xs text-gray-400">{d.type.replace(/_/g, ' ')}</p>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right">
                              <p className="font-mono text-xs">{d.date}</p>
                              <Badge
                                variant={urgencyBadgeVariant(d.date)}
                                className={urgencyBadgeClassName(d.date)}
                              >
                                {daysUntil(d.date)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {jDeadlines.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="py-6 text-center text-gray-400 text-sm">
                              No upcoming deadlines
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

function FilterButton({ label, active, onClick, color }) {
  return (
    <Button
      variant={active ? (color ? 'ghost' : 'default') : 'ghost'}
      size="sm"
      onClick={onClick}
      className={cn(
        'text-xs',
        active
          ? color
            ? cn(color.bg, color.text, 'hover:opacity-80')
            : ''
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      )}
    >
      {label}
    </Button>
  );
}
