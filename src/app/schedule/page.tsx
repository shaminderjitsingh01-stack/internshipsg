"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface InterviewSchedule {
  id: string;
  user_email: string;
  title: string;
  interview_type: string;
  company_name: string | null;
  job_title: string | null;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  reminder_sent: boolean;
  status: string;
  created_at: string;
}

// Interview type colors
const interviewTypeColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  mock: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "bg-blue-900/50", darkText: "text-blue-300" },
  real: { bg: "bg-green-100", text: "text-green-700", darkBg: "bg-green-900/50", darkText: "text-green-300" },
  coaching: { bg: "bg-purple-100", text: "text-purple-700", darkBg: "bg-purple-900/50", darkText: "text-purple-300" },
};

const interviewTypeLabels: Record<string, string> = {
  mock: "Mock Interview",
  real: "Real Interview",
  coaching: "Coaching Session",
};

const statusColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  scheduled: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "bg-amber-900/50", darkText: "text-amber-300" },
  completed: { bg: "bg-green-100", text: "text-green-700", darkBg: "bg-green-900/50", darkText: "text-green-300" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", darkBg: "bg-red-900/50", darkText: "text-red-300" },
};

function formatScheduleDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatScheduleTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSchedulePast(scheduledAt: string): boolean {
  return new Date(scheduledAt) < new Date();
}

function isScheduleToday(scheduledAt: string): boolean {
  const scheduleDate = new Date(scheduledAt);
  const today = new Date();
  return scheduleDate.toDateString() === today.toDateString();
}

function isScheduleThisWeek(scheduledAt: string): boolean {
  const scheduleDate = new Date(scheduledAt);
  const today = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(today.getDate() + 7);
  return scheduleDate >= today && scheduleDate <= weekFromNow;
}

