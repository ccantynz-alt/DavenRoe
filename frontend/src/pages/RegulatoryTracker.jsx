import { useState } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const CHANGES = [
  {
    id: 1, date: '2026-03-20', authority: 'ATO', jurisdiction: 'AU', severity: 'high',
    title: 'Super Guarantee rate increase to 12% from 1 July 2026',
    summary: 'The Superannuation Guarantee rate will increase from 11.5% to 12% effective 1 July 2026. This affects all employers with eligible employees.',
    impact: 'All AU entities with employees. Payroll calculations must be updated. Estimated additional cost: $500-2,000 per employee per year.',
    action: 'AlecRae payroll calculator will auto-update on 1 July. No action required — but inform clients about the cost increase now so they can budget.',
    affectedClients: ['Coastal Coffee Co', 'Swift Logistics', 'GreenLeaf Organics'],
    status: 'auto_updated',
  },
  {
    id: 2, date: '2026-03-15', authority: 'HMRC', jurisdiction: 'UK', severity: 'medium',
    title: 'Making Tax Digital — quarterly reporting mandatory for all VAT-registered businesses',
    summary: 'From April 2026, all VAT-registered businesses must submit quarterly digital tax returns through MTD-compatible software. No more annual filing option.',
    impact: 'Thames Legal Partners (UK entity) must now file quarterly instead of annually. Additional 3 filings per year.',
    action: 'Compliance Calendar already updated with quarterly deadlines. VAT returns can be generated and filed directly from AlecRae.',
    affectedClients: ['Thames Legal Partners'],
    status: 'action_needed',
  },
  {
    id: 3, date: '2026-03-10', authority: 'IRS', jurisdiction: 'US', severity: 'low',
    title: 'Form 1099-K threshold remains at $600 for 2026',
    summary: 'The IRS confirmed the $600 reporting threshold for Form 1099-K (payment card and third-party network transactions) remains for tax year 2026.',
    impact: 'US entities receiving payments via Stripe, PayPal, etc. above $600 will receive 1099-K forms. No change from 2025.',
    action: 'No action required. AlecRae already tracks 1099-K eligible payments.',
    affectedClients: ['NorthStar Consulting LLC'],
    status: 'no_action',
  },
  {
    id: 4, date: '2026-03-05', authority: 'IRD', jurisdiction: 'NZ', severity: 'medium',
    title: 'GST rate review announced — potential increase to 16.5%',
    summary: 'The NZ Government has announced a review of the GST rate as part of the 2026 budget. If approved, the rate could increase from 15% to 16.5% from 1 October 2026.',
    impact: 'All NZ entities. Invoicing, pricing, and tax calculations would need updating. Clients should be advised to review pricing strategies.',
    action: 'Monitor for confirmation. AlecRae tax engine will auto-update if the change is enacted. Draft client advisory email prepared.',
    affectedClients: ['Kiwi Design Studio'],
    status: 'monitoring',
  },
  {
    id: 5, date: '2026-02-28', authority: 'ATO', jurisdiction: 'AU', severity: 'high',
    title: 'Instant Asset Write-Off threshold reduced to $20,000',
    summary: 'The $20,000 instant asset write-off threshold for small businesses has been confirmed for the 2025-26 income year. The previous $150,000 threshold (COVID-era) has expired.',
    impact: 'Clients purchasing assets above $20,000 must now depreciate them over time instead of claiming an immediate deduction.',
    action: 'Review pending asset purchases for all AU clients. Advise any client planning major purchases to consider timing. AlecRae depreciation schedules auto-apply the correct method.',
    affectedClients: ['Coastal Coffee Co', 'GreenLeaf Organics'],
    status: 'action_needed',
  },
];

const STATUS_COLORS = {
  auto_updated: 'bg-green-100 text-green-700',
  action_needed: 'bg-red-100 text-red-700',
  no_action: 'bg-gray-100 text-gray-600',
  monitoring: 'bg-amber-100 text-amber-700',
};
const STATUS_LABELS = {
  auto_updated: 'Auto-Updated', action_needed: 'Action Needed',
  no_action: 'No Action', monitoring: 'Monitoring',
};
const SEVERITY_COLORS = {
  high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-600',
};
const JURISDICTION_COLORS = {
  AU: 'bg-blue-100 text-blue-700', NZ: 'bg-emerald-100 text-emerald-700',
  UK: 'bg-purple-100 text-purple-700', US: 'bg-orange-100 text-orange-700',
};

export default function RegulatoryTracker() {
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const filtered = filter === 'all' ? CHANGES : CHANGES.filter(c => c.jurisdiction === filter || c.status === filter);
  const actionNeeded = CHANGES.filter(c => c.status === 'action_needed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regulatory Change Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI monitors ATO, IRD, HMRC, and IRS for law changes that affect your clients</p>
        </div>
        <button onClick={() => toast.success('Regulatory scan complete — 5 changes tracked')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          Scan for Updates
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Active Changes</p>
          <p className="text-2xl font-bold text-gray-900">{CHANGES.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Action Needed</p>
          <p className="text-2xl font-bold text-red-600">{actionNeeded}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Auto-Updated</p>
          <p className="text-2xl font-bold text-green-600">{CHANGES.filter(c => c.status === 'auto_updated').length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Monitoring</p>
          <p className="text-2xl font-bold text-amber-600">{CHANGES.filter(c => c.status === 'monitoring').length}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'AU', 'NZ', 'UK', 'US', 'action_needed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${filter === f ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {f === 'all' ? 'All' : f === 'action_needed' ? 'Action Needed' : f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(change => (
          <div key={change.id} className="bg-white border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${JURISDICTION_COLORS[change.jurisdiction]}`}>{change.authority}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[change.severity]}`}>{change.severity}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[change.status]}`}>{STATUS_LABELS[change.status]}</span>
              <span className="text-[10px] text-gray-400">{change.date}</span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">{change.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{change.summary}</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-red-600 mb-1">IMPACT</p>
                <p className="text-xs text-red-700">{change.impact}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-blue-600 mb-1">RECOMMENDED ACTION</p>
                <p className="text-xs text-blue-700">{change.action}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {change.affectedClients.map(client => (
                  <span key={client} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{client}</span>
                ))}
              </div>
              {change.status === 'action_needed' && (
                <button onClick={() => toast.success('Client advisory emails drafted — review in Communications')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
                  Draft Client Advisory
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ProprietaryNotice />
    </div>
  );
}
