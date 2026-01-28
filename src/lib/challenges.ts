import { supabase, isSupabaseConfigured } from "./supabase";
import { awardXP, XP_REWARDS } from "./xp";

// Challenge types
export type ChallengeType =
  | "interviews"
  | "average_score"
  | "streak"
  | "question_types"
  | "company_specific"
  | "questions"
  | "resume"
  | "cover_letter";

// Challenge difficulty
export type ChallengeDifficulty = "easy" | "medium" | "hard";

// Challenge reward types
export interface ChallengeReward {
  xp: number;
  badge?: string;
  streakFreeze?: boolean;
  title?: string;
}

// Challenge definition
export interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  difficulty: ChallengeDifficulty;
  reward: ChallengeReward;
  icon: string;
}

// User challenge progress
export interface UserChallenge {
  id: string;
  user_email: string;
  challenge_id: string;
  week_number: number;
  year: number;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Weekly leaderboard entry
export interface WeeklyLeaderboardEntry {
  rank: number;
  user_email: string;
  username: string;
  name: string;
  image_url: string | null;
  school: string | null;
  challenges_completed: number;
  total_points: number;
  is_current_user?: boolean;
}

// Past week result
export interface PastWeekResult {
  week_number: number;
  year: number;
  challenges_completed: number;
  total_challenges: number;
  total_xp_earned: number;
  rank: number | null;
}

// XP rewards for challenges
export const CHALLENGE_XP_REWARDS: Record<ChallengeDifficulty, number> = {
  easy: 25,
  medium: 50,
  hard: 100,
};

// Point values for leaderboard
export const CHALLENGE_POINTS: Record<ChallengeDifficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
};

// All available challenges (rotating pool)
export const ALL_CHALLENGES: ChallengeDefinition[] = [
  // Interview challenges
  {
    id: "complete-3-interviews",
    title: "Interview Champion",
    description: "Complete 3 mock interviews this week",
    type: "interviews",
    target: 3,
    difficulty: "easy",
    reward: { xp: 25, badge: "champion" },
    icon: "🎙️",
  },
  {
    id: "complete-5-interviews",
    title: "Interview Master",
    description: "Complete 5 mock interviews this week",
    type: "interviews",
    target: 5,
    difficulty: "medium",
    reward: { xp: 50, badge: "interview_master" },
    icon: "🎯",
  },
  {
    id: "complete-10-interviews",
    title: "Interview Legend",
    description: "Complete 10 mock interviews this week",
    type: "interviews",
    target: 10,
    difficulty: "hard",
    reward: { xp: 100, badge: "interview_legend", streakFreeze: true },
    icon: "🏆",
  },

  // Score challenges
  {
    id: "average-score-7",
    title: "Quality Performer",
    description: "Achieve an average score of 7+ this week",
    type: "average_score",
    target: 7,
    difficulty: "easy",
    reward: { xp: 25 },
    icon: "⭐",
  },
  {
    id: "average-score-8",
    title: "High Achiever",
    description: "Achieve an average score of 8+ this week",
    type: "average_score",
    target: 8,
    difficulty: "medium",
    reward: { xp: 50, badge: "high_achiever" },
    icon: "🌟",
  },
  {
    id: "average-score-9",
    title: "Excellence Seeker",
    description: "Achieve an average score of 9+ this week",
    type: "average_score",
    target: 9,
    difficulty: "hard",
    reward: { xp: 100, badge: "excellence", streakFreeze: true },
    icon: "💫",
  },

  // Streak challenges
  {
    id: "maintain-3-streak",
    title: "Consistency Starter",
    description: "Maintain a 3-day streak this week",
    type: "streak",
    target: 3,
    difficulty: "easy",
    reward: { xp: 25 },
    icon: "🔥",
  },
  {
    id: "maintain-5-streak",
    title: "Consistency King",
    description: "Maintain a 5-day streak this week",
    type: "streak",
    target: 5,
    difficulty: "medium",
    reward: { xp: 50, badge: "streak_king" },
    icon: "👑",
  },
  {
    id: "maintain-7-streak",
    title: "Perfect Week",
    description: "Maintain a 7-day streak this week",
    type: "streak",
    target: 7,
    difficulty: "hard",
    reward: { xp: 100, badge: "perfect_week", streakFreeze: true },
    icon: "💎",
  },

  // Question type challenges
  {
    id: "try-3-question-types",
    title: "Versatile Learner",
    description: "Practice 3 different question types",
    type: "question_types",
    target: 3,
    difficulty: "easy",
    reward: { xp: 25 },
    icon: "📚",
  },
  {
    id: "try-5-question-types",
    title: "Well-Rounded",
    description: "Practice 5 different question types",
    type: "question_types",
    target: 5,
    difficulty: "medium",
    reward: { xp: 50, badge: "well_rounded" },
    icon: "🎓",
  },

  // Company-specific challenges
  {
    id: "company-interview-1",
    title: "Company Focus",
    description: "Complete 1 company-specific interview",
    type: "company_specific",
    target: 1,
    difficulty: "easy",
    reward: { xp: 25 },
    icon: "🏢",
  },
  {
    id: "company-interview-3",
    title: "Company Expert",
    description: "Complete 3 company-specific interviews",
    type: "company_specific",
    target: 3,
    difficulty: "medium",
    reward: { xp: 50, badge: "company_expert" },
    icon: "💼",
  },

  // Daily questions challenges
  {
    id: "answer-5-questions",
    title: "Quick Learner",
    description: "Answer 5 daily questions",
    type: "questions",
    target: 5,
    difficulty: "easy",
    reward: { xp: 25 },
    icon: "💬",
  },
  {
    id: "answer-10-questions",
    title: "Quick Thinker",
    description: "Answer 10 daily questions",
    type: "questions",
    target: 10,
    difficulty: "medium",
    reward: { xp: 50, badge: "quick_thinker" },
    icon: "💡",
  },

  // Resume challenges
  {
    id: "resume-analyze",
    title: "Resume Revamp",
    description: "Analyze your resume and improve based on feedback",
    type: "resume",
    target: 1,
    difficulty: "easy",
    reward: { xp: 25, badge: "resume_pro" },
    icon: "📝",
  },

  // Cover letter challenges
  {
    id: "cover-letter-create",
    title: "Cover Letter Craftsman",
    description: "Create or analyze a cover letter",
    type: "cover_letter",
    target: 1,
    difficulty: "easy",
    reward: { xp: 25, badge: "letter_master" },
    icon: "✉️",
  },
];

