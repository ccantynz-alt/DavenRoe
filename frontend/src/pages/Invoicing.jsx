import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Send, X } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { cn } from '@/lib/utils';

export default function Invoicing() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Invoicing</h2>
          <p className="text-gray-500 mt-1">Create, send, and track invoices</p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          variant={showCreate ? 'outline' : 'default'}
        >
          {showCreate ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Invoice
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <SummaryCard label="Total Invoices" value={summary.total_invoices} />
          <SummaryCard label="Outstanding" value={`$${Number(summary.total_outstanding).toLocaleString()}`} color="yellow" />
          <SummaryCard label="Overdue" value={`${summary.overdue_count} ($${Number(summary.total_overdue).toLocaleString()})`} color="red" />
          <SummaryCard label="Collected" value={`$${Number(summary.total_collected).toLocaleString()}`} color="green" />
        </motion.div>
      )}

      {/* Create Invoice Form */}
      {showCreate && <CreateInvoiceForm onCreated={() => { setShowCreate(false); fetchInvoices(); }} />}

      {/* Invoice List */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="pt-6">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No invoices yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first invoice to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <InvoiceRow key={inv.id} invoice={inv} onAction={fetchInvoices} />
                ))}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

function SummaryCard({ label, value, color }) {
  const borderColor = color === 'red'
    ? 'border-l-red-500'
    : color === 'yellow'
      ? 'border-l-yellow-500'
      : color === 'green'
        ? 'border-l-green-500'
        : '';
  return (
    <Card className={cn(borderColor && `border-l-4 ${borderColor}`)}>
      <CardContent className="p-4">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function CreateInvoiceForm({ onCreated }) {
  const toast = useToast();
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
      toast.error(err.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = form.lines.reduce((s, l) => s + (l.quantity * l.unit_price), 0);
  const totalTax = form.lines.reduce((s, l) => s + (l.quantity * l.unit_price * l.tax_rate / 100), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>New Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <Input
                  type="text"
                  value={form.customer_name}
                  onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                <Input
                  type="email"
                  value={form.customer_email}
                  onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terms</label>
                  <Select
                    value={String(form.payment_terms)}
                    onValueChange={val => setForm(f => ({ ...f, payment_terms: Number(val) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Net 7</SelectItem>
                      <SelectItem value="14">Net 14</SelectItem>
                      <SelectItem value="30">Net 30</SelectItem>
                      <SelectItem value="60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <Select
                    value={form.currency}
                    onValueChange={val => setForm(f => ({ ...f, currency: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {['AUD', 'USD', 'NZD', 'GBP', 'EUR', 'CAD'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Line Items</label>
                <Button type="button" variant="ghost" size="sm" onClick={addLine}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Line
                </Button>
              </div>
              <div className="space-y-2">
                {form.lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      type="text"
                      placeholder="Description"
                      value={line.description}
                      onChange={e => updateLine(i, 'description', e.target.value)}
                      className="col-span-5"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={line.quantity}
                      min="1"
                      onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                      className="col-span-2"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={line.unit_price}
                      min="0"
                      step="0.01"
                      onChange={e => updateLine(i, 'unit_price', Number(e.target.value))}
                      className="col-span-2"
                    />
                    <Input
                      type="number"
                      placeholder="Tax %"
                      value={line.tax_rate}
                      min="0"
                      step="0.1"
                      onChange={e => updateLine(i, 'tax_rate', Number(e.target.value))}
                      className="col-span-2"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(i)}
                      disabled={form.lines.length === 1}
                      className="col-span-1 h-8 w-8 text-red-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <Card className="w-64">
                <CardContent className="p-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span>${totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total</span>
                    <span>${(subtotal + totalTax).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InvoiceRow({ invoice, onAction }) {
  const toast = useToast();

  const statusVariant = {
    draft: 'secondary',
    sent: 'default',
    viewed: 'outline',
    partial: 'warning',
    paid: 'success',
    overdue: 'destructive',
    void: 'secondary',
  };

  const handleSend = async () => {
    try {
      await api.post(`/invoicing/${invoice.id}/send`);
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send invoice');
    }
  };

  return (
    <TableRow>
      <TableCell className="font-semibold">
        {invoice.invoice_number || invoice.id}
      </TableCell>
      <TableCell className="text-gray-600">
        {invoice.customer_name}
      </TableCell>
      <TableCell className="text-right font-semibold">
        {invoice.currency} {invoice.total}
      </TableCell>
      <TableCell className="text-gray-400 text-sm">
        {invoice.due_date || 'N/A'}
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant[invoice.status] || 'secondary'}>
          {invoice.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {invoice.status === 'draft' && (
          <Button variant="secondary" size="sm" onClick={handleSend}>
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
