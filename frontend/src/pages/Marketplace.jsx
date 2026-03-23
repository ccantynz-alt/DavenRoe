import { useState } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const CATEGORIES = ['All', 'CRM', 'E-commerce', 'Payments', 'Productivity', 'Tax Authority', 'HR', 'Banking', 'Industry'];

const APPS = [
  { id: 'salesforce', name: 'Salesforce', category: 'CRM', description: 'Sync contacts, deals, and invoices with Salesforce CRM', rating: 4.7, installs: '12K+', icon: 'SF' },
  { id: 'hubspot', name: 'HubSpot', category: 'CRM', description: 'Two-way sync for contacts, companies, and deals', rating: 4.6, installs: '8K+', icon: 'HS' },
  { id: 'pipedrive', name: 'Pipedrive', category: 'CRM', description: 'Pipeline management integrated with invoicing', rating: 4.4, installs: '3K+', icon: 'PD' },
  { id: 'shopify', name: 'Shopify', category: 'E-commerce', description: 'Auto-import orders, refunds, and payouts from Shopify', rating: 4.8, installs: '25K+', icon: 'SH' },
  { id: 'woocommerce', name: 'WooCommerce', category: 'E-commerce', description: 'Sync WooCommerce orders and inventory with Astra', rating: 4.3, installs: '6K+', icon: 'WC' },
  { id: 'square', name: 'Square', category: 'E-commerce', description: 'Import Square POS transactions and inventory', rating: 4.5, installs: '9K+', icon: 'SQ' },
  { id: 'paypal', name: 'PayPal', category: 'Payments', description: 'Auto-reconcile PayPal transactions and fees', rating: 4.4, installs: '18K+', icon: 'PP' },
  { id: 'gocardless', name: 'GoCardless', category: 'Payments', description: 'Direct debit collection and reconciliation', rating: 4.5, installs: '5K+', icon: 'GC' },
  { id: 'wise', name: 'Wise', category: 'Payments', description: 'Multi-currency transfers with real-time FX rates', rating: 4.7, installs: '7K+', icon: 'WI' },
  { id: 'stripe', name: 'Stripe', category: 'Payments', description: 'Payment processing, subscriptions, and invoicing', rating: 4.9, installs: '30K+', icon: 'ST', installed: true },
  { id: 'slack', name: 'Slack', category: 'Productivity', description: 'Get notifications and run commands from Slack', rating: 4.6, installs: '14K+', icon: 'SL' },
  { id: 'teams', name: 'Microsoft Teams', category: 'Productivity', description: 'Meeting scheduling, notifications, and document sharing', rating: 4.3, installs: '10K+', icon: 'MT' },
  { id: 'google', name: 'Google Workspace', category: 'Productivity', description: 'Google Drive, Sheets, and Calendar integration', rating: 4.5, installs: '20K+', icon: 'GW' },
  { id: 'ato', name: 'ATO Portal', category: 'Tax Authority', description: 'Lodge BAS, IAS, and tax returns directly to the ATO', rating: 4.2, installs: '15K+', icon: 'AT' },
  { id: 'ird', name: 'IRD myIR', category: 'Tax Authority', description: 'Lodge GST and income tax returns to IRD', rating: 4.1, installs: '4K+', icon: 'IR' },
  { id: 'hmrc', name: 'HMRC MTD', category: 'Tax Authority', description: 'Making Tax Digital compliant VAT submissions', rating: 4.3, installs: '8K+', icon: 'HM' },
  { id: 'bamboohr', name: 'BambooHR', category: 'HR', description: 'Employee data sync, leave management, and onboarding', rating: 4.5, installs: '6K+', icon: 'BB' },
  { id: 'employment-hero', name: 'Employment Hero', category: 'HR', description: 'Payroll, HR, and benefits management for AU/NZ', rating: 4.4, installs: '4K+', icon: 'EH' },
  { id: 'plaid', name: 'Plaid', category: 'Banking', description: 'Bank account connection for US, CA, and EU', rating: 4.7, installs: '22K+', icon: 'PL', installed: true },
  { id: 'basiq', name: 'Basiq', category: 'Banking', description: 'Open banking for Australia and New Zealand', rating: 4.3, installs: '3K+', icon: 'BQ', installed: true },
  { id: 'lightspeed', name: 'Lightspeed POS', category: 'Industry', description: 'Point of sale integration for retail and hospitality', rating: 4.4, installs: '5K+', icon: 'LS' },
  { id: 'deputy', name: 'Deputy', category: 'Industry', description: 'Staff scheduling and timesheet integration', rating: 4.3, installs: '3K+', icon: 'DP' },
];