// Challenge badges
export const CHALLENGE_BADGES: Record<string, { name: string; icon: string; description: string }> = {
  champion: { name: "Champion", icon: "🏅", description: "Completed Interview Champion challenge" },
  interview_master: { name: "Interview Master", icon: "🎯", description: "Completed 5 interviews in a week" },
  interview_legend: { name: "Interview Legend", icon: "🏆", description: "Completed 10 interviews in a week" },
  high_achiever: { name: "High Achiever", icon: "🌟", description: "Achieved 8+ average score" },
  excellence: { name: "Excellence", icon: "💫", description: "Achieved 9+ average score" },
  streak_king: { name: "Streak King", icon: "👑", description: "Maintained 5-day streak" },
  perfect_week: { name: "Perfect Week", icon: "💎", description: "Maintained 7-day streak" },
  well_rounded: { name: "Well-Rounded", icon: "🎓", description: "Practiced 5 question types" },
  company_expert: { name: "Company Expert", icon: "💼", description: "Completed 3 company interviews" },
  quick_thinker: { name: "Quick Thinker", icon: "💡", description: "Answered 10 daily questions" },
  resume_pro: { name: "Resume Pro", icon: "📝", description: "Analyzed and improved resume" },
  letter_master: { name: "Letter Master", icon: "✉️", description: "Created a cover letter" },
  weekly_winner: { name: "Weekly Winner", icon: "🥇", description: "Ranked #1 in weekly challenges" },
  top_3: { name: "Top 3", icon: "🏅", description: "Ranked top 3 in weekly challenges" },
  all_challenges: { name: "Completionist", icon: "✨", description: "Completed all weekly challenges" },
};

// Get current week number and year
export function getCurrentWeekInfo(): { weekNumber: number; year: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNumber = Math.floor(diff / oneWeek) + 1;
  return { weekNumber, year: now.getFullYear() };
}

