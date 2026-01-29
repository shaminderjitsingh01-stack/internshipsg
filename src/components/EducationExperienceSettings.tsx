"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Education {
  id: string;
  school: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  grade: string | null;
  activities: string | null;
  description: string | null;
}

interface Experience {
  id: string;
  company: string;
  title: string;
  location: string | null;
  employment_type: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  skills_used: string[] | null;
}

interface Props {
  userEmail: string;
}

const EMPLOYMENT_TYPES = [
  { value: "internship", label: "Internship" },
  { value: "part-time", label: "Part-time" },
  { value: "full-time", label: "Full-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
];

const DEGREE_TYPES = [
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Certificate",
  "Other",
];

export default function EducationExperienceSettings({ userEmail }: Props) {
  const { isDarkTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"education" | "experience">("experience");

  // Education state
  const [education, setEducation] = useState<Education[]>([]);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [educationForm, setEducationForm] = useState({
    school: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    is_current: false,
    grade: "",
    activities: "",
    description: "",
  });

  // Experience state
  const [experience, setExperience] = useState<Experience[]>([]);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [experienceForm, setExperienceForm] = useState({
    company: "",
    title: "",
    location: "",
    employment_type: "internship",
    start_date: "",
    end_date: "",
    is_current: false,
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eduRes, expRes] = await Promise.all([
          fetch(`/api/profile/education?email=${encodeURIComponent(userEmail)}`),
          fetch(`/api/profile/experience?email=${encodeURIComponent(userEmail)}`),
        ]);

        if (eduRes.ok) {
          const eduData = await eduRes.json();
          setEducation(eduData.education || []);
        }

        if (expRes.ok) {
          const expData = await expRes.json();
          setExperience(expData.experience || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail]);

  // Education handlers
  const handleEducationSubmit = async () => {
    setError("");
    setSaving(true);

    try {
      const url = "/api/profile/education";
      const method = editingEducation ? "PUT" : "POST";
      const body = editingEducation
        ? { id: editingEducation.id, user_email: userEmail, ...educationForm }
        : { user_email: userEmail, ...educationForm };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save education");
      }

      const data = await res.json();

      if (editingEducation) {
        setEducation(education.map(e => e.id === editingEducation.id ? data.education : e));
      } else {
        setEducation([...education, data.education]);
      }

      setShowEducationForm(false);
      setEditingEducation(null);
      resetEducationForm();
      setSuccess("Education saved!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm("Delete this education entry?")) return;

    try {
      const res = await fetch(`/api/profile/education?id=${id}&email=${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setEducation(education.filter(e => e.id !== id));
      setSuccess("Education deleted!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError("Failed to delete education");
    }
  };

  const resetEducationForm = () => {
    setEducationForm({
      school: "",
      degree: "",
      field_of_study: "",
      start_date: "",
      end_date: "",
      is_current: false,
      grade: "",
      activities: "",
      description: "",
    });
  };

  // Experience handlers
  const handleExperienceSubmit = async () => {
    setError("");
    setSaving(true);

    try {
      const url = "/api/profile/experience";
      const method = editingExperience ? "PUT" : "POST";
      const body = editingExperience
        ? { id: editingExperience.id, user_email: userEmail, ...experienceForm }
        : { user_email: userEmail, ...experienceForm };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save experience");
      }

      const data = await res.json();

      if (editingExperience) {
        setExperience(experience.map(e => e.id === editingExperience.id ? data.experience : e));
      } else {
        setExperience([...experience, data.experience]);
      }

      setShowExperienceForm(false);
      setEditingExperience(null);
      resetExperienceForm();
      setSuccess("Experience saved!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm("Delete this experience entry?")) return;

    try {
      const res = await fetch(`/api/profile/experience?id=${id}&email=${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setExperience(experience.filter(e => e.id !== id));
      setSuccess("Experience deleted!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError("Failed to delete experience");
    }
  };

  const resetExperienceForm = () => {
    setExperienceForm({
      company: "",
      title: "",
      location: "",
      employment_type: "internship",
      start_date: "",
      end_date: "",
      is_current: false,
      description: "",
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Present";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-SG", { month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className={`rounded-2xl p-8 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <h2 className={`text-xl font-semibold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
        Education & Experience
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("experience")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "experience"
              ? "bg-red-600 text-white"
              : isDarkTheme ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Experience ({experience.length})
        </button>
        <button
          onClick={() => setActiveTab("education")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "education"
              ? "bg-red-600 text-white"
              : isDarkTheme ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Education ({education.length})
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Experience Tab */}
      {activeTab === "experience" && (
        <div className="space-y-4">
          {/* Experience List */}
          {experience.map((exp) => (
            <div
              key={exp.id}
              className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {exp.title}
                  </h3>
                  <p className={`${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                    {exp.company}
                    {exp.employment_type && (
                      <span className={`ml-2 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                        ({EMPLOYMENT_TYPES.find(t => t.value === exp.employment_type)?.label || exp.employment_type})
                      </span>
                    )}
                  </p>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatDate(exp.start_date)} - {exp.is_current ? "Present" : formatDate(exp.end_date)}
                    {exp.location && ` · ${exp.location}`}
                  </p>
                  {exp.description && (
                    <p className={`mt-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                      {exp.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingExperience(exp);
                      setExperienceForm({
                        company: exp.company,
                        title: exp.title,
                        location: exp.location || "",
                        employment_type: exp.employment_type || "internship",
                        start_date: exp.start_date || "",
                        end_date: exp.end_date || "",
                        is_current: exp.is_current,
                        description: exp.description || "",
                      });
                      setShowExperienceForm(true);
                    }}
                    className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteExperience(exp.id)}
                    className={`p-2 rounded-lg transition-colors text-red-500 ${isDarkTheme ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Experience Form */}
          {showExperienceForm ? (
            <div className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                {editingExperience ? "Edit Experience" : "Add Experience"}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={experienceForm.title}
                      onChange={(e) => setExperienceForm({ ...experienceForm, title: e.target.value })}
                      placeholder="e.g., Software Engineering Intern"
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Company *
                    </label>
                    <input
                      type="text"
                      value={experienceForm.company}
                      onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
                      placeholder="e.g., Google"
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Employment Type
                    </label>
                    <select
                      value={experienceForm.employment_type}
                      onChange={(e) => setExperienceForm({ ...experienceForm, employment_type: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                    >
                      {EMPLOYMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={experienceForm.location}
                      onChange={(e) => setExperienceForm({ ...experienceForm, location: e.target.value })}
                      placeholder="e.g., Singapore"
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Start Date
                    </label>
                    <input
                      type="month"
                      value={experienceForm.start_date}
                      onChange={(e) => setExperienceForm({ ...experienceForm, start_date: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      End Date
                    </label>
                    <input
                      type="month"
                      value={experienceForm.end_date}
                      onChange={(e) => setExperienceForm({ ...experienceForm, end_date: e.target.value })}
                      disabled={experienceForm.is_current}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'} ${experienceForm.is_current ? 'opacity-50' : ''}`}
                    />
                    <label className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={experienceForm.is_current}
                        onChange={(e) => setExperienceForm({ ...experienceForm, is_current: e.target.checked })}
                        className="rounded"
                      />
                      <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                        I currently work here
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={experienceForm.description}
                    onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                    placeholder="Describe your responsibilities and achievements..."
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border resize-none ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExperienceSubmit}
                    disabled={saving || !experienceForm.title || !experienceForm.company}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingExperience ? "Update" : "Add Experience"}
                  </button>
                  <button
                    onClick={() => {
                      setShowExperienceForm(false);
                      setEditingExperience(null);
                      resetExperienceForm();
                    }}
                    className={`px-4 py-2 rounded-lg font-medium ${isDarkTheme ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowExperienceForm(true)}
              className={`w-full p-4 rounded-xl border-2 border-dashed transition-colors ${
                isDarkTheme
                  ? 'border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300'
                  : 'border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-600'
              }`}
            >
              + Add Experience
            </button>
          )}
        </div>
      )}

      {/* Education Tab */}
      {activeTab === "education" && (
        <div className="space-y-4">
          {/* Education List */}
          {education.map((edu) => (
            <div
              key={edu.id}
              className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {edu.school}
                  </h3>
                  <p className={`${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                    {edu.degree && `${edu.degree}`}
                    {edu.field_of_study && ` in ${edu.field_of_study}`}
                  </p>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatDate(edu.start_date)} - {edu.is_current ? "Present" : formatDate(edu.end_date)}
                    {edu.grade && ` · ${edu.grade}`}
                  </p>
                  {edu.activities && (
                    <p className={`mt-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                      {edu.activities}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingEducation(edu);
                      setEducationForm({
                        school: edu.school,
                        degree: edu.degree || "",
                        field_of_study: edu.field_of_study || "",
                        start_date: edu.start_date || "",
                        end_date: edu.end_date || "",
                        is_current: edu.is_current,
                        grade: edu.grade || "",
                        activities: edu.activities || "",
                        description: edu.description || "",
                      });
                      setShowEducationForm(true);
                    }}
                    className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteEducation(edu.id)}
                    className={`p-2 rounded-lg transition-colors text-red-500 ${isDarkTheme ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Education Form */}
          {showEducationForm ? (
            <div className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                {editingEducation ? "Edit Education" : "Add Education"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    School/University *
                  </label>
                  <input
                    type="text"
                    value={educationForm.school}
                    onChange={(e) => setEducationForm({ ...educationForm, school: e.target.value })}
                    placeholder="e.g., National University of Singapore"
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Degree
                    </label>
                    <select
                      value={educationForm.degree}
                      onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                    >
                      <option value="">Select degree...</option>
                      {DEGREE_TYPES.map(degree => (
                        <option key={degree} value={degree}>{degree}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Field of Study
                    </label>
                    <input
                      type="text"
                      value={educationForm.field_of_study}
                      onChange={(e) => setEducationForm({ ...educationForm, field_of_study: e.target.value })}
                      placeholder="e.g., Computer Science"
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Start Date
                    </label>
                    <input
                      type="month"
                      value={educationForm.start_date}
                      onChange={(e) => setEducationForm({ ...educationForm, start_date: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      End Date (or Expected)
                    </label>
                    <input
                      type="month"
                      value={educationForm.end_date}
                      onChange={(e) => setEducationForm({ ...educationForm, end_date: e.target.value })}
                      disabled={educationForm.is_current}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'} ${educationForm.is_current ? 'opacity-50' : ''}`}
                    />
                    <label className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={educationForm.is_current}
                        onChange={(e) => setEducationForm({ ...educationForm, is_current: e.target.checked })}
                        className="rounded"
                      />
                      <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                        Currently studying here
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Grade/GPA
                  </label>
                  <input
                    type="text"
                    value={educationForm.grade}
                    onChange={(e) => setEducationForm({ ...educationForm, grade: e.target.value })}
                    placeholder="e.g., First Class Honours, GPA 4.0/5.0"
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Activities & Societies
                  </label>
                  <textarea
                    value={educationForm.activities}
                    onChange={(e) => setEducationForm({ ...educationForm, activities: e.target.value })}
                    placeholder="Clubs, societies, achievements..."
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border resize-none ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEducationSubmit}
                    disabled={saving || !educationForm.school}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingEducation ? "Update" : "Add Education"}
                  </button>
                  <button
                    onClick={() => {
                      setShowEducationForm(false);
                      setEditingEducation(null);
                      resetEducationForm();
                    }}
                    className={`px-4 py-2 rounded-lg font-medium ${isDarkTheme ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowEducationForm(true)}
              className={`w-full p-4 rounded-xl border-2 border-dashed transition-colors ${
                isDarkTheme
                  ? 'border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300'
                  : 'border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-600'
              }`}
            >
              + Add Education
            </button>
          )}
        </div>
      )}
    </div>
  );
}
