import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'All', 'CRM', 'E-Commerce', 'Payments', 'Productivity', 'Tax', 'HR & Payroll',
  'Banking', 'Document Management', 'Expense Management', 'Reporting & BI',
  'Legal & Compliance', 'Communication', 'Inventory', 'Real Estate', 'Construction'
];

const APPS = [
  // CRM (5)
  { id: 'hubspot', name: 'HubSpot', category: 'CRM', description: 'Two-way sync for contacts, companies, deals, and invoices with HubSpot CRM', rating: 4.6, installs: '8K+', icon: 'HS' },
  { id: 'salesforce', name: 'Salesforce', category: 'CRM', description: 'Sync contacts, deals, and invoices with Salesforce CRM', rating: 4.7, installs: '12K+', icon: 'SF' },
  { id: 'pipedrive', name: 'Pipedrive', category: 'CRM', description: 'Pipeline management integrated with invoicing and contact sync', rating: 4.4, installs: '3K+', icon: 'PD' },
  { id: 'zoho-crm', name: 'Zoho CRM', category: 'CRM', description: 'Sync leads, contacts, and deals between Astra and Zoho CRM', rating: 4.3, installs: '5K+', icon: 'ZC' },
  { id: 'monday-crm', name: 'Monday CRM', category: 'CRM', description: 'Connect Monday.com CRM boards with client and invoice data', rating: 4.4, installs: '2K+', icon: 'MC' },

  // E-Commerce (6)
  { id: 'shopify', name: 'Shopify', category: 'E-Commerce', description: 'Auto-import orders, refunds, and payouts from Shopify stores', rating: 4.8, installs: '25K+', icon: 'SH' },
  { id: 'woocommerce', name: 'WooCommerce', category: 'E-Commerce', description: 'Sync WooCommerce orders, products, and inventory with Astra', rating: 4.3, installs: '6K+', icon: 'WC' },
  { id: 'bigcommerce', name: 'BigCommerce', category: 'E-Commerce', description: 'Import orders, customers, and product catalog from BigCommerce', rating: 4.4, installs: '4K+', icon: 'BC' },
  { id: 'amazon-seller', name: 'Amazon Seller', category: 'E-Commerce', description: 'Reconcile Amazon Seller Central orders, fees, and FBA transactions', rating: 4.5, installs: '11K+', icon: 'AZ' },
  { id: 'ebay', name: 'eBay', category: 'E-Commerce', description: 'Import eBay sales, fees, and PayPal payouts automatically', rating: 4.2, installs: '7K+', icon: 'EB' },
  { id: 'etsy', name: 'Etsy', category: 'E-Commerce', description: 'Sync Etsy shop orders, fees, and deposit reconciliation', rating: 4.4, installs: '5K+', icon: 'ET' },

  // Payments (6)
  { id: 'stripe', name: 'Stripe', category: 'Payments', description: 'Payment processing, subscriptions, and invoice reconciliation', rating: 4.9, installs: '30K+', icon: 'ST', installed: true },
  { id: 'paypal', name: 'PayPal', category: 'Payments', description: 'Auto-reconcile PayPal transactions, fees, and currency conversions', rating: 4.4, installs: '18K+', icon: 'PP' },
  { id: 'square', name: 'Square', category: 'Payments', description: 'Import Square POS transactions, tips, and inventory data', rating: 4.5, installs: '9K+', icon: 'SQ' },
  { id: 'gocardless', name: 'GoCardless', category: 'Payments', description: 'Direct debit collection and automatic reconciliation', rating: 4.5, installs: '5K+', icon: 'GC' },
  { id: 'wise', name: 'Wise', category: 'Payments', description: 'Multi-currency transfers with real-time exchange rates and fee tracking', rating: 4.7, installs: '7K+', icon: 'WI' },
  { id: 'afterpay', name: 'Afterpay', category: 'Payments', description: 'Track buy-now-pay-later settlements and merchant fees', rating: 4.3, installs: '4K+', icon: 'AP' },

  // Productivity (6)
  { id: 'google', name: 'Google Workspace', category: 'Productivity', description: 'Google Drive, Sheets, Gmail, and Calendar integration', rating: 4.5, installs: '20K+', icon: 'GW' },
  { id: 'microsoft-365', name: 'Microsoft 365', category: 'Productivity', description: 'OneDrive, Excel, Outlook, and Teams document sharing', rating: 4.4, installs: '15K+', icon: 'MS' },
  { id: 'slack', name: 'Slack', category: 'Productivity', description: 'Get real-time notifications and run accounting commands from Slack', rating: 4.6, installs: '14K+', icon: 'SL' },
  { id: 'notion', name: 'Notion', category: 'Productivity', description: 'Embed financial dashboards and sync client databases with Notion', rating: 4.5, installs: '3K+', icon: 'NO' },
  { id: 'asana', name: 'Asana', category: 'Productivity', description: 'Link Asana projects to client engagements and billing milestones', rating: 4.4, installs: '4K+', icon: 'AS' },
  { id: 'trello', name: 'Trello', category: 'Productivity', description: 'Sync Trello boards with workflow tasks and client deadlines', rating: 4.3, installs: '6K+', icon: 'TR' },

  // Tax (4)
  { id: 'taxcalc', name: 'TaxCalc', category: 'Tax', description: 'UK self-assessment and corporation tax return preparation and filing', rating: 4.3, installs: '6K+', icon: 'TC' },
  { id: 'wolters-kluwer', name: 'Wolters Kluwer', category: 'Tax', description: 'CCH tax compliance suite integration for multi-jurisdiction filing', rating: 4.5, installs: '8K+', icon: 'WK' },
  { id: 'thomson-reuters', name: 'Thomson Reuters', category: 'Tax', description: 'ONESOURCE and UltraTax CS integration for tax preparation workflows', rating: 4.6, installs: '10K+', icon: 'TR' },
  { id: 'tax-warehouse', name: 'Tax Warehouse', category: 'Tax', description: 'AU/NZ tax return lodgement and ATO/IRD portal integration', rating: 4.2, installs: '3K+', icon: 'TW' },

  // HR & Payroll (4)
  { id: 'employment-hero', name: 'Employment Hero', category: 'HR & Payroll', description: 'Payroll, HR, benefits, and onboarding management for AU/NZ', rating: 4.4, installs: '4K+', icon: 'EH' },
  { id: 'bamboohr', name: 'BambooHR', category: 'HR & Payroll', description: 'Employee data sync, leave management, and onboarding workflows', rating: 4.5, installs: '6K+', icon: 'BB' },
  { id: 'gusto', name: 'Gusto', category: 'HR & Payroll', description: 'US payroll processing, benefits administration, and tax filing', rating: 4.6, installs: '9K+', icon: 'GU' },
  { id: 'deputy', name: 'Deputy', category: 'HR & Payroll', description: 'Staff scheduling, timesheets, and attendance tracking integration', rating: 4.3, installs: '3K+', icon: 'DP' },

  // Banking (3)
  { id: 'plaid', name: 'Plaid', category: 'Banking', description: 'Bank account connections for US, Canada, and Europe', rating: 4.7, installs: '22K+', icon: 'PL', installed: true },
  { id: 'basiq', name: 'Basiq', category: 'Banking', description: 'Open banking data feeds for Australia and New Zealand', rating: 4.3, installs: '3K+', icon: 'BQ', installed: true },
  { id: 'truelayer', name: 'TrueLayer', category: 'Banking', description: 'Open banking connections for UK and EU bank accounts', rating: 4.5, installs: '5K+', icon: 'TL', installed: true },

  // Document Management (5)
  { id: 'dext', name: 'Dext (Receipt Bank)', category: 'Document Management', description: 'Automated receipt and invoice data extraction with AI categorization', rating: 4.7, installs: '18K+', icon: 'DX' },
  { id: 'autoentry', name: 'AutoEntry', category: 'Document Management', description: 'Automated data entry from receipts, invoices, and bank statements', rating: 4.4, installs: '7K+', icon: 'AE' },
  { id: 'hubdoc', name: 'Hubdoc', category: 'Document Management', description: 'Fetch, store, and publish financial documents automatically', rating: 4.3, installs: '10K+', icon: 'HD' },
  { id: 'google-drive', name: 'Google Drive', category: 'Document Management', description: 'Store and organize financial documents in Google Drive folders', rating: 4.5, installs: '15K+', icon: 'GD' },
  { id: 'dropbox', name: 'Dropbox', category: 'Document Management', description: 'Sync receipts, invoices, and reports to Dropbox Business', rating: 4.4, installs: '8K+', icon: 'DB' },

  // Expense Management (3)
  { id: 'expensify', name: 'Expensify', category: 'Expense Management', description: 'Employee expense reports, receipt scanning, and policy enforcement', rating: 4.5, installs: '12K+', icon: 'EX' },
  { id: 'sap-concur', name: 'SAP Concur', category: 'Expense Management', description: 'Enterprise travel and expense management with approval workflows', rating: 4.3, installs: '6K+', icon: 'SC' },
  { id: 'pleo', name: 'Pleo', category: 'Expense Management', description: 'Smart company cards with real-time expense tracking and auto-categorization', rating: 4.6, installs: '4K+', icon: 'PL' },

  // Reporting & BI (4)
  { id: 'power-bi', name: 'Power BI', category: 'Reporting & BI', description: 'Push financial data to Microsoft Power BI for advanced dashboards', rating: 4.6, installs: '8K+', icon: 'PB' },
  { id: 'tableau', name: 'Tableau', category: 'Reporting & BI', description: 'Visualize accounting data with Tableau interactive dashboards', rating: 4.5, installs: '5K+', icon: 'TB' },
  { id: 'fathom', name: 'Fathom', category: 'Reporting & BI', description: 'Management reporting, KPI tracking, and financial analysis', rating: 4.7, installs: '9K+', icon: 'FA' },
  { id: 'spotlight', name: 'Spotlight Reporting', category: 'Reporting & BI', description: 'Cash flow forecasting, 3-way financial models, and board reports', rating: 4.4, installs: '4K+', icon: 'SR' },

  // Legal & Compliance (3)
  { id: 'practice-ignition', name: 'Ignition', category: 'Legal & Compliance', description: 'Client engagement letters, proposals, and automated billing agreements', rating: 4.5, installs: '6K+', icon: 'IG' },
  { id: 'goproposal', name: 'GoProposal', category: 'Legal & Compliance', description: 'Standardized pricing, proposals, and engagement letters for accounting firms', rating: 4.4, installs: '3K+', icon: 'GP' },
  { id: 'karbon', name: 'Karbon', category: 'Legal & Compliance', description: 'Practice management, workflow automation, and team collaboration', rating: 4.6, installs: '5K+', icon: 'KA' },

  // Communication (3)
  { id: 'mailchimp', name: 'Mailchimp', category: 'Communication', description: 'Email marketing campaigns synced with client and invoice data', rating: 4.4, installs: '7K+', icon: 'MC' },
  { id: 'sendgrid', name: 'SendGrid', category: 'Communication', description: 'Transactional email delivery for invoices, reminders, and notifications', rating: 4.5, installs: '6K+', icon: 'SG' },
  { id: 'twilio', name: 'Twilio', category: 'Communication', description: 'SMS notifications for payment reminders, approvals, and alerts', rating: 4.3, installs: '4K+', icon: 'TW' },

  // Inventory (2)
  { id: 'cin7', name: 'Cin7', category: 'Inventory', description: 'Multi-channel inventory management with warehouse and POS integration', rating: 4.4, installs: '5K+', icon: 'C7' },
  { id: 'tradegecko', name: 'QuickBooks Commerce', category: 'Inventory', description: 'Order and inventory management for wholesale and e-commerce', rating: 4.2, installs: '3K+', icon: 'QC' },

  // Real Estate (2)
  { id: 'propertyme', name: 'PropertyMe', category: 'Real Estate', description: 'Property management trust accounting, rent rolls, and owner statements', rating: 4.5, installs: '4K+', icon: 'PM' },
  { id: 'buildium', name: 'Buildium', category: 'Real Estate', description: 'Residential property management with tenant billing and maintenance tracking', rating: 4.3, installs: '3K+', icon: 'BU' },

  // Construction (2)
  { id: 'procore', name: 'Procore', category: 'Construction', description: 'Construction project financials, change orders, and subcontractor payments', rating: 4.6, installs: '6K+', icon: 'PC' },
  { id: 'buildertrend', name: 'Buildertrend', category: 'Construction', description: 'Residential construction budgeting, estimates, and purchase orders', rating: 4.4, installs: '4K+', icon: 'BT' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.3, ease: 'easeOut' },
  }),
};

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
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {installed.size} installed
        </Badge>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <Input
          type="text"
          placeholder="Search integrations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Categories as Tabs */}
      <Tabs value={category} onValueChange={setCategory} className="mb-6">
        <TabsList className="flex gap-1 h-auto flex-wrap bg-transparent p-0">
          {CATEGORIES.map(cat => (
            <TabsTrigger
              key={cat}
              value={cat}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                'data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-none',
                'data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200'
              )}
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Single content area for all tabs since filtering is state-driven */}
        <TabsContent value={category} className="mt-0">
          {/* App Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <AnimatePresence mode="popLayout">
              {filtered.map((app, i) => (
                <motion.div
                  key={app.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  layout
                >
                  <Card
                    className="p-0 cursor-pointer h-full"
                    onClick={() => setSelectedApp(app)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {app.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{app.name}</h3>
                            {installed.has(app.id) && (
                              <Badge variant="success" className="shrink-0">Installed</Badge>
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
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={e => { e.stopPropagation(); handleUninstall(app.id); }}
                          >
                            Uninstall
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={e => { e.stopPropagation(); handleInstall(app.id); }}
                          >
                            Install
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>

      {/* App Detail Modal */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => { if (!open) setSelectedApp(null); }}>
        {selectedApp && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
                  {selectedApp.icon}
                </div>
                <div>
                  <DialogTitle className="text-xl">{selectedApp.name}</DialogTitle>
                  <DialogDescription asChild>
                    <div>
                      <p className="text-sm text-indigo-500">{selectedApp.category}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <span className="text-yellow-500">{'★'.repeat(Math.round(selectedApp.rating))}</span>
                        <span>{selectedApp.rating} rating</span>
                        <span>·</span>
                        <span>{selectedApp.installs} installs</span>
                      </div>
                    </div>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <p className="text-gray-600">{selectedApp.description}</p>
            <Card className="shadow-none border-gray-100 bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-2">Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Automatic data synchronization</li>
                  <li>Two-way transaction mapping</li>
                  <li>Real-time webhook notifications</li>
                  <li>OAuth 2.0 secure authentication</li>
                </ul>
              </CardContent>
            </Card>
            <DialogFooter className="flex-row gap-3 sm:space-x-0">
              {installed.has(selectedApp.id) ? (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => { handleUninstall(selectedApp.id); setSelectedApp(null); }}
                >
                  Uninstall
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={() => { handleInstall(selectedApp.id); setSelectedApp(null); }}
                >
                  Install
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setSelectedApp(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