function getScheduleReminderText(scheduledAt: string): string | null {
  const scheduleDate = new Date(scheduledAt);
  const now = new Date();
  const diffMs = scheduleDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) return null;
  if (diffHours < 1) return "Starting soon!";
  if (diffHours < 24) return `In ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `In ${diffDays} days`;
  return null;
}

// Calendar helpers
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function SchedulePage() {
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const userEmail = session?.user?.email;

  const [schedules, setSchedules] = useState<InterviewSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<InterviewSchedule | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("user_email", userEmail);
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("interview_type", typeFilter);

      const res = await fetch(`/api/schedule?${params.toString()}`);
      const data = await res.json();
      if (data.schedules) {
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  }, [userEmail, statusFilter, typeFilter]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Cancel/Complete schedule handler
  const handleUpdateStatus = async (scheduleId: string, newStatus: "completed" | "cancelled") => {
    if (!userEmail) return;

    try {
      const res = await fetch(`/api/schedule/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setSchedules((prev) =>
          prev.map((s) =>
            s.id === scheduleId ? { ...s, status: newStatus } : s
          )
        );
      } else {
        alert(data.error || "Failed to update schedule");
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert("Failed to update schedule");
    }
  };

  // Delete schedule handler
  const handleDelete = async (scheduleId: string) => {
    if (!userEmail) return;
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const res = await fetch(`/api/schedule/${scheduleId}?user_email=${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      } else {
        alert(data.error || "Failed to delete schedule");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Failed to delete schedule");
    }
  };

  // Get schedules for a specific date (for calendar view)
  const getSchedulesForDate = (year: number, month: number, day: number): InterviewSchedule[] => {
    const date = new Date(year, month, day);
    return schedules.filter((s) => {
      const scheduleDate = new Date(s.scheduled_at);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  // Filter upcoming schedules for list view
  const upcomingSchedules = schedules
    .filter((s) => s.status === "scheduled" && !isSchedulePast(s.scheduled_at))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  // Get reminders (schedules within next 24 hours)
  const reminders = schedules.filter((s) => {
    if (s.status !== "scheduled") return false;
    const reminderText = getScheduleReminderText(s.scheduled_at);
    return reminderText !== null;
  });

  // Navigation for calendar
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];
    const today = new Date();

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className={`h-24 border ${isDarkTheme ? "border-gray-700 bg-gray-800/30" : "border-gray-200 bg-gray-50"}`}
        />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();
      const daySchedules = getSchedulesForDate(currentYear, currentMonth, day);

      days.push(
        <div
          key={day}
          className={`h-24 border p-1 overflow-hidden ${
            isDarkTheme ? "border-gray-700" : "border-gray-200"
          } ${isToday ? (isDarkTheme ? "bg-red-900/20" : "bg-red-50") : ""}`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday
              ? "text-red-600"
              : isDarkTheme
              ? "text-gray-300"
              : "text-gray-700"
          }`}>
            {day}
          </div>
          <div className="space-y-0.5 overflow-y-auto max-h-16">
            {daySchedules.slice(0, 3).map((schedule) => {
              const typeColors = interviewTypeColors[schedule.interview_type] || interviewTypeColors.mock;
              return (
                <div
                  key={schedule.id}
                  onClick={() => setEditingSchedule(schedule)}
                  className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                    isDarkTheme ? typeColors.darkBg : typeColors.bg
                  } ${isDarkTheme ? typeColors.darkText : typeColors.text}`}
                  title={schedule.title}
                >
                  {formatScheduleTime(schedule.scheduled_at)} {schedule.title}
                </div>
              );
            })}
            {daySchedules.length > 3 && (
              <div className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                +{daySchedules.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (!session) {
    return (
      <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className={`text-2xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Sign in to access your schedule
          </h1>
          <Link href="/auth/signin" className="btn-premium px-6 py-3">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Navigation */}
      <nav
        className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${
          isDarkTheme ? "border-red-800/30" : "border-gray-200/50"
        }`}
      >
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
              <span className={isDarkTheme ? "text-gray-600" : "text-gray-300"}>/</span>
              <span className={`font-medium ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Schedule</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-premium px-4 py-2 text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Schedule Interview
              </button>
              <Link href="/dashboard" className={`px-4 py-2 rounded-xl font-medium text-sm ${
                isDarkTheme ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
              }`}>
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className={`py-8 px-4 sm:px-6 lg:px-8 border-b ${isDarkTheme ? "border-gray-800" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Interview Schedule
              </h1>
              <p className={`${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                Plan and track your mock interviews, real interviews, and coaching sessions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <section className={`py-4 px-4 sm:px-6 lg:px-8 border-b ${isDarkTheme ? "border-gray-800" : "border-gray-200"}`}>
          <div className="max-w-7xl mx-auto">
            <div className={`card-premium p-4 ${isDarkTheme ? "bg-amber-900/20 border-amber-700/50" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2 mb-3">
                <svg className={`w-5 h-5 ${isDarkTheme ? "text-amber-400" : "text-amber-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className={`font-semibold ${isDarkTheme ? "text-amber-300" : "text-amber-800"}`}>
                  Upcoming Reminders
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {reminders.map((schedule) => {
                  const reminderText = getScheduleReminderText(schedule.scheduled_at);
                  return (
                    <div
                      key={schedule.id}
                      className={`p-3 rounded-xl ${isDarkTheme ? "bg-gray-800/80" : "bg-white"} flex items-center justify-between`}
                    >
                      <div>
                        <p className={`font-medium text-sm ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                          {schedule.title}
                        </p>
                        <p className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                          {formatScheduleDate(schedule.scheduled_at)} at {formatScheduleTime(schedule.scheduled_at)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isDarkTheme ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-700"
                      }`}>
                        {reminderText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* View Toggle & Filters */}
      <section className={`py-4 px-4 sm:px-6 lg:px-8 border-b ${isDarkTheme ? "border-gray-800" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`card-premium p-4 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    viewMode === "calendar"
                      ? "bg-red-600 text-white"
                      : isDarkTheme
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Calendar
                  </span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    viewMode === "list"
                      ? "bg-red-600 text-white"
                      : isDarkTheme
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    List
                  </span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-4 py-2 rounded-xl border text-sm ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                >
                  <option value="">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`px-4 py-2 rounded-xl border text-sm ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                >
                  <option value="">All Types</option>
                  <option value="mock">Mock Interview</option>
                  <option value="real">Real Interview</option>
                  <option value="coaching">Coaching Session</option>
                </select>

                {(statusFilter || typeFilter) && (
                  <button
                    onClick={() => {
                      setStatusFilter("");
                      setTypeFilter("");
                    }}
                    className={`text-sm font-medium ${
                      isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : viewMode === "calendar" ? (
            /* Calendar View */
            <div className={`card-premium overflow-hidden ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
              {/* Calendar Header */}
              <div className={`p-4 flex items-center justify-between border-b ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex items-center gap-4">
                  <h2 className={`text-xl font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                    {monthNames[currentMonth]} {currentYear}
                  </h2>
                  <button
                    onClick={goToToday}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      isDarkTheme
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Today
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousMonth}
                    className={`p-2 rounded-lg ${
                      isDarkTheme ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className={`p-2 rounded-lg ${
                      isDarkTheme ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className={`p-2 text-center text-sm font-medium border-b ${
                      isDarkTheme ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {renderCalendar()}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {schedules.length > 0 ? (
                <>
                  {/* Upcoming Interviews */}
                  {upcomingSchedules.length > 0 && (
                    <div className="mb-8">
                      <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                        Upcoming Interviews ({upcomingSchedules.length})
                      </h3>
                      <div className="space-y-3">
                        {upcomingSchedules.map((schedule) => (
                          <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            isDarkTheme={isDarkTheme}
                            onEdit={() => setEditingSchedule(schedule)}
                            onUpdateStatus={handleUpdateStatus}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Interviews */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                      All Interviews ({schedules.length})
                    </h3>
                    <div className="space-y-3">
                      {schedules.map((schedule) => (
                        <ScheduleCard
                          key={schedule.id}
                          schedule={schedule}
                          isDarkTheme={isDarkTheme}
                          onEdit={() => setEditingSchedule(schedule)}
                          onUpdateStatus={handleUpdateStatus}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className={`text-center py-12 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium mb-1">No interviews scheduled</p>
                  <p className="text-sm mb-4">Start by scheduling your first interview</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-premium px-6 py-2"
                  >
                    Schedule Interview
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Create Schedule Modal */}
      {showCreateModal && userEmail && (
        <ScheduleModal
          isDarkTheme={isDarkTheme}
          userEmail={userEmail}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchSchedules();
          }}
        />
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && userEmail && (
        <ScheduleModal
          isDarkTheme={isDarkTheme}
          userEmail={userEmail}
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSuccess={() => {
            setEditingSchedule(null);
            fetchSchedules();
          }}
        />
      )}
    </div>
  );
}

// Schedule Card Component
function ScheduleCard({
  schedule,
  isDarkTheme,
  onEdit,
  onUpdateStatus,
  onDelete,
}: {
  schedule: InterviewSchedule;
  isDarkTheme: boolean;
  onEdit: () => void;
  onUpdateStatus: (id: string, status: "completed" | "cancelled") => void;
  onDelete: (id: string) => void;
}) {
  const typeColors = interviewTypeColors[schedule.interview_type] || interviewTypeColors.mock;
  const statusColor = statusColors[schedule.status] || statusColors.scheduled;
  const isPast = isSchedulePast(schedule.scheduled_at);

  return (
    <div
      className={`card-premium p-4 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""} ${
        isPast && schedule.status === "scheduled" ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                isDarkTheme ? typeColors.darkBg : typeColors.bg
              } ${isDarkTheme ? typeColors.darkText : typeColors.text}`}
            >
              {interviewTypeLabels[schedule.interview_type] || schedule.interview_type}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                isDarkTheme ? statusColor.darkBg : statusColor.bg
              } ${isDarkTheme ? statusColor.darkText : statusColor.text}`}
            >
              {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
            </span>
          </div>

          <h3 className={`font-semibold text-lg mb-1 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            {schedule.title}
          </h3>

          <div className={`flex items-center gap-4 text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatScheduleDate(schedule.scheduled_at)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatScheduleTime(schedule.scheduled_at)} ({schedule.duration_minutes} min)
            </span>
          </div>

          {(schedule.company_name || schedule.job_title) && (
            <div className={`mt-2 text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
              {schedule.company_name && <span className="font-medium">{schedule.company_name}</span>}
              {schedule.company_name && schedule.job_title && " - "}
              {schedule.job_title && <span>{schedule.job_title}</span>}
            </div>
          )}

          {schedule.notes && (
            <p className={`mt-2 text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
              {schedule.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {schedule.status === "scheduled" && (
            <>
              <button
                onClick={() => onUpdateStatus(schedule.id, "completed")}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkTheme
                    ? "hover:bg-green-900/50 text-green-400"
                    : "hover:bg-green-50 text-green-600"
                }`}
                title="Mark as completed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => onUpdateStatus(schedule.id, "cancelled")}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkTheme
                    ? "hover:bg-red-900/50 text-red-400"
                    : "hover:bg-red-50 text-red-600"
                }`}
                title="Cancel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={onEdit}
            className={`p-2 rounded-lg transition-colors ${
              isDarkTheme
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkTheme
                ? "hover:bg-red-900/50 text-gray-400 hover:text-red-400"
                : "hover:bg-red-50 text-gray-400 hover:text-red-600"
            }`}
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Schedule Modal Component (Create/Edit)
function ScheduleModal({
  isDarkTheme,
  userEmail,
  schedule,
  onClose,
  onSuccess,
}: {
  isDarkTheme: boolean;
  userEmail: string;
  schedule?: InterviewSchedule;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!schedule;

  const [formData, setFormData] = useState({
    title: schedule?.title || "",
    interview_type: schedule?.interview_type || "mock",
    company_name: schedule?.company_name || "",
    job_title: schedule?.job_title || "",
    scheduled_at: schedule?.scheduled_at
      ? new Date(schedule.scheduled_at).toISOString().slice(0, 16)
      : "",
    duration_minutes: schedule?.duration_minutes?.toString() || "30",
    notes: schedule?.notes || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/schedule/${schedule.id}` : "/api/schedule";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          user_email: userEmail,
          duration_minutes: parseInt(formData.duration_minutes),
          scheduled_at: new Date(formData.scheduled_at).toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || `Failed to ${isEditing ? "update" : "create"} schedule`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} schedule:`, error);
      alert(`Failed to ${isEditing ? "update" : "create"} schedule`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 ${
          isDarkTheme ? "bg-gray-800" : "bg-white"
        } shadow-xl`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg ${
            isDarkTheme ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className={`text-xl font-bold mb-6 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
          {isEditing ? "Edit Interview" : "Schedule Interview"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="e.g., Mock Interview with John"
            />
          </div>

          {/* Interview Type */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Interview Type
            </label>
            <select
              value={formData.interview_type}
              onChange={(e) => setFormData({ ...formData, interview_type: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
            >
              <option value="mock">Mock Interview</option>
              <option value="real">Real Interview</option>
              <option value="coaching">Coaching Session</option>
            </select>
          </div>

          {/* Company Name */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Company Name (optional)
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="e.g., Google"
            />
          </div>

          {/* Job Title */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Job Title (optional)
            </label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="e.g., Software Engineer Intern"
            />
          </div>

          {/* Date/Time */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
            />
          </div>

          {/* Duration */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Duration (minutes)
            </label>
            <select
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className={`w-full px-4 py-2.5 rounded-xl border resize-none ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="Any preparation notes, questions to ask, etc."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl border font-medium ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-premium py-3 disabled:opacity-50"
            >
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                ? "Save Changes"
                : "Schedule Interview"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
