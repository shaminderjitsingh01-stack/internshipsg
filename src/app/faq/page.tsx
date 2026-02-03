'use client';

import { useState } from 'react';
import { Header, Footer } from '@/components';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    title: 'General Questions',
    items: [
      {
        question: 'What is internship.sg?',
        answer: 'internship.sg is a job board platform dedicated to internship opportunities in Singapore. We aggregate listings from various sources and allow employers to post directly, making it easier for students to find and apply for internships in one place.',
      },
      {
        question: 'Is internship.sg free to use?',
        answer: 'Yes, internship.sg is completely free for job seekers. You can browse, search, save jobs, and apply to internships without any cost. Employers may have access to both free and premium posting options.',
      },
      {
        question: 'Who can use internship.sg?',
        answer: 'Our platform is designed for students, fresh graduates, and career changers looking for internship opportunities in Singapore. Employers and recruiters can also use our platform to post internship positions and find candidates.',
      },
      {
        question: 'How often are new internships posted?',
        answer: 'We update our listings daily. New internships are added as they become available, and we regularly refresh our aggregated listings to ensure accuracy. You can set up job alerts to be notified when new positions matching your criteria are posted.',
      },
    ],
  },
  {
    title: 'For Job Seekers',
    items: [
      {
        question: 'Do I need an account to apply for internships?',
        answer: 'You can browse internships without an account, but creating one allows you to save jobs, track applications, set up job alerts, and build a profile that you can use to apply quickly. Some employer-posted positions may require an account to apply directly through our platform.',
      },
      {
        question: 'How do I apply for an internship?',
        answer: 'Click on any internship listing to view details. If the position is posted directly on our platform, you can apply through our application system. For aggregated listings, you will be redirected to the original source (company website or job board) to complete your application.',
      },
      {
        question: 'Can I save internships to apply later?',
        answer: 'Yes! Once logged in, you can save any internship to your saved jobs list by clicking the bookmark icon. Access your saved jobs anytime from your dashboard.',
      },
      {
        question: 'How do job alerts work?',
        answer: 'You can set up job alerts based on your preferences (keywords, industry, location). When new internships matching your criteria are posted, you will receive an email notification. You can manage your alert preferences in your account settings.',
      },
      {
        question: 'Why was a listing removed?',
        answer: 'Listings may be removed when the application deadline passes, the position is filled, or the employer removes it. Aggregated listings may also be removed if they are no longer available on the original source.',
      },
    ],
  },
  {
    title: 'For Employers',
    items: [
      {
        question: 'How do I post an internship?',
        answer: 'Create an employer account and navigate to "Post a Job" from your dashboard. Fill in the internship details including title, description, requirements, and application instructions. Your listing will be reviewed and published within 24 hours.',
      },
      {
        question: 'Is it free to post internships?',
        answer: 'We offer free basic listings for employers. Premium options are available for enhanced visibility, featured placement, and additional recruiting tools. Contact us at employers@internship.sg for more information on our pricing.',
      },
      {
        question: 'How long will my listing be active?',
        answer: 'Standard listings remain active for 30 days. You can extend, edit, or close your listing at any time from your employer dashboard. Premium listings may have longer active periods depending on your plan.',
      },
      {
        question: 'Can I edit my listing after posting?',
        answer: 'Yes, you can edit your listing at any time from your employer dashboard. Changes will be reflected immediately after saving.',
      },
    ],
  },
  {
    title: 'Account & Privacy',
    items: [
      {
        question: 'How do I delete my account?',
        answer: 'You can delete your account from Settings > Account > Delete Account. This will permanently remove your profile, saved jobs, and application history. For data deletion requests, you can also contact us at privacy@internship.sg.',
      },
      {
        question: 'How is my data protected?',
        answer: 'We take data protection seriously and comply with Singapore\'s Personal Data Protection Act (PDPA). Your data is encrypted, and we never sell personal information to third parties. Read our full Privacy Policy for more details.',
      },
      {
        question: 'Who can see my profile?',
        answer: 'Your profile is only visible to employers when you apply to their positions. You can control your profile visibility in your account settings, including options to hide your profile from search or make it visible to all employers.',
      },
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page and enter your email address. You will receive a password reset link. If you do not receive the email, check your spam folder or contact support.',
      },
    ],
  },
  {
    title: 'Technical Support',
    items: [
      {
        question: 'The website is not loading properly. What should I do?',
        answer: 'Try clearing your browser cache and cookies, then refresh the page. Ensure you are using an up-to-date browser (Chrome, Firefox, Safari, or Edge). If the issue persists, contact us at support@internship.sg with details about the problem.',
      },
      {
        question: 'I am not receiving emails from internship.sg',
        answer: 'Check your spam/junk folder and add noreply@internship.sg to your contacts. If using Gmail, check the Promotions tab. You can also verify your email settings in your account preferences.',
      },
      {
        question: 'How do I report a problem or bug?',
        answer: 'Please email support@internship.sg with a description of the issue, including screenshots if possible, the browser you are using, and steps to reproduce the problem. We aim to respond within 24-48 hours.',
      },
    ],
  },
];

function FAQAccordion({ section }: { section: FAQSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">{section.title}</h2>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {section.items.map((item, index) => (
          <div key={index} className={index !== 0 ? 'border-t border-[var(--border)]' : ''}>
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <span className="text-[var(--foreground)] font-medium pr-4">{item.question}</span>
              <svg
                className={`w-5 h-5 text-[var(--muted)] flex-shrink-0 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4">
                <p className="text-[var(--foreground)]">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">Frequently Asked Questions</h1>
          <p className="text-[var(--muted)] text-lg mb-8">
            Find answers to common questions about using internship.sg
          </p>

          <div className="prose prose-zinc max-w-none">
            {faqData.map((section, index) => (
              <FAQAccordion key={index} section={section} />
            ))}

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Still have questions?</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  Cannot find what you are looking for? Our support team is here to help.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="/contact"
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Contact Us
                  </a>
                  <a
                    href="mailto:support@internship.sg"
                    className="inline-flex items-center px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[var(--foreground)] rounded-lg transition-colors"
                  >
                    Email Support
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
