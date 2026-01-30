"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

// Resume data structure
interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
}

interface Experience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  grade: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  url: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  certifications: Certification[];
}

interface Resume {
  id: string;
  title: string;
  template: string;
  data: ResumeData;
  is_primary: boolean;
  updated_at: string;
}

const TEMPLATES = [
  { id: "modern", name: "Modern", description: "Clean and professional" },
  { id: "classic", name: "Classic", description: "Traditional format" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant" },
  { id: "creative", name: "Creative", description: "Stand out from the crowd" },
];

const SECTIONS = [
  { id: "contact", label: "Contact Info", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "summary", label: "Summary", icon: "M4 6h16M4 12h16M4 18h7" },
  { id: "experience", label: "Experience", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { id: "education", label: "Education", icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" },
  { id: "skills", label: "Skills", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { id: "projects", label: "Projects", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
  { id: "certifications", label: "Certifications", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
];

const defaultResumeData: ResumeData = {
  contact: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
};

export default function ResumeEditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const resumeId = params.resumeId as string;
  const { isDarkTheme, toggleTheme } = useTheme();

  const [resume, setResume] = useState<Resume | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [template, setTemplate] = useState("modern");
  const [title, setTitle] = useState("My Resume");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "">("");
  const [activeSection, setActiveSection] = useState("contact");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [importingProfile, setImportingProfile] = useState(false);

  // For skills input
  const [skillInput, setSkillInput] = useState("");

  // Debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/resume");
    }
  }, [status, router]);

  // Fetch resume data
  useEffect(() => {
    const fetchResume = async () => {
      if (!session?.user?.email || !resumeId) return;

      try {
        const res = await fetch(`/api/resumes/${resumeId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.resume) {
            setResume(data.resume);
            setTemplate(data.resume.template || "modern");
            setTitle(data.resume.title || "My Resume");
            setResumeData(data.resume.data || defaultResumeData);
          }
        } else {
          router.push("/resume");
        }
      } catch (error) {
        console.error("Failed to fetch resume:", error);
        router.push("/resume");
      } finally {
        setLoading(false);
      }
    };

    if (session && resumeId) {
      fetchResume();
    }
  }, [session, resumeId, router]);

  // Auto-save with debounce
  const saveResume = useCallback(async () => {
    if (!session?.user?.email || !resumeId) return;

    setSaving(true);
    setSaveStatus("saving");

    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          template,
          data: resumeData,
        }),
      });

      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Failed to save resume:", error);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [session, resumeId, title, template, resumeData]);

  // Trigger debounced save when data changes
  useEffect(() => {
    if (!loading && resume) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveResume();
      }, 1500);
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [resumeData, template, title, loading, resume, saveResume]);

  // Import from profile
  const handleImportProfile = async () => {
    if (!session?.user?.email) return;

    setImportingProfile(true);

    try {
      // Fetch profile data
      const profileRes = await fetch(`/api/profile?email=${encodeURIComponent(session.user.email)}`);
      const profileData = profileRes.ok ? await profileRes.json() : null;

      // Fetch education
      const eduRes = await fetch(`/api/profile/education?email=${encodeURIComponent(session.user.email)}`);
      const eduData = eduRes.ok ? await eduRes.json() : null;

      // Fetch experience
      const expRes = await fetch(`/api/profile/experience?email=${encodeURIComponent(session.user.email)}`);
      const expData = expRes.ok ? await expRes.json() : null;

      // Fetch projects
      const projRes = await fetch(`/api/profile/projects?email=${encodeURIComponent(session.user.email)}`);
      const projData = projRes.ok ? await projRes.json() : null;

      const newResumeData: ResumeData = { ...resumeData };

      // Import contact info
      if (profileData?.profile) {
        const p = profileData.profile;
        newResumeData.contact = {
          fullName: p.display_name || session.user?.name || "",
          email: session.user?.email || "",
          phone: newResumeData.contact.phone || "",
          location: p.school ? `${p.school}, Singapore` : "Singapore",
          linkedin: p.linkedin_url || "",
          portfolio: p.portfolio_url || "",
        };

        // Import summary from bio
        if (p.bio) {
          newResumeData.summary = p.bio;
        }

        // Import skills
        if (p.skills && p.skills.length > 0) {
          newResumeData.skills = [...new Set([...newResumeData.skills, ...p.skills])];
        }
      }

      // Import education
      if (eduData?.education && eduData.education.length > 0) {
        newResumeData.education = eduData.education.map((e: any) => ({
          id: e.id || crypto.randomUUID(),
          school: e.school || "",
          degree: e.degree || "",
          field: e.field_of_study || "",
          startDate: e.start_date || "",
          endDate: e.end_date || "",
          isCurrent: e.is_current || false,
          grade: e.grade || "",
        }));
      }

      // Import experience
      if (expData?.experience && expData.experience.length > 0) {
        newResumeData.experience = expData.experience.map((e: any) => ({
          id: e.id || crypto.randomUUID(),
          company: e.company || "",
          title: e.title || "",
          location: e.location || "",
          startDate: e.start_date || "",
          endDate: e.end_date || "",
          isCurrent: e.is_current || false,
          description: e.description || "",
        }));
      }

      // Import projects
      if (projData?.projects && projData.projects.length > 0) {
        newResumeData.projects = projData.projects.map((p: any) => ({
          id: p.id || crypto.randomUUID(),
          title: p.title || "",
          description: p.description || "",
          technologies: p.technologies || [],
          url: p.url || "",
        }));
      }

      setResumeData(newResumeData);
    } catch (error) {
      console.error("Failed to import profile:", error);
    } finally {
      setImportingProfile(false);
    }
  };

  // Download as PDF (using browser print)
  const handleDownloadPDF = () => {
    window.print();
  };

  // Update contact info
  const updateContact = (field: keyof ContactInfo, value: string) => {
    setResumeData({
      ...resumeData,
      contact: { ...resumeData.contact, [field]: value },
    });
  };

  // Update summary
  const updateSummary = (value: string) => {
    setResumeData({ ...resumeData, summary: value });
  };

  // Experience handlers
  const addExperience = () => {
    const newExp: Experience = {
      id: crypto.randomUUID(),
      company: "",
      title: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    };
    setResumeData({ ...resumeData, experience: [...resumeData.experience, newExp] });
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setResumeData({
      ...resumeData,
      experience: resumeData.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  const removeExperience = (id: string) => {
    setResumeData({
      ...resumeData,
      experience: resumeData.experience.filter((exp) => exp.id !== id),
    });
  };

  // Education handlers
  const addEducation = () => {
    const newEdu: Education = {
      id: crypto.randomUUID(),
      school: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      grade: "",
    };
    setResumeData({ ...resumeData, education: [...resumeData.education, newEdu] });
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setResumeData({
      ...resumeData,
      education: resumeData.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    });
  };

  const removeEducation = (id: string) => {
    setResumeData({
      ...resumeData,
      education: resumeData.education.filter((edu) => edu.id !== id),
    });
  };

  // Skills handlers
  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !resumeData.skills.includes(skill)) {
      setResumeData({ ...resumeData, skills: [...resumeData.skills, skill] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setResumeData({
      ...resumeData,
      skills: resumeData.skills.filter((s) => s !== skill),
    });
  };

  // Project handlers
  const addProject = () => {
    const newProj: Project = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      technologies: [],
      url: "",
    };
    setResumeData({ ...resumeData, projects: [...resumeData.projects, newProj] });
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setResumeData({
      ...resumeData,
      projects: resumeData.projects.map((proj) =>
        proj.id === id ? { ...proj, [field]: value } : proj
      ),
    });
  };

  const removeProject = (id: string) => {
    setResumeData({
      ...resumeData,
      projects: resumeData.projects.filter((proj) => proj.id !== id),
    });
  };

  // Certification handlers
  const addCertification = () => {
    const newCert: Certification = {
      id: crypto.randomUUID(),
      name: "",
      issuer: "",
      date: "",
      url: "",
    };
    setResumeData({ ...resumeData, certifications: [...resumeData.certifications, newCert] });
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    setResumeData({
      ...resumeData,
      certifications: resumeData.certifications.map((cert) =>
        cert.id === id ? { ...cert, [field]: value } : cert
      ),
    });
  };

  const removeCertification = (id: string) => {
    setResumeData({
      ...resumeData,
      certifications: resumeData.certifications.filter((cert) => cert.id !== id),
    });
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-SG", { month: "short", year: "numeric" });
  };

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b ${isDarkTheme ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"} backdrop-blur-md print:hidden`}>
        <div className="max-w-[1800px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/resume" className={`flex items-center gap-2 text-sm ${isDarkTheme ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Resumes
            </Link>
            <div className={`h-6 w-px ${isDarkTheme ? "bg-slate-700" : "bg-slate-300"}`}></div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`px-2 py-1 rounded border-none bg-transparent text-lg font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none ${isDarkTheme ? "text-white" : "text-slate-900"}`}
            />
            {saveStatus && (
              <span className={`text-sm ${saveStatus === "saved" ? "text-green-500" : saveStatus === "saving" ? (isDarkTheme ? "text-slate-400" : "text-slate-500") : "text-red-500"}`}>
                {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Error saving"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleImportProfile}
              disabled={importingProfile}
              className={`px-3 py-2 text-sm rounded-lg flex items-center gap-2 ${isDarkTheme ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
            >
              {importingProfile ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              )}
              Import from Profile
            </button>

            <button
              onClick={() => setShowTemplatePicker(!showTemplatePicker)}
              className={`px-3 py-2 text-sm rounded-lg flex items-center gap-2 ${isDarkTheme ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
              </svg>
              {TEMPLATES.find((t) => t.id === template)?.name || "Template"}
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
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
          </div>
        </div>

        {/* Template Picker Dropdown */}
        {showTemplatePicker && (
          <div className={`absolute right-4 top-full mt-2 p-2 rounded-xl border shadow-lg ${isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
            <div className="grid grid-cols-2 gap-2 w-64">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTemplate(t.id);
                    setShowTemplatePicker(false);
                  }}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    template === t.id
                      ? "bg-red-600 text-white"
                      : isDarkTheme
                      ? "hover:bg-slate-700"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className={`text-xs ${template === t.id ? "text-red-100" : isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    {t.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)] print:h-auto print:block">
        {/* Left Side - Form Sections */}
        <div className={`w-1/2 overflow-y-auto border-r ${isDarkTheme ? "border-slate-800" : "border-slate-200"} print:hidden`}>
          {/* Section Navigation */}
          <div className={`sticky top-0 z-10 p-4 border-b ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
                    activeSection === section.id
                      ? "bg-red-600 text-white"
                      : isDarkTheme
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                  </svg>
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {/* Contact Info Section */}
            {activeSection === "contact" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={resumeData.contact.fullName}
                      onChange={(e) => updateContact("fullName", e.target.value)}
                      placeholder="John Doe"
                      className={`w-full px-4 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={resumeData.contact.email}
                      onChange={(e) => updateContact("email", e.target.value)}
                      placeholder="john@example.com"
                      className={`w-full px-4 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={resumeData.contact.phone}
                      onChange={(e) => updateContact("phone", e.target.value)}
                      placeholder="+65 9123 4567"
                      className={`w-full px-4 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={resumeData.contact.location}
                      onChange={(e) => updateContact("location", e.target.value)}
                      placeholder="Singapore"
                      className={`w-full px-4 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={resumeData.contact.linkedin}
                      onChange={(e) => updateContact("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/in/johndoe"
                      className={`w-full px-4 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                      Portfolio/Website
                    </label>
                    <input
                      type="url"
                      value={resumeData.contact.portfolio}
                      onChange={(e) => updateContact("portfolio", e.target.value)}
                      placeholder="https://johndoe.com"
                      className={`w-full px-4 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Summary Section */}
            {activeSection === "summary" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Professional Summary</h3>
                <textarea
                  value={resumeData.summary}
                  onChange={(e) => updateSummary(e.target.value)}
                  placeholder="Write a brief summary of your professional background, skills, and career objectives..."
                  rows={6}
                  className={`w-full px-4 py-3 rounded-lg border resize-none ${isDarkTheme ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                />
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                  {resumeData.summary.length}/500 characters recommended
                </p>
              </div>
            )}

            {/* Experience Section */}
            {activeSection === "experience" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Work Experience</h3>
                  <button
                    onClick={addExperience}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    + Add Experience
                  </button>
                </div>

                {resumeData.experience.length === 0 ? (
                  <div className={`p-8 text-center rounded-xl border-2 border-dashed ${isDarkTheme ? "border-slate-700" : "border-slate-300"}`}>
                    <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
                      No experience added yet. Click "Add Experience" to get started.
                    </p>
                  </div>
                ) : (
                  resumeData.experience.map((exp, index) => (
                    <div key={exp.id} className={`p-4 rounded-xl border ${isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-sm font-medium ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                          Experience {index + 1}
                        </span>
                        <button
                          onClick={() => removeExperience(exp.id)}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Job Title
                          </label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => updateExperience(exp.id, "title", e.target.value)}
                            placeholder="Software Engineer"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Company
                          </label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                            placeholder="Tech Company"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Location
                          </label>
                          <input
                            type="text"
                            value={exp.location}
                            onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                            placeholder="Singapore"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                              Start Date
                            </label>
                            <input
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                            />
                          </div>
                          <div className="flex-1">
                            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                              End Date
                            </label>
                            <input
                              type="month"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                              disabled={exp.isCurrent}
                              className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"} ${exp.isCurrent ? "opacity-50" : ""}`}
                            />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={exp.isCurrent}
                              onChange={(e) => updateExperience(exp.id, "isCurrent", e.target.checked)}
                              className="rounded"
                            />
                            <span className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                              I currently work here
                            </span>
                          </label>
                        </div>
                        <div className="col-span-2">
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Description
                          </label>
                          <textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                            placeholder="Describe your responsibilities and achievements..."
                            rows={3}
                            className={`w-full px-3 py-2 rounded-lg border resize-none ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Education Section */}
            {activeSection === "education" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Education</h3>
                  <button
                    onClick={addEducation}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    + Add Education
                  </button>
                </div>

                {resumeData.education.length === 0 ? (
                  <div className={`p-8 text-center rounded-xl border-2 border-dashed ${isDarkTheme ? "border-slate-700" : "border-slate-300"}`}>
                    <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
                      No education added yet. Click "Add Education" to get started.
                    </p>
                  </div>
                ) : (
                  resumeData.education.map((edu, index) => (
                    <div key={edu.id} className={`p-4 rounded-xl border ${isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-sm font-medium ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                          Education {index + 1}
                        </span>
                        <button
                          onClick={() => removeEducation(edu.id)}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            School/University
                          </label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => updateEducation(edu.id, "school", e.target.value)}
                            placeholder="National University of Singapore"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Degree
                          </label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                            placeholder="Bachelor's Degree"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Field of Study
                          </label>
                          <input
                            type="text"
                            value={edu.field}
                            onChange={(e) => updateEducation(edu.id, "field", e.target.value)}
                            placeholder="Computer Science"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                              Start Date
                            </label>
                            <input
                              type="month"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                            />
                          </div>
                          <div className="flex-1">
                            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                              End Date
                            </label>
                            <input
                              type="month"
                              value={edu.endDate}
                              onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                              disabled={edu.isCurrent}
                              className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"} ${edu.isCurrent ? "opacity-50" : ""}`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Grade/GPA
                          </label>
                          <input
                            type="text"
                            value={edu.grade}
                            onChange={(e) => updateEducation(edu.id, "grade", e.target.value)}
                            placeholder="First Class Honours"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={edu.isCurrent}
                              onChange={(e) => updateEducation(edu.id, "isCurrent", e.target.checked)}
                              className="rounded"
                            />
                            <span className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                              Currently studying here
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Skills Section */}
            {activeSection === "skills" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Skills</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill..."
                    className={`flex-1 px-4 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Add
                  </button>
                </div>

                {resumeData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${isDarkTheme ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
                    No skills added yet. Type a skill and press Enter or click Add.
                  </p>
                )}
              </div>
            )}

            {/* Projects Section */}
            {activeSection === "projects" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Projects</h3>
                  <button
                    onClick={addProject}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    + Add Project
                  </button>
                </div>

                {resumeData.projects.length === 0 ? (
                  <div className={`p-8 text-center rounded-xl border-2 border-dashed ${isDarkTheme ? "border-slate-700" : "border-slate-300"}`}>
                    <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
                      No projects added yet. Click "Add Project" to get started.
                    </p>
                  </div>
                ) : (
                  resumeData.projects.map((proj, index) => (
                    <div key={proj.id} className={`p-4 rounded-xl border ${isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-sm font-medium ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                          Project {index + 1}
                        </span>
                        <button
                          onClick={() => removeProject(proj.id)}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Project Title
                          </label>
                          <input
                            type="text"
                            value={proj.title}
                            onChange={(e) => updateProject(proj.id, "title", e.target.value)}
                            placeholder="My Awesome Project"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Description
                          </label>
                          <textarea
                            value={proj.description}
                            onChange={(e) => updateProject(proj.id, "description", e.target.value)}
                            placeholder="Describe the project and your contributions..."
                            rows={3}
                            className={`w-full px-3 py-2 rounded-lg border resize-none ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Technologies (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={proj.technologies.join(", ")}
                            onChange={(e) => updateProject(proj.id, "technologies", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                            placeholder="React, Node.js, PostgreSQL"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Project URL
                          </label>
                          <input
                            type="url"
                            value={proj.url}
                            onChange={(e) => updateProject(proj.id, "url", e.target.value)}
                            placeholder="https://github.com/user/project"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Certifications Section */}
            {activeSection === "certifications" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Certifications</h3>
                  <button
                    onClick={addCertification}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    + Add Certification
                  </button>
                </div>

                {resumeData.certifications.length === 0 ? (
                  <div className={`p-8 text-center rounded-xl border-2 border-dashed ${isDarkTheme ? "border-slate-700" : "border-slate-300"}`}>
                    <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
                      No certifications added yet. Click "Add Certification" to get started.
                    </p>
                  </div>
                ) : (
                  resumeData.certifications.map((cert, index) => (
                    <div key={cert.id} className={`p-4 rounded-xl border ${isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-sm font-medium ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                          Certification {index + 1}
                        </span>
                        <button
                          onClick={() => removeCertification(cert.id)}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Certification Name
                          </label>
                          <input
                            type="text"
                            value={cert.name}
                            onChange={(e) => updateCertification(cert.id, "name", e.target.value)}
                            placeholder="AWS Certified Solutions Architect"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Issuing Organization
                          </label>
                          <input
                            type="text"
                            value={cert.issuer}
                            onChange={(e) => updateCertification(cert.id, "issuer", e.target.value)}
                            placeholder="Amazon Web Services"
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Date Obtained
                          </label>
                          <input
                            type="month"
                            value={cert.date}
                            onChange={(e) => updateCertification(cert.id, "date", e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            Credential URL
                          </label>
                          <input
                            type="url"
                            value={cert.url}
                            onChange={(e) => updateCertification(cert.id, "url", e.target.value)}
                            placeholder="https://www.credly.com/..."
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Live Preview */}
        <div className={`w-1/2 overflow-y-auto p-6 ${isDarkTheme ? "bg-slate-900" : "bg-slate-100"} print:w-full print:p-0 print:bg-white`}>
          <div className="max-w-[210mm] mx-auto">
            <ResumePreview data={resumeData} template={template} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Resume Preview Component with different templates
function ResumePreview({ data, template }: { data: ResumeData; template: string }) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-SG", { month: "short", year: "numeric" });
  };

  // Template-specific styles
  const getTemplateStyles = () => {
    switch (template) {
      case "classic":
        return {
          container: "bg-white text-slate-900 p-10 shadow-lg font-serif",
          header: "border-b-2 border-slate-900 pb-4 mb-6",
          name: "text-3xl font-bold text-center",
          contact: "text-center text-sm mt-2 text-slate-600",
          sectionTitle: "text-lg font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-3",
          accent: "text-slate-900",
        };
      case "minimal":
        return {
          container: "bg-white text-slate-800 p-10 shadow-lg font-sans",
          header: "mb-6",
          name: "text-2xl font-light tracking-wide",
          contact: "text-xs mt-2 text-slate-500",
          sectionTitle: "text-xs uppercase tracking-widest text-slate-400 mb-3",
          accent: "text-slate-600",
        };
      case "creative":
        return {
          container: "bg-gradient-to-br from-indigo-50 to-purple-50 text-slate-900 p-10 shadow-lg font-sans",
          header: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white -m-10 mb-6 p-10",
          name: "text-3xl font-bold",
          contact: "text-indigo-100 text-sm mt-2",
          sectionTitle: "text-lg font-bold text-indigo-600 mb-3",
          accent: "text-purple-600",
        };
      default: // modern
        return {
          container: "bg-white text-slate-900 p-10 shadow-lg font-sans",
          header: "mb-6",
          name: "text-3xl font-bold text-red-600",
          contact: "text-sm mt-2 text-slate-600 flex flex-wrap gap-3",
          sectionTitle: "text-lg font-semibold text-red-600 border-b-2 border-red-600 pb-1 mb-3",
          accent: "text-red-600",
        };
    }
  };

  const styles = getTemplateStyles();

  return (
    <div className={`${styles.container} min-h-[297mm] print:shadow-none print:min-h-0`}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.name}>{data.contact.fullName || "Your Name"}</h1>
        <div className={styles.contact}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{template === "modern" ? " | " : " "}{data.contact.phone}</span>}
          {data.contact.location && <span>{template === "modern" ? " | " : " "}{data.contact.location}</span>}
          {data.contact.linkedin && (
            <span>{template === "modern" ? " | " : " "}<a href={data.contact.linkedin} className={styles.accent}>LinkedIn</a></span>
          )}
          {data.contact.portfolio && (
            <span>{template === "modern" ? " | " : " "}<a href={data.contact.portfolio} className={styles.accent}>Portfolio</a></span>
          )}
        </div>
      </header>

      {/* Summary */}
      {data.summary && (
        <section className="mb-6">
          <h2 className={styles.sectionTitle}>Summary</h2>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className={styles.sectionTitle}>Experience</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{exp.title || "Job Title"}</h3>
                  <p className={`text-sm ${styles.accent}`}>{exp.company || "Company"}{exp.location && `, ${exp.location}`}</p>
                </div>
                <p className="text-sm text-slate-500">
                  {formatDate(exp.startDate)} - {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                </p>
              </div>
              {exp.description && (
                <p className="text-sm mt-2 text-slate-600 whitespace-pre-line">{exp.description}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <section className="mb-6">
          <h2 className={styles.sectionTitle}>Education</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{edu.school || "School"}</h3>
                  <p className="text-sm">
                    {edu.degree}{edu.field && ` in ${edu.field}`}
                    {edu.grade && ` - ${edu.grade}`}
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  {formatDate(edu.startDate)} - {edu.isCurrent ? "Present" : formatDate(edu.endDate)}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className={styles.sectionTitle}>Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <span
                key={index}
                className={`px-3 py-1 text-sm rounded-full ${
                  template === "creative"
                    ? "bg-indigo-100 text-indigo-700"
                    : template === "classic"
                    ? "border border-slate-300"
                    : template === "minimal"
                    ? "bg-slate-100"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <section className="mb-6">
          <h2 className={styles.sectionTitle}>Projects</h2>
          {data.projects.map((proj) => (
            <div key={proj.id} className="mb-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{proj.title || "Project Title"}</h3>
                {proj.url && (
                  <a href={proj.url} className={`text-sm ${styles.accent}`}>View Project</a>
                )}
              </div>
              {proj.description && (
                <p className="text-sm mt-1 text-slate-600">{proj.description}</p>
              )}
              {proj.technologies.length > 0 && (
                <p className="text-sm mt-1 text-slate-500">
                  Technologies: {proj.technologies.join(", ")}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className={styles.sectionTitle}>Certifications</h2>
          {data.certifications.map((cert) => (
            <div key={cert.id} className="mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{cert.name || "Certification"}</h3>
                  <p className="text-sm text-slate-600">{cert.issuer}</p>
                </div>
                <p className="text-sm text-slate-500">{formatDate(cert.date)}</p>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