// Get week start and end dates
export function getWeekDates(weekNumber: number, year: number): { start: Date; end: Date } {
  const start = new Date(year, 0, 1);
  const daysOffset = (weekNumber - 1) * 7 - start.getDay() + 1;
  start.setDate(start.getDate() + daysOffset);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// Get days remaining in current week
export function getDaysRemainingInWeek(): number {
  const now = new Date();
  const daysUntilSunday = 7 - now.getDay();
  return daysUntilSunday === 7 ? 0 : daysUntilSunday;
}

// Select challenges for a specific week (3 challenges of varying difficulty)
export function getChallengesForWeek(weekNumber: number, year: number): ChallengeDefinition[] {
  // Use week number and year to create a deterministic seed
  const seed = weekNumber + year * 52;

  // Shuffle challenges based on seed
  const shuffled = [...ALL_CHALLENGES].sort((a, b) => {
    const hashA = (seed * a.id.charCodeAt(0)) % 1000;
    const hashB = (seed * b.id.charCodeAt(0)) % 1000;
    return hashA - hashB;
  });

  // Select 1 easy, 1 medium, 1 hard challenge
  const easy = shuffled.find(c => c.difficulty === "easy");
  const medium = shuffled.find(c => c.difficulty === "medium");
  const hard = shuffled.find(c => c.difficulty === "hard");

  return [easy, medium, hard].filter((c): c is ChallengeDefinition => c !== undefined);
}

// Get or create user challenge progress
export async function getOrCreateUserChallenges(
  userEmail: string,
  weekNumber: number,
  year: number
): Promise<UserChallenge[]> {
  if (!isSupabaseConfigured()) return [];

  const challenges = getChallengesForWeek(weekNumber, year);

  // Get existing progress
  const { data: existing } = await supabase
    .from("user_challenges")
    .select("*")
    .eq("user_email", userEmail)
    .eq("week_number", weekNumber)
    .eq("year", year);

  if (existing && existing.length === challenges.length) {
    return existing;
  }

  // Create missing challenge records
  const existingIds = new Set((existing || []).map(e => e.challenge_id));
  const toCreate = challenges
    .filter(c => !existingIds.has(c.id))
    .map(c => ({
      user_email: userEmail,
      challenge_id: c.id,
      week_number: weekNumber,
      year,
      progress: 0,
      completed: false,
      completed_at: null,
    }));

  if (toCreate.length > 0) {
    await supabase.from("user_challenges").insert(toCreate);
  }

  // Fetch all records
  const { data } = await supabase
    .from("user_challenges")
    .select("*")
    .eq("user_email", userEmail)
    .eq("week_number", weekNumber)
    .eq("year", year);

  return data || [];
}

// Update challenge progress
export async function updateChallengeProgress(
  userEmail: string,
  challengeId: string,
  progress: number
): Promise<{
  success: boolean;
  completed: boolean;
  reward?: ChallengeReward;
  xpAwarded?: number;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, completed: false };
  }

  const { weekNumber, year } = getCurrentWeekInfo();
  const challenge = ALL_CHALLENGES.find(c => c.id === challengeId);

  if (!challenge) {
    return { success: false, completed: false };
  }

  // Get current record
  const { data: current } = await supabase
    .from("user_challenges")
    .select("*")
    .eq("user_email", userEmail)
    .eq("challenge_id", challengeId)
    .eq("week_number", weekNumber)
    .eq("year", year)
    .single();

  if (!current) {
    // Create if not exists
    await supabase.from("user_challenges").insert({
      user_email: userEmail,
      challenge_id: challengeId,
      week_number: weekNumber,
      year,
      progress,
      completed: progress >= challenge.target,
      completed_at: progress >= challenge.target ? new Date().toISOString() : null,
    });
  }

  // Check if already completed
  if (current?.completed) {
    return { success: true, completed: true };
  }

  const isNowCompleted = progress >= challenge.target;

  // Update progress
  const { error } = await supabase
    .from("user_challenges")
    .update({
      progress,
      completed: isNowCompleted,
      completed_at: isNowCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_email", userEmail)
    .eq("challenge_id", challengeId)
    .eq("week_number", weekNumber)
    .eq("year", year);

  if (error) {
    console.error("Error updating challenge progress:", error);
    return { success: false, completed: false };
  }

  // Award rewards if completed
  if (isNowCompleted && !current?.completed) {
    const xpAmount = CHALLENGE_XP_REWARDS[challenge.difficulty];
    await awardXP(userEmail, xpAmount, `CHALLENGE_${challenge.id.toUpperCase()}`);

    // Award streak freeze if applicable
    if (challenge.reward.streakFreeze) {
      const { data: streak } = await supabase
        .from("streaks")
        .select("streak_freezes")
        .eq("user_email", userEmail)
        .single();

      if (streak && (streak.streak_freezes || 0) < 2) {
        await supabase
          .from("streaks")
          .update({ streak_freezes: (streak.streak_freezes || 0) + 1 })
          .eq("user_email", userEmail);
      }
    }

    // Award badge if applicable
    if (challenge.reward.badge) {
      const { data: existingBadge } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_email", userEmail)
        .eq("badge_id", challenge.reward.badge)
        .single();

      if (!existingBadge) {
        await supabase.from("user_badges").insert({
          user_email: userEmail,
          badge_id: challenge.reward.badge,
        });
      }
    }

    return {
      success: true,
      completed: true,
      reward: challenge.reward,
      xpAwarded: xpAmount,
    };
  }

  return { success: true, completed: false };
}

// Calculate progress for all challenge types
export async function calculateChallengeProgress(
  userEmail: string,
  weekNumber: number,
  year: number
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {};

  const { start, end } = getWeekDates(weekNumber, year);
  const progress: Record<string, number> = {};

  // Get interviews this week
  const { data: interviews } = await supabase
    .from("interviews")
    .select("score, target_role")
    .eq("user_email", userEmail)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const interviewCount = interviews?.length || 0;
  const companyInterviews = interviews?.filter(i => i.target_role && i.target_role.includes("@"))?.length || 0;
  const avgScore = interviews && interviews.length > 0
    ? interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length
    : 0;

  // Get streak data
  const { data: streak } = await supabase
    .from("streaks")
    .select("current_streak")
    .eq("user_email", userEmail)
    .single();

  // Get question types practiced
  const { data: questionActivities } = await supabase
    .from("user_activities")
    .select("activity_type")
    .eq("user_email", userEmail)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const questionTypes = new Set(questionActivities?.map(a => a.activity_type) || []);
  const questionsAnswered = questionActivities?.length || 0;

  // Get resume/cover letter activities
  const { data: resumeActivity } = await supabase
    .from("user_activities")
    .select("id")
    .eq("user_email", userEmail)
    .eq("activity_type", "resume_analyze")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const { data: coverLetterActivity } = await supabase
    .from("user_activities")
    .select("id")
    .eq("user_email", userEmail)
    .eq("activity_type", "cover_letter_create")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  // Map progress to challenges
  const challenges = getChallengesForWeek(weekNumber, year);

  for (const challenge of challenges) {
    switch (challenge.type) {
      case "interviews":
        progress[challenge.id] = interviewCount;
        break;
      case "average_score":
        progress[challenge.id] = Math.round(avgScore * 10) / 10;
        break;
      case "streak":
        progress[challenge.id] = streak?.current_streak || 0;
        break;
      case "question_types":
        progress[challenge.id] = questionTypes.size;
        break;
      case "company_specific":
        progress[challenge.id] = companyInterviews;
        break;
      case "questions":
        progress[challenge.id] = questionsAnswered;
        break;
      case "resume":
        progress[challenge.id] = resumeActivity?.length || 0;
        break;
      case "cover_letter":
        progress[challenge.id] = coverLetterActivity?.length || 0;
        break;
    }
  }

  return progress;
}

// Get weekly leaderboard
export async function getWeeklyLeaderboard(
  weekNumber: number,
  year: number,
  currentUserEmail?: string
): Promise<WeeklyLeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return [];

  // Get all completed challenges for this week
  const { data: challengeData } = await supabase
    .from("user_challenges")
    .select("user_email, challenge_id, completed")
    .eq("week_number", weekNumber)
    .eq("year", year)
    .eq("completed", true);

  if (!challengeData || challengeData.length === 0) return [];

  // Aggregate by user
  const userStats: Record<string, { completed: number; points: number }> = {};

  for (const entry of challengeData) {
    if (!userStats[entry.user_email]) {
      userStats[entry.user_email] = { completed: 0, points: 0 };
    }
    userStats[entry.user_email].completed += 1;

    // Find challenge to get points
    const challenge = ALL_CHALLENGES.find(c => c.id === entry.challenge_id);
    if (challenge) {
      userStats[entry.user_email].points += CHALLENGE_POINTS[challenge.difficulty];
    }
  }

  // Get user info
  const userEmails = Object.keys(userStats);
  const { data: users } = await supabase
    .from("users")
    .select("email, username, name, image_url, school")
    .in("email", userEmails);

  // Build leaderboard
  const leaderboard: WeeklyLeaderboardEntry[] = [];

  for (const email of userEmails) {
    const user = users?.find(u => u.email === email);
    leaderboard.push({
      rank: 0,
      user_email: email,
      username: user?.username || email.split("@")[0],
      name: user?.name || "Anonymous",
      image_url: user?.image_url || null,
      school: user?.school || null,
      challenges_completed: userStats[email].completed,
      total_points: userStats[email].points,
      is_current_user: email === currentUserEmail,
    });
  }

  // Sort by points, then by challenges completed
  leaderboard.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    return b.challenges_completed - a.challenges_completed;
  });

  // Assign ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}

