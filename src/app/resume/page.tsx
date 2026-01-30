"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Resume {
  id: string;
  title: string;
  template: string;
  is_primary: boolean;
  updated_at: string;
}

const TEMPLATES = [
  { id: "modern", name: "Modern", description: "Clean and professional" },
  { id: "classic", name: "Classic", description: "Traditional format" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant" },
  { id: "creative", name: "Creative", description: "Stand out from the crowd" },
];

export default function ResumePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("My Resume");
  const [newTemplate, setNewTemplate] = useState("modern");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/resume");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchResumes = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(`/api/resumes?email=${encodeURIComponent(session.user.email)}`);
        if (res.ok) {
          const data = await res.json();
          setResumes(data.resumes || []);
        }
      } catch (error) {
        console.error("Failed to fetch resumes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchResumes();
    }
  }, [session]);

  const handleCreate = async () => {
    if (!session?.user?.email) return;

    setCreating(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: session.user.email,
          title: newTitle,
          template: newTemplate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/resume/${data.resume.id}`);
      }
    } catch (error) {
      console.error("Failed to create resume:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.user?.email || !confirm("Delete this resume?")) return;

    try {
      const res = await fetch(`/api/resumes/${id}?email=${encodeURIComponent(session.user.email)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setResumes(resumes.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete resume:", error);
    }
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
      <header className={`sticky top-0 z-40 border-b ${isDarkTheme ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"} backdrop-blur-md`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-8 ${isDarkTheme ? "brightness-0 invert" : ""}`} />
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className={`p-2 rounded-lg ${isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}>
              {isDarkTheme ? "☀️" : "🌙"}
            </button>
            <Link href="/home" className={`text-sm ${isDarkTheme ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}>
              Back to Feed
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Resume Builder</h1>
            <p className={`mt-1 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              Create professional resumes for your internship applications
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Resume
          </button>
        </div>

        {/* Resumes Grid */}
        {resumes.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
            <p className={`mb-6 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              Create your first resume to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
            >
              Create Resume
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className={`rounded-2xl border overflow-hidden ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                {/* Preview */}
                <div className={`h-48 flex items-center justify-center ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">📄</div>
                    <span className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      {TEMPLATES.find(t => t.id === resume.template)?.name || "Modern"} Template
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {resume.title}
                        {resume.is_primary && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full dark:bg-red-900/30">
                            Primary
                          </span>
                        )}
                      </h3>
                      <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                        Updated {new Date(resume.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/resume/${resume.id}`}
                      className="flex-1 py-2 text-center bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className={`px-3 py-2 rounded-lg text-sm ${isDarkTheme ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`w-full max-w-md rounded-2xl p-6 ${isDarkTheme ? "bg-slate-900" : "bg-white"}`}>
            <h3 className="text-lg font-semibold mb-4">Create New Resume</h3>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Resume Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${isDarkTheme ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
              />
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setNewTemplate(t.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      newTemplate === t.id
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : isDarkTheme
                        ? "border-slate-700 hover:border-slate-600"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{t.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`flex-1 py-2.5 rounded-lg font-medium ${isDarkTheme ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
