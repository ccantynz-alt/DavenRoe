import { useState } from 'react';
import { useToast } from '../components/Toast';
import ProprietaryNotice from '../components/ProprietaryNotice';

const CLIENTS = [
  {
    id: '1', name: 'Coastal Coffee Co', contact: 'sarah@coastalcoffee.com.au',
    documents: [
      { id: 'd1', name: 'Q3 Bank Statement (ANZ)', daysWaiting: 18, status: 'urgent' },
      { id: 'd2', name: 'Feb Receipts Bundle', daysWaiting: 12, status: 'reminder' },
    ],
    autoChase: true,
  },
  {
    id: '2', name: 'North Star Consulting', contact: 'james@northstar.com',
    documents: [
      { id: 'd3', name: 'Q3 Profit & Loss Backup', daysWaiting: 22, status: 'urgent' },
      { id: 'd4', name: 'Employee Expense Claims — March', daysWaiting: 9, status: 'firm' },
      { id: 'd5', name: 'Contractor Invoices (3)', daysWaiting: 5, status: 'polite' },
    ],
    autoChase: true,
  },
  {
    id: '3', name: 'Kiwi Design Studio', contact: 'aroha@kiwidesign.co.nz',
    documents: [
      { id: 'd6', name: 'IRD GST Statement — Q2', daysWaiting: 3, status: 'polite' },
    ],
    autoChase: true,
  },
  {
    id: '4', name: 'Thames Valley Plumbing', contact: 'dave@thamesplumbing.co.uk',
    documents: [
      { id: 'd7', name: 'HMRC VAT Correspondence', daysWaiting: 16, status: 'urgent' },
      { id: 'd8', name: 'Subcontractor CIS Statements', daysWaiting: 10, status: 'reminder' },
    ],
    autoChase: false,
  },
  {
    id: '5', name: 'Maple Ridge Dental', contact: 'admin@mapleridgedental.com',
    documents: [
      { id: 'd9', name: 'Equipment Lease Agreement', daysWaiting: 7, status: 'firm' },
      { id: 'd10', name: 'Insurance Certificate 2026', daysWaiting: 4, status: 'polite' },
    ],
    autoChase: true,
  },
  {
    id: '6', name: 'Outback Solar Pty Ltd', contact: 'mike@outbacksolar.com.au',
    documents: [
      { id: 'd11', name: 'ATO Instalment Notice', daysWaiting: 0, status: 'received' },
      { id: 'd12', name: 'March Bank Reconciliation', daysWaiting: 2, status: 'polite' },
    ],
    autoChase: true,
  },
  {
    id: '7', name: 'Brooklyn Bagels LLC', contact: 'nina@brooklynbagels.com',
    documents: [
      { id: 'd13', name: 'Sales Tax Returns — Q1', daysWaiting: 11, status: 'reminder' },
      { id: 'd14', name: 'Payroll Register — March', daysWaiting: 6, status: 'firm' },
      { id: 'd15', name: 'POS Transaction Export', daysWaiting: 1, status: 'polite' },
    ],
    autoChase: false,
  },
  {
    id: '8', name: 'Harbour View Architects', contact: 'liam@harbourview.co.nz',
    documents: [
      { id: 'd16', name: 'Project Cost Breakdown — Wharf Rd', daysWaiting: 14, status: 'urgent' },
      { id: 'd17', name: 'Staff Mileage Logs — Feb/Mar', daysWaiting: 8, status: 'firm' },
    ],
    autoChase: true,
  },
];

