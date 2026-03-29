import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.1 },
  }),
};

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
        <Button variant="ghost" size="sm" onClick={onBack}>
          &larr; Back to homepage
        </Button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 lg:px-16 py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={fadeUp}>
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-12">Last Updated: March 2026 &middot; Version 2026.03.3</p>
        </motion.div>

        <div className="prose prose-gray max-w-none space-y-10">
          <Section index={1} title="1. Who We Are">
            <p className="text-gray-600">
              Astra is operated by a New Zealand entity. We provide an AI-assisted accounting software tool to users in New Zealand, Australia, the United Kingdom, the European Union, the United States, and Canada.
            </p>
          </Section>

          <Section index={2} title="2. Data We Collect">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Retention</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell>Account info (name, email, IP)</TableCell><TableCell>Authentication, security</TableCell><TableCell>Until account deletion</TableCell></TableRow>
                <TableRow><TableCell>Business entity data</TableCell><TableCell>Accounting operations</TableCell><TableCell>Until account deletion</TableCell></TableRow>
                <TableRow><TableCell>Bank feed transactions</TableCell><TableCell>Automated bookkeeping</TableCell><TableCell>7 years (regulatory)</TableCell></TableRow>
                <TableRow><TableCell>Invoices and documents</TableCell><TableCell>Record keeping</TableCell><TableCell>7 years (regulatory)</TableCell></TableRow>
                <TableRow><TableCell>Payroll &amp; tax filing data</TableCell><TableCell>Payroll, tax compliance</TableCell><TableCell>7 years (regulatory)</TableCell></TableRow>
                <TableRow><TableCell>Expense/receipt data</TableCell><TableCell>Expense management</TableCell><TableCell>7 years (regulatory)</TableCell></TableRow>
                <TableRow><TableCell>AI interaction logs</TableCell><TableCell>Service improvement, audit</TableCell><TableCell>90 days</TableCell></TableRow>
                <TableRow><TableCell>Usage analytics</TableCell><TableCell>Product improvement</TableCell><TableCell>12 months</TableCell></TableRow>
                <TableRow><TableCell>Consent records</TableCell><TableCell>Legal compliance</TableCell><TableCell>Account + 7 years</TableCell></TableRow>
              </TableBody>
            </Table>
          </Section>

          <Section index={3} title="3. Third-Party Data Processors">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Data Shared</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell>Anthropic (Claude)</TableCell><TableCell>AI categorisation &amp; narratives</TableCell><TableCell>Transaction descriptions, amounts</TableCell></TableRow>
                <TableRow><TableCell>Plaid</TableCell><TableCell>US/Canada bank feeds</TableCell><TableCell>Bank credentials (tokenised)</TableCell></TableRow>
                <TableRow><TableCell>Basiq</TableCell><TableCell>AU/NZ bank feeds</TableCell><TableCell>Bank credentials (tokenised)</TableCell></TableRow>
                <TableRow><TableCell>TrueLayer</TableCell><TableCell>UK/EU bank feeds</TableCell><TableCell>Bank credentials (tokenised)</TableCell></TableRow>
                <TableRow><TableCell>Neon (PostgreSQL)</TableCell><TableCell>Database hosting</TableCell><TableCell>All stored data (encrypted)</TableCell></TableRow>
                <TableRow><TableCell>Stripe</TableCell><TableCell>Payment processing</TableCell><TableCell>Payment details</TableCell></TableRow>
                <TableRow><TableCell>Mailgun</TableCell><TableCell>Transactional email</TableCell><TableCell>Email address, name</TableCell></TableRow>
              </TableBody>
            </Table>
          </Section>

          <Section index={4} title="4. We Do NOT">
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Sell or share your personal information (as defined by CCPA/CPRA or any law)</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Use your financial data for advertising or behavioural profiling</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Share data between client entities</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Train AI models on your financial data</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Store bank login credentials (tokenised via Plaid/Basiq/TrueLayer)</li>
              <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Knowingly collect data from children under 16</li>
            </ul>
          </Section>

          <Section index={5} title="5. Your Rights (All Users)">
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
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeUp}
            custom={6}
          >
            <Card className="border-2 border-blue-200 bg-blue-50/30">
              <CardContent className="p-6">
                <Section index={0} title="6. United States — CCPA/CPRA & State Privacy Laws">
                  <Card className="border-blue-200 bg-blue-100 shadow-none mb-6">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-800">
                        <strong>California Residents:</strong> You have additional rights under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA).
                      </p>
                    </CardContent>
                  </Card>

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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Collected?</TableHead>
                        <TableHead className="text-xs">Sold/Shared?</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow><TableCell className="text-xs">Identifiers (name, email, IP)</TableCell><TableCell className="text-xs">Yes</TableCell><TableCell className="text-xs font-semibold text-red-600">No</TableCell></TableRow>
                      <TableRow><TableCell className="text-xs">Financial information</TableCell><TableCell className="text-xs">Yes</TableCell><TableCell className="text-xs font-semibold text-red-600">No</TableCell></TableRow>
                      <TableRow><TableCell className="text-xs">Commercial information</TableCell><TableCell className="text-xs">Yes</TableCell><TableCell className="text-xs font-semibold text-red-600">No</TableCell></TableRow>
                      <TableRow><TableCell className="text-xs">Internet/network activity</TableCell><TableCell className="text-xs">Yes</TableCell><TableCell className="text-xs font-semibold text-red-600">No</TableCell></TableRow>
                      <TableRow><TableCell className="text-xs">Geolocation (country from IP)</TableCell><TableCell className="text-xs">Yes</TableCell><TableCell className="text-xs font-semibold text-red-600">No</TableCell></TableRow>
                      <TableRow><TableCell className="text-xs">Sensitive PI (SSN, bank accounts)</TableCell><TableCell className="text-xs">If provided</TableCell><TableCell className="text-xs font-semibold text-red-600">No</TableCell></TableRow>
                    </TableBody>
                  </Table>

                  <h3 className="font-bold text-gray-900 mt-6 mb-3">Other US State Privacy Laws</h3>
                  <p className="text-sm text-gray-600">
                    If you reside in Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Montana, or another US state with a comprehensive privacy law, you have similar rights to access, delete, correct, and opt out. We do not sell data or engage in targeted advertising. Exercise rights at <span className="text-indigo-600 font-medium">privacy@astra.ai</span>. Appeals: email with subject &ldquo;Privacy Appeal.&rdquo;
                  </p>

                  <h3 className="font-bold text-gray-900 mt-4 mb-3">How to Exercise Rights</h3>
                  <p className="text-sm text-gray-600">
                    Email <span className="text-indigo-600 font-medium">privacy@astra.ai</span> from your registered email. We verify identity via account credentials. Response within 45 days (may extend by 45 days with notice). Authorised agents must provide written authorisation.
                  </p>
                </Section>
              </CardContent>
            </Card>
          </motion.div>

          <Section index={7} title="7. Jurisdiction-Specific Compliance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { region: 'Australia', text: 'Privacy Act 1988 & APPs. Notifiable Data Breaches scheme. Complaints to OAIC.' },
                { region: 'New Zealand', text: 'Privacy Act 2020. Complaints to Office of the Privacy Commissioner.' },
                { region: 'United Kingdom', text: 'UK GDPR & Data Protection Act 2018. ICO registration. Complaints to ICO.' },
                { region: 'European Union', text: 'EU GDPR. Standard Contractual Clauses for international transfers. Local supervisory authority.' },
              ].map((item, i) => (
                <Card key={i} className="border-gray-100 bg-gray-50 shadow-none">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm text-gray-800 mb-2">{item.region}</h4>
                    <p className="text-xs text-gray-600">{item.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>

          <Section index={8} title="8. Data Security">
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> All data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> Database-level entity isolation — no cross-entity data leakage</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> Role-based access control with 5 permission levels</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> Immutable hash-chain audit trail for all modifications</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span> MFA available for all accounts</li>
            </ul>
          </Section>

          <Section index={9} title="9. Data Breach Response">
            <p className="text-gray-600 text-sm">
              Affected users notified within <strong>72 hours</strong>. Regulatory authorities notified as required (OAIC, Privacy Commissioner NZ, ICO, US state AGs). For US users: we comply with all state breach notification laws including California (Cal. Civ. Code &sect; 1798.82) and New York (NY Gen. Bus. Law &sect; 899-AA).
            </p>
          </Section>

          <Section index={10} title="10. Contact">
            <p className="text-gray-600">
              Privacy: <span className="text-indigo-600 font-medium">privacy@astra.ai</span>
              <br />
              US-specific privacy: <span className="text-indigo-600 font-medium">us-privacy@astra.ai</span>
              <br />
              Security: <span className="text-indigo-600 font-medium">security@astra.ai</span>
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
      {children}
    </motion.div>
  );
}
