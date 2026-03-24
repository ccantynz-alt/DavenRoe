import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
  unlikely: 'bg-red-50 text-red-400',
};

const DOC_TYPE_LABELS = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  statement: 'Statement',
  payment_confirmation: 'Payment',
  tax_document: 'Tax',
  payslip: 'Payslip',
  purchase_order: 'PO',
  credit_note: 'Credit Note',
  quote: 'Quote',
  unknown: 'Other',
};

export default function EmailScanner() {
  const [view, setView] = useState('connect'); // connect | scanning | results
  const [provider, setProvider] = useState(null);
  const [scanId, setScanId] = useState(null);
  const [scan, setScan] = useState(null);
  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [filterType, setFilterType] = useState('');
  const [filterConfidence, setFilterConfidence] = useState('');
  const [importing, setImporting] = useState(false);
  const [pastScans, setPastScans] = useState([]);
  const [dateRange, setDateRange] = useState('1y');
  const pollRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    api.get('/email-scanner/scans').then(r => setPastScans(r.data.scans || [])).catch(() => null);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const getDateFrom = () => {
    const now = new Date();
    if (dateRange === '3m') now.setMonth(now.getMonth() - 3);
    else if (dateRange === '6m') now.setMonth(now.getMonth() - 6);
    else if (dateRange === '1y') now.setFullYear(now.getFullYear() - 1);
    else if (dateRange === '2y') now.setFullYear(now.getFullYear() - 2);
    else now.setFullYear(now.getFullYear() - 5);
    return now.toISOString();
  };

  const startScan = async (accessToken) => {
    try {
      const res = await api.post('/email-scanner/scan', {
        provider: provider,
        access_token: accessToken,
        date_from: getDateFrom(),
        min_confidence: 'low',
      });
      setScanId(res.data.scan_id);
      setView('scanning');
      startPolling(res.data.scan_id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start scan');
    }
  };

  const startPolling = (id) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/email-scanner/scan/${id}`);
        setScan(res.data);
        if (res.data.status === 'completed' || res.data.status === 'failed' || res.data.status === 'cancelled') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          if (res.data.status === 'completed') {
            setResults(res.data.results || []);
            const sumRes = await api.get(`/email-scanner/scan/${id}/summary`);
            setSummary(sumRes.data);
            setView('results');
          }
        }
      } catch { /* ignore polling errors */ }
    }, 2000);
  };

  const handleGoogleAuth = () => {
    // In production, this triggers the OAuth2 flow via a popup/redirect.
    // The OAuth callback returns the access_token which we pass to startScan.
    // For now, we simulate the flow with a prompt.
    const token = window.prompt(
      'Paste your Google OAuth2 access token.\n\n' +
      'To get one: Go to Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 → ' +
      'Create credentials with gmail.readonly scope.\n\n' +
      'In production, this is handled automatically via popup OAuth flow.'
    );
    if (token) startScan(token);
  };

  const handleOutlookAuth = () => {
    const token = window.prompt(
      'Paste your Microsoft OAuth2 access token.\n\n' +
      'To get one: Register an app in Azure AD → Add Mail.Read permission → Get token.\n\n' +
      'In production, this is handled automatically via popup OAuth flow.'
    );
    if (token) startScan(token);
  };

  const toggleSelect = (emailId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(emailId)) next.delete(emailId);
      else next.add(emailId);
      return next;
    });
  };

  const selectAll = () => {
    const filtered = getFilteredResults();
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(r => r.email_id)));
    }
  };

  const importSelected = async () => {
    if (selected.size === 0) return toast.error('No emails selected');
    setImporting(true);
    try {
      const res = await api.post(`/email-scanner/scan/${scanId}/import`, {
        email_ids: Array.from(selected),
      });
      toast.success(`Imported ${res.data.imported_count} document(s)`);
      // Update results to show imported status
      setResults(prev => prev.map(r => selected.has(r.email_id) ? { ...r, imported: true } : r));
      setSelected(new Set());
    } catch (err) {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const getFilteredResults = () => {
    let filtered = results;
    if (filterType) filtered = filtered.filter(r => r.classification.document_type === filterType);
    if (filterConfidence) filtered = filtered.filter(r => r.classification.confidence === filterConfidence);
    return filtered;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Email Scanner</h2>
        <p className="text-gray-500 mt-1">Connect your mailbox to automatically find invoices, receipts, and financial documents</p>
      </div>

      {/* Connect View */}
      {view === 'connect' && (
        <div>
          {/* Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mb-8">
            <button
              onClick={() => { setProvider('gmail'); handleGoogleAuth(); }}
              className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center hover:border-red-300 hover:shadow-lg transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-red-100 transition-colors">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Gmail / Google Workspace</h3>
              <p className="text-sm text-gray-500 mb-3">Scan your entire Gmail mailbox including labels and attachments</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {['Full search', 'Attachments', 'Labels', 'Known senders'].map(f => (
                  <span key={f} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{f}</span>
                ))}
              </div>
            </button>

            <button
              onClick={() => { setProvider('outlook'); handleOutlookAuth(); }}
              className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center hover:border-blue-300 hover:shadow-lg transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Outlook / Microsoft 365</h3>
              <p className="text-sm text-gray-500 mb-3">Scan your Outlook mailbox including folders and attachments</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {['Full search', 'Metadata', 'Folders', 'Known senders'].map(f => (
                  <span key={f} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{f}</span>
                ))}
              </div>
            </button>
          </div>

          {/* Scan options */}
          <div className="max-w-2xl mb-8">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Scan Options</h3>
            <div className="bg-white border rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">How far back to scan?</label>
              <div className="flex gap-2">
                {[['3m', '3 months'], ['6m', '6 months'], ['1y', '1 year'], ['2y', '2 years'], ['all', 'Everything']].map(([val, label]) => (
                  <button key={val} onClick={() => setDateRange(val)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      dateRange === val ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="max-w-2xl">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Connect', desc: 'Securely authorize read-only access to your mailbox via OAuth2. We never see your password.' },
                { step: '2', title: 'Scan', desc: 'AI crawls your mailbox using 5 detection strategies: keywords, known senders, attachments, body analysis, and classification.' },
                { step: '3', title: 'Import', desc: 'Review found documents, select what to import, and they flow directly into your Astra document library.' },
              ].map(s => (
                <div key={s.step} className="bg-white border rounded-xl p-5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm mb-3">{s.step}</div>
                  <h4 className="font-semibold text-gray-900 mb-1">{s.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Past scans */}
          {pastScans.length > 0 && (
            <div className="max-w-2xl mt-8">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Previous Scans</h3>
              <div className="space-y-2">
                {pastScans.map(s => (
                  <div key={s.id} className="bg-white border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{s.email_address || s.provider}</p>
                      <p className="text-xs text-gray-400">{s.total_matched} documents found from {s.total_scanned} emails</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scanning View */}
      {view === 'scanning' && scan && (
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-10 h-10 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {scan.status === 'connecting' ? 'Connecting to mailbox...' :
             scan.status === 'scanning' ? 'Searching for financial emails...' :
             scan.status === 'extracting' ? 'Extracting document data...' :
             scan.status === 'classifying' ? 'Classifying documents...' :
             'Processing...'}
          </h3>

          {scan.email_address && (
            <p className="text-gray-500 mb-4">{scan.email_address}</p>
          )}

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${scan.progress_percent || 0}%` }} />
          </div>

          <div className="flex justify-center gap-8 text-sm text-gray-500">
            <div>
              <p className="text-2xl font-bold text-gray-900">{scan.total_scanned}</p>
              <p>Emails scanned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{scan.total_matched}</p>
              <p>Documents found</p>
            </div>
          </div>

          {scan.errors?.length > 0 && (
            <p className="text-xs text-red-400 mt-4">{scan.errors.length} error(s) encountered</p>
          )}
        </div>
      )}

      {/* Results View */}
      {view === 'results' && (
        <div>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{summary.total_scanned}</p>
                <p className="text-xs text-gray-400">Emails Scanned</p>
              </div>
              <div className="bg-white border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">{summary.total_matched}</p>
                <p className="text-xs text-gray-400">Documents Found</p>
              </div>
              <div className="bg-white border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.by_confidence?.high || 0}</p>
                <p className="text-xs text-gray-400">High Confidence</p>
              </div>
              <div className="bg-white border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{summary.total_attachments}</p>
                <p className="text-xs text-gray-400">Attachments</p>
              </div>
              <div className="bg-white border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{summary.scan_duration_seconds ? `${Math.round(summary.scan_duration_seconds)}s` : '--'}</p>
                <p className="text-xs text-gray-400">Scan Time</p>
              </div>
            </div>
          )}

          {/* Document type breakdown */}
          {summary?.by_document_type && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(summary.by_document_type).map(([type, count]) => (
                <button key={type}
                  onClick={() => setFilterType(filterType === type ? '' : type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterType === type ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
                  }`}>
                  {DOC_TYPE_LABELS[type] || type} ({count})
                </button>
              ))}
            </div>
          )}

          {/* Actions bar */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={selectAll}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200">
              {selected.size === getFilteredResults().length ? 'Deselect All' : 'Select All'}
            </button>
            {['high', 'medium', 'low'].map(c => (
              <button key={c}
                onClick={() => setFilterConfidence(filterConfidence === c ? '' : c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterConfidence === c ? 'bg-indigo-600 text-white' : CONFIDENCE_COLORS[c]
                }`}>
                {c}
              </button>
            ))}
            <div className="flex-1" />
            {selected.size > 0 && (
              <button onClick={importSelected} disabled={importing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {importing ? 'Importing...' : `Import ${selected.size} selected`}
              </button>
            )}
          </div>

          {/* Results list */}
          <div className="space-y-2">
            {getFilteredResults().map(r => (
              <div key={r.email_id}
                className={`bg-white border rounded-lg p-4 flex items-start gap-3 transition-colors ${
                  r.imported ? 'bg-green-50 border-green-200' : selected.has(r.email_id) ? 'border-indigo-300 bg-indigo-50' : 'hover:bg-gray-50'
                }`}>
                <input type="checkbox" checked={selected.has(r.email_id) || r.imported}
                  disabled={r.imported}
                  onChange={() => toggleSelect(r.email_id)}
                  className="mt-1 rounded" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_COLORS[r.classification.confidence]}`}>
                      {Math.round(r.classification.score * 100)}%
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                      {DOC_TYPE_LABELS[r.classification.document_type] || r.classification.document_type}
                    </span>
                    {r.imported && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Imported</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 text-sm truncate">{r.subject || '(No subject)'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{r.sender_name || r.sender_email}</span>
                    <span>{r.date ? new Date(r.date).toLocaleDateString() : ''}</span>
                    {r.attachment_count > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {r.attachment_count} file{r.attachment_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {r.classification.signals?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.classification.signals.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {getFilteredResults().length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>No results match the current filters.</p>
            </div>
          )}

          {/* Top senders */}
          {summary?.top_senders?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Top Senders</h3>
              <div className="bg-white border rounded-xl p-4">
                <div className="space-y-2">
                  {summary.top_senders.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {i + 1}
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-700 truncate">{s.email}</span>
                      <span className="text-sm text-gray-400">{s.count} email{s.count > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button onClick={() => { setView('connect'); setScan(null); setResults([]); setSummary(null); setSelected(new Set()); }}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
              Scan Another Mailbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
