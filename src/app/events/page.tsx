"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Event {
  id: string;
  organizer_email: string;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  is_virtual: boolean;
  virtual_link: string | null;
  start_time: string;
  end_time: string | null;
  max_attendees: number | null;
  cover_image: string | null;
  is_public: boolean;
  created_at: string;
  attendee_count: number;
  user_rsvp_status: string | null;
}

// Event type colors
const eventTypeColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  meetup: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "bg-blue-900/50", darkText: "text-blue-300" },
  workshop: { bg: "bg-purple-100", text: "text-purple-700", darkBg: "bg-purple-900/50", darkText: "text-purple-300" },
  webinar: { bg: "bg-cyan-100", text: "text-cyan-700", darkBg: "bg-cyan-900/50", darkText: "text-cyan-300" },
  career_fair: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "bg-amber-900/50", darkText: "text-amber-300" },
  networking: { bg: "bg-green-100", text: "text-green-700", darkBg: "bg-green-900/50", darkText: "text-green-300" },
};

const eventTypeLabels: Record<string, string> = {
  meetup: "Meetup",
  workshop: "Workshop",
  webinar: "Webinar",
  career_fair: "Career Fair",
  networking: "Networking",
};

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isEventPast(startTime: string): boolean {
  return new Date(startTime) < new Date();
}

function isEventToday(startTime: string): boolean {
  const eventDate = new Date(startTime);
  const today = new Date();
  return eventDate.toDateString() === today.toDateString();
}

function isEventThisWeek(startTime: string): boolean {
  const eventDate = new Date(startTime);
  const today = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(today.getDate() + 7);
  return eventDate >= today && eventDate <= weekFromNow;
}

