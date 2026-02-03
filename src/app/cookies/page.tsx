import { Header, Footer } from '@/components';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-8">Cookie Policy</h1>

          <div className="prose prose-zinc max-w-none">
            <p className="text-[var(--muted)] text-lg mb-8">
              Last updated: February 2026
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">1. What Are Cookies?</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and give website owners information about how their site is being used.
                </p>
                <p className="text-[var(--foreground)]">
                  This Cookie Policy explains how internship.sg ("we", "our", or "us") uses cookies and similar technologies in compliance with Singapore&apos;s Personal Data Protection Act 2012 (PDPA).
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">2. Types of Cookies We Use</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Essential Cookies (Strictly Necessary)</h3>
                  <p className="text-[var(--foreground)] mb-2">
                    These cookies are required for the website to function properly. Without them, some features may not work correctly.
                  </p>
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 mt-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[var(--muted)]">
                          <th className="text-left pb-2">Cookie Name</th>
                          <th className="text-left pb-2">Purpose</th>
                          <th className="text-left pb-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--foreground)]">
                        <tr>
                          <td className="py-1">session_id</td>
                          <td className="py-1">Maintains user session</td>
                          <td className="py-1">Session</td>
                        </tr>
                        <tr>
                          <td className="py-1">csrf_token</td>
                          <td className="py-1">Security token</td>
                          <td className="py-1">Session</td>
                        </tr>
                        <tr>
                          <td className="py-1">cookie_consent</td>
                          <td className="py-1">Stores consent preferences</td>
                          <td className="py-1">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Functional Cookies</h3>
                  <p className="text-[var(--foreground)] mb-2">
                    These cookies enable enhanced functionality and personalization, such as remembering your preferences.
                  </p>
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 mt-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[var(--muted)]">
                          <th className="text-left pb-2">Cookie Name</th>
                          <th className="text-left pb-2">Purpose</th>
                          <th className="text-left pb-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--foreground)]">
                        <tr>
                          <td className="py-1">user_preferences</td>
                          <td className="py-1">Stores display preferences</td>
                          <td className="py-1">1 year</td>
                        </tr>
                        <tr>
                          <td className="py-1">recent_searches</td>
                          <td className="py-1">Remembers recent job searches</td>
                          <td className="py-1">30 days</td>
                        </tr>
                        <tr>
                          <td className="py-1">language</td>
                          <td className="py-1">Language preference</td>
                          <td className="py-1">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Analytics Cookies</h3>
                  <p className="text-[var(--foreground)] mb-2">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 mt-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[var(--muted)]">
                          <th className="text-left pb-2">Cookie Name</th>
                          <th className="text-left pb-2">Purpose</th>
                          <th className="text-left pb-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--foreground)]">
                        <tr>
                          <td className="py-1">_ga</td>
                          <td className="py-1">Google Analytics - Distinguishes users</td>
                          <td className="py-1">2 years</td>
                        </tr>
                        <tr>
                          <td className="py-1">_gid</td>
                          <td className="py-1">Google Analytics - Distinguishes users</td>
                          <td className="py-1">24 hours</td>
                        </tr>
                        <tr>
                          <td className="py-1">_gat</td>
                          <td className="py-1">Google Analytics - Throttle requests</td>
                          <td className="py-1">1 minute</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Marketing Cookies</h3>
                  <p className="text-[var(--foreground)] mb-2">
                    These cookies are used to track visitors across websites to display relevant advertisements. We currently do not use marketing cookies, but this may change in the future with your consent.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">3. PDPA Compliance</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  In accordance with Singapore&apos;s Personal Data Protection Act (PDPA), we are committed to:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li><strong>Consent:</strong> Obtaining your consent before placing non-essential cookies on your device</li>
                  <li><strong>Purpose Limitation:</strong> Only using cookies for the purposes stated in this policy</li>
                  <li><strong>Notification:</strong> Informing you about our cookie usage through this policy and our consent banner</li>
                  <li><strong>Access and Correction:</strong> Allowing you to manage your cookie preferences at any time</li>
                  <li><strong>Protection:</strong> Ensuring cookie data is handled securely and not shared inappropriately</li>
                  <li><strong>Retention:</strong> Not retaining cookie data longer than necessary for its purpose</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">4. Your Cookie Choices</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Cookie Consent Banner</h3>
                  <p className="text-[var(--foreground)]">
                    When you first visit our website, you will see a cookie consent banner where you can accept all cookies, reject non-essential cookies, or customize your preferences.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Managing Preferences</h3>
                  <p className="text-[var(--foreground)]">
                    You can change your cookie preferences at any time by:
                  </p>
                  <ul className="list-disc list-inside text-[var(--foreground)] space-y-1 mt-2">
                    <li>Clicking the &quot;Cookie Settings&quot; link in the footer</li>
                    <li>Adjusting settings in your account preferences (if logged in)</li>
                    <li>Configuring your browser settings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Browser Settings</h3>
                  <p className="text-[var(--foreground)]">
                    Most browsers allow you to control cookies through their settings. You can typically:
                  </p>
                  <ul className="list-disc list-inside text-[var(--foreground)] space-y-1 mt-2">
                    <li>View what cookies are stored on your device</li>
                    <li>Delete some or all cookies</li>
                    <li>Block all or certain types of cookies</li>
                    <li>Set preferences for specific websites</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">5. Third-Party Cookies</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  Some cookies on our website are set by third-party services. These include:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li><strong>Google Analytics:</strong> For website traffic analysis</li>
                  <li><strong>Authentication Providers:</strong> When you sign in with Google or other OAuth providers</li>
                </ul>
                <p className="text-[var(--foreground)] mt-4">
                  These third parties have their own privacy policies governing the use of their cookies. We encourage you to review their policies:
                </p>
                <ul className="list-none text-[var(--foreground)] space-y-1 mt-2">
                  <li>• <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400">Google Privacy Policy</a></li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">6. Impact of Disabling Cookies</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  If you choose to disable cookies, please note:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li><strong>Essential Cookies:</strong> Disabling these may prevent the website from functioning properly (e.g., staying logged in)</li>
                  <li><strong>Functional Cookies:</strong> Your preferences may not be remembered between visits</li>
                  <li><strong>Analytics Cookies:</strong> We will not be able to improve our service based on usage patterns</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">7. Updates to This Policy</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. The &quot;Last updated&quot; date at the top indicates when this policy was last revised. We encourage you to review this policy periodically.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">8. Contact Us</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  If you have questions about our use of cookies or this Cookie Policy, please contact us:
                </p>
                <ul className="list-none text-[var(--foreground)] space-y-2 mt-4">
                  <li><strong>Email:</strong> privacy@internship.sg</li>
                  <li><strong>Data Protection Officer:</strong> dpo@internship.sg</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
