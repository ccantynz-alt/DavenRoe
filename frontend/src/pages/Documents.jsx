import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' } }),
};

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  const fetchSummary = async () => {
    try {
      const res = await api.get('/documents/summary');
      setSummary(res.data);
    } catch { /* backend may not be connected */ }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await api.get(`/documents/search/${encodeURIComponent(searchQuery)}`);
      setDocuments(res.data.results || []);
    } catch {
      setDocuments([]);
    }
  };

  const handleUpload = async (file) => {
    try {
      await api.post('/documents/upload', {
        filename: file.name,
        content_type: file.type,
        doc_type: guessDocType(file.name),
        description: file.name,
        document_date: new Date().toISOString().split('T')[0],
      });
      setShowUpload(false);
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  const summaryCards = [
    { label: 'Total Documents', value: summary?.total_documents || 0 },
    { label: 'Linked to Transactions', value: summary?.linked || 0 },
    { label: 'OCR Processed', value: summary?.ocr_processed || 0 },
    { label: 'Document Types', value: Object.keys(summary?.by_type || {}).length },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Documents</h2>
          <p className="text-gray-500 mt-1">Upload receipts, invoices, and supporting documents</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? 'Cancel' : '+ Upload'}
        </Button>
      </motion.div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((card, i) => (
            <motion.div key={card.label} variants={fadeUp} custom={i}>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {showUpload && (
        <motion.div variants={fadeUp}>
          <Card
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'mb-8 border-2 border-dashed text-center transition-colors',
              dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'
            )}
          >
            <CardContent className="py-12">
              <div className="text-4xl mb-4 text-gray-300">^</div>
              <p className="text-gray-600 font-medium mb-2">Drag & drop files here</p>
              <p className="text-gray-400 text-sm mb-4">or click to browse</p>
              <label className="inline-block cursor-pointer">
                <Button asChild>
                  <span>Choose Files</span>
                </Button>
                <input type="file" className="hidden" onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls,.doc,.docx" />
              </label>
              <p className="text-xs text-gray-400 mt-4">
                Supported: PDF, Images (PNG, JPG), CSV, Excel, Word. Max 25MB per file.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search */}
      <motion.div variants={fadeUp} className="flex gap-3 mb-6">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search documents..."
          className="flex-1"
        />
        <Button variant="secondary" onClick={handleSearch}>
          Search
        </Button>
      </motion.div>

      {/* Document Types */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle>Supported Document Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DocTypeCard type="Receipts" desc="Purchase receipts, expense slips" formats="PDF, JPG, PNG" />
              <DocTypeCard type="Invoices" desc="Supplier invoices, bills" formats="PDF, Word" />
              <DocTypeCard type="Bank Statements" desc="Monthly statements for reconciliation" formats="PDF, CSV" />
              <DocTypeCard type="Tax Documents" desc="BAS, tax returns, ATO correspondence" formats="PDF" />
              <DocTypeCard type="Contracts" desc="Vendor agreements, employment contracts" formats="PDF, Word" />
              <DocTypeCard type="Spreadsheets" desc="Trial balances, working papers" formats="Excel, CSV" />
            </div>
            <p className="text-xs text-gray-400 mt-4">
              AI-powered OCR extracts amounts, dates, ABNs, and line items automatically.
              Documents are linked to transactions for a complete audit trail.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search Results */}
      {documents.length > 0 && (
        <motion.div variants={fadeUp} className="mt-6 space-y-2">
          <h3 className="font-semibold text-lg mb-3">Search Results</h3>
          {documents.map((doc, i) => (
            <motion.div key={doc.id} variants={fadeUp} custom={i}>
              <Card className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{doc.filename}</p>
                  <p className="text-sm text-gray-500">{doc.doc_type} - {doc.document_date}</p>
                </div>
                <div className="flex items-center gap-3">
                  {doc.ocr_processed && (
                    <Badge variant="success">OCR</Badge>
                  )}
                  {doc.linked_transactions?.length > 0 && (
                    <Badge variant="default">
                      {doc.linked_transactions.length} linked
                    </Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function DocTypeCard({ type, desc, formats }) {
  return (
    <Card className="bg-gray-50 border-0 shadow-none">
      <CardContent className="p-4">
        <p className="font-medium text-sm">{type}</p>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
        <Badge variant="outline" className="mt-2">{formats}</Badge>
      </CardContent>
    </Card>
  );
}

function guessDocType(filename) {
  const name = filename.toLowerCase();
  if (name.includes('receipt')) return 'receipt';
  if (name.includes('invoice') || name.includes('inv')) return 'invoice';
  if (name.includes('statement')) return 'bank_statement';
  if (name.includes('tax') || name.includes('bas')) return 'tax';
  if (name.includes('contract')) return 'contract';
  return 'other';
}
