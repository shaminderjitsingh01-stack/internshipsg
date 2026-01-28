// Welcome Email Template
// This is a React-based email template for use with react-email
// Can be used for preview/testing or converted to HTML

interface WelcomeEmailProps {
  name: string;
  baseUrl?: string;
}

export default function WelcomeEmail({
  name,
  baseUrl = "https://internship.sg",
}: WelcomeEmailProps) {
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
            Welcome to Internship.sg!
          </h2>

          <p
            style={{
              color: "#475569",
              margin: "0 0 24px 0",
              fontSize: "16px",
              lineHeight: 1.6,
            }}
          >
            Hey {name},
          </p>

          <p
            style={{
              color: "#475569",
              margin: "0 0 24px 0",
              fontSize: "16px",
              lineHeight: 1.6,
            }}
          >
            You're now part of the community of ambitious students preparing for
            their dream internships. We're here to help you ace every interview
            with AI-powered practice and feedback.
          </p>

          {/* Getting Started Box */}
          <div
            style={{
              background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
              borderRadius: "12px",
              padding: "24px",
              margin: "24px 0",
            }}
          >
            <h3
              style={{
                color: "#dc2626",
                margin: "0 0 12px 0",
                fontSize: "16px",
              }}
            >
              Get started:
            </h3>
            <ul
              style={{
                color: "#475569",
                margin: 0,
                paddingLeft: "20px",
                fontSize: "14px",
                lineHeight: 1.8,
              }}
            >
              <li>Practice with our AI interviewer</li>
              <li>Upload your resume for personalized questions</li>
              <li>Build your streak and earn badges</li>
              <li>Climb the leaderboard</li>
            </ul>
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
              Start Practicing
            </a>
          </div>

          <p
            style={{
              color: "#64748b",
              margin: "32px 0 0 0",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Good luck with your interview prep!
          </p>
        </div>

        {/* Footer */}
        <div
          style={{ textAlign: "center", marginTop: "32px", padding: "0 20px" }}
        >
          <p
            style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 8px 0" }}
          >
            You're receiving this because you signed up for Internship.sg
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

// Export subject line for use in email service
export const subject = "Welcome to Internship.sg - Let's ace your interviews!";
