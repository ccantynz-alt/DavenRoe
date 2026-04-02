import { useState } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const CONNECTED_ACCOUNTS = [
  { id: '1', provider: 'Google Workspace', email: 'accounts@coastalcoffee.com.au', status: 'connected', lastSync: '2 min ago', unread: 12 },
  { id: '2', provider: 'Microsoft 365', email: 'admin@northstarconsulting.com', status: 'connected', lastSync: '5 min ago', unread: 8 },
];

const INBOX_ITEMS = [
  { id: '1', from: 'ANZ Business', subject: 'Your March statement is ready', date: '10 min ago', type: 'bank_statement', ai_action: 'Auto-filed to Documents → Bank Statements → Coastal Coffee', status: 'processed', confidence: 98 },
  { id: '2', from: 'Bunnings Trade', subject: 'Tax Invoice #INV-88421', date: '25 min ago', type: 'invoice', ai_action: 'Extracted: $1,245.80 inc GST. Matched to PO-0034. Ready for approval.', status: 'processed', confidence: 96, amount: '$1,245.80' },
  { id: '3', from: 'ATO', subject: 'BAS lodgement confirmation — Coastal Coffee Co', date: '1 hr ago', type: 'tax_notice', ai_action: 'Filed to Documents → Tax → BAS Confirmations. Updated compliance calendar.', status: 'processed', confidence: 99 },
  { id: '4', from: 'sarah@clientfirm.com.au', subject: 'RE: Missing receipts for February', date: '2 hrs ago', type: 'client_comms', ai_action: 'Detected 3 receipt attachments. OCR extracted and matched to transactions.', status: 'processed', confidence: 94, attachments: 3 },
  { id: '5', from: 'Xero Migration', subject: 'Your data export is ready to download', date: '3 hrs ago', type: 'migration', ai_action: 'Flagged for review — contains client data export. Suggested action: Import via Data Import tool.', status: 'review', confidence: 85 },
  { id: '6', from: 'IRD (NZ)', subject: 'GST return acknowledgement', date: '4 hrs ago', type: 'tax_notice', ai_action: 'Filed to Documents → Tax → GST Confirmations. Kiwi Design Studio compliance updated.', status: 'processed', confidence: 99 },
  { id: '7', from: 'unknown@supplier.com', subject: 'URGENT: Payment overdue!!!', date: '5 hrs ago', type: 'suspicious', ai_action: 'Flagged as potential phishing — sender not in your contacts, urgency language, no prior correspondence.', status: 'flagged', confidence: 92 },
  { id: '8', from: 'Stripe', subject: 'Payout of $8,420.00 initiated', date: '6 hrs ago', type: 'payment', ai_action: 'Matched to 12 invoices. Payout reconciliation complete. Bank feed will confirm in 1-2 days.', status: 'processed', confidence: 97 },
  { id: '9', from: 'Employment Hero', subject: 'Payroll summary — Pay Period 12', date: '8 hrs ago', type: 'payroll', ai_action: 'Extracted pay run summary. Compared against AlecRae payroll calculations — no discrepancies found.', status: 'processed', confidence: 95 },
  { id: '10', from: 'client.john@gmail.com', subject: 'Can you check if I can claim my home office?', date: '12 hrs ago', type: 'client_query', ai_action: 'Routed to Tax Rulings Agent. Draft response generated — awaiting your review before sending.', status: 'review', confidence: 88 },
];

const TYPE_COLORS = {
  bank_statement: 'bg-blue-100 text-blue-700', invoice: 'bg-green-100 text-green-700',
  tax_notice: 'bg-purple-100 text-purple-700', client_comms: 'bg-gray-100 text-gray-700',
  migration: 'bg-amber-100 text-amber-700', payment: 'bg-emerald-100 text-emerald-700',
  suspicious: 'bg-red-100 text-red-700', payroll: 'bg-indigo-100 text-indigo-700',
  client_query: 'bg-cyan-100 text-cyan-700',
};

const TYPE_LABELS = {
  bank_statement: 'Bank Statement', invoice: 'Invoice', tax_notice: 'Tax Notice',
  client_comms: 'Client Email', migration: 'Data Export', payment: 'Payment',
  suspicious: 'Suspicious', payroll: 'Payroll', client_query: 'Client Query',
};

const STATUS_COLORS = {
  processed: 'bg-green-100 text-green-700', review: 'bg-amber-100 text-amber-700',
  flagged: 'bg-red-100 text-red-700',
};

