"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Configuration
export const SHARING_CONFIG = {
  STARTING_ROUNDS: 3,
  ROUNDS_PER_SHARE: 5,
  MAX_UNLOCKABLE_ROUNDS: 20,
  CONTEST_END_DATE: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // End of current month
};

export interface SharerData {
  rank: number;
  username: string;
  shares: number;
  isCurrentUser?: boolean;
}

export interface SharingState {
  userId: string;
  username: string;
  remainingRounds: number;
  sharesDone: number;
  totalRoundsUnlocked: number;
  maxUnlockableRounds: number;
  referralLink: string;
  referralCode: string;
  contestRank: number;
  daysLeftInContest: number;
  leaderboard: SharerData[];
  badges: string[];
  shareStreak: number;
}

interface SharingContextType {
  state: SharingState;
  recordShare: (platform: string) => void;
  useInterviewRound: () => boolean;
  getShareMessage: () => string;
  getContestMessage: () => string;
}

const SharingContext = createContext<SharingContextType | null>(null);

// Generate unique referral code
function generateReferralCode(userId: string): string {
  return `ISG-${userId.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// Calculate days left in contest
function getDaysLeftInContest(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diffTime = endOfMonth.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Mock leaderboard data (in production, this comes from API)
function getMockLeaderboard(currentUsername: string, currentShares: number): SharerData[] {
  const mockUsers = [
    { username: "sarah_tan", shares: 15 },
    { username: "wei_ming", shares: 12 },
    { username: "priya_kumar", shares: 10 },
    { username: "john_lim", shares: 8 },
    { username: "mei_ling", shares: 6 },
  ];

  // Add current user if not in top 5
  const allUsers = [...mockUsers];
  const currentUserIndex = allUsers.findIndex(u => u.username === currentUsername);

  if (currentUserIndex === -1) {
    allUsers.push({ username: currentUsername, shares: currentShares });
  } else {
    allUsers[currentUserIndex].shares = currentShares;
  }

  // Sort by shares (descending), then by username for tie-breaker
  allUsers.sort((a, b) => b.shares - a.shares || a.username.localeCompare(b.username));

  return allUsers.slice(0, 5).map((user, index) => ({
    rank: index + 1,
    username: user.username,
    shares: user.shares,
    isCurrentUser: user.username === currentUsername,
  }));
}

export function SharingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SharingState>(() => {
    // Generate a mock user ID for demo
    const mockUserId = "user_" + Math.random().toString(36).slice(2, 10);
    const mockUsername = "you";
    const referralCode = generateReferralCode(mockUserId);

    return {
      userId: mockUserId,
      username: mockUsername,
      remainingRounds: SHARING_CONFIG.STARTING_ROUNDS,
      sharesDone: 0,
      totalRoundsUnlocked: 0,
      maxUnlockableRounds: SHARING_CONFIG.MAX_UNLOCKABLE_ROUNDS,
      referralLink: `https://internship.sg/ref/${referralCode}`,
      referralCode,
      contestRank: 0,
      daysLeftInContest: getDaysLeftInContest(),
      leaderboard: getMockLeaderboard(mockUsername, 0),
      badges: [],
      shareStreak: 0,
    };
  });

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("internship_sharing");
    if (saved) {
      const parsed = JSON.parse(saved);
      setState(prev => ({
        ...prev,
        ...parsed,
        daysLeftInContest: getDaysLeftInContest(),
        leaderboard: getMockLeaderboard(parsed.username || prev.username, parsed.sharesDone || 0),
      }));
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem("internship_sharing", JSON.stringify({
      remainingRounds: state.remainingRounds,
      sharesDone: state.sharesDone,
      totalRoundsUnlocked: state.totalRoundsUnlocked,
      badges: state.badges,
      shareStreak: state.shareStreak,
      referralCode: state.referralCode,
    }));
  }, [state]);

  // Record a share and unlock rounds
  const recordShare = (platform: string) => {
    setState(prev => {
      const canUnlockMore = prev.totalRoundsUnlocked < prev.maxUnlockableRounds;
      const roundsToUnlock = canUnlockMore
        ? Math.min(SHARING_CONFIG.ROUNDS_PER_SHARE, prev.maxUnlockableRounds - prev.totalRoundsUnlocked)
        : 0;

      const newSharesDone = prev.sharesDone + 1;
      const newTotalUnlocked = prev.totalRoundsUnlocked + roundsToUnlock;
      const newRemainingRounds = prev.remainingRounds + roundsToUnlock;

      // Check for badge milestones
      const newBadges = [...prev.badges];
      if (newSharesDone === 1 && !newBadges.includes("first_share")) {
        newBadges.push("first_share");
      }
      if (newSharesDone === 5 && !newBadges.includes("super_sharer")) {
        newBadges.push("super_sharer");
      }
      if (newSharesDone === 10 && !newBadges.includes("viral_champion")) {
        newBadges.push("viral_champion");
      }

      // Update leaderboard
      const newLeaderboard = getMockLeaderboard(prev.username, newSharesDone);
      const userRank = newLeaderboard.find(u => u.isCurrentUser)?.rank || 0;

      return {
        ...prev,
        sharesDone: newSharesDone,
        totalRoundsUnlocked: newTotalUnlocked,
        remainingRounds: newRemainingRounds,
        badges: newBadges,
        shareStreak: prev.shareStreak + 1,
        leaderboard: newLeaderboard,
        contestRank: userRank,
      };
    });

    // Track share event (in production, send to analytics)
    console.log(`Share recorded on ${platform}`);
  };

  // Use an interview round
  const useInterviewRound = (): boolean => {
    if (state.remainingRounds <= 0) return false;

    setState(prev => ({
      ...prev,
      remainingRounds: prev.remainingRounds - 1,
    }));
    return true;
  };

  // Get share message
  const getShareMessage = (): string => {
    const canUnlockMore = state.totalRoundsUnlocked < state.maxUnlockableRounds;

    if (!canUnlockMore) {
      return "You've unlocked all extra rounds! Upgrade to Pro for unlimited practice.";
    }

    return `🎉 You unlocked ${SHARING_CONFIG.ROUNDS_PER_SHARE} extra interview rounds! You now have ${state.remainingRounds} rounds remaining.`;
  };

  // Get contest message
  const getContestMessage = (): string => {
    if (state.contestRank === 1) {
      return `🏆 You're #1 on the Top Sharer leaderboard! Win $100 if you stay on top by the end of the month!`;
    }
    if (state.contestRank > 0 && state.contestRank <= 5) {
      return `💰 You're ranked #${state.contestRank} on the Top Sharer leaderboard! Only ${state.daysLeftInContest} days left — share more to reach the top!`;
    }
    return `📢 Share more to enter the Top 5 and compete for the $100 prize! ${state.daysLeftInContest} days left.`;
  };

  return (
    <SharingContext.Provider value={{ state, recordShare, useInterviewRound, getShareMessage, getContestMessage }}>
      {children}
    </SharingContext.Provider>
  );
}

