import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-indigo-100 text-indigo-700',
  partially_received: 'bg-amber-100 text-amber-700',
  received: 'bg-green-100 text-green-700',
  billed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-400',
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Purchase Orders</h2>
          <p className="text-gray-500 mt-1">Create and track purchase orders to suppliers</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card label="Total POs" value={summary.total} />
        <Card label="Open" value={summary.open} color="blue" />
        <Card label="Received" value={summary.received} color="green" />
        <Card label="Billed" value={summary.billed} color="amber" />
        <Card label="Total Value" value={`$${summary.totalValue.toLocaleString()}`} color="indigo" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'draft', 'sent', 'approved', 'partially_received', 'received', 'billed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s ? s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && <PODetail po={selected} onClose={() => setSelected(null)} onApprove={handleApprove} onReceive={handleReceive} onConvertToBill={handleConvertToBill} />}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-3 font-semibold text-gray-700">PO #</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Supplier</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Date</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Expected Delivery</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Total</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} onClick={() => setSelected(p)} className="border-b hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-medium text-indigo-600">{p.po_number}</td>
                <td className="px-4 py-3 text-gray-900">{p.supplier}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.date}</td>
                <td className="px-4 py-3 text-gray-500">{p.expected_delivery}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">${Number(p.total).toLocaleString()}</td>
                <td className="px-4 py-3 text-center"><span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status.replace(/_/g, ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value, color = 'indigo' }) {
  const c = { indigo: 'bg-indigo-50 text-indigo-700', green: 'bg-green-50 text-green-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-blue-50 text-blue-700' };
  return <div className={`rounded-xl p-4 ${c[color]}`}><p className="text-xs font-medium opacity-70">{label}</p><p className="text-xl font-bold mt-1">{value}</p></div>;
}

function PODetail({ po: p, onClose, onApprove, onReceive, onConvertToBill }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold">{p.po_number}</h3>
            <p className="text-gray-500">{p.supplier}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status.replace(/_/g, ' ')}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-2">x</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div><p className="text-gray-500 text-xs">Order Date</p><p className="font-medium">{p.date}</p></div>
          <div><p className="text-gray-500 text-xs">Expected Delivery</p><p className="font-medium">{p.expected_delivery}</p></div>
          <div><p className="text-gray-500 text-xs">Subtotal</p><p className="font-medium">${Number(p.subtotal).toLocaleString()}</p></div>
          <div><p className="text-gray-500 text-xs">Tax</p><p className="font-medium">${Number(p.tax_amount).toLocaleString()}</p></div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead><tr className="border-b">
            <th className="text-left py-2 text-gray-600">Description</th>
            <th className="text-right py-2 text-gray-600">Qty Ordered</th>
            <th className="text-right py-2 text-gray-600">Qty Received</th>
            <th className="text-right py-2 text-gray-600">Unit Price</th>
            <th className="text-right py-2 text-gray-600">Amount</th>
          </tr></thead>
          <tbody>
            {(p.lines || []).map((l, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">{l.description}</td>
                <td className="py-2 text-right">{l.qty_ordered}</td>
                <td className="py-2 text-right">
                  <span className={l.qty_received >= l.qty_ordered ? 'text-green-600' : l.qty_received > 0 ? 'text-amber-600' : 'text-gray-400'}>{l.qty_received}</span>
                </td>
                <td className="py-2 text-right">${Number(l.unit_price).toLocaleString()}</td>
                <td className="py-2 text-right font-medium">${Number(l.amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="text-sm space-y-1 w-48">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${Number(p.subtotal).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${Number(p.tax_amount).toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>${Number(p.total).toLocaleString()}</span></div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          {(p.status === 'draft' || p.status === 'sent') && <button onClick={() => onApprove(p)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Approve</button>}
          {(p.status === 'approved' || p.status === 'partially_received') && <button onClick={() => onReceive(p)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Mark Received</button>}
          {p.status === 'received' && <button onClick={() => onConvertToBill(p)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Convert to Bill</button>}
        </div>
      </div>
    </div>
  );
}
