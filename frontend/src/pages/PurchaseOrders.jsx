import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const STATUS_BADGE = {
  draft: { variant: 'secondary', label: 'Draft' },
  sent: { variant: 'default', label: 'Sent', className: 'bg-blue-100 text-blue-700 border-transparent' },
  approved: { variant: 'default', label: 'Approved', className: 'bg-indigo-100 text-indigo-700 border-transparent' },
  partially_received: { variant: 'warning', label: 'Partially Received' },
  received: { variant: 'success', label: 'Received' },
  billed: { variant: 'success', label: 'Billed', className: 'bg-emerald-100 text-emerald-700 border-transparent' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
};

const DEMO_POS = [
  { id: '1', po_number: 'PO-0001', supplier: 'OfficeMax', date: '2026-03-01', expected_delivery: '2026-03-15', status: 'received', subtotal: 2909.09, tax_amount: 290.91, total: 3200, lines: [
    { description: 'Standing Desk x4', qty_ordered: 4, qty_received: 4, unit_price: 450, amount: 1800 },
    { description: 'Ergonomic Chair x4', qty_ordered: 4, qty_received: 4, unit_price: 350, amount: 1400 },
  ]},
  { id: '2', po_number: 'PO-0002', supplier: 'TechParts Ltd', date: '2026-03-10', expected_delivery: '2026-03-28', status: 'approved', subtotal: 5454.55, tax_amount: 545.45, total: 6000, lines: [
    { description: 'Dell PowerEdge R750', qty_ordered: 1, qty_received: 0, unit_price: 4500, amount: 4500 },
    { description: 'Network Switch 48-port', qty_ordered: 2, qty_received: 0, unit_price: 750, amount: 1500 },
  ]},
  { id: '3', po_number: 'PO-0003', supplier: 'PrintWorks Co', date: '2026-03-15', expected_delivery: '2026-04-01', status: 'sent', subtotal: 1363.64, tax_amount: 136.36, total: 1500, lines: [
    { description: 'Company brochures (1000)', qty_ordered: 1000, qty_received: 0, unit_price: 0.80, amount: 800 },
    { description: 'Business cards (2000)', qty_ordered: 2000, qty_received: 0, unit_price: 0.15, amount: 300 },
    { description: 'Branded folders (500)', qty_ordered: 500, qty_received: 0, unit_price: 0.80, amount: 400 },
  ]},
  { id: '4', po_number: 'PO-0004', supplier: 'SoftwareLicensing.com', date: '2026-02-20', expected_delivery: '2026-02-20', status: 'billed', subtotal: 2181.82, tax_amount: 218.18, total: 2400, lines: [
    { description: 'Microsoft 365 Business (10 seats)', qty_ordered: 10, qty_received: 10, unit_price: 180, amount: 1800 },
    { description: 'Adobe Creative Cloud (2 seats)', qty_ordered: 2, qty_received: 2, unit_price: 300, amount: 600 },
  ]},
  { id: '5', po_number: 'PO-0005', supplier: 'Sparkle Clean Co', date: '2026-03-22', expected_delivery: '2026-03-25', status: 'draft', subtotal: 409.09, tax_amount: 40.91, total: 450, lines: [
    { description: 'Commercial disinfectant (10L)', qty_ordered: 5, qty_received: 0, unit_price: 45, amount: 225 },
    { description: 'Microfibre cloths (pack 50)', qty_ordered: 3, qty_received: 0, unit_price: 35, amount: 105 },
    { description: 'Floor cleaner concentrate (5L)', qty_ordered: 4, qty_received: 0, unit_price: 30, amount: 120 },
  ]},
];

const STAT_COLORS = {
  indigo: 'bg-indigo-50 text-indigo-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
};

export default function PurchaseOrders() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/purchase-orders/').catch(() => null);
        setPos(res?.data?.purchase_orders || DEMO_POS);
      } catch { /* fallback */ } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filtered = pos.filter(p => !filterStatus || p.status === filterStatus);

  const summary = {
    total: pos.length,
    open: pos.filter(p => ['draft', 'sent', 'approved'].includes(p.status)).length,
    received: pos.filter(p => p.status === 'received').length,
    billed: pos.filter(p => p.status === 'billed').length,
    totalValue: pos.reduce((s, p) => s + p.total, 0),
  };

  const handleApprove = (po) => {
    setPos(prev => prev.map(p => p.id === po.id ? { ...p, status: 'approved' } : p));
    toast.success(`${po.po_number} approved`);
    setSelected(null);
  };
  const handleReceive = (po) => {
    const updated = { ...po, status: 'received', lines: po.lines.map(l => ({ ...l, qty_received: l.qty_ordered })) };
    setPos(prev => prev.map(p => p.id === po.id ? updated : p));
    toast.success(`${po.po_number} marked as received`);
    setSelected(null);
  };
  const handleConvertToBill = (po) => {
    setPos(prev => prev.map(p => p.id === po.id ? { ...p, status: 'billed' } : p));
    toast.success(`${po.po_number} converted to bill`);
    setSelected(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Purchase Orders</h2>
          <p className="text-gray-500 mt-1">Create and track purchase orders to suppliers</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total POs', value: summary.total, color: 'indigo' },
          { label: 'Open', value: summary.open, color: 'blue' },
          { label: 'Received', value: summary.received, color: 'green' },
          { label: 'Billed', value: summary.billed, color: 'amber' },
          { label: 'Total Value', value: `$${summary.totalValue.toLocaleString()}`, color: 'indigo' },
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

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'draft', 'sent', 'approved', 'partially_received', 'received', 'billed', 'cancelled'].map(s => (
          <Button
            key={s}
            onClick={() => setFilterStatus(s)}
            variant={filterStatus === s ? 'default' : 'secondary'}
            size="sm"
          >
            {s ? s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
          </Button>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && <PODetail po={selected} onClose={() => setSelected(null)} onApprove={handleApprove} onReceive={handleReceive} onConvertToBill={handleConvertToBill} />}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>PO #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => {
              const badge = STATUS_BADGE[p.status] || { variant: 'secondary', label: p.status };
              return (
                <TableRow key={p.id} onClick={() => setSelected(p)} className="cursor-pointer">
                  <TableCell className="font-medium text-indigo-600">{p.po_number}</TableCell>
                  <TableCell className="text-gray-900">{p.supplier}</TableCell>
                  <TableCell className="text-gray-500 hidden md:table-cell">{p.date}</TableCell>
                  <TableCell className="text-gray-500">{p.expected_delivery}</TableCell>
                  <TableCell className="text-right font-medium text-gray-900">${Number(p.total).toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={badge.variant} className={badge.className}>{badge.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}

function PODetail({ po: p, onClose, onApprove, onReceive, onConvertToBill }) {
  const badge = STATUS_BADGE[p.status] || { variant: 'secondary', label: p.status };
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
            <h3 className="text-xl font-bold">{p.po_number}</h3>
            <p className="text-gray-500">{p.supplier}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={badge.variant} className={badge.className}>{badge.label}</Badge>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-gray-600">
              <span className="text-xl leading-none">&times;</span>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div><p className="text-gray-500 text-xs">Order Date</p><p className="font-medium">{p.date}</p></div>
          <div><p className="text-gray-500 text-xs">Expected Delivery</p><p className="font-medium">{p.expected_delivery}</p></div>
          <div><p className="text-gray-500 text-xs">Subtotal</p><p className="font-medium">${Number(p.subtotal).toLocaleString()}</p></div>
          <div><p className="text-gray-500 text-xs">Tax</p><p className="font-medium">${Number(p.tax_amount).toLocaleString()}</p></div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Description</TableHead>
              <TableHead className="text-right">Qty Ordered</TableHead>
              <TableHead className="text-right">Qty Received</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(p.lines || []).map((l, i) => (
              <TableRow key={i}>
                <TableCell>{l.description}</TableCell>
                <TableCell className="text-right">{l.qty_ordered}</TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    l.qty_received >= l.qty_ordered ? 'text-green-600' : l.qty_received > 0 ? 'text-amber-600' : 'text-gray-400'
                  )}>{l.qty_received}</span>
                </TableCell>
                <TableCell className="text-right">${Number(l.unit_price).toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium">${Number(l.amount).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-end mt-4">
          <div className="text-sm space-y-1 w-48">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${Number(p.subtotal).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${Number(p.tax_amount).toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>${Number(p.total).toLocaleString()}</span></div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          {(p.status === 'draft' || p.status === 'sent') && (
            <Button onClick={() => onApprove(p)}>Approve</Button>
          )}
          {(p.status === 'approved' || p.status === 'partially_received') && (
            <Button variant="success" onClick={() => onReceive(p)}>Mark Received</Button>
          )}
          {p.status === 'received' && (
            <Button onClick={() => onConvertToBill(p)} className="bg-blue-600 hover:bg-blue-700 text-white">Convert to Bill</Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
