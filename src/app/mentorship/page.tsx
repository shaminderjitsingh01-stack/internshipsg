"use client";

import { useState, useEffect, useCallback } from "react";
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
  rating: number;
  total_reviews: number;
  total_sessions: number;
  is_verified: boolean;
  name?: string;
  image_url?: string;
  school?: string;
  username?: string;
}

interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_email: string;
  status: string;
  start_date: string;
  total_sessions: number;
  mentor?: Mentor;
}

const INDUSTRIES = [
  { value: "", label: "All Industries" },
  { value: "technology", label: "Technology" },
  { value: "finance", label: "Finance & Banking" },
  { value: "consulting", label: "Consulting" },
  { value: "healthcare", label: "Healthcare" },
  { value: "marketing", label: "Marketing" },
  { value: "startups", label: "Startups" },
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "data_science", label: "Data Science" },
  { value: "product", label: "Product Management" },
];

const SKILLS = [
  { value: "", label: "All Skills" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "react", label: "React" },
  { value: "machine_learning", label: "Machine Learning" },
  { value: "data_analysis", label: "Data Analysis" },
  { value: "product_management", label: "Product Management" },
  { value: "ux_design", label: "UX Design" },
  { value: "leadership", label: "Leadership" },
  { value: "communication", label: "Communication" },
  { value: "interview_prep", label: "Interview Prep" },
];

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
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

