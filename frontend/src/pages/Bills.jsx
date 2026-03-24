import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700', pending_approval: 'bg-blue-100 text-blue-700', approved: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700', voided: 'bg-gray-100 text-gray-400',
  partially_paid: 'bg-amber-100 text-amber-700',
};

const DEMO_BILLS = [
  { id: '1', supplier_name: 'Office Supplies Co', bill_number: 'BILL-001', reference: 'INV-8842', date: '2026-03-01', due_date: '2026-03-31', status: 'approved', currency: 'AUD', subtotal: 1090.91, tax_amount: 109.09, total: 1200.00, amount_paid: 0, amount_due: 1200.00, lines: [{ description: 'A4 Paper (10 reams)', account_code: '5100', quantity: 10, unit_price: 45.45, tax_rate: 10, amount: 500.00 }, { description: 'Ink cartridges', account_code: '5100', quantity: 4, unit_price: 136.36, tax_rate: 10, amount: 600.00 }], payment_terms: 30 },
  { id: '2', supplier_name: 'CloudHost Pro', bill_number: 'BILL-002', reference: 'CH-2026-03', date: '2026-03-01', due_date: '2026-03-15', status: 'paid', currency: 'USD', subtotal: 700.00, tax_amount: 0, total: 700.00, amount_paid: 700.00, amount_due: 0, lines: [{ description: 'Monthly hosting — March 2026', account_code: '5200', quantity: 1, unit_price: 700, tax_rate: 0, amount: 700 }], payment_terms: 14 },
  { id: '3', supplier_name: 'TechParts Ltd', bill_number: 'BILL-003', reference: 'TP-9921', date: '2026-02-10', due_date: '2026-03-27', status: 'approved', currency: 'GBP', subtotal: 3750.00, tax_amount: 750.00, total: 4500.00, amount_paid: 0, amount_due: 4500.00, lines: [{ description: 'Server RAM 64GB (x2)', account_code: '1500', quantity: 2, unit_price: 1250, tax_rate: 20, amount: 3000 }, { description: 'NVMe SSD 2TB', account_code: '1500', quantity: 1, unit_price: 750, tax_rate: 20, amount: 900 }], payment_terms: 45 },
  { id: '4', supplier_name: 'Legal Eagles LLP', bill_number: 'BILL-004', reference: 'LE-MAR-01', date: '2026-03-05', due_date: '2026-03-19', status: 'overdue', currency: 'AUD', subtotal: 2727.27, tax_amount: 272.73, total: 3000.00, amount_paid: 0, amount_due: 3000.00, lines: [{ description: 'Employment contract review (6 hrs)', account_code: '5300', quantity: 6, unit_price: 454.55, tax_rate: 10, amount: 3000 }], payment_terms: 14 },
  { id: '5', supplier_name: 'FastFreight Logistics', bill_number: 'BILL-005', reference: 'FF-W12', date: '2026-03-18', due_date: '2026-03-25', status: 'pending_approval', currency: 'AUD', subtotal: 727.27, tax_amount: 72.73, total: 800.00, amount_paid: 0, amount_due: 800.00, lines: [{ description: 'Weekly freight — Week 12', account_code: '5400', quantity: 1, unit_price: 727.27, tax_rate: 10, amount: 800 }], payment_terms: 7 },
  { id: '6', supplier_name: 'Premium Print & Design', bill_number: 'BILL-006', reference: 'PPD-456', date: '2026-02-15', due_date: '2026-03-07', status: 'paid', currency: 'NZD', subtotal: 2400.00, tax_amount: 360.00, total: 2760.00, amount_paid: 2760.00, amount_due: 0, lines: [{ description: 'Brochure design & 500 prints', account_code: '5500', quantity: 1, unit_price: 2400, tax_rate: 15, amount: 2760 }], payment_terms: 20 },
  { id: '7', supplier_name: 'Office Supplies Co', bill_number: 'BILL-007', reference: 'INV-9103', date: '2026-03-20', due_date: '2026-04-19', status: 'draft', currency: 'AUD', subtotal: 450.00, tax_amount: 45.00, total: 495.00, amount_paid: 0, amount_due: 495.00, lines: [{ description: 'Standing desk converter', account_code: '1500', quantity: 1, unit_price: 450, tax_rate: 10, amount: 495 }], payment_terms: 30 },
  { id: '8', supplier_name: 'TechParts Ltd', bill_number: 'BILL-008', reference: 'TP-10022', date: '2026-03-12', due_date: '2026-04-26', status: 'partially_paid', currency: 'GBP', subtotal: 5000.00, tax_amount: 1000.00, total: 6000.00, amount_paid: 2000.00, amount_due: 4000.00, lines: [{ description: 'Dell PowerEdge R750 Server', account_code: '1500', quantity: 1, unit_price: 5000, tax_rate: 20, amount: 6000 }], payment_terms: 45 },
];

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await api.get('/bills/').catch(() => null);
      setBills(res?.data?.bills || DEMO_BILLS);
    } catch { /* fallback */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = bills.filter(b => !filterStatus || b.status === filterStatus);

  const summary = {
    total: bills.length,
    outstanding: bills.reduce((s, b) => s + (b.amount_due || 0), 0),
    overdue: bills.filter(b => b.status === 'overdue').reduce((s, b) => s + b.amount_due, 0),
    overdue_count: bills.filter(b => b.status === 'overdue').length,
    paid_month: bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.total, 0),
    pending: bills.filter(b => b.status === 'pending_approval').length,
  };

  const handleApprove = (bill) => {
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: 'approved' } : b));
    toast.success(`${bill.bill_number} approved`);
    setSelected(null);
  };

  const handlePay = (bill) => {
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: 'paid', amount_paid: b.total, amount_due: 0 } : b));
    toast.success(`${bill.bill_number} marked as paid`);
    setSelected(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Bills</h2>
          <p className="text-gray-500 mt-1">Track supplier invoices, approvals, and payments</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          {showCreate ? 'Cancel' : '+ New Bill'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card label="Total Bills" value={summary.total} />
        <Card label="Outstanding" value={`$${summary.outstanding.toLocaleString()}`} color="amber" />
        <Card label="Overdue" value={`${summary.overdue_count} ($${summary.overdue.toLocaleString()})`} color="red" />
        <Card label="Awaiting Approval" value={summary.pending} color="blue" />
        <Card label="Paid This Month" value={`$${summary.paid_month.toLocaleString()}`} color="green" />
      </div>

      {/* Create */}
      {showCreate && <CreateBillForm onSubmit={(data) => { setBills(prev => [{ id: String(Date.now()), ...data, status: 'draft', amount_paid: 0, amount_due: data.total }, ...prev]); setShowCreate(false); toast.success('Bill created'); }} onCancel={() => setShowCreate(false)} />}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'draft', 'pending_approval', 'approved', 'overdue', 'partially_paid', 'paid'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s ? s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {/* Detail */}
      {selected && <BillDetail bill={selected} onClose={() => setSelected(null)} onApprove={handleApprove} onPay={handlePay} />}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Bill #</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Supplier</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Date</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Due</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Total</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Due</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id} onClick={() => setSelected(b)} className="border-b hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-medium text-indigo-600">{b.bill_number}</td>
                <td className="px-4 py-3 text-gray-900">{b.supplier_name}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{b.date}</td>
                <td className="px-4 py-3 text-gray-500">{b.due_date}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{b.currency} {Number(b.total).toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium">{b.amount_due > 0 ? <span className="text-amber-600">${Number(b.amount_due).toLocaleString()}</span> : <span className="text-green-600">$0</span>}</td>
                <td className="px-4 py-3 text-center"><span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[b.status]}`}>{b.status.replace('_', ' ')}</span></td>
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

function BillDetail({ bill: b, onClose, onApprove, onPay }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold">{b.bill_number}</h3>
            <p className="text-gray-500">{b.supplier_name} &middot; {b.reference}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[b.status]}`}>{b.status.replace('_', ' ')}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-2">x</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div><p className="text-gray-500 text-xs">Date</p><p className="font-medium">{b.date}</p></div>
          <div><p className="text-gray-500 text-xs">Due Date</p><p className="font-medium">{b.due_date}</p></div>
          <div><p className="text-gray-500 text-xs">Terms</p><p className="font-medium">Net {b.payment_terms}</p></div>
          <div><p className="text-gray-500 text-xs">Currency</p><p className="font-medium">{b.currency}</p></div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead><tr className="border-b"><th className="text-left py-2 text-gray-600">Description</th><th className="text-left py-2 text-gray-600">Account</th><th className="text-right py-2 text-gray-600">Qty</th><th className="text-right py-2 text-gray-600">Price</th><th className="text-right py-2 text-gray-600">Tax</th><th className="text-right py-2 text-gray-600">Amount</th></tr></thead>
          <tbody>
            {(b.lines || []).map((l, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">{l.description}</td><td className="py-2 text-gray-500">{l.account_code}</td>
                <td className="py-2 text-right">{l.quantity}</td><td className="py-2 text-right">${Number(l.unit_price).toLocaleString()}</td>
                <td className="py-2 text-right">{l.tax_rate}%</td><td className="py-2 text-right font-medium">${Number(l.amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="text-sm space-y-1 w-48">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${Number(b.subtotal).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${Number(b.tax_amount).toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{b.currency} {Number(b.total).toLocaleString()}</span></div>
            {b.amount_paid > 0 && <div className="flex justify-between text-green-600"><span>Paid</span><span>-${Number(b.amount_paid).toLocaleString()}</span></div>}
            {b.amount_due > 0 && <div className="flex justify-between font-bold text-amber-600"><span>Balance Due</span><span>${Number(b.amount_due).toLocaleString()}</span></div>}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          {(b.status === 'draft' || b.status === 'pending_approval') && <button onClick={() => onApprove(b)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Approve</button>}
          {(b.status === 'approved' || b.status === 'overdue' || b.status === 'partially_paid') && <button onClick={() => onPay(b)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Mark as Paid</button>}
        </div>
      </div>
    </div>
  );
}

function CreateBillForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ supplier_name: '', bill_number: `BILL-${String(Date.now()).slice(-4)}`, reference: '', date: new Date().toISOString().split('T')[0], due_date: '', currency: 'AUD', payment_terms: 30, lines: [{ description: '', account_code: '', quantity: 1, unit_price: 0, tax_rate: 10, amount: 0 }], notes: '' });
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
  const addLine = () => set('lines', [...form.lines, { description: '', account_code: '', quantity: 1, unit_price: 0, tax_rate: 10, amount: 0 }]);
  const subtotal = form.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const tax = form.lines.reduce((s, l) => s + l.quantity * l.unit_price * l.tax_rate / 100, 0);

  return (
    <div className="bg-white rounded-xl border p-6 mb-8">
      <h3 className="font-bold text-lg mb-4">New Bill</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Supplier *</label><input value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Bill Number</label><input value={form.bill_number} onChange={e => set('bill_number', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="text-xs font-medium text-gray-600 block mb-1">Due Date</label><input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
      </div>
      <table className="w-full text-sm mb-3">
        <thead><tr className="border-b"><th className="text-left py-2">Description</th><th className="text-left py-2 w-24">Account</th><th className="text-right py-2 w-16">Qty</th><th className="text-right py-2 w-24">Price</th><th className="text-right py-2 w-16">Tax%</th><th className="text-right py-2 w-24">Amount</th></tr></thead>
        <tbody>{form.lines.map((l, i) => (
          <tr key={i} className="border-b border-gray-100">
            <td className="py-1"><input value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></td>
            <td className="py-1"><input value={l.account_code} onChange={e => updateLine(i, 'account_code', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></td>
            <td className="py-1"><input type="number" value={l.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} className="w-full px-2 py-1 border rounded text-sm text-right" /></td>
            <td className="py-1"><input type="number" value={l.unit_price} onChange={e => updateLine(i, 'unit_price', Number(e.target.value))} className="w-full px-2 py-1 border rounded text-sm text-right" /></td>
            <td className="py-1"><input type="number" value={l.tax_rate} onChange={e => updateLine(i, 'tax_rate', Number(e.target.value))} className="w-full px-2 py-1 border rounded text-sm text-right" /></td>
            <td className="py-1 text-right font-medium">${l.amount.toFixed(2)}</td>
          </tr>
        ))}</tbody>
      </table>
      <button onClick={addLine} className="text-xs text-indigo-600 font-medium hover:underline mb-4">+ Add line</button>
      <div className="flex justify-between items-end">
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
          <button onClick={() => form.supplier_name && onSubmit({ ...form, subtotal, tax_amount: tax, total: subtotal + tax })} disabled={!form.supplier_name} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40">Create Bill</button>
        </div>
        <div className="text-sm text-right space-y-1">
          <div>Subtotal: <span className="font-medium">${subtotal.toFixed(2)}</span></div>
          <div>Tax: <span className="font-medium">${tax.toFixed(2)}</span></div>
          <div className="font-bold text-base">Total: ${(subtotal + tax).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