export function useSharing() {
  const context = useContext(SharingContext);
  if (!context) {
    throw new Error("useSharing must be used within a SharingProvider");
  }
  return context;
}

// JSON structure for API responses
export interface SharingAPIResponse {
  remaining_rounds: number;
  shares_done: number;
  total_rounds_unlocked: number;
  max_unlockable_rounds: number;
  referral_link: string;
  referral_code: string;
  messages: {
    share_success: string;
    max_reached: string;
    contest_status: string;
  };
  leaderboard: {
    top_sharers: SharerData[];
    current_user_rank: number;
  };
  contest: {
    days_remaining: number;
    prize: string;
    rules: string[];
    status: "active" | "ended";
  };
  badges: {
    earned: string[];
    available: { id: string; name: string; requirement: string }[];
  };
}

// Generate API response structure
export function generateSharingAPIResponse(state: SharingState): SharingAPIResponse {
  return {
    remaining_rounds: state.remainingRounds,
    shares_done: state.sharesDone,
    total_rounds_unlocked: state.totalRoundsUnlocked,
    max_unlockable_rounds: state.maxUnlockableRounds,
    referral_link: state.referralLink,
    referral_code: state.referralCode,
    messages: {
      share_success: `🎉 You unlocked ${SHARING_CONFIG.ROUNDS_PER_SHARE} extra interview rounds! You now have ${state.remainingRounds} rounds remaining.`,
      max_reached: "You've unlocked all extra rounds! Upgrade to Pro for unlimited practice.",
      contest_status: state.contestRank <= 5
        ? `💰 You're ranked #${state.contestRank}! ${state.daysLeftInContest} days left to win $100!`
        : `📢 Share to enter Top 5! ${state.daysLeftInContest} days left.`,
    },
    leaderboard: {
      top_sharers: state.leaderboard,
      current_user_rank: state.contestRank,
    },
    contest: {
      days_remaining: state.daysLeftInContest,
      prize: "$100 SGD",
      rules: [
        "Contest runs monthly, resetting on the 1st of each month",
        "Each unique share counts as one entry",
        "Top sharer at month end wins $100 SGD",
        "Tie-breaker: whoever reached the share count first wins",
        "Winners announced within 3 days of month end",
      ],
      status: state.daysLeftInContest > 0 ? "active" : "ended",
    },
    badges: {
      earned: state.badges,
      available: [
        { id: "first_share", name: "First Share", requirement: "Share once" },
        { id: "super_sharer", name: "Super Sharer", requirement: "Share 5 times" },
        { id: "viral_champion", name: "Viral Champion", requirement: "Share 10 times" },
      ],
    },
  };
}
