import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

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
  in_stock: { label: 'In Stock', variant: 'success' },
  low_stock: { label: 'Low Stock', variant: 'warning' },
  out_of_stock: { label: 'Out of Stock', variant: 'destructive' },
  service: { label: 'Service', variant: 'default' },
};

const cardAnim = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' } }),
};

const tableAnim = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.4, ease: 'easeOut' } },
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
        <Button onClick={() => setShowForm(!showForm)}>
          + Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Items', value: DEMO_ITEMS.length, sub: `${totalItems} units in stock`, alert: false },
          { label: 'Inventory Value', value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, sub: 'At cost basis', alert: false },
          { label: 'Low / Out of Stock', value: lowStockCount, sub: 'Items need attention', alert: lowStockCount > 0 },
          { label: 'Locations', value: LOCATIONS.length - 1, sub: 'Active warehouses', alert: false },
        ].map((card, i) => (
          <motion.div key={card.label} custom={i} initial="hidden" animate="visible" variants={cardAnim}>
            <Card className={cn(card.alert && 'border-yellow-200')}>
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{card.label}</p>
                <p className={cn('text-2xl font-bold', card.alert ? 'text-yellow-600' : 'text-gray-900')}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add Item Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Inventory Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input placeholder="SKU" />
                <Input placeholder="Item Name" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.slice(1).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.slice(1).map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Quantity" type="number" />
                <Input placeholder="Unit Cost" type="number" step="0.01" />
                <Input placeholder="Sell Price" type="number" step="0.01" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Costing Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO</SelectItem>
                    <SelectItem value="Weighted Average">Weighted Average</SelectItem>
                    <SelectItem value="Specific ID">Specific ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 mt-4">
                <Button>Save Item</Button>
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map(l => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <motion.div initial="hidden" animate="visible" variants={tableAnim}>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Sell Price</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => {
                const st = statusConfig[item.status];
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs text-gray-500">{item.sku}</TableCell>
                    <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                    <TableCell className="text-gray-600">{item.category}</TableCell>
                    <TableCell className="text-gray-600">{item.location}</TableCell>
                    <TableCell className="text-right text-gray-900">{item.qty != null ? item.qty.toLocaleString() : '-'}</TableCell>
                    <TableCell className="text-right text-gray-600">{item.unit_cost != null ? `$${item.unit_cost.toFixed(2)}` : '-'}</TableCell>
                    <TableCell className="text-right text-gray-600">{item.sell_price != null ? `$${item.sell_price.toFixed(2)}` : '-'}</TableCell>
                    <TableCell className="text-gray-600">{item.method}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-400">No items match your filters.</div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
