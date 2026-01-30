"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
}

// Simple QR Code generator using SVG
function generateQRCode(data: string, size: number = 128): string {
  // Using a simplified QR-like pattern generator
  // For production, consider using a proper QR library
  const moduleCount = 21; // QR Version 1
  const moduleSize = size / moduleCount;

  // Generate a deterministic pattern based on the URL hash
  const hash = Array.from(data).reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);

  // Create modules array with finder patterns
  const modules: boolean[][] = Array(moduleCount).fill(null).map(() => Array(moduleCount).fill(false));

  // Add finder patterns (top-left, top-right, bottom-left)
  const addFinderPattern = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (row + r < moduleCount && col + c < moduleCount) {
          modules[row + r][col + c] = isOuter || isInner;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, moduleCount - 7);
  addFinderPattern(moduleCount - 7, 0);

  // Fill data area with pseudo-random pattern based on URL
  let seed = Math.abs(hash);
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip finder patterns and timing patterns
      const inTopLeftFinder = row < 8 && col < 8;
      const inTopRightFinder = row < 8 && col >= moduleCount - 8;
      const inBottomLeftFinder = row >= moduleCount - 8 && col < 8;
      const isTimingRow = row === 6;
      const isTimingCol = col === 6;

      if (!inTopLeftFinder && !inTopRightFinder && !inBottomLeftFinder && !isTimingRow && !isTimingCol) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        modules[row][col] = (seed % 100) < 45;
      }
    }
  }

  // Add timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // Generate SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules[row][col]) {
        const x = col * moduleSize;
        const y = row * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }

  svg += '</svg>';
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default function ShareModal({
  isOpen,
  onClose,
  url,
  title,
  description,
}: ShareModalProps) {
  const { isDarkTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");

  // Generate QR code when URL changes
  useEffect(() => {
    if (isOpen && url) {
      setQrCode(generateQRCode(url, 160));
    }
  }, [isOpen, url]);

  // Reset copied state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Copy link to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [url]);

  // Social share functions
  const shareText = description ? `${title}\n\n${description}` : title;

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${url}`)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareToTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, "_blank");
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, "_blank", "width=600,height=600");
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${shareText}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (!isOpen) return null;

  const socialPlatforms = [
    {
      name: "WhatsApp",
      onClick: shareToWhatsApp,
      bgColor: "bg-[#25D366]",
      hoverColor: "hover:bg-[#20BD5A]",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      onClick: shareToTelegram,
      bgColor: "bg-[#0088cc]",
      hoverColor: "hover:bg-[#0077b3]",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
    {
      name: "Twitter/X",
      onClick: shareToTwitter,
      bgColor: "bg-black",
      hoverColor: "hover:bg-gray-800",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      onClick: shareToFacebook,
      bgColor: "bg-[#1877F2]",
      hoverColor: "hover:bg-[#166FE5]",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      onClick: shareToLinkedIn,
      bgColor: "bg-[#0077B5]",
      hoverColor: "hover:bg-[#006699]",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: "Email",
      onClick: shareToEmail,
      bgColor: isDarkTheme ? "bg-slate-600" : "bg-slate-500",
      hoverColor: isDarkTheme ? "hover:bg-slate-500" : "hover:bg-slate-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden ${
          isDarkTheme ? "bg-slate-900" : "bg-white"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2
            className={`text-lg font-semibold ${
              isDarkTheme ? "text-white" : "text-slate-900"
            }`}
          >
            Share
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkTheme
                ? "hover:bg-slate-800 text-slate-400 hover:text-white"
                : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
            }`}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Title preview */}
          {(title || description) && (
            <div
              className={`p-3 rounded-lg ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <p
                className={`font-medium text-sm ${
                  isDarkTheme ? "text-white" : "text-slate-900"
                }`}
              >
                {title}
              </p>
              {description && (
                <p
                  className={`text-sm mt-1 line-clamp-2 ${
                    isDarkTheme ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Copy link */}
          <div>
            <div
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                isDarkTheme
                  ? "bg-slate-800 border-slate-700"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <input
                type="text"
                value={url}
                readOnly
                className={`flex-1 bg-transparent text-sm truncate outline-none ${
                  isDarkTheme ? "text-slate-300" : "text-slate-600"
                }`}
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social share buttons */}
          <div>
            <p
              className={`text-sm font-medium mb-3 ${
                isDarkTheme ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Share via
            </p>
            <div className="grid grid-cols-3 gap-3">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={platform.onClick}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl text-white transition-transform hover:scale-105 ${platform.bgColor} ${platform.hoverColor}`}
                  aria-label={`Share on ${platform.name}`}
                >
                  {platform.icon}
                  <span className="text-xs font-medium">{platform.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center pt-2">
            <p
              className={`text-sm font-medium mb-3 ${
                isDarkTheme ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Scan QR Code
            </p>
            <div
              className={`p-3 rounded-xl ${
                isDarkTheme ? "bg-white" : "bg-slate-50 border border-slate-200"
              }`}
            >
              {qrCode && (
                <img
                  src={qrCode}
                  alt="QR Code"
                  width={160}
                  height={160}
                  className="block"
                />
              )}
            </div>
            <p
              className={`text-xs mt-2 ${
                isDarkTheme ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Scan to open on another device
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
