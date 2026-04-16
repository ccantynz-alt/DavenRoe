export default function AIDisclosure({ onBack }) {
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
        <h1 className="text-4xl font-bold mb-2">AI Disclosure &amp; Transparency Statement</h1>
        <p className="text-sm text-gray-400 mb-12">Last Updated: March 2026</p>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-12 text-sm text-indigo-800">
          <strong>Our Commitment:</strong> DavenRoe uses artificial intelligence in specific, clearly defined areas. This document explains exactly what the AI does and does not do, how your data is handled, and how you maintain full control over every AI-generated output.
        </div>

        <div className="space-y-10">
          <Section title="1. AI Model Information">
            <p className="mb-3">
              DavenRoe integrates with <strong>Anthropic&apos;s Claude</strong> large language model for its AI-powered features. Claude is used exclusively through Anthropic&apos;s commercial API under enterprise terms.
            </p>
            <ul className="space-y-2 text-sm">
              {[
                'Provider: Anthropic (Claude)',
                'Your data is sent to Anthropic\'s API for processing of AI features only',
                'Per Anthropic\'s commercial terms, your data is NOT used to train AI models',
                'API inputs and outputs are retained by Anthropic for up to 30 days for trust and safety purposes, then deleted',
                'No other third-party AI models are used in any DavenRoe feature',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <span className="text-indigo-500 mt-0.5">&#8226;</span> {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="2. Deterministic (Non-AI) Components">
            <p className="mb-4">
              The following components use <strong>hard-coded logic derived from published legislation</strong>. No AI is involved. These are mathematically verifiable and produce identical results every time:
            </p>
            <div className="space-y-3">
              <DeterministicItem
                title="Tax Rate Registry"
                description="Calculates GST, VAT, income tax, and corporate tax"
                source="Published legislation (cited per rate)"
              />
              <DeterministicItem
                title="Treaty Engine"
                description="Applies bilateral DTA withholding rates across 6 tax treaties"
                source="Published treaty texts"
              />
              <DeterministicItem
                title="Audit Risk Scorer"
                description="Flags transactions based on regulatory reporting thresholds"
                source="Regulatory thresholds (AUSTRAC, FinCEN, HMRC, IRD)"
              />
              <DeterministicItem
                title="Double-Entry Validation"
                description="Ensures debits equal credits on every transaction"
                source="Generally Accepted Accounting Principles (GAAP)"
              />
              <DeterministicItem
                title="Forensic Engines"
                description="Benford's Law analysis, statistical anomaly detection, vendor concentration scoring"
                source="Established statistical and forensic accounting methods"
              />
            </div>
          </Section>

          <Section title="3. AI-Powered (Probabilistic) Components">
            <p className="mb-4">
              The following components use the Claude AI model. Their outputs are <strong>suggestions, not decisions</strong>. Every AI output is clearly labelled as AI-generated within the interface.
            </p>
            <div className="space-y-3">
              <AIItem
                title="Transaction Categoriser"
                description="Suggests account categories for bank feed transactions"
                confidence="Yes (0-100% confidence score displayed)"
                review="Required before posting"
              />
              <AIItem
                title="Financial Narrator"
                description="Writes plain-English summaries of financial data, reports, and trends"
                confidence="N/A (narrative content)"
                review="Recommended"
              />
              <AIItem
                title="Due Diligence Reporter"
                description="Generates forensic analysis reports and risk assessments"
                confidence="N/A (narrative content)"
                review="Required before any action"
              />
              <AIItem
                title="Natural Language Queries (Ask DavenRoe)"
                description="Answers questions about your financial data in conversational language"
                confidence="N/A (conversational)"
                review="Recommended"
              />
              <AIItem
                title="AI Command Center"
                description="Cash flow forecasts, anomaly detection alerts, and AI-generated weekly digests"
                confidence="Confidence ranges shown where applicable"
                review="Recommended"
              />
            </div>
          </Section>

          <Section title="4. Key Principles">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
              <strong>Fundamental Rule:</strong> AI never files anything, never moves money, and always requires human approval before any output is acted upon.
            </div>
            <div className="space-y-4">
              {[
                {
                  principle: 'AI never files anything.',
                  detail: 'Tax returns, BAS, GST returns, VAT returns, and 1099s are drafted by the system but require explicit human review and submission. DavenRoe does not transmit any filing to any tax authority without your express action.',
                },
                {
                  principle: 'AI never moves money.',
                  detail: 'DavenRoe reads bank feeds through Plaid, Basiq, and TrueLayer but cannot initiate transactions, transfers, payments, or any financial movement.',
                },
                {
                  principle: 'AI always shows its work.',
                  detail: 'Every AI categorisation includes a confidence score (0-100%) and a reasoning explanation. You can see why the AI made each suggestion.',
                },
                {
                  principle: 'AI suggestions are always reviewable.',
                  detail: 'The Review Queue shows every AI-drafted transaction for human approval before posting to the general ledger. Nothing is posted automatically.',
                },
                {
                  principle: 'Tax math is never AI.',
                  detail: 'All tax calculations use deterministic logic derived from published legislation. The AI writes narratives about tax data but never computes tax amounts, rates, or withholdings.',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.principle}</p>
                    <p className="text-sm text-gray-600">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="5. How to Override AI Decisions">
            <p className="mb-4">
              Every AI suggestion in DavenRoe can be handled in one of four ways. You are always in control:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { action: 'Approve', description: 'Accept the AI suggestion as-is and post to the ledger', icon: '&#10003;', color: 'text-green-600' },
                { action: 'Edit', description: 'Modify the AI suggestion before approval — change the category, amount, or description', icon: '&#9998;', color: 'text-blue-600' },
                { action: 'Flag', description: 'Mark the item for professional review by a qualified accountant or tax agent', icon: '&#9873;', color: 'text-amber-600' },
                { action: 'Void', description: 'Reject the AI suggestion entirely — the transaction returns to an unprocessed state', icon: '&#10005;', color: 'text-red-600' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${item.color} text-lg`} dangerouslySetInnerHTML={{ __html: item.icon }} />
                    <span className="font-semibold text-sm text-gray-900">{item.action}</span>
                  </div>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="6. Data Usage &amp; Privacy">
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">6.1 What Data Is Sent to the AI</h3>
            <p className="mb-3">
              Only the minimum data necessary for each AI feature is sent to the Anthropic API. This includes transaction descriptions, amounts, and categories for the categoriser; financial summaries for the narrator; and your natural language queries for Ask DavenRoe.
            </p>
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">6.2 What Data Is Never Sent to the AI</h3>
            <ul className="space-y-2 text-sm mb-4">
              {[
                'Your password or authentication credentials',
                'Bank account numbers, routing numbers, or sort codes',
                'Credit card numbers or payment instrument details',
                'Government-issued identification numbers (TFN, SSN, IRD, NI)',
                'Encryption keys or API tokens',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <span className="text-red-400 mt-0.5">&#10005;</span> {item}
                </li>
              ))}
            </ul>
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">6.3 No Model Training</h3>
            <p>
              Under Anthropic&apos;s commercial API terms, your data is <strong>not used to train, fine-tune, or improve AI models</strong>. Data sent to the API is processed for your request and retained for up to 30 days for trust and safety monitoring, then permanently deleted.
            </p>
          </Section>

          <Section title="7. Transparency Reporting">
            <p>
              DavenRoe is committed to ongoing transparency about its AI usage. If DavenRoe adds new AI-powered features, changes AI providers, or materially alters how AI is used in the platform, this disclosure will be updated and users will be notified via email and in-app notification at least 14 days before any change takes effect.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              AI-related enquiries: <span className="text-indigo-600 font-medium">ai@davenroe.com</span> &middot;
              Privacy: <span className="text-indigo-600 font-medium">privacy@davenroe.com</span> &middot;
              Legal: <span className="text-indigo-600 font-medium">legal@davenroe.com</span>
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

function DeterministicItem({ title, description, source }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h4 className="font-semibold text-sm text-gray-800 mb-1">{title}</h4>
      <p className="text-xs text-gray-600 mb-1">{description}</p>
      <p className="text-xs text-gray-400">Source: {source}</p>
    </div>
  );
}

function AIItem({ title, description, confidence, review }) {
  return (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3">
      <h4 className="font-semibold text-sm text-gray-800 mb-1">{title}</h4>
      <p className="text-xs text-gray-600 mb-2">{description}</p>
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="text-gray-500"><strong>Confidence:</strong> {confidence}</span>
        <span className="text-gray-500"><strong>Human Review:</strong> {review}</span>
      </div>
    </div>
  );
}
