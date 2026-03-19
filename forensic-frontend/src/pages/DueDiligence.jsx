import { useState } from 'react';
import { runFullAudit } from '../services/api';

const SAMPLE_AUDIT_DATA = {
  target_name: 'Acme Corp Pty Ltd',
  transactions: [
    { date: '2024-01-15', amount: 1247.50, description: 'Client payment', counterparty: 'BigCo Inc', vendor: 'BigCo Inc' },
    { date: '2024-01-16', amount: -892.10, description: 'Office supplies', counterparty: 'Staples', vendor: 'Staples' },
    { date: '2024-01-18', amount: -10000.00, description: 'Consulting fee', counterparty: 'Smith Consulting', vendor: 'Smith Consulting' },
    { date: '2024-01-18', amount: -9999.00, description: 'Advisory payment', counterparty: 'Smith Consulting', vendor: 'Smith Consulting' },
    { date: '2024-01-20', amount: 25000.00, description: 'Project milestone', counterparty: 'BigCo Inc', vendor: 'BigCo Inc' },
    { date: '2024-01-25', amount: -5000.00, description: 'Rent', counterparty: 'Property LLC', vendor: 'Property LLC' },
    { date: '2024-01-28', amount: -3000.00, description: 'Payment', counterparty: 'Director J. Smith', vendor: 'Director J. Smith' },
    { date: '2024-01-30', amount: 15000.00, description: 'Revenue', counterparty: 'BigCo Inc', vendor: 'BigCo Inc' },
    { date: '2024-02-01', amount: -1500.00, description: 'SaaS subscriptions', counterparty: 'Various', vendor: 'Various' },
    { date: '2024-02-05', amount: -2000.00, description: 'misc', counterparty: 'Cash', vendor: 'Cash' },
  ],
  vendors: [
    { name: 'Smith Consulting', tax_id: '', address: 'PO Box 1234', phone: '', email: '' },
    { name: 'Property LLC', tax_id: 'ABN12345678', address: '100 Main St', phone: '555-0100', email: 'info@property.com' },
    { name: 'J. Smith', tax_id: '', address: '42 Elm Street', phone: '', email: '' },
    { name: 'Staples', tax_id: 'EIN98765432', address: '200 Commerce Blvd', phone: '555-0200', email: 'business@staples.com' },
  ],
  employees: [
    { name: 'J. Smith', address: '42 Elm Street', employee_id: 'EMP001' },
    { name: 'A. Jones', address: '55 Oak Ave', employee_id: 'EMP002' },
  ],
  payroll_records: [
    { employee_id: 'EMP001', name: 'J. Smith', gross_pay: 8000, tax_withheld: 2400, period: '2024-01' },
    { employee_id: 'EMP002', name: 'A. Jones', gross_pay: 6000, tax_withheld: 1500, period: '2024-01' },
    { employee_id: 'EMP003', name: 'Ghost Worker', gross_pay: 5000, tax_withheld: 1000, period: '2024-01', bank_account: 'ACC-999' },
    { employee_id: 'EMP001', name: 'J. Smith', gross_pay: 8000, tax_withheld: 2400, period: '2024-02', bank_account: 'ACC-999' },
  ],
  tax_filings: [
    { period: '2024-01', total_gross: 12000, total_tax_withheld: 3500 },
    { period: '2024-02', total_gross: 8000, total_tax_withheld: 2400 },
  ],
};

export default function DueDiligence() {
  const [data, setData] = useState(JSON.stringify(SAMPLE_AUDIT_DATA, null, 2));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAudit = async () => {
    setLoading(true);
    try {
      const parsed = JSON.parse(data);
      const res = await runFullAudit(parsed);
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
          <h2 className="text-3xl font-bold">90-Minute Financial Health Audit</h2>
          <p className="text-slate-400 mt-1">
            Upload target company data for a complete forensic analysis
          </p>
        </div>
        <button
          onClick={handleAudit}
          disabled={loading}
          className="px-8 py-3 bg-forensic-600 text-white rounded-xl font-semibold hover:bg-forensic-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Running Audit...' : 'Run Full Audit'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-2">Audit Data (JSON)</h3>
          <p className="text-xs text-slate-500 mb-4">
            Sample data includes intentional red flags: ghost vendor, ghost employee, payment splitting, vague descriptions
          </p>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            rows={25}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-xs text-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-forensic-500"
          />
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result && !result.error && (
            <>
              {/* Risk Score */}
              <div className={`rounded-xl p-6 border ${
                (result.overall_risk_score || 0) > 60 ? 'bg-red-950/50 border-red-800' :
                (result.overall_risk_score || 0) > 30 ? 'bg-yellow-950/50 border-yellow-800' :
                'bg-green-950/50 border-green-800'
              }`}>
                <p className="text-sm text-slate-400 mb-1">Overall Risk Score</p>
                <p className="text-5xl font-bold">
                  {result.overall_risk_score}/100
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {result.findings_summary?.critical || 0} critical,{' '}
                  {result.findings_summary?.high || 0} high,{' '}
                  {result.findings_summary?.medium || 0} medium findings
                </p>
              </div>

              {/* Findings */}
              {result.findings_summary?.findings?.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4">
                    Findings ({result.findings_summary.total})
                  </h3>
                  <div className="space-y-3">
                    {result.findings_summary.findings.map((f, i) => (
                      <div
                        key={i}
                        className={`rounded-lg p-4 border ${
                          f.severity === 'critical' ? 'bg-red-950/30 border-red-800' :
                          f.severity === 'high' ? 'bg-orange-950/30 border-orange-800' :
                          f.severity === 'medium' ? 'bg-yellow-950/30 border-yellow-800' :
                          'bg-slate-800 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                            f.severity === 'critical' ? 'bg-red-900 text-red-300' :
                            f.severity === 'high' ? 'bg-orange-900 text-orange-300' :
                            f.severity === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {f.severity}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{f.engine}</span>
                        </div>
                        <p className="font-medium text-white">{f.title}</p>
                        <p className="text-sm text-slate-400 mt-1">{f.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Report */}
              {result.report?.content && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4">AI Due Diligence Report</h3>
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap">
                    {result.report.content}
                  </div>
                </div>
              )}
            </>
          )}

          {result?.error && (
            <div className="bg-red-950/50 border border-red-800 rounded-xl p-6">
              <p className="text-red-400">{result.error}</p>
            </div>
          )}

          {!result && !loading && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <p className="text-slate-500 text-lg">
                Click "Run Full Audit" to start the analysis
              </p>
              <p className="text-slate-600 text-sm mt-2">
                All 5 forensic engines will run simultaneously
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
