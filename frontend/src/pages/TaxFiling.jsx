import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const RETURN_TYPES = [
  { value: 'BAS', label: 'BAS', jurisdiction: 'AU', description: 'Business Activity Statement', authority: 'ATO' },
  { value: 'GST_NZ', label: 'GST (NZ)', jurisdiction: 'NZ', description: 'GST Return for IRD', authority: 'IRD' },
  { value: 'VAT_UK', label: 'VAT (UK)', jurisdiction: 'GB', description: 'MTD VAT Return', authority: 'HMRC' },
  { value: 'SALES_TAX_US', label: 'Sales Tax (US)', jurisdiction: 'US', description: 'Quarterly Sales Tax', authority: 'State DOR' },
];

const PERIODS = [
  { value: 'Q1', label: 'Q1 (Jan\u2013Mar)' },
  { value: 'Q2', label: 'Q2 (Apr\u2013Jun)' },
  { value: 'Q3', label: 'Q3 (Jul\u2013Sep)' },
  { value: 'Q4', label: 'Q4 (Oct\u2013Dec)' },
];

const STATUS_STEPS = ['draft', 'validated', 'ready', 'lodged'];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  validated: 'bg-blue-100 text-blue-700',
  ready: 'bg-amber-100 text-amber-700',
  lodged: 'bg-green-100 text-green-700',
};

