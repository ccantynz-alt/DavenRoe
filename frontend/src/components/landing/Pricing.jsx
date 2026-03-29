import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Solo',
    price: 49,
    period: '/month',
    annual: 490,
    description: 'For freelancers and sole traders managing their own books.',
    features: [
      'Up to 5 clients',
      '1 jurisdiction',
      'AI transaction categorisation',
      'Bank feed integration',
      'Invoicing & payments',
      'Reports (P&L, Balance Sheet)',
      'Ask Astra (AI queries)',
      'Document OCR',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Practice',
    price: 149,
    period: '/month',
    annual: 1490,
    description: 'For accounting practices managing multiple clients with payroll and tax filing.',
    features: [
      'Up to 50 clients',
      '2 jurisdictions',
      '5 team members',
      'Everything in Solo, plus:',
      'Payroll (included, not add-on)',
      'Tax filing (BAS/GST/VAT/Sales Tax)',
      'Compliance Calendar',
      'Time tracking & projects',
      'Scenario planning',
      'Financial Health Score',
      'Cash flow forecasting',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Firm',
    price: 499,
    period: '/month',
    annual: 4990,
    description: 'For multi-jurisdiction firms needing forensics, AI agents, and the full platform.',
    features: [
      'Unlimited clients',
      '4 jurisdictions (AU, NZ, UK, US)',
      '10 team members',
      'Everything in Practice, plus:',
      'Forensic Intelligence',
      'Cross-border tax treaties (6 DTAs)',
      'AI agents (autonomous close)',
      'Client Portal',
      'Specialist Toolkits (12 modules)',
      'Priority support (2hr response)',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: null,
    period: '',
    annual: null,
    description: 'For large practices and multi-office firms with custom needs.',
    features: [
      'Unlimited everything',
      'White-label branding',
      'Dedicated account manager',
      'Custom integrations & API',
      'SLA guarantee (99.99%)',
      'Data residency options',
      'SSO & advanced RBAC',
      'Phone & Slack support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="py-24 px-6 lg:px-16 bg-white" id="pricing">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase mb-3">Pricing</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">One platform. One subscription. Everything.</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-6">
            Replaces Xero + Gusto + Dext + Fathom + Chaser + Float. 14-day free trial, no credit card required.
          </p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={cn('text-sm font-medium', !annual ? 'text-gray-900' : 'text-gray-400')}>Monthly</span>
            <Switch
              checked={annual}
              onCheckedChange={setAnnual}
              className="data-[state=checked]:bg-indigo-600"
            />
            <span className={cn('text-sm font-medium', annual ? 'text-gray-900' : 'text-gray-400')}>
              Annual <span className="text-green-600 text-xs font-semibold ml-1">Save 2 months</span>
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              whileInView={{
                opacity: 1,
                y: 0,
                scale: plan.highlighted ? 1.03 : 1,
              }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: 'easeOut' }}
            >
              <Card
                className={cn(
                  'relative p-7 rounded-2xl transition-all',
                  plan.highlighted
                    ? 'border-indigo-200 shadow-xl shadow-indigo-100/50 z-10'
                    : 'border-gray-200 shadow-sm hover:shadow-md'
                )}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs">
                    {plan.badge}
                  </Badge>
                )}

                <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-3">
                  {plan.price !== null ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          ${annual ? Math.round(plan.annual / 12) : plan.price}
                        </span>
                        <span className="text-gray-500 text-sm">/month</span>
                      </div>
                      {annual && (
                        <p className="text-xs text-green-600 mt-0.5">
                          ${plan.annual}/year (save ${plan.price * 12 - plan.annual})
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">Custom</div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-5 leading-relaxed">{plan.description}</p>

                <Button
                  variant={plan.highlighted ? 'default' : 'secondary'}
                  className={cn(
                    'w-full mb-6',
                    plan.highlighted && 'bg-indigo-600 hover:bg-indigo-700'
                  )}
                >
                  {plan.cta}
                </Button>

                <ul className="space-y-2.5">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                      <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Share of wallet pitch */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <Card className="mt-12 text-center rounded-2xl p-8 bg-gray-50 border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Your clients are paying for 6 separate tools today</p>
            <p className="text-xs text-gray-400 mb-3">
              QBO ($90) + Gusto payroll ($125) + Dext documents ($30) + Fathom reporting ($50) + Chaser debt collection ($40) + Float cash flow ($49)
            </p>
            <p className="text-lg font-bold text-gray-900">
              = <span className="text-red-500 line-through">$384/month</span> across 6 vendors
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-2">
              Astra Practice: $149/month. One platform. One login. Everything.
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