export default function EventsPage() {
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const userEmail = session?.user?.email;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [virtualFilter, setVirtualFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (eventTypeFilter) params.set("event_type", eventTypeFilter);
      if (virtualFilter) params.set("is_virtual", virtualFilter);
      if (userEmail) params.set("user_email", userEmail);
      params.set("upcoming_only", "true");

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [search, eventTypeFilter, virtualFilter, userEmail]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // RSVP handler
  const handleRsvp = async (eventId: string, status: "going" | "interested") => {
    if (!userEmail) {
      alert("Please sign in to RSVP");
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, status }),
      });

      const data = await res.json();
      if (data.success) {
        // Update local state
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  user_rsvp_status: status,
                  attendee_count: data.attendee_count,
                }
              : e
          )
        );
      } else {
        alert(data.error || "Failed to RSVP");
      }
    } catch (error) {
      console.error("Error updating RSVP:", error);
      alert("Failed to update RSVP");
    }
  };

  // Filter events by date
  const filteredEvents = events.filter((event) => {
    if (!dateFilter) return true;
    if (dateFilter === "today") return isEventToday(event.start_time);
    if (dateFilter === "week") return isEventThisWeek(event.start_time);
    return true;
  });

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
              <span className={`font-medium ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Events</span>
            </div>
            <div className="flex items-center gap-3">
              {userEmail && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-premium px-4 py-2 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Event
                </button>
              )}
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
                Events & Meetups
              </h1>
              <p className={`${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                Connect with the community at workshops, career fairs, and networking events
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className={`py-4 px-4 sm:px-6 lg:px-8 border-b ${isDarkTheme ? "border-gray-800" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`card-premium p-4 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="sm:col-span-2">
                <div className="relative">
                  <svg
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDarkTheme ? "text-gray-500" : "text-gray-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-200 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                  />
                </div>
              </div>

              {/* Event Type */}
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              >
                <option value="">All Types</option>
                <option value="meetup">Meetup</option>
                <option value="workshop">Workshop</option>
                <option value="webinar">Webinar</option>
                <option value="career_fair">Career Fair</option>
                <option value="networking">Networking</option>
              </select>

              {/* Virtual/In-Person */}
              <select
                value={virtualFilter}
                onChange={(e) => setVirtualFilter(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              >
                <option value="">All Formats</option>
                <option value="true">Virtual Only</option>
                <option value="false">In-Person Only</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
              </select>
            </div>

            {/* Clear filters */}
            {(search || eventTypeFilter || virtualFilter || dateFilter) && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => {
                    setSearch("");
                    setEventTypeFilter("");
                    setVirtualFilter("");
                    setDateFilter("");
                  }}
                  className={`text-sm font-medium ${
                    isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
              {loading ? "Loading..." : `${filteredEvents.length} upcoming events`}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const typeColors = eventTypeColors[event.event_type] || eventTypeColors.meetup;
                const isPast = isEventPast(event.start_time);

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className={`card-premium overflow-hidden group ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""} ${
                      isPast ? "opacity-60" : ""
                    }`}
                  >
                    {/* Cover Image */}
                    {event.cover_image ? (
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <img
                          src={event.cover_image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className={`aspect-video ${isDarkTheme ? "bg-gradient-to-br from-gray-700 to-gray-800" : "bg-gradient-to-br from-red-50 to-red-100"} flex items-center justify-center`}>
                        <svg className={`w-16 h-16 ${isDarkTheme ? "text-gray-600" : "text-red-200"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    <div className="p-5">
                      {/* Date Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className={`px-3 py-1.5 rounded-lg ${isDarkTheme ? "bg-gray-700" : "bg-gray-100"}`}>
                          <p className={`text-xs font-semibold ${isDarkTheme ? "text-red-400" : "text-red-600"}`}>
                            {formatEventDate(event.start_time)}
                          </p>
                          <p className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                            {formatEventTime(event.start_time)}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            isDarkTheme ? typeColors.darkBg : typeColors.bg
                          } ${isDarkTheme ? typeColors.darkText : typeColors.text}`}
                        >
                          {eventTypeLabels[event.event_type] || event.event_type}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className={`text-lg font-semibold mb-2 group-hover:text-red-600 transition-colors ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                        {event.title}
                      </h3>

                      {/* Description */}
                      {event.description && (
                        <p className={`text-sm mb-4 line-clamp-2 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                          {event.description}
                        </p>
                      )}

                      {/* Location & Format */}
                      <div className="flex items-center gap-4 mb-4 text-sm">
                        {event.is_virtual ? (
                          <span className={`flex items-center gap-1 ${isDarkTheme ? "text-cyan-400" : "text-cyan-600"}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Virtual
                          </span>
                        ) : event.location ? (
                          <span className={`flex items-center gap-1 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </span>
                        ) : null}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className={`flex items-center gap-1 text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {event.attendee_count} going
                          {event.max_attendees && ` / ${event.max_attendees}`}
                        </div>

                        {/* RSVP Buttons */}
                        {!isPast && (
                          <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                            <button
                              onClick={() => handleRsvp(event.id, "going")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                event.user_rsvp_status === "going"
                                  ? "bg-green-500 text-white"
                                  : isDarkTheme
                                  ? "bg-gray-700 text-gray-300 hover:bg-green-600 hover:text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-green-500 hover:text-white"
                              }`}
                            >
                              Going
                            </button>
                            <button
                              onClick={() => handleRsvp(event.id, "interested")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                event.user_rsvp_status === "interested"
                                  ? "bg-blue-500 text-white"
                                  : isDarkTheme
                                  ? "bg-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-blue-500 hover:text-white"
                              }`}
                            >
                              Interested
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-12 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium mb-1">No upcoming events</p>
              <p className="text-sm">Check back later or create your own event</p>
            </div>
          )}
        </div>
      </section>

      {/* Create Event Modal */}
      {showCreateModal && userEmail && (
        <CreateEventModal
          isDarkTheme={isDarkTheme}
          userEmail={userEmail}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

// Create Event Modal Component
function CreateEventModal({
  isDarkTheme,
  userEmail,
  onClose,
  onSuccess,
}: {
  isDarkTheme: boolean;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "meetup",
    location: "",
    is_virtual: false,
    virtual_link: "",
    start_time: "",
    end_time: "",
    max_attendees: "",
    cover_image: "",
    is_public: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          organizer_email: userEmail,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 ${
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
          Create New Event
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Event Title *
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
              placeholder="e.g., Tech Networking Meetup"
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-4 py-2.5 rounded-xl border resize-none ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="Tell people what to expect..."
            />
          </div>

          {/* Event Type */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Event Type
            </label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
            >
              <option value="meetup">Meetup</option>
              <option value="workshop">Workshop</option>
              <option value="webinar">Webinar</option>
              <option value="career_fair">Career Fair</option>
              <option value="networking">Networking</option>
            </select>
          </div>

          {/* Date/Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                Start Date/Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                End Date/Time
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              />
            </div>
          </div>

          {/* Virtual Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_virtual}
                onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>Virtual Event</span>
            </label>
          </div>

          {/* Location or Virtual Link */}
          {formData.is_virtual ? (
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                Virtual Link
              </label>
              <input
                type="url"
                value={formData.virtual_link}
                onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                placeholder="https://zoom.us/..."
              />
            </div>
          ) : (
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                placeholder="e.g., WeWork, 12 Marina Boulevard"
              />
            </div>
          )}

          {/* Max Attendees */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Max Attendees (optional)
            </label>
            <input
              type="number"
              min="1"
              value={formData.max_attendees}
              onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="Leave empty for unlimited"
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Cover Image URL (optional)
            </label>
            <input
              type="url"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="https://..."
            />
          </div>

          {/* Public Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>Public Event (visible to everyone)</span>
            </label>
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
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
