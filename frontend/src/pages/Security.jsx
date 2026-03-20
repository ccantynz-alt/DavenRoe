import { useEffect, useRef, useState } from 'react';

const SECURITY_FEATURES = [
  {
    title: 'AES-256 Encryption',
    description: 'All data encrypted at rest using AES-256. In transit, we use TLS 1.3 exclusively. Your financial data is protected by the same encryption standard used by banks and government agencies.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: 'Immutable Audit Trail',
    description: 'Every transaction, categorisation, approval, and change is logged with a timestamp, user ID, and action type. Audit trails cannot be modified or deleted — even by administrators.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    title: 'Entity-Level Isolation',
    description: 'Each client entity\'s data is logically isolated at the database level. Cross-entity access is prevented by design, not just by permissions. One client can never see another\'s data.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
      </svg>
    ),
  },
  {
    title: 'Role-Based Access Control',
    description: 'Five role tiers — Partner, Manager, Senior, Bookkeeper, and Client — each with precisely scoped permissions. Partners control who sees what. Clients access only their own data through the portal.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: 'Human-in-the-Loop',
    description: 'AI handles the volume, but humans approve the exceptions. Every AI-categorised transaction with confidence below 80% is routed to the review queue. Nothing posts without authorisation.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Tokenised Bank Credentials',
    description: 'We never store your bank login credentials. All bank connections are managed through tokenised integrations with Plaid, Basiq, and TrueLayer. We receive transaction data — never credentials.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
];

const COMPLIANCE = [
  { standard: 'SOC 2 Type II', status: 'Compliant', description: 'Annual audit of security, availability, and confidentiality controls' },
  { standard: 'GDPR', status: 'Compliant', description: 'Full data subject rights, DPA available on request' },
  { standard: 'Australian Privacy Act', status: 'Compliant', description: 'APPs compliance, Australian data residency available' },
  { standard: 'PCI DSS', status: 'Delegated to Stripe', description: 'Payment processing handled by PCI Level 1 certified Stripe' },
];

export default function SecurityPage({ onBack }) {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <nav className="flex items-center justify-between px-6 lg:px-16 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Astra</span>
        </div>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          &larr; Back to homepage
        </button>
      </nav>

      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase mb-3">Security</p>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Your data. Our obsession.
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed max-w-3xl mx-auto">
              Financial data is the most sensitive information a business has. We treat it with the gravity it deserves — not as an afterthought, but as the foundation of everything we build.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl font-bold text-center mb-16">Security Architecture</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SECURITY_FEATURES.map((feature, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-md transition-all h-full">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl font-bold text-center mb-12">Compliance</h2>
          </FadeIn>
          <div className="space-y-4">
            {COMPLIANCE.map((item, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="flex items-center gap-6 p-6 rounded-xl border border-gray-100 hover:border-indigo-100 transition-colors">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.standard}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-16 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Security questions?</h2>
          <p className="text-gray-400 mb-2">We welcome security inquiries and responsible disclosure.</p>
          <p className="text-gray-400">Contact us at <span className="text-indigo-400 font-medium">security@astra.ai</span></p>
        </div>
      </section>
    </div>
  );
}

function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `all 0.6s ease-out ${delay}ms` }}>
      {children}
    </div>
  );
}
