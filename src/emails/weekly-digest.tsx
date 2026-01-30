// Weekly Digest Email Template
// Sent every Sunday with the user's weekly progress summary

interface TopPost {
  id: string;
  authorName: string;
  authorImage?: string;
  content: string;
  likes: number;
  comments: number;
}

interface NewFollower {
  name: string;
  username?: string;
  image?: string;
}

interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  jobType: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  startTime: string;
  eventType: string;
  isVirtual: boolean;
}

interface WeeklyDigestEmailProps {
  name: string;
  // Weekly stats
  xpEarned: number;
  interviewsCompleted: number;
  currentStreak: number;
  avgScore: number | null;
  // Social
  topPosts: TopPost[];
  newFollowers: NewFollower[];
  newFollowersCount: number;
  // Recommendations
  recommendedJobs: RecommendedJob[];
  upcomingEvents: UpcomingEvent[];
  // All-time stats
  totalXP: number;
  longestStreak: number;
  totalInterviews: number;
  baseUrl?: string;
}

export default function WeeklyDigestEmail({
  name,
  xpEarned,
  interviewsCompleted,
  currentStreak,
  avgScore,
  topPosts,
  newFollowers,
  newFollowersCount,
  recommendedJobs,
  upcomingEvents,
  totalXP,
  longestStreak,
  totalInterviews,
  baseUrl = "https://internship.sg",
}: WeeklyDigestEmailProps) {
  return (
    <div
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#f8fafc",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              color: "#dc2626",
              margin: 0,
              fontSize: "28px",
              fontWeight: "bold",
            }}
          >
            Internship.sg
          </h1>
          <p style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>
            Your Weekly Digest
          </p>
        </div>

        {/* Greeting Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
            color: "white",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: "0 0 8px 0",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            Hey {name}!
          </h2>
          <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
            Here&apos;s your weekly progress summary
          </p>
        </div>

        {/* Weekly Stats Card */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              color: "#1e293b",
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            This Week&apos;s Stats
          </h3>

          {/* Stats Grid - Using table for email compatibility */}
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "8px",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                    width: "50%",
                  }}
                >
                  <p
                    style={{
                      color: "#64748b",
                      margin: "0 0 4px 0",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    XP Earned
                  </p>
                  <p
                    style={{
                      color: "#dc2626",
                      margin: 0,
                      fontSize: "28px",
                      fontWeight: "bold",
                    }}
                  >
                    +{xpEarned}
                  </p>
                </td>
                <td
                  style={{
                    background: "#f8fafc",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                    width: "50%",
                  }}
                >
                  <p
                    style={{
                      color: "#64748b",
                      margin: "0 0 4px 0",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Interviews
                  </p>
                  <p
                    style={{
                      color: "#1e293b",
                      margin: 0,
                      fontSize: "28px",
                      fontWeight: "bold",
                    }}
                  >
                    {interviewsCompleted}
                  </p>
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    background: "#fff7ed",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                    width: "50%",
                  }}
                >
                  <p
                    style={{
                      color: "#64748b",
                      margin: "0 0 4px 0",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Current Streak
                  </p>
                  <p
                    style={{
                      color: "#ea580c",
                      margin: 0,
                      fontSize: "28px",
                      fontWeight: "bold",
                    }}
                  >
                    {currentStreak} days
                  </p>
                </td>
                <td
                  style={{
                    background: "#f0fdf4",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                    width: "50%",
                  }}
                >
                  <p
                    style={{
                      color: "#64748b",
                      margin: "0 0 4px 0",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Avg. Score
                  </p>
                  <p
                    style={{
                      color: "#16a34a",
                      margin: 0,
                      fontSize: "28px",
                      fontWeight: "bold",
                    }}
                  >
                    {avgScore !== null ? `${avgScore}%` : "-"}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* All-time Stats */}
          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              marginTop: "20px",
              paddingTop: "16px",
            }}
          >
            <p
              style={{
                color: "#64748b",
                margin: 0,
                fontSize: "13px",
                textAlign: "center",
              }}
            >
              Total XP: <strong style={{ color: "#1e293b" }}>{totalXP.toLocaleString()}</strong>
              {" | "}
              Longest streak: <strong style={{ color: "#1e293b" }}>{longestStreak} days</strong>
              {" | "}
              Total interviews: <strong style={{ color: "#1e293b" }}>{totalInterviews}</strong>
            </p>
          </div>
        </div>

        {/* Top Posts from Network */}
        {topPosts.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                color: "#1e293b",
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Top Posts from Your Network
            </h3>

            {topPosts.slice(0, 3).map((post, index) => (
              <div
                key={post.id}
                style={{
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  marginBottom: index < topPosts.length - 1 ? "12px" : "0",
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <span
                    style={{
                      color: "#1e293b",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    {post.authorName}
                  </span>
                </div>
                <p
                  style={{
                    color: "#475569",
                    margin: "0 0 12px 0",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  {post.content.length > 150
                    ? post.content.substring(0, 150) + "..."
                    : post.content}
                </p>
                <div style={{ display: "flex", gap: "16px" }}>
                  <span style={{ color: "#64748b", fontSize: "12px" }}>
                    {post.likes} likes
                  </span>
                  <span style={{ color: "#64748b", fontSize: "12px" }}>
                    {post.comments} comments
                  </span>
                </div>
              </div>
            ))}

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <a
                href={`${baseUrl}/feed`}
                style={{
                  color: "#dc2626",
                  fontSize: "14px",
                  fontWeight: "500",
                  textDecoration: "none",
                }}
              >
                View all posts
              </a>
            </div>
          </div>
        )}

        {/* New Followers */}
        {newFollowersCount > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                color: "#1e293b",
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              New Followers This Week
            </h3>

            <div
              style={{
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  color: "#2563eb",
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: "bold",
                }}
              >
                +{newFollowersCount}
              </p>
              <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "13px" }}>
                new {newFollowersCount === 1 ? "follower" : "followers"}
              </p>
            </div>

            {newFollowers.length > 0 && (
              <div>
                <p
                  style={{
                    color: "#64748b",
                    margin: "0 0 12px 0",
                    fontSize: "13px",
                  }}
                >
                  Including:
                </p>
                {newFollowers.slice(0, 3).map((follower, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom:
                        index < newFollowers.length - 1
                          ? "1px solid #e2e8f0"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#dc2626",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "14px",
                        marginRight: "12px",
                      }}
                    >
                      {follower.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ color: "#1e293b", margin: 0, fontSize: "14px", fontWeight: "500" }}>
                        {follower.name}
                      </p>
                      {follower.username && (
                        <p style={{ color: "#64748b", margin: "2px 0 0 0", fontSize: "12px" }}>
                          @{follower.username}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommended Jobs */}
        {recommendedJobs.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                color: "#1e293b",
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Recommended Jobs for You
            </h3>

            {recommendedJobs.slice(0, 3).map((job, index) => (
              <a
                key={job.id}
                href={`${baseUrl}/jobs/${job.id}`}
                style={{
                  display: "block",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  marginBottom: index < recommendedJobs.length - 1 ? "12px" : "0",
                  textDecoration: "none",
                  border: "1px solid transparent",
                }}
              >
                <p
                  style={{
                    color: "#1e293b",
                    margin: "0 0 4px 0",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  {job.title}
                </p>
                <p
                  style={{
                    color: "#475569",
                    margin: "0 0 8px 0",
                    fontSize: "14px",
                  }}
                >
                  {job.company}
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                  {job.location && (
                    <span style={{ color: "#64748b", fontSize: "12px" }}>
                      {job.location}
                    </span>
                  )}
                  <span
                    style={{
                      background: "#fef2f2",
                      color: "#dc2626",
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      textTransform: "capitalize",
                    }}
                  >
                    {job.jobType}
                  </span>
                </div>
              </a>
            ))}

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <a
                href={`${baseUrl}/jobs`}
                style={{
                  display: "inline-block",
                  background: "linear-gradient(to right, #dc2626, #ef4444)",
                  color: "white",
                  textDecoration: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Browse All Jobs
              </a>
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                color: "#1e293b",
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Upcoming Events
            </h3>

            {upcomingEvents.slice(0, 3).map((event, index) => (
              <a
                key={event.id}
                href={`${baseUrl}/events/${event.id}`}
                style={{
                  display: "block",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  marginBottom: index < upcomingEvents.length - 1 ? "12px" : "0",
                  textDecoration: "none",
                }}
              >
                <p
                  style={{
                    color: "#1e293b",
                    margin: "0 0 4px 0",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  {event.title}
                </p>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>
                    {new Date(event.startTime).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span
                    style={{
                      background: event.isVirtual ? "#eff6ff" : "#f0fdf4",
                      color: event.isVirtual ? "#2563eb" : "#16a34a",
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {event.isVirtual ? "Virtual" : "In-Person"}
                  </span>
                </div>
              </a>
            ))}

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <a
                href={`${baseUrl}/events`}
                style={{
                  color: "#dc2626",
                  fontSize: "14px",
                  fontWeight: "500",
                  textDecoration: "none",
                }}
              >
                View all events
              </a>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              color: "#1e293b",
              margin: "0 0 8px 0",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            Ready to practice?
          </h3>
          <p
            style={{
              color: "#64748b",
              margin: "0 0 20px 0",
              fontSize: "14px",
            }}
          >
            Keep your streak alive and level up your interview skills
          </p>
          <a
            href={`${baseUrl}/dashboard`}
            style={{
              display: "inline-block",
              background: "linear-gradient(to right, #dc2626, #ef4444)",
              color: "white",
              textDecoration: "none",
              padding: "14px 32px",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            Start Practicing
          </a>
        </div>

        {/* Footer */}
        <div
          style={{ textAlign: "center", marginTop: "32px", padding: "0 20px" }}
        >
          <p
            style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 8px 0" }}
          >
            You&apos;re receiving this because you enabled weekly digest emails
          </p>
          <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
            <a
              href={`${baseUrl}/settings`}
              style={{ color: "#64748b", textDecoration: "underline" }}
            >
              Manage email preferences
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Export subject generator
export const getSubject = (xpEarned: number, currentStreak: number) =>
  `Your weekly digest: +${xpEarned} XP, ${currentStreak}-day streak`;

// Export types for use in API route
export type {
  WeeklyDigestEmailProps,
  TopPost,
  NewFollower,
  RecommendedJob,
  UpcomingEvent,
};
