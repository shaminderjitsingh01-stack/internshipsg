"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Endorser {
  email: string;
  username?: string;
  name: string;
  image?: string;
  endorsedAt: string;
}

interface Skill {
  id: string;
  user_email: string;
  skill_name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  endorsement_count: number;
  created_at: string;
  endorsers?: Endorser[];
}

interface Props {
  userEmail: string;
  currentUserEmail?: string; // logged-in user's email (for endorsing)
  isOwnProfile?: boolean;
}

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner", color: "bg-blue-500", width: "w-1/4" },
  { value: "intermediate", label: "Intermediate", color: "bg-green-500", width: "w-2/4" },
  { value: "advanced", label: "Advanced", color: "bg-yellow-500", width: "w-3/4" },
  { value: "expert", label: "Expert", color: "bg-red-500", width: "w-full" },
];

const SUGGESTED_SKILLS = [
  "JavaScript", "TypeScript", "Python", "React", "Node.js",
  "SQL", "AWS", "Docker", "Git", "Java",
  "C++", "Machine Learning", "Data Analysis", "Project Management",
  "Communication", "Leadership", "Problem Solving", "Agile",
];

export default function SkillsSection({ userEmail, currentUserEmail, isOwnProfile = false }: Props) {
  const { isDarkTheme } = useTheme();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillProficiency, setNewSkillProficiency] = useState<string>("intermediate");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [endorsedSkills, setEndorsedSkills] = useState<Set<string>>(new Set());
  const [endorsingSkillId, setEndorsingSkillId] = useState<string | null>(null);

  // Fetch skills
  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/skills?email=${encodeURIComponent(userEmail)}&include_endorsers=true`
      );
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills || []);
      }
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Check which skills current user has endorsed
  const checkEndorsements = useCallback(async () => {
    if (!currentUserEmail || isOwnProfile) return;

    const endorsed = new Set<string>();
    for (const skill of skills) {
      if (skill.endorsers?.some(e => e.email === currentUserEmail)) {
        endorsed.add(skill.id);
      }
    }
    setEndorsedSkills(endorsed);
  }, [currentUserEmail, isOwnProfile, skills]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  useEffect(() => {
    checkEndorsements();
  }, [checkEndorsements]);

  // Add skill
  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;

    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          skill_name: newSkillName.trim(),
          proficiency: newSkillProficiency,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add skill");
      }

      const data = await res.json();
      setSkills([...skills, data.skill]);
      setNewSkillName("");
      setNewSkillProficiency("intermediate");
      setShowAddModal(false);
      setSuccess("Skill added!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add skill");
    } finally {
      setSaving(false);
    }
  };

  // Delete skill
  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm("Delete this skill?")) return;

    try {
      const res = await fetch(
        `/api/skills/${skillId}?user_email=${encodeURIComponent(userEmail)}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete skill");

      setSkills(skills.filter(s => s.id !== skillId));
      setSuccess("Skill deleted!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError("Failed to delete skill");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Update proficiency
  const handleUpdateProficiency = async (skillId: string, proficiency: string) => {
    try {
      const res = await fetch("/api/skills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: skillId,
          user_email: userEmail,
          proficiency,
        }),
      });

      if (!res.ok) throw new Error("Failed to update skill");

      setSkills(skills.map(s =>
        s.id === skillId ? { ...s, proficiency: proficiency as Skill["proficiency"] } : s
      ));
    } catch (err) {
      setError("Failed to update proficiency");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Toggle endorsement
  const handleToggleEndorsement = async (skillId: string) => {
    if (!currentUserEmail || isOwnProfile) return;

    setEndorsingSkillId(skillId);
    const hasEndorsed = endorsedSkills.has(skillId);

    try {
      if (hasEndorsed) {
        // Remove endorsement
        const res = await fetch(
          `/api/skills/${skillId}/endorse?endorser_email=${encodeURIComponent(currentUserEmail)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Failed to remove endorsement");

        setEndorsedSkills(prev => {
          const next = new Set(prev);
          next.delete(skillId);
          return next;
        });
        setSkills(skills.map(s =>
          s.id === skillId ? { ...s, endorsement_count: Math.max(0, s.endorsement_count - 1) } : s
        ));
      } else {
        // Add endorsement
        const res = await fetch(`/api/skills/${skillId}/endorse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endorser_email: currentUserEmail }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to endorse");
        }

        setEndorsedSkills(prev => new Set([...prev, skillId]));
        setSkills(skills.map(s =>
          s.id === skillId ? { ...s, endorsement_count: s.endorsement_count + 1 } : s
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle endorsement");
      setTimeout(() => setError(""), 3000);
    } finally {
      setEndorsingSkillId(null);
    }
  };

  const getProficiencyConfig = (proficiency: string) => {
    return PROFICIENCY_LEVELS.find(p => p.value === proficiency) || PROFICIENCY_LEVELS[1];
  };

  // Sort skills: top endorsed first
  const sortedSkills = [...skills].sort((a, b) => b.endorsement_count - a.endorsement_count);
  const topEndorsedSkills = sortedSkills.filter(s => s.endorsement_count > 0).slice(0, 3);

  if (loading) {
    return (
      <div className={`rounded-2xl p-6 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          Skills & Endorsements
        </h2>
        {isOwnProfile && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
          >
            + Add Skill
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

      {/* Top Endorsed Skills */}
      {topEndorsedSkills.length > 0 && (
        <div className="mb-6">
          <h3 className={`text-sm font-medium mb-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            Top Endorsed
          </h3>
          <div className="flex flex-wrap gap-2">
            {topEndorsedSkills.map(skill => (
              <div
                key={skill.id}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                  isDarkTheme
                    ? 'bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-800/50 text-red-300'
                    : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 text-red-700'
                }`}
              >
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium">{skill.skill_name}</span>
                <span className={`text-xs ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
                  {skill.endorsement_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills List */}
      {skills.length === 0 ? (
        <div className={`text-center py-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="font-medium mb-1">No skills added yet</p>
          {isOwnProfile && (
            <p className="text-sm">Add your skills to showcase your expertise</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSkills.map(skill => {
            const proficiencyConfig = getProficiencyConfig(skill.proficiency);
            const hasEndorsed = endorsedSkills.has(skill.id);
            const isEndorsing = endorsingSkillId === skill.id;

            return (
              <div
                key={skill.id}
                className={`p-4 rounded-xl border transition-colors ${
                  isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Skill Name & Endorsement Count */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {skill.skill_name}
                      </h3>
                      {skill.endorsement_count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isDarkTheme ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {skill.endorsement_count} endorsement{skill.endorsement_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Proficiency Bar */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        {isOwnProfile ? (
                          <select
                            value={skill.proficiency}
                            onChange={(e) => handleUpdateProficiency(skill.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded border ${
                              isDarkTheme
                                ? 'bg-slate-900 border-slate-600 text-slate-300'
                                : 'bg-white border-slate-300 text-slate-600'
                            }`}
                          >
                            {PROFICIENCY_LEVELS.map(level => (
                              <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                            {proficiencyConfig.label}
                          </span>
                        )}
                      </div>
                      <div className={`h-1.5 rounded-full ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div
                          className={`h-full rounded-full ${proficiencyConfig.color} ${proficiencyConfig.width} transition-all duration-300`}
                        />
                      </div>
                    </div>

                    {/* Endorsers Avatars */}
                    {skill.endorsers && skill.endorsers.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex -space-x-2">
                          {skill.endorsers.slice(0, 5).map((endorser, idx) => (
                            <div
                              key={endorser.email}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                                isDarkTheme
                                  ? 'border-slate-800 bg-slate-700 text-slate-300'
                                  : 'border-white bg-slate-200 text-slate-600'
                              }`}
                              style={{ zIndex: 5 - idx }}
                              title={endorser.name}
                            >
                              {endorser.image ? (
                                <img src={endorser.image} alt={endorser.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                endorser.name.charAt(0).toUpperCase()
                              )}
                            </div>
                          ))}
                        </div>
                        {skill.endorsers.length > 5 && (
                          <span className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                            +{skill.endorsers.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Endorse Button (for other users viewing) */}
                    {!isOwnProfile && currentUserEmail && (
                      <button
                        onClick={() => handleToggleEndorsement(skill.id)}
                        disabled={isEndorsing}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          hasEndorsed
                            ? isDarkTheme
                              ? 'bg-red-900/30 text-red-400 border border-red-800/50'
                              : 'bg-red-100 text-red-700 border border-red-200'
                            : isDarkTheme
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        } ${isEndorsing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isEndorsing ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill={hasEndorsed ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                        )}
                        {hasEndorsed ? 'Endorsed' : 'Endorse'}
                      </button>
                    )}

                    {/* Delete Button (own profile) */}
                    {isOwnProfile && (
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className={`p-2 rounded-lg transition-colors text-red-500 ${
                          isDarkTheme ? 'hover:bg-red-900/30' : 'hover:bg-red-50'
                        }`}
                        title="Delete skill"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              Add a Skill
            </h3>

            {/* Skill Name Input */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                Skill Name *
              </label>
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g., JavaScript, Project Management"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkTheme
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                autoFocus
              />
            </div>

            {/* Suggested Skills */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                Suggestions
              </label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.filter(s =>
                  !skills.some(existing => existing.skill_name.toLowerCase() === s.toLowerCase()) &&
                  (!newSkillName || s.toLowerCase().includes(newSkillName.toLowerCase()))
                ).slice(0, 8).map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setNewSkillName(suggestion)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      isDarkTheme
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Proficiency Level */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                Proficiency Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROFICIENCY_LEVELS.map(level => (
                  <button
                    key={level.value}
                    onClick={() => setNewSkillProficiency(level.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newSkillProficiency === level.value
                        ? 'bg-red-600 text-white'
                        : isDarkTheme
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAddSkill}
                disabled={saving || !newSkillName.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Adding..." : "Add Skill"}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewSkillName("");
                  setNewSkillProficiency("intermediate");
                  setError("");
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkTheme
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
