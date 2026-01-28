"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { getAllArticles, ARTICLE_CATEGORIES, ArticleCategory } from "@/data/articles";
import { useState } from "react";

export default function ResourcesPage() {
  const { isDarkTheme, toggleTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | "All">("All");

  const allArticles = getAllArticles();
  const filteredArticles = selectedCategory === "All"
    ? allArticles
    : allArticles.filter(article => article.category === selectedCategory);

  const getCategoryColor = (category: ArticleCategory) => {
    switch (category) {
      case 'Interview Tips':
        return isDarkTheme
          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
          : 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Resume Tips':
        return isDarkTheme
          ? 'bg-green-500/20 text-green-400 border-green-500/30'
          : 'bg-green-100 text-green-700 border-green-200';
      case 'Career Advice':
        return isDarkTheme
          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
          : 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Industry Insights':
        return isDarkTheme
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          : 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return isDarkTheme
          ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
          : 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-gradient-to-br from-red-50 to-white'}`}>
      {/* Nav */}
      <nav className={`border-b backdrop-blur-sm sticky top-0 z-50 ${isDarkTheme ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/questions" className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isDarkTheme ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                Questions
              </Link>
              <Link href="/leaderboard" className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isDarkTheme ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                Leaderboard
              </Link>
              <Link href="/resources" className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isDarkTheme ? 'text-white bg-white/10' : 'text-slate-900 bg-slate-100'}`}>
                Resources
              </Link>
              <Link href="/employers" className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isDarkTheme ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                For Employers
              </Link>
              <Link href="/roadmap" className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isDarkTheme ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                Roadmap
              </Link>
            </div>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              aria-label="Toggle theme"
            >
              {isDarkTheme ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link
              href="/"
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all text-sm sm:text-base"
            >
              Start Practice
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Career <span className="text-red-600">Resources</span>
          </h1>
          <p className={`text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Expert tips, guides, and insights to help you ace your interviews and land your dream internship.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                selectedCategory === "All"
                  ? 'bg-red-600 text-white border-red-600'
                  : isDarkTheme
                    ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Articles
            </button>
            {ARTICLE_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white border-red-600'
                    : isDarkTheme
                      ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/resources/${article.slug}`}
                className={`group rounded-xl p-6 transition-all border hover:shadow-lg ${
                  isDarkTheme
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(article.category)}`}>
                    {article.category}
                  </span>
                  <span className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                    {article.readTime} min read
                  </span>
                </div>

                {/* Title */}
                <h2 className={`text-lg font-semibold mb-3 group-hover:text-red-600 transition-colors line-clamp-2 ${
                  isDarkTheme ? 'text-white' : 'text-slate-900'
                }`}>
                  {article.title}
                </h2>

                {/* Excerpt */}
                <p className={`text-sm mb-4 line-clamp-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  {article.excerpt}
                </p>

                {/* Read More */}
                <div className="flex items-center gap-2 text-red-600 text-sm font-medium group-hover:gap-3 transition-all">
                  Read More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className={`text-center py-12 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              <p>No articles found in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-12 px-4 ${isDarkTheme ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Ready to Put These Tips into Practice?
          </h2>
          <p className={`mb-8 text-sm sm:text-base ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Start practicing with our AI interviewer and get instant feedback on your responses.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all text-lg"
          >
            Start Practice Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-6 sm:py-8 ${isDarkTheme ? 'border-slate-800 bg-slate-950' : 'border-slate-200'}`}>
        <div className={`max-w-6xl mx-auto px-4 text-center text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link href="/questions" className="hover:text-red-600 transition-colors">Questions</Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">Leaderboard</Link>
            <Link href="/resources" className="hover:text-red-600 transition-colors">Resources</Link>
            <Link href="/employers" className="hover:text-red-600 transition-colors">For Employers</Link>
            <Link href="/roadmap" className="hover:text-red-600 transition-colors">Roadmap</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">About</Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
          </div>
          <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
