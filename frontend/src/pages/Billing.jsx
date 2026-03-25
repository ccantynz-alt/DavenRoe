import { useState } from 'react';
import { useToast } from '../components/Toast';

const plans = [
  {
    id: 'practice',
    name: 'Practice',
    monthlyPrice: 149,
    annualPrice: 1490,
    description: 'For solo practitioners and small firms getting started.',
    features: [
      'Up to 50 clients',
      '1 jurisdiction (AU, NZ, UK, or US)',
      '2 team members',
      'Bank feeds & reconciliation',
      'Invoicing & payments',
      'Payroll (included)',
      'Tax filing & BAS/GST/VAT',
      'Financial reports (P&L, Balance Sheet, Cash Flow)',
      'AI categorisation & confidence scoring',
      'Ask Astra (natural language queries)',
      'Document OCR & storage',
      'Email support (24hr response)',
    ],
    cta: 'Downgrade to Practice',
  },
  {
    id: 'firm',
    name: 'Firm',
    monthlyPrice: 499,
    annualPrice: 4990,
    description: 'For growing firms managing multiple clients and jurisdictions.',
    popular: true,
    features: [
      'Unlimited clients',
      '4 jurisdictions (AU, NZ, UK, US)',
      '10 team members',
      'Everything in Practice, plus:',
      'Forensic Intelligence (Benford\'s, Ghost Vendor, Money Trail)',
      'Client Portal with scoped access',
      'Multi-entity consolidated reporting',
      'Specialist Toolkits (12 specialisations)',
      'Compliance Calendar (40+ deadlines)',
      'Cross-border tax treaty engine (6 DTAs)',
      'Autonomous month-end close',
      'Priority support (2hr response)',
    ],
    cta: 'Current Plan',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    description: 'For large practices and enterprises requiring full customisation.',
    features: [
      'Unlimited everything',
      'Unlimited jurisdictions',
      'Unlimited team members',
      'Everything in Firm, plus:',
      'White-label branding',
      'Dedicated account manager',
      'Custom integrations & API access',
      'SLA guarantee (99.99% uptime)',
      'Data residency options (AU, EU, US)',
      'Custom onboarding & training',
      'Bulk client migration tools',
      'Phone support & dedicated Slack channel',
    ],
    cta: 'Contact Sales',
  },
];

const billingHistory = [
  { id: 'INV-2026-03', date: 'Mar 1, 2026', amount: '$499.00', status: 'Paid', plan: 'Firm — Monthly' },
  { id: 'INV-2026-02', date: 'Feb 1, 2026', amount: '$499.00', status: 'Paid', plan: 'Firm — Monthly' },
  { id: 'INV-2026-01', date: 'Jan 1, 2026', amount: '$499.00', status: 'Paid', plan: 'Firm — Monthly' },
  { id: 'INV-2025-12', date: 'Dec 1, 2025', amount: '$499.00', status: 'Paid', plan: 'Firm — Monthly' },
  { id: 'INV-2025-11', date: 'Nov 1, 2025', amount: '$499.00', status: 'Paid', plan: 'Firm — Monthly' },
  { id: 'INV-2025-10', date: 'Oct 1, 2025', amount: '$499.00', status: 'Paid', plan: 'Firm — Monthly' },
];

