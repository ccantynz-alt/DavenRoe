export default function CookiePolicy({ onBack }) {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <nav className="flex items-center justify-between px-6 lg:px-16 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">AlecRae</span>
        </div>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          &larr; Back to homepage
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 lg:px-16 py-16">
        <h1 className="text-4xl font-bold mb-2">Cookie &amp; Tracking Policy</h1>
        <p className="text-sm text-gray-400 mb-12">Last Updated: March 2026 &middot; Version 2026.03.1</p>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-12 text-sm text-indigo-800">
          <strong>Summary:</strong> AlecRae uses only essential and functional cookies to operate the platform. We do <strong>not</strong> use advertising cookies, cross-site tracking, or sell your data to third parties. You can manage optional cookies at any time through your browser settings.
        </div>

        <div className="space-y-10">
          <Section title="1. What Are Cookies">
            <p>
              Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, keep you logged in, and understand how you use the service. Some cookies are essential for the platform to function; others help us improve the experience. This policy explains which cookies AlecRae uses, why we use them, and how you can control them.
            </p>
          </Section>

          <Section title="2. Cookies We Use">
            <h3 className="font-semibold text-gray-900 mt-4 mb-3">2.1 Essential Cookies (Strictly Necessary)</h3>
            <p className="mb-3 text-sm">
              These cookies are required for AlecRae to function. They cannot be disabled without breaking core platform functionality.
            </p>
            <div className="space-y-2 mb-6">
              <CookieRow
                name="alecrae_token"
                purpose="Authentication session token. Keeps you logged in securely."
                duration="60 minutes (refreshed on activity)"
                type="Essential"
              />
              <CookieRow
                name="alecrae_onboarded"
                purpose="Tracks whether you have completed the onboarding flow."
                duration="Persistent"
                type="Essential"
              />
              <CookieRow
                name="alecrae_csrf"
                purpose="Cross-site request forgery protection token."
                duration="Session"
                type="Essential"
              />
              <CookieRow
                name="alecrae_consent_*"
                purpose="Records your acceptance of disclaimers and consent gates (e.g., forensic module, AI features)."
                duration="Persistent"
                type="Essential"
              />
            </div>

            <h3 className="font-semibold text-gray-900 mt-6 mb-3">2.2 Functional Cookies (Preferences)</h3>
            <p className="mb-3 text-sm">
              These cookies remember your preferences and settings to provide a better experience. They do not track you across other websites.
            </p>
            <div className="space-y-2 mb-6">
              <CookieRow
                name="alecrae_active_entity"
                purpose="Remembers your currently selected client entity for multi-entity users."
                duration="Persistent"
                type="Functional"
              />
              <CookieRow
                name="alecrae_theme"
                purpose="Stores your display preference (light/dark mode)."
                duration="1 year"
                type="Functional"
              />
              <CookieRow
                name="alecrae_locale"
                purpose="Stores your preferred language and date/number format."
                duration="1 year"
                type="Functional"
              />
              <CookieRow
                name="alecrae_sidebar"
                purpose="Remembers sidebar collapse/expand state."
                duration="1 year"
                type="Functional"
              />
            </div>

            <h3 className="font-semibold text-gray-900 mt-6 mb-3">2.3 Analytics Cookies (Optional)</h3>
            <p className="mb-3 text-sm">
              These cookies help us understand how users interact with AlecRae so we can improve the platform. They are <strong>optional</strong> and can be disabled.
            </p>
            <div className="space-y-2">
              <CookieRow
                name="alecrae_analytics"
                purpose="Anonymous usage analytics (page views, feature usage, performance metrics). No personal data is collected."
                duration="30 days"
                type="Optional"
              />
            </div>
          </Section>

          <Section title="3. Third-Party Cookies">
            <p className="mb-4">
              The following third-party services may set their own cookies when you use specific features of AlecRae. These cookies are governed by the respective third party&apos;s privacy and cookie policies.
            </p>
            <div className="space-y-3">
              <ThirdPartyCookie
                provider="Stripe"
                purpose="Payment processing and fraud prevention. Cookies are set when you enter payment information or manage billing."
                policyUrl="https://stripe.com/privacy"
              />
              <ThirdPartyCookie
                provider="Plaid (US/Canada)"
                purpose="Bank account connection. Cookies are set during the bank connection flow only."
                policyUrl="https://plaid.com/legal"
              />
              <ThirdPartyCookie
                provider="Basiq (Australia/New Zealand)"
                purpose="Bank account connection. Cookies are set during the bank connection flow only."
                policyUrl="https://basiq.io/privacy"
              />
              <ThirdPartyCookie
                provider="TrueLayer (UK/EU)"
                purpose="Bank account connection. Cookies are set during the bank connection flow only."
                policyUrl="https://truelayer.com/privacy"
              />
            </div>
          </Section>

          <Section title="4. What We Do NOT Do">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <ul className="space-y-2">
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
            </div>
          </Section>

          <Section title="5. Managing Cookies">
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
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 text-sm text-amber-800">
              <strong>Note:</strong> Disabling essential cookies (such as the authentication token) will prevent you from logging in to AlecRae. Disabling functional cookies may result in a degraded experience (e.g., preferences not being remembered between sessions).
            </div>
          </Section>

          <Section title="6. GDPR Compliance (EU/UK Users)">
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
              AlecRae&apos;s legal basis for essential cookies is <strong>legitimate interest</strong> (platform operation). Since AlecRae uses only essential and functional cookies with no advertising or analytics tracking by default, explicit cookie consent is not required under GDPR&apos;s &ldquo;strictly necessary&rdquo; exemption. We provide full transparency through this policy.
            </p>
          </Section>

          <Section title="7. CCPA/CPRA Compliance (California Users)">
            <p className="mb-3">
              Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):
            </p>
            <ul className="space-y-2 text-sm">
              {[
                'AlecRae does not sell your personal information, including cookie data',
                'AlecRae does not share your personal information for cross-context behavioural advertising',
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

          <Section title="8. Do Not Track">
            <p>
              AlecRae respects the &ldquo;Do Not Track&rdquo; (DNT) browser signal. When DNT is enabled, optional analytics cookies will not be set. Essential and functional cookies will continue to operate as they are required for platform functionality.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business practices. Material changes will be communicated via email or in-app notification at least 30 days before taking effect. The &ldquo;Last Updated&rdquo; date at the top of this page indicates when the policy was last revised.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Cookie enquiries: <span className="text-indigo-600 font-medium">privacy@alecrae.com</span> &middot;
              GDPR/DPO requests: <span className="text-indigo-600 font-medium">dpo@alecrae.com</span> &middot;
              General legal: <span className="text-indigo-600 font-medium">legal@alecrae.com</span>
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

function CookieRow({ name, purpose, duration, type }) {
  const typeColors = {
    Essential: 'bg-red-100 text-red-700',
    Functional: 'bg-blue-100 text-blue-700',
    Optional: 'bg-gray-100 text-gray-700',
  };
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <code className="text-sm font-mono text-indigo-600">{name}</code>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[type]}`}>{type}</span>
      </div>
      <p className="text-xs text-gray-600 mb-1">{purpose}</p>
      <p className="text-xs text-gray-400">Duration: {duration}</p>
    </div>
  );
}

function ThirdPartyCookie({ provider, purpose, policyUrl }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h4 className="font-semibold text-sm text-gray-800 mb-1">{provider}</h4>
      <p className="text-xs text-gray-600 mb-1">{purpose}</p>
      <a href={policyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 underline">
        View their privacy policy
      </a>
    </div>
  );
}
