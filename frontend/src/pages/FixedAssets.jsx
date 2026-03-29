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
  active: { variant: 'success', label: 'Active' },
  disposed: { variant: 'secondary', label: 'Disposed' },
  fully_depreciated: { variant: 'warning', label: 'Fully Depreciated' },
};

const CATEGORIES = ['All', 'Furniture', 'Equipment', 'Vehicles', 'Software', 'Leasehold'];

const STAT_COLORS = {
  indigo: 'bg-indigo-50 text-indigo-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
};

function calcDepreciation(cost, method, useful_life, purchase_date) {
  const startYear = new Date(purchase_date).getFullYear();
  const schedule = [];
  let accumulated = 0;
  let nbv = cost;

  for (let y = 0; y < useful_life; y++) {
    let dep;
    if (method === 'diminishing_value') {
      dep = Math.round(nbv * (2 / useful_life) * 100) / 100;
      if (dep > nbv) dep = nbv;
    } else {
      dep = Math.round((cost / useful_life) * 100) / 100;
    }
    if (y === useful_life - 1) dep = nbv;
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Fixed Assets</h2>
          <p className="text-gray-500 mt-1">Track assets, depreciation, and disposals</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Assets', value: summary.total, color: 'indigo' },
          { label: 'Total Value (Cost)', value: `$${summary.totalValue.toLocaleString()}`, color: 'blue' },
          { label: 'Accumulated Depreciation', value: `$${Math.round(summary.accDep).toLocaleString()}`, color: 'amber' },
          { label: 'Net Book Value', value: `$${Math.round(summary.nbv).toLocaleString()}`, color: 'green' },
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

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(c => (
          <Button
            key={c}
            onClick={() => setFilterCategory(c)}
            variant={filterCategory === c ? 'default' : 'secondary'}
            size="sm"
          >
            {c}
          </Button>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && <AssetDetail asset={selected} onClose={() => setSelected(null)} onDispose={() => setShowDispose(selected)} />}

      {/* Dispose Modal */}
      {showDispose && <DisposeModal asset={showDispose} onClose={() => setShowDispose(null)} onConfirm={handleDispose} />}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Asset #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Purchase Date</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">NBV</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(a => {
              const nbv = a.status === 'disposed' ? 0 : getCurrentNBV(a.cost, a.method, a.useful_life, a.purchase_date);
              const isFullyDep = nbv === 0 && a.status !== 'disposed';
              const displayStatus = isFullyDep ? 'fully_depreciated' : a.status;
              const badge = STATUS_BADGE[displayStatus] || { variant: 'secondary', label: displayStatus };
              return (
                <TableRow key={a.id} onClick={() => setSelected(a)} className="cursor-pointer">
                  <TableCell className="font-medium text-indigo-600">{a.asset_number}</TableCell>
                  <TableCell className="text-gray-900">{a.name}</TableCell>
                  <TableCell className="text-gray-500 hidden md:table-cell">{a.category}</TableCell>
                  <TableCell className="text-gray-500 hidden md:table-cell">{a.purchase_date}</TableCell>
                  <TableCell className="text-right font-medium text-gray-900">${Number(a.cost).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium text-gray-900">${Math.round(nbv).toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
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

function AssetDetail({ asset: a, onClose, onDispose }) {
  const schedule = calcDepreciation(a.cost, a.method, a.useful_life, a.purchase_date);
  const methodLabel = a.method === 'diminishing_value' ? 'Diminishing Value' : 'Straight Line';

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
            <h3 className="text-xl font-bold">{a.asset_number} — {a.name}</h3>
            <p className="text-gray-500">{a.category}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-gray-600">
            <span className="text-xl leading-none">&times;</span>
          </Button>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Year</TableHead>
              <TableHead className="text-right">Depreciation</TableHead>
              <TableHead className="text-right">Accumulated</TableHead>
              <TableHead className="text-right">NBV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((s, i) => (
              <TableRow key={i} className={cn(s.year === 2026 && 'bg-indigo-50')}>
                <TableCell>{s.year}{s.year === 2026 ? <span className="text-xs text-indigo-600 ml-1">(current)</span> : ''}</TableCell>
                <TableCell className="text-right">${Number(s.depreciation).toLocaleString()}</TableCell>
                <TableCell className="text-right">${Number(s.accumulated).toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium">${Number(s.nbv).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {a.status === 'active' && (
          <div className="flex justify-end pt-4 border-t mt-4">
            <Button variant="destructive" onClick={onDispose}>Dispose Asset</Button>
          </div>
        )}
      </motion.div>
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">Dispose {asset.asset_number}</h3>
        <p className="text-sm text-gray-600 mb-4">Current NBV: <span className="font-medium">${Math.round(nbv).toLocaleString()}</span></p>
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 block mb-1">Disposal Price *</label>
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
        </div>
        {price && (
          <div className={cn('text-sm font-medium mb-4 p-3 rounded-lg', gainLoss >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
            {gainLoss >= 0 ? 'Gain' : 'Loss'} on disposal: ${Math.abs(Math.round(gainLoss)).toLocaleString()}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => price && onConfirm(asset, disposalPrice)} disabled={!price}>Confirm Disposal</Button>
        </div>
      </motion.div>
    </div>
  );
}
