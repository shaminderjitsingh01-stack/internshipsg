"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";

interface NotificationActor {
  email: string;
  username: string | null;
  name: string;
  image: string | null;
}

interface Notification {
  id: string;
  user_email: string;
  type: string;
  title: string;
  message: string;
  actor_email: string | null;
  target_type: string | null;
  target_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: NotificationActor | null;
}

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  earlier: Notification[];
}

const NOTIFICATION_ICONS: Record<string, { icon: React.ReactNode; bgClass: string }> = {
  follow: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    bgClass: "bg-blue-500",
  },
  like: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
    bgClass: "bg-red-500",
  },
  comment: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    bgClass: "bg-green-500",
  },
  mention: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
      </svg>
    ),
    bgClass: "bg-purple-500",
  },
  achievement: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    bgClass: "bg-yellow-500",
  },
  system: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgClass: "bg-slate-500",
  },
  reaction: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgClass: "bg-orange-500",
  },
};

function getNotificationIcon(type: string) {
  return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.system;
}

function getNotificationLink(notification: Notification): string {
  const { target_type, target_id, actor } = notification;

  if (notification.type === "follow" && actor?.username) {
    return `/u/${actor.username}`;
  }

  if (target_type && target_id) {
    switch (target_type) {
      case "post":
        return `/home?post=${target_id}`;
      case "comment":
        return `/home?comment=${target_id}`;
      case "profile":
        return `/u/${target_id}`;
      case "interview":
        return `/history/${target_id}`;
      case "achievement":
        return `/achievements`;
      default:
        return "#";
    }
  }

  return "#";
}

function groupNotificationsByDate(notifications: Notification[]): GroupedNotifications {
  const groups: GroupedNotifications = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at);

    if (isToday(date)) {
      groups.today.push(notification);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notification);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(notification);
    } else {
      groups.earlier.push(notification);
    }
  });

  return groups;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const res = await fetch(
        `/api/social/notifications?email=${encodeURIComponent(session.user?.email)}`
      );

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    if (!session?.user?.email) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch("/api/social/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user?.email,
          notification_ids: [notificationId],
        }),
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
      // Revert on error
      fetchNotifications();
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!session?.user?.email || markingAllRead) return;

    setMarkingAllRead(true);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/social/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user?.email,
          mark_all: true,
        }),
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      // Revert on error
      fetchNotifications();
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkTheme ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const groupedNotifications = groupNotificationsByDate(notifications);

  const renderNotificationGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <h3
          className={`text-sm font-semibold mb-3 px-1 ${
            isDarkTheme ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {title}
        </h3>
        <div className="space-y-2">
          {items.map((notification) => {
            const iconConfig = getNotificationIcon(notification.type);
            const link = getNotificationLink(notification);

            return (
              <Link
                key={notification.id}
                href={link}
                onClick={() => handleNotificationClick(notification)}
                className={`block rounded-xl p-4 transition-all ${
                  notification.is_read
                    ? isDarkTheme
                      ? "bg-slate-900/50 hover:bg-slate-800/50"
                      : "bg-white hover:bg-slate-50"
                    : isDarkTheme
                    ? "bg-slate-800 hover:bg-slate-700 border-l-4 border-red-500"
                    : "bg-red-50/50 hover:bg-red-50 border-l-4 border-red-500"
                } ${
                  isDarkTheme ? "border-slate-800" : "border-slate-200"
                } border ${!notification.is_read ? "border-l-4" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* Actor Avatar or Icon */}
                  <div className="relative flex-shrink-0">
                    {notification.actor?.image ? (
                      <img
                        src={notification.actor.image}
                        alt={notification.actor.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : notification.actor ? (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDarkTheme ? "bg-red-900/50" : "bg-red-100"
                        }`}
                      >
                        <span className="text-red-600 font-semibold">
                          {notification.actor.name?.charAt(0) || "U"}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${iconConfig.bgClass} text-white`}
                      >
                        {iconConfig.icon}
                      </div>
                    )}
                    {/* Type badge */}
                    {notification.actor && (
                      <div
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${iconConfig.bgClass} text-white`}
                      >
                        <div className="w-3 h-3">{iconConfig.icon}</div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        notification.is_read
                          ? isDarkTheme
                            ? "text-slate-300"
                            : "text-slate-600"
                          : isDarkTheme
                          ? "text-white font-medium"
                          : "text-slate-900 font-medium"
                      }`}
                    >
                      {notification.actor && (
                        <span className="font-semibold">
                          {notification.actor.name}{" "}
                        </span>
                      )}
                      {notification.message}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkTheme ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const hasNotifications = notifications.length > 0;

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkTheme ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme
            ? "bg-slate-950/80 border-white/10"
            : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Internship.sg"
              className={`h-7 sm:h-8 w-auto ${
                isDarkTheme ? "brightness-0 invert" : ""
              }`}
            />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${
                isDarkTheme
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-slate-100 hover:bg-slate-200"
              }`}
              aria-label="Toggle theme"
            >
              {isDarkTheme ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-lg font-medium text-sm ${
                isDarkTheme
                  ? "text-slate-300 hover:bg-white/10"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Dashboard
            </Link>

            {session.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDarkTheme ? "bg-red-900/50" : "bg-red-100"
                }`}
              >
                <span className="text-red-600 font-semibold text-sm">
                  {session.user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Title and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className={`text-2xl sm:text-3xl font-bold ${
                isDarkTheme ? "text-white" : "text-slate-900"
              }`}
            >
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p
                className={`text-sm mt-1 ${
                  isDarkTheme ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {hasNotifications && unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAllRead}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkTheme
                  ? "bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50"
              }`}
            >
              {markingAllRead ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Marking...
                </span>
              ) : (
                "Mark all as read"
              )}
            </button>
          )}
        </div>

        {/* Notifications List */}
        {hasNotifications ? (
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDarkTheme
                ? "bg-slate-900/50 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="p-4">
              {renderNotificationGroup("Today", groupedNotifications.today)}
              {renderNotificationGroup(
                "Yesterday",
                groupedNotifications.yesterday
              )}
              {renderNotificationGroup(
                "This Week",
                groupedNotifications.thisWeek
              )}
              {renderNotificationGroup("Earlier", groupedNotifications.earlier)}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div
            className={`rounded-2xl border p-12 text-center ${
              isDarkTheme
                ? "bg-slate-900/50 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <svg
                className={`w-8 h-8 ${
                  isDarkTheme ? "text-slate-600" : "text-slate-400"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h2
              className={`text-xl font-semibold mb-2 ${
                isDarkTheme ? "text-white" : "text-slate-900"
              }`}
            >
              No notifications yet
            </h2>
            <p
              className={`text-sm mb-6 ${
                isDarkTheme ? "text-slate-400" : "text-slate-600"
              }`}
            >
              When you get notifications, they will appear here. Start
              connecting with others to see activity!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/home"
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-500 hover:to-red-400 transition-all shadow-lg shadow-red-500/25"
              >
                Explore Feed
              </Link>
              <Link
                href="/leaderboard"
                className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                  isDarkTheme
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 mt-12 ${
          isDarkTheme ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div
          className={`max-w-3xl mx-auto px-4 text-center text-sm ${
            isDarkTheme ? "text-slate-500" : "text-slate-500"
          }`}
        >
          <p>Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
