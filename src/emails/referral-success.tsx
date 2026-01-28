// Referral Success Email Template
// Sent when someone signs up using a user's referral link

interface ReferralSuccessEmailProps {
  name: string;
  referredName: string;
  rewardPoints: number;
  totalReferrals: number;
  baseUrl?: string;
}

export default function ReferralSuccessEmail({
  name,
  referredName,
  rewardPoints,
  totalReferrals,
  baseUrl = "https://internship.sg",
}: ReferralSuccessEmailProps) {
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
          {/* Celebration emoji */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ fontSize: "64px" }}>&#127881;</span>
          </div>

          <h2
            style={{
              color: "#1e293b",
              margin: "0 0 16px 0",
              fontSize: "24px",
              textAlign: "center",
            }}
          >
            Your Referral Signed Up!
          </h2>

          <p
            style={{
              color: "#475569",
              margin: "0 0 24px 0",
              fontSize: "16px",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            Great news {name}! <strong>{referredName}</strong> just joined
            Internship.sg using your referral link.
          </p>

          {/* Reward Box */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              borderRadius: "16px",
              padding: "24px",
              margin: "24px 0",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "#166534",
                margin: "0 0 8px 0",
                fontSize: "14px",
              }}
            >
              You earned
            </p>
            <p
              style={{
                color: "#166534",
                margin: 0,
                fontSize: "36px",
                fontWeight: "bold",
              }}
            >
              +{rewardPoints} XP
            </p>
          </div>

          {/* Total Referrals */}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "12px",
              padding: "20px",
              margin: "24px 0",
              textAlign: "center",
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
              Total Referrals
            </p>
            <p
              style={{
                color: "#1e293b",
                margin: 0,
                fontSize: "32px",
                fontWeight: "bold",
              }}
            >
              {totalReferrals}
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
            Keep sharing your link to earn more rewards!
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
              Share More
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
            You're receiving this because someone used your referral link
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
export const getSubject = (referredName: string, rewardPoints: number) =>
  `${referredName} joined using your referral - You earned ${rewardPoints} XP!`;
