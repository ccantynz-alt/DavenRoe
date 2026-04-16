import { useState } from 'react';

/**
 * Clean FAQ accordion — addresses real concerns
 * an accounting professional would have.
 */

const FAQS = [
  {
    q: 'Is the AI actually doing my bookkeeping, or is this just auto-categorisation?',
    a: "It's real double-entry bookkeeping. DavenRoe doesn't just label transactions — it drafts full journal entries with debits, credits, GST components, and account allocations. Every entry follows GAAP/IFRS standards. Your team reviews exceptions through a dedicated approval queue, with AI confidence scores on every line.",
  },
  {
    q: 'How does multi-jurisdiction tax work? Do I need to configure it?',
    a: "DavenRoe ships with full tax engines for Australia, United States, New Zealand, and the United Kingdom — including all major tax types (GST, VAT, PAYG, PAYE, corporate tax, withholding tax). When your client has cross-border income, the treaty engine automatically identifies applicable bilateral agreements and calculates the optimal withholding rate. No configuration needed — it's built in.",
  },
  {
    q: "What exactly is the forensic module? Is this like Benford's Law?",
    a: "Benford's Law is just the start. The forensic suite runs five concurrent analysis engines: digit distribution analysis, statistical anomaly detection, vendor cross-referencing (ghost vendors, related parties, payment splitting), payroll verification (ghost employees, phantom overtime), and money trail analysis. It runs continuously, not just at audit time.",
  },
  {
    q: 'Can my clients access their own data?',
    a: "Yes. The client portal gives scoped, read-only access to their invoices, financial reports, documents, and tax position. They see only their entity's data. You control exactly what's visible. Clients can also upload receipts and documents directly through the portal.",
  },
  {
    q: 'What happens if the AI gets something wrong?',
    a: "Every AI-categorised transaction goes through a confidence scoring system. Anything below 80% confidence is automatically routed to your review queue — your team approves, corrects, or flags it. The system learns from every correction, improving accuracy over time. Current average accuracy is 94.7% across all transaction types.",
  },
  {
    q: 'How do you handle bank feeds across different countries?',
    a: 'We integrate with three major open banking providers: Plaid (US/Canada — 12,000+ institutions), Basiq (Australia/NZ — CDR-compliant, 170+ institutions), and TrueLayer (UK/EU — PSD2 Open Banking, 5,000+ institutions). Connections are OAuth-based with bank-grade encryption.',
  },
  {
    q: 'Is my data secure? Where is it stored?',
    a: 'All data is encrypted with 256-bit AES at rest and TLS 1.3 in transit. We maintain a complete immutable audit trail of every change. Your financial data never leaves our SOC 2 compliant infrastructure. We support role-based access control with five permission levels from Partner to Client.',
  },
  {
    q: 'Can I migrate from Xero or QuickBooks?',
    a: "Yes. DavenRoe includes built-in importers for Xero, QuickBooks, MYOB, and standard CSV/Excel files. The migration tool maps your existing chart of accounts, transaction history, and client data. Most firms complete migration within a single session.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-24 px-6 lg:px-16 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase mb-3">FAQ</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Common questions</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-sm font-semibold text-gray-900 pr-8">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: open === i ? '300px' : '0',
                  opacity: open === i ? 1 : 0,
                }}
              >
                <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
