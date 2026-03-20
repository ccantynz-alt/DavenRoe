export default function Terms({ onBack }) {
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

      <div className="max-w-4xl mx-auto px-6 lg:px-16 py-16">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-12">Last Updated: March 2026</p>

        <div className="space-y-10">
          <Section title="1. Nature of Service">
            <p>
              Astra is an AI-assisted accounting <strong>tool</strong>, not an accounting firm, tax advisor, or financial institution. Astra does not provide professional accounting advice, tax advice, legal advice, or financial advice.
            </p>
          </Section>

          <Section title="2. AI-Generated Output Disclaimer">
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">2.1 Human Review Required</h3>
            <p>
              All AI-generated outputs — including but not limited to transaction categorisations, financial narratives, tax calculations, forensic analysis findings, and due diligence reports — are <strong>drafts requiring human review and approval</strong> before any reliance or action.
            </p>
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">2.2 No Guarantee of Accuracy</h3>
            <p>
              While Astra's tax engine uses deterministic logic derived from published legislation, tax law is complex and subject to interpretation. AI-generated categorisations and narratives are probabilistic and may contain errors. <strong>You are responsible for verifying all outputs before use.</strong>
            </p>
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">2.3 Not a Substitute for Professional Advice</h3>
            <p>
              Astra does not replace the need for a qualified accountant, tax advisor, or auditor. For material financial decisions, tax filings, regulatory compliance, or legal matters, you must consult with appropriately licensed professionals.
            </p>
          </Section>

          <Section title="3. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Astra and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities arising from your use of the platform.
            </p>
            <p className="mt-3">
              Our total aggregate liability for any claims arising out of or relating to these Terms or the service shall not exceed the fees paid by you in the twelve (12) months preceding the claim.
            </p>
          </Section>

          <Section title="4. Your Responsibilities">
            <ul className="space-y-2">
              <li className="flex items-start gap-2"><span className="text-indigo-500">&#8226;</span> Maintain the security of your account credentials</li>
              <li className="flex items-start gap-2"><span className="text-indigo-500">&#8226;</span> Review and verify all AI-generated outputs before acting on them</li>
              <li className="flex items-start gap-2"><span className="text-indigo-500">&#8226;</span> Ensure your use complies with applicable laws and regulations</li>
              <li className="flex items-start gap-2"><span className="text-indigo-500">&#8226;</span> Maintain your own backups of critical financial data</li>
              <li className="flex items-start gap-2"><span className="text-indigo-500">&#8226;</span> Obtain appropriate client consent before processing their data</li>
            </ul>
          </Section>

          <Section title="5. Data Ownership">
            <p>
              <strong>You own your data.</strong> All financial data, documents, and records you upload or generate through Astra remain your property. We claim no ownership rights over your content. You grant us a limited licence to process your data solely for the purpose of providing the service.
            </p>
          </Section>

          <Section title="6. Subscription & Billing">
            <p>
              Subscriptions are billed monthly. You may cancel at any time, with access continuing until the end of your billing period. We offer a 14-day free trial on all plans with no credit card required. Price changes will be communicated 30 days in advance.
            </p>
          </Section>

          <Section title="7. Termination">
            <p>
              Either party may terminate this agreement at any time. Upon termination, you may export your data within 30 days. After 30 days, data will be deleted in accordance with our retention policies, subject to regulatory requirements.
            </p>
          </Section>

          <Section title="8. Governing Law">
            <p>
              These Terms are governed by the laws of the State of New South Wales, Australia. Any disputes shall be resolved in the courts of New South Wales.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              For questions about these Terms, contact us at <span className="text-indigo-600 font-medium">legal@astra.ai</span>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="text-gray-600 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
