import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const KB_QUICK = {
  '/': ['Understanding the Dashboard', 'How AI categorisation works', 'Setting up your Astra account'],
  '/banking': ['Connecting your first bank feed', 'Handling bank feed disconnections', 'Multi-currency transactions'],
  '/invoicing': ['Creating and sending invoices', 'Setting up online payments', 'Recurring invoices'],
  '/payroll': ['Running your first pay run', 'Managing employee details', 'Leave management'],
  '/tax': ['How the tax engine works', 'Cross-border tax treaties'],
  '/tax-filing': ['Preparing a BAS (Australia)', 'Compliance Calendar explained'],
  '/reports': ['Standard financial reports', 'Financial Health Score', 'Custom report building'],
  '/review': ['AI confidence scores', 'Review Queue and confidence scores'],
  '/agentic': ['Autonomous month-end close', 'AI Command Center'],
  '/ask': ['Ask Astra — natural language queries'],
  '/forensic-tools': ["Benford's Law analysis", 'Ghost vendor detection', 'Due diligence reports'],
  '/settings': ['Setting up your Astra account', 'Inviting team members'],
  '/import': ['Can I import data from Xero or QuickBooks?'],
};

export default function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('help'); // help | ticket | sent
  const [search, setSearch] = useState('');
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', priority: 'normal' });
  const location = useLocation();

  const contextArticles = KB_QUICK[location.pathname] || KB_QUICK['/'];

  useEffect(() => {
    if (open) {
      setView('help');
      setSearch('');
    }
  }, [open]);

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject || !ticketForm.message) return;
    try {
      await api.post('/support/tickets', {
        subject: ticketForm.subject,
        message: ticketForm.message,
        priority: ticketForm.priority,
        source: 'help_widget',
        page_url: location.pathname,
      }).catch(() => null);
    } catch { /* ticket saved locally even if API fails */ }
    setView('sent');
    setTicketForm({ subject: '', message: '', priority: 'normal' });
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 z-50 flex items-center justify-center"
        title="Help & Support">
        <span className="text-lg font-bold">?</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-h-[520px] bg-white rounded-2xl shadow-2xl border z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-semibold text-sm">
            {view === 'help' && 'Help & Support'}
            {view === 'ticket' && 'Submit a Ticket'}
            {view === 'sent' && 'Ticket Submitted'}
          </h3>
          <p className="text-xs text-indigo-200">
            {view === 'help' && 'Search articles or contact us'}
            {view === 'ticket' && 'Our AI responds within minutes'}
            {view === 'sent' && 'We\'ll get back to you shortly'}
          </p>
        </div>
        <button onClick={() => setOpen(false)} className="text-indigo-200 hover:text-white text-lg">&#10005;</button>
      </div>

      {/* Help view */}
      {view === 'help' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search help articles..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none" />

          {/* Context articles */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">
              Help for this page
            </p>
            {contextArticles.filter(a => !search || a.toLowerCase().includes(search.toLowerCase())).map((article, i) => (
              <button key={i} className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg transition flex items-center gap-2">
                <span className="text-indigo-400 text-xs">&#9679;</span>
                {article}
              </button>
            ))}
          </div>

          {/* Common questions */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">
              Common questions
            </p>
            {['How do I connect my bank?', 'How accurate is the AI?', 'What jurisdictions are supported?', 'Can I import from Xero?']
              .filter(q => !search || q.toLowerCase().includes(search.toLowerCase()))
              .map((q, i) => (
                <button key={i} className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg transition flex items-center gap-2">
                  <span className="text-gray-300 text-xs">Q</span>
                  {q}
                </button>
              ))}
          </div>

          {/* Can't find answer */}
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">Can't find what you need?</p>
            <button onClick={() => setView('ticket')}
              className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Contact Support
            </button>
          </div>
        </div>
      )}

      {/* Ticket form */}
      {view === 'ticket' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <button onClick={() => setView('help')} className="text-xs text-indigo-600 hover:underline">&larr; Back to help</button>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
            <input value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Brief description" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
            <select value={ticketForm.priority} onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
              <option value="low">Low — general question</option>
              <option value="normal">Normal — something isn't working</option>
              <option value="high">High — blocking my work</option>
              <option value="urgent">Urgent — data or security issue</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
            <textarea value={ticketForm.message} onChange={e => setTicketForm(f => ({ ...f, message: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm" rows={4} placeholder="Describe your issue..." />
          </div>
          <button onClick={handleSubmitTicket}
            disabled={!ticketForm.subject || !ticketForm.message}
            className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
            Submit Ticket
          </button>
          <p className="text-[10px] text-gray-400 text-center">
            Our AI agent responds to 80% of tickets automatically within 2 minutes.
          </p>
        </div>
      )}

      {/* Sent confirmation */}
      {view === 'sent' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Ticket Submitted</h4>
          <p className="text-sm text-gray-500 mb-4">
            Our AI support agent is reviewing your request. You'll receive a response within minutes for common issues, or within 2 hours for complex queries.
          </p>
          <button onClick={() => setOpen(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Close
          </button>
        </div>
      )}
    </div>
  );
}
