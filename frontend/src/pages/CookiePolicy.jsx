import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.1 },
  }),
};

export default function CookiePolicy({ onBack }) {
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
          <h1 className="text-4xl font-bold mb-2">Cookie &amp; Tracking Policy</h1>
          <p className="text-sm text-gray-400 mb-12">Last Updated: March 2026 &middot; Version 2026.03.1</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={fadeUp} custom={1}>
          <Card className="border-indigo-200 bg-indigo-50 mb-12">
            <CardContent className="p-4">
              <p className="text-sm text-indigo-800">
                <strong>Summary:</strong> Astra uses only essential and functional cookies to operate the platform. We do <strong>not</strong> use advertising cookies, cross-site tracking, or sell your data to third parties. You can manage optional cookies at any time through your browser settings.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-10">
          <Section index={2} title="1. What Are Cookies">
            <p>
              Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, keep you logged in, and understand how you use the service. Some cookies are essential for the platform to function; others help us improve the experience. This policy explains which cookies Astra uses, why we use them, and how you can control them.
            </p>
          </Section>

          <Section index={3} title="2. Cookies We Use">
            <h3 className="font-semibold text-gray-900 mt-4 mb-3">2.1 Essential Cookies (Strictly Necessary)</h3>
            <p className="mb-3 text-sm">
              These cookies are required for Astra to function. They cannot be disabled without breaking core platform functionality.
            </p>
            <div className="space-y-2 mb-6">
              <CookieRow name="astra_token" purpose="Authentication session token. Keeps you logged in securely." duration="60 minutes (refreshed on activity)" type="Essential" />
              <CookieRow name="astra_onboarded" purpose="Tracks whether you have completed the onboarding flow." duration="Persistent" type="Essential" />
              <CookieRow name="astra_csrf" purpose="Cross-site request forgery protection token." duration="Session" type="Essential" />
              <CookieRow name="astra_consent_*" purpose="Records your acceptance of disclaimers and consent gates (e.g., forensic module, AI features)." duration="Persistent" type="Essential" />
            </div>

            <h3 className="font-semibold text-gray-900 mt-6 mb-3">2.2 Functional Cookies (Preferences)</h3>
            <p className="mb-3 text-sm">
              These cookies remember your preferences and settings to provide a better experience. They do not track you across other websites.
            </p>
            <div className="space-y-2 mb-6">
              <CookieRow name="astra_active_entity" purpose="Remembers your currently selected client entity for multi-entity users." duration="Persistent" type="Functional" />
              <CookieRow name="astra_theme" purpose="Stores your display preference (light/dark mode)." duration="1 year" type="Functional" />
              <CookieRow name="astra_locale" purpose="Stores your preferred language and date/number format." duration="1 year" type="Functional" />
              <CookieRow name="astra_sidebar" purpose="Remembers sidebar collapse/expand state." duration="1 year" type="Functional" />
            </div>

            <h3 className="font-semibold text-gray-900 mt-6 mb-3">2.3 Analytics Cookies (Optional)</h3>
            <p className="mb-3 text-sm">
              These cookies help us understand how users interact with Astra so we can improve the platform. They are <strong>optional</strong> and can be disabled.
            </p>
            <div className="space-y-2">
              <CookieRow name="astra_analytics" purpose="Anonymous usage analytics (page views, feature usage, performance metrics). No personal data is collected." duration="30 days" type="Optional" />
            </div>
          </Section>

          <Section index={4} title="3. Third-Party Cookies">
            <p className="mb-4">
              The following third-party services may set their own cookies when you use specific features of Astra. These cookies are governed by the respective third party&apos;s privacy and cookie policies.
            </p>
            <div className="space-y-3">
              <ThirdPartyCookie provider="Stripe" purpose="Payment processing and fraud prevention. Cookies are set when you enter payment information or manage billing." policyUrl="https://stripe.com/privacy" />
              <ThirdPartyCookie provider="Plaid (US/Canada)" purpose="Bank account connection. Cookies are set during the bank connection flow only." policyUrl="https://plaid.com/legal" />
              <ThirdPartyCookie provider="Basiq (Australia/New Zealand)" purpose="Bank account connection. Cookies are set during the bank connection flow only." policyUrl="https://basiq.io/privacy" />
              <ThirdPartyCookie provider="TrueLayer (UK/EU)" purpose="Bank account connection. Cookies are set during the bank connection flow only." policyUrl="https://truelayer.com/privacy" />
            </div>
          </Section>

          <Section index={5} title="4. What We Do NOT Do">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <ul className="space-y-2 text-sm text-red-800">
                  {[
                    'We do NOT use advertising cookies or tracking pixels',
                    'We do NOT sell your browsing data to third parties',
                    'We do NOT use cross-site tracking or retargeting',
                    'We do NOT use Google Analytics, Facebook Pixel, or similar ad-tech tools',
                    'We do NOT share cookie data with any entity not listed in Section 3',
                    'We do NOT participate in advertising networks or data exchanges',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-500 font-bold mt-0.5">&#10005;</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Section>

          <Section index={6} title="5. Managing Cookies">
            <p className="mb-4">
              You can control cookies through your browser settings. Here is how to manage cookies in common browsers:
            </p>
            <ul className="space-y-2 text-sm">
              {[
                'Chrome: Settings > Privacy and Security > Cookies and other site data',
                'Firefox: Settings > Privacy & Security > Cookies and Site Data',
                'Safari: Preferences > Privacy > Manage Website Data',
                'Edge: Settings > Privacy, search, and services > Cookies and site permissions',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <span className="text-indigo-500 mt-0.5">&#8226;</span> {item}
                </li>
              ))}
            </ul>
            <Card className="border-amber-200 bg-amber-50 mt-4">
              <CardContent className="p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Disabling essential cookies (such as the authentication token) will prevent you from logging in to Astra. Disabling functional cookies may result in a degraded experience (e.g., preferences not being remembered between sessions).
                </p>
              </CardContent>
            </Card>
          </Section>

          <Section index={7} title="6. GDPR Compliance (EU/UK Users)">
            <p className="mb-3">
              Under the General Data Protection Regulation (GDPR) and the UK Data Protection Act 2018, you have the following rights regarding cookies and tracking:
            </p>
            <ul className="space-y-2 text-sm">
              {[
                'Right to be informed about what cookies are used and why (this policy)',
                'Right to consent — optional cookies are not set without your consent',
                'Right to withdraw consent at any time by clearing cookies or adjusting browser settings',
                'Right to access — you can request a full list of data collected via cookies',
                'Right to erasure — you can request deletion of all cookie-related data',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <span className="text-indigo-500 mt-0.5">&#8226;</span> {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              Astra&apos;s legal basis for essential cookies is <strong>legitimate interest</strong> (platform operation). Since Astra uses only essential and functional cookies with no advertising or analytics tracking by default, explicit cookie consent is not required under GDPR&apos;s &ldquo;strictly necessary&rdquo; exemption. We provide full transparency through this policy.
            </p>
          </Section>

          <Section index={8} title="7. CCPA/CPRA Compliance (California Users)">
            <p className="mb-3">
              Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):
            </p>
            <ul className="space-y-2 text-sm">
              {[
                'Astra does not sell your personal information, including cookie data',
                'Astra does not share your personal information for cross-context behavioural advertising',
                'You have the right to know what personal information is collected via cookies',
                'You have the right to delete personal information collected via cookies',
                'You have the right to opt out of the sale or sharing of personal information (not applicable — we do not sell or share)',
                'You will not be discriminated against for exercising your privacy rights',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <span className="text-indigo-500 mt-0.5">&#8226;</span> {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section index={9} title="8. Do Not Track">
            <p>
              Astra respects the &ldquo;Do Not Track&rdquo; (DNT) browser signal. When DNT is enabled, optional analytics cookies will not be set. Essential and functional cookies will continue to operate as they are required for platform functionality.
            </p>
          </Section>

          <Section index={10} title="9. Changes to This Policy">
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business practices. Material changes will be communicated via email or in-app notification at least 30 days before taking effect. The &ldquo;Last Updated&rdquo; date at the top of this page indicates when the policy was last revised.
            </p>
          </Section>

          <Section index={11} title="10. Contact">
            <p>
              Cookie enquiries: <span className="text-indigo-600 font-medium">privacy@astra.ai</span> &middot;
              GDPR/DPO requests: <span className="text-indigo-600 font-medium">dpo@astra.ai</span> &middot;
              General legal: <span className="text-indigo-600 font-medium">legal@astra.ai</span>
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

function CookieRow({ name, purpose, duration, type }) {
  const typeVariant = {
    Essential: 'destructive',
    Functional: 'default',
    Optional: 'secondary',
  };
  return (
    <Card className="border-gray-100 bg-gray-50 shadow-none">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <code className="text-sm font-mono text-indigo-600">{name}</code>
          <Badge variant={typeVariant[type]}>{type}</Badge>
        </div>
        <p className="text-xs text-gray-600 mb-1">{purpose}</p>
        <p className="text-xs text-gray-400">Duration: {duration}</p>
      </CardContent>
    </Card>
  );
}

function ThirdPartyCookie({ provider, purpose, policyUrl }) {
  return (
    <Card className="border-gray-100 bg-gray-50 shadow-none">
      <CardContent className="p-3">
        <h4 className="font-semibold text-sm text-gray-800 mb-1">{provider}</h4>
        <p className="text-xs text-gray-600 mb-1">{purpose}</p>
        <a href={policyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 underline">
          View their privacy policy
        </a>
      </CardContent>
    </Card>
  );
}
