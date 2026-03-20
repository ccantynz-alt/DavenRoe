import { useState } from 'react';

const DEMO_ITEMS = [
  { id: 1, sku: 'WDG-001', name: 'Premium Widget A', category: 'Widgets', location: 'Sydney Warehouse', qty: 342, reorder: 50, unit_cost: 12.50, sell_price: 29.99, method: 'FIFO', status: 'in_stock' },
  { id: 2, sku: 'WDG-002', name: 'Standard Widget B', category: 'Widgets', location: 'Sydney Warehouse', qty: 18, reorder: 100, unit_cost: 8.75, sell_price: 19.99, method: 'FIFO', status: 'low_stock' },
  { id: 3, sku: 'SVC-010', name: 'Installation Service', category: 'Services', location: '-', qty: null, reorder: null, unit_cost: null, sell_price: 150.00, method: '-', status: 'service' },
  { id: 4, sku: 'ASM-005', name: 'Widget Assembly Kit', category: 'Assemblies', location: 'Melbourne Depot', qty: 67, reorder: 20, unit_cost: 45.00, sell_price: 89.99, method: 'Weighted Avg', status: 'in_stock' },
  { id: 5, sku: 'RAW-100', name: 'Aluminium Sheet 2mm', category: 'Raw Materials', location: 'Sydney Warehouse', qty: 0, reorder: 200, unit_cost: 3.20, sell_price: null, method: 'FIFO', status: 'out_of_stock' },
  { id: 6, sku: 'WDG-003', name: 'Deluxe Widget C', category: 'Widgets', location: 'Auckland Store', qty: 156, reorder: 30, unit_cost: 22.00, sell_price: 49.99, method: 'Specific ID', status: 'in_stock' },
  { id: 7, sku: 'PKG-020', name: 'Gift Box Bundle', category: 'Assemblies', location: 'Sydney Warehouse', qty: 45, reorder: 25, unit_cost: 35.50, sell_price: 74.99, method: 'Weighted Avg', status: 'in_stock' },
  { id: 8, sku: 'RAW-101', name: 'Steel Rod 10mm', category: 'Raw Materials', location: 'Melbourne Depot', qty: 8, reorder: 50, unit_cost: 5.80, sell_price: null, method: 'FIFO', status: 'low_stock' },
];

const LOCATIONS = ['All Locations', 'Sydney Warehouse', 'Melbourne Depot', 'Auckland Store'];
const CATEGORIES = ['All Categories', 'Widgets', 'Services', 'Assemblies', 'Raw Materials'];

const statusConfig = {
  in_stock: { label: 'In Stock', cls: 'bg-green-50 text-green-700' },
  low_stock: { label: 'Low Stock', cls: 'bg-yellow-50 text-yellow-700' },
  out_of_stock: { label: 'Out of Stock', cls: 'bg-red-50 text-red-700' },
  service: { label: 'Service', cls: 'bg-blue-50 text-blue-700' },
};

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All Locations');
  const [category, setCategory] = useState('All Categories');
  const [showForm, setShowForm] = useState(false);

  const filtered = DEMO_ITEMS.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.sku.toLowerCase().includes(search.toLowerCase())) return false;
    if (location !== 'All Locations' && item.location !== location) return false;
    if (category !== 'All Categories' && item.category !== category) return false;
    return true;
  });

  const totalValue = DEMO_ITEMS.filter(i => i.qty != null && i.unit_cost != null).reduce((sum, i) => sum + i.qty * i.unit_cost, 0);
  const lowStockCount = DEMO_ITEMS.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock').length;
  const totalItems = DEMO_ITEMS.filter(i => i.qty != null).reduce((sum, i) => sum + i.qty, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Track stock levels, assemblies, and costing across locations</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Items" value={DEMO_ITEMS.length} sub={`${totalItems} units in stock`} />
        <SummaryCard label="Inventory Value" value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub="At cost basis" />
        <SummaryCard label="Low / Out of Stock" value={lowStockCount} sub="Items need attention" alert={lowStockCount > 0} />
        <SummaryCard label="Locations" value={LOCATIONS.length - 1} sub="Active warehouses" />
      </div>

      {/* Add Item Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Inventory Item</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input placeholder="SKU" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input placeholder="Item Name" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option>Category</option>
              {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option>Location</option>
              {LOCATIONS.slice(1).map(l => <option key={l}>{l}</option>)}
            </select>
            <input placeholder="Quantity" type="number" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input placeholder="Unit Cost" type="number" step="0.01" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input placeholder="Sell Price" type="number" step="0.01" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option>Costing Method</option>
              <option>FIFO</option>
              <option>Weighted Average</option>
              <option>Specific ID</option>
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Save Item
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
        <select value={location} onChange={e => setLocation(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          {LOCATIONS.map(l => <option key={l}>{l}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">SKU</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Item</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Qty</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Unit Cost</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Sell Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Method</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const st = statusConfig[item.status];
                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 text-gray-600">{item.location}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{item.qty != null ? item.qty.toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.unit_cost != null ? `$${item.unit_cost.toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.sell_price != null ? `$${item.sell_price.toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.method}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-400">No items match your filters.</div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, alert }) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${alert ? 'border-yellow-200' : 'border-gray-200'}`}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${alert ? 'text-yellow-600' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