const SEVERITY_STYLES = {
  pass: { bg: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600', label: 'Pass' },
  warning: { bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-600', label: 'Warning' },
  fail: { bg: 'bg-red-50 border-red-200', icon: 'text-red-600', label: 'Fail' },
};

function currentYear() {
  return new Date().getFullYear();
}

function currentQuarter() {
  return `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
}

export default function TaxFiling() {
  const toast = useToast();

  // Generator state
  const [returnType, setReturnType] = useState('BAS');
  const [period, setPeriod] = useState(currentQuarter());
  const [year, setYear] = useState(currentYear());
  const [generating, setGenerating] = useState(false);

  // Active return
  const [activeReturn, setActiveReturn] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [validating, setValidating] = useState(false);
  const [lodging, setLodging] = useState(false);

  // History & deadlines
  const [returns, setReturns] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState('generate');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [retRes, dlRes] = await Promise.all([
        api.get('/tax/returns/').catch(() => ({ data: { returns: [] } })),
        api.get('/tax/returns/deadlines').catch(() => ({ data: { deadlines: [] } })),
      ]);
      setReturns(retRes.data.returns || []);
      setDeadlines(dlRes.data.deadlines || []);
    } catch {
      // Backend may not be connected
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setValidationResults(null);
    try {
      const res = await api.post('/tax/returns/generate', {
        return_type: returnType,
        period,
        year,
      });
      setActiveReturn(res.data);
      setActiveTab('preview');
      toast.success('Tax return generated successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate return');
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async () => {
    if (!activeReturn) return;
    setValidating(true);
    try {
      const res = await api.post(`/tax/returns/${activeReturn.id}/validate`);
      setValidationResults(res.data);
      setActiveReturn(prev => ({ ...prev, status: res.data.status }));
      if (res.data.fail_count === 0) {
        toast.success('All validation checks passed');
      } else {
        toast.error(`${res.data.fail_count} validation issue(s) found`);
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleLodge = async () => {
    if (!activeReturn) return;
    setLodging(true);
    try {
      const res = await api.post(`/tax/returns/${activeReturn.id}/lodge`);
      setActiveReturn(prev => ({ ...prev, status: res.data.status, lodged_at: res.data.lodged_at }));
      toast.success('Return lodged successfully \u2014 ready for e-filing');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to lodge return');
    } finally {
      setLodging(false);
    }
  };

  const loadReturn = async (id) => {
    try {
      const res = await api.get(`/tax/returns/${id}`);
      setActiveReturn(res.data);
      setValidationResults(null);
      setActiveTab('preview');
    } catch {
      toast.error('Failed to load return');
    }
  };

  // Summary stats
  const filedThisYear = returns.filter(r => r.status === 'lodged').length;
  const pendingReturns = returns.filter(r => r.status !== 'lodged').length;
  const nextDeadline = deadlines[0] || null;

  const selectedTypeInfo = RETURN_TYPES.find(t => t.value === returnType);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tax Filing</h2>
          <p className="text-gray-500 mt-1">Generate, validate, and lodge tax returns across jurisdictions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Next Deadline</p>
          {nextDeadline ? (
            <div>
              <p className="text-lg font-bold text-gray-900">{nextDeadline.due_date}</p>
              <p className="text-sm text-gray-500 mt-0.5">{nextDeadline.return_type} \u2014 {nextDeadline.jurisdiction}</p>
              <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                nextDeadline.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                nextDeadline.urgency === 'urgent' ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {nextDeadline.days_remaining} days remaining
              </span>
            </div>
          ) : (
            <p className="text-lg font-bold text-gray-400">No upcoming</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-l-4 border-l-amber-500 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Returns Pending</p>
          <p className="text-2xl font-bold text-gray-900">{pendingReturns}</p>
          <p className="text-sm text-gray-500 mt-0.5">Awaiting validation or lodgement</p>
        </div>

        <div className="bg-white rounded-xl border border-l-4 border-l-green-500 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Filed This Year</p>
          <p className="text-2xl font-bold text-gray-900">{filedThisYear}</p>
          <p className="text-sm text-gray-500 mt-0.5">Successfully lodged</p>
        </div>

        <div className="bg-white rounded-xl border border-l-4 border-l-indigo-500 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Jurisdictions</p>
          <p className="text-2xl font-bold text-gray-900">4</p>
          <p className="text-sm text-gray-500 mt-0.5">AU, NZ, GB, US</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: 'generate', label: 'Generate Return' },
          { key: 'preview', label: 'Return Preview' },
          { key: 'history', label: 'Filing History' },
          { key: 'deadlines', label: 'Deadlines' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Generate Tax Return</h3>

          {/* Return Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Return Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {RETURN_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setReturnType(type.value)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    returnType === type.value
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">{type.label}</span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{type.jurisdiction}</span>
                  </div>
                  <p className="text-xs text-gray-500">{type.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Authority: {type.authority}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Period & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {PERIODS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {[currentYear() - 1, currentYear(), currentYear() + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {selectedTypeInfo?.description} \u2014 {period} {year}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Jurisdiction: {selectedTypeInfo?.jurisdiction} | Authority: {selectedTypeInfo?.authority}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : 'Generate Return'}
          </button>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div>
          {!activeReturn ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">%</span>
              </div>
              <p className="text-gray-600 font-medium">No return selected</p>
              <p className="text-gray-400 text-sm mt-1">Generate a new return or select one from filing history.</p>
              <button
                onClick={() => setActiveTab('generate')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Generate Return
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Tracker */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {RETURN_TYPES.find(t => t.value === activeReturn.return_type)?.label || activeReturn.return_type} \u2014 {activeReturn.period_start} to {activeReturn.period_end}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[activeReturn.status] || STATUS_COLORS.draft}`}>
                    {activeReturn.status.charAt(0).toUpperCase() + activeReturn.status.slice(1)}
                  </span>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-2 mb-6">
                  {STATUS_STEPS.map((step, i) => {
                    const currentIdx = STATUS_STEPS.indexOf(activeReturn.status);
                    const isComplete = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={step} className="flex items-center gap-2 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isComplete
                            ? isCurrent ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isComplete && !isCurrent ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            i + 1
                          )}
                        </div>
                        <span className={`text-xs font-medium capitalize ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step}
                        </span>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 ${i < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {activeReturn.status === 'draft' && (
                    <button
                      onClick={handleValidate}
                      disabled={validating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {validating ? 'Validating...' : 'Run Validation'}
                    </button>
                  )}
                  {(activeReturn.status === 'validated' || activeReturn.status === 'ready') && (
                    <>
                      <button
                        onClick={handleValidate}
                        disabled={validating}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {validating ? 'Re-validating...' : 'Re-validate'}
                      </button>
                      <button
                        onClick={handleLodge}
                        disabled={lodging}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {lodging ? 'Lodging...' : 'Lodge Return'}
                      </button>
                    </>
                  )}
                  {activeReturn.status === 'lodged' && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Lodged on {activeReturn.lodged_at ? new Date(activeReturn.lodged_at).toLocaleDateString() : 'N/A'}
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-white rounded-xl border p-6">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Line Items</h4>
                <ReturnLineItems returnData={activeReturn} />
              </div>

              {/* Totals */}
              <div className="bg-white rounded-xl border p-6">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Totals</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(activeReturn.totals).map(([key, val]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">{formatLabel(key)}</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(val)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Results */}
              {validationResults && (
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Validation Results</h4>
                    <div className="flex gap-3 text-xs font-medium">
                      <span className="text-emerald-600">{validationResults.pass_count} passed</span>
                      <span className="text-amber-600">{validationResults.warning_count} warnings</span>
                      <span className="text-red-600">{validationResults.fail_count} failed</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {validationResults.validations.map((v, i) => {
                      const style = SEVERITY_STYLES[v.severity] || SEVERITY_STYLES.pass;
                      return (
                        <div key={i} className={`${style.bg} border rounded-lg p-3`}>
                          <div className="flex items-start gap-3">
                            <span className={`text-lg ${style.icon} shrink-0 mt-0.5`}>
                              {v.severity === 'pass' ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : v.severity === 'warning' ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">{v.check}</p>
                              <p className="text-sm text-gray-600 mt-0.5">{v.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Filing History</h3>
          </div>
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading filing history...</div>
          ) : returns.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl text-gray-400">%</span>
              </div>
              <p className="text-gray-600 font-medium">No returns generated yet</p>
              <p className="text-gray-400 text-sm mt-1">Generate your first tax return to see it here.</p>
              <button
                onClick={() => setActiveTab('generate')}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Generate Return
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {returns.map(r => (
                <div
                  key={r.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => loadReturn(r.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      r.jurisdiction === 'AU' ? 'bg-blue-100 text-blue-700' :
                      r.jurisdiction === 'NZ' ? 'bg-emerald-100 text-emerald-700' :
                      r.jurisdiction === 'GB' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {r.jurisdiction}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {RETURN_TYPES.find(t => t.value === r.return_type)?.label || r.return_type}
                      </p>
                      <p className="text-xs text-gray-500">{r.period_start} to {r.period_end}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Object.values(r.totals)[Object.values(r.totals).length - 1])}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(r.generated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] || STATUS_COLORS.draft}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deadlines Tab */}
      {activeTab === 'deadlines' && (
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Filing Deadlines</h3>
          </div>
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading deadlines...</div>
          ) : deadlines.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 font-medium">No upcoming deadlines</p>
              <p className="text-gray-400 text-sm mt-1">All returns are up to date.</p>
            </div>
          ) : (
            <div className="divide-y">
              {deadlines.map((d, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      d.jurisdiction === 'AU' ? 'bg-blue-100 text-blue-700' :
                      d.jurisdiction === 'NZ' ? 'bg-emerald-100 text-emerald-700' :
                      d.jurisdiction === 'GB' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {d.jurisdiction}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{d.description}</p>
                      <p className="text-xs text-gray-500">Authority: {d.authority}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{d.due_date}</p>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        d.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                        d.urgency === 'urgent' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {d.days_remaining} days
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Line Item Renderers */

function ReturnLineItems({ returnData }) {
  const { return_type, line_items } = returnData;

  if (return_type === 'BAS') return <BASLineItems items={line_items} />;
  if (return_type === 'GST_NZ') return <GSTNZLineItems items={line_items} />;
  if (return_type === 'VAT_UK') return <VATUKLineItems items={line_items} />;
  if (return_type === 'SALES_TAX_US') return <SalesTaxUSLineItems items={line_items} />;

  return <GenericLineItems items={line_items} />;
}

function BASLineItems({ items }) {
  const sections = [
    { label: 'GST', rows: [
      { key: 'G1_total_sales', label: 'G1 \u2014 Total sales (incl. GST)' },
      { key: 'G2_export_sales', label: 'G2 \u2014 Export sales' },
      { key: 'G3_other_gst_free', label: 'G3 \u2014 Other GST-free sales' },
      { key: 'G10_capital_purchases', label: 'G10 \u2014 Capital purchases (incl. GST)' },
      { key: 'G11_non_capital_purchases', label: 'G11 \u2014 Non-capital purchases (incl. GST)' },
      { key: '1A_gst_on_sales', label: '1A \u2014 GST on sales' },
      { key: '1B_gst_on_purchases', label: '1B \u2014 GST on purchases' },
    ]},
    { label: 'PAYG Withholding', rows: [
      { key: 'W1_total_wages', label: 'W1 \u2014 Total salary, wages and other payments' },
      { key: 'W2_payg_withheld', label: 'W2 \u2014 Amount withheld from payments' },
    ]},
    { label: 'PAYG Instalment', rows: [
      { key: 'T1_payg_instalment_income', label: 'T1 \u2014 Instalment income' },
      { key: 'T2_payg_instalment_rate', label: 'T2 \u2014 Instalment rate' },
      { key: 'T3_payg_instalment_amount', label: 'T3 \u2014 New varied instalment amount' },
    ]},
  ];
  return <SectionedTable sections={sections} items={items} />;
}

function GSTNZLineItems({ items }) {
  const sections = [
    { label: 'Income & Supplies', rows: [
      { key: 'box_5_total_sales', label: 'Box 5 \u2014 Total sales and income' },
      { key: 'box_6_zero_rated', label: 'Box 6 \u2014 Zero-rated supplies' },
      { key: 'box_7_total_purchases', label: 'Box 7 \u2014 Total purchases and expenses' },
      { key: 'box_8_adjustments_income', label: 'Box 8 \u2014 Adjustments from calculations' },
    ]},
    { label: 'GST Amounts', rows: [
      { key: 'box_9_gst_collected', label: 'Box 9 \u2014 Total GST collected on sales' },
      { key: 'box_10_gst_on_purchases', label: 'Box 10 \u2014 Total GST paid on purchases' },
      { key: 'box_11_adjustments_tax', label: 'Box 11 \u2014 Adjustments' },
      { key: 'box_12_gst_to_pay', label: 'Box 12 \u2014 GST to pay (or refund due)' },
    ]},
  ];
  return <SectionedTable sections={sections} items={items} />;
}

function VATUKLineItems({ items }) {
  const sections = [
    { label: 'VAT Due', rows: [
      { key: 'box_1_vat_due_sales', label: 'Box 1 \u2014 VAT due on sales and outputs' },
      { key: 'box_2_vat_due_acquisitions', label: 'Box 2 \u2014 VAT due on acquisitions from EU' },
      { key: 'box_3_total_vat_due', label: 'Box 3 \u2014 Total VAT due (Box 1 + Box 2)' },
      { key: 'box_4_vat_reclaimed', label: 'Box 4 \u2014 VAT reclaimed on purchases and inputs' },
      { key: 'box_5_net_vat', label: 'Box 5 \u2014 Net VAT to pay or reclaim' },
    ]},
    { label: 'Supplies & Acquisitions', rows: [
      { key: 'box_6_total_sales_ex_vat', label: 'Box 6 \u2014 Total value of sales (ex-VAT)' },
      { key: 'box_7_total_purchases_ex_vat', label: 'Box 7 \u2014 Total value of purchases (ex-VAT)' },
      { key: 'box_8_eu_supplies', label: 'Box 8 \u2014 Total value of supplies to EU (ex-VAT)' },
      { key: 'box_9_eu_acquisitions', label: 'Box 9 \u2014 Total value of acquisitions from EU (ex-VAT)' },
    ]},
  ];
  return <SectionedTable sections={sections} items={items} />;
}

function SalesTaxUSLineItems({ items }) {
  const states = items.states || [];
  return (
    <div>
      {states.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-600">State</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Gross Sales</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Exempt</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Taxable</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Rate</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Tax Due</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {states.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{s.state}</span>
                    <span className="text-gray-400 ml-1 text-xs">({s.state_code})</span>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-700">{formatCurrency(s.gross_sales)}</td>
                  <td className="text-right py-3 px-4 text-gray-500">{formatCurrency(s.exempt_sales)}</td>
                  <td className="text-right py-3 px-4 font-medium text-gray-900">{formatCurrency(s.taxable_sales)}</td>
                  <td className="text-right py-3 px-4 text-gray-600">{(parseFloat(s.combined_rate) * 100).toFixed(2)}%</td>
                  <td className="text-right py-3 px-4 font-semibold text-gray-900">{formatCurrency(s.tax_due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Total Gross Sales</p>
          <p className="text-sm font-bold">{formatCurrency(items.total_gross_sales)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Total Exempt Sales</p>
          <p className="text-sm font-bold">{formatCurrency(items.total_exempt_sales)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Total Taxable Sales</p>
          <p className="text-sm font-bold">{formatCurrency(items.total_taxable_sales)}</p>
        </div>
      </div>
    </div>
  );
}

function SectionedTable({ sections, items }) {
  return (
    <div className="space-y-6">
      {sections.map((section, si) => (
        <div key={si}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{section.label}</p>
          <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
            {section.rows.map(row => (
              <div key={row.key} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700">{row.label}</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {row.key.includes('rate') && !row.key.includes('amount')
                    ? `${(parseFloat(items[row.key] || 0) * 100).toFixed(2)}%`
                    : formatCurrency(items[row.key])
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GenericLineItems({ items }) {
  return (
    <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
      {Object.entries(items).map(([key, val]) => {
        if (typeof val === 'object') return null;
        return (
          <div key={key} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-700">{formatLabel(key)}</span>
            <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatCurrency(val)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Helpers */

function formatLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatCurrency(val) {
  if (val == null) return '$0.00';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
