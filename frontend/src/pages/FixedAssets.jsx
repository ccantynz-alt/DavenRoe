import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  disposed: 'bg-gray-100 text-gray-400',
  fully_depreciated: 'bg-amber-100 text-amber-700',
};

const CATEGORIES = ['All', 'Furniture', 'Equipment', 'Vehicles', 'Software', 'Leasehold'];

function calcDepreciation(cost, method, useful_life, purchase_date) {
  const startYear = new Date(purchase_date).getFullYear();
  const schedule = [];
  let accumulated = 0;
  let nbv = cost;

  for (let y = 0; y < useful_life; y++) {
    let dep;
    if (method === 'diminishing_value') {
      const rate = 1 - Math.pow(0.1 / 1, 1 / useful_life); // ~DV rate so residual ~10%
      dep = Math.round(nbv * (2 / useful_life) * 100) / 100;
      if (dep > nbv) dep = nbv;
    } else {
      dep = Math.round((cost / useful_life) * 100) / 100;
    }
    if (y === useful_life - 1) dep = nbv; // last year clears remaining
    accumulated += dep;
    nbv = Math.max(0, cost - accumulated);
    schedule.push({ year: startYear + y, depreciation: dep, accumulated: Math.round(accumulated * 100) / 100, nbv: Math.round(nbv * 100) / 100 });
  }
  return schedule;
}

function getCurrentNBV(cost, method, useful_life, purchase_date) {
  const schedule = calcDepreciation(cost, method, useful_life, purchase_date);
  const currentYear = 2026;
  const entry = schedule.find(s => s.year === currentYear) || schedule[schedule.length - 1];
  return entry ? entry.nbv : cost;
}

function getAccumulatedDep(cost, method, useful_life, purchase_date) {
  const schedule = calcDepreciation(cost, method, useful_life, purchase_date);
  const currentYear = 2026;
  const entry = schedule.find(s => s.year === currentYear) || schedule[schedule.length - 1];
  return entry ? entry.accumulated : 0;
}

const DEMO_ASSETS = [
  { id: '1', asset_number: 'FA-0001', name: 'Office Furniture', category: 'Furniture', purchase_date: '2024-03-15', cost: 4500, method: 'straight_line', useful_life: 5, status: 'active' },
  { id: '2', asset_number: 'FA-0002', name: 'MacBook Pro x3', category: 'Equipment', purchase_date: '2024-07-01', cost: 9600, method: 'straight_line', useful_life: 3, status: 'active' },
  { id: '3', asset_number: 'FA-0003', name: 'Toyota HiLux', category: 'Vehicles', purchase_date: '2023-11-20', cost: 52000, method: 'diminishing_value', useful_life: 5, status: 'active' },
  { id: '4', asset_number: 'FA-0004', name: 'Office Fitout', category: 'Leasehold', purchase_date: '2022-06-01', cost: 35000, method: 'straight_line', useful_life: 10, status: 'active' },
  { id: '5', asset_number: 'FA-0005', name: 'Dell Server', category: 'Equipment', purchase_date: '2024-01-10', cost: 12000, method: 'straight_line', useful_life: 4, status: 'active' },
  { id: '6', asset_number: 'FA-0006', name: 'Accounting Software', category: 'Software', purchase_date: '2024-04-01', cost: 3600, method: 'straight_line', useful_life: 3, status: 'active' },
  { id: '7', asset_number: 'FA-0007', name: 'Printer/Copier', category: 'Equipment', purchase_date: '2023-08-15', cost: 2800, method: 'straight_line', useful_life: 5, status: 'active' },
];

