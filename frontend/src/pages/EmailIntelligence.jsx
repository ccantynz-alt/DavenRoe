import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
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

export default function EmailIntelligence() {
  const [view, setView] = useState('home'); // home | scanning | results | create-invoice
  const [provider, setProvider] = useState(null);
  const [scanId, setScanId] = useState(null);
  const [scan, setScan] = useState(null);
  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [filterType, setFilterType] = useState('');
  const [filterConfidence, setFilterConfidence] = useState('');
  const [dateRange, setDateRange] = useState('6m');
  const [creating, setCreating] = useState(false);
  const [draftInvoice, setDraftInvoice] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [pastScans, setPastScans] = useState([]);
  const pollRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    api.get('/email-scanner/scans').then(r => setPastScans(r.data.scans || [])).catch(() => null);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const getDateFrom = () => {
    const now = new Date();
    if (dateRange === '1m') now.setMonth(now.getMonth() - 1);
    else if (dateRange === '3m') now.setMonth(now.getMonth() - 3);
    else if (dateRange === '6m') now.setMonth(now.getMonth() - 6);
    else if (dateRange === '1y') now.setFullYear(now.getFullYear() - 1);
    else now.setFullYear(now.getFullYear() - 2);
    return now.toISOString();
  };

  const startScan = async (accessToken) => {
    try {
      const res = await api.post('/email-scanner/scan', {
        provider,
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
        if (['completed', 'failed', 'cancelled'].includes(res.data.status)) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          if (res.data.status === 'completed') {
            setResults(res.data.results || []);
            const sumRes = await api.get(`/email-scanner/scan/${id}/summary`);
            setSummary(sumRes.data);
            setView('results');
          }
        }
      } catch { /* polling error — ignore */ }
    }, 2000);
  };

  const handleAuth = (prov) => {
    setProvider(prov);

    // Try popup OAuth2 flow first — falls back to token paste for dev
    const apiBase = window.location.origin;
    const oauthUrl = `${apiBase}/api/v1/oauth/authorize/${prov}`;

    // Open OAuth popup
    const popup = window.open(oauthUrl, 'oauth', 'width=500,height=700,left=200,top=100');

    if (!popup || popup.closed) {
      // Popup blocked — fall back to token paste
      const providerName = prov === 'gmail' ? 'Google' : 'Microsoft';
      const token = window.prompt(
        `Popup was blocked. Paste your ${providerName} OAuth2 access token manually.\n\n` +
        `Enable popups for this site for automatic connection next time.`
      );
      if (token) startScan(token);
      return;
    }

    // Generate state from the OAuth URL redirect (backend returns state in URL)
    // Poll for the token via the /oauth/token/{state} endpoint
    const checkPopup = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(checkPopup);
          // Try to get the token - the backend will have stored it
          // For now, fall back to token paste if popup closed without completing
          const providerName = prov === 'gmail' ? 'Google' : 'Microsoft';
          toast.info(`Connecting to ${providerName}... If the popup closed too early, click the button again.`);
          return;
        }
      } catch {
        // Cross-origin errors are expected when popup navigates to Google/Microsoft
      }
    }, 1000);

    // Also listen for message from popup callback page
    const handleMessage = (event) => {
      if (event.data?.type === 'oauth_complete' && event.data?.access_token) {
        window.removeEventListener('message', handleMessage);
        clearInterval(checkPopup);
        startScan(event.data.access_token);
      }
    };
    window.addEventListener('message', handleMessage);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(checkPopup);
      window.removeEventListener('message', handleMessage);
    }, 300000);
  };

  const toggleSelect = (emailId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(emailId)) next.delete(emailId);
      else next.add(emailId);
      return next;
    });
  };

  const selectAllInvoices = () => {
    const invoices = getFilteredResults().filter(r => r.classification.document_type === 'invoice');
    const allSelected = invoices.every(r => selected.has(r.email_id));
    if (allSelected) {
      const next = new Set(selected);
      invoices.forEach(r => next.delete(r.email_id));
      setSelected(next);
    } else {
      setSelected(new Set([...selected, ...invoices.map(r => r.email_id)]));
    }
  };

  const getFilteredResults = () => {
    let filtered = results;
    if (filterType) filtered = filtered.filter(r => r.classification.document_type === filterType);
    if (filterConfidence) filtered = filtered.filter(r => r.classification.confidence === filterConfidence);
    return filtered;
  };

  const getSelectedResults = () => results.filter(r => selected.has(r.email_id));

  const prepareCustomerInvoice = () => {
    const selectedItems = getSelectedResults();
    if (selectedItems.length === 0) {
      toast.error('Select at least one invoice from the results');
      return;
    }
    // Build draft invoice from selected driver invoices
    const lines = selectedItems.map(item => ({
      email_id: item.email_id,
      description: `${item.sender_name || item.sender_email} — ${item.subject || 'Invoice'}`,
      amount: item.extracted_amount || 0,
      date: item.date,
      sender: item.sender_name || item.sender_email,
    }));
    const total = lines.reduce((sum, l) => sum + (l.amount || 0), 0);
    setDraftInvoice({ lines, total });
    setView('create-invoice');
  };

  const createCustomerInvoice = async () => {
    if (!customerName.trim()) {
      toast.error('Enter the customer name to bill');
      return;
    }
    setCreating(true);
    try {
      // First import the emails
      await api.post(`/email-scanner/scan/${scanId}/import`, {
        email_ids: Array.from(selected),
      });

      // Then create the invoice via the email-intelligence endpoint
      const res = await api.post('/email-intelligence/create-invoice', {
        scan_id: scanId,
        customer_name: customerName.trim(),
        email_ids: Array.from(selected),
        lines: draftInvoice.lines.map(l => ({
          description: l.description,
          amount: l.amount,
        })),
      });

      toast.success(`Invoice #${res.data.invoice_number} created for ${customerName}`);
      setView('results');
      setSelected(new Set());
      setDraftInvoice(null);
      setCustomerName('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const invoiceCount = results.filter(r => r.classification.document_type === 'invoice').length;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Email Intelligence</h2>
        <p className="text-gray-500 mt-1">
          AI scans your inbox for invoices from drivers &amp; subcontractors, then helps you bill your customers
        </p>
      </div>

      {/* ─── HOME VIEW ──────────────────────────────────────── */}
      {view === 'home' && (
        <div>
          {/* Connect Providers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mb-8">
            <ProviderCard
              name="Gmail / Google Workspace"
              desc="Scan your entire Gmail for invoices, receipts, and statements from suppliers"
              color="red"
              icon={<GmailIcon />}
              features={['Invoice detection', 'Attachment scanning', 'Known sender matching', 'AI classification']}
              onClick={() => handleAuth('gmail')}
            />
            <ProviderCard
              name="Outlook / Microsoft 365"
              desc="Scan your Outlook mailbox for supplier invoices and financial documents"
              color="blue"
              icon={<OutlookIcon />}
              features={['Invoice detection', 'Folder scanning', 'Known sender matching', 'AI classification']}
              onClick={() => handleAuth('outlook')}
            />
          </div>

          {/* Scan options */}
          <div className="max-w-2xl mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">How far back?</h3>
            <div className="flex gap-2">
              {[['1m', '1 month'], ['3m', '3 months'], ['6m', '6 months'], ['1y', '1 year'], ['2y', '2 years']].map(([val, label]) => (
                <button key={val} onClick={() => setDateRange(val)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    dateRange === val ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border text-gray-600 hover:border-indigo-300'
                  }`}>{label}</button>
              ))}
            </div>
          </div>

          {/* How it works — tradie-friendly language */}
          <div className="max-w-2xl mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { num: '1', title: 'Connect', desc: 'Link your Gmail or Outlook securely. We only read emails — never send or delete.' },
                { num: '2', title: 'AI Scans', desc: 'AI searches your inbox for invoices from your drivers, suppliers, and subcontractors.' },
                { num: '3', title: 'Review', desc: 'See every invoice found, with confidence scores. Pick the ones you need to bill for.' },
                { num: '4', title: 'Bill Customer', desc: 'One click creates a customer invoice with all the line items. Send it and get paid.' },
              ].map(s => (
                <div key={s.num} className="bg-white border rounded-xl p-5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm mb-3">{s.num}</div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{s.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Past scans */}
          {pastScans.length > 0 && (
            <div className="max-w-2xl">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Previous Scans</h3>
              <div className="space-y-2">
                {pastScans.map(s => (
                  <div key={s.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{s.email_address || s.provider}</p>
                      <p className="text-xs text-gray-400">{s.total_matched} documents found from {s.total_scanned} emails</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SCANNING VIEW ──────────────────────────────────── */}
      {view === 'scanning' && scan && (
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {scan.status === 'connecting' ? 'Connecting to your mailbox...' :
             scan.status === 'scanning' ? 'Searching for invoices & receipts...' :
             scan.status === 'extracting' ? 'Extracting invoice details...' :
             scan.status === 'classifying' ? 'AI is classifying documents...' :
             'Processing...'}
          </h3>
          {scan.email_address && <p className="text-gray-500 mb-6">{scan.email_address}</p>}

          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${scan.progress_percent || 0}%` }} />
          </div>

          <div className="flex justify-center gap-12 text-sm text-gray-500">
            <div>
              <p className="text-3xl font-bold text-gray-900">{scan.total_scanned}</p>
              <p>Emails checked</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">{scan.total_matched}</p>
              <p>Documents found</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESULTS VIEW ───────────────────────────────────── */}
      {view === 'results' && (
        <div>
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <SummaryCard value={summary.total_scanned} label="Emails Checked" />
              <SummaryCard value={summary.total_matched} label="Documents Found" color="indigo" />
              <SummaryCard value={invoiceCount} label="Invoices" color="green" />
              <SummaryCard value={summary.scan_duration_seconds ? `${Math.round(summary.scan_duration_seconds)}s` : '--'} label="Scan Time" />
            </div>
          )}

          {/* Call to action — the key workflow */}
          {invoiceCount > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-900">
                    Found {invoiceCount} invoice{invoiceCount > 1 ? 's' : ''} from your suppliers
                  </h3>
                  <p className="text-sm text-emerald-700 mt-0.5">
                    Select the ones you need to bill for, then create a customer invoice with one click.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={selectAllInvoices}
                    className="px-4 py-2.5 bg-white border border-emerald-300 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-50 transition-colors">
                    Select All Invoices
                  </button>
                  <button onClick={prepareCustomerInvoice}
                    disabled={selected.size === 0}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Bill Customer ({selected.size})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {summary?.by_document_type && Object.entries(summary.by_document_type).map(([type, count]) => (
              <button key={type}
                onClick={() => setFilterType(filterType === type ? '' : type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterType === type ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}>
                {DOC_TYPE_LABELS[type] || type} ({count})
              </button>
            ))}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            {['high', 'medium', 'low'].map(c => (
              <button key={c}
                onClick={() => setFilterConfidence(filterConfidence === c ? '' : c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterConfidence === c ? 'bg-indigo-600 text-white' : CONFIDENCE_COLORS[c]
                }`}>
                {c}
              </button>
            ))}
          </div>

          {/* Results list */}
          <div className="space-y-2 mb-6">
            {getFilteredResults().map(r => (
              <div key={r.email_id}
                onClick={() => !r.imported && toggleSelect(r.email_id)}
                className={`bg-white border rounded-xl p-4 flex items-start gap-3 transition-all cursor-pointer ${
                  r.imported ? 'bg-green-50 border-green-200 cursor-default' :
                  selected.has(r.email_id) ? 'border-indigo-400 bg-indigo-50 shadow-sm' : 'hover:border-gray-300'
                }`}>
                <input type="checkbox" checked={selected.has(r.email_id) || !!r.imported}
                  disabled={r.imported}
                  onChange={() => toggleSelect(r.email_id)}
                  className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_COLORS[r.classification.confidence]}`}>
                      {Math.round(r.classification.score * 100)}%
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                      {DOC_TYPE_LABELS[r.classification.document_type] || r.classification.document_type}
                    </span>
                    {r.extracted_amount > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold">
                        ${r.extracted_amount.toLocaleString('en', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    {r.imported && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Imported</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 text-sm truncate">{r.subject || '(No subject)'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="font-medium text-gray-500">{r.sender_name || r.sender_email}</span>
                    <span>{r.date ? new Date(r.date).toLocaleDateString() : ''}</span>
                    {r.attachment_count > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {r.attachment_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getFilteredResults().length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-1">No results match the current filters</p>
              <p className="text-sm">Try adjusting the document type or confidence filters above</p>
            </div>
          )}

          {/* Bottom actions */}
          <div className="flex items-center gap-3">
            <button onClick={() => { setView('home'); setScan(null); setResults([]); setSummary(null); setSelected(new Set()); }}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">
              Scan Another Mailbox
            </button>
            {selected.size > 0 && (
              <button onClick={prepareCustomerInvoice}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
                Create Customer Invoice ({selected.size} items)
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── CREATE INVOICE VIEW ────────────────────────────── */}
      {view === 'create-invoice' && draftInvoice && (
        <div className="max-w-2xl">
          <button onClick={() => setView('results')} className="text-indigo-600 text-sm font-medium hover:underline mb-4 inline-block">
            &larr; Back to results
          </button>

          <div className="bg-white border rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h3 className="text-xl font-bold">Create Customer Invoice</h3>
              <p className="text-indigo-100 text-sm mt-1">
                Bill your customer for {draftInvoice.lines.length} supplier invoice{draftInvoice.lines.length > 1 ? 's' : ''} found in your email
              </p>
            </div>

            <div className="p-6">
              {/* Customer name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Who are you billing?</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Smith Construction, ABC Transport..."
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Line items from driver invoices */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Line Items (from supplier emails)</label>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-500">Description</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-500 w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {draftInvoice.lines.map((line, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{line.sender}</p>
                            <p className="text-xs text-gray-400 truncate">{line.description}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={line.amount || ''}
                              onChange={e => {
                                const updated = [...draftInvoice.lines];
                                updated[i] = { ...updated[i], amount: parseFloat(e.target.value) || 0 };
                                setDraftInvoice({
                                  ...draftInvoice,
                                  lines: updated,
                                  total: updated.reduce((s, l) => s + (l.amount || 0), 0),
                                });
                              }}
                              className="w-24 px-2 py-1 border rounded-lg text-right text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2">
                        <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 text-lg">
                          ${draftInvoice.total.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Amounts are extracted from email content. Edit them if needed before sending.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => setView('results')}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">
                  Cancel
                </button>
                <button onClick={createCustomerInvoice}
                  disabled={creating || !customerName.trim()}
                  className="flex-1 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed">
                  {creating ? 'Creating...' : `Create Invoice for ${customerName || '...'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */

function ProviderCard({ name, desc, color, icon, features, onClick }) {
  const hoverBorder = color === 'red' ? 'hover:border-red-300' : 'hover:border-blue-300';
  const iconBg = color === 'red' ? 'bg-red-50 group-hover:bg-red-100' : 'bg-blue-50 group-hover:bg-blue-100';

  return (
    <button onClick={onClick}
      className={`bg-white border-2 border-gray-200 rounded-2xl p-8 text-left ${hoverBorder} hover:shadow-lg transition-all group`}>
      <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-4 transition-colors`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{name}</h3>
      <p className="text-sm text-gray-500 mb-4">{desc}</p>
      <div className="flex flex-wrap gap-1">
        {features.map(f => (
          <span key={f} className="text-[11px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{f}</span>
        ))}
      </div>
    </button>
  );
}

function SummaryCard({ value, label, color }) {
  const textColor = color === 'indigo' ? 'text-indigo-600' : color === 'green' ? 'text-emerald-600' : 'text-gray-900';
  return (
    <div className="bg-white border rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */

function GmailIcon() {
  return <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"/></svg>;
}
function OutlookIcon() {
  return <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"/></svg>;
}
