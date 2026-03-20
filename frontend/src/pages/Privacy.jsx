export default function Privacy({ onBack }) {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-12">Last Updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-10">
          <Section title="1. Data We Collect">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4 font-semibold text-gray-900">Data Type</th>
                  <th className="py-3 pr-4 font-semibold text-gray-900">Purpose</th>
                  <th className="py-3 font-semibold text-gray-900">Retention</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Account info (name, email)</td><td className="py-3 pr-4">User authentication</td><td className="py-3">Until account deletion</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Business entity data</td><td className="py-3 pr-4">Accounting operations</td><td className="py-3">Until account deletion</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Bank feed transactions</td><td className="py-3 pr-4">Automated bookkeeping</td><td className="py-3">7 years (regulatory)</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Invoices and documents</td><td className="py-3 pr-4">Record keeping</td><td className="py-3">7 years (regulatory)</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">AI interaction logs</td><td className="py-3 pr-4">Service improvement</td><td className="py-3">90 days</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="2. Third-Party Data Processors">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4 font-semibold text-gray-900">Provider</th>
                  <th className="py-3 pr-4 font-semibold text-gray-900">Purpose</th>
                  <th className="py-3 font-semibold text-gray-900">Data Shared</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Anthropic (Claude)</td><td className="py-3 pr-4">AI categorisation &amp; narratives</td><td className="py-3">Transaction descriptions, amounts</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Plaid</td><td className="py-3 pr-4">US/Canada bank feeds</td><td className="py-3">Bank credentials (tokenised)</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Basiq</td><td className="py-3 pr-4">AU/NZ bank feeds</td><td className="py-3">Bank credentials (tokenised)</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">TrueLayer</td><td className="py-3 pr-4">UK/EU bank feeds</td><td className="py-3">Bank credentials (tokenised)</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Neon (PostgreSQL)</td><td className="py-3 pr-4">Database hosting</td><td className="py-3">All stored data (encrypted)</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Stripe</td><td className="py-3 pr-4">Payment processing</td><td className="py-3">Payment details</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="3. We Do NOT">
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Sell your data to third parties</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Use your financial data for advertising</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Share data between client entities</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Train AI models on your specific financial data</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Store bank login credentials (tokenised via Plaid/Basiq/TrueLayer)</li>
            </ul>
          </Section>

          <Section title="4. Your Rights">
            <p className="text-gray-600 mb-4">Under GDPR, the Australian Privacy Act, and applicable laws, you have the right to:</p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Access</strong> — Request a full export of your data</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Rectification</strong> — Correct inaccurate data</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Erasure</strong> — Request deletion (subject to regulatory retention requirements)</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Portability</strong> — Export data in CSV/JSON format</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Object</strong> — Opt out of AI-powered categorisation</li>
            </ul>
          </Section>

          <Section title="5. Data Security">
            <p className="text-gray-600">
              All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Our infrastructure runs on SOC 2 compliant services. Database backups are encrypted and stored in geographically separate regions. Access to production systems requires multi-factor authentication and is logged.
            </p>
          </Section>

          <Section title="6. Contact">
            <p className="text-gray-600">
              For privacy inquiries, data access requests, or to exercise any of your rights, contact us at <span className="text-indigo-600 font-medium">privacy@astra.ai</span>.
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
      {children}
    </div>
  );
}
