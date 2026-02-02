'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  ctaLink: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for small companies just getting started with hiring interns.',
    features: [
      '1 active job posting',
      'Basic applicant tracking',
      'Email notifications',
      'Company profile page',
      '30-day listing duration',
      'Standard support',
    ],
    cta: 'Get Started Free',
    ctaLink: '/employer/signup',
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/month',
    description: 'For growing companies with regular internship programs.',
    features: [
      '10 active job postings',
      'Advanced applicant tracking',
      'Priority email support',
      'Featured company badge',
      '60-day listing duration',
      'Analytics dashboard',
      'Bulk applicant actions',
      'Custom screening questions',
      'Team collaboration (3 users)',
    ],
    highlighted: true,
    cta: 'Start Pro Trial',
    ctaLink: '/employer/signup?plan=pro',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with high-volume hiring needs.',
    features: [
      'Unlimited job postings',
      'Dedicated account manager',
      'API access',
      'Custom branding',
      'Priority placement',
      'Advanced analytics',
      'SSO integration',
      'Custom integrations',
      'Unlimited team members',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    ctaLink: 'mailto:enterprise@internship.sg',
  },
];

const faqs = [
  {
    question: 'Can I switch plans at any time?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to new features. When downgrading, changes take effect at the end of your billing cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayNow, and bank transfers for Enterprise plans.',
  },
  {
    question: 'Is there a free trial for the Pro plan?',
    answer: 'Yes! We offer a 14-day free trial for the Pro plan. No credit card required to start.',
  },
  {
    question: 'What happens when my job posting expires?',
    answer: 'You\'ll receive a reminder before expiration. You can renew the posting or let it expire. Expired postings are archived but can be reactivated anytime.',
  },
  {
    question: 'Do you offer discounts for startups or non-profits?',
    answer: 'Yes, we offer special pricing for registered startups and non-profit organizations. Contact us at hello@internship.sg to learn more.',
  },
  {
    question: 'Can I get a refund if I\'m not satisfied?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact support for a full refund.',
  },
];

export default function EmployerPricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your hiring needs. Start free and scale as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-[#dc2626] text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-[#dc2626] text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="max-w-6xl mx-auto px-4 mb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative bg-zinc-900 border rounded-xl p-8 ${
                  tier.highlighted
                    ? 'border-[#dc2626] shadow-lg shadow-red-500/10'
                    : 'border-zinc-800'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#dc2626] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">
                      {tier.price === 'Custom'
                        ? tier.price
                        : billingCycle === 'annual' && tier.price !== '$0'
                          ? `$${Math.round(parseInt(tier.price.replace('$', '')) * 0.8)}`
                          : tier.price
                      }
                    </span>
                    {tier.period && (
                      <span className="text-zinc-400">{tier.period}</span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm mt-3">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-zinc-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.ctaLink}
                  className={`block w-full py-3 px-4 text-center font-semibold rounded-xl transition-colors ${
                    tier.highlighted
                      ? 'bg-[#dc2626] text-white hover:bg-[#b91c1c]'
                      : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Features Comparison */}
        <section className="max-w-6xl mx-auto px-4 mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Compare All Features
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-zinc-400 font-medium">Feature</th>
                  <th className="p-4 text-center text-white font-semibold">Free</th>
                  <th className="p-4 text-center text-white font-semibold bg-zinc-800/50">Pro</th>
                  <th className="p-4 text-center text-white font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Active job postings', free: '1', pro: '10', enterprise: 'Unlimited' },
                  { feature: 'Listing duration', free: '30 days', pro: '60 days', enterprise: 'Custom' },
                  { feature: 'Team members', free: '1', pro: '3', enterprise: 'Unlimited' },
                  { feature: 'Applicant tracking', free: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
                  { feature: 'Analytics', free: '-', pro: 'Yes', enterprise: 'Advanced' },
                  { feature: 'Featured badge', free: '-', pro: 'Yes', enterprise: 'Yes' },
                  { feature: 'Priority placement', free: '-', pro: '-', enterprise: 'Yes' },
                  { feature: 'API access', free: '-', pro: '-', enterprise: 'Yes' },
                  { feature: 'SSO integration', free: '-', pro: '-', enterprise: 'Yes' },
                  { feature: 'Dedicated support', free: '-', pro: '-', enterprise: 'Yes' },
                ].map((row, index) => (
                  <tr key={row.feature} className={index !== 0 ? 'border-t border-zinc-800' : ''}>
                    <td className="p-4 text-zinc-300">{row.feature}</td>
                    <td className="p-4 text-center text-zinc-400">{row.free}</td>
                    <td className="p-4 text-center text-zinc-300 bg-zinc-800/50">{row.pro}</td>
                    <td className="p-4 text-center text-zinc-400">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto px-4 mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-white font-medium">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-zinc-400 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-zinc-400">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Find Your Next Intern?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
              Join hundreds of companies in Singapore already using internship.sg to connect with top student talent.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/employer/signup"
                className="px-8 py-4 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="mailto:hello@internship.sg"
                className="px-8 py-4 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