const comparisonFeatures = [
  { name: 'Clients', practice: 'Up to 50', firm: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Team members', practice: '2', firm: '10', enterprise: 'Unlimited' },
  { name: 'Jurisdictions', practice: '1', firm: '4', enterprise: 'Unlimited' },
  { name: 'Bank feeds', practice: true, firm: true, enterprise: true },
  { name: 'Invoicing & payments', practice: true, firm: true, enterprise: true },
  { name: 'Payroll (included)', practice: true, firm: true, enterprise: true },
  { name: 'Tax filing', practice: true, firm: true, enterprise: true },
  { name: 'Financial reports', practice: true, firm: true, enterprise: true },
  { name: 'AI categorisation', practice: true, firm: true, enterprise: true },
  { name: 'Ask Astra', practice: true, firm: true, enterprise: true },
  { name: 'Document OCR', practice: true, firm: true, enterprise: true },
  { name: 'Forensic Intelligence', practice: false, firm: true, enterprise: true },
  { name: 'Client Portal', practice: false, firm: true, enterprise: true },
  { name: 'Multi-entity reporting', practice: false, firm: true, enterprise: true },
  { name: 'Specialist Toolkits', practice: false, firm: true, enterprise: true },
  { name: 'Compliance Calendar', practice: false, firm: true, enterprise: true },
  { name: 'Cross-border tax treaties', practice: false, firm: true, enterprise: true },
  { name: 'Autonomous month-end close', practice: false, firm: true, enterprise: true },
  { name: 'White-label branding', practice: false, firm: false, enterprise: true },
  { name: 'Dedicated account manager', practice: false, firm: false, enterprise: true },
  { name: 'Custom integrations & API', practice: false, firm: false, enterprise: true },
  { name: 'SLA guarantee', practice: false, firm: false, enterprise: true },
  { name: 'Data residency options', practice: false, firm: false, enterprise: true },
  { name: 'Support', practice: 'Email (24hr)', firm: 'Priority (2hr)', enterprise: 'Dedicated + Phone' },
];

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function Billing() {
  const toast = useToast();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentPlan] = useState('firm');
  const [showComparison, setShowComparison] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const isAnnual = billingCycle === 'annual';

  const getPrice = (plan) => {
    if (!plan.monthlyPrice) return null;
    return isAnnual ? plan.annualPrice : plan.monthlyPrice;
  };

  const getMonthlyEquivalent = (plan) => {
    if (!plan.monthlyPrice) return null;
    return isAnnual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;
  };

  const handlePlanAction = (plan) => {
    if (plan.id === currentPlan) return;
    if (plan.id === 'enterprise') {
      toast.info('Our sales team will contact you within 1 business day.');
      return;
    }
    setConfirmModal(plan);
  };

  const confirmPlanChange = () => {
    if (!confirmModal) return;
    const action = plans.indexOf(confirmModal) < plans.findIndex(p => p.id === currentPlan) ? 'downgraded' : 'upgraded';
    toast.success(`Successfully ${action} to ${confirmModal.name}. Changes take effect at your next billing cycle.`);
    setConfirmModal(null);
  };

  const handleDownloadInvoice = (invoice) => {
    toast.success(`Downloading ${invoice.id}.pdf`);
  };

  const handleUpdatePayment = () => {
    toast.info('Redirecting to secure payment update...');
  };

  const currentPlanData = plans.find(p => p.id === currentPlan);
  const currentPrice = getPrice(currentPlanData);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your plan, payment method, and billing history.</p>
      </div>

      {/* Current Plan Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-gray-900">{currentPlanData.name}</span>
              <span className="text-gray-400">|</span>
              <span className="text-xl font-semibold text-blue-600">${currentPrice}/mo</span>
            </div>
            <p className="text-sm text-gray-500">{currentPlanData.description}</p>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">127</p>
              <p className="text-xs text-gray-500 mt-1">Clients</p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '100%' }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Unlimited</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">6</p>
              <p className="text-xs text-gray-500 mt-1">Team Members</p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '60%' }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">6 of 10</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">3</p>
              <p className="text-xs text-gray-500 mt-1">Jurisdictions</p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '75%' }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">3 of 4</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Next billing date: <span className="font-medium text-gray-700">April 1, 2026</span>
          </span>
          <span className="text-gray-500">
            Member since <span className="font-medium text-gray-700">October 2025</span>
          </span>
        </div>
      </div>

      {/* Billing Cycle Toggle + Plans */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Plans</h2>
          <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annual
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                2 months free
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const price = getPrice(plan);
            const monthlyEquiv = getMonthlyEquivalent(plan);

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl border-2 shadow-sm transition-shadow hover:shadow-md ${
                  isCurrent
                    ? 'border-green-500 ring-1 ring-green-200'
                    : plan.popular
                    ? 'border-blue-500 ring-1 ring-blue-200'
                    : 'border-gray-200'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}
                {!isCurrent && plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 min-h-[40px]">{plan.description}</p>

                  <div className="mt-4 mb-6">
                    {price ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-gray-900">${monthlyEquiv}</span>
                          <span className="text-gray-500">/mo</span>
                        </div>
                        {isAnnual && (
                          <p className="text-sm text-gray-400 mt-1">
                            ${price}/year (billed annually)
                          </p>
                        )}
                        {!isAnnual && (
                          <p className="text-sm text-gray-400 mt-1">Billed monthly</p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-gray-900">Custom</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Tailored to your needs</p>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handlePlanAction(plan)}
                    disabled={isCurrent}
                    className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                        : plan.id === 'enterprise'
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : plan.cta}
                  </button>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg
                          className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table Toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {showComparison ? 'Hide' : 'Show'} full plan comparison
          <svg
            className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Comparison Table */}
      {showComparison && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-900 w-1/4">Feature</th>
                  <th className="text-center p-4 font-semibold text-gray-900 w-1/4">Practice</th>
                  <th className="text-center p-4 font-semibold text-gray-900 w-1/4 bg-blue-50">Firm</th>
                  <th className="text-center p-4 font-semibold text-gray-900 w-1/4">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                    <td className="p-4 text-gray-700 font-medium">{feature.name}</td>
                    {['practice', 'firm', 'enterprise'].map((tier) => (
                      <td
                        key={tier}
                        className={`p-4 text-center ${tier === 'firm' ? 'bg-blue-50/50' : ''}`}
                      >
                        {typeof feature[tier] === 'boolean' ? (
                          feature[tier] ? <CheckIcon /> : <XIcon />
                        ) : (
                          <span className="text-gray-700">{feature[tier]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Method & Billing History side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Method */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-700 to-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Visa ending in 4242</p>
              <p className="text-xs text-gray-500">Expires 12/2028</p>
            </div>
          </div>
          <button
            onClick={handleUpdatePayment}
            className="mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            Update Payment Method
          </button>
        </div>

        {/* Billing History */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-3 font-medium text-gray-500">Invoice</th>
                  <th className="text-left pb-3 font-medium text-gray-500">Date</th>
                  <th className="text-left pb-3 font-medium text-gray-500">Plan</th>
                  <th className="text-left pb-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left pb-3 font-medium text-gray-500">Status</th>
                  <th className="text-right pb-3 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 font-medium text-gray-900">{invoice.id}</td>
                    <td className="py-3 text-gray-600">{invoice.date}</td>
                    <td className="py-3 text-gray-600">{invoice.plan}</td>
                    <td className="py-3 font-medium text-gray-900">{invoice.amount}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium hover:underline"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cancel / Help */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Need help with billing?</h3>
          <p className="text-sm text-gray-500 mt-1">
            Contact our support team at billing@astra.ai or reach out via the in-app chat.
          </p>
        </div>
        <button
          onClick={() => toast.warning('To cancel your subscription, please contact support at billing@astra.ai')}
          className="text-sm text-red-500 hover:text-red-600 font-medium whitespace-nowrap"
        >
          Cancel Subscription
        </button>
      </div>

      {/* Plan Change Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {plans.indexOf(confirmModal) < plans.findIndex(p => p.id === currentPlan)
                ? 'Downgrade'
                : 'Upgrade'}{' '}
              to {confirmModal.name}?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {plans.indexOf(confirmModal) < plans.findIndex(p => p.id === currentPlan) ? (
                <>
                  Your plan will be downgraded at the end of your current billing cycle.
                  You will retain access to {currentPlanData.name} features until April 1, 2026.
                </>
              ) : (
                <>
                  You will be upgraded immediately and charged a prorated amount of{' '}
                  <span className="font-semibold text-gray-700">
                    ${getPrice(confirmModal)}/mo
                  </span>{' '}
                  for the remainder of this billing cycle.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPlanChange}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Confirm{' '}
                {plans.indexOf(confirmModal) < plans.findIndex(p => p.id === currentPlan)
                  ? 'Downgrade'
                  : 'Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
