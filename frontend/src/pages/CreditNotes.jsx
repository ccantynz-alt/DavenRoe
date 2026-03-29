import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700 border-transparent',
  issued: 'bg-blue-100 text-blue-700 border-transparent',
  applied: 'bg-green-100 text-green-700 border-transparent',
  refunded: 'bg-purple-100 text-purple-700 border-transparent',
  voided: 'bg-gray-100 text-gray-400 border-transparent',
};

const DEMO_CREDIT_NOTES = [
  { id: '1', cn_number: 'CN-0001', type: 'receivable', client: 'Acme Corp', original_invoice: 'INV-1042', date: '2026-03-05', status: 'applied', currency: 'AUD', subtotal: 454.55, tax_amount: 45.45, total: 500, reason: 'Customer return — faulty product', lines: [
    { description: 'Widget Pro (returned)', quantity: 2, unit_price: 227.27, tax_rate: 10, amount: 500 },
  ]},
  { id: '2', cn_number: 'CN-0002', type: 'payable', client: 'Office Supplies Co', original_invoice: 'BILL-001', date: '2026-03-10', status: 'issued', currency: 'AUD', subtotal: 181.82, tax_amount: 18.18, total: 200, reason: 'Supplier overcharge on ink cartridges', lines: [
    { description: 'Ink cartridge overcharge correction', quantity: 1, unit_price: 181.82, tax_rate: 10, amount: 200 },
  ]},
  { id: '3', cn_number: 'CN-0003', type: 'receivable', client: 'TechStartup Inc', original_invoice: 'INV-1028', date: '2026-02-28', status: 'applied', currency: 'USD', subtotal: 1000, tax_amount: 0, total: 1000, reason: 'Service discount — annual commitment', lines: [
    { description: 'Annual plan discount (10%)', quantity: 1, unit_price: 1000, tax_rate: 0, amount: 1000 },
  ]},
  { id: '4', cn_number: 'CN-0004', type: 'payable', client: 'FastFreight Logistics', original_invoice: 'BILL-005', date: '2026-03-18', status: 'issued', currency: 'AUD', subtotal: 318.18, tax_amount: 31.82, total: 350, reason: 'Damaged goods in transit', lines: [
    { description: 'Freight damage claim — Week 12 shipment', quantity: 1, unit_price: 318.18, tax_rate: 10, amount: 350 },
  ]},
  { id: '5', cn_number: 'CN-0005', type: 'receivable', client: 'Global Partners Ltd', original_invoice: 'INV-1055', date: '2026-03-20', status: 'refunded', currency: 'GBP', subtotal: 125, tax_amount: 25, total: 150, reason: 'Early payment discount — 2/10 Net 30', lines: [
    { description: 'Early payment discount (2%)', quantity: 1, unit_price: 125, tax_rate: 20, amount: 150 },
  ]},
];

export default function CreditNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/credit-notes/').catch(() => null);
        setNotes(res?.data?.credit_notes || DEMO_CREDIT_NOTES);
      } catch { /* fallback */ } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filtered = notes.filter(n => !filterType || n.type === filterType);

  const summary = {
    total: notes.length,
    issued: notes.filter(n => n.status === 'issued').length,
    applied: notes.filter(n => n.status === 'applied').length,
    remaining: notes.filter(n => n.status === 'issued').reduce((s, n) => s + n.total, 0),
  };

  const handleApply = (note) => {
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, status: 'applied' } : n));
    toast.success(`${note.cn_number} applied to ${note.original_invoice}`);
    setSelected(null);
  };
  const handleRefund = (note) => {
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, status: 'refunded' } : n));
    toast.success(`${note.cn_number} refunded`);
    setSelected(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Credit Notes</h2>
          <p className="text-gray-500 mt-1">Manage credit notes for customers and suppliers</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Credit Notes" value={summary.total} />
        <StatCard label="Issued" value={summary.issued} color="blue" />
        <StatCard label="Applied" value={summary.applied} color="green" />
        <StatCard label="Remaining Credit" value={`$${summary.remaining.toLocaleString()}`} color="amber" />
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-6 flex-wrap bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: '', label: 'All' },
          { key: 'receivable', label: 'Receivable (Customer)' },
          { key: 'payable', label: 'Payable (Supplier)' },
        ].map(f => (
          <Button
            key={f.key}
            variant="ghost"
            size="sm"
            onClick={() => setFilterType(f.key)}
            className={cn(
              'rounded-md',
              filterType === f.key && 'bg-white text-gray-900 shadow-sm hover:bg-white'
            )}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && <CNDetail note={selected} onClose={() => setSelected(null)} onApply={handleApply} onRefund={handleRefund} />}

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>CN #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Client / Supplier</TableHead>
              <TableHead className="hidden md:table-cell">Original Invoice</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(n => (
              <TableRow key={n.id} onClick={() => setSelected(n)} className="cursor-pointer">
                <TableCell className="font-medium text-indigo-600">{n.cn_number}</TableCell>
                <TableCell>
                  <Badge className={cn(n.type === 'receivable' ? 'bg-sky-100 text-sky-700' : 'bg-orange-100 text-orange-700', 'border-transparent')}>
                    {n.type === 'receivable' ? 'Receivable' : 'Payable'}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-900">{n.client}</TableCell>
                <TableCell className="text-gray-500 hidden md:table-cell">{n.original_invoice}</TableCell>
                <TableCell className="text-right font-medium text-gray-900">{n.currency} {Number(n.total).toLocaleString()}</TableCell>
                <TableCell className="text-center"><Badge className={STATUS_COLORS[n.status]}>{n.status}</Badge></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-12">No credit notes found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}

function StatCard({ label, value, color = 'indigo' }) {
  const colors = { indigo: 'bg-indigo-50 text-indigo-700', green: 'bg-green-50 text-green-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-blue-50 text-blue-700' };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card className={cn('border-none shadow-none', colors[color])}>
        <CardContent className="p-4">
          <p className="text-xs font-medium opacity-70">{label}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CNDetail({ note: n, onClose, onApply, onRefund }) {
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
            <h3 className="text-xl font-bold">{n.cn_number}</h3>
            <p className="text-gray-500">{n.client} &middot; {n.type === 'receivable' ? 'Customer Credit' : 'Supplier Credit'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[n.status]}>{n.status}</Badge>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-gray-600">x</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div><p className="text-gray-500 text-xs">Date</p><p className="font-medium">{n.date}</p></div>
          <div><p className="text-gray-500 text-xs">Original Invoice</p><p className="font-medium">{n.original_invoice}</p></div>
          <div><p className="text-gray-500 text-xs">Currency</p><p className="font-medium">{n.currency}</p></div>
          <div><p className="text-gray-500 text-xs">Reason</p><p className="font-medium text-xs">{n.reason}</p></div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(n.lines || []).map((l, i) => (
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
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${Number(n.subtotal).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${Number(n.tax_amount).toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total Credit</span><span>{n.currency} {Number(n.total).toLocaleString()}</span></div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          {n.status === 'issued' && (
            <>
              <Button variant="success" onClick={() => onApply(n)}>Apply to Invoice</Button>
              <Button variant="default" className="bg-purple-600 hover:bg-purple-700" onClick={() => onRefund(n)}>Refund</Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
