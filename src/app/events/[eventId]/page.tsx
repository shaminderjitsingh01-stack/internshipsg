"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

interface EventAttendee {
  user_email: string;
  status: string;
  created_at: string;
}

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
  interested_count: number;
  attendees: EventAttendee[];
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

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isEventPast(startTime: string): boolean {
  return new Date(startTime) < new Date();
}

function getTimeUntilEvent(startTime: string): string {
  const now = new Date();
  const eventDate = new Date(startTime);
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} away`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} away`;
  } else {
    return "Starting soon";
  }
}

function extractNameFromEmail(email: string): string {
  const name = email.split("@")[0];
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, " ");
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const userEmail = session?.user?.email;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  // Fetch event
  const fetchEvent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userEmail) params.set("user_email", userEmail);

      const res = await fetch(`/api/events/${eventId}?${params.toString()}`);
      const data = await res.json();
      if (data.event) {
        setEvent(data.event);
      } else if (data.error) {
        console.error("Event error:", data.error);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId, userEmail]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // RSVP handler
  const handleRsvp = async (status: "going" | "interested" | "not_going") => {
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
        fetchEvent();
      } else {
        alert(data.error || "Failed to update RSVP");
      }
    } catch (error) {
      console.error("Error updating RSVP:", error);
      alert("Failed to update RSVP");
    }
  };

  // Cancel RSVP handler
  const handleCancelRsvp = async () => {
    if (!userEmail) return;

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp?user_email=${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        fetchEvent();
      } else {
        alert(data.error || "Failed to cancel RSVP");
      }
    } catch (error) {
      console.error("Error canceling RSVP:", error);
    }
  };

  // Delete event handler
  const handleDeleteEvent = async () => {
    if (!userEmail || !confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}?user_email=${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        router.push("/events");
      } else {
        alert(data.error || "Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  // Share event
  const shareEvent = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description || `Check out this event: ${event?.title}`,
        url,
      });
    } else {
      setShowShareModal(true);
    }
  };

  const copyToClipboard = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
    setShowShareModal(false);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}>
        <svg className={`w-16 h-16 mb-4 ${isDarkTheme ? "text-gray-600" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className={`text-xl font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Event Not Found</h2>
        <p className={`mb-4 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>This event may have been deleted or doesn&apos;t exist.</p>
        <Link href="/events" className="btn-premium px-6 py-2">
          Back to Events
        </Link>
      </div>
    );
  }

  const typeColors = eventTypeColors[event.event_type] || eventTypeColors.meetup;
  const isPast = isEventPast(event.start_time);
  const isOrganizer = userEmail === event.organizer_email;
  const spotsLeft = event.max_attendees ? event.max_attendees - event.attendee_count : null;

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Navigation */}
      <nav
        className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${
          isDarkTheme ? "border-red-800/30" : "border-gray-200/50"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/events" className={`flex items-center gap-2 ${isDarkTheme ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Events</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={shareEvent}
                className={`p-2 rounded-lg ${isDarkTheme ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
                title="Share event"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              {isOrganizer && (
                <button
                  onClick={handleDeleteEvent}
                  className={`p-2 rounded-lg text-red-500 ${isDarkTheme ? "hover:bg-red-900/30" : "hover:bg-red-50"}`}
                  title="Delete event"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Cover Image */}
      {event.cover_image ? (
        <div className="w-full h-64 md:h-80 bg-gray-200 dark:bg-gray-800">
          <img
            src={event.cover_image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`w-full h-48 md:h-64 ${isDarkTheme ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-red-50 to-red-100"} flex items-center justify-center`}>
          <svg className={`w-24 h-24 ${isDarkTheme ? "text-gray-700" : "text-red-200"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isDarkTheme ? typeColors.darkBg : typeColors.bg
                  } ${isDarkTheme ? typeColors.darkText : typeColors.text}`}
                >
                  {eventTypeLabels[event.event_type] || event.event_type}
                </span>
                {isPast && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkTheme ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                    Past Event
                  </span>
                )}
                {event.is_virtual && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkTheme ? "bg-cyan-900/50 text-cyan-300" : "bg-cyan-100 text-cyan-700"}`}>
                    Virtual
                  </span>
                )}
              </div>

              <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                {event.title}
              </h1>

              {!isPast && (
                <p className={`text-lg ${isDarkTheme ? "text-red-400" : "text-red-600"} font-medium`}>
                  {getTimeUntilEvent(event.start_time)}
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div className={`card-premium p-5 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkTheme ? "bg-red-900/50" : "bg-red-100"}`}>
                  <svg className={`w-6 h-6 ${isDarkTheme ? "text-red-400" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                    {formatFullDate(event.start_time)}
                  </p>
                  <p className={`${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                    {formatTime(event.start_time)}
                    {event.end_time && ` - ${formatTime(event.end_time)}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            {(event.location || event.is_virtual) && (
              <div className={`card-premium p-5 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkTheme ? "bg-red-900/50" : "bg-red-100"}`}>
                    {event.is_virtual ? (
                      <svg className={`w-6 h-6 ${isDarkTheme ? "text-red-400" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className={`w-6 h-6 ${isDarkTheme ? "text-red-400" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                      {event.is_virtual ? "Virtual Event" : event.location}
                    </p>
                    {event.is_virtual && event.virtual_link && event.user_rsvp_status === "going" && (
                      <a
                        href={event.virtual_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:underline text-sm"
                      >
                        Join virtual event
                      </a>
                    )}
                    {event.is_virtual && event.virtual_link && event.user_rsvp_status !== "going" && (
                      <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                        RSVP as &quot;Going&quot; to see the link
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  About this event
                </h2>
                <div className={`prose max-w-none ${isDarkTheme ? "prose-invert text-gray-300" : "text-gray-700"}`}>
                  <p className="whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
            )}

            {/* Organizer */}
            <div className={`card-premium p-5 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Organizer
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                  {event.organizer_email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`font-medium ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                    {extractNameFromEmail(event.organizer_email)}
                  </p>
                  <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    Event Organizer
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - RSVP & Attendees */}
          <div className="space-y-6">
            {/* RSVP Card */}
            <div className={`card-premium p-6 sticky top-24 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
              {/* Capacity */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className={`w-5 h-5 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                    {event.attendee_count} going
                  </span>
                </div>
                {event.interested_count > 0 && (
                  <span className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    {event.interested_count} interested
                  </span>
                )}
              </div>

              {/* Capacity bar */}
              {event.max_attendees && (
                <div className="mb-4">
                  <div className={`h-2 rounded-full ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"}`}>
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{ width: `${Math.min((event.attendee_count / event.max_attendees) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className={`text-sm mt-2 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    {spotsLeft !== null && spotsLeft > 0
                      ? `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`
                      : spotsLeft === 0
                      ? "Event is full"
                      : `${event.attendee_count} of ${event.max_attendees} spots filled`}
                  </p>
                </div>
              )}

              {/* RSVP Buttons */}
              {!isPast && (
                <div className="space-y-3">
                  {event.user_rsvp_status === "going" ? (
                    <>
                      <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-semibold">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        You&apos;re going!
                      </div>
                      <button
                        onClick={handleCancelRsvp}
                        className={`w-full py-2 rounded-xl text-sm font-medium ${
                          isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        Cancel RSVP
                      </button>
                    </>
                  ) : event.user_rsvp_status === "interested" ? (
                    <>
                      <button
                        onClick={() => handleRsvp("going")}
                        className="w-full btn-premium py-3"
                        disabled={spotsLeft === 0}
                      >
                        {spotsLeft === 0 ? "Event Full" : "Change to Going"}
                      </button>
                      <div className="flex items-center justify-center gap-2 py-2 text-blue-500 font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Interested
                      </div>
                      <button
                        onClick={handleCancelRsvp}
                        className={`w-full py-2 rounded-xl text-sm font-medium ${
                          isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        Remove interest
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRsvp("going")}
                        className="w-full btn-premium py-3"
                        disabled={spotsLeft === 0}
                      >
                        {spotsLeft === 0 ? "Event Full" : "RSVP - Going"}
                      </button>
                      <button
                        onClick={() => handleRsvp("interested")}
                        className={`w-full py-3 rounded-xl border font-medium ${
                          isDarkTheme
                            ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Interested
                      </button>
                    </>
                  )}
                </div>
              )}

              {isPast && (
                <p className={`text-center py-3 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                  This event has ended
                </p>
              )}
            </div>

            {/* Attendees List */}
            {event.attendees.length > 0 && (
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  Attendees ({event.attendee_count})
                </h2>
                <div className="space-y-3">
                  {event.attendees.slice(0, 10).map((attendee) => (
                    <div key={attendee.user_email} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                        {attendee.user_email.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                        {extractNameFromEmail(attendee.user_email)}
                      </span>
                    </div>
                  ))}
                  {event.attendees.length > 10 && (
                    <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      +{event.attendees.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowShareModal(false)}></div>
          <div className={`relative w-full max-w-md rounded-2xl p-6 ${isDarkTheme ? "bg-gray-800" : "bg-white"} shadow-xl`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              Share Event
            </h3>
            <div className={`p-3 rounded-xl ${isDarkTheme ? "bg-gray-700" : "bg-gray-100"} mb-4`}>
              <p className={`text-sm break-all ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                {typeof window !== "undefined" ? window.location.href : ""}
              </p>
            </div>
            <button onClick={copyToClipboard} className="w-full btn-premium py-3">
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