// Get past week results for a user
export async function getPastWeekResults(
  userEmail: string,
  limit: number = 4
): Promise<PastWeekResult[]> {
  if (!isSupabaseConfigured()) return [];

  const { weekNumber: currentWeek, year: currentYear } = getCurrentWeekInfo();
  const results: PastWeekResult[] = [];

  for (let i = 1; i <= limit; i++) {
    let week = currentWeek - i;
    let year = currentYear;

    if (week <= 0) {
      year -= 1;
      week += 52;
    }

    const challenges = getChallengesForWeek(week, year);

    const { data: userChallenges } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("user_email", userEmail)
      .eq("week_number", week)
      .eq("year", year);

    const completed = userChallenges?.filter(c => c.completed)?.length || 0;
    const totalXP = userChallenges
      ?.filter(c => c.completed)
      ?.reduce((sum, c) => {
        const challenge = challenges.find(ch => ch.id === c.challenge_id);
        return sum + (challenge ? CHALLENGE_XP_REWARDS[challenge.difficulty] : 0);
      }, 0) || 0;

    // Get rank for that week
    const leaderboard = await getWeeklyLeaderboard(week, year, userEmail);
    const userRank = leaderboard.find(e => e.user_email === userEmail)?.rank || null;

    results.push({
      week_number: week,
      year,
      challenges_completed: completed,
      total_challenges: challenges.length,
      total_xp_earned: totalXP,
      rank: userRank,
    });
  }

  return results;
}

