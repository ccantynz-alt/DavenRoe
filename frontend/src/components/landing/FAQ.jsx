import { motion } from 'framer-motion';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/Accordion';
import { cn } from '@/lib/utils';

/**
 * Clean FAQ accordion — addresses real concerns
 * an accounting professional would have.
 * Uses Radix Accordion for accessible expand/collapse.
 */

const FAQS = [
  {
    q: 'Is the AI actually doing my bookkeeping, or is this just auto-categorisation?',
    a: "It's real double-entry bookkeeping. Astra doesn't just label transactions — it drafts full journal entries with debits, credits, GST components, and account allocations. Every entry follows GAAP/IFRS standards. Your team reviews exceptions through a dedicated approval queue, with AI confidence scores on every line.",
  },
  {
    q: 'How does multi-jurisdiction tax work? Do I need to configure it?',
    a: "Astra ships with full tax engines for Australia, United States, New Zealand, and the United Kingdom — including all major tax types (GST, VAT, PAYG, PAYE, corporate tax, withholding tax). When your client has cross-border income, the treaty engine automatically identifies applicable bilateral agreements and calculates the optimal withholding rate. No configuration needed — it's built in.",
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
    a: "Yes. Astra includes built-in importers for Xero, QuickBooks, MYOB, and standard CSV/Excel files. The migration tool maps your existing chart of accounts, transaction history, and client data. Most firms complete migration within a single session.",
  },
];

export default function FAQ() {
  return (
    <section className="py-24 px-6 lg:px-16 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase mb-3">FAQ</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Common questions</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm px-0 data-[state=open]:shadow-sm"
              >
                <AccordionTrigger
                  className={cn(
                    'px-6 py-5 text-left text-sm font-semibold text-gray-900 hover:no-underline',
                    '[&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-gray-400'
                  )}
                >
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
