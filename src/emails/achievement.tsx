// Achievement/Badge Unlocked Email Template
// Sent when user unlocks a new badge

interface AchievementEmailProps {
  name: string;
  badgeName: string;
  badgeIcon: string;
  badgeDescription: string;
  baseUrl?: string;
}

export default function AchievementEmail({
  name,
  badgeName,
  badgeIcon,
  badgeDescription,
  baseUrl = "https://internship.sg",
}: AchievementEmailProps) {
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
          {/* Badge Icon */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ fontSize: "80px" }}>{badgeIcon}</span>
          </div>

          <h2
            style={{
              color: "#1e293b",
              margin: "0 0 8px 0",
              fontSize: "24px",
              textAlign: "center",
            }}
          >
            Badge Unlocked!
          </h2>

          <p
            style={{
              color: "#dc2626",
              margin: "0 0 24px 0",
              fontSize: "28px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {badgeName}
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
            Congratulations {name}! You've earned a new badge:
          </p>

          {/* Badge Description Box */}
          <div
            style={{
              background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
              borderRadius: "16px",
              padding: "24px",
              margin: "24px 0",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "#1e293b",
                margin: 0,
                fontSize: "16px",
                fontStyle: "italic",
              }}
            >
              "{badgeDescription}"
            </p>
          </div>

          <p
            style={{
              color: "#64748b",
              margin: "0 0 24px 0",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Your dedication is paying off. Keep up the great work!
          </p>

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
              View Your Badges
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
            You're receiving this because you enabled achievement notifications
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
export const getSubject = (badgeName: string) =>
  `You unlocked a new badge: ${badgeName}!`;
