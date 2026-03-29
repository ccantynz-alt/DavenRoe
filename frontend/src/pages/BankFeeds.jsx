import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Shield, Globe, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

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
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h2 className="text-3xl font-bold mb-2">Bank Feeds</h2>
        <p className="text-gray-500 mb-8">Connect your bank accounts for automatic transaction import</p>
      </motion.div>

      {/* Connected Accounts */}
      {connectedAccounts.length > 0 && (
        <motion.div
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.5}
        >
          <h3 className="font-semibold text-lg mb-4">Connected Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedAccounts.map((acc, idx) => (
              <motion.div
                key={acc.id}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={idx * 0.15}
              >
                <Card>
                  <CardContent className="p-5">
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
                      <Badge variant="success">Connected</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{acc.type} - {acc.currency}</span>
                      <span className="font-semibold">{acc.balance}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Connect New Account */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={1}
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-astra-600" />
              Connect a Bank Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Country</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(countryFlags).map(code => (
                    <Button
                      key={code}
                      variant={country === code ? 'default' : 'outline'}
                      className={cn(
                        'flex flex-col h-auto py-3',
                        country === code && 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                      )}
                      onClick={() => setCountry(code)}
                    >
                      <div className="font-bold">{code}</div>
                      <div className="text-xs mt-0.5 opacity-75">{providerMap[code]}</div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Provider Info */}
              <Card className="bg-gray-50 border-gray-100 shadow-none hover:shadow-none">
                <CardContent className="p-4">
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
                </CardContent>
              </Card>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Connection Status */}
            {connectionStep && connectionStep !== 'done' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                  <span className="text-sm text-indigo-700 font-medium">
                    {connectionStep === 'initiating' && 'Initiating secure connection...'}
                    {connectionStep === 'widget' && `Opening ${providerMap[country]} authentication...`}
                    {connectionStep === 'exchanging' && 'Exchanging tokens and fetching accounts...'}
                  </span>
                </div>
              </motion.div>
            )}

            {connectionStep === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">Bank account connected successfully. Transactions will sync automatically.</p>
              </motion.div>
            )}

            <Button
              onClick={startConnection}
              disabled={connecting}
              size="lg"
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                `Connect ${country} Bank via ${providerMap[country]}`
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Coverage */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={2}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-astra-600" />
              Global Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
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
            <div className="flex items-center gap-2 mt-4">
              <Shield className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                Total coverage: 21,000+ financial institutions across 35+ countries.
                Your credentials never touch our servers — authentication happens directly with your bank.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function ProviderCard({ name, countries, institutions, protocol, color }) {
  const colorMap = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    violet: 'bg-violet-50 border-violet-100 text-violet-700',
  };

  const titleColorMap = {
    indigo: 'text-indigo-700',
    emerald: 'text-emerald-700',
    violet: 'text-violet-700',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={cn('shadow-none hover:shadow-none', colorMap[color])}>
        <CardContent className="p-4">
          <h4 className={cn('font-semibold mb-2', titleColorMap[color])}>{name}</h4>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600"><span className="text-gray-400">Countries:</span> {countries}</p>
            <p className="text-gray-600"><span className="text-gray-400">Institutions:</span> {institutions}</p>
            <p className="text-gray-600"><span className="text-gray-400">Protocol:</span> {protocol}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
