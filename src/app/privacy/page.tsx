import { Header, Footer } from '@/components';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-8">Privacy Policy</h1>

          <div className="prose prose-zinc max-w-none">
            <p className="text-[var(--muted)] text-lg mb-8">
              Last updated: February 2026
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">1. Introduction</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  internship.sg ("we", "our", or "us") is committed to protecting your personal data in accordance with the Personal Data Protection Act 2012 (PDPA) of Singapore. This Privacy Policy explains how we collect, use, disclose, and protect your personal data when you use our platform.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">2. Data We Collect</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">For Job Seekers:</h3>
                  <ul className="list-disc list-inside text-[var(--foreground)] space-y-1">
                    <li>Email address and account credentials</li>
                    <li>Profile information (name, education, skills)</li>
                    <li>Resume and portfolio links</li>
                    <li>Job application history</li>
                    <li>Saved jobs and preferences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">For Employers:</h3>
                  <ul className="list-disc list-inside text-[var(--foreground)] space-y-1">
                    <li>Company information and contact details</li>
                    <li>Job posting content</li>
                    <li>Application management data</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Automatically Collected:</h3>
                  <ul className="list-disc list-inside text-[var(--foreground)] space-y-1">
                    <li>Device and browser information</li>
                    <li>IP address and location (approximate)</li>
                    <li>Usage analytics (pages visited, time spent)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">3. How We Use Your Data</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li>To provide and maintain our services</li>
                  <li>To match job seekers with relevant opportunities</li>
                  <li>To enable employers to review applications</li>
                  <li>To send service-related notifications</li>
                  <li>To improve our platform and user experience</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">4. Data Sharing</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">We may share your data with:</p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li><strong>Employers:</strong> When you apply for a job, your profile and application details are shared with the employer</li>
                  <li><strong>Service Providers:</strong> Third-party services that help us operate (hosting, analytics)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                </ul>
                <p className="text-[var(--foreground)] mt-4">
                  We do NOT sell your personal data to third parties.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">5. Your Rights Under PDPA</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">You have the right to:</p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate data</li>
                  <li><strong>Withdrawal:</strong> Withdraw consent for data processing</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                </ul>
                <p className="text-[var(--foreground)] mt-4">
                  To exercise these rights, visit your Dashboard → Settings or contact us at privacy@internship.sg
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">6. Data Retention</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li>Active accounts: Data retained while account is active</li>
                  <li>Inactive accounts: Deleted after 24 months of inactivity</li>
                  <li>Deleted accounts: Data removed within 30 days</li>
                  <li>Application records: Retained for 12 months for employer reference</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">7. Data Security</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  We implement industry-standard security measures including:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2 mt-4">
                  <li>Encryption of data in transit (HTTPS/TLS)</li>
                  <li>Secure password hashing</li>
                  <li>Regular security audits</li>
                  <li>Access controls and authentication</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">8. Cookies</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  We use essential cookies to maintain your session and preferences. Analytics cookies are only used with your consent. You can manage cookie preferences in your browser settings or through our cookie consent banner.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">9. Job Aggregation (PDPA Compliance)</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  We aggregate internship listings from publicly available sources. Our scraping practices are PDPA compliant:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li><strong>No Personal Data:</strong> We only collect job listing information, NOT personal data (names, emails, phone numbers)</li>
                  <li><strong>Robots.txt Compliance:</strong> We respect website robots.txt directives</li>
                  <li><strong>Data Minimization:</strong> Only job-relevant data is collected (title, description, requirements, salary range)</li>
                  <li><strong>Source Attribution:</strong> All listings link back to original sources</li>
                  <li><strong>Removal Requests:</strong> Companies can request listing removal by contacting us</li>
                  <li><strong>Rate Limiting:</strong> We use responsible scraping practices to avoid server overload</li>
                </ul>
                <p className="text-[var(--foreground)] mt-4">
                  Any personal data inadvertently collected is automatically stripped before storage.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">10. Contact Us</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  For privacy-related inquiries or to exercise your data rights:
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
