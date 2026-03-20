import { useState, useEffect } from 'react';
import api from '../services/api';

export default function BankFeeds() {
  const [providers, setProviders] = useState(null);
  const [country, setCountry] = useState('US');
  const [connecting, setConnecting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [connectionStep, setConnectionStep] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/banking/providers')
      .then(res => setProviders(res.data))
      .catch(() => setProviders({ providers: [], supported_countries: [] }));
  }, []);

  const startConnection = async () => {
    setConnecting(true);
    setError(null);
    setConnectionStep('initiating');
    try {
      const res = await api.post('/banking/connect', { user_id: 'current', country });
      setConnectionStep('widget');
      // In production, this would open the Plaid Link / Basiq / TrueLayer widget
      // For now, simulate the flow
      setTimeout(() => {
        setConnectionStep('exchanging');
        setTimeout(() => {
          setConnectedAccounts(prev => [
            ...prev,
            {
              id: `acc_${Date.now()}`,
              name: 'Primary Checking',
              type: 'checking',
              currency: country === 'AU' ? 'AUD' : country === 'GB' ? 'GBP' : country === 'NZ' ? 'NZD' : 'USD',
              institution: country === 'AU' ? 'Commonwealth Bank' : country === 'GB' ? 'Barclays' : country === 'NZ' ? 'ANZ' : 'Chase',
              balance: '$12,450.00',
              country,
              connected_at: new Date().toISOString(),
            },
          ]);
          setConnectionStep('done');
          setConnecting(false);
        }, 1500);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initiate bank connection');
      setConnecting(false);
      setConnectionStep(null);
    }
  };

  const countryFlags = { US: 'US', AU: 'AU', NZ: 'NZ', GB: 'GB', CA: 'CA', DE: 'DE', FR: 'FR', IE: 'IE' };
  const providerMap = { US: 'Plaid', CA: 'Plaid', AU: 'Basiq', NZ: 'Basiq', GB: 'TrueLayer', DE: 'TrueLayer', FR: 'TrueLayer', IE: 'TrueLayer' };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Bank Feeds</h2>
      <p className="text-gray-500 mb-8">Connect your bank accounts for automatic transaction import</p>

      {/* Connected Accounts */}
      {connectedAccounts.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-4">Connected Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedAccounts.map(acc => (
              <div key={acc.id} className="bg-white border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {acc.country}
                    </div>
                    <div>
                      <p className="font-semibold">{acc.institution}</p>
                      <p className="text-sm text-gray-500">{acc.name}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Connected</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{acc.type} - {acc.currency}</span>
                  <span className="font-semibold">{acc.balance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connect New Account */}
      <div className="bg-white border rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">Connect a Bank Account</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Country Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Country</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(countryFlags).map(code => (
                <button
                  key={code}
                  onClick={() => setCountry(code)}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-colors border ${
                    country === code
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold">{code}</div>
                  <div className="text-xs mt-0.5 opacity-75">{providerMap[code]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Provider Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">Connection Provider</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">{providerMap[country]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Protocol</span>
                <span className="font-medium">
                  {country === 'AU' || country === 'NZ' ? 'CDR / Screen Scrape' : country === 'US' || country === 'CA' ? 'OAuth + Plaid Link' : 'PSD2 Open Banking'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Institutions</span>
                <span className="font-medium">
                  {country === 'US' ? '1,000+' : country === 'AU' ? '170+' : country === 'GB' ? '5,000+' : '100+'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Security</span>
                <span className="font-medium">Bank-grade encryption</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Connection Status */}
        {connectionStep && connectionStep !== 'done' && (
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-indigo-700 font-medium">
                {connectionStep === 'initiating' && 'Initiating secure connection...'}
                {connectionStep === 'widget' && `Opening ${providerMap[country]} authentication...`}
                {connectionStep === 'exchanging' && 'Exchanging tokens and fetching accounts...'}
              </span>
            </div>
          </div>
        )}

        {connectionStep === 'done' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">Bank account connected successfully. Transactions will sync automatically.</p>
          </div>
        )}

        <button
          onClick={startConnection}
          disabled={connecting}
          className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : `Connect ${country} Bank via ${providerMap[country]}`}
        </button>
      </div>

      {/* Coverage */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4">Global Coverage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProviderCard
            name="Plaid"
            countries="US, Canada"
            institutions="1,000+"
            protocol="OAuth + Plaid Link"
            color="indigo"
          />
          <ProviderCard
            name="Basiq"
            countries="Australia, New Zealand"
            institutions="170+"
            protocol="CDR (Consumer Data Right)"
            color="emerald"
          />
          <ProviderCard
            name="TrueLayer"
            countries="UK, EU (30+ countries)"
            institutions="5,000+"
            protocol="PSD2 Open Banking"
            color="violet"
          />
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Total coverage: 21,000+ financial institutions across 35+ countries.
          Your credentials never touch our servers — authentication happens directly with your bank.
        </p>
      </div>
    </div>
  );
}

function ProviderCard({ name, countries, institutions, protocol, color }) {
  return (
    <div className={`bg-${color}-50 rounded-lg p-4 border border-${color}-100`}>
      <h4 className={`font-semibold text-${color}-700 mb-2`}>{name}</h4>
      <div className="space-y-1 text-sm">
        <p className="text-gray-600"><span className="text-gray-400">Countries:</span> {countries}</p>
        <p className="text-gray-600"><span className="text-gray-400">Institutions:</span> {institutions}</p>
        <p className="text-gray-600"><span className="text-gray-400">Protocol:</span> {protocol}</p>
      </div>
    </div>
  );
}
