import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

const INTEGRATIONS = [
  // Banking
  { name: 'Plaid', category: 'Banking', description: 'Connect 12,000+ US & Canadian bank accounts for real-time transaction feeds.', status: 'active', region: 'US/CA' },
  { name: 'Basiq', category: 'Banking', description: 'Direct bank feeds from 170+ Australian and New Zealand financial institutions.', status: 'active', region: 'AU/NZ' },
  { name: 'TrueLayer', category: 'Banking', description: 'Open Banking connections across UK and European banks via PSD2.', status: 'active', region: 'UK/EU' },

  // Payments
  { name: 'Stripe', category: 'Payments', description: 'Automatic reconciliation of Stripe payments, refunds, and fees.', status: 'active', region: 'Global' },
  { name: 'PayPal', category: 'Payments', description: 'Import PayPal transactions and auto-match to invoices.', status: 'active', region: 'Global' },
  { name: 'Square', category: 'Payments', description: 'POS transactions, inventory sync, and payment reconciliation.', status: 'active', region: 'Global' },
  { name: 'GoCardless', category: 'Payments', description: 'Direct debit collections and recurring payment tracking.', status: 'active', region: 'UK/EU/AU' },

  // Payroll
  { name: 'Gusto', category: 'Payroll', description: 'Full payroll sync — wages, taxes, benefits, and journal entries.', status: 'active', region: 'US' },
  { name: 'Employment Hero', category: 'Payroll', description: 'Australian payroll with STP compliance and leave management.', status: 'active', region: 'AU' },
  { name: 'PaySauce', category: 'Payroll', description: 'New Zealand payroll with payday filing and KiwiSaver.', status: 'active', region: 'NZ' },
  { name: 'Deel', category: 'Payroll', description: 'Global contractor payments and international payroll.', status: 'active', region: 'Global' },

  // E-commerce
  { name: 'Shopify', category: 'E-commerce', description: 'Sales, refunds, shipping, and tax data synced automatically.', status: 'active', region: 'Global' },
  { name: 'WooCommerce', category: 'E-commerce', description: 'WordPress e-commerce transactions and inventory sync.', status: 'active', region: 'Global' },
  { name: 'Amazon Seller', category: 'E-commerce', description: 'Marketplace sales, FBA fees, and settlement reports.', status: 'active', region: 'Global' },

  // CRM & Operations
  { name: 'HubSpot', category: 'CRM', description: 'Invoice sync, deal tracking, and revenue attribution.', status: 'active', region: 'Global' },
  { name: 'Salesforce', category: 'CRM', description: 'Opportunity-to-invoice pipeline and revenue recognition.', status: 'active', region: 'Global' },

  // Practice Management
  { name: 'Karbon', category: 'Practice', description: 'Workflow automation, task management, and client communication.', status: 'active', region: 'Global' },
  { name: 'Ignition', category: 'Practice', description: 'Proposals, engagement letters, and automated billing.', status: 'active', region: 'Global' },

  // Document & Expense
  { name: 'Dext (Receipt Bank)', category: 'Expenses', description: 'Receipt capture, OCR extraction, and auto-categorisation.', status: 'active', region: 'Global' },
  { name: 'Hubdoc', category: 'Expenses', description: 'Fetch bills and receipts from 1,000+ suppliers automatically.', status: 'active', region: 'Global' },

  // Tax Filing
  { name: 'ATO Portal', category: 'Tax Filing', description: 'Direct BAS lodgement, activity statements, and STP reporting.', status: 'active', region: 'AU' },
  { name: 'HMRC MTD', category: 'Tax Filing', description: 'Making Tax Digital VAT return submission and bridging.', status: 'active', region: 'UK' },
  { name: 'IRS e-File', category: 'Tax Filing', description: 'Electronic tax return filing for US entities.', status: 'active', region: 'US' },
  { name: 'IRD myIR', category: 'Tax Filing', description: 'GST returns and income tax filing for New Zealand.', status: 'active', region: 'NZ' },
];

const CATEGORIES = ['All', ...Array.from(new Set(INTEGRATIONS.map(i => i.category)))];

const statusBadgeVariant = {
  active: 'success',
  available: 'secondary',
};

const statusLabel = {
  active: 'Connected',
  available: 'Available',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function IntegrationsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = INTEGRATIONS.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'All' && i.category !== category) return false;
    return true;
  });

  const categoryCount = (cat) => INTEGRATIONS.filter(i => cat === 'All' || i.category === cat).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">{INTEGRATIONS.length} integrations across banking, payments, payroll, e-commerce, and more</p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <Badge
            key={cat}
            variant={category === cat ? 'default' : 'secondary'}
            className={cn(
              'cursor-pointer select-none px-4 py-1.5 text-sm transition-colors',
              category === cat
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'hover:bg-gray-200'
            )}
            onClick={() => setCategory(cat)}
          >
            {cat} ({categoryCount(cat)})
          </Badge>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search integrations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={`${category}-${search}`}
      >
        {filtered.map((integration, i) => (
          <motion.div key={i} variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <Card className="h-full flex flex-col hover:border-indigo-100">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <span className="text-xs text-gray-400">{integration.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{integration.region}</span>
                    <Badge variant={statusBadgeVariant[integration.status] || 'secondary'}>
                      {statusLabel[integration.status] || 'Available'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-gray-500 leading-relaxed">{integration.description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="link" className="px-0 text-indigo-600 hover:text-indigo-800">
                  Configure &rarr;
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">No integrations match your search.</div>
      )}
    </div>
  );
}
