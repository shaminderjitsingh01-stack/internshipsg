"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  average_rating: number;
  reviews_count: number;
}

interface Review {
  id: string;
  company_id: string;
  user_email: string;
  employment_type: string;
  overall_rating: number;
  work_life_rating: number | null;
  culture_rating: number | null;
  growth_rating: number | null;
  compensation_rating: number | null;
  pros: string;
  cons: string;
  is_anonymous: boolean;
  helpful_count: number;
  created_at: string;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
  } | null;
  author: {
    username: string;
    name: string;
    image: string | null;
  } | null;
  hasVotedHelpful: boolean;
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function CompanyLogo({ company, size = "md" }: { company: { name: string; logo_url: string | null }; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
  };

  if (company.logo_url) {
    return (
      <img
        src={company.logo_url}
        alt={company.name}
        className={`${sizeClasses[size]} rounded-xl object-cover`}
      />
    );
  }

  const initials = company.name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`${sizeClasses[size]} rounded-xl gradient-primary flex items-center justify-center font-bold text-white`}>
      {initials}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReviewsPage() {
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const userEmail = session?.user?.email;

  const [featuredCompanies, setFeaturedCompanies] = useState<Company[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch featured companies (top rated)
        const companiesRes = await fetch("/api/companies?sort_by=average_rating&sort_order=desc&limit=6");
        const companiesData = await companiesRes.json();
        setFeaturedCompanies(companiesData.companies || []);

        // Fetch recent reviews
        const reviewsRes = await fetch(`/api/reviews?limit=10&sort_by=created_at${userEmail ? `&current_user=${encodeURIComponent(userEmail)}` : ""}`);
        const reviewsData = await reviewsRes.json();
        setRecentReviews(reviewsData.reviews || []);

        // Fetch user's reviews if logged in
        if (userEmail) {
          const userReviewsRes = await fetch(`/api/reviews?type=user&user_email=${encodeURIComponent(userEmail)}`);
          const userReviewsData = await userReviewsRes.json();
          setUserReviews(userReviewsData.reviews || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail]);

  // Search companies
  const searchCompanies = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/companies?search=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSearchResults(data.companies || []);
    } catch (error) {
      console.error("Error searching companies:", error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchCompanies(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchCompanies]);

  // Toggle helpful vote
  const toggleHelpful = async (reviewId: string, hasVoted: boolean) => {
    if (!userEmail) {
      alert("Please sign in to mark reviews as helpful");
      return;
    }

    try {
      if (hasVoted) {
        await fetch(`/api/reviews/helpful?review_id=${reviewId}&user_email=${encodeURIComponent(userEmail)}`, {
          method: "DELETE",
        });
      } else {
        await fetch("/api/reviews/helpful", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ review_id: reviewId, user_email: userEmail }),
        });
      }

      // Update local state
      setRecentReviews(prev =>
        prev.map(r =>
          r.id === reviewId
            ? {
                ...r,
                hasVotedHelpful: !hasVoted,
                helpful_count: hasVoted ? r.helpful_count - 1 : r.helpful_count + 1,
              }
            : r
        )
      );
    } catch (error) {
      console.error("Error toggling helpful:", error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${isDarkTheme ? "border-red-800/30" : "border-gray-200/50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">i</span>
              </div>
              <span className={`font-bold text-xl ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                internship.sg
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/companies"
                className={`hidden sm:block px-4 py-2 rounded-xl font-medium transition-all ${
                  isDarkTheme ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Companies
              </Link>
              <Link href="/reviews/write" className="btn-premium px-5 py-2.5 text-sm">
                Write a Review
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200 mb-6">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-sm font-medium text-red-700">Company Reviews</span>
          </div>
          <h1 className={`text-4xl sm:text-5xl font-bold mb-6 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Real Reviews from{" "}
            <span className="text-gradient">Real Employees</span>
          </h1>
          <p className={`text-lg sm:text-xl max-w-3xl mx-auto mb-8 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
            Get insider insights about company culture, work-life balance, and career growth from people who have worked there.
          </p>

          {/* Company Search */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <svg
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search for a company to review..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border ${
                  isDarkTheme
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50 text-lg`}
              />
            </div>

            {/* Search Results Dropdown */}
            {(searchResults.length > 0 || searchLoading) && searchQuery && (
              <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-xl overflow-hidden z-10 ${
                isDarkTheme ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}>
                {searchLoading ? (
                  <div className="p-4 text-center">
                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  searchResults.map((company) => (
                    <Link
                      key={company.id}
                      href={`/reviews/write?company=${company.id}`}
                      className={`flex items-center gap-4 p-4 transition-colors ${
                        isDarkTheme ? "hover:bg-gray-700" : "hover:bg-gray-50"
                      }`}
                    >
                      <CompanyLogo company={company} size="sm" />
                      <div className="flex-1 text-left">
                        <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                          {company.name}
                        </h3>
                        {company.industry && (
                          <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                            {company.industry}
                          </p>
                        )}
                      </div>
                      <span className="text-red-600 text-sm font-medium">Write Review</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className={`text-2xl font-bold mb-6 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Featured Companies
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}/reviews`}
                className={`card-premium p-4 text-center group ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
              >
                <div className="flex justify-center mb-3">
                  <CompanyLogo company={company} size="lg" />
                </div>
                <h3 className={`font-semibold text-sm mb-1 group-hover:text-red-600 transition-colors truncate ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  {company.name}
                </h3>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <StarRating rating={Math.round(company.average_rating || 0)} size="sm" />
                </div>
                <p className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                  {company.reviews_count || 0} reviews
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Reviews */}
            <div className="lg:col-span-2">
              <h2 className={`text-2xl font-bold mb-6 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Recent Reviews
              </h2>
              <div className="space-y-4">
                {recentReviews.length > 0 ? (
                  recentReviews.map((review) => (
                    <div
                      key={review.id}
                      className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        {review.company && (
                          <Link href={`/companies/${review.company.id}/reviews`}>
                            <CompanyLogo company={review.company} size="md" />
                          </Link>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              {review.company && (
                                <Link
                                  href={`/companies/${review.company.id}/reviews`}
                                  className={`font-semibold hover:text-red-600 transition-colors ${isDarkTheme ? "text-white" : "text-gray-900"}`}
                                >
                                  {review.company.name}
                                </Link>
                              )}
                              <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                                {review.is_anonymous ? "Anonymous" : review.author?.name || "Anonymous"} - {review.employment_type}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.overall_rating} size="sm" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className={`text-sm font-semibold mb-1 ${isDarkTheme ? "text-green-400" : "text-green-600"}`}>
                            Pros
                          </h4>
                          <p className={`text-sm line-clamp-2 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                            {review.pros}
                          </p>
                        </div>
                        <div>
                          <h4 className={`text-sm font-semibold mb-1 ${isDarkTheme ? "text-red-400" : "text-red-600"}`}>
                            Cons
                          </h4>
                          <p className={`text-sm line-clamp-2 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                            {review.cons}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDarkTheme ? "border-gray-700" : "border-gray-100"}`}>
                        <span className={`text-xs ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>
                          {formatDate(review.created_at)}
                        </span>
                        <button
                          onClick={() => toggleHelpful(review.id, review.hasVotedHelpful)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            review.hasVotedHelpful
                              ? isDarkTheme
                                ? "bg-red-900/30 text-red-400"
                                : "bg-red-50 text-red-600"
                              : isDarkTheme
                              ? "hover:bg-gray-700 text-gray-400"
                              : "hover:bg-gray-100 text-gray-500"
                          }`}
                        >
                          <svg className="w-4 h-4" fill={review.hasVotedHelpful ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          {review.helpful_count} Helpful
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-12 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-lg font-medium mb-1">No reviews yet</p>
                    <p className="text-sm">Be the first to share your experience!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Your Reviews */}
              {userEmail && (
                <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                    Your Reviews
                  </h3>
                  {userReviews.length > 0 ? (
                    <div className="space-y-3">
                      {userReviews.slice(0, 3).map((review) => (
                        <div
                          key={review.id}
                          className={`p-3 rounded-xl ${isDarkTheme ? "bg-gray-700/50" : "bg-gray-50"}`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {review.company && (
                              <CompanyLogo company={review.company} size="sm" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm truncate ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                                {review.company?.name || "Company"}
                              </p>
                              <StarRating rating={review.overall_rating} size="sm" />
                            </div>
                          </div>
                        </div>
                      ))}
                      {userReviews.length > 3 && (
                        <p className={`text-sm text-center ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                          +{userReviews.length - 3} more reviews
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      You haven't written any reviews yet.
                    </p>
                  )}
                </div>
              )}

              {/* Write a Review CTA */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gradient-to-br from-red-900/50 to-gray-800 border-red-800/50" : "bg-gradient-to-br from-red-50 to-white"}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  Share Your Experience
                </h3>
                <p className={`text-sm mb-4 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                  Help others make informed career decisions by sharing your work experience.
                </p>
                <Link
                  href="/reviews/write"
                  className="btn-premium w-full py-3 text-center block"
                >
                  Write a Review
                </Link>
              </div>

              {/* Stats */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  Review Stats
                </h3>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-3 rounded-xl ${isDarkTheme ? "bg-gray-700/50" : "bg-gray-50"}`}>
                    <span className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>Total Reviews</span>
                    <span className={`font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                      {recentReviews.length}+
                    </span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-xl ${isDarkTheme ? "bg-gray-700/50" : "bg-gray-50"}`}>
                    <span className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>Companies Reviewed</span>
                    <span className={`font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                      {featuredCompanies.length}+
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-4 border-t ${isDarkTheme ? "border-gray-800 bg-gray-900" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">i</span>
            </div>
            <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              internship.sg
            </span>
          </div>
          <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
            Helping Singapore students land their dream internships
          </p>
        </div>
      </footer>
    </div>
  );
}