const CHASE_SEQUENCE = [
  {
    day: 0, label: 'Polite Request', tone: 'friendly', color: 'bg-blue-100 text-blue-700',
    subject: 'Quick reminder — documents needed for your accounts',
    preview: `Hi {{name}},\n\nHope you're well! Just a quick note — we're still waiting on the following documents to keep your accounts up to date:\n\n{{documents}}\n\nIf you could send these through when you get a moment, that would be great. No rush, but sooner is always better for accuracy.\n\nThanks so much!\n— Your Astra Team`,
  },
  {
    day: 3, label: 'Gentle Reminder', tone: 'warm', color: 'bg-amber-100 text-amber-700',
    subject: 'Friendly follow-up — outstanding documents',
    preview: `Hi {{name}},\n\nJust circling back on our earlier request. We still need the following:\n\n{{documents}}\n\nHaving these will help us finalise your accounts on time and avoid any last-minute scrambles. Could you send them through this week?\n\nHappy to help if you need guidance locating any of these.\n\nWarm regards,\n— Your Astra Team`,
  },
  {
    day: 7, label: 'Firm Follow-Up', tone: 'direct', color: 'bg-orange-100 text-orange-700',
    subject: 'Action required — missing documents for your accounts',
    preview: `Hi {{name}},\n\nWe've reached out a couple of times regarding the following outstanding documents:\n\n{{documents}}\n\nThese are now 7+ days overdue and we need them to maintain your compliance obligations. Without them, we may not be able to complete your accounts on schedule.\n\nPlease prioritise sending these through as soon as possible.\n\nRegards,\n— Your Astra Team`,
  },
  {
    day: 14, label: 'Urgent Notice', tone: 'urgent', color: 'bg-red-100 text-red-700',
    subject: 'URGENT: Compliance deadline at risk — documents overdue',
    preview: `Hi {{name}},\n\nThis is an urgent notice regarding the following documents that are now significantly overdue:\n\n{{documents}}\n\nWithout these documents, we cannot guarantee your upcoming compliance deadlines will be met. Late lodgement may result in penalties from the tax authority.\n\nPlease treat this as a priority and send the documents today if at all possible. If you're having difficulty locating them, please call us immediately so we can assist.\n\nUrgent regards,\n— Your Astra Team`,
  },
];

const AUTO_CHASE_LOG = [
  { id: '1', date: '2 Apr 2026, 9:15am', client: 'Coastal Coffee Co', document: 'Q3 Bank Statement (ANZ)', emailType: 'Urgent Notice', responseStatus: 'No response' },
  { id: '2', date: '2 Apr 2026, 9:14am', client: 'North Star Consulting', document: 'Q3 Profit & Loss Backup', emailType: 'Urgent Notice', responseStatus: 'No response' },
  { id: '3', date: '1 Apr 2026, 8:00am', client: 'Harbour View Architects', document: 'Project Cost Breakdown — Wharf Rd', emailType: 'Firm Follow-Up', responseStatus: 'No response' },
  { id: '4', date: '31 Mar 2026, 9:00am', client: 'Brooklyn Bagels LLC', document: 'Sales Tax Returns — Q1', emailType: 'Gentle Reminder', responseStatus: 'Opened' },
  { id: '5', date: '30 Mar 2026, 8:30am', client: 'Maple Ridge Dental', document: 'Equipment Lease Agreement', emailType: 'Firm Follow-Up', responseStatus: 'Replied — doc attached' },
  { id: '6', date: '29 Mar 2026, 9:00am', client: 'Thames Valley Plumbing', document: 'HMRC VAT Correspondence', emailType: 'Firm Follow-Up', responseStatus: 'No response' },
  { id: '7', date: '28 Mar 2026, 8:45am', client: 'Outback Solar Pty Ltd', document: 'ATO Instalment Notice', emailType: 'Polite Request', responseStatus: 'Received' },
  { id: '8', date: '27 Mar 2026, 9:10am', client: 'Kiwi Design Studio', document: 'IRD GST Statement — Q2', emailType: 'Polite Request', responseStatus: 'Opened' },
  { id: '9', date: '26 Mar 2026, 8:00am', client: 'Coastal Coffee Co', document: 'Feb Receipts Bundle', emailType: 'Gentle Reminder', responseStatus: 'No response' },
  { id: '10', date: '25 Mar 2026, 9:30am', client: 'North Star Consulting', document: 'Contractor Invoices (3)', emailType: 'Polite Request', responseStatus: 'Opened' },
];

