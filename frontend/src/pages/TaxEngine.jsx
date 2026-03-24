import { useState } from 'react';
import { calculateGST, calculateWHT, getTreaties } from '../services/api';

export default function TaxEngine() {
  const [activeTab, setActiveTab] = useState('gst');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // GST form
  const [gstJurisdiction, setGstJurisdiction] = useState('AU');
  const [gstAmount, setGstAmount] = useState('1000');

  // WHT form
  const [whtPayer, setWhtPayer] = useState('US');
  const [whtPayee, setWhtPayee] = useState('NZ');
  const [whtAmount, setWhtAmount] = useState('10000');
  const [whtType, setWhtType] = useState('services');

  const handleGST = async () => {
    setLoading(true);
    try {
      const res = await calculateGST({ jurisdiction: gstJurisdiction, net_amount: parseFloat(gstAmount) });
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const handleWHT = async () => {
    setLoading(true);
    try {
      const res = await calculateWHT({
        payer_country: whtPayer,
        payee_country: whtPayee,
        gross_amount: parseFloat(whtAmount),
        income_type: whtType,
      });
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const handleTreaties = async () => {
    setLoading(true);
    try {
      const res = await getTreaties();
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Tax Engine</h2>
      <p className="text-gray-500 mb-6">Deterministic tax calculations based on published legislation</p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-8 text-xs text-amber-700">
        Tax calculations are based on published rates and rules as of the date shown. Tax law is subject to change, interpretation, and jurisdiction-specific exceptions. These calculations are for informational purposes only and do not constitute tax advice. Always verify with a qualified tax professional before filing.
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {[
          { id: 'gst', label: 'GST / VAT' },
          { id: 'wht', label: 'Cross-Border WHT' },
          { id: 'treaties', label: 'Tax Treaties' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResult(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-astra-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="bg-white rounded-xl border p-6">
          {activeTab === 'gst' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Calculate GST / VAT</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                <select value={gstJurisdiction} onChange={(e) => setGstJurisdiction(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2">
                  <option value="AU">Australia (10% GST)</option>
                  <option value="NZ">New Zealand (15% GST)</option>
                  <option value="GB">United Kingdom (20% VAT)</option>
                  <option value="US">United States (No federal GST)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Net Amount</label>
                <input type="number" value={gstAmount} onChange={(e) => setGstAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <button onClick={handleGST} disabled={loading}
                className="w-full bg-astra-600 text-white rounded-lg py-2 font-medium hover:bg-astra-700 disabled:opacity-50">
                {loading ? 'Calculating...' : 'Calculate'}
              </button>
            </div>
          )}

          {activeTab === 'wht' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Cross-Border Withholding Tax</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payer Country</label>
                  <select value={whtPayer} onChange={(e) => setWhtPayer(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2">
                    <option value="US">United States</option>
                    <option value="AU">Australia</option>
                    <option value="NZ">New Zealand</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payee Country</label>
                  <select value={whtPayee} onChange={(e) => setWhtPayee(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2">
                    <option value="NZ">New Zealand</option>
                    <option value="AU">Australia</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gross Amount</label>
                <input type="number" value={whtAmount} onChange={(e) => setWhtAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Income Type</label>
                <select value={whtType} onChange={(e) => setWhtType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2">
                  <option value="services">Services</option>
                  <option value="dividends">Dividends</option>
                  <option value="interest">Interest</option>
                  <option value="royalties">Royalties</option>
                </select>
              </div>
              <button onClick={handleWHT} disabled={loading}
                className="w-full bg-astra-600 text-white rounded-lg py-2 font-medium hover:bg-astra-700 disabled:opacity-50">
                {loading ? 'Calculating...' : 'Calculate WHT'}
              </button>
            </div>
          )}

          {activeTab === 'treaties' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Double Tax Agreements</h3>
              <p className="text-sm text-gray-500">
                View all 6 bilateral DTAs loaded in the engine (US, AU, NZ, GB).
              </p>
              <button onClick={handleTreaties} disabled={loading}
                className="w-full bg-astra-600 text-white rounded-lg py-2 font-medium hover:bg-astra-700 disabled:opacity-50">
                {loading ? 'Loading...' : 'Load Treaties'}
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-lg mb-4">Result</h3>
          {result ? (
            <pre className="text-sm bg-gray-50 rounded-lg p-4 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-400 text-sm">Run a calculation to see results</p>
          )}
        </div>
      </div>
    </div>
  );
}
