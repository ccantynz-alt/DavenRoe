export default function Privacy({ onBack }) {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <nav className="flex items-center justify-between px-6 lg:px-16 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">DavenRoe</span>
        </div>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          &larr; Back to homepage
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 lg:px-16 py-16">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-12">Last Updated: March 2026 &middot; Version 2026.03.3</p>

        <div className="prose prose-gray max-w-none space-y-10">
          <Section title="1. Who We Are">
            <p className="text-gray-600">
              DavenRoe is operated by a New Zealand entity. We provide an AI-assisted accounting software tool to users in New Zealand, Australia, the United Kingdom, the European Union, the United States, and Canada.
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4 font-semibold text-gray-900">Data Type</th>
                  <th className="py-3 pr-4 font-semibold text-gray-900">Purpose</th>
                  <th className="py-3 font-semibold text-gray-900">Retention</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Account info (name, email, IP)</td><td className="py-3 pr-4">Authentication, security</td><td className="py-3">Until account deletion</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Business entity data</td><td className="py-3 pr-4">Accounting operations</td><td className="py-3">Until account deletion</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Bank feed transactions</td><td className="py-3 pr-4">Automated bookkeeping</td><td className="py-3">7 years (regulatory)</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Invoices and documents</td><td className="py-3 pr-4">Record keeping</td><td className="py-3">7 years (regulatory)</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Payroll &amp; tax filing data</td><td className="py-3 pr-4">Payroll, tax compliance</td><td className="py-3">7 years (regulatory)</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Expense/receipt data</td><td className="py-3 pr-4">Expense management</td><td className="py-3">7 years (regulatory)</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">AI interaction logs</td><td className="py-3 pr-4">Service improvement, audit</td><td className="py-3">90 days</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Usage analytics</td><td className="py-3 pr-4">Product improvement</td><td className="py-3">12 months</td></tr>
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Consent records</td><td className="py-3 pr-4">Legal compliance</td><td className="py-3">Account + 7 years</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="3. Third-Party Data Processors">
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
                <tr className="border-b border-gray-100"><td className="py-3 pr-4">Mailgun</td><td className="py-3 pr-4">Transactional email</td><td className="py-3">Email address, name</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="4. We Do NOT">
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Sell or share your personal information (as defined by CCPA/CPRA or any law)</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Use your financial data for advertising or behavioural profiling</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Share data between client entities</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Train AI models on your financial data</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Store bank login credentials (tokenised via Plaid/Basiq/TrueLayer)</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Knowingly collect data from children under 16</li>
            </ul>
          </Section>

          <Section title="5. Your Rights (All Users)">
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Access</strong> — Request a full export of your data</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Correct</strong> — Fix inaccurate data</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Delete</strong> — Request erasure (subject to regulatory retention)</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Port</strong> — Export in CSV/JSON format</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Object</strong> — Opt out of AI categorisation</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Withdraw consent</strong> — At any time, without affecting prior processing</li>
            </ul>
          </Section>

          {/* US-SPECIFIC PRIVACY */}
          <div className="border-2 border-blue-200 rounded-2xl p-6 bg-blue-50/30">
            <Section title="6. United States — CCPA/CPRA & State Privacy Laws">
              <div className="bg-blue-100 rounded-xl p-4 text-sm text-blue-800 mb-6">
                <strong>California Residents:</strong> You have additional rights under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA).
              </div>

              <h3 className="font-bold text-gray-900 mb-3">Your California Rights</h3>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Right to Know</strong> — Categories and specific pieces of PI collected</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Right to Delete</strong> — Request deletion (subject to regulatory retention)</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Right to Correct</strong> — Fix inaccurate information</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Right to Opt-Out of Sale/Sharing</strong> — We do NOT sell or share. Nothing to opt out of.</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Right to Limit Sensitive PI Use</strong> — Sensitive data used only to provide the service</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> <strong>Non-Discrimination</strong> — We will not penalise you for exercising rights</li>
              </ul>

              <h3 className="font-bold text-gray-900 mb-3">CCPA Categories of Personal Information</h3>
              <table className="w-full text-xs border-collapse mb-6">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="py-2 pr-3 font-semibold text-gray-900">Category</th>
                    <th className="py-2 pr-3 font-semibold text-gray-900">Collected?</th>
                    <th className="py-2 font-semibold text-gray-900">Sold/Shared?</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100"><td className="py-2 pr-3">Identifiers (name, email, IP)</td><td className="py-2 pr-3">Yes</td><td className="py-2 font-semibold text-red-600">No</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 pr-3">Financial information</td><td className="py-2 pr-3">Yes</td><td className="py-2 font-semibold text-red-600">No</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 pr-3">Commercial information</td><td className="py-2 pr-3">Yes</td><td className="py-2 font-semibold text-red-600">No</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 pr-3">Internet/network activity</td><td className="py-2 pr-3">Yes</td><td className="py-2 font-semibold text-red-600">No</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 pr-3">Geolocation (country from IP)</td><td className="py-2 pr-3">Yes</td><td className="py-2 font-semibold text-red-600">No</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 pr-3">Sensitive PI (SSN, bank accounts)</td><td className="py-2 pr-3">If provided</td><td className="py-2 font-semibold text-red-600">No</td></tr>
                </tbody>
              </table>

              <h3 className="font-bold text-gray-900 mb-3">Other US State Privacy Laws</h3>
              <p className="text-sm text-gray-600">
                If you reside in Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Montana, or another US state with a comprehensive privacy law, you have similar rights to access, delete, correct, and opt out. We do not sell data or engage in targeted advertising. Exercise rights at <span className="text-indigo-600 font-medium">privacy@davenroe.com</span>. Appeals: email with subject &ldquo;Privacy Appeal.&rdquo;
              </p>

              <h3 className="font-bold text-gray-900 mt-4 mb-3">How to Exercise Rights</h3>
              <p className="text-sm text-gray-600">
                Email <span className="text-indigo-600 font-medium">privacy@davenroe.com</span> from your registered email. We verify identity via account credentials. Response within 45 days (may extend by 45 days with notice). Authorised agents must provide written authorisation.
              </p>
            </Section>
          </div>

          <Section title="7. Jurisdiction-Specific Compliance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">Australia</h4>
                <p className="text-xs text-gray-600">Privacy Act 1988 &amp; APPs. Notifiable Data Breaches scheme. Complaints to OAIC.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">New Zealand</h4>
                <p className="text-xs text-gray-600">Privacy Act 2020. Complaints to Office of the Privacy Commissioner.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">United Kingdom</h4>
                <p className="text-xs text-gray-600">UK GDPR &amp; Data Protection Act 2018. ICO registration. Complaints to ICO.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">European Union</h4>
                <p className="text-xs text-gray-600">EU GDPR. Standard Contractual Clauses for international transfers. Local supervisory authority.</p>
              </div>
            </div>
          </Section>

          <Section title="8. Data Security">
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> All data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> Database-level entity isolation — no cross-entity data leakage</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> Role-based access control with 5 permission levels</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> Immutable hash-chain audit trail for all modifications</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> MFA available for all accounts</li>
            </ul>
          </Section>

          <Section title="9. Data Breach Response">
            <p className="text-gray-600 text-sm">
              Affected users notified within <strong>72 hours</strong>. Regulatory authorities notified as required (OAIC, Privacy Commissioner NZ, ICO, US state AGs). For US users: we comply with all state breach notification laws including California (Cal. Civ. Code § 1798.82) and New York (NY Gen. Bus. Law § 899-AA).
            </p>
          </Section>

          <Section title="10. Contact">
            <p className="text-gray-600">
              Privacy: <span className="text-indigo-600 font-medium">privacy@davenroe.com</span>
              <br />
              US-specific privacy: <span className="text-indigo-600 font-medium">us-privacy@davenroe.com</span>
              <br />
              Security: <span className="text-indigo-600 font-medium">security@davenroe.com</span>
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
