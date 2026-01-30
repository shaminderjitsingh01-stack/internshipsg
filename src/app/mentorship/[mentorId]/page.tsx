"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

interface Mentor {
  id: string;
  user_email: string;
  title: string | null;
  bio: string | null;
  expertise_areas: string[] | null;
  industries: string[] | null;
  skills: string[] | null;
  years_experience: number | null;
  company: string | null;
  position: string | null;
  hourly_rate: number | null;
  is_free: boolean;
  max_mentees: number;
  current_mentees: number;
  availability: Record<string, string[]> | null;
  timezone: string;
  rating: number;
  total_reviews: number;
  total_sessions: number;
  is_verified: boolean;
  linkedin_url: string | null;
  website_url: string | null;
  name?: string;
  image_url?: string;
  school?: string;
  username?: string;
}

interface Review {
  id: string;
  mentor_id: string;
  mentee_email: string;
  rating: number;
  review: string | null;
  is_anonymous: boolean;
  created_at: string;
  mentee?: {
    name: string;
    image_url: string | null;
  };
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function AvailabilityCalendar({
  availability,
  isDark,
}: {
  availability: Record<string, string[]> | null;
  isDark: boolean;
}) {
  if (!availability || Object.keys(availability).length === 0) {
    return (
      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        Availability not set
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const slots = availability[day] || [];
        return (
          <div key={day} className="flex items-center gap-3">
            <span
              className={`w-12 text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              {DAY_LABELS[day]}
            </span>
            {slots.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 text-xs rounded ${
                      isDark ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {slot}
                  </span>
                ))}
              </div>
            ) : (
              <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                Not available
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RequestMentorshipModal({
  mentor,
  isDark,
  userEmail,
  onClose,
  onSuccess,
}: {
  mentor: Mentor;
  isDark: boolean;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    message: "",
    goals: "",
    areas_of_interest: "",
    preferred_schedule: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/mentorship/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id: mentor.id,
          mentee_email: userEmail,
          message: formData.message,
          goals: formData.goals,
          areas_of_interest: formData.areas_of_interest.split(",").map((s) => s.trim()).filter(Boolean),
          preferred_schedule: formData.preferred_schedule,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || "Failed to send request");
      }
    } catch (err) {
      setError("Failed to send request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-xl border ${
    isDark
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
  } focus:outline-none focus:ring-2 focus:ring-red-500/50`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 ${
          isDark ? "bg-slate-900" : "bg-white"
        } shadow-xl`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg ${
            isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
          Request Mentorship
        </h2>
        <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Send a request to {mentor.name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Introduction Message *
            </label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className={inputClass}
              placeholder="Introduce yourself and explain why you'd like this mentor..."
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Your Goals
            </label>
            <textarea
              rows={2}
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              className={inputClass}
              placeholder="What do you hope to achieve through this mentorship?"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Areas of Interest (comma-separated)
            </label>
            <input
              type="text"
              value={formData.areas_of_interest}
              onChange={(e) => setFormData({ ...formData, areas_of_interest: e.target.value })}
              className={inputClass}
              placeholder="e.g., Career Advice, Technical Skills"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Preferred Schedule
            </label>
            <input
              type="text"
              value={formData.preferred_schedule}
              onChange={(e) => setFormData({ ...formData, preferred_schedule: e.target.value })}
              className={inputClass}
              placeholder="e.g., Weekday evenings, Weekend mornings"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl border font-medium ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MentorProfilePage({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  const { mentorId } = use(params);
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const userEmail = session?.user?.email;

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Fetch mentor details
  const fetchMentor = useCallback(async () => {
    setLoading(true);
    try {
      // Get mentor from the list (we'd ideally have a single mentor endpoint)
      const res = await fetch(`/api/mentorship?search=`);
      const data = await res.json();
      const foundMentor = data.mentors?.find((m: Mentor) => m.id === mentorId);
      setMentor(foundMentor || null);

      // Fetch reviews (mock - in real implementation, would need separate endpoint)
      // For now, we'll show a placeholder
    } catch (error) {
      console.error("Error fetching mentor:", error);
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  useEffect(() => {
    fetchMentor();
  }, [fetchMentor]);

  const handleRequestMentorship = () => {
    if (!userEmail) {
      router.push("/auth/signin");
      return;
    }
    if (mentor?.user_email === userEmail) {
      alert("You cannot request mentorship from yourself");
      return;
    }
    setShowRequestModal(true);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isDarkTheme ? "bg-slate-800" : "bg-slate-100"
          }`}
        >
          <svg
            className={`w-8 h-8 ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h2 className={`text-xl font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
          Mentor Not Found
        </h2>
        <p className={`mb-4 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
          This mentor profile does not exist or has been deactivated.
        </p>
        <Link
          href="/mentorship"
          className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
        >
          Back to Mentorship
        </Link>
      </div>
    );
  }

  const isAvailable = mentor.current_mentees < mentor.max_mentees;
  const isOwnProfile = userEmail === mentor.user_email;

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/mentorship"
            className={`flex items-center gap-2 ${isDarkTheme ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Mentorship</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div
              className={`rounded-xl border p-6 ${
                isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-start gap-5">
                {mentor.image_url ? (
                  <img
                    src={mentor.image_url}
                    alt={mentor.name || "Mentor"}
                    className={`w-20 h-20 rounded-full border-2 ${isDarkTheme ? "border-slate-700" : "border-slate-200"}`}
                  />
                ) : (
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                    }`}
                  >
                    <span className={`font-semibold text-3xl ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                      {(mentor.name || "M").charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      {mentor.name}
                    </h1>
                    {mentor.is_verified && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className={`text-lg ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                    {mentor.position || mentor.title}
                    {mentor.company && ` at ${mentor.company}`}
                  </p>
                  {mentor.school && (
                    <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      {mentor.school}
                    </p>
                  )}

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1">
                      <StarRating rating={Math.round(mentor.rating)} size="md" />
                      <span className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                        {mentor.rating.toFixed(1)}
                      </span>
                      <span className={`text-sm ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                        ({mentor.total_reviews} reviews)
                      </span>
                    </div>
                    <span className={`text-sm ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                      {mentor.total_sessions} sessions completed
                    </span>
                  </div>

                  {/* Links */}
                  <div className="flex items-center gap-4 mt-4">
                    {mentor.linkedin_url && (
                      <a
                        href={mentor.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 text-sm ${
                          isDarkTheme ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                        LinkedIn
                      </a>
                    )}
                    {mentor.website_url && (
                      <a
                        href={mentor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 text-sm ${
                          isDarkTheme ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                          />
                        </svg>
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {mentor.bio && (
              <div
                className={`rounded-xl border p-6 ${
                  isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                }`}
              >
                <h2 className={`text-lg font-semibold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  About
                </h2>
                <p className={`whitespace-pre-wrap ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                  {mentor.bio}
                </p>
              </div>
            )}

            {/* Expertise & Skills */}
            <div
              className={`rounded-xl border p-6 ${
                isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Expertise & Skills
              </h2>

              {mentor.expertise_areas && mentor.expertise_areas.length > 0 && (
                <div className="mb-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Expertise Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise_areas.map((area) => (
                      <span
                        key={area}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          isDarkTheme ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {mentor.industries && mentor.industries.length > 0 && (
                <div className="mb-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Industries
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {mentor.industries.map((industry) => (
                      <span
                        key={industry}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          isDarkTheme ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {mentor.skills && mentor.skills.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {mentor.skills.map((skill) => (
                      <span
                        key={skill}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          isDarkTheme ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Availability */}
            <div
              className={`rounded-xl border p-6 ${
                isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Availability
              </h2>
              <AvailabilityCalendar availability={mentor.availability} isDark={isDarkTheme} />
              <p className={`text-sm mt-4 ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                Timezone: {mentor.timezone}
              </p>
            </div>

            {/* Reviews Section */}
            <div
              className={`rounded-xl border p-6 ${
                isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Reviews ({mentor.total_reviews})
              </h2>

              {mentor.total_reviews === 0 ? (
                <p className={`text-center py-8 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                  No reviews yet
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Placeholder for reviews - would fetch from API in real implementation */}
                  <p className={`text-center py-8 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Reviews will appear here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Request Card */}
          <div className="space-y-6">
            <div
              className={`rounded-xl border p-6 sticky top-24 ${
                isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              {/* Pricing */}
              <div className="text-center mb-6">
                {mentor.is_free ? (
                  <p className="text-3xl font-bold text-green-600">Free</p>
                ) : mentor.hourly_rate ? (
                  <p className={`text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    ${mentor.hourly_rate}
                    <span className={`text-base font-normal ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      /hour
                    </span>
                  </p>
                ) : (
                  <p className={`text-lg ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Contact for pricing
                  </p>
                )}
              </div>

              {/* Capacity */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Capacity
                  </span>
                  <span className={`text-sm font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {mentor.current_mentees}/{mentor.max_mentees} mentees
                  </span>
                </div>
                <div className={`h-2 rounded-full ${isDarkTheme ? "bg-slate-800" : "bg-slate-200"}`}>
                  <div
                    className={`h-2 rounded-full ${isAvailable ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${(mentor.current_mentees / mentor.max_mentees) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Experience */}
              {mentor.years_experience && (
                <div className={`flex items-center justify-between py-3 border-t ${isDarkTheme ? "border-slate-800" : "border-slate-100"}`}>
                  <span className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Experience
                  </span>
                  <span className={`text-sm font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {mentor.years_experience}+ years
                  </span>
                </div>
              )}

              {/* Request Button */}
              {!isOwnProfile && (
                <button
                  onClick={handleRequestMentorship}
                  disabled={!isAvailable}
                  className={`w-full py-3 mt-4 rounded-xl font-semibold transition-colors ${
                    isAvailable
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : isDarkTheme
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isAvailable ? "Request Mentorship" : "Currently Full"}
                </button>
              )}

              {isOwnProfile && (
                <Link
                  href="/mentorship"
                  className="block w-full py-3 mt-4 text-center rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && userEmail && (
        <RequestMentorshipModal
          mentor={mentor}
          isDark={isDarkTheme}
          userEmail={userEmail}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            alert("Request sent successfully!");
            router.push("/mentorship/my");
          }}
        />
      )}
    </div>
  );
}
