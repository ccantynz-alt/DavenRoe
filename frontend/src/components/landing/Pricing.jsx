import { useState, useEffect, useRef } from 'react';

/**
 * Pricing section — three tiers, clean and professional.
 * Makes the product feel real and commercial.
 */

const PLANS = [
  {
    name: 'Practice',
    price: 149,
    period: '/month',
    description: 'For solo practitioners and small firms getting started with autonomous accounting.',
    features: [
      'Up to 5 client entities',
      'AI transaction categorisation',
      'Single jurisdiction tax',
      'Bank feed integration',
      'Standard reports (P&L, BS, TB)',
      'Email support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Firm',
    price: 499,
    period: '/month',
    description: 'For growing firms that need multi-jurisdiction, forensics, and the full AI agent suite.',
    features: [
      'Up to 50 client entities',
      'All 4 jurisdictions + 6 treaties',
      'Forensic anomaly detection',
      'AI agents (month-end close, compliance)',
      'Client portal with scoped access',
      'Specialist toolkits (12 modules)',
      'PDF export & advanced reports',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: null,
    period: '',
    description: 'For large practices and multi-office firms with custom integration and compliance needs.',
    features: [
      'Unlimited client entities',
      'Custom jurisdiction configuration',
      'Dedicated forensic analysis',
      'White-label client portal',
      'API access & custom integrations',
      'SSO & advanced RBAC',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function Pricing() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-24 px-6 lg:px-16 bg-white" id="pricing">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase mb-3">Pricing</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">14-day free trial on all plans. No credit card required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {PLANS.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 border transition-all duration-700 ${
                plan.highlighted
                  ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-100/50 scale-105 z-10'
                  : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
              }`}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible
                  ? (plan.highlighted ? 'translateY(0) scale(1.05)' : 'translateY(0) scale(1)')
                  : 'translateY(30px) scale(0.98)',
                transition: `all 0.7s ease-out ${i * 150}ms`,
              }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                  {plan.badge}
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                {plan.price !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-gray-900">Custom</div>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">{plan.description}</p>

              <button
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors mb-8 ${
                  plan.highlighted
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
