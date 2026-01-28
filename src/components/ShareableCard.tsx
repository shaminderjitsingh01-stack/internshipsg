"use client";

import { useRef, useState } from "react";

type CardType = "streak" | "badge" | "rank" | "profile" | "score";

interface ShareableCardProps {
  type: CardType;
  userName: string;
  userImage?: string | null;
  // Streak data
  streak?: number;
  longestStreak?: number;
  // Badge data
  badgeName?: string;
  badgeIcon?: string;
  badgeDescription?: string;
  // Rank data
  rank?: number;
  percentile?: number;
  totalUsers?: number;
  // Profile data
  school?: string;
  tier?: string;
  level?: number;
  xp?: number;
  // Score data
  score?: number;
  totalInterviews?: number;
  // Callbacks
  onClose?: () => void;
}

const TIER_COLORS: Record<string, { gradient: string; text: string }> = {
  bronze: { gradient: "from-amber-500 to-amber-700", text: "text-amber-100" },
  silver: { gradient: "from-slate-400 to-slate-600", text: "text-slate-100" },
  gold: { gradient: "from-yellow-400 to-yellow-600", text: "text-yellow-100" },
  verified: { gradient: "from-blue-500 to-blue-700", text: "text-blue-100" },
  elite: { gradient: "from-purple-500 to-purple-700", text: "text-purple-100" },
};