export default function FixedAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showDispose, setShowDispose] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/fixed-assets/').catch(() => null);
        setAssets(res?.data?.assets || DEMO_ASSETS);
      } catch { /* fallback */ } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filtered = assets.filter(a => filterCategory === 'All' || a.category === filterCategory);

  const summary = {
    total: assets.length,
    totalValue: assets.reduce((s, a) => s + a.cost, 0),
    accDep: assets.filter(a => a.status !== 'disposed').reduce((s, a) => s + getAccumulatedDep(a.cost, a.method, a.useful_life, a.purchase_date), 0),
    nbv: assets.filter(a => a.status !== 'disposed').reduce((s, a) => s + getCurrentNBV(a.cost, a.method, a.useful_life, a.purchase_date), 0),
  };

  const handleDispose = (asset, disposalPrice) => {
    const nbv = getCurrentNBV(asset.cost, asset.method, asset.useful_life, asset.purchase_date);
    const gainLoss = disposalPrice - nbv;
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status: 'disposed', disposal_price: disposalPrice, gain_loss: gainLoss } : a));
    toast.success(`${asset.asset_number} disposed — ${gainLoss >= 0 ? 'Gain' : 'Loss'} of $${Math.abs(Math.round(gainLoss)).toLocaleString()}`);
    setShowDispose(null);
    setSelected(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Fixed Assets</h2>
          <p className="text-gray-500 mt-1">Track assets, depreciation, and disposals</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="Total Assets" value={summary.total} />
        <Card label="Total Value (Cost)" value={`$${summary.totalValue.toLocaleString()}`} color="blue" />
        <Card label="Accumulated Depreciation" value={`$${Math.round(summary.accDep).toLocaleString()}`} color="amber" />
        <Card label="Net Book Value" value={`$${Math.round(summary.nbv).toLocaleString()}`} color="green" />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCategory === c ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && <AssetDetail asset={selected} onClose={() => setSelected(null)} onDispose={() => setShowDispose(selected)} />}

      {/* Dispose Modal */}
      {showDispose && <DisposeModal asset={showDispose} onClose={() => setShowDispose(null)} onConfirm={handleDispose} />}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Asset #</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Category</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Purchase Date</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Cost</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">NBV</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(a => {
              const nbv = a.status === 'disposed' ? 0 : getCurrentNBV(a.cost, a.method, a.useful_life, a.purchase_date);
              const isFullyDep = nbv === 0 && a.status !== 'disposed';
              const displayStatus = isFullyDep ? 'fully_depreciated' : a.status;
              return (
                <tr key={a.id} onClick={() => setSelected(a)} className="border-b hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium text-indigo-600">{a.asset_number}</td>
                  <td className="px-4 py-3 text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{a.category}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{a.purchase_date}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">${Number(a.cost).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">${Math.round(nbv).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[displayStatus]}`}>{displayStatus.replace(/_/g, ' ')}</span></td>
                </tr>
              );
            })}
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

function AssetDetail({ asset: a, onClose, onDispose }) {
  const schedule = calcDepreciation(a.cost, a.method, a.useful_life, a.purchase_date);
  const methodLabel = a.method === 'diminishing_value' ? 'Diminishing Value' : 'Straight Line';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold">{a.asset_number} — {a.name}</h3>
            <p className="text-gray-500">{a.category}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
        </div>

        {/* Purchase Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div><p className="text-gray-500 text-xs">Purchase Date</p><p className="font-medium">{a.purchase_date}</p></div>
          <div><p className="text-gray-500 text-xs">Cost</p><p className="font-medium">${Number(a.cost).toLocaleString()}</p></div>
          <div><p className="text-gray-500 text-xs">Depreciation Method</p><p className="font-medium">{methodLabel}</p></div>
          <div><p className="text-gray-500 text-xs">Useful Life</p><p className="font-medium">{a.useful_life} years</p></div>
        </div>

        {/* Depreciation Schedule */}
        <h4 className="font-semibold text-sm text-gray-700 mb-3">Depreciation Schedule</h4>
        <table className="w-full text-sm mb-6">
          <thead><tr className="border-b">
            <th className="text-left py-2 text-gray-600">Year</th>
            <th className="text-right py-2 text-gray-600">Depreciation</th>
            <th className="text-right py-2 text-gray-600">Accumulated</th>
            <th className="text-right py-2 text-gray-600">NBV</th>
          </tr></thead>
          <tbody>
            {schedule.map((s, i) => (
              <tr key={i} className={`border-b border-gray-100 ${s.year === 2026 ? 'bg-indigo-50' : ''}`}>
                <td className="py-2">{s.year}{s.year === 2026 ? <span className="text-xs text-indigo-600 ml-1">(current)</span> : ''}</td>
                <td className="py-2 text-right">${Number(s.depreciation).toLocaleString()}</td>
                <td className="py-2 text-right">${Number(s.accumulated).toLocaleString()}</td>
                <td className="py-2 text-right font-medium">${Number(s.nbv).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {a.status === 'active' && (
          <div className="flex justify-end pt-4 border-t">
            <button onClick={onDispose} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Dispose Asset</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DisposeModal({ asset, onClose, onConfirm }) {
  const [price, setPrice] = useState('');
  const nbv = getCurrentNBV(asset.cost, asset.method, asset.useful_life, asset.purchase_date);
  const disposalPrice = Number(price) || 0;
  const gainLoss = disposalPrice - nbv;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Dispose {asset.asset_number}</h3>
        <p className="text-sm text-gray-600 mb-4">Current NBV: <span className="font-medium">${Math.round(nbv).toLocaleString()}</span></p>
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 block mb-1">Disposal Price *</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0.00" />
        </div>
        {price && (
          <div className={`text-sm font-medium mb-4 p-3 rounded-lg ${gainLoss >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {gainLoss >= 0 ? 'Gain' : 'Loss'} on disposal: ${Math.abs(Math.round(gainLoss)).toLocaleString()}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
          <button onClick={() => price && onConfirm(asset, disposalPrice)} disabled={!price} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40">Confirm Disposal</button>
        </div>
      </div>
    </div>
  );
}
