"use client";

import { useState, useEffect } from "react";

interface EmployerEntry {
  id: string;
  email: string;
  company_name: string;
  contact_name: string | null;
  role: string | null;
  company_size: string | null;
  message: string | null;
  is_work_email: boolean;
  contacted: boolean;
  contacted_at: string | null;
  notes: string | null;
  created_at: string;
}

export default function EmployerWaitlistPage() {
  const [employers, setEmployers] = useState<EmployerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "contacted" | "not_contacted">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerEntry | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEmployers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        filter,
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/employers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setEmployers(data.employers || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, [page, filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployers();
  };

  const toggleContacted = async (employer: EmployerEntry) => {
    try {
      const res = await fetch("/api/admin/employers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: employer.id,
          contacted: !employer.contacted,
        }),
      });

      if (res.ok) {
        setEmployers((prev) =>
          prev.map((e) =>
            e.id === employer.id
              ? {
                  ...e,
                  contacted: !e.contacted,
                  contacted_at: !e.contacted ? new Date().toISOString() : null,
                }
              : e
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveNotes = async () => {
    if (!selectedEmployer) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/employers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEmployer.id,
          notes: editNotes,
        }),
      });

      if (res.ok) {
        setEmployers((prev) =>
          prev.map((e) =>
            e.id === selectedEmployer.id ? { ...e, notes: editNotes } : e
          )
        );
        setSelectedEmployer({ ...selectedEmployer, notes: editNotes });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployer = async (id: string) => {
    if (!confirm("Are you sure you want to remove this entry?")) return;

    try {
      const res = await fetch(`/api/admin/employers?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEmployers((prev) => prev.filter((e) => e.id !== id));
        if (selectedEmployer?.id === id) setSelectedEmployer(null);
        setTotal((prev) => prev - 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Company Name",
      "Email",
      "Contact Name",
      "Role",
      "Company Size",
      "Message",
      "Work Email",
      "Contacted",
      "Contacted At",
      "Notes",
      "Created At",
    ];

    const csvContent = [
      headers.join(","),
      ...employers.map((e) =>
        [
          `"${e.company_name}"`,
          e.email,
          `"${e.contact_name || ""}"`,
          `"${e.role || ""}"`,
          `"${e.company_size || ""}"`,
          `"${(e.message || "").replace(/"/g, '""')}"`,
          e.is_work_email ? "Yes" : "No",
          e.contacted ? "Yes" : "No",
          e.contacted_at || "",
          `"${(e.notes || "").replace(/"/g, '""')}"`,
          e.created_at,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `employer-waitlist-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Employer Waitlist</h1>
          <p className="text-slate-400">Manage employer signups and outreach</p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, company, or contact name..."
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            Search
          </button>
        </form>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as any);
            setPage(1);
          }}
          className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
        >
          <option value="all">All</option>
          <option value="contacted">Contacted</option>
          <option value="not_contacted">Not Contacted</option>
        </select>
      </div>

      {/* Stats */}
      <div className="mb-6 flex items-center gap-4">
        <span className="text-sm text-slate-400">
          Showing {employers.length} of {total} employers
        </span>
        <span className="text-sm text-green-400">
          {employers.filter((e) => e.contacted).length} contacted
        </span>
        <span className="text-sm text-yellow-400">
          {employers.filter((e) => !e.contacted).length} pending
        </span>
      </div>

      <div className="flex gap-6">
        {/* Employers List */}
        <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          ) : employers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400">No employers found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {employers.map((employer) => (
                <div
                  key={employer.id}
                  className={`p-4 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                    selectedEmployer?.id === employer.id ? "bg-slate-700/50" : ""
                  }`}
                  onClick={() => {
                    setSelectedEmployer(employer);
                    setEditNotes(employer.notes || "");
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{employer.company_name}</h3>
                        {employer.is_work_email && (
                          <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded">
                            Work Email
                          </span>
                        )}
                        {employer.contacted && (
                          <span className="px-1.5 py-0.5 bg-green-600/20 text-green-400 text-xs rounded">
                            Contacted
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{employer.email}</p>
                      {employer.contact_name && (
                        <p className="text-sm text-slate-500">
                          {employer.contact_name} {employer.role && `- ${employer.role}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{formatDate(employer.created_at)}</p>
                      {employer.company_size && (
                        <p className="text-xs text-slate-400 mt-1">{employer.company_size} employees</p>
                      )}
                    </div>
                  </div>
                  {employer.notes && (
                    <p className="mt-2 text-xs text-slate-500 truncate">
                      Note: {employer.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-700 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedEmployer && (
          <div className="w-96 bg-slate-800 rounded-xl border border-slate-700 p-6 sticky top-24 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{selectedEmployer.company_name}</h3>
              <button
                onClick={() => setSelectedEmployer(null)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 uppercase">Email</label>
                <p className="text-white">{selectedEmployer.email}</p>
              </div>

              {selectedEmployer.contact_name && (
                <div>
                  <label className="text-xs text-slate-500 uppercase">Contact</label>
                  <p className="text-white">
                    {selectedEmployer.contact_name}
                    {selectedEmployer.role && (
                      <span className="text-slate-400"> - {selectedEmployer.role}</span>
                    )}
                  </p>
                </div>
              )}

              {selectedEmployer.company_size && (
                <div>
                  <label className="text-xs text-slate-500 uppercase">Company Size</label>
                  <p className="text-white">{selectedEmployer.company_size}</p>
                </div>
              )}

              {selectedEmployer.message && (
                <div>
                  <label className="text-xs text-slate-500 uppercase">Message</label>
                  <p className="text-slate-300 text-sm">{selectedEmployer.message}</p>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-500 uppercase">Signed Up</label>
                <p className="text-white">{formatDate(selectedEmployer.created_at)}</p>
              </div>

              {selectedEmployer.contacted_at && (
                <div>
                  <label className="text-xs text-slate-500 uppercase">Contacted At</label>
                  <p className="text-white">{formatDate(selectedEmployer.contacted_at)}</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-slate-500 uppercase mb-2 block">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this employer..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                />
                <button
                  onClick={saveNotes}
                  disabled={saving || editNotes === (selectedEmployer.notes || "")}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Notes"}
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-700 space-y-2">
                <button
                  onClick={() => toggleContacted(selectedEmployer)}
                  className={`w-full px-4 py-2 font-medium rounded-lg transition-colors ${
                    selectedEmployer.contacted
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {selectedEmployer.contacted ? "Mark as Not Contacted" : "Mark as Contacted"}
                </button>
                <button
                  onClick={() => deleteEmployer(selectedEmployer.id)}
                  className="w-full px-4 py-2 bg-red-600/20 text-red-400 font-medium rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  Remove from Waitlist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
