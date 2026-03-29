import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const STATUS_BADGE = {
  draft: { variant: 'secondary', label: 'Draft' },
  sent: { variant: 'default', label: 'Sent', className: 'bg-blue-100 text-blue-700 border-transparent' },
  accepted: { variant: 'success', label: 'Accepted' },
  declined: { variant: 'destructive', label: 'Declined' },
  expired: { variant: 'warning', label: 'Expired' },
  converted: { variant: 'default', label: 'Converted', className: 'bg-purple-100 text-purple-700 border-transparent' },
};

const STAT_COLORS = {
  indigo: 'bg-indigo-50 text-indigo-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
  gray: 'bg-gray-50 text-gray-700',
  purple: 'bg-purple-50 text-purple-700',
};

const DEMO_QUOTES = [
  { id: '1', quote_number: 'Q-0001', title: 'Website Redesign', client_name: 'Acme Corp', date: '2026-03-10', expiry_date: '2026-04-10', status: 'accepted', subtotal: 11363.64, tax_amount: 1136.36, total: 12500.00, converted_to: null, notes: 'Includes responsive design, CMS integration, and SEO optimization.', terms: 'Payment due within 14 days of acceptance. 50% deposit required to commence work.', lines: [{ description: 'UX/UI Design (40 hrs)', quantity: 40, unit_price: 150, tax_rate: 10, amount: 6600 }, { description: 'Frontend Development (30 hrs)', quantity: 30, unit_price: 130, tax_rate: 10, amount: 4290 }, { description: 'CMS Setup & Configuration', quantity: 1, unit_price: 1463.64, tax_rate: 10, amount: 1610 }] },
  { id: '2', quote_number: 'Q-0002', title: 'Annual Audit Services', client_name: 'TechStart Ltd', date: '2026-03-18', expiry_date: '2026-04-18', status: 'sent', subtotal: 8000.00, tax_amount: 800.00, total: 8800.00, converted_to: null, notes: 'Comprehensive annual audit covering all financial statements.', terms: 'Payment due within 30 days of invoice. Travel expenses billed separately.', lines: [{ description: 'Financial Statement Audit', quantity: 1, unit_price: 5000, tax_rate: 10, amount: 5500 }, { description: 'Compliance Review', quantity: 1, unit_price: 2000, tax_rate: 10, amount: 2200 }, { description: 'Management Letter & Recommendations', quantity: 1, unit_price: 1000, tax_rate: 10, amount: 1100 }] },
  { id: '3', quote_number: 'Q-0003', title: 'Bookkeeping Package — Q2 2026', client_name: 'Green Valley Farms', date: '2026-03-22', expiry_date: null, status: 'draft', subtotal: 3272.73, tax_amount: 327.27, total: 3600.00, converted_to: null, notes: 'Monthly bookkeeping services for April, May, and June 2026.', terms: 'Billed monthly in advance. Includes up to 200 transactions per month.', lines: [{ description: 'Monthly Bookkeeping — April', quantity: 1, unit_price: 1090.91, tax_rate: 10, amount: 1200 }, { description: 'Monthly Bookkeeping — May', quantity: 1, unit_price: 1090.91, tax_rate: 10, amount: 1200 }, { description: 'Monthly Bookkeeping — June', quantity: 1, unit_price: 1090.91, tax_rate: 10, amount: 1200 }] },
  { id: '4', quote_number: 'Q-0004', title: 'Tax Return Preparation', client_name: 'Smith Family Trust', date: '2026-02-15', expiry_date: '2026-03-15', status: 'converted', subtotal: 2000.00, tax_amount: 200.00, total: 2200.00, converted_to: 'INV-089', notes: 'Individual and trust tax return preparation for FY2025.', terms: 'Payment due on completion. Includes one round of ATO correspondence.', lines: [{ description: 'Trust Tax Return Preparation', quantity: 1, unit_price: 1500, tax_rate: 10, amount: 1650 }, { description: 'Individual Tax Return (Trustee)', quantity: 1, unit_price: 500, tax_rate: 10, amount: 550 }] },
  { id: '5', quote_number: 'Q-0005', title: 'Payroll Setup & Training', client_name: 'Harbour Café', date: '2026-03-01', expiry_date: '2026-03-31', status: 'declined', subtotal: 1636.36, tax_amount: 163.64, total: 1800.00, converted_to: null, notes: 'Initial payroll system configuration and staff training session.', terms: 'Payment due within 7 days of acceptance.', lines: [{ description: 'Payroll System Setup (8 hrs)', quantity: 8, unit_price: 125, tax_rate: 10, amount: 1100 }, { description: 'Staff Training Session (half day)', quantity: 1, unit_price: 636.36, tax_rate: 10, amount: 700 }] },
  { id: '6', quote_number: 'Q-0006', title: 'IT Infrastructure Consulting', client_name: 'DataFlow Pty Ltd', date: '2026-03-20', expiry_date: '2026-04-20', status: 'sent', subtotal: 13636.36, tax_amount: 1363.64, total: 15000.00, converted_to: null, notes: 'Infrastructure assessment, recommendations, and implementation roadmap.', terms: 'Payment in two instalments: 50% on acceptance, 50% on delivery of final report.', lines: [{ description: 'Infrastructure Assessment (3 days)', quantity: 3, unit_price: 2500, tax_rate: 10, amount: 8250 }, { description: 'Architecture Design & Documentation', quantity: 1, unit_price: 3636.36, tax_rate: 10, amount: 4000 }, { description: 'Implementation Roadmap & Presentation', quantity: 1, unit_price: 2500, tax_rate: 10, amount: 2750 }] },
];

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await api.get('/quotes/').catch(() => null);
      setQuotes(res?.data?.quotes || DEMO_QUOTES);
    } catch { /* fallback */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = quotes.filter(q => !filterStatus || q.status === filterStatus);

  const summary = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    converted: quotes.filter(q => q.status === 'converted').length,
    total_value: quotes.reduce((s, q) => s + q.total, 0),
  };

  const handleSend = (quote) => {
    setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'sent' } : q));
    toast.success(`${quote.quote_number} sent to ${quote.client_name}`);
    setSelected(null);
  };

  const handleAccept = (quote) => {
    setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'accepted' } : q));
    toast.success(`${quote.quote_number} marked as accepted`);
    setSelected(null);
  };

  const handleConvert = (quote) => {
    const invoiceNum = `INV-${String(Math.floor(Math.random() * 900) + 100)}`;
    setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'converted', converted_to: invoiceNum } : q));
    toast.success(`Converted to Invoice ${invoiceNum}`);
    setSelected(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Quotes & Estimates</h2>
          <p className="text-gray-500 mt-1">Create, send, and track quotes for your clients</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Quote'}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total Quotes', value: summary.total, color: 'indigo' },
          { label: 'Draft', value: summary.draft, color: 'gray' },
          { label: 'Sent', value: summary.sent, color: 'blue' },
          { label: 'Accepted', value: summary.accepted, color: 'green' },
          { label: 'Converted', value: summary.converted, color: 'purple' },
          { label: 'Total Value', value: `$${summary.total_value.toLocaleString()}`, color: 'indigo' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={cn('border-0 shadow-none', STAT_COLORS[stat.color])}>
              <CardContent className="p-4">
                <p className="text-xs font-medium opacity-70">{stat.label}</p>
                <p className="text-xl font-bold mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create */}
      {showCreate && <CreateQuoteForm onSubmit={(data) => { setQuotes(prev => [{ id: String(Date.now()), ...data, status: 'draft', converted_to: null }, ...prev]); setShowCreate(false); toast.success('Quote created'); }} onCancel={() => setShowCreate(false)} nextNumber={`Q-${String(quotes.length + 1).padStart(4, '0')}`} />}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'draft', 'sent', 'accepted', 'declined', 'expired', 'converted'].map(s => (
          <Button
            key={s}
            onClick={() => setFilterStatus(s)}
            variant={filterStatus === s ? 'default' : 'secondary'}
            size="sm"
          >
            {s ? s.replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
          </Button>
        ))}
      </div>

      {/* Detail */}
      {selected && <QuoteDetail quote={selected} onClose={() => setSelected(null)} onSend={handleSend} onAccept={handleAccept} onConvert={handleConvert} />}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Quote #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(q => {
              const badge = STATUS_BADGE[q.status] || { variant: 'secondary', label: q.status };
              return (
                <TableRow key={q.id} onClick={() => setSelected(q)} className="cursor-pointer">
                  <TableCell className="font-medium text-indigo-600">{q.quote_number}</TableCell>
                  <TableCell className="text-gray-900">{q.client_name}</TableCell>
                  <TableCell className="text-gray-500 hidden md:table-cell">{q.date}</TableCell>
                  <TableCell className="text-gray-500">{q.expiry_date || '—'}</TableCell>
                  <TableCell className="text-right font-medium text-gray-900">${Number(q.total).toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={badge.variant} className={badge.className}>{badge.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-12">No quotes found matching this filter.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}

function QuoteDetail({ quote: q, onClose, onSend, onAccept, onConvert }) {
  const badge = STATUS_BADGE[q.status] || { variant: 'secondary', label: q.status };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold">{q.quote_number}</h3>
            <p className="text-gray-500">{q.title} &middot; {q.client_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={badge.variant} className={badge.className}>{badge.label}</Badge>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-gray-600">
              <span className="text-xl leading-none">&times;</span>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div><p className="text-gray-500 text-xs">Date</p><p className="font-medium">{q.date}</p></div>
          <div><p className="text-gray-500 text-xs">Expiry Date</p><p className="font-medium">{q.expiry_date || '—'}</p></div>
          <div><p className="text-gray-500 text-xs">Client</p><p className="font-medium">{q.client_name}</p></div>
          <div><p className="text-gray-500 text-xs">Status</p><p className="font-medium capitalize">{q.status}{q.converted_to ? ` → ${q.converted_to}` : ''}</p></div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(q.lines || []).map((l, i) => (
              <TableRow key={i}>
                <TableCell>{l.description}</TableCell>
                <TableCell className="text-right">{l.quantity}</TableCell>
                <TableCell className="text-right">${Number(l.unit_price).toLocaleString()}</TableCell>
                <TableCell className="text-right">{l.tax_rate}%</TableCell>
                <TableCell className="text-right font-medium">${Number(l.amount).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-end mt-4">
          <div className="text-sm space-y-1 w-48">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${Number(q.subtotal).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${Number(q.tax_amount).toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>${Number(q.total).toLocaleString()}</span></div>
          </div>
        </div>

        {(q.notes || q.terms) && (
          <div className="mt-6 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {q.notes && <div><p className="text-gray-500 text-xs font-medium mb-1">Notes</p><p className="text-gray-700">{q.notes}</p></div>}
            {q.terms && <div><p className="text-gray-500 text-xs font-medium mb-1">Terms & Conditions</p><p className="text-gray-700">{q.terms}</p></div>}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          {q.status === 'draft' && <Button onClick={() => onSend(q)} className="bg-blue-600 hover:bg-blue-700 text-white">Send to Client</Button>}
          {q.status === 'sent' && <Button variant="success" onClick={() => onAccept(q)}>Mark as Accepted</Button>}
          {(q.status === 'accepted' || q.status === 'sent') && <Button onClick={() => onConvert(q)} className="bg-purple-600 hover:bg-purple-700 text-white">Convert to Invoice</Button>}
        </div>
      </motion.div>
    </div>
  );
}

function CreateQuoteForm({ onSubmit, onCancel, nextNumber }) {
  const [form, setForm] = useState({ quote_number: nextNumber, title: '', client_name: '', date: new Date().toISOString().split('T')[0], expiry_date: '', lines: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 10, amount: 0 }], notes: '', terms: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateLine = (i, k, v) => {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [k]: v };
    if (k === 'quantity' || k === 'unit_price' || k === 'tax_rate') {
      const sub = lines[i].quantity * lines[i].unit_price;
      lines[i].amount = sub * (1 + lines[i].tax_rate / 100);
    }
    set('lines', lines);
  };
  const removeLine = (i) => { if (form.lines.length > 1) set('lines', form.lines.filter((_, idx) => idx !== i)); };
  const addLine = () => set('lines', [...form.lines, { description: '', quantity: 1, unit_price: 0, tax_rate: 10, amount: 0 }]);
  const subtotal = form.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const tax = form.lines.reduce((s, l) => s + l.quantity * l.unit_price * l.tax_rate / 100, 0);

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-4">New Quote</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Client Name *</label><Input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="e.g. Acme Corp" /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Quote Number</label><Input value={form.quote_number} onChange={e => set('quote_number', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Date</label><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Expiry Date</label><Input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Title / Description</label><Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Website Redesign Proposal" /></div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Description</TableHead>
              <TableHead className="text-right w-16">Qty</TableHead>
              <TableHead className="text-right w-24">Price</TableHead>
              <TableHead className="text-right w-16">Tax%</TableHead>
              <TableHead className="text-right w-24">Amount</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {form.lines.map((l, i) => (
              <TableRow key={i}>
                <TableCell className="py-1"><Input value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Line item description" className="h-8 text-sm" /></TableCell>
                <TableCell className="py-1"><Input type="number" value={l.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} className="h-8 text-sm text-right" /></TableCell>
                <TableCell className="py-1"><Input type="number" value={l.unit_price} onChange={e => updateLine(i, 'unit_price', Number(e.target.value))} className="h-8 text-sm text-right" /></TableCell>
                <TableCell className="py-1"><Input type="number" value={l.tax_rate} onChange={e => updateLine(i, 'tax_rate', Number(e.target.value))} className="h-8 text-sm text-right" /></TableCell>
                <TableCell className="py-1 text-right font-medium">${l.amount.toFixed(2)}</TableCell>
                <TableCell className="py-1 text-center">
                  <Button variant="ghost" size="sm" onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500 h-8 w-8 p-0">&times;</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button variant="link" size="sm" onClick={addLine} className="mb-4">+ Add line</Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-astra-500 focus:outline-none focus:ring-2 focus:ring-astra-500/20" rows="2" placeholder="Additional notes for the client" /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Terms & Conditions</label><textarea value={form.terms} onChange={e => set('terms', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-astra-500 focus:outline-none focus:ring-2 focus:ring-astra-500/20" rows="2" placeholder="Payment terms, validity period, etc." /></div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={() => form.client_name && onSubmit({ ...form, subtotal, tax_amount: tax, total: subtotal + tax })} disabled={!form.client_name}>Create Quote</Button>
          </div>
          <div className="text-sm text-right space-y-1">
            <div>Subtotal: <span className="font-medium">${subtotal.toFixed(2)}</span></div>
            <div>Tax: <span className="font-medium">${tax.toFixed(2)}</span></div>
            <div className="font-bold text-base">Total: ${(subtotal + tax).toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
