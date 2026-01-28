// Streak Reminder Email Template
// Sent when user hasn't practiced and is about to lose their streak

interface StreakReminderEmailProps {
  name: string;
  currentStreak: number;
  streakTitle: string;
  baseUrl?: string;
}

export default function StreakReminderEmail({
  name,
  currentStreak,
  streakTitle,
  baseUrl = "https://internship.sg",
}: StreakReminderEmailProps) {
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
          {/* Fire emoji */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ fontSize: "64px" }}>&#128293;</span>
          </div>

          <h2
            style={{
              color: "#1e293b",
              margin: "0 0 8px 0",
              fontSize: "24px",
              textAlign: "center",
            }}
          >
            Don't lose your streak!
          </h2>

          <p
            style={{
              color: "#dc2626",
              margin: "0 0 24px 0",
              fontSize: "20px",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {currentStreak}-day streak
          </p>

          <p
            style={{
              color: "#475569",
              margin: "0 0 24px 0",
              fontSize: "16px",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            Hey {name}, you haven't practiced today yet! Your {streakTitle}{" "}
            status is at risk.
          </p>

          {/* Tip Box */}
          <div
            style={{
              background: "#fef3c7",
              borderRadius: "12px",
              padding: "20px",
              margin: "24px 0",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#92400e", margin: 0, fontSize: "14px" }}>
              <strong>Tip:</strong> Even a quick 5-minute practice session keeps
              your streak alive!
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
              Practice Now
            </a>
          </div>

          <p
            style={{
              color: "#94a3b8",
              margin: "32px 0 0 0",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            Streaks reset at midnight SGT if you miss a day.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{ textAlign: "center", marginTop: "32px", padding: "0 20px" }}
        >
          <p
            style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 8px 0" }}
          >
            You're receiving this because you enabled streak reminders
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
export const getSubject = (currentStreak: number) =>
  `Your ${currentStreak}-day streak is about to expire!`;