export default function SmartInbox() {
  const [filter, setFilter] = useState('all');
  const [showConnect, setShowConnect] = useState(false);
  const toast = useToast();

  const filtered = filter === 'all' ? INBOX_ITEMS :
    filter === 'review' ? INBOX_ITEMS.filter(i => i.status === 'review' || i.status === 'flagged') :
    INBOX_ITEMS.filter(i => i.type === filter);

  const stats = {
    processed: INBOX_ITEMS.filter(i => i.status === 'processed').length,
    review: INBOX_ITEMS.filter(i => i.status === 'review').length,
    flagged: INBOX_ITEMS.filter(i => i.status === 'flagged').length,
    total: INBOX_ITEMS.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Inbox</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI scans your email, extracts documents, and takes action automatically</p>
        </div>
        <button onClick={() => setShowConnect(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Connect Email
        </button>
      </div>

      {/* Connected accounts */}
      <div className="grid grid-cols-2 gap-3">
        {CONNECTED_ACCOUNTS.map(acc => (
          <div key={acc.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-900">{acc.provider}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{acc.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Synced {acc.lastSync}</p>
              <p className="text-sm font-bold text-indigo-600">{acc.unread} new</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Emails Scanned</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Auto-Processed</p>
          <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
          <p className="text-[10px] text-green-500">{Math.round(stats.processed / stats.total * 100)}% automated</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Needs Review</p>
          <p className="text-2xl font-bold text-amber-600">{stats.review}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Flagged</p>
          <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'review', 'invoice', 'tax_notice', 'bank_statement', 'client_comms', 'payment'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${filter === f ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {f === 'all' ? 'All' : f === 'review' ? 'Needs Review' : TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Email list */}
      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className={`bg-white border rounded-xl p-4 hover:shadow-md transition-shadow ${item.status === 'flagged' ? 'border-red-200' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[item.type]}`}>
                  {TYPE_LABELS[item.type]}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                  {item.status === 'processed' ? 'Auto-Processed' : item.status === 'review' ? 'Needs Review' : 'Flagged'}
                </span>
                {item.amount && <span className="text-xs font-bold text-gray-900">{item.amount}</span>}
                {item.attachments && <span className="text-[10px] text-gray-400">{item.attachments} attachments</span>}
              </div>
              <span className="text-[10px] text-gray-400">{item.date}</span>
            </div>

            <div className="mb-2">
              <p className="text-sm font-medium text-gray-900">{item.subject}</p>
              <p className="text-xs text-gray-500">from {item.from}</p>
            </div>

            <div className="bg-indigo-50 rounded-lg p-2.5 flex items-start gap-2">
              <span className="text-[10px] font-bold text-indigo-500 shrink-0 mt-0.5">AI</span>
              <div>
                <p className="text-xs text-indigo-700">{item.ai_action}</p>
                <p className="text-[10px] text-indigo-400 mt-0.5">{item.confidence}% confidence</p>
              </div>
            </div>

            {item.status !== 'processed' && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => toast.success('Approved — AI action applied')}
                  className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded font-medium hover:bg-green-200">
                  Approve
                </button>
                {item.status === 'flagged' && (
                  <button onClick={() => toast.success('Marked as safe')}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded font-medium hover:bg-gray-200">
                    Mark Safe
                  </button>
                )}
                <button onClick={() => toast.info('Opened for manual review')}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded font-medium hover:bg-gray-200">
                  Review
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Connect modal */}
      {showConnect && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowConnect(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Connect Your Email</h2>
            <div className="space-y-3">
              <button onClick={() => { setShowConnect(false); toast.success('Google Workspace connected'); }}
                className="w-full p-4 border-2 rounded-xl text-left hover:border-blue-400 transition flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><span className="text-lg font-bold text-red-500">G</span></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Google Workspace</p>
                  <p className="text-xs text-gray-500">Gmail, Google Apps</p>
                </div>
              </button>
              <button onClick={() => { setShowConnect(false); toast.success('Microsoft 365 connected'); }}
                className="w-full p-4 border-2 rounded-xl text-left hover:border-blue-400 transition flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><span className="text-lg font-bold text-blue-500">M</span></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Microsoft 365</p>
                  <p className="text-xs text-gray-500">Outlook, Exchange</p>
                </div>
              </button>
              <button onClick={() => { setShowConnect(false); toast.success('IMAP configured'); }}
                className="w-full p-4 border-2 rounded-xl text-left hover:border-blue-400 transition flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><span className="text-lg font-bold text-gray-500">@</span></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Other (IMAP)</p>
                  <p className="text-xs text-gray-500">Any email provider</p>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 text-center">AlecRae reads emails in read-only mode. We never send emails from your inbox without your approval.</p>
          </div>
        </div>
      )}

      <ProprietaryNotice />
    </div>
  );
}
