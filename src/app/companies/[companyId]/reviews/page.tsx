"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  followers_count: number;
  average_rating: number;
  reviews_count: number;
}

interface Review {
  id: string;
  company_id: string;
  user_email: string;
  employment_type: string;
  department: string | null;
  overall_rating: number;
  work_life_rating: number | null;
  culture_rating: number | null;
  growth_rating: number | null;
  compensation_rating: number | null;
  pros: string;
  cons: string;
  interview_tips: string | null;
  is_anonymous: boolean;
  helpful_count: number;
  created_at: string;
  author: {
    username: string;
    name: string;
    image: string | null;
  } | null;
  hasVotedHelpful: boolean;
}

interface RatingBreakdown {
  rating: number;
  count: number;
  percentage: number;
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClasses[size]} ${
            star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"
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

function CompanyLogo({ company, size = "lg" }: { company: Company | null; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

  if (!company) {
    return <div className={`${sizeClasses[size]} rounded-2xl bg-gray-200 animate-pulse`}></div>;
  }

  if (company.logo_url) {
    return (
      <img
        src={company.logo_url}
        alt={company.name}
        className={`${sizeClasses[size]} rounded-2xl object-cover shadow-lg`}
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
    <div className={`${sizeClasses[size]} rounded-2xl gradient-primary flex items-center justify-center font-bold text-white shadow-lg`}>
      {initials}
    </div>
  );
}

function RatingBar({ label, rating, isDarkTheme }: { label: string; rating: number | null; isDarkTheme: boolean }) {
  if (rating === null) return null;

  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm w-32 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>{label}</span>
      <div className={`flex-1 h-2 rounded-full ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"}`}>
        <div
          className="h-full rounded-full bg-yellow-400"
          style={{ width: `${(rating / 5) * 100}%` }}
        ></div>
      </div>
      <span className={`text-sm font-medium w-8 text-right ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
        {rating.toFixed(1)}
      </span>
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

const employmentTypeLabels: Record<string, string> = {
  intern: "Intern",
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
};

export default function CompanyReviewsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params.companyId as string;
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const userEmail = session?.user?.email;

  const [company, setCompany] = useState<Company | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [employmentFilter, setEmploymentFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [showSuccess, setShowSuccess] = useState(false);

  // Rating breakdown
  const [ratingBreakdown, setRatingBreakdown] = useState<RatingBreakdown[]>([]);

  // Average ratings
  const [avgWorkLife, setAvgWorkLife] = useState(0);
  const [avgCulture, setAvgCulture] = useState(0);
  const [avgGrowth, setAvgGrowth] = useState(0);
  const [avgCompensation, setAvgCompensation] = useState(0);

  // Check for success message
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  // Fetch company and reviews
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch company
      const companyRes = await fetch(`/api/companies/${companyId}`);
      const companyData = await companyRes.json();

      if (companyData.company) {
        setCompany(companyData.company);
      }

      // Fetch reviews
      const params = new URLSearchParams();
      params.set("company_id", companyId);
      params.set("sort_by", sortBy);
      if (ratingFilter) params.set("min_rating", ratingFilter.toString());
      if (ratingFilter) params.set("max_rating", ratingFilter.toString());
      if (employmentFilter) params.set("employment_type", employmentFilter);
      if (userEmail) params.set("current_user", userEmail);

      const reviewsRes = await fetch(`/api/reviews?${params.toString()}`);
      const reviewsData = await reviewsRes.json();

      if (reviewsData.reviews) {
        setReviews(reviewsData.reviews);

        // Calculate rating breakdown
        const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let workLifeTotal = 0, workLifeCount = 0;
        let cultureTotal = 0, cultureCount = 0;
        let growthTotal = 0, growthCount = 0;
        let compTotal = 0, compCount = 0;

        reviewsData.reviews.forEach((r: Review) => {
          breakdown[r.overall_rating] = (breakdown[r.overall_rating] || 0) + 1;
          if (r.work_life_rating) { workLifeTotal += r.work_life_rating; workLifeCount++; }
          if (r.culture_rating) { cultureTotal += r.culture_rating; cultureCount++; }
          if (r.growth_rating) { growthTotal += r.growth_rating; growthCount++; }
          if (r.compensation_rating) { compTotal += r.compensation_rating; compCount++; }
        });

        const total = reviewsData.reviews.length;
        setRatingBreakdown(
          [5, 4, 3, 2, 1].map((rating) => ({
            rating,
            count: breakdown[rating] || 0,
            percentage: total > 0 ? ((breakdown[rating] || 0) / total) * 100 : 0,
          }))
        );

        setAvgWorkLife(workLifeCount > 0 ? workLifeTotal / workLifeCount : 0);
        setAvgCulture(cultureCount > 0 ? cultureTotal / cultureCount : 0);
        setAvgGrowth(growthCount > 0 ? growthTotal / growthCount : 0);
        setAvgCompensation(compCount > 0 ? compTotal / compCount : 0);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId, sortBy, ratingFilter, employmentFilter, userEmail]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

      setReviews((prev) =>
        prev.map((r) =>
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

  if (!company) {
    return (
      <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className={`text-xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Company Not Found
          </h1>
          <Link href="/reviews" className="btn-premium px-6 py-2">
            Browse Reviews
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Review submitted successfully!
        </div>
      )}

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${isDarkTheme ? "border-red-800/30" : "border-gray-200/50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">i</span>
                </div>
                <span className={`font-bold text-xl ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  internship.sg
                </span>
              </Link>
              <span className={`${isDarkTheme ? "text-gray-600" : "text-gray-300"}`}>/</span>
              <Link
                href={`/companies/${companyId}`}
                className={`text-sm font-medium ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
              >
                {company.name}
              </Link>
            </div>
            <Link
              href={`/reviews/write?company=${companyId}`}
              className="btn-premium px-5 py-2.5 text-sm"
            >
              Write a Review
            </Link>
          </div>
        </div>
      </nav>

      {/* Company Header */}
      <section className={`py-12 px-4 sm:px-6 lg:px-8 border-b ${isDarkTheme ? "border-gray-800" : "border-gray-100"}`}>
        <div className="max-w-7xl mx-auto">
          <Link
            href={`/companies/${companyId}`}
            className={`inline-flex items-center gap-2 text-sm font-medium mb-6 ${
              isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Company
          </Link>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <CompanyLogo company={company} />
            <div className="flex-1">
              <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                {company.name} Reviews
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                    {(company.average_rating || 0).toFixed(1)}
                  </span>
                  <div>
                    <StarRating rating={company.average_rating || 0} size="md" />
                    <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      {company.reviews_count || 0} reviews
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar - Rating Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Overall Rating Breakdown */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  Rating Breakdown
                </h2>
                <div className="space-y-3">
                  {ratingBreakdown.map(({ rating, count, percentage }) => (
                    <button
                      key={rating}
                      onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        ratingFilter === rating
                          ? isDarkTheme
                            ? "bg-red-900/30"
                            : "bg-red-50"
                          : ""
                      }`}
                    >
                      <span className={`text-sm font-medium w-6 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                        {rating}
                      </span>
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <div className={`flex-1 h-2 rounded-full ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"}`}>
                        <div
                          className="h-full rounded-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm w-8 text-right ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Ratings */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  Rating by Category
                </h2>
                <div className="space-y-4">
                  <RatingBar label="Work-Life Balance" rating={avgWorkLife || null} isDarkTheme={isDarkTheme} />
                  <RatingBar label="Culture & Values" rating={avgCulture || null} isDarkTheme={isDarkTheme} />
                  <RatingBar label="Career Growth" rating={avgGrowth || null} isDarkTheme={isDarkTheme} />
                  <RatingBar label="Compensation" rating={avgCompensation || null} isDarkTheme={isDarkTheme} />
                </div>
              </div>

              {/* Write Review CTA */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gradient-to-br from-red-900/50 to-gray-800 border-red-800/50" : "bg-gradient-to-br from-red-50 to-white"}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  Worked at {company.name}?
                </h3>
                <p className={`text-sm mb-4 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                  Share your experience to help others
                </p>
                <Link
                  href={`/reviews/write?company=${companyId}`}
                  className="btn-premium w-full py-3 text-center block"
                >
                  Write a Review
                </Link>
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2">
              {/* Filters */}
              <div className={`flex flex-wrap gap-4 mb-6 p-4 rounded-xl ${isDarkTheme ? "bg-gray-800/50" : "bg-gray-50"}`}>
                <select
                  value={employmentFilter}
                  onChange={(e) => setEmploymentFilter(e.target.value)}
                  className={`px-4 py-2 rounded-xl border ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                >
                  <option value="">All Employment Types</option>
                  <option value="intern">Intern</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-4 py-2 rounded-xl border ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                >
                  <option value="created_at">Most Recent</option>
                  <option value="helpful">Most Helpful</option>
                  <option value="rating">Highest Rated</option>
                </select>

                {(ratingFilter || employmentFilter) && (
                  <button
                    onClick={() => {
                      setRatingFilter(null);
                      setEmploymentFilter("");
                    }}
                    className={`text-sm font-medium ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* Reviews */}
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <StarRating rating={review.overall_rating} size="sm" />
                            <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                              {review.overall_rating}/5
                            </span>
                          </div>
                          <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                            {review.is_anonymous ? "Anonymous" : review.author?.name || "Anonymous"} -{" "}
                            {employmentTypeLabels[review.employment_type] || review.employment_type}
                            {review.department && ` in ${review.department}`}
                          </p>
                        </div>
                        <span className={`text-sm ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>
                          {formatDate(review.created_at)}
                        </span>
                      </div>

                      {/* Category Ratings */}
                      {(review.work_life_rating || review.culture_rating || review.growth_rating || review.compensation_rating) && (
                        <div className="flex flex-wrap gap-4 mb-4">
                          {review.work_life_rating && (
                            <div className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                              Work-Life: <span className="font-medium">{review.work_life_rating}/5</span>
                            </div>
                          )}
                          {review.culture_rating && (
                            <div className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                              Culture: <span className="font-medium">{review.culture_rating}/5</span>
                            </div>
                          )}
                          {review.growth_rating && (
                            <div className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                              Growth: <span className="font-medium">{review.growth_rating}/5</span>
                            </div>
                          )}
                          {review.compensation_rating && (
                            <div className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                              Compensation: <span className="font-medium">{review.compensation_rating}/5</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h4 className={`text-sm font-semibold mb-1 ${isDarkTheme ? "text-green-400" : "text-green-600"}`}>
                            Pros
                          </h4>
                          <p className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                            {review.pros}
                          </p>
                        </div>
                        <div>
                          <h4 className={`text-sm font-semibold mb-1 ${isDarkTheme ? "text-red-400" : "text-red-600"}`}>
                            Cons
                          </h4>
                          <p className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                            {review.cons}
                          </p>
                        </div>
                        {review.interview_tips && (
                          <div>
                            <h4 className={`text-sm font-semibold mb-1 ${isDarkTheme ? "text-blue-400" : "text-blue-600"}`}>
                              Interview Tips
                            </h4>
                            <p className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                              {review.interview_tips}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center justify-end mt-4 pt-4 border-t ${isDarkTheme ? "border-gray-700" : "border-gray-100"}`}>
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
                    <p className="text-sm mb-4">Be the first to share your experience at {company.name}!</p>
                    <Link href={`/reviews/write?company=${companyId}`} className="btn-premium inline-flex px-6 py-2">
                      Write a Review
                    </Link>
                  </div>
                )}
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
