// Comprehensive badge system for Internship.sg

export type BadgeCategory = 'streak' | 'interview' | 'score' | 'profile' | 'special';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  requirement: number;
  requirementType: string;
  xpReward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface UserBadgeProgress {
  badgeId: string;
  currentProgress: number;
  requirement: number;
  isEarned: boolean;
  earnedAt?: string;
  progressPercent: number;
}

// All available badges in the system
export const ALL_BADGES: Badge[] = [
  // STREAK BADGES
  {
    id: 'streak_3',
    name: 'Committed',
    description: '3-day streak achieved',
    icon: '🔥',
    category: 'streak',
    requirement: 3,
    requirementType: 'streak_days',
    xpReward: 25,
    rarity: 'common',
  },
  {
    id: 'streak_7',
    name: 'Consistent',
    description: '7-day streak achieved',
    icon: '✨',
    category: 'streak',
    requirement: 7,
    requirementType: 'streak_days',
    xpReward: 50,
    rarity: 'common',
  },
  {
    id: 'streak_14',
    name: 'Dedicated',
    description: '14-day streak achieved',
    icon: '⭐',
    category: 'streak',
    requirement: 14,
    requirementType: 'streak_days',
    xpReward: 100,
    rarity: 'uncommon',
  },
  {
    id: 'streak_30',
    name: 'Unstoppable',
    description: '30-day streak achieved',
    icon: '💎',
    category: 'streak',
    requirement: 30,
    requirementType: 'streak_days',
    xpReward: 200,
    rarity: 'rare',
  },
  {
    id: 'streak_60',
    name: 'Interview Ready',
    description: '60-day streak achieved',
    icon: '🏆',
    category: 'streak',
    requirement: 60,
    requirementType: 'streak_days',
    xpReward: 400,
    rarity: 'epic',
  },
  {
    id: 'streak_100',
    name: 'Legend',
    description: '100-day streak achieved',
    icon: '👑',
    category: 'streak',
    requirement: 100,
    requirementType: 'streak_days',
    xpReward: 750,
    rarity: 'legendary',
  },

  // INTERVIEW BADGES
  {
    id: 'interview_first',
    name: 'First Steps',
    description: 'Completed your first interview',
    icon: '🌱',
    category: 'interview',
    requirement: 1,
    requirementType: 'total_interviews',
    xpReward: 10,
    rarity: 'common',
  },
  {
    id: 'interview_10',
    name: 'Getting Warmed Up',
    description: 'Completed 10 interviews',
    icon: '🎯',
    category: 'interview',
    requirement: 10,
    requirementType: 'total_interviews',
    xpReward: 75,
    rarity: 'common',
  },
  {
    id: 'interview_25',
    name: 'Interview Pro',
    description: 'Completed 25 interviews',
    icon: '🎓',
    category: 'interview',
    requirement: 25,
    requirementType: 'total_interviews',
    xpReward: 150,
    rarity: 'uncommon',
  },
  {
    id: 'interview_50',
    name: 'Interview Master',
    description: 'Completed 50 interviews',
    icon: '🏅',
    category: 'interview',
    requirement: 50,
    requirementType: 'total_interviews',
    xpReward: 300,
    rarity: 'rare',
  },
  {
    id: 'interview_100',
    name: 'Interview Legend',
    description: 'Completed 100 interviews',
    icon: '🌟',
    category: 'interview',
    requirement: 100,
    requirementType: 'total_interviews',
    xpReward: 500,
    rarity: 'epic',
  },

  // SCORE BADGES
  {
    id: 'score_perfect',
    name: 'Perfect 10',
    description: 'Scored a perfect 10 on an interview',
    icon: '💯',
    category: 'score',
    requirement: 1,
    requirementType: 'perfect_scores',
    xpReward: 100,
    rarity: 'rare',
  },
  {
    id: 'score_consistent',
    name: 'Consistent Scorer',
    description: 'Scored 8+ on 5 interviews',
    icon: '📈',
    category: 'score',
    requirement: 5,
    requirementType: 'high_scores',
    xpReward: 150,
    rarity: 'uncommon',
  },
  {
    id: 'score_rising_star',
    name: 'Rising Star',
    description: 'Improved your score 3 times in a row',
    icon: '🚀',
    category: 'score',
    requirement: 3,
    requirementType: 'consecutive_improvements',
    xpReward: 100,
    rarity: 'uncommon',
  },
  {
    id: 'score_perfectionist',
    name: 'Perfectionist',
    description: 'Scored perfect 10 on 5 interviews',
    icon: '💎',
    category: 'score',
    requirement: 5,
    requirementType: 'perfect_scores',
    xpReward: 500,
    rarity: 'legendary',
  },

  // PROFILE BADGES
  {
    id: 'profile_complete',
    name: 'Complete Profile',
    description: 'Filled out all profile fields',
    icon: '✅',
    category: 'profile',
    requirement: 1,
    requirementType: 'profile_complete',
    xpReward: 50,
    rarity: 'common',
  },
  {
    id: 'profile_early_adopter',
    name: 'Early Adopter',
    description: 'Joined during the beta period',
    icon: '🌅',
    category: 'profile',
    requirement: 1,
    requirementType: 'early_adopter',
    xpReward: 100,
    rarity: 'rare',
  },
  {
    id: 'profile_referral',
    name: 'Referral Champion',
    description: 'Referred 5 friends who signed up',
    icon: '🤝',
    category: 'profile',
    requirement: 5,
    requirementType: 'referrals',
    xpReward: 250,
    rarity: 'rare',
  },
  {
    id: 'profile_super_referrer',
    name: 'Super Referrer',
    description: 'Referred 25 friends who signed up',
    icon: '🎪',
    category: 'profile',
    requirement: 25,
    requirementType: 'referrals',
    xpReward: 1000,
    rarity: 'legendary',
  },

  // SPECIAL BADGES
  {
    id: 'special_night_owl',
    name: 'Night Owl',
    description: 'Practice after 10pm',
    icon: '🦉',
    category: 'special',
    requirement: 1,
    requirementType: 'night_practice',
    xpReward: 25,
    rarity: 'uncommon',
  },
  {
    id: 'special_early_bird',
    name: 'Early Bird',
    description: 'Practice before 8am',
    icon: '🐦',
    category: 'special',
    requirement: 1,
    requirementType: 'early_practice',
    xpReward: 25,
    rarity: 'uncommon',
  },
  {
    id: 'special_weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Practice on both Saturday and Sunday',
    icon: '⚔️',
    category: 'special',
    requirement: 1,
    requirementType: 'weekend_practice',
    xpReward: 50,
    rarity: 'uncommon',
  },
  {
    id: 'special_speed_demon',
    name: 'Speed Demon',
    description: 'Complete 5 interviews in one day',
    icon: '⚡',
    category: 'special',
    requirement: 5,
    requirementType: 'daily_interviews',
    xpReward: 100,
    rarity: 'rare',
  },
  {
    id: 'special_marathon',
    name: 'Marathon Runner',
    description: 'Complete 3 interviews in a single session',
    icon: '🏃',
    category: 'special',
    requirement: 3,
    requirementType: 'session_interviews',
    xpReward: 75,
    rarity: 'uncommon',
  },
  {
    id: 'special_comeback',
    name: 'Comeback Kid',
    description: 'Return after 7+ days away and practice',
    icon: '🔙',
    category: 'special',
    requirement: 1,
    requirementType: 'comeback',
    xpReward: 50,
    rarity: 'uncommon',
  },
];

