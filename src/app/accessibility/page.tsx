import { Header, Footer } from '@/components';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-8">Accessibility Statement</h1>

          <div className="prose prose-zinc max-w-none">
            <p className="text-[var(--muted)] text-lg mb-8">
              Last updated: February 2026
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Our Commitment</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  internship.sg is committed to ensuring digital accessibility for people of all abilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
                </p>
                <p className="text-[var(--foreground)]">
                  We believe that the internet should be available and accessible to anyone, regardless of their abilities or disabilities. Our goal is to provide a seamless experience for all users, including those who rely on assistive technologies.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Accessibility Standards</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. These guidelines explain how to make web content more accessible for people with disabilities and more user-friendly for everyone.
                </p>
                <p className="text-[var(--foreground)]">
                  WCAG 2.1 covers a wide range of recommendations for making web content more accessible, including guidelines for:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2 mt-4">
                  <li>Text alternatives for non-text content</li>
                  <li>Captions and alternatives for multimedia</li>
                  <li>Content that can be presented in different ways</li>
                  <li>Content that is easier to see and hear</li>
                  <li>Keyboard accessible functionality</li>
                  <li>Sufficient time to read and use content</li>
                  <li>Content that does not cause seizures</li>
                  <li>Navigable and findable content</li>
                  <li>Readable and understandable text</li>
                  <li>Predictable web pages</li>
                  <li>Input assistance for users</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Accessibility Features</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Keyboard Navigation</h3>
                  <p className="text-[var(--foreground)]">
                    Our website can be navigated using a keyboard. You can use the Tab key to move through interactive elements, Enter to activate links and buttons, and Escape to close modals and menus.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Screen Reader Compatibility</h3>
                  <p className="text-[var(--foreground)]">
                    We have implemented semantic HTML, ARIA labels, and landmarks to ensure our content is accessible to screen readers. Our forms include proper labels and error messages for assistive technology users.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Color Contrast</h3>
                  <p className="text-[var(--foreground)]">
                    We use high contrast colors to ensure text is readable. Our color combinations meet WCAG 2.1 Level AA contrast ratio requirements.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Text Sizing</h3>
                  <p className="text-[var(--foreground)]">
                    Our website supports browser zoom functionality and text resizing. You can increase or decrease the text size using your browser settings without loss of content or functionality.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Alternative Text</h3>
                  <p className="text-[var(--foreground)]">
                    Images on our website include descriptive alternative text to convey information to users who cannot see the images.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Focus Indicators</h3>
                  <p className="text-[var(--foreground)]">
                    Interactive elements have visible focus indicators to help keyboard users understand where they are on the page.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Assistive Technology Compatibility</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  Our website is designed to be compatible with the following assistive technologies:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
                  <li>Screen magnification software</li>
                  <li>Speech recognition software</li>
                  <li>Keyboard-only navigation</li>
                  <li>Alternative input devices</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Known Limitations</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  While we strive to make our entire website accessible, some content may have limitations:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li><strong>Third-party content:</strong> Some job listings are aggregated from external sources and may not meet our accessibility standards. We are working with partners to improve this.</li>
                  <li><strong>PDF documents:</strong> Some older PDF documents may not be fully accessible. We are working to update these documents.</li>
                  <li><strong>Legacy features:</strong> Some older parts of our website are being updated to meet current accessibility standards.</li>
                </ul>
                <p className="text-[var(--foreground)] mt-4">
                  We are actively working to address these limitations and improve accessibility across all areas of our platform.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Browser Compatibility</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  For the best experience, we recommend using the latest versions of the following browsers:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li>Google Chrome</li>
                  <li>Mozilla Firefox</li>
                  <li>Apple Safari</li>
                  <li>Microsoft Edge</li>
                </ul>
                <p className="text-[var(--foreground)] mt-4">
                  Older browsers may not support all accessibility features. We recommend keeping your browser updated to ensure the best experience.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Tips for Better Accessibility</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  Here are some tips to enhance your experience on our website:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2">
                  <li><strong>Zoom:</strong> Use Ctrl/Cmd + Plus/Minus to zoom in and out</li>
                  <li><strong>High Contrast:</strong> Enable high contrast mode in your operating system settings</li>
                  <li><strong>Screen Reader:</strong> For the best screen reader experience, use heading navigation (H key in most screen readers)</li>
                  <li><strong>Skip Links:</strong> Use our skip navigation link to jump to the main content</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Feedback and Contact</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)] mb-4">
                  We welcome your feedback on the accessibility of internship.sg. Please let us know if you encounter any accessibility barriers:
                </p>
                <ul className="list-none text-[var(--foreground)] space-y-2 mt-4">
                  <li><strong>Email:</strong> <a href="mailto:accessibility@internship.sg" className="text-red-500 hover:text-red-400">accessibility@internship.sg</a></li>
                  <li><strong>General Support:</strong> <a href="mailto:support@internship.sg" className="text-red-500 hover:text-red-400">support@internship.sg</a></li>
                  <li><strong>Contact Form:</strong> <a href="/contact" className="text-red-500 hover:text-red-400">Contact Us</a></li>
                </ul>
                <p className="text-[var(--foreground)] mt-4">
                  We try to respond to accessibility feedback within 2 business days. If you are experiencing difficulty with any content on internship.sg, please contact us and we will be happy to assist you.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Continuous Improvement</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[var(--foreground)]">
                  We are committed to continually improving accessibility. Our efforts include:
                </p>
                <ul className="list-disc list-inside text-[var(--foreground)] space-y-2 mt-4">
                  <li>Regular accessibility audits of our website</li>
                  <li>Training our team on accessibility best practices</li>
                  <li>Including accessibility in our development process</li>
                  <li>Incorporating user feedback into our improvements</li>
                  <li>Staying updated on accessibility standards and guidelines</li>
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
