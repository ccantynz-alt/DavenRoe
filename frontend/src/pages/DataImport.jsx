import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

const SOURCES = [
  { id: 'xero', name: 'Xero', color: 'bg-blue-500', description: 'Import from Xero (AU/NZ/UK)' },
  { id: 'quickbooks', name: 'QuickBooks', color: 'bg-green-500', description: 'Import from QuickBooks Online' },
  { id: 'myob', name: 'MYOB', color: 'bg-purple-500', description: 'Import from MYOB AccountRight/Essentials' },
  { id: 'sage', name: 'Sage', color: 'bg-teal-500', description: 'Import from Sage Business Cloud' },
  { id: 'freshbooks', name: 'FreshBooks', color: 'bg-orange-500', description: 'Import from FreshBooks' },
  { id: 'csv', name: 'CSV Upload', color: 'bg-gray-500', description: 'Import from any system via CSV' },
];

const DATA_TYPES = [
  { id: 'chart_of_accounts', label: 'Chart of Accounts', icon: '#', count: 0 },
  { id: 'contacts', label: 'Contacts & Clients', icon: '@', count: 0 },
  { id: 'invoices', label: 'Invoices', icon: '$', count: 0 },
  { id: 'bills', label: 'Bills', icon: '>', count: 0 },
  { id: 'bank_transactions', label: 'Bank Transactions', icon: '~', count: 0 },
  { id: 'journal_entries', label: 'Journal Entries', icon: '+', count: 0 },
  { id: 'payroll', label: 'Payroll Records', icon: '%', count: 0 },
  { id: 'inventory', label: 'Inventory Items', icon: '{', count: 0 },
];

const IMPORT_HISTORY = [
  { id: '1', source: 'Xero', date: '2026-03-20', records: 2847, status: 'completed', types: ['Chart of Accounts', 'Contacts', 'Invoices', 'Bank Transactions'], entity: 'Coastal Coffee Co', duration: '3m 42s' },
  { id: '2', source: 'QuickBooks', date: '2026-03-15', records: 1523, status: 'completed', types: ['Contacts', 'Invoices', 'Bills'], entity: 'NorthStar Consulting', duration: '2m 18s' },
  { id: '3', source: 'CSV', date: '2026-03-10', records: 456, status: 'completed', types: ['Bank Transactions'], entity: 'Kiwi Design Studio', duration: '0m 34s' },
  { id: '4', source: 'MYOB', date: '2026-03-05', records: 3201, status: 'completed', types: ['Chart of Accounts', 'Contacts', 'Invoices', 'Bills', 'Journal Entries'], entity: 'Thames Legal Partners', duration: '4m 56s' },
];

const CSV_COLUMNS = [
  'Date', 'Description', 'Amount', 'Reference', 'Account', 'Contact', 'Tax Rate',
  'Currency', 'Category', 'Notes',
];

const ASTRA_FIELDS = [
  { id: 'date', label: 'Transaction Date' }, { id: 'description', label: 'Description' },
  { id: 'amount', label: 'Amount' }, { id: 'reference', label: 'Reference' },
  { id: 'account_code', label: 'Account Code' }, { id: 'contact_name', label: 'Contact Name' },
  { id: 'tax_rate', label: 'Tax Rate' }, { id: 'currency', label: 'Currency' },
  { id: 'category', label: 'Category' }, { id: 'notes', label: 'Notes' },
  { id: 'skip', label: '-- Skip this column --' },
];

function StatCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <Card className="hover:shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className={cn('text-xl font-bold', color)}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DataImport() {
  const [wizard, setWizard] = useState(null);
  const [history, setHistory] = useState(IMPORT_HISTORY);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvFile, setCsvFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const toast = useToast();

  const totalRecords = history.reduce((s, h) => s + h.records, 0);

  const startWizard = (source) => {
    setWizard({ step: 0, source, connected: false });
    setSelectedTypes([]);
    setColumnMapping({});
    setCsvFile(null);
    setProgress(0);
  };

  const handleConnect = () => {
    setWizard(prev => ({ ...prev, connected: true, step: 1 }));
    toast.success(`Connected to ${wizard.source.name}`);
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    setCsvFile(file);
    const autoMap = {};
    CSV_COLUMNS.forEach((col, i) => {
      const match = ASTRA_FIELDS.find(f => f.label.toLowerCase().includes(col.toLowerCase()) || col.toLowerCase().includes(f.id.replace('_', ' ')));
      autoMap[i] = match?.id || 'skip';
    });
    setColumnMapping(autoMap);
    setWizard(prev => ({ ...prev, step: 1 }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      handleFileUpload(file);
    } else {
      toast.error('Please upload a CSV or XLSX file');
    }
  };

  const toggleDataType = (typeId) => {
    setSelectedTypes(prev => prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]);
  };

  const runImport = async () => {
    setImporting(true);
    setProgress(0);
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 60));
      setProgress(i);
    }
    const recordCount = Math.floor(Math.random() * 2000) + 500;
    const newImport = {
      id: String(Date.now()),
      source: wizard.source.name,
      date: new Date().toISOString().split('T')[0],
      records: recordCount,
      status: 'completed',
      types: selectedTypes.map(t => DATA_TYPES.find(d => d.id === t)?.label || t),
      entity: 'Current Entity',
      duration: `${Math.floor(Math.random() * 4) + 1}m ${Math.floor(Math.random() * 59)}s`,
    };
    setHistory(prev => [newImport, ...prev]);
    setImporting(false);
    setWizard(null);
    toast.success(`Successfully imported ${recordCount.toLocaleString()} records from ${newImport.source}`);
  };

  // Wizard view
  if (wizard) {
    const steps = wizard.source.id === 'csv'
      ? ['Upload File', 'Map Columns', 'Review', 'Import']
      : ['Connect', 'Select Data', 'Review', 'Import'];

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setWizard(null)} className="text-gray-400 hover:text-gray-600">
            <span className="text-xl">&larr;</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import from {wizard.source.name}</h1>
            <p className="text-sm text-gray-500">Step {wizard.step + 1} of {steps.length}</p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex gap-1">
          {steps.map((label, i) => (
            <div key={i} className="flex-1">
              <div className={cn('h-1.5 rounded-full', i <= wizard.step ? 'bg-blue-500' : 'bg-gray-200')} />
              <p className={cn('text-[10px] mt-1', i <= wizard.step ? 'text-blue-600 font-medium' : 'text-gray-400')}>{label}</p>
            </div>
          ))}
        </div>

        {/* Step 0: Connect / Upload */}
        {wizard.step === 0 && (
          <Card>
            <CardContent className="p-6">
              {wizard.source.id === 'csv' ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Upload your CSV file</h3>
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-xl p-12 text-center transition',
                      dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <p className="text-3xl mb-3">📄</p>
                    <p className="text-sm font-medium text-gray-700">Drag and drop your CSV file here</p>
                    <p className="text-xs text-gray-400 mt-1">or</p>
                    <Button onClick={() => fileRef.current?.click()} className="mt-3" size="sm">
                      Browse Files
                    </Button>
                    <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden"
                      onChange={e => handleFileUpload(e.target.files?.[0])} />
                    <p className="text-xs text-gray-400 mt-3">Supported: CSV, XLSX (max 50MB)</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className={cn('w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center', wizard.source.color)}>
                    <span className="text-white text-2xl font-bold">{wizard.source.name[0]}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Connect to {wizard.source.name}</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    We'll redirect you to {wizard.source.name} to authorise read-only access to your data.
                    We never store your {wizard.source.name} credentials.
                  </p>
                  <Button onClick={handleConnect}>
                    Connect {wizard.source.name} Account
                  </Button>
                  <p className="text-xs text-gray-400 mt-3">Read-only access · Revocable anytime · Data encrypted in transit</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 1: Select Data / Map Columns */}
        {wizard.step === 1 && (
          <Card>
            <CardContent className="p-6">
              {wizard.source.id === 'csv' ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Map your columns to Astra fields</h3>
                  {csvFile && <p className="text-sm text-gray-500 mb-4">File: {csvFile.name}</p>}
                  <div className="space-y-2">
                    {CSV_COLUMNS.map((col, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 w-32 shrink-0">{col}</span>
                        <span className="text-gray-300">→</span>
                        <Select value={columnMapping[i] || 'skip'} onValueChange={val => setColumnMapping(prev => ({ ...prev, [i]: val }))}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ASTRA_FIELDS.map(f => (
                              <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => setWizard(prev => ({ ...prev, step: 2 }))}>
                      Continue to Review
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Select what to import</h3>
                  <p className="text-sm text-gray-500 mb-4">Choose the data types you want to bring into Astra</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DATA_TYPES.map(type => {
                      const selected = selectedTypes.includes(type.id);
                      return (
                        <button key={type.id} onClick={() => toggleDataType(type.id)}
                          className={cn(
                            'p-4 border-2 rounded-xl text-left transition',
                            selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          )}>
                          <span className="text-lg">{type.icon}</span>
                          <p className="text-sm font-medium text-gray-800 mt-1">{type.label}</p>
                          {selected && <p className="text-[10px] text-blue-600 mt-1">Selected</p>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <Button variant="link" onClick={() => setSelectedTypes(DATA_TYPES.map(t => t.id))}>
                      Select all
                    </Button>
                    <Button onClick={() => setWizard(prev => ({ ...prev, step: 2 }))} disabled={selectedTypes.length === 0}>
                      Continue to Review
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review */}
        {wizard.step === 2 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Review your import</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">Source</span>
                  <span className="font-medium text-gray-900">{wizard.source.name}</span>
                </div>
                {wizard.source.id === 'csv' ? (
                  <>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-gray-500">File</span>
                      <span className="font-medium text-gray-900">{csvFile?.name || 'uploaded.csv'}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-gray-500">Mapped columns</span>
                      <span className="font-medium text-gray-900">
                        {Object.values(columnMapping).filter(v => v !== 'skip').length} of {CSV_COLUMNS.length}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="text-gray-500">Data types</span>
                    <span className="font-medium text-gray-900">{selectedTypes.length} selected</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">Destination</span>
                  <span className="font-medium text-gray-900">Current Entity</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duplicate handling</span>
                  <span className="font-medium text-gray-900">Skip duplicates (safe)</span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-700">
                  Existing data will not be overwritten. Duplicate transactions (matched by date, amount, and reference) will be skipped automatically.
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setWizard(prev => ({ ...prev, step: 1 }))}>
                  Back
                </Button>
                <Button onClick={() => { setWizard(prev => ({ ...prev, step: 3 })); runImport(); }}>
                  Start Import
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Importing */}
        {wizard.step === 3 && (
          <Card>
            <CardContent className="p-6 text-center">
              {importing ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Importing from {wizard.source.name}...</h3>
                  <p className="text-sm text-gray-500 mb-4">This usually takes 2-5 minutes. You can leave this page — we'll notify you when it's done.</p>
                  <div className="max-w-md mx-auto">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" indicatorClassName="bg-blue-500" />
                    {progress > 30 && <p className="text-xs text-gray-400 mt-2">Mapping and validating records...</p>}
                    {progress > 70 && <p className="text-xs text-gray-400 mt-1">Running AI categorisation on imported transactions...</p>}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Import Complete</h3>
                  <p className="text-sm text-gray-500 mb-4">All records have been imported and categorised.</p>
                  <Button onClick={() => setWizard(null)}>
                    Back to Import Center
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  }

  // Main view
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
        <p className="text-sm text-gray-500 mt-0.5">Migrate from any platform or upload CSV files</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Imports" value={history.length} />
        <StatCard label="Records Imported" value={totalRecords.toLocaleString()} color="text-blue-600" />
        <StatCard label="Last Import" value={history[0]?.date || 'Never'} sub={history[0]?.source} />
        <StatCard label="Sources Connected" value={history.filter((h, i, a) => a.findIndex(x => x.source === h.source) === i).length} />
      </div>

      {/* Source selection */}
      <Card>
        <CardHeader>
          <CardTitle>Import from</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {SOURCES.map(source => (
              <button key={source.id} onClick={() => startWizard(source)}
                className="p-4 border-2 rounded-xl text-center hover:border-blue-300 hover:shadow-md transition group">
                <div className={cn('w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center', source.color)}>
                  <span className="text-white text-lg font-bold">{source.name[0]}</span>
                </div>
                <p className="text-sm font-medium text-gray-800">{source.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 group-hover:text-blue-500">Click to import</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What gets imported */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">What gets imported?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DATA_TYPES.map(type => (
              <div key={type.id} className="flex items-center gap-2 text-sm text-blue-800">
                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {type.label}
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-3">Duplicates are automatically detected and skipped. Your existing data is never overwritten.</p>
        </CardContent>
      </Card>

      {/* Import history */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No imports yet. Choose a source above to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Data Types</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium text-gray-800">{h.source}</TableCell>
                    <TableCell className="text-gray-500">{h.entity}</TableCell>
                    <TableCell className="text-gray-500">{h.date}</TableCell>
                    <TableCell className="text-gray-800 font-medium">{h.records.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {h.types.map(t => (
                          <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0.5">{t}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">{h.duration}</TableCell>
                    <TableCell>
                      <Badge variant="success">{h.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Migration tips */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. <strong>Reconcile first.</strong> Make sure your source platform is fully reconciled before exporting. Unreconciled transactions may import as duplicates.</p>
            <p>2. <strong>Export all data.</strong> When importing from cloud platforms, select all data types. It's easier to have everything in Astra than to go back for missing items.</p>
            <p>3. <strong>Check your chart of accounts.</strong> After import, review your chart of accounts to merge any duplicates or adjust mappings.</p>
            <p>4. <strong>Run a trial balance.</strong> Compare the trial balance in Astra with your source platform to verify the import is accurate.</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