// Helper functions
export function getBadgeById(id: string): Badge | undefined {
  return ALL_BADGES.find(badge => badge.id === id);
}

export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return ALL_BADGES.filter(badge => badge.category === category);
}

export function getBadgesByRarity(rarity: Badge['rarity']): Badge[] {
  return ALL_BADGES.filter(badge => badge.rarity === rarity);
}

export function getStreakBadges(): Badge[] {
  return getBadgesByCategory('streak');
}

export function getInterviewBadges(): Badge[] {
  return getBadgesByCategory('interview');
}

export function getScoreBadges(): Badge[] {
  return getBadgesByCategory('score');
}

export function getProfileBadges(): Badge[] {
  return getBadgesByCategory('profile');
}

export function getSpecialBadges(): Badge[] {
  return getBadgesByCategory('special');
}

// Get the next badge to earn in a category
export function getNextBadgeInCategory(category: BadgeCategory, currentProgress: number): Badge | null {
  const badges = getBadgesByCategory(category).sort((a, b) => a.requirement - b.requirement);
  return badges.find(badge => badge.requirement > currentProgress) || null;
}

// Calculate badge progress
export function calculateBadgeProgress(badge: Badge, currentValue: number): UserBadgeProgress {
  const isEarned = currentValue >= badge.requirement;
  const progressPercent = Math.min((currentValue / badge.requirement) * 100, 100);

  return {
    badgeId: badge.id,
    currentProgress: currentValue,
    requirement: badge.requirement,
    isEarned,
    progressPercent,
  };
}

// Get rarity color class
export function getRarityColor(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'text-slate-500 bg-slate-100 border-slate-300';
    case 'uncommon':
      return 'text-green-600 bg-green-100 border-green-300';
    case 'rare':
      return 'text-blue-600 bg-blue-100 border-blue-300';
    case 'epic':
      return 'text-purple-600 bg-purple-100 border-purple-300';
    case 'legendary':
      return 'text-amber-600 bg-amber-100 border-amber-300';
    default:
      return 'text-slate-500 bg-slate-100 border-slate-300';
  }
}

// Get rarity color for dark theme
export function getRarityColorDark(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'text-slate-400 bg-slate-800 border-slate-600';
    case 'uncommon':
      return 'text-green-400 bg-green-900/50 border-green-700';
    case 'rare':
      return 'text-blue-400 bg-blue-900/50 border-blue-700';
    case 'epic':
      return 'text-purple-400 bg-purple-900/50 border-purple-700';
    case 'legendary':
      return 'text-amber-400 bg-amber-900/50 border-amber-700';
    default:
      return 'text-slate-400 bg-slate-800 border-slate-600';
  }
}

// Category display info
export const CATEGORY_INFO: Record<BadgeCategory, { name: string; icon: string; description: string }> = {
  streak: {
    name: 'Streak Badges',
    icon: '🔥',
    description: 'Earn badges by maintaining your daily practice streak',
  },
  interview: {
    name: 'Interview Badges',
    icon: '🎯',
    description: 'Earn badges by completing more interviews',
  },
  score: {
    name: 'Score Badges',
    icon: '📊',
    description: 'Earn badges by achieving high scores',
  },
  profile: {
    name: 'Profile Badges',
    icon: '👤',
    description: 'Earn badges by completing your profile and growing the community',
  },
  special: {
    name: 'Special Badges',
    icon: '🌟',
    description: 'Earn unique badges for special achievements',
  },
};

// Rarity display info
export const RARITY_INFO = {
  common: { name: 'Common', color: '#64748b' },
  uncommon: { name: 'Uncommon', color: '#22c55e' },
  rare: { name: 'Rare', color: '#3b82f6' },
  epic: { name: 'Epic', color: '#a855f7' },
  legendary: { name: 'Legendary', color: '#f59e0b' },
};
