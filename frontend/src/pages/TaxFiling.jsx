import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const RETURN_TYPES = [
  { id: 'bas', label: 'BAS', full: 'Business Activity Statement', jurisdiction: 'AU' },
  { id: 'gst_nz', label: 'GST Return', full: 'Goods & Services Tax Return', jurisdiction: 'NZ' },
  { id: 'vat_uk', label: 'VAT Return', full: 'MTD VAT Return', jurisdiction: 'GB' },
  { id: 'sales_tax', label: 'Sales Tax', full: 'Quarterly Sales Tax Summary', jurisdiction: 'US' },
];

const PERIODS = [
  { id: 'Q1', label: 'Q1 (Jan–Mar)' },
  { id: 'Q2', label: 'Q2 (Apr–Jun)' },
  { id: 'Q3', label: 'Q3 (Jul–Sep)' },
  { id: 'Q4', label: 'Q4 (Oct–Dec)' },
];

export default function TaxFiling() {
  const [returns, setReturns] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [selectedType, setSelectedType] = useState('bas');
  const [selectedPeriod, setSelectedPeriod] = useState('Q1');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.get('/tax/returns').then(r => r.data).catch(() => ({ returns: DEMO_RETURNS })),
      api.get('/tax/returns/deadlines').then(r => r.data).catch(() => ({ deadlines: DEMO_DEADLINES })),
    ]).then(([ret, dl]) => {
      setReturns(ret.returns || []);
      setDeadlines(dl.deadlines || []);
      setLoading(false);
    });
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/tax/returns/generate', {
        return_type: selectedType,
        period: selectedPeriod,
        year: parseInt(selectedYear),
      });
      setPreview(res.data);
      toast.success('Return generated successfully');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate return');
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async () => {
    if (!preview?.id) return;
    try {
      const res = await api.post(`/tax/returns/${preview.id}/validate`);
      setPreview(prev => ({ ...prev, validation: res.data }));
      toast.success('Validation complete');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Validation failed');
    }
  };

  const handleLodge = async () => {
    if (!preview?.id) return;
    try {
      await api.post(`/tax/returns/${preview.id}/lodge`);
      toast.success('Return marked as lodged');
      setPreview(prev => ({ ...prev, status: 'lodged' }));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to lodge');
    }
  };

  const returnInfo = RETURN_TYPES.find(r => r.id === selectedType);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Tax Filing</h2>
          <p className="text-gray-500 mt-1">Generate, validate, and lodge tax returns</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-4 border-l-4 border-l-yellow-500">
          <p className="text-xs text-gray-500">Next Deadline</p>
          <p className="text-lg font-bold">{deadlines[0]?.deadline || 'None'}</p>
          <p className="text-xs text-gray-400">{deadlines[0]?.description || ''}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Returns Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{returns.filter(r => r.status !== 'lodged').length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Filed This Year</p>
          <p className="text-2xl font-bold text-green-600">{returns.filter(r => r.status === 'lodged').length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Jurisdictions</p>
          <p className="text-2xl font-bold">4</p>
          <p className="text-xs text-gray-400">AU, NZ, GB, US</p>
        </div>
      </div>

      {/* Generate Return */}
      <div className="bg-white border rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">Generate Tax Return</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg">
              {RETURN_TYPES.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.label} ({rt.jurisdiction})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg">
              {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg">
              {['2024', '2023', '2022'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {generating ? 'Generating...' : 'Generate Return'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">{returnInfo?.full} — {returnInfo?.jurisdiction} jurisdiction</p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-white border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Return Preview</h3>
            <div className="flex gap-2">
              <StatusBadge status={preview.status || 'draft'} />
            </div>
          </div>

          {/* Return Lines */}
          <div className="bg-gray-50 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Line</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Description</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(preview.lines || []).map((line, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-2 font-mono text-gray-400">{line.code || i + 1}</td>
                    <td className="px-4 py-2">{line.label}</td>
                    <td className="px-4 py-2 text-right font-medium">${Number(line.amount || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan={2} className="px-4 py-2 font-semibold">Net Amount</td>
                  <td className="px-4 py-2 text-right font-bold text-lg">${Number(preview.net_amount || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Validation */}
          {preview.validation && (
            <div className="mb-4 space-y-2">
              <h4 className="font-medium text-sm">Validation Results</h4>
              {preview.validation.checks?.map((check, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm px-3 py-2 rounded ${
                  check.status === 'pass' ? 'bg-green-50 text-green-700' :
                  check.status === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  <span>{check.status === 'pass' ? '✓' : '!'}</span>
                  <span>{check.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleValidate}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
              Run Validation
            </button>
            <button onClick={handleLodge}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              Mark as Lodged
            </button>
          </div>
        </div>
      )}

      {/* Filing History */}
      <div className="bg-white border rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">Filing History</h3>
        {returns.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No returns filed yet. Generate your first return above.</p>
        ) : (
          <div className="space-y-2">
            {returns.map(ret => (
              <div key={ret.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium">{ret.return_type_label || ret.return_type} — {ret.period} {ret.year}</p>
                  <p className="text-xs text-gray-400">{ret.jurisdiction}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">${Number(ret.net_amount || 0).toLocaleString()}</span>
                  <StatusBadge status={ret.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4">Upcoming Deadlines</h3>
        <div className="space-y-2">
          {deadlines.map((dl, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium">{dl.description}</p>
                <p className="text-xs text-gray-400">{dl.jurisdiction}</p>
              </div>
              <div className={`text-sm font-medium ${dl.days_until <= 14 ? 'text-red-600' : dl.days_until <= 30 ? 'text-yellow-600' : 'text-gray-600'}`}>
                {dl.deadline} ({dl.days_until}d)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    draft: 'bg-gray-100 text-gray-700',
    validated: 'bg-blue-100 text-blue-700',
    ready: 'bg-purple-100 text-purple-700',
    lodged: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
}

const DEMO_RETURNS = [
  { id: '1', return_type: 'BAS', return_type_label: 'Business Activity Statement', period: 'Q4', year: 2023, jurisdiction: 'AU', net_amount: 12450, status: 'lodged' },
  { id: '2', return_type: 'BAS', return_type_label: 'Business Activity Statement', period: 'Q1', year: 2024, jurisdiction: 'AU', net_amount: 15200, status: 'validated' },
  { id: '3', return_type: 'VAT', return_type_label: 'VAT Return', period: 'Q4', year: 2023, jurisdiction: 'GB', net_amount: 8900, status: 'lodged' },
];

const DEMO_DEADLINES = [
  { description: 'BAS Q1 2024', jurisdiction: 'AU', deadline: '2024-04-28', days_until: 35 },
  { description: 'GST Return', jurisdiction: 'NZ', deadline: '2024-05-07', days_until: 44 },
  { description: 'VAT Q1 2024 (MTD)', jurisdiction: 'GB', deadline: '2024-05-07', days_until: 44 },
  { description: 'Quarterly Sales Tax', jurisdiction: 'US', deadline: '2024-04-30', days_until: 37 },
];