function MentorCard({
  mentor,
  isDark,
  onRequestMentorship,
}: {
  mentor: Mentor;
  isDark: boolean;
  onRequestMentorship: (mentor: Mentor) => void;
}) {
  const isAvailable = mentor.current_mentees < mentor.max_mentees;

  return (
    <div
      className={`rounded-xl border p-5 transition-all hover:shadow-lg ${
        isDark
          ? "bg-slate-900 border-slate-800 hover:border-slate-700"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <Link href={`/mentorship/${mentor.id}`}>
          {mentor.image_url ? (
            <img
              src={mentor.image_url}
              alt={mentor.name || "Mentor"}
              className={`w-14 h-14 rounded-full border-2 ${isDark ? "border-slate-700" : "border-slate-200"}`}
            />
          ) : (
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isDark ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <span className={`font-semibold text-xl ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {(mentor.name || "M").charAt(0)}
              </span>
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/mentorship/${mentor.id}`}
              className={`font-semibold hover:underline ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {mentor.name}
            </Link>
            {mentor.is_verified && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                Verified
              </span>
            )}
          </div>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {mentor.position || mentor.title}
            {mentor.company && ` at ${mentor.company}`}
          </p>
          {mentor.school && (
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {mentor.school}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {mentor.bio && (
        <p className={`text-sm mb-4 line-clamp-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          {mentor.bio}
        </p>
      )}

      {/* Skills/Expertise */}
      {mentor.skills && mentor.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {mentor.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className={`px-2 py-0.5 text-xs rounded-full ${
                isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
              }`}
            >
              {skill}
            </span>
          ))}
          {mentor.skills.length > 4 && (
            <span className={`px-2 py-0.5 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              +{mentor.skills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className={`flex items-center gap-4 mb-4 pb-4 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex items-center gap-1">
          <StarRating rating={Math.round(mentor.rating)} />
          <span className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
            {mentor.rating.toFixed(1)}
          </span>
          <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            ({mentor.total_reviews})
          </span>
        </div>
        <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {mentor.total_sessions} sessions
        </span>
        {mentor.years_experience && (
          <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {mentor.years_experience}+ years exp
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div>
          {mentor.is_free ? (
            <span className="text-green-600 font-medium text-sm">Free</span>
          ) : mentor.hourly_rate ? (
            <span className={`font-medium text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
              ${mentor.hourly_rate}/hr
            </span>
          ) : null}
          <span className={`text-xs ml-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {mentor.current_mentees}/{mentor.max_mentees} mentees
          </span>
        </div>
        <button
          onClick={() => onRequestMentorship(mentor)}
          disabled={!isAvailable}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isAvailable
              ? "bg-red-600 text-white hover:bg-red-700"
              : isDark
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isAvailable ? "Request" : "Full"}
        </button>
      </div>
    </div>
  );
}

function BecomeMentorForm({
  isDark,
  userEmail,
  onSuccess,
  existingMentor,
}: {
  isDark: boolean;
  userEmail: string;
  onSuccess: () => void;
  existingMentor?: Mentor | null;
}) {
  const [formData, setFormData] = useState({
    title: existingMentor?.title || "",
    bio: existingMentor?.bio || "",
    expertise_areas: existingMentor?.expertise_areas?.join(", ") || "",
    industries: existingMentor?.industries || [],
    skills: existingMentor?.skills?.join(", ") || "",
    years_experience: existingMentor?.years_experience?.toString() || "",
    company: existingMentor?.company || "",
    position: existingMentor?.position || "",
    is_free: existingMentor?.is_free ?? true,
    hourly_rate: existingMentor?.hourly_rate?.toString() || "",
    max_mentees: existingMentor?.max_mentees?.toString() || "5",
    linkedin_url: existingMentor?.linkedin_url || "",
    website_url: existingMentor?.website_url || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/mentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          title: formData.title,
          bio: formData.bio,
          expertise_areas: formData.expertise_areas.split(",").map((s) => s.trim()).filter(Boolean),
          industries: formData.industries,
          skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
          company: formData.company,
          position: formData.position,
          is_free: formData.is_free,
          hourly_rate: formData.is_free ? null : (formData.hourly_rate ? parseInt(formData.hourly_rate) : null),
          max_mentees: parseInt(formData.max_mentees) || 5,
          linkedin_url: formData.linkedin_url,
          website_url: formData.website_url,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || "Failed to register");
      }
    } catch (err) {
      setError("Failed to register as mentor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-xl border ${
    isDark
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
  } focus:outline-none focus:ring-2 focus:ring-red-500/50`;

  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Professional Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={inputClass}
            placeholder="e.g., Software Engineer, Product Manager"
          />
        </div>
        <div>
          <label className={labelClass}>Current Company</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className={inputClass}
            placeholder="e.g., Google, Grab"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Position</label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            className={inputClass}
            placeholder="e.g., Senior Engineer, Team Lead"
          />
        </div>
        <div>
          <label className={labelClass}>Years of Experience</label>
          <input
            type="number"
            min="0"
            value={formData.years_experience}
            onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
            className={inputClass}
            placeholder="e.g., 5"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Bio *</label>
        <textarea
          required
          rows={3}
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className={inputClass}
          placeholder="Tell potential mentees about yourself, your experience, and what you can help with..."
        />
      </div>

      <div>
        <label className={labelClass}>Industries</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {INDUSTRIES.slice(1).map((ind) => (
            <button
              key={ind.value}
              type="button"
              onClick={() => {
                const current = formData.industries;
                if (current.includes(ind.value)) {
                  setFormData({ ...formData, industries: current.filter((i) => i !== ind.value) });
                } else {
                  setFormData({ ...formData, industries: [...current, ind.value] });
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                formData.industries.includes(ind.value)
                  ? "bg-red-600 border-red-600 text-white"
                  : isDark
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Skills (comma-separated)</label>
        <input
          type="text"
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          className={inputClass}
          placeholder="e.g., Python, Machine Learning, Leadership"
        />
      </div>

      <div>
        <label className={labelClass}>Expertise Areas (comma-separated)</label>
        <input
          type="text"
          value={formData.expertise_areas}
          onChange={(e) => setFormData({ ...formData, expertise_areas: e.target.value })}
          className={inputClass}
          placeholder="e.g., Career Advice, Technical Skills, Interview Prep"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Max Mentees</label>
          <input
            type="number"
            min="1"
            max="20"
            value={formData.max_mentees}
            onChange={(e) => setFormData({ ...formData, max_mentees: e.target.value })}
            className={inputClass}
            placeholder="5"
          />
        </div>
        <div>
          <label className={labelClass}>Pricing</label>
          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={formData.is_free}
                onChange={() => setFormData({ ...formData, is_free: true })}
                className="text-red-600 focus:ring-red-500"
              />
              <span className={isDark ? "text-slate-300" : "text-slate-700"}>Free</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!formData.is_free}
                onChange={() => setFormData({ ...formData, is_free: false })}
                className="text-red-600 focus:ring-red-500"
              />
              <span className={isDark ? "text-slate-300" : "text-slate-700"}>Paid</span>
            </label>
          </div>
          {!formData.is_free && (
            <input
              type="number"
              min="1"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              className={`${inputClass} mt-2`}
              placeholder="Hourly rate ($)"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>LinkedIn URL</label>
          <input
            type="url"
            value={formData.linkedin_url}
            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            className={inputClass}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div>
          <label className={labelClass}>Website/Portfolio URL</label>
          <input
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            className={inputClass}
            placeholder="https://..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Registering..." : existingMentor ? "Update Profile" : "Become a Mentor"}
      </button>
    </form>
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

export default function MentorshipPage() {
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const userEmail = session?.user?.email;

  const [activeTab, setActiveTab] = useState<"find" | "become">("find");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [myMentorProfile, setMyMentorProfile] = useState<Mentor | null>(null);
  const [activeMentorships, setActiveMentorships] = useState<Mentorship[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [skill, setSkill] = useState("");
  const [isFreeOnly, setIsFreeOnly] = useState(false);

  // Modal
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  // Fetch mentors
  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (industry) params.set("industry", industry);
      if (skill) params.set("skill", skill);
      if (isFreeOnly) params.set("is_free", "true");
      if (userEmail) params.set("user_email", userEmail);

      const res = await fetch(`/api/mentorship?${params.toString()}`);
      const data = await res.json();
      if (data.mentors) {
        // Filter out self
        setMentors(data.mentors.filter((m: Mentor) => m.user_email !== userEmail));
      }
    } catch (error) {
      console.error("Error fetching mentors:", error);
    } finally {
      setLoading(false);
    }
  }, [search, industry, skill, isFreeOnly, userEmail]);

  // Check if user is already a mentor
  const checkMentorStatus = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/mentorship?search=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      const myProfile = data.mentors?.find((m: Mentor) => m.user_email === userEmail);
      setMyMentorProfile(myProfile || null);
    } catch (error) {
      console.error("Error checking mentor status:", error);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchMentors();
    checkMentorStatus();
  }, [fetchMentors, checkMentorStatus]);

  const handleRequestMentorship = (mentor: Mentor) => {
    if (!userEmail) {
      router.push("/auth/signin");
      return;
    }
    setSelectedMentor(mentor);
  };

  const handleMentorRegistered = () => {
    checkMentorStatus();
    setActiveTab("find");
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Internship.sg"
              className={`h-7 sm:h-8 w-auto ${isDarkTheme ? "brightness-0 invert" : ""}`}
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/mentorship/my"
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              My Mentorships
            </Link>
            <Link
              href="/dashboard"
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Dashboard
            </Link>
            {session?.user?.image ? (
              <Link href="/settings">
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 ${
                    isDarkTheme ? "border-slate-700" : "border-slate-200"
                  }`}
                />
              </Link>
            ) : session?.user ? (
              <Link href="/settings">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                    isDarkTheme ? "bg-red-900/50" : "bg-red-100"
                  }`}
                >
                  <span className="text-red-600 font-semibold text-sm">
                    {session.user.name?.charAt(0) || "U"}
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-red-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Mentorship
          </h1>
          <p className={`text-base sm:text-lg ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Connect with experienced professionals or share your knowledge
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div
            className={`inline-flex p-1 rounded-xl ${isDarkTheme ? "bg-slate-900" : "bg-slate-100"}`}
          >
            <button
              onClick={() => setActiveTab("find")}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "find"
                  ? "bg-red-600 text-white shadow-lg"
                  : isDarkTheme
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Find a Mentor
            </button>
            <button
              onClick={() => setActiveTab("become")}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "become"
                  ? "bg-red-600 text-white shadow-lg"
                  : isDarkTheme
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {myMentorProfile ? "Edit Mentor Profile" : "Become a Mentor"}
            </button>
          </div>
        </div>

        {activeTab === "find" ? (
          <>
            {/* Filters */}
            <div
              className={`rounded-xl p-4 mb-6 border ${
                isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="sm:col-span-2">
                  <div className="relative">
                    <svg
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                        isDarkTheme ? "text-slate-500" : "text-slate-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search mentors..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                        isDarkTheme
                          ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                          : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                      } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                    />
                  </div>
                </div>

                {/* Industry Filter */}
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-white border-slate-200 text-slate-900"
                  } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </select>

                {/* Skill Filter */}
                <select
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-white border-slate-200 text-slate-900"
                  } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                >
                  {SKILLS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                {/* Free Only Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFreeOnly}
                    onChange={(e) => setIsFreeOnly(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                    Free mentors only
                  </span>
                </label>
              </div>
            </div>

            {/* Mentors Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : mentors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentors.map((mentor) => (
                  <MentorCard
                    key={mentor.id}
                    mentor={mentor}
                    isDark={isDarkTheme}
                    onRequestMentorship={handleRequestMentorship}
                  />
                ))}
              </div>
            ) : (
              <div
                className={`text-center py-12 rounded-xl border ${
                  isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  No mentors found
                </h3>
                <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </>
        ) : (
          /* Become a Mentor Form */
          <div
            className={`max-w-2xl mx-auto rounded-xl border p-6 ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            {!userEmail ? (
              <div className="text-center py-8">
                <p className={`mb-4 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  Please sign in to become a mentor
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {myMentorProfile ? "Edit Your Mentor Profile" : "Become a Mentor"}
                  </h2>
                  <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Share your expertise and help others grow in their careers
                  </p>
                </div>
                <BecomeMentorForm
                  isDark={isDarkTheme}
                  userEmail={userEmail}
                  onSuccess={handleMentorRegistered}
                  existingMentor={myMentorProfile}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {selectedMentor && userEmail && (
        <RequestMentorshipModal
          mentor={selectedMentor}
          isDark={isDarkTheme}
          userEmail={userEmail}
          onClose={() => setSelectedMentor(null)}
          onSuccess={() => {
            setSelectedMentor(null);
            alert("Request sent successfully!");
          }}
        />
      )}

      {/* Footer */}
      <footer
        className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${
          isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div
          className={`max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm ${
            isDarkTheme ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">
              Home
            </Link>
            <Link href="/network" className="hover:text-red-600 transition-colors">
              Network
            </Link>
            <Link href="/events" className="hover:text-red-600 transition-colors">
              Events
            </Link>
            <Link href="/jobs" className="hover:text-red-600 transition-colors">
              Jobs
            </Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">
              Dashboard
            </Link>
          </div>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
