import { useState } from 'react';
import { verifyVendors } from '../services/api';

export default function VendorAudit() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const sampleData = {
    vendors: [
      { name: 'Acme Supplies', tax_id: 'ABN123456789', address: '100 Main St, Sydney', phone: '02-9000-1234', email: 'info@acme.com.au' },
      { name: 'Ghost Corp', tax_id: '', address: 'PO Box 999', phone: '', email: '' },
      { name: 'J. Smith Consulting', tax_id: '', address: '42 Elm Street', phone: '', email: '' },
      { name: 'Tech Solutions Ltd', tax_id: 'NZBN987654321', address: '50 Queen St, Auckland', phone: '09-555-1234', email: 'hello@techsol.nz' },
      { name: 'Director Services', tax_id: '', address: 'PO Box 123', phone: '', email: 'director@gmail.com' },
    ],
    employees: [
      { name: 'J. Smith Consulting', address: '42 Elm Street', employee_id: 'EMP001' },
      { name: 'Jane Doe', address: '88 Oak Lane', employee_id: 'EMP002' },
    ],
    transactions: [
      { vendor: 'Acme Supplies', amount: 5000, date: '2024-01-15', description: 'Office furniture' },
      { vendor: 'Ghost Corp', amount: 9500, date: '2024-01-20', description: 'Consulting' },
      { vendor: 'Ghost Corp', amount: 9800, date: '2024-01-20', description: 'Advisory' },
      { vendor: 'Ghost Corp', amount: 9200, date: '2024-01-21', description: 'Services' },
      { vendor: 'J. Smith Consulting', amount: 15000, date: '2024-01-25', description: 'Management fees' },
      { vendor: 'Tech Solutions Ltd', amount: 3200, date: '2024-02-01', description: 'Software license' },
      { vendor: 'Acme Supplies', amount: 2100, date: '2024-02-10', description: 'Stationery' },
      { vendor: 'Ghost Corp', amount: 8800, date: '2024-02-15', description: 'Phase 2 consulting' },
      { vendor: 'Director Services', amount: 20000, date: '2024-02-20', description: 'Director fees' },
    ],
  };

  const handleAudit = async () => {
    setLoading(true);
    try {
      const res = await verifyVendors(sampleData);
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Vendor Audit</h2>
          <p className="text-slate-400 mt-1">
            Ghost vendor detection, payment splitting analysis, and concentration risk
          </p>
        </div>
        <button
          onClick={handleAudit}
          disabled={loading}
          className="px-6 py-2 bg-forensic-600 text-white rounded-lg font-medium hover:bg-forensic-700 disabled:opacity-50"
        >
          {loading ? 'Auditing...' : 'Run Vendor Audit'}
        </button>
      </div>

      {/* Sample data info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h3 className="font-semibold mb-3">Sample Data Loaded</h3>
        <p className="text-sm text-slate-400 mb-3">
          This sample includes intentional red flags for demonstration:
        </p>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
          <li><span className="text-red-400">Ghost Corp</span> — no tax ID, PO Box only, no contact info, multiple just-under-threshold payments</li>
          <li><span className="text-red-400">J. Smith Consulting</span> — name and address match employee EMP001</li>
          <li><span className="text-red-400">Director Services</span> — no tax ID, PO Box, large payment</li>
          <li><span className="text-green-400">Acme Supplies</span> — clean vendor with full documentation</li>
          <li><span className="text-green-400">Tech Solutions Ltd</span> — clean vendor with NZBN</li>
        </ul>
      </div>

      {/* Results */}
      {result && !result.error && (
        <div className="space-y-6">
          {result.ghost_vendors && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Ghost Vendor Detection</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  result.ghost_vendors.risk_level === 'critical' ? 'bg-red-900/50 text-red-400' :
                  result.ghost_vendors.risk_level === 'high' ? 'bg-orange-900/50 text-orange-400' :
                  'bg-green-900/50 text-green-400'
                }`}>
                  {result.ghost_vendors.risk_level?.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                {result.ghost_vendors.flagged_vendors} of {result.ghost_vendors.vendors_checked} vendors flagged
              </p>
              <div className="space-y-3">
                {result.ghost_vendors.flags?.map((v, i) => (
                  <div key={i} className={`rounded-lg p-4 border ${
                    v.overall_risk === 'critical' ? 'bg-red-950/30 border-red-800' :
                    v.overall_risk === 'high' ? 'bg-orange-950/30 border-orange-800' :
                    'bg-yellow-950/30 border-yellow-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">{v.vendor}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold ${
                        v.overall_risk === 'critical' ? 'bg-red-900 text-red-300' :
                        'bg-orange-900 text-orange-300'
                      }`}>
                        {v.overall_risk}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {v.flags?.map((f, j) => (
                        <li key={j} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">*</span>
                          {f.detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.concentration && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Vendor Concentration</h3>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-2xl font-bold">{result.concentration.total_vendors}</p>
                  <p className="text-xs text-slate-500">Vendors</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{result.concentration.hhi_index}</p>
                  <p className="text-xs text-slate-500">HHI Index</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-forensic-400">{result.concentration.hhi_interpretation}</p>
                  <p className="text-xs text-slate-500">Interpretation</p>
                </div>
              </div>
              {result.concentration.top_vendors?.map((v, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-t border-slate-800 text-sm">
                  <span className="text-slate-300">{v.vendor}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{v.transaction_count} txns</span>
                    <span className="font-mono text-white">${parseFloat(v.total_spend).toLocaleString()}</span>
                    <span className={`font-bold ${v.pct_of_total > 30 ? 'text-red-400' : 'text-slate-400'}`}>
                      {v.pct_of_total}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.payment_splitting?.split_flags?.length > 0 && (
            <div className="bg-red-950/30 border border-red-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4 text-red-300">Payment Splitting Detected</h3>
              {result.payment_splitting.split_flags.map((f, i) => (
                <div key={i} className="mb-3 p-3 bg-red-950/50 rounded-lg">
                  <p className="text-sm text-red-300 font-medium">{f.vendor} — {f.date}</p>
                  <p className="text-sm text-red-400 mt-1">{f.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result?.error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-6">
          <p className="text-red-400">{result.error}</p>
        </div>
      )}
    </div>
  );
}
