import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'practices', label: 'Practices' },
  { id: 'branding', label: 'White-Label' },
  { id: 'import', label: 'Data Import' },
  { id: 'export', label: 'Data Export' },
  { id: 'bulk', label: 'Bulk Operations' },
];

const IMPORT_SOURCES = [
  { id: 'xero', name: 'Xero', color: 'bg-blue-500' },
  { id: 'quickbooks', name: 'QuickBooks', color: 'bg-green-500' },
  { id: 'myob', name: 'MYOB', color: 'bg-purple-500' },
  { id: 'sage', name: 'Sage', color: 'bg-emerald-500' },
  { id: 'freshbooks', name: 'FreshBooks', color: 'bg-sky-500' },
  { id: 'csv', name: 'CSV Upload', color: 'bg-gray-500' },
];

const EXPORT_ENTITIES = [
  { id: 'transactions', label: 'Transactions' },
  { id: 'clients', label: 'Clients' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'journal_entries', label: 'Journal Entries' },
  { id: 'chart_of_accounts', label: 'Chart of Accounts' },
  { id: 'contacts', label: 'Contacts' },
];

const CATEGORIES = [
  'Revenue', 'Cost of Goods Sold', 'Operating Expenses', 'Payroll',
  'Rent & Utilities', 'Professional Fees', 'Travel', 'Marketing',
  'Office Supplies', 'Insurance', 'Depreciation', 'Interest', 'Tax',
];

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PracticesPanel() {
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/enterprise/practices');
      setPractices(data.practices || []);
    } catch {
      setPractices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/enterprise/practices', { name: newName.trim() });
      setNewName('');
      setShowCreate(false);
      load();
    } catch { /* handled */ }
    setCreating(false);
  };

  if (loading) return <LoadingSkeleton rows={3} />;

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Practice Management</h3>
          <p className="text-sm text-gray-500 mt-1">Manage multiple accounting practices from a single dashboard.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          New Practice
        </Button>
      </div>

      {showCreate && (
        <Card className="hover:shadow-sm">
          <CardContent className="pt-5 pb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Practice Name</label>
            <div className="flex gap-3">
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Melbourne Office"
                onKeyDown={(e) => e.key === 'Enter' && create()}
                className="flex-1"
              />
              <Button
                onClick={create}
                disabled={creating || !newName.trim()}
              >
                {creating ? 'Creating...' : 'Create'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowCreate(false); setNewName(''); }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {practices.map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-lg">{p.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{p.name}</h4>
                    <p className="text-sm text-gray-500">{p.entity_count} entities</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={p.status === 'active' ? 'success' : 'secondary'}>
                    {p.status === 'active' ? 'Active' : p.status}
                  </Badge>
                  <Button variant="link" size="sm">
                    Switch
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {practices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-1">No practices yet</p>
            <p className="text-sm">Create your first practice to get started with multi-practice management.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function BrandingPanel() {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/enterprise/branding');
        setBranding(data);
      } catch {
        setBranding({ name: 'Astra', logo_url: '/icon.svg', primary_color: '#4c6ef5', domain: '' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put('/enterprise/branding', branding);
      setBranding(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* handled */ }
    setSaving(false);
  };

  if (loading || !branding) return <LoadingSkeleton rows={4} />;

  const presetColors = ['#4c6ef5', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#be185d'];

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">White-Label Branding</h3>
        <p className="text-sm text-gray-500 mt-1">Customize the platform appearance for your practice and clients.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Practice Name</label>
            <Input
              type="text"
              value={branding.name || ''}
              onChange={(e) => setBranding({ ...branding, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
            <Input
              type="text"
              value={branding.logo_url || ''}
              onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.primary_color || '#4c6ef5'}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
              <Input
                type="text"
                value={branding.primary_color || ''}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                className="flex-1 font-mono"
              />
            </div>
            <div className="flex gap-2 mt-3">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setBranding({ ...branding, primary_color: c })}
                  className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c, borderColor: branding.primary_color === c ? '#111827' : 'transparent' }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Domain</label>
            <Input
              type="text"
              value={branding.domain || ''}
              onChange={(e) => setBranding({ ...branding, domain: e.target.value })}
              placeholder="accounting.yourfirm.com"
            />
            <p className="text-xs text-gray-400 mt-1">Point a CNAME record to app.astra.ai to use your own domain.</p>
          </div>
        </div>

        {/* Live Preview */}
        <Card className="bg-gray-100 border-none shadow-none hover:shadow-none">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-4">Live Preview</p>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 flex items-center gap-3" style={{ backgroundColor: branding.primary_color || '#4c6ef5' }}>
                {branding.logo_url ? (
                  <img src={branding.logo_url} alt="Practice logo" className="w-8 h-8 rounded-lg bg-white/20" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {(branding.name || 'A').charAt(0)}
                  </div>
                )}
                <span className="text-white font-semibold">{branding.name || 'Astra'}</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-8 rounded-lg mt-3" style={{ backgroundColor: branding.primary_color || '#4c6ef5', opacity: 0.15 }} />
              </div>
            </div>
            {branding.domain && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Accessible at <span className="font-medium">{branding.domain}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Branding'}
        </Button>
        {saved && <span className="text-sm text-green-600 font-medium">Branding saved successfully</span>}
      </div>
    </motion.div>
  );
}

function ImportPanel() {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const sampleFields = ['date', 'description', 'amount', 'category', 'reference', 'account'];
  const targetFields = ['date', 'description', 'amount', 'category', 'reference', 'account_code'];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFileData({ name: file.name, size: file.size, content: reader.result });
      // Auto-map matching fields
      const autoMap = {};
      targetFields.forEach((tf) => {
        const match = sampleFields.find((sf) => sf === tf || sf.replace('_', '') === tf.replace('_', ''));
        if (match) autoMap[tf] = match;
      });
      setMapping(autoMap);
    };
    reader.readAsText(file);
  };

  const runImport = async () => {
    setImporting(true);
    try {
      const { data } = await api.post('/enterprise/data-import', {
        source: source?.id || 'csv',
        records: [],
        field_mapping: mapping,
      });
      setResult(data);
      setStep(4);
    } catch {
      setResult({ status: 'error', errors: [{ error: 'Import failed. Please check the file format and try again.' }] });
      setStep(4);
    }
    setImporting(false);
  };

  const reset = () => {
    setStep(1);
    setSource(null);
    setFileData(null);
    setMapping({});
    setResult(null);
  };

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Data Import</h3>
        <p className="text-sm text-gray-500 mt-1">Migrate data from other accounting platforms into Astra.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {['Select Source', 'Upload File', 'Map Fields', 'Complete'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
              step > i + 1 ? 'bg-green-100 text-green-700' : step === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
            )}>
              {step > i + 1 ? '\u2713' : i + 1}
            </div>
            <span className={cn('text-sm', step === i + 1 ? 'text-gray-900 font-medium' : 'text-gray-400')}>{label}</span>
            {i < 3 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Source */}
      {step === 1 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {IMPORT_SOURCES.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer border-2 border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all group"
              onClick={() => { setSource(s); setStep(2); }}
            >
              <CardContent className="pt-5 pb-5 text-left">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-3', s.color)}>
                  {s.name.charAt(0)}
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">{s.name}</h4>
                <p className="text-xs text-gray-500 mt-1">Import from {s.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
            <input
              type="file"
              accept=".csv,.json,.xlsx"
              onChange={handleFileChange}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file" className="cursor-pointer">
              <div className="text-gray-400 text-4xl mb-3">^</div>
              <p className="text-sm font-medium text-gray-700">
                {fileData ? fileData.name : `Upload your ${source?.name || ''} export file`}
              </p>
              <p className="text-xs text-gray-400 mt-1">CSV, JSON, or XLSX format</p>
              {fileData && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  {(fileData.size / 1024).toFixed(1)} KB loaded
                </p>
              )}
            </label>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!fileData}
            >
              Next: Map Fields
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Field Mapping */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs uppercase tracking-wider">Astra Field</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Source Field</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targetFields.map((tf) => (
                  <TableRow key={tf}>
                    <TableCell className="text-sm font-medium text-gray-900 capitalize">{tf.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Select
                        value={mapping[tf] || '_skip_'}
                        onValueChange={(val) => setMapping({ ...mapping, [tf]: val === '_skip_' ? '' : val })}
                      >
                        <SelectTrigger className="w-full max-w-[200px]">
                          <SelectValue placeholder="-- Skip --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_skip_">-- Skip --</SelectItem>
                          {sampleFields.map((sf) => (
                            <SelectItem key={sf} value={sf}>{sf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mapping[tf] ? 'success' : 'secondary'}>
                        {mapping[tf] ? 'Mapped' : 'Unmapped'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button
              onClick={runImport}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Start Import'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && result && (
        <div className="space-y-4">
          <Card className={cn(
            'border',
            result.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          )}>
            <CardContent className="pt-6">
              <h4 className={cn('font-semibold text-lg', result.status === 'completed' ? 'text-green-800' : 'text-red-800')}>
                {result.status === 'completed' ? 'Import Completed' : 'Import Failed'}
              </h4>
              {result.status === 'completed' && (
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-700">{result.total_records}</p>
                    <p className="text-xs text-green-600">Total Records</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-700">{result.imported}</p>
                    <p className="text-xs text-green-600">Imported</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{result.errors?.length || 0}</p>
                    <p className="text-xs text-red-500">Errors</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Button onClick={reset}>
            Import More Data
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function ExportPanel() {
  const [selected, setSelected] = useState(['transactions']);
  const [format, setFormat] = useState('json');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const exportData = async () => {
    setExporting(true);
    setDone(false);
    try {
      const { data } = await api.post('/enterprise/data-export', {
        format,
        entities: selected,
        date_from: dateFrom || null,
        date_to: dateTo || null,
      });
      // Trigger download
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(data, null, 2) : data],
        { type: format === 'json' ? 'application/json' : 'text/csv' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `astra-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch { /* handled */ }
    setExporting(false);
  };

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Data Export</h3>
        <p className="text-sm text-gray-500 mt-1">Download your practice data for backup, migration, or reporting.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Entities</label>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_ENTITIES.map((e) => (
                <Button
                  key={e.id}
                  variant="outline"
                  onClick={() => toggle(e.id)}
                  className={cn(
                    'border-2 justify-start',
                    selected.includes(e.id)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-50'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {e.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="flex gap-3">
              {['json', 'csv'].map((f) => (
                <Button
                  key={f}
                  variant="outline"
                  onClick={() => setFormat(f)}
                  className={cn(
                    'border-2 uppercase',
                    format === f
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-50'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Card className="bg-gray-50 border-none shadow-none hover:shadow-none">
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Export Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Entities</span>
                <span className="font-medium text-gray-900">{selected.length} selected</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Format</span>
                <span className="font-medium text-gray-900 uppercase">{format}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date Range</span>
                <span className="font-medium text-gray-900">
                  {dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All dates'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={exportData}
          disabled={exporting || selected.length === 0}
        >
          {exporting ? 'Exporting...' : 'Download Export'}
        </Button>
        {done && <span className="text-sm text-green-600 font-medium">Export downloaded successfully</span>}
      </div>
    </motion.div>
  );
}

function BulkPanel() {
  const [transactions, setTransactions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [actionResult, setActionResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/enterprise/bulk/transactions');
        setTransactions(data.transactions || []);
      } catch {
        // Generate demo transactions for display
        const demo = Array.from({ length: 8 }, (_, i) => ({
          id: `txn-${i + 1}`,
          date: `2026-03-${String(15 + i).padStart(2, '0')}`,
          description: ['Office supplies from Staples', 'Monthly software subscription', 'Client lunch meeting', 'AWS hosting charges', 'Uber business travel', 'Accounting software license', 'Team training workshop', 'Marketing campaign spend'][i],
          amount: [245.50, 89.99, 132.00, 467.80, 34.50, 199.00, 550.00, 1200.00][i],
          category: [null, 'Software', null, null, 'Travel', 'Software', null, null][i],
          status: ['pending', 'approved', 'pending', 'pending', 'approved', 'pending', 'pending', 'pending'][i],
        }));
        setTransactions(demo);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const bulkCategorize = async () => {
    if (!category || selectedIds.size === 0) return;
    setActionResult(null);
    try {
      const { data } = await api.post('/enterprise/bulk/categorize', {
        transaction_ids: [...selectedIds],
        category,
      });
      setActionResult({ type: 'categorize', ...data });
      setTransactions((prev) => prev.map((t) => selectedIds.has(t.id) ? { ...t, category } : t));
      setSelectedIds(new Set());
    } catch {
      setActionResult({ type: 'categorize', status: 'error' });
    }
  };

  const bulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setActionResult(null);
    try {
      const { data } = await api.post('/enterprise/bulk/approve', {
        transaction_ids: [...selectedIds],
      });
      setActionResult({ type: 'approve', ...data });
      setTransactions((prev) => prev.map((t) => selectedIds.has(t.id) ? { ...t, status: 'approved' } : t));
      setSelectedIds(new Set());
    } catch {
      setActionResult({ type: 'approve', status: 'error' });
    }
  };

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bulk Operations</h3>
          <p className="text-sm text-gray-500 mt-1">Select transactions to categorize or approve in bulk.</p>
        </div>
        {selectedIds.size > 0 && (
          <Badge variant="default">{selectedIds.size} selected</Badge>
        )}
      </div>

      {/* Action bar */}
      {selectedIds.size > 0 && (
        <Card className="bg-indigo-50 border-indigo-200 hover:shadow-sm">
          <CardContent className="pt-4 pb-4 flex items-center gap-4 flex-wrap">
            <Select
              value={category || '_none_'}
              onValueChange={(val) => setCategory(val === '_none_' ? '' : val)}
            >
              <SelectTrigger className="w-[220px] bg-white">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">Select category...</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              onClick={bulkCategorize}
              disabled={!category}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Categorize ({selectedIds.size})
            </Button>
            <Button
              variant="success"
              onClick={bulkApprove}
            >
              Approve ({selectedIds.size})
            </Button>
          </CardContent>
        </Card>
      )}

      {actionResult && (
        <Card className={cn(
          'hover:shadow-sm',
          actionResult.status === 'completed'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        )}>
          <CardContent className="pt-3 pb-3 text-sm font-medium">
            {actionResult.status === 'completed'
              ? `${actionResult.type === 'approve' ? 'Approved' : 'Categorized'} ${actionResult[actionResult.type === 'approve' ? 'approved' : 'updated'] || 0} transactions`
              : 'Operation failed. Please try again.'}
          </CardContent>
        </Card>
      )}

      {/* Transaction table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  checked={selectedIds.size === transactions.length && transactions.length > 0}
                  onChange={selectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Description</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Amount</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Category</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow
                key={t.id}
                className={cn(selectedIds.has(t.id) && 'bg-indigo-50/50')}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(t.id)}
                    onChange={() => toggleSelect(t.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-900">{t.description}</p>
                  <p className="text-xs text-gray-400">{t.date}</p>
                </TableCell>
                <TableCell className="text-sm font-medium text-gray-900 text-right">${t.amount?.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={cn('text-xs font-medium', t.category ? 'text-gray-700' : 'text-gray-400 italic')}>
                    {t.category || 'Uncategorized'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={t.status === 'approved' ? 'success' : 'warning'}>
                    {t.status === 'approved' ? 'Approved' : 'Pending'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500 text-sm">
                  No transactions available for bulk operations.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Enterprise Page
// ---------------------------------------------------------------------------

export default function Enterprise() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enterprise</h1>
        <p className="text-gray-500 mt-1">Multi-practice management, branding, data operations, and bulk workflows.</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="practices">
        <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <Card className="mt-4">
          <CardContent className="pt-6">
            <TabsContent value="practices" className="mt-0">
              <PracticesPanel />
            </TabsContent>
            <TabsContent value="branding" className="mt-0">
              <BrandingPanel />
            </TabsContent>
            <TabsContent value="import" className="mt-0">
              <ImportPanel />
            </TabsContent>
            <TabsContent value="export" className="mt-0">
              <ExportPanel />
            </TabsContent>
            <TabsContent value="bulk" className="mt-0">
              <BulkPanel />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </motion.div>
  );
}
