// Weekly Digest Email Template
// Sent every Sunday with the user's weekly progress summary

interface WeeklyDigestEmailProps {
  name: string;
  weeklyActivities: number;
  currentStreak: number;
  longestStreak: number;
  totalActivities: number;
  newBadges: string[];
  interviewsCompleted: number;
  avgScore: number | null;
  baseUrl?: string;
}

export default function WeeklyDigestEmail({
  name,
  weeklyActivities,
  currentStreak,
  longestStreak,
  totalActivities,
  newBadges,
  interviewsCompleted,
  avgScore,
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
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
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
            AI-Powered Interview Prep
          </p>
        </div>

        {/* Content Card */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              color: "#1e293b",
              margin: "0 0 16px 0",
              fontSize: "24px",
            }}
          >
            Your Weekly Progress
          </h2>

          <p
            style={{
              color: "#475569",
              margin: "0 0 24px 0",
              fontSize: "16px",
              lineHeight: 1.6,
            }}
          >
            Hey {name}, here's how you did this week:
          </p>

          {/* Stats Grid - Using table for email compatibility */}
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "8px",
              margin: "24px 0",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    background: "#f8fafc",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                    width: "50%",
                  }}
                >
                  <p
                    style={{
                      color: "#64748b",
                      margin: "0 0 4px 0",
                      fontSize: "12px",
                      textTransform: "uppercase",
                    }}
                  >
                    Activities This Week
                  </p>
                  <p
                    style={{
                      color: "#1e293b",
                      margin: 0,
                      fontSize: "32px",
                      fontWeight: "bold",
                    }}
                  >
                    {weeklyActivities}
                  </p>
                </td>
                <td
                  style={{
                    background: "#f8fafc",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                    width: "50%",
                  }}
                >
                  <p
                    style={{
                      color: "#64748b",
                      margin: "0 0 4px 0",
                      fontSize: "12px",
                      textTransform: "uppercase",
                    }}
                  >
                    Current Streak
                  </p>
                  <p
                    style={{
                      color: "#dc2626",
                      margin: 0,
                      fontSize: "32px",
                      fontWeight: "bold",
                    }}
                  >
                    {currentStreak} &#128293;
                  </p>
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    background: "#f8fafc",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                    width: "50%",
                  }}
                >
                  <p
                    style={{
                      color: "#64748b",
                      margin: "0 0 4px 0",
                      fontSize: "12px",
                      textTransform: "uppercase",
                    }}
                  >
                    Interviews Completed
                  </p>
                  <p
                    style={{
                      color: "#1e293b",
                      margin: 0,
                      fontSize: "32px",
                      fontWeight: "bold",
                    }}
                  >
                    {interviewsCompleted}
                  </p>
                </td>
                <td
                  style={{
                    background: "#f8fafc",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                    width: "50%",
                  }}
                >
                  <p
                    style={{
                      color: "#64748b",
                      margin: "0 0 4px 0",
                      fontSize: "12px",
                      textTransform: "uppercase",
                    }}
                  >
                    Avg. Score
                  </p>
                  <p
                    style={{
                      color: "#1e293b",
                      margin: 0,
                      fontSize: "32px",
                      fontWeight: "bold",
                    }}
                  >
                    {avgScore !== null ? `${avgScore}%` : "-"}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* New Badges Section */}
          {newBadges.length > 0 && (
            <div
              style={{
                background: "#f0fdf4",
                borderRadius: "12px",
                padding: "20px",
                margin: "24px 0",
              }}
            >
              <h3
                style={{
                  color: "#166534",
                  margin: "0 0 12px 0",
                  fontSize: "16px",
                }}
              >
                New Badges Earned!
              </h3>
              <p style={{ color: "#475569", margin: 0, fontSize: "14px" }}>
                {newBadges.join(", ")}
              </p>
            </div>
          )}

          {/* All-time Stats */}
          <div
            style={{
              background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
              borderRadius: "12px",
              padding: "20px",
              margin: "24px 0",
            }}
          >
            <p
              style={{
                color: "#1e293b",
                margin: "0 0 8px 0",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              All-time Stats
            </p>
            <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
              Total activities: <strong>{totalActivities}</strong> | Longest
              streak: <strong>{longestStreak} days</strong>
            </p>
          </div>

          {/* CTA Button */}
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <a
              href={`${baseUrl}/dashboard`}
              style={{
                display: "inline-block",
                background: "linear-gradient(to right, #dc2626, #ef4444)",
                color: "white",
                textDecoration: "none",
                padding: "14px 32px",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "16px",
              }}
            >
              Keep Practicing
            </a>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{ textAlign: "center", marginTop: "32px", padding: "0 20px" }}
        >
          <p
            style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 8px 0" }}
          >
            You're receiving this because you enabled weekly digest emails
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
export const getSubject = (weeklyActivities: number, currentStreak: number) =>
  `Your weekly progress: ${weeklyActivities} activities, ${currentStreak}-day streak`;
