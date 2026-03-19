import { useState } from 'react';
import { runBenfords } from '../services/api';

const SAMPLE_DATA = [
  '1247.50', '3892.10', '1150.00', '2489.33', '5673.22',
  '1823.45', '4512.67', '1098.90', '7234.11', '2156.78',
  '1345.00', '8901.23', '1567.89', '3456.78', '2345.67',
  '1234.56', '6789.01', '1456.78', '2678.90', '3890.12',
  '1567.34', '4321.56', '1789.01', '2901.23', '5432.10',
  '1678.90', '3210.45', '1890.12', '2012.34', '4567.89',
  '1345.67', '6543.21', '1012.34', '2234.56', '3456.78',
  '1123.45', '7890.12', '1234.56', '2345.67', '4567.89',
  '1456.78', '5678.90', '1567.89', '2678.01', '3789.12',
  '1234.56', '4890.23', '1345.67', '2456.78', '5567.89',
  '10000', '10000', '5000', '5000', '5000',
  '2000', '2000', '2000', '1000', '1000',
];

export default function BenfordsAnalysis() {
  const [amounts, setAmounts] = useState(SAMPLE_DATA.join('\n'));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const parsed = amounts
        .split('\n')
        .map((a) => a.trim())
        .filter((a) => a && !isNaN(parseFloat(a)));
      const res = await runBenfords(parsed);
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Benford's Law Analysis</h2>
      <p className="text-slate-400 mb-8">
        Detect data manipulation by analyzing digit distribution patterns
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Transaction Amounts</h3>
          <p className="text-sm text-slate-400 mb-4">
            Paste one amount per line. Minimum 50 for reliable results.
            The sample data includes some suspicious round numbers.
          </p>
          <textarea
            value={amounts}
            onChange={(e) => setAmounts(e.target.value)}
            rows={15}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-forensic-500"
            placeholder="1247.50&#10;3892.10&#10;..."
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-500">
              {amounts.split('\n').filter((a) => a.trim()).length} amounts loaded
            </span>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-2 bg-forensic-600 text-white rounded-lg font-medium hover:bg-forensic-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Analyzing...' : 'Run Benford\'s Analysis'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result?.first_digit && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">First Digit Distribution</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  result.first_digit.conformity_level === 'close' || result.first_digit.conformity_level === 'acceptable'
                    ? 'bg-green-900/50 text-green-400'
                    : result.first_digit.conformity_level === 'marginal'
                    ? 'bg-yellow-900/50 text-yellow-400'
                    : 'bg-red-900/50 text-red-400'
                }`}>
                  {result.first_digit.conformity_level?.toUpperCase()}
                </span>
              </div>

              {/* Bar chart */}
              <div className="space-y-2 mb-4">
                {result.first_digit.digit_analysis?.map((d) => (
                  <div key={d.digit} className="flex items-center gap-3 text-sm">
                    <span className="w-4 text-slate-400 font-mono">{d.digit}</span>
                    <div className="flex-1 flex gap-1 items-center">
                      <div
                        className="h-4 bg-forensic-600 rounded-sm"
                        style={{ width: `${d.observed_pct * 2.5}%` }}
                        title={`Observed: ${d.observed_pct}%`}
                      />
                      <div
                        className="h-4 bg-slate-700 rounded-sm border border-slate-600"
                        style={{ width: `${d.expected_pct * 2.5}%` }}
                        title={`Expected: ${d.expected_pct}%`}
                      />
                    </div>
                    <span className="w-16 text-right text-xs">
                      {d.observed_pct}%
                    </span>
                    {d.suspicious && (
                      <span className="text-red-400 text-xs font-bold">!</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p>Chi-squared: {result.first_digit.chi_squared} (critical: {result.first_digit.chi_squared_critical})</p>
                <p>MAD: {result.first_digit.mean_absolute_deviation}</p>
              </div>

              {result.first_digit.summary && (
                <p className="mt-4 text-sm text-slate-300 bg-slate-800 rounded-lg p-3">
                  {result.first_digit.summary}
                </p>
              )}
            </div>
          )}

          {result?.duplicates && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Duplicate Amount Analysis</h3>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-2xl font-bold text-white">{result.duplicates.total_transactions}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{result.duplicates.unique_amounts}</p>
                  <p className="text-xs text-slate-500">Unique</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-forensic-400">{result.duplicates.uniqueness_ratio}%</p>
                  <p className="text-xs text-slate-500">Uniqueness</p>
                </div>
              </div>
              {result.duplicates.suspicious_duplicates?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-red-400 font-medium">Suspicious Duplicates:</p>
                  {result.duplicates.suspicious_duplicates.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm bg-slate-800 rounded-lg px-3 py-2">
                      <span className="text-white font-mono">${d.amount}</span>
                      <span className="text-red-400">{d.count}x ({d.pct_of_total}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result && !result.first_digit && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