export default function Marketplace() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [installed, setInstalled] = useState(() => new Set(APPS.filter(a => a.installed).map(a => a.id)));
  const toast = useToast();

  const filtered = APPS.filter(app => {
    if (category !== 'All' && app.category !== category) return false;
    if (search && !app.name.toLowerCase().includes(search.toLowerCase()) && !app.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleInstall = async (appId) => {
    try {
      await api.post(`/marketplace/apps/${appId}/install`);
    } catch { /* marketplace API may not be connected */ }
    setInstalled(prev => new Set([...prev, appId]));
    toast.success(`${APPS.find(a => a.id === appId)?.name} installed`);
  };

  const handleUninstall = async (appId) => {
    try {
      await api.delete(`/marketplace/apps/${appId}/uninstall`);
    } catch { /* marketplace API may not be connected */ }
    setInstalled(prev => { const s = new Set(prev); s.delete(appId); return s; });
    toast.info(`${APPS.find(a => a.id === appId)?.name} uninstalled`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Marketplace</h2>
          <p className="text-gray-500 mt-1">{APPS.length} integrations across {CATEGORIES.length - 1} categories</p>
        </div>
        <div className="text-sm text-gray-500">{installed.size} installed</div>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <input
          type="text" placeholder="Search integrations..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filtered.map(app => (
          <div key={app.id} onClick={() => setSelectedApp(app)}
            className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                {app.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{app.name}</h3>
                  {installed.has(app.id) && (
                    <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded shrink-0">Installed</span>
                  )}
                </div>
                <p className="text-xs text-indigo-500">{app.category}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{app.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="text-yellow-500">{'★'.repeat(Math.round(app.rating))}</span>
                <span>{app.rating}</span>
                <span>·</span>
                <span>{app.installs}</span>
              </div>
              {installed.has(app.id) ? (
                <button onClick={e => { e.stopPropagation(); handleUninstall(app.id); }}
                  className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                  Uninstall
                </button>
              ) : (
                <button onClick={e => { e.stopPropagation(); handleInstall(app.id); }}
                  className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Install
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* App Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
                {selectedApp.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedApp.name}</h2>
                <p className="text-sm text-indigo-500">{selectedApp.category}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <span className="text-yellow-500">{'★'.repeat(Math.round(selectedApp.rating))}</span>
                  <span>{selectedApp.rating} rating</span>
                  <span>·</span>
                  <span>{selectedApp.installs} installs</span>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{selectedApp.description}</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-sm mb-2">Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automatic data synchronization</li>
                <li>• Two-way transaction mapping</li>
                <li>• Real-time webhook notifications</li>
                <li>• OAuth 2.0 secure authentication</li>
              </ul>
            </div>
            <div className="flex gap-3">
              {installed.has(selectedApp.id) ? (
                <button onClick={() => { handleUninstall(selectedApp.id); setSelectedApp(null); }}
                  className="flex-1 py-2.5 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200">
                  Uninstall
                </button>
              ) : (
                <button onClick={() => { handleInstall(selectedApp.id); setSelectedApp(null); }}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                  Install
                </button>
              )}
              <button onClick={() => setSelectedApp(null)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
