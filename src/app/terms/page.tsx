import { Header, Footer } from '@/components';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-8">Terms of Service</h1>

          <div className="prose prose-zinc max-w-none">
            <p className="text-[var(--muted)] text-lg mb-8">
              Last updated: February 2026
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">1. Acceptance of Terms</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  By accessing or using internship.sg ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Platform. These terms apply to all users, including job seekers, employers, and visitors.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">2. Description of Service</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  internship.sg is a job board platform that connects students and graduates with internship opportunities in Singapore. Our services include:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li>Job listing aggregation and search</li>
                  <li>Employer job posting capabilities</li>
                  <li>Application tracking for job seekers</li>
                  <li>Company profiles and information</li>
                  <li>Job alerts and notifications</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">3. User Accounts</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Account Registration</h3>
                  <p className="text-[var(--foreground)]">
                    You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Account Types</h3>
                  <ul className="list-disc list-inside text-[var(--foreground)] space-y-1">
                    <li><strong>Job Seeker:</strong> For individuals seeking internship opportunities</li>
                    <li><strong>Employer:</strong> For companies posting internship positions</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Account Termination</h3>
                  <p className="text-[var(--foreground)]">
                    We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">4. Job Seeker Terms</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">As a job seeker, you agree to:</p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li>Provide accurate information in your profile and applications</li>
                  <li>Not misrepresent your qualifications or experience</li>
                  <li>Use the platform only for legitimate job searching purposes</li>
                  <li>Respect the privacy of employers and other users</li>
                  <li>Not use automated tools to mass-apply to positions</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">5. Employer Terms</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">As an employer, you agree to:</p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li>Post only legitimate internship opportunities</li>
                  <li>Provide accurate job descriptions and company information</li>
                  <li>Comply with Singapore employment laws and regulations</li>
                  <li>Not discriminate based on race, gender, religion, or other protected characteristics</li>
                  <li>Respond to applicants in a timely and professional manner</li>
                  <li>Not use applicant data for purposes other than recruitment</li>
                  <li>Ensure internships comply with MOM (Ministry of Manpower) guidelines</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">6. Prohibited Activities</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">The following activities are strictly prohibited:</p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li>Posting fraudulent, misleading, or scam job listings</li>
                  <li>Collecting personal data for unauthorized purposes</li>
                  <li>Harassment or discrimination of any kind</li>
                  <li>Spamming or sending unsolicited communications</li>
                  <li>Attempting to hack or compromise platform security</li>
                  <li>Scraping data without authorization</li>
                  <li>Posting jobs that require payment from applicants</li>
                  <li>Multi-level marketing or pyramid scheme opportunities</li>
                  <li>Impersonating another person or company</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">7. Intellectual Property</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  The Platform and its original content, features, and functionality are owned by internship.sg and are protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-[var(--foreground)]">
                  Users retain ownership of content they submit but grant us a non-exclusive license to display and distribute it on the Platform.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">8. Disclaimers</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Guarantee of Employment</h3>
                  <p className="text-[var(--foreground)]">
                    We do not guarantee that using our Platform will result in employment. We are a job listing service and are not responsible for hiring decisions made by employers.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Third-Party Content</h3>
                  <p className="text-[var(--foreground)]">
                    Job listings may be aggregated from third-party sources. We do not verify the accuracy of all listings and are not responsible for content posted by employers.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Service Availability</h3>
                  <p className="text-[var(--foreground)]">
                    We strive to maintain Platform availability but do not guarantee uninterrupted service. Maintenance or technical issues may cause temporary downtime.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">9. Limitation of Liability</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  To the maximum extent permitted by law, internship.sg shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses, resulting from your use of the Platform.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">10. Indemnification</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  You agree to indemnify and hold harmless internship.sg, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Platform or violation of these terms.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">11. Governing Law</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  These Terms shall be governed by and construed in accordance with the laws of Singapore. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Singapore.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">12. Changes to Terms</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the Platform after changes constitutes acceptance of the modified terms. We will notify users of significant changes via email or platform notification.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">13. Contact Information</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  For questions about these Terms of Service, please contact us:
                </p>
                <ul className="list-none text-[var(--foreground)] space-y-2 mt-4">
                  <li><strong>Email:</strong> legal@internship.sg</li>
                  <li><strong>Website:</strong> internship.sg</li>
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
