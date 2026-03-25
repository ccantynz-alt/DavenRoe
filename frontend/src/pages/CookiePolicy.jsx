export default function CookiePolicy() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie &amp; Tracking Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: March 2026 | Version 2026.03.1</p>

      <div className="space-y-8">
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. What Are Cookies</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, keep you logged in, and understand how you use the service. Some cookies are essential for the platform to function; others help us improve the experience.
          </p>
        </section>

        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Cookies We Use</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium">Cookie</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Purpose</th>
                  <th className="pb-2 font-medium">Duration</th>
                  <th className="pb-2 font-medium">Required</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">astra_token</td>
                  <td className="py-2">Essential</td>
                  <td className="py-2">Authentication session — keeps you logged in</td>
                  <td className="py-2">60 minutes</td>
                  <td className="py-2 text-green-600 font-medium">Yes</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">astra_onboarded</td>
                  <td className="py-2">Essential</td>
                  <td className="py-2">Tracks whether you completed onboarding</td>
                  <td className="py-2">Persistent</td>
                  <td className="py-2 text-green-600 font-medium">Yes</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">astra_active_entity</td>
                  <td className="py-2">Functional</td>
                  <td className="py-2">Remembers your currently selected client entity</td>
                  <td className="py-2">Persistent</td>
                  <td className="py-2 text-amber-600 font-medium">Recommended</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">astra_consent_*</td>
                  <td className="py-2">Essential</td>
                  <td className="py-2">Records your acceptance of disclaimers and consent gates</td>
                  <td className="py-2">Persistent</td>
                  <td className="py-2 text-green-600 font-medium">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Third-Party Cookies</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            The following third-party services may set cookies when you use specific features of Astra:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium">Service</th>
                  <th className="pb-2 font-medium">Purpose</th>
                  <th className="pb-2 font-medium">When Active</th>
                  <th className="pb-2 font-medium">Their Policy</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b">
                  <td className="py-2 font-medium">Stripe</td>
                  <td className="py-2">Payment processing and fraud prevention</td>
                  <td className="py-2">When making a payment or managing billing</td>
                  <td className="py-2 text-blue-600">stripe.com/privacy</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Plaid</td>
                  <td className="py-2">Bank account connection (US/Canada)</td>
                  <td className="py-2">When connecting a bank feed</td>
                  <td className="py-2 text-blue-600">plaid.com/legal</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Basiq</td>
                  <td className="py-2">Bank account connection (AU/NZ)</td>
                  <td className="py-2">When connecting a bank feed</td>
                  <td className="py-2 text-blue-600">basiq.io/privacy</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">TrueLayer</td>
                  <td className="py-2">Bank account connection (UK/EU)</td>
                  <td className="py-2">When connecting a bank feed</td>
                  <td className="py-2 text-blue-600">truelayer.com/privacy</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-900 mb-3">4. What We Do NOT Do</h2>
          <ul className="space-y-2 text-sm text-red-800">
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#10005;</span> We do NOT use advertising cookies or tracking pixels</li>
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#10005;</span> We do NOT sell your browsing data to third parties</li>
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#10005;</span> We do NOT use cross-site tracking or retargeting</li>
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#10005;</span> We do NOT use Google Analytics, Facebook Pixel, or similar ad-tech tools</li>
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#10005;</span> We do NOT share cookie data with any entity not listed above</li>
          </ul>
        </section>

        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Managing Cookies</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            You can manage cookies through your browser settings. Note that disabling essential cookies (like the authentication token) will prevent you from logging in to Astra.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Most browsers allow you to: view what cookies are stored, delete specific cookies or all cookies, block cookies from specific sites, and block all third-party cookies. Refer to your browser's help documentation for instructions.
          </p>
        </section>

        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. GDPR &amp; CCPA Compliance</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Under the EU General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA), you have the right to know what data is collected, request deletion, and opt out of non-essential tracking.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Since Astra uses only essential and functional cookies (no advertising or analytics tracking), explicit cookie consent is not required under GDPR's "strictly necessary" exemption. However, we provide full transparency through this policy. If you have questions or wish to exercise your rights, contact <span className="font-medium text-gray-800">privacy@astra.ai</span>.
          </p>
        </section>

        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Changes to This Policy</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We may update this Cookie Policy from time to time to reflect changes in our practices or for regulatory reasons. We will post the updated policy on this page with a revised "Last Updated" date. Continued use of Astra after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <div className="text-center text-xs text-gray-400 py-4">
          Questions? Contact <span className="font-medium">privacy@astra.ai</span>
        </div>
      </div>
    </div>
  );
}
