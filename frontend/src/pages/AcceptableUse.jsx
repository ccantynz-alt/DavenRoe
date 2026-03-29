import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.1 },
  }),
};

export default function AcceptableUse({ onBack }) {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <nav className="flex items-center justify-between px-6 lg:px-16 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Astra</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          &larr; Back to homepage
        </Button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 lg:px-16 py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={fadeUp}>
          <h1 className="text-4xl font-bold mb-2">Acceptable Use Policy</h1>
          <p className="text-sm text-gray-400 mb-12">Last Updated: March 2026 &middot; Version 2026.03.1</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={fadeUp} custom={1}>
          <Card className="border-amber-200 bg-amber-50 mb-12">
            <CardContent className="p-4">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> This Acceptable Use Policy (&ldquo;AUP&rdquo;) governs your use of the Astra platform and all associated services. Violation of this policy may result in immediate account suspension or termination. This AUP is incorporated by reference into the <a href="/terms" className="text-amber-900 underline">Terms of Service</a>.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-10">
          <Section index={2} title="1. Scope">
            <p>
              This policy applies to all users of the Astra platform, including account holders, invited team members, client portal users, and any person who accesses Astra&apos;s features, outputs, or data through any means. &ldquo;Use&rdquo; includes accessing, uploading data to, generating outputs from, or relying upon any feature of the platform.
            </p>
          </Section>

          <Section index={3} title="2. Permitted Uses">
            <p className="mb-4">
              Astra is designed exclusively for <strong>lawful business financial management</strong>. Permitted uses include:
            </p>
            <ul className="space-y-2 text-sm">
              {[
                'Legitimate accounting and bookkeeping for your own business or your clients\' businesses',
                'Tax preparation, calculation, and return drafting for lawful tax compliance purposes',
                'Payroll processing for bona fide employees and contractors',
                'Financial analysis, reporting, and cash flow management',
                'Invoice creation, sending, and payment collection',
                'Bank feed reconciliation and transaction categorisation',
                'Forensic analysis for legitimate fraud prevention and internal audit purposes',
                'Document management and receipt scanning for expense tracking',
                'Use of AI features as a decision-support tool with appropriate human oversight',
                'Multi-entity and multi-jurisdiction management for legitimate business structures',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <span className="text-green-500 mt-0.5">&#10003;</span> {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section index={4} title="3. Prohibited Uses">
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">3.1 Financial Crime</h3>
            <p className="mb-3">You must not use Astra to facilitate, conceal, or further any financial crime, including but not limited to:</p>
            <ProhibitedList items={[
              'Money laundering or structuring transactions to avoid reporting thresholds',
              'Sanctions evasion or transactions involving sanctioned persons, entities, or jurisdictions',
              'Tax fraud, tax evasion, or the deliberate filing of false tax returns',
              'Invoice fraud, including creating fictitious invoices or inflating amounts',
              'Embezzlement, misappropriation of funds, or theft',
              'Financing of terrorism or other criminal activity',
            ]} />

            <h3 className="font-semibold text-gray-900 mt-4 mb-2">3.2 Misuse of AI Outputs</h3>
            <ProhibitedList items={[
              'Presenting AI-generated outputs as professional accounting, tax, legal, or financial advice without independent review by a qualified professional',
              'Submitting AI-drafted tax returns to tax authorities without review by a registered tax agent, CPA, or enrolled agent',
              'Relying on AI categorisation or financial health scores for material business decisions without verification',
              'Using AI-generated narratives in regulatory filings, court documents, or statutory declarations without independent verification',
            ]} />

            <h3 className="font-semibold text-gray-900 mt-4 mb-2">3.3 Misuse of Forensic Tools</h3>
            <ProhibitedList items={[
              'Using forensic analysis outputs (Benford\'s Law, ghost vendor detection, money trail) to harass, intimidate, or discriminate against employees or contractors',
              'Taking disciplinary or legal action against any person based solely on automated forensic alerts without independent investigation',
              'Violating employment law, workplace privacy regulations, or whistleblower protections based on Astra outputs',
              'Using forensic tools to conduct surveillance beyond the scope of legitimate financial audit',
            ]} />

            <h3 className="font-semibold text-gray-900 mt-4 mb-2">3.4 Platform Security &amp; Integrity</h3>
            <ProhibitedList items={[
              'Sharing login credentials with unauthorised third parties',
              'Allowing access to your account by persons not authorised under your subscription',
              'Reverse engineering, decompiling, or disassembling any part of the Astra platform',
              'Scraping, crawling, or automated extraction of data from the platform',
              'Attempting to bypass rate limits, access controls, or security measures',
              'Introducing malicious code, viruses, or harmful software',
              'Accessing or attempting to access another user\'s data or account',
              'Using the platform to generate spam, unsolicited communications, or phishing content',
            ]} />

            <h3 className="font-semibold text-gray-900 mt-4 mb-2">3.5 Other Prohibited Conduct</h3>
            <ProhibitedList items={[
              'Using Astra for any purpose that violates applicable local, state, national, or international law',
              'Creating accounts under false identities or with fraudulent business information',
              'Reselling, sublicensing, or redistributing access to the platform without written authorisation',
              'Using the platform to process data for businesses or entities you are not authorised to represent',
            ]} />
          </Section>

          <Section index={5} title="4. Consequences of Violation">
            <Card className="border-red-200 bg-red-50 mb-4">
              <CardContent className="p-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Violations of this Acceptable Use Policy may result in immediate and severe consequences, including permanent loss of access to the platform and all associated data.
                </p>
              </CardContent>
            </Card>
            <p className="mb-4">Astra reserves the right, at its sole discretion, to take any or all of the following actions upon detecting or receiving a report of a violation:</p>
            <ul className="space-y-2 text-sm">
              {[
                'Immediate suspension of your account and all associated user accounts',
                'Permanent termination of your subscription without refund for any remaining prepaid period',
                'Preservation and disclosure of your account data to law enforcement, regulatory authorities, or tax agencies as required by applicable law or as reasonably necessary',
                'Referral of suspected criminal activity to appropriate law enforcement agencies',
                'Pursuit of civil remedies including damages, injunctive relief, and recovery of legal costs',
                'Notification to relevant professional bodies (e.g., CPA boards, tax practitioner boards) where a professional user has engaged in misconduct',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <span className="text-red-400 mt-0.5">&#8226;</span> {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 font-semibold text-sm">
              No refund will be issued for accounts terminated due to a violation of this policy.
            </p>
          </Section>

          <Section index={6} title="5. Monitoring &amp; Enforcement">
            <p className="mb-3">
              Astra employs automated and manual monitoring to detect violations of this policy. This includes anomaly detection on usage patterns, audit logging of all platform actions, and periodic review of flagged accounts. All monitoring is conducted in accordance with our <a href="/privacy" className="text-indigo-600 underline">Privacy Policy</a>.
            </p>
            <p>
              Astra is not obligated to actively monitor all user activity but reserves the right to investigate any suspected violation and to take action as described in Section 4.
            </p>
          </Section>

          <Section index={7} title="6. Reporting Violations">
            <p className="mb-3">
              If you become aware of any violation of this policy, or if you believe another user is engaging in prohibited conduct, please report it immediately:
            </p>
            <Card className="border-gray-100 bg-gray-50 shadow-none">
              <CardContent className="p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Email:</strong> <span className="text-indigo-600 font-medium">abuse@astra.ai</span>
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Include:</strong> A description of the suspected violation, the user or account involved (if known), and any supporting evidence.
                </p>
                <p className="text-sm text-gray-500">
                  All reports are treated confidentially. Astra will not retaliate against any user who reports a violation in good faith.
                </p>
              </CardContent>
            </Card>
          </Section>

          <Section index={8} title="7. Changes to This Policy">
            <p>
              Astra may update this Acceptable Use Policy at any time. Material changes will be communicated via email and in-app notification at least 14 days before taking effect. Continued use of the platform after the effective date constitutes acceptance of the updated policy. The current version is always available at <a href="/acceptable-use" className="text-indigo-600 underline">astra.ai/acceptable-use</a>.
            </p>
          </Section>

          <Section index={9} title="8. Contact">
            <p>
              Abuse reports: <span className="text-indigo-600 font-medium">abuse@astra.ai</span> &middot;
              Legal: <span className="text-indigo-600 font-medium">legal@astra.ai</span> &middot;
              Privacy: <span className="text-indigo-600 font-medium">privacy@astra.ai</span>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, index = 0 }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={fadeUp}
      custom={index}
    >
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="text-gray-600 leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}

function ProhibitedList({ items }) {
  return (
    <ul className="space-y-2 text-sm mb-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-gray-600">
          <span className="text-red-400 mt-0.5">&#10005;</span> {item}
        </li>
      ))}
    </ul>
  );
}
