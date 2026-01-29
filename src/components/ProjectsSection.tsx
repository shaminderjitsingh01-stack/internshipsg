"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Project {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  technologies: string[] | null;
  start_date: string | null;
  end_date: string | null;
  is_featured: boolean;
}

interface Props {
  userEmail?: string;
  projects?: Project[];
  isOwnProfile?: boolean;
  onProjectsChange?: (projects: Project[]) => void;
}

export default function ProjectsSection({ userEmail, projects: initialProjects, isOwnProfile = false, onProjectsChange }: Props) {
  const { isDarkTheme } = useTheme();
  const [projects, setProjects] = useState<Project[]>(initialProjects || []);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(!initialProjects && !!userEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [techInput, setTechInput] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    image_url: "",
    technologies: [] as string[],
    start_date: "",
    end_date: "",
    is_featured: false,
  });

  // Fetch projects if not provided
  useEffect(() => {
    if (initialProjects) {
      setProjects(initialProjects);
      return;
    }

    if (!userEmail) return;

    const fetchProjects = async () => {
      try {
        const res = await fetch(`/api/profile/projects?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userEmail, initialProjects]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      url: "",
      image_url: "",
      technologies: [],
      start_date: "",
      end_date: "",
      is_featured: false,
    });
    setTechInput("");
  };

  const handleAddTech = () => {
    const tech = techInput.trim();
    if (tech && !form.technologies.includes(tech)) {
      setForm({ ...form, technologies: [...form.technologies, tech] });
      setTechInput("");
    }
  };

  const handleRemoveTech = (tech: string) => {
    setForm({ ...form, technologies: form.technologies.filter(t => t !== tech) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTech();
    }
  };

  const handleSubmit = async () => {
    if (!userEmail) return;
    setError("");
    setSaving(true);

    try {
      const url = "/api/profile/projects";
      const method = editingProject ? "PUT" : "POST";
      const body = editingProject
        ? { id: editingProject.id, user_email: userEmail, ...form }
        : { user_email: userEmail, ...form };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save project");
      }

      const data = await res.json();

      let newProjects: Project[];
      if (editingProject) {
        newProjects = projects.map(p => p.id === editingProject.id ? data.project : p);
      } else {
        newProjects = [...projects, data.project];
      }

      setProjects(newProjects);
      onProjectsChange?.(newProjects);

      setShowForm(false);
      setEditingProject(null);
      resetForm();
      setSuccess("Project saved!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userEmail || !confirm("Delete this project?")) return;

    try {
      const res = await fetch(`/api/profile/projects?id=${id}&email=${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      const newProjects = projects.filter(p => p.id !== id);
      setProjects(newProjects);
      onProjectsChange?.(newProjects);
      setSuccess("Project deleted!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError("Failed to delete project");
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      title: project.title,
      description: project.description || "",
      url: project.url || "",
      image_url: project.image_url || "",
      technologies: project.technologies || [],
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      is_featured: project.is_featured,
    });
    setShowForm(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-SG", { month: "short", year: "numeric" });
  };

  // Don't render if no projects and not own profile
  if (!isOwnProfile && projects.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className={`rounded-2xl p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Projects
        </h2>
        {isOwnProfile && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            + Add Project
          </button>
        )}
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

      {/* Project Form */}
      {showForm && isOwnProfile && (
        <div className={`mb-6 p-4 rounded-xl border ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            {editingProject ? "Edit Project" : "Add Project"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                Project Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., E-commerce Platform"
                className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your project, its purpose, and your contributions..."
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border resize-none ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Project URL
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://github.com/user/project"
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Image URL (thumbnail)
                </label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://example.com/image.png"
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                Technologies Used
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., React, Node.js, PostgreSQL"
                  className={`flex-1 px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                />
                <button
                  type="button"
                  onClick={handleAddTech}
                  className={`px-4 py-2 rounded-lg font-medium ${isDarkTheme ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                >
                  Add
                </button>
              </div>
              {form.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${isDarkTheme ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="hover:text-red-500"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Start Date
                </label>
                <input
                  type="month"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  End Date
                </label>
                <input
                  type="month"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkTheme ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="rounded"
                />
                <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                  Feature this project (show at top)
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={saving || !form.title}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingProject ? "Update" : "Add Project"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingProject(null);
                  resetForm();
                }}
                className={`px-4 py-2 rounded-lg font-medium ${isDarkTheme ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`rounded-xl border overflow-hidden ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
            >
              {/* Project Image */}
              {project.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {project.title}
                      </h3>
                      {project.is_featured && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                          Featured
                        </span>
                      )}
                    </div>
                    {(project.start_date || project.end_date) && (
                      <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                        {formatDate(project.start_date)}{project.start_date && project.end_date && " - "}{formatDate(project.end_date)}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {isOwnProfile && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(project)}
                        className={`p-1.5 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className={`p-1.5 rounded-lg transition-colors text-red-500 ${isDarkTheme ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                {project.description && (
                  <p className={`mt-2 text-sm line-clamp-3 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                    {project.description}
                  </p>
                )}

                {/* Technologies */}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.technologies.map((tech, index) => (
                      <span
                        key={index}
                        className={`px-2 py-0.5 rounded-full text-xs ${isDarkTheme ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Project Link */}
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${isDarkTheme ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Project
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : isOwnProfile ? (
        <button
          onClick={() => setShowForm(true)}
          className={`w-full p-6 rounded-xl border-2 border-dashed transition-colors ${
            isDarkTheme
              ? 'border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300'
              : 'border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-600'
          }`}
        >
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add your first project
        </button>
      ) : null}
    </div>
  );
}
