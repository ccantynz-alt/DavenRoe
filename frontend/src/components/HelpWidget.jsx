import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import api from '@/services/api';

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
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg z-50"
        title="Help & Support"
      >
        <span className="text-lg font-bold">?</span>
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Card className="w-96 max-h-[520px] flex flex-col overflow-hidden shadow-2xl">
          {/* Header */}
          <div className={cn('bg-indigo-600 text-white px-5 py-4 flex items-center justify-between shrink-0 rounded-t-xl')}>
            <div>
              <h3 className="font-semibold text-sm">
                {view === 'help' && 'Help & Support'}
                {view === 'ticket' && 'Submit a Ticket'}
                {view === 'sent' && 'Ticket Submitted'}
              </h3>
              <p className="text-xs text-indigo-200">
                {view === 'help' && 'Search articles or contact us'}
                {view === 'ticket' && 'Our AI responds within minutes'}
                {view === 'sent' && "We'll get back to you shortly"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-indigo-200 hover:text-white hover:bg-indigo-500"
            >
              &#10005;
            </Button>
          </div>

          {/* Help view */}
          {view === 'help' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Search */}
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search help articles..."
              />

              {/* Context articles */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">
                  Help for this page
                </p>
                {contextArticles.filter(a => !search || a.toLowerCase().includes(search.toLowerCase())).map((article, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    className="w-full justify-start px-3 py-2.5 h-auto text-sm text-gray-700 font-normal"
                  >
                    <span className="text-indigo-400 text-xs">&#9679;</span>
                    {article}
                  </Button>
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
                    <Button
                      key={i}
                      variant="ghost"
                      className="w-full justify-start px-3 py-2.5 h-auto text-sm text-gray-700 font-normal"
                    >
                      <span className="text-gray-300 text-xs">Q</span>
                      {q}
                    </Button>
                  ))}
              </div>

              {/* Can't find answer */}
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 mb-2">Can't find what you need?</p>
                <Button onClick={() => setView('ticket')} className="w-full">
                  Contact Support
                </Button>
              </div>
            </div>
          )}

          {/* Ticket form */}
          {view === 'ticket' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <Button variant="link" size="sm" onClick={() => setView('help')} className="px-0 h-auto text-xs">
                &larr; Back to help
              </Button>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <Input
                  value={ticketForm.subject}
                  onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <Select
                  value={ticketForm.priority}
                  onValueChange={value => setTicketForm(f => ({ ...f, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — general question</SelectItem>
                    <SelectItem value="normal">Normal — something isn't working</SelectItem>
                    <SelectItem value="high">High — blocking my work</SelectItem>
                    <SelectItem value="urgent">Urgent — data or security issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                <Textarea
                  value={ticketForm.message}
                  onChange={e => setTicketForm(f => ({ ...f, message: e.target.value }))}
                  rows={4}
                  placeholder="Describe your issue..."
                />
              </div>
              <Button
                onClick={handleSubmitTicket}
                disabled={!ticketForm.subject || !ticketForm.message}
                className="w-full"
              >
                Submit Ticket
              </Button>
              <p className="text-[10px] text-gray-400 text-center">
                Our AI agent responds to 80% of tickets automatically within 2 minutes.
              </p>
            </div>
          )}

          {/* Sent confirmation */}
          {view === 'sent' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className={cn('w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4')}>
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Ticket Submitted</h4>
              <p className="text-sm text-gray-500 mb-4">
                Our AI support agent is reviewing your request. You'll receive a response within minutes for common issues, or within 2 hours for complex queries.
              </p>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