const STATUS_CONFIG = {
  received: { label: 'Received', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  polite: { label: 'Polite Sent', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  reminder: { label: 'Reminder Sent', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  firm: { label: 'Firm Sent', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent Sent', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  not_started: { label: 'Not Started', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

const RESPONSE_COLORS = {
  'Received': 'text-green-600',
  'Replied — doc attached': 'text-green-600',
  'Opened': 'text-amber-600',
  'No response': 'text-red-500',
};

export default function DocumentChaser() {
  const [clients, setClients] = useState(CLIENTS);
  const [activeTab, setActiveTab] = useState('clients');
  const [selectedSequenceStep, setSelectedSequenceStep] = useState(0);
  const [chasingAll, setChasingAll] = useState(false);
  const toast = useToast();

  const totalOutstanding = clients.reduce((sum, c) => sum + c.documents.filter(d => d.status !== 'received').length, 0);
  const clientsWithMissing = clients.filter(c => c.documents.some(d => d.status !== 'received')).length;

  const handleMarkReceived = (clientId, docId) => {
    setClients(prev => prev.map(c =>
      c.id === clientId
        ? { ...c, documents: c.documents.map(d => d.id === docId ? { ...d, status: 'received', daysWaiting: 0 } : d) }
        : c
    ));
    toast.success('Document marked as received');
  };

  const handleToggleAutoChase = (clientId) => {
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, autoChase: !c.autoChase } : c
    ));
    const client = clients.find(c => c.id === clientId);
    toast.success(`Auto-chase ${client.autoChase ? 'disabled' : 'enabled'} for ${client.name}`);
  };

  const handleChaseAll = () => {
    setChasingAll(true);
    setTimeout(() => {
      setChasingAll(false);
      toast.success('Chase emails sent to all clients with outstanding documents');
    }, 1500);
  };

  const handleGenerateReport = () => {
    toast.success('Missing document report generated — downloading PDF');
  };

  const handleChaseClient = (clientName) => {
    toast.success(`Chase email sent to ${clientName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intelligent Document Chaser</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI automatically chases clients for missing documents with escalating tone sequences</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerateReport}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Generate Report
          </button>
          <button onClick={handleChaseAll} disabled={chasingAll}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {chasingAll ? 'Sending...' : 'Chase All Outstanding'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Documents Outstanding</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">47</p>
          <p className="text-xs text-red-500 mt-1">+3 since last week</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Clients with Missing Docs</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{clientsWithMissing}</p>
          <p className="text-xs text-gray-400 mt-1">of 24 active clients</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Response Time</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">3.2 <span className="text-base font-normal text-gray-400">days</span></p>
          <p className="text-xs text-green-500 mt-1">Improved from 5.1 days</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auto-Chased This Month</p>
          <p className="text-3xl font-bold text-green-600 mt-1">124</p>
          <p className="text-xs text-green-500 mt-1">82% response rate</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { key: 'clients', label: 'Client Status' },
            { key: 'sequence', label: 'Chase Sequence Builder' },
            { key: 'log', label: 'Auto-Chase Log' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client Document Status Grid */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {clients.map(client => {
            const outstanding = client.documents.filter(d => d.status !== 'received');
            const maxDays = Math.max(...client.documents.map(d => d.daysWaiting), 0);
            const borderColor = maxDays >= 14 ? 'border-l-red-500' : maxDays >= 7 ? 'border-l-amber-500' : 'border-l-green-500';

            return (
              <div key={client.id} className={`bg-white border rounded-xl overflow-hidden border-l-4 ${borderColor}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-gray-900">{client.name}</h3>
                        {outstanding.length === 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">All received</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{client.contact}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleToggleAutoChase(client.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          client.autoChase ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          client.autoChase ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                      <span className="text-xs text-gray-500">Auto-chase</span>
                      {outstanding.length > 0 && (
                        <button onClick={() => handleChaseClient(client.name)}
                          className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                          Chase Now
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Document list */}
                  <div className="mt-4 space-y-2">
                    {client.documents.map(doc => {
                      const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.not_started;
                      return (
                        <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <span className="text-sm text-gray-800">{doc.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {doc.status !== 'received' && (
                              <span className="text-xs text-gray-400">{doc.daysWaiting} days waiting</span>
                            )}
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                            {doc.status !== 'received' && (
                              <button onClick={() => handleMarkReceived(client.id, doc.id)}
                                className="text-xs text-green-600 hover:text-green-700 font-medium">
                                Mark Received
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chase Sequence Builder */}
      {activeTab === 'sequence' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Chase Sequence Builder</h2>
            <p className="text-sm text-gray-500 mb-6">AI sends escalating emails based on how long documents have been outstanding. Each stage uses a different tone to maximize response rates without damaging client relationships.</p>

            {/* Timeline */}
            <div className="flex items-center gap-0 mb-8">
              {CHASE_SEQUENCE.map((step, i) => (
                <div key={i} className="flex-1 flex items-center">
                  <button onClick={() => setSelectedSequenceStep(i)}
                    className={`flex-shrink-0 w-full text-center py-3 px-2 rounded-lg border-2 transition-all ${
                      selectedSequenceStep === i
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    <p className={`text-xs font-bold ${selectedSequenceStep === i ? 'text-indigo-600' : 'text-gray-400'}`}>
                      Day {step.day}
                    </p>
                    <p className={`text-sm font-medium mt-0.5 ${selectedSequenceStep === i ? 'text-gray-900' : 'text-gray-600'}`}>
                      {step.label}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${step.color}`}>
                      {step.tone}
                    </span>
                  </button>
                  {i < CHASE_SEQUENCE.length - 1 && (
                    <div className="w-4 h-0.5 bg-gray-300 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Email Preview */}
            <div className="border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Subject</p>
                    <p className="text-sm font-medium text-gray-900">{CHASE_SEQUENCE[selectedSequenceStep].subject}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${CHASE_SEQUENCE[selectedSequenceStep].color}`}>
                    {CHASE_SEQUENCE[selectedSequenceStep].tone} tone
                  </span>
                </div>
              </div>
              <div className="p-5">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {CHASE_SEQUENCE[selectedSequenceStep].preview}
                </pre>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Sent automatically on day {CHASE_SEQUENCE[selectedSequenceStep].day} if document is still outstanding
                </p>
                <span className="text-xs text-indigo-600 font-medium">Powered by Astra AI</span>
              </div>
            </div>
          </div>

          {/* Sequence effectiveness */}
          <div className="bg-white border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Sequence Effectiveness</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Polite Request', rate: '34%', desc: 'respond at this stage', color: 'text-blue-600' },
                { label: 'Gentle Reminder', rate: '28%', desc: 'respond at this stage', color: 'text-amber-600' },
                { label: 'Firm Follow-Up', rate: '22%', desc: 'respond at this stage', color: 'text-orange-600' },
                { label: 'Urgent Notice', rate: '16%', desc: 'respond at this stage', color: 'text-red-600' },
              ].map((s, i) => (
                <div key={i} className="text-center p-4 rounded-lg bg-gray-50">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.rate}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">Combined 4-stage sequence achieves 82% total document collection rate within 14 days</p>
          </div>
        </div>
      )}

      {/* Auto-Chase Log */}
      {activeTab === 'log' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Auto-Chase Activity Log</h2>
            <span className="text-xs text-gray-400">Last 10 actions shown</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Document</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email Sent</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {AUTO_CHASE_LOG.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-gray-500">{entry.date}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{entry.client}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{entry.document}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      entry.emailType === 'Urgent Notice' ? 'bg-red-100 text-red-700' :
                      entry.emailType === 'Firm Follow-Up' ? 'bg-orange-100 text-orange-700' :
                      entry.emailType === 'Gentle Reminder' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {entry.emailType}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-sm font-medium ${RESPONSE_COLORS[entry.responseStatus] || 'text-gray-500'}`}>
                    {entry.responseStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProprietaryNotice />
    </div>
  );
}
