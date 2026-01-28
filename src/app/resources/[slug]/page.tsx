"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { getArticleBySlug, getRelatedArticles, ArticleCategory } from "@/data/articles";

export default function ArticlePage() {
  const { isDarkTheme, toggleTheme } = useTheme();
  const params = useParams();
  const slug = params.slug as string;

  const article = getArticleBySlug(slug);
  const relatedArticles = article ? getRelatedArticles(slug) : [];

  const [copied, setCopied] = useState(false);

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

  const handleShare = async (platform: 'copy' | 'twitter' | 'linkedin' | 'whatsapp') => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = article?.title || 'Career Resource';

    switch (platform) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
        break;
    }
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!article) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-gradient-to-br from-red-50 to-white'}`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Article Not Found
          </h1>
          <Link href="/resources" className="text-red-600 hover:underline">
            Back to Resources
          </Link>
        </div>
      </div>
    );
  }

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.trim().split('\n');
    const elements: React.ReactElement[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        const ListTag = listType;
        elements.push(
          <ListTag
            key={elements.length}
            className={`my-4 ml-6 space-y-2 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}
          >
            {listItems.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ListTag>
        );
        listItems = [];
        listType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block handling
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={elements.length}
              className={`my-4 p-4 rounded-lg overflow-x-auto text-sm ${isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-800'}`}
            >
              <code>{codeContent.join('\n')}</code>
            </pre>
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Empty line - flush list and add spacing
      if (line.trim() === '') {
        flushList();
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={elements.length} className={`text-3xl font-bold mt-8 mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            {line.slice(2)}
          </h1>
        );
        continue;
      }

      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={elements.length} className={`text-2xl font-bold mt-8 mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            {line.slice(3)}
          </h2>
        );
        continue;
      }

      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={elements.length} className={`text-xl font-semibold mt-6 mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            {line.slice(4)}
          </h3>
        );
        continue;
      }

      // List items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(line.trim().slice(2));
        continue;
      }

      // Numbered list
      const numberedMatch = line.trim().match(/^\d+\.\s+(.+)$/);
      if (numberedMatch) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(numberedMatch[1]);
        continue;
      }

      // Checkbox items
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        flushList();
        const checked = line.trim().startsWith('- [x]');
        const text = line.trim().slice(6);
        elements.push(
          <div key={elements.length} className="flex items-center gap-2 my-1">
            <input type="checkbox" checked={checked} readOnly className="rounded" />
            <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-700'}>{text}</span>
          </div>
        );
        continue;
      }

      // Bold text handling
      let formattedLine = line;
      formattedLine = formattedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      formattedLine = formattedLine.replace(/`(.+?)`/g, `<code class="${isDarkTheme ? 'bg-slate-800 text-red-400' : 'bg-slate-100 text-red-600'} px-1 py-0.5 rounded text-sm">$1</code>`);

      // Regular paragraph
      flushList();
      elements.push(
        <p
          key={elements.length}
          className={`my-4 leading-relaxed ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    }

    flushList();

    return elements;
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

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/resources" className={`hover:text-red-600 transition-colors ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            Resources
          </Link>
          <svg className={`w-4 h-4 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-700'}>{article.category}</span>
        </nav>
      </div>

      {/* Article Header */}
      <header className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>
          <span className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
            {article.readTime} min read
          </span>
        </div>
        <h1 className={`text-3xl sm:text-4xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          {article.title}
        </h1>
        <p className={`text-lg ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
          {article.excerpt}
        </p>
        <div className={`mt-4 flex items-center gap-4 text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>By {article.author}</span>
          <span>|</span>
          <span>{new Date(article.publishedAt).toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 pb-12">
        <div className={`rounded-xl p-6 sm:p-8 ${isDarkTheme ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
          <div className="prose max-w-none">
            {renderContent(article.content)}
          </div>
        </div>
      </article>

      {/* Share Buttons */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className={`rounded-xl p-6 ${isDarkTheme ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Share this article
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleShare('copy')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDarkTheme
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5] hover:bg-[#006299] text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Twitter
            </button>
            <button
              onClick={() => handleShare('whatsapp')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* Practice CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 sm:p-8 text-white text-center">
          <h3 className="text-xl sm:text-2xl font-bold mb-3">Ready to Practice?</h3>
          <p className="text-red-100 mb-6">
            Put these tips into action with our AI-powered mock interviews.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
          >
            Start Practice Now
          </Link>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-12">
          <h3 className={`text-xl font-bold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Related Articles
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedArticles.map((related) => (
              <Link
                key={related.slug}
                href={`/resources/${related.slug}`}
                className={`group rounded-xl p-5 transition-all border hover:shadow-md ${
                  isDarkTheme
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(related.category)}`}>
                  {related.category}
                </span>
                <h4 className={`text-base font-semibold mt-3 group-hover:text-red-600 transition-colors line-clamp-2 ${
                  isDarkTheme ? 'text-white' : 'text-slate-900'
                }`}>
                  {related.title}
                </h4>
                <p className={`text-sm mt-2 line-clamp-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  {related.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

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
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