// Check and update all challenges for a user
export async function syncUserChallenges(userEmail: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { weekNumber, year } = getCurrentWeekInfo();
  const challenges = getChallengesForWeek(weekNumber, year);
  const progress = await calculateChallengeProgress(userEmail, weekNumber, year);

  // Ensure all challenge records exist
  await getOrCreateUserChallenges(userEmail, weekNumber, year);

  // Update progress for each challenge
  for (const challenge of challenges) {
    const currentProgress = progress[challenge.id] || 0;
    await updateChallengeProgress(userEmail, challenge.id, currentProgress);
  }
}

// Award weekly winner badges at end of week
export async function awardWeeklyWinnerBadges(weekNumber: number, year: number): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const leaderboard = await getWeeklyLeaderboard(weekNumber, year);

  if (leaderboard.length === 0) return;

  // Helper function to check if badge exists before inserting
  const awardBadgeIfNotExists = async (userEmail: string, badgeId: string) => {
    const { data: existing } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_email", userEmail)
      .eq("badge_id", badgeId)
      .single();

    if (!existing) {
      await supabase.from("user_badges").insert({
        user_email: userEmail,
        badge_id: badgeId,
      });
    }
  };

  // Award #1 badge
  const winner = leaderboard[0];
  await awardBadgeIfNotExists(winner.user_email, "weekly_winner");

  // Award top 3 badges
  for (let i = 0; i < Math.min(3, leaderboard.length); i++) {
    await awardBadgeIfNotExists(leaderboard[i].user_email, "top_3");
  }

  // Award completionist badges (all 3 challenges completed)
  for (const entry of leaderboard) {
    if (entry.challenges_completed === 3) {
      await awardBadgeIfNotExists(entry.user_email, "all_challenges");
    }
  }
}
