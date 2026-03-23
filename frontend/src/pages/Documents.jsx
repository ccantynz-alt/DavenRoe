import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Documents</h2>
          <p className="text-gray-500 mt-1">Upload receipts, invoices, and supporting documents</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          {showUpload ? 'Cancel' : '+ Upload'}
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">Total Documents</p>
            <p className="text-2xl font-bold">{summary.total_documents || 0}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">Linked to Transactions</p>
            <p className="text-2xl font-bold">{summary.linked || 0}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">OCR Processed</p>
            <p className="text-2xl font-bold">{summary.ocr_processed || 0}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">Document Types</p>
            <p className="text-2xl font-bold">{Object.keys(summary.by_type || {}).length}</p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {showUpload && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mb-8 border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <div className="text-4xl mb-4 text-gray-300">^</div>
          <p className="text-gray-600 font-medium mb-2">Drag & drop files here</p>
          <p className="text-gray-400 text-sm mb-4">or click to browse</p>
          <label className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium cursor-pointer hover:bg-indigo-700 transition-colors">
            Choose Files
            <input type="file" className="hidden" onChange={handleFileSelect}
              accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls,.doc,.docx" />
          </label>
          <p className="text-xs text-gray-400 mt-4">
            Supported: PDF, Images (PNG, JPG), CSV, Excel, Word. Max 25MB per file.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search documents..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          Search
        </button>
      </div>

      {/* Document Types */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4">Supported Document Types</h3>
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
      </div>

      {/* Search Results */}
      {documents.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-lg mb-3">Search Results</h3>
          {documents.map(doc => (
            <div key={doc.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{doc.filename}</p>
                <p className="text-sm text-gray-500">{doc.doc_type} - {doc.document_date}</p>
              </div>
              <div className="flex items-center gap-3">
                {doc.ocr_processed && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">OCR</span>
                )}
                {doc.linked_transactions?.length > 0 && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {doc.linked_transactions.length} linked
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocTypeCard({ type, desc, formats }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="font-medium text-sm">{type}</p>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
      <p className="text-xs text-gray-400 mt-1">{formats}</p>
    </div>
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
