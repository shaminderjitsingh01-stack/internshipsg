import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Tier colors for profiles
const TIER_COLORS: Record<string, { from: string; to: string }> = {
  bronze: { from: "#F59E0B", to: "#B45309" },
  silver: { from: "#94A3B8", to: "#475569" },
  gold: { from: "#FACC15", to: "#CA8A04" },
  verified: { from: "#3B82F6", to: "#1D4ED8" },
  elite: { from: "#A855F7", to: "#7C3AED" },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const type = searchParams.get("type") || "profile";
  const username = searchParams.get("username") || searchParams.get("name") || "User";
  const value = searchParams.get("value") || "0";
  const tier = searchParams.get("tier") || "bronze";
  const school = searchParams.get("school") || "";
  const level = searchParams.get("level") || "1";
  const xp = searchParams.get("xp") || "0";
  const percentile = searchParams.get("percentile") || "50";
  const totalUsers = searchParams.get("total") || "1000";

  const tierColor = TIER_COLORS[tier] || TIER_COLORS.bronze;

  // Common styles
  const containerStyle = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    padding: "40px",
  };

  const footerStyle = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    marginTop: "auto",
    paddingTop: "20px",
    borderTop: "2px solid rgba(255,255,255,0.2)",
    width: "100%",
  };

  try {
    // Generate different cards based on type
    switch (type) {
      case "streak":
        return new ImageResponse(
          (
            <div
              style={{
                ...containerStyle,
                background: "linear-gradient(135deg, #F97316 0%, #DC2626 100%)",
                color: "white",
              }}
            >
              <div style={{ fontSize: 80, marginBottom: 20 }}>&#x1F525;</div>
              <div style={{ fontSize: 72, fontWeight: "bold", marginBottom: 10 }}>
                {value}-DAY STREAK
              </div>
              <div style={{ fontSize: 28, opacity: 0.9, marginBottom: 20, fontStyle: "italic" }}>
                {parseInt(value) >= 30
                  ? '"Discipline is my superpower."'
                  : parseInt(value) >= 14
                    ? '"Two weeks of investing in my future."'
                    : parseInt(value) >= 7
                      ? '"A full week of showing up."'
                      : '"Building habits that matter."'}
              </div>
              <div style={{ fontSize: 24, opacity: 0.7 }}>- {username}</div>
              <div style={footerStyle}>
                <div style={{ fontSize: 16, opacity: 0.7 }}>AI Interview Prep</div>
                <div style={{ fontSize: 24, fontWeight: "bold" }}>internship.sg</div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );

      case "badge":
        const badgeName = searchParams.get("badge") || "Achievement";
        const badgeIcon = searchParams.get("icon") || "&#x1F3C6;";
        return new ImageResponse(
          (
            <div
              style={{
                ...containerStyle,
                background: "linear-gradient(135deg, #9333EA 0%, #4F46E5 100%)",
                color: "white",
              }}
            >
              <div style={{ fontSize: 80, marginBottom: 20 }}>{badgeIcon}</div>
              <div style={{ fontSize: 36, opacity: 0.8, marginBottom: 10 }}>Badge Unlocked!</div>
              <div style={{ fontSize: 56, fontWeight: "bold", marginBottom: 20 }}>{badgeName}</div>
              <div style={{ fontSize: 24, opacity: 0.7 }}>Earned by {username}</div>
              <div style={footerStyle}>
                <div style={{ fontSize: 16, opacity: 0.7 }}>AI Interview Prep</div>
                <div style={{ fontSize: 24, fontWeight: "bold" }}>internship.sg</div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );

      case "rank":
        return new ImageResponse(
          (
            <div
              style={{
                ...containerStyle,
                background: "linear-gradient(135deg, #10B981 0%, #0D9488 100%)",
                color: "white",
              }}
            >
              <div style={{ fontSize: 70, marginBottom: 10 }}>&#x1F947;</div>
              <div style={{ fontSize: 24, opacity: 0.7 }}>I&apos;m in the</div>
              <div style={{ fontSize: 96, fontWeight: "bold", marginBottom: 10 }}>
                Top {percentile}%
              </div>
              <div style={{ fontSize: 36, fontWeight: "600", opacity: 0.9 }}>
                Rank #{parseInt(value).toLocaleString()}
              </div>
              <div style={{ fontSize: 20, opacity: 0.7 }}>
                of {parseInt(totalUsers).toLocaleString()} students
              </div>
              <div style={{ fontSize: 24, opacity: 0.8, marginTop: 20 }}>{username}</div>
              <div style={footerStyle}>
                <div style={{ fontSize: 16, opacity: 0.7 }}>AI Interview Prep</div>
                <div style={{ fontSize: 24, fontWeight: "bold" }}>internship.sg</div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );

      case "score":
        return new ImageResponse(
          (
            <div
              style={{
                ...containerStyle,
                background: "linear-gradient(135deg, #2563EB 0%, #0891B2 100%)",
                color: "white",
              }}
            >
              <div style={{ fontSize: 70, marginBottom: 10 }}>&#x1F4CA;</div>
              <div style={{ fontSize: 24, opacity: 0.7 }}>Average Interview Score</div>
              <div style={{ fontSize: 120, fontWeight: "bold", marginBottom: 10 }}>{value}/10</div>
              <div style={{ fontSize: 24, opacity: 0.8 }}>{username}</div>
              <div style={footerStyle}>
                <div style={{ fontSize: 16, opacity: 0.7 }}>AI Interview Prep</div>
                <div style={{ fontSize: 24, fontWeight: "bold" }}>internship.sg</div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );

      case "profile":
      default:
        return new ImageResponse(
          (
            <div
              style={{
                ...containerStyle,
                background: `linear-gradient(135deg, ${tierColor.from} 0%, ${tierColor.to} 100%)`,
                color: "white",
              }}
            >
              {/* Avatar Placeholder */}
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  border: "4px solid rgba(255,255,255,0.3)",
                }}
              >
                <span style={{ fontSize: 48, fontWeight: "bold" }}>
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>

              <div style={{ fontSize: 48, fontWeight: "bold", marginBottom: 8 }}>{username}</div>
              {school && (
                <div style={{ fontSize: 24, opacity: 0.8, marginBottom: 20 }}>{school}</div>
              )}

              {/* Stats */}
              <div
                style={{
                  display: "flex",
                  gap: 40,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 40, fontWeight: "bold" }}>{level}</div>
                  <div style={{ fontSize: 16, opacity: 0.7 }}>Level</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 40, fontWeight: "bold" }}>
                    {parseInt(xp).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 16, opacity: 0.7 }}>XP</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{ fontSize: 40, fontWeight: "bold", textTransform: "capitalize" }}
                  >
                    {tier}
                  </div>
                  <div style={{ fontSize: 16, opacity: 0.7 }}>Tier</div>
                </div>
              </div>

              <div style={footerStyle}>
                <div style={{ fontSize: 16, opacity: 0.7 }}>AI Interview Prep</div>
                <div style={{ fontSize: 24, fontWeight: "bold" }}>internship.sg</div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );
    }
  } catch (error) {
    console.error("OG image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
