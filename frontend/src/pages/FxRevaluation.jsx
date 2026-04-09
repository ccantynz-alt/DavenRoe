import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function FxRevaluation() {
  const toast = useToast();
  const [balances, setBalances] = useState(null);
  const [rates, setRates] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedReval, setSelectedReval] = useState(null);
  const [tab, setTab] = useState('balances');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [balRes, rateRes, histRes] = await Promise.all([
      api.get('/fx-revaluation/balances').catch(() => ({ data: null })),
      api.get('/fx-revaluation/rates').catch(() => ({ data: null })),
      api.get('/fx-revaluation/history').catch(() => ({ data: { revaluations: [] } })),
    ]);
    setBalances(balRes.data);
    setRates(rateRes.data);
    setHistory(histRes.data.revaluations || []);
    setLoading(false);
  }

  async function runRevaluation() {
    setRunning(true);
    try {
      const res = await api.post('/fx-revaluation/run');
      setSelectedReval(res.data);
      toast.success(`Revaluation complete — net impact $${res.data.net_impact.toFixed(2)}`);
      loadData();
    } catch { toast.error('Revaluation failed'); }
    setRunning(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">FX Revaluation</h2>
          <p className="text-gray-400 mt-1">Automatic multi-currency revaluation with unrealised gain/loss tracking</p>
        </div>
        <button onClick={runRevaluation} disabled={running}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors disabled:opacity-50">
          {running ? 'Running...' : 'Run Revaluation'}
        </button>
      </div>

      {balances && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Unrealised Gain" value={`$${balances.total_unrealised_gain.toLocaleString()}`} color="emerald" />
          <StatCard label="Unrealised Loss" value={`$${Math.abs(balances.total_unrealised_loss).toLocaleString()}`} color="red" />
          <StatCard label="Net Impact" value={`$${balances.net_unrealised.toLocaleString()}`} color={balances.net_unrealised >= 0 ? 'emerald' : 'red'} />
        </div>
      )}

      <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1 w-fit">
        {[{ id: 'balances', label: 'Balances' }, { id: 'rates', label: 'FX Rates' }, { id: 'history', label: 'History' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'balances' && balances && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_60px_110px_110px_110px_110px] gap-3 px-5 py-3 text-xs font-medium text-gray-500 border-b border-gray-700 uppercase tracking-wider">
            <span>Account</span><span>CCY</span><span>Foreign Bal</span><span>Original AUD</span><span>Current AUD</span><span>Gain/Loss</span>
          </div>
          {balances.balances.map(b => (
            <div key={b.id} className="grid grid-cols-[1fr_60px_110px_110px_110px_110px] gap-3 px-5 py-3 text-sm border-b border-gray-800/50 hover:bg-gray-800/30">
              <span className="text-white truncate">{b.account}</span>
              <span className="text-gray-400">{b.currency}</span>
              <span className="text-gray-300">{b.foreign_balance.toLocaleString()}</span>
              <span className="text-gray-400">${b.original_aud.toLocaleString()}</span>
              <span className="text-white">${b.current_aud.toLocaleString()}</span>
              <span className={`font-medium ${b.unrealised_gain_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {b.unrealised_gain_loss >= 0 ? '+' : ''}${b.unrealised_gain_loss.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'rates' && rates && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(rates.rates).map(([pair, data]) => (
            <div key={pair} className="bg-gray-800/40 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{pair}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${data.change_pct >= 0 ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'}`}>
                  {data.change_pct >= 0 ? '+' : ''}{data.change_pct}%
                </span>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{data.rate.toFixed(4)}</p>
              <p className="text-xs text-gray-500 mt-1">24h: {data.change_24h >= 0 ? '+' : ''}{data.change_24h.toFixed(4)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-16 text-gray-500"><div className="text-4xl mb-3">&#x1F4B1;</div><p className="font-medium">No revaluations yet</p></div>
          ) : history.map(r => (
            <div key={r.id} className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 cursor-pointer hover:bg-gray-800/60 transition-colors" onClick={() => setSelectedReval(r)}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white">{r.period}</span>
                  <span className="text-xs text-gray-500 ml-3">{r.accounts_revalued} accounts &middot; Journal {r.journal_id}</span>
                </div>
                <span className={`text-sm font-medium ${r.net_impact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {r.net_impact >= 0 ? '+' : ''}${r.net_impact.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReval && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">{selectedReval.period} — Revaluation Detail</h3>
            <button onClick={() => setSelectedReval(null)} className="text-gray-400 hover:text-white text-sm">&times;</button>
          </div>
          {selectedReval.details?.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-2 px-3 bg-gray-900/30 rounded-lg">
              <span className="text-gray-300">{d.account} ({d.currency})</span>
              <span className={`font-medium ${d.gain_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {d.gain_loss >= 0 ? '+' : ''}${d.gain_loss.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = { emerald: 'border-emerald-800/50 bg-emerald-950/20 text-emerald-400', red: 'border-red-800/50 bg-red-950/20 text-red-400' };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
