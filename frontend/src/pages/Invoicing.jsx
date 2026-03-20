import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Invoicing() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const [invRes, sumRes] = await Promise.all([
        api.get('/invoicing/').catch(() => ({ data: [] })),
        api.get('/invoicing/summary').catch(() => ({ data: null })),
      ]);
      setInvoices(Array.isArray(invRes.data) ? invRes.data : invRes.data.invoices || []);
      setSummary(sumRes.data);
    } catch {
      // Backend may not be connected
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Invoicing</h2>
          <p className="text-gray-500 mt-1">Create, send, and track invoices</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          {showCreate ? 'Cancel' : '+ New Invoice'}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Total Invoices" value={summary.total_invoices} />
          <SummaryCard label="Outstanding" value={`$${Number(summary.total_outstanding).toLocaleString()}`} color="yellow" />
          <SummaryCard label="Overdue" value={`${summary.overdue_count} ($${Number(summary.total_overdue).toLocaleString()})`} color="red" />
          <SummaryCard label="Collected" value={`$${Number(summary.total_collected).toLocaleString()}`} color="green" />
        </div>
      )}

      {/* Create Invoice Form */}
      {showCreate && <CreateInvoiceForm onCreated={() => { setShowCreate(false); fetchInvoices(); }} />}

      {/* Invoice List */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="bg-gray-50 border rounded-xl p-8 text-center">
          <p className="text-gray-500 font-medium">No invoices yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first invoice to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <InvoiceRow key={inv.id} invoice={inv} onAction={fetchInvoices} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const border = color === 'red' ? 'border-l-red-500' : color === 'yellow' ? 'border-l-yellow-500' : color === 'green' ? 'border-l-green-500' : '';
  return (
    <div className={`bg-white rounded-xl border p-4 ${border ? `border-l-4 ${border}` : ''}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function CreateInvoiceForm({ onCreated }) {
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    payment_terms: 30,
    currency: 'AUD',
    lines: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 10 }],
  });
  const [submitting, setSubmitting] = useState(false);

  const addLine = () => {
    setForm(f => ({ ...f, lines: [...f.lines, { description: '', quantity: 1, unit_price: 0, tax_rate: 10 }] }));
  };

  const updateLine = (i, field, value) => {
    setForm(f => {
      const lines = [...f.lines];
      lines[i] = { ...lines[i], [field]: value };
      return { ...f, lines };
    });
  };

  const removeLine = (i) => {
    setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/invoicing/', {
        ...form,
        issue_date: new Date().toISOString().split('T')[0],
      });
      onCreated();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = form.lines.reduce((s, l) => s + (l.quantity * l.unit_price), 0);
  const totalTax = form.lines.reduce((s, l) => s + (l.quantity * l.unit_price * l.tax_rate / 100), 0);

  return (
    <div className="bg-white border rounded-xl p-6 mb-8">
      <h3 className="font-semibold text-lg mb-4">New Invoice</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input type="text" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
            <input type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terms</label>
              <select value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: Number(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-lg">
                <option value={7}>Net 7</option>
                <option value={14}>Net 14</option>
                <option value={30}>Net 30</option>
                <option value={60}>Net 60</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg">
                {['AUD', 'USD', 'NZD', 'GBP', 'EUR', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Line Items</label>
            <button type="button" onClick={addLine} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Line</button>
          </div>
          <div className="space-y-2">
            {form.lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input type="text" placeholder="Description" value={line.description}
                  onChange={e => updateLine(i, 'description', e.target.value)}
                  className="col-span-5 px-3 py-2 border rounded-lg text-sm" required />
                <input type="number" placeholder="Qty" value={line.quantity} min="1"
                  onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                  className="col-span-2 px-3 py-2 border rounded-lg text-sm" />
                <input type="number" placeholder="Price" value={line.unit_price} min="0" step="0.01"
                  onChange={e => updateLine(i, 'unit_price', Number(e.target.value))}
                  className="col-span-2 px-3 py-2 border rounded-lg text-sm" />
                <input type="number" placeholder="Tax %" value={line.tax_rate} min="0" step="0.1"
                  onChange={e => updateLine(i, 'tax_rate', Number(e.target.value))}
                  className="col-span-2 px-3 py-2 border rounded-lg text-sm" />
                <button type="button" onClick={() => removeLine(i)} disabled={form.lines.length === 1}
                  className="col-span-1 text-red-400 hover:text-red-600 disabled:opacity-30 text-center">x</button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="bg-gray-50 rounded-lg p-4 w-64 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${totalTax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>${(subtotal + totalTax).toFixed(2)}</span></div>
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {submitting ? 'Creating...' : 'Create Invoice'}
        </button>
      </form>
    </div>
  );
}

function InvoiceRow({ invoice, onAction }) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-purple-100 text-purple-700',
    partial: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    void: 'bg-gray-100 text-gray-400',
  };

  const handleSend = async () => {
    try {
      await api.post(`/invoicing/${invoice.id}/send`);
      onAction();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  return (
    <div className="bg-white border rounded-xl p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        <div>
          <p className="font-semibold">{invoice.invoice_number || invoice.id}</p>
          <p className="text-sm text-gray-500">{invoice.customer_name}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold">{invoice.currency} {invoice.total}</p>
          <p className="text-xs text-gray-400">Due: {invoice.due_date || 'N/A'}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[invoice.status] || statusColors.draft}`}>
          {invoice.status}
        </span>
        {invoice.status === 'draft' && (
          <button onClick={handleSend} className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">
            Send
          </button>
        )}
      </div>
    </div>
  );
}
