import { Header, Footer } from '@/components';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">About internship.sg</h1>

          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-zinc-400 text-lg mb-8">
              Connecting students with meaningful internship opportunities across Singapore.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Our Mission</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <p className="text-zinc-300 mb-4">
                  At internship.sg, we believe every student deserves access to quality internship opportunities that kickstart their career journey. Our mission is to bridge the gap between talented students and innovative companies in Singapore.
                </p>
                <p className="text-zinc-300">
                  We aggregate internship listings from across the web, making it easier for students to discover opportunities without having to search multiple job boards. Our platform is designed to be simple, fast, and focused entirely on internships.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">What We Do</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <ul className="list-disc list-inside text-zinc-300 space-y-3">
                  <li>
                    <strong className="text-white">Aggregate Opportunities:</strong> We collect internship listings from company career pages, job boards, and other sources across Singapore.
                  </li>
                  <li>
                    <strong className="text-white">Simplify Search:</strong> Our smart filters help you find internships by industry, location, duration, and more.
                  </li>
                  <li>
                    <strong className="text-white">Track Applications:</strong> Keep all your applications organized in one dashboard.
                  </li>
                  <li>
                    <strong className="text-white">Stay Updated:</strong> Get notified when new internships matching your preferences are posted.
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Why internship.sg?</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Singapore-Focused</h3>
                  <p className="text-zinc-300">
                    We focus exclusively on internships in Singapore, ensuring relevant opportunities for local students.
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Fast & Simple</h3>
                  <p className="text-zinc-300">
                    No bloat, no distractions. Find and apply to internships quickly with our streamlined interface.
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Always Updated</h3>
                  <p className="text-zinc-300">
                    Our listings are refreshed regularly to ensure you see the latest opportunities.
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">100% Free</h3>
                  <p className="text-zinc-300">
                    Free for students. We believe access to opportunities should never be a barrier.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Our Team</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <p className="text-zinc-300 mb-4">
                  internship.sg was built by a small team of developers and designers who experienced firsthand the challenges of finding internships in Singapore. We understand the struggle of navigating multiple job boards and missing out on opportunities.
                </p>
                <p className="text-zinc-300">
                  Our team is passionate about helping the next generation of professionals find their footing in the workforce. We are continuously improving our platform based on user feedback.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">For Employers</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <p className="text-zinc-300 mb-4">
                  Looking to hire interns? internship.sg helps you reach motivated students actively seeking opportunities.
                </p>
                <ul className="list-disc list-inside text-zinc-300 space-y-2">
                  <li>Post your internship listings directly on our platform</li>
                  <li>Reach a targeted audience of students and fresh graduates</li>
                  <li>Manage applications through our employer dashboard</li>
                  <li>Get your listings featured for increased visibility</li>
                </ul>
                <p className="text-zinc-300 mt-4">
                  Contact us at <a href="mailto:employers@internship.sg" className="text-red-500 hover:text-red-400">employers@internship.sg</a> to learn more about posting opportunities.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Get in Touch</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <p className="text-zinc-300 mb-4">
                  We would love to hear from you! Whether you have feedback, questions, or partnership inquiries:
                </p>
                <ul className="list-none text-zinc-300 space-y-2">
                  <li><strong>General Inquiries:</strong> <a href="mailto:hello@internship.sg" className="text-red-500 hover:text-red-400">hello@internship.sg</a></li>
                  <li><strong>Support:</strong> <a href="mailto:support@internship.sg" className="text-red-500 hover:text-red-400">support@internship.sg</a></li>
                  <li><strong>Employers:</strong> <a href="mailto:employers@internship.sg" className="text-red-500 hover:text-red-400">employers@internship.sg</a></li>
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