export default function ShareableCard({
  type,
  userName,
  userImage,
  streak = 0,
  longestStreak = 0,
  badgeName,
  badgeIcon,
  badgeDescription,
  rank,
  percentile,
  totalUsers,
  school,
  tier = "bronze",
  level = 1,
  xp = 0,
  score,
  totalInterviews = 0,
  onClose,
}: ShareableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const tierColors = TIER_COLORS[tier] || TIER_COLORS.bronze;

  // Generate share text based on type
  const getShareText = () => {
    const baseUrl = "https://internship.sg";
    switch (type) {
      case "streak":
        return `I've been practicing interviews for ${streak} days straight on internship.sg! Consistency beats talent when talent doesn't show up. Start your streak: ${baseUrl}`;
      case "badge":
        return `${badgeIcon} I just earned the "${badgeName}" badge on internship.sg! ${badgeDescription} Join me: ${baseUrl}`;
      case "rank":
        return `I'm ranked #${rank} (Top ${percentile}%) on internship.sg! Competing with ${totalUsers?.toLocaleString()} students. Challenge me: ${baseUrl}`;
      case "profile":
        return `Level ${level} ${tier.charAt(0).toUpperCase() + tier.slice(1)} member on internship.sg with ${xp.toLocaleString()} XP! Preparing for internships with AI mock interviews. ${baseUrl}`;
      case "score":
        return `My average interview score is ${score}/10 on internship.sg! Completed ${totalInterviews} AI mock interviews. Practice with me: ${baseUrl}`;
      default:
        return `Check out my profile on internship.sg! ${baseUrl}`;
    }
  };

  // Copy share text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Download card as image using canvas
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);

    try {
      // Use html2canvas for client-side rendering
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `internship-sg-${type}-${userName.replace(/\s+/g, "-").toLowerCase()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    } catch (err) {
      console.error("Failed to download image:", err);
      // Fallback: open OG image in new tab
      const ogUrl = `/api/og?type=${type}&name=${encodeURIComponent(userName)}&value=${type === "streak" ? streak : type === "rank" ? rank : score}`;
      window.open(ogUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  // Share to social platforms
  const shareToLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://internship.sg")}`,
      "_blank",
      "width=600,height=600"
    );
  };

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(getShareText())}`, "_blank");
  };

  const shareToTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent("https://internship.sg")}&text=${encodeURIComponent(getShareText())}`,
      "_blank"
    );
  };

  // Render card content based on type
  const renderCardContent = () => {
    switch (type) {
      case "streak":
        return (
          <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 text-white text-center">
            <div className="text-6xl mb-4">&#x1F525;</div>
            <h2 className="text-4xl font-bold mb-2">{streak}-DAY STREAK</h2>
            <p className="text-lg opacity-90 mb-4">
              {streak >= 30
                ? '"Discipline is my superpower."'
                : streak >= 14
                  ? '"Two weeks of investing in my future."'
                  : streak >= 7
                    ? '"A full week of showing up."'
                    : streak >= 3
                      ? '"Building habits that matter."'
                      : '"Just getting started."'}
            </p>
            {userName && <p className="text-sm opacity-70">- {userName}</p>}
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-xs opacity-70">AI Interview Prep</p>
              <p className="font-semibold">internship.sg</p>
            </div>
          </div>
        );

      case "badge":
        return (
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 text-white text-center">
            <div className="text-6xl mb-4">{badgeIcon || "&#x1F3C6;"}</div>
            <h2 className="text-2xl font-bold mb-2">Badge Unlocked!</h2>
            <p className="text-3xl font-bold mb-2">{badgeName}</p>
            <p className="text-sm opacity-80 mb-4">{badgeDescription}</p>
            {userName && <p className="text-sm opacity-70">Earned by {userName}</p>}
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-xs opacity-70">AI Interview Prep</p>
              <p className="font-semibold">internship.sg</p>
            </div>
          </div>
        );

      case "rank":
        return (
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white text-center">
            <div className="text-5xl mb-2">&#x1F947;</div>
            <p className="text-sm opacity-70 mb-1">I&apos;m in the</p>
            <h2 className="text-5xl font-bold mb-2">Top {percentile}%</h2>
            <p className="text-xl font-semibold opacity-90 mb-1">Rank #{rank?.toLocaleString()}</p>
            <p className="text-sm opacity-70">of {totalUsers?.toLocaleString()} students</p>
            {userName && <p className="mt-4 text-sm opacity-80">{userName}</p>}
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-xs opacity-70">AI Interview Prep</p>
              <p className="font-semibold">internship.sg</p>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className={`bg-gradient-to-br ${tierColors.gradient} p-8 text-white text-center`}>
            {userImage ? (
              <img
                src={userImage}
                alt={userName}
                className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-white/20 flex items-center justify-center border-4 border-white/30">
                <span className="text-3xl font-bold">{userName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <h2 className="text-2xl font-bold mb-1">{userName}</h2>
            {school && <p className="text-sm opacity-80 mb-3">{school}</p>}
            <div className="flex justify-center gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold">{level}</p>
                <p className="text-xs opacity-70">Level</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{xp.toLocaleString()}</p>
                <p className="text-xs opacity-70">XP</p>
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">{tier}</p>
                <p className="text-xs opacity-70">Tier</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs opacity-70">AI Interview Prep</p>
              <p className="font-semibold">internship.sg</p>
            </div>
          </div>
        );

      case "score":
        return (
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-8 text-white text-center">
            <div className="text-5xl mb-2">&#x1F4CA;</div>
            <p className="text-sm opacity-70 mb-1">Average Interview Score</p>
            <h2 className="text-6xl font-bold mb-2">{score}/10</h2>
            <p className="text-sm opacity-80">
              Across {totalInterviews} mock interview{totalInterviews !== 1 ? "s" : ""}
            </p>
            {userName && <p className="mt-4 text-sm opacity-80">{userName}</p>}
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-xs opacity-70">AI Interview Prep</p>
              <p className="font-semibold">internship.sg</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Card Preview */}
        <div ref={cardRef}>{renderCardContent()}</div>

        {/* Share Options */}
        <div className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 text-center">Share your achievement</h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* LinkedIn */}
            <button
              onClick={shareToLinkedIn}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0077B5] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </button>

            {/* Twitter/X */}
            <button
              onClick={shareToTwitter}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter/X
            </button>

            {/* WhatsApp */}
            <button
              onClick={shareToWhatsApp}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </button>

            {/* Telegram */}
            <button
              onClick={shareToTelegram}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Telegram
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCopyText}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Text
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </>
              )}
            </button>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-full mt-4 py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
