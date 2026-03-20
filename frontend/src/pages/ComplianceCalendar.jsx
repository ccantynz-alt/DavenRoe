import { useState } from 'react';

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

  const urgencyColor = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date(today)) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'bg-red-500 text-white';
    if (diff <= 7) return 'bg-red-100 text-red-700';
    if (diff <= 30) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const types = [...new Set(DEADLINES.map(d => d.type))];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Compliance Calendar</h2>
          <p className="text-gray-500 mt-1">Every tax deadline across all jurisdictions, in one place</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('timeline')}
            className={`px-3 py-1.5 rounded-lg text-sm ${view === 'timeline' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
            Timeline
          </button>
          <button onClick={() => setView('grid')}
            className={`px-3 py-1.5 rounded-lg text-sm ${view === 'grid' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
            By Jurisdiction
          </button>
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">{overdue.length} Overdue Deadline{overdue.length > 1 ? 's' : ''}</h3>
          <div className="space-y-2">
            {overdue.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${jurisdictionColors[d.jurisdiction].bg} ${jurisdictionColors[d.jurisdiction].text}`}>
                    {d.jurisdiction}
                  </span>
                  <span className="font-medium text-red-800">{d.name}</span>
                </div>
                <span className="text-red-600 font-medium">{daysUntil(d.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {['AU', 'US', 'NZ', 'GB'].map(j => {
          const jDeadlines = upcoming.filter(d => d.jurisdiction === j);
          const next = jDeadlines[0];
          const c = jurisdictionColors[j];
          return (
            <div key={j} className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
              <p className={`text-xs font-medium ${c.text}`}>{jurisdictionNames[j]}</p>
              <p className={`text-2xl font-bold ${c.text}`}>{jDeadlines.length}</p>
              <p className="text-xs text-gray-500">upcoming deadlines</p>
              {next && <p className="text-xs mt-2 text-gray-600">Next: {next.name} ({daysUntil(next.date)})</p>}
            </div>
          );
        })}
      </div>

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="space-y-2">
          {upcoming.map((d, i) => {
            const c = jurisdictionColors[d.jurisdiction];
            return (
              <div key={i} className="bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-mono ${c.bg} ${c.text}`}>
                    {typeIcons[d.type] || '$'}
                  </div>
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{d.jurisdiction}</span>
                      <span className="text-xs text-gray-400">{d.type.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-400">{d.recurrence}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{d.date}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyColor(d.date)}`}>
                    {daysUntil(d.date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['AU', 'US', 'NZ', 'GB'].map(j => {
            const jDeadlines = upcoming.filter(d => d.jurisdiction === j);
            const c = jurisdictionColors[j];
            return (
              <div key={j} className={`border rounded-xl overflow-hidden ${c.border}`}>
                <div className={`px-4 py-3 ${c.bg}`}>
                  <h4 className={`font-semibold ${c.text}`}>{jurisdictionNames[j]}</h4>
                </div>
                <div className="divide-y">
                  {jDeadlines.map((d, i) => (
                    <div key={i} className="px-4 py-3 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.type.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs">{d.date}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyColor(d.date)}`}>
                          {daysUntil(d.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {jDeadlines.length === 0 && (
                    <div className="px-4 py-6 text-center text-gray-400 text-sm">No upcoming deadlines</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterButton({ label, active, onClick, color }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? color ? `${color.bg} ${color.text}` : 'bg-indigo-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}>
      {label}
    </button>
  );
}
