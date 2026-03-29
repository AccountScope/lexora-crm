/**
 * Gamification system for Lexora
 * Achievements, milestones, and progress tracking
 */

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: "onboarding" | "features" | "milestones" | "expert"
  points: number
  unlocked: boolean
  unlockedAt?: Date
  progress?: number // 0-100
  requirement: number
}

export interface UserProgress {
  totalPoints: number
  level: number
  achievementsUnlocked: number
  totalAchievements: number
  streak: number // Days in a row using platform
  lastActiveDate: string
}

/**
 * Achievement definitions
 */
export const achievements: Achievement[] = [
  // Onboarding
  {
    id: "first-login",
    title: "Welcome Aboard",
    description: "Complete your first login to Lexora",
    icon: "🎉",
    category: "onboarding",
    points: 10,
    unlocked: false,
    requirement: 1
  },
  {
    id: "profile-complete",
    title: "All Set Up",
    description: "Complete your user profile",
    icon: "✅",
    category: "onboarding",
    points: 20,
    unlocked: false,
    requirement: 1
  },
  {
    id: "tour-complete",
    title: "Quick Learner",
    description: "Complete the interactive tour",
    icon: "🎓",
    category: "onboarding",
    points: 50,
    unlocked: false,
    requirement: 1
  },

  // Feature Usage
  {
    id: "first-matter",
    title: "Case Opener",
    description: "Create your first legal matter",
    icon: "⚖️",
    category: "features",
    points: 30,
    unlocked: false,
    requirement: 1
  },
  {
    id: "matter-master",
    title: "Matter Master",
    description: "Create 10 legal matters",
    icon: "📁",
    category: "features",
    points: 100,
    unlocked: false,
    requirement: 10
  },
  {
    id: "first-document",
    title: "Document Keeper",
    description: "Upload your first document",
    icon: "📄",
    category: "features",
    points: 25,
    unlocked: false,
    requirement: 1
  },
  {
    id: "document-vault",
    title: "Digital Archivist",
    description: "Upload 100 documents",
    icon: "🗂️",
    category: "features",
    points: 150,
    unlocked: false,
    requirement: 100
  },
  {
    id: "first-trust-account",
    title: "Trust Builder",
    description: "Set up your first trust account",
    icon: "💰",
    category: "features",
    points: 50,
    unlocked: false,
    requirement: 1
  },
  {
    id: "first-reconciliation",
    title: "Compliance Champion",
    description: "Complete your first three-way reconciliation",
    icon: "✅",
    category: "features",
    points: 75,
    unlocked: false,
    requirement: 1
  },
  {
    id: "reconciliation-streak",
    title: "Monthly Maestro",
    description: "Complete reconciliation 3 months in a row",
    icon: "🔥",
    category: "features",
    points: 200,
    unlocked: false,
    requirement: 3
  },
  {
    id: "first-time-entry",
    title: "Time Keeper",
    description: "Log your first billable time entry",
    icon: "⏱️",
    category: "features",
    points: 20,
    unlocked: false,
    requirement: 1
  },
  {
    id: "billable-hours",
    title: "Productive Pro",
    description: "Log 100 hours of billable time",
    icon: "⚡",
    category: "features",
    points: 150,
    unlocked: false,
    requirement: 100
  },

  // Milestones
  {
    id: "first-week",
    title: "Week One Wonder",
    description: "Use Lexora for 7 consecutive days",
    icon: "📅",
    category: "milestones",
    points: 50,
    unlocked: false,
    requirement: 7
  },
  {
    id: "first-month",
    title: "Monthly Milestone",
    description: "Use Lexora for 30 consecutive days",
    icon: "🎯",
    category: "milestones",
    points: 150,
    unlocked: false,
    requirement: 30
  },
  {
    id: "six-month-veteran",
    title: "Seasoned Veteran",
    description: "Use Lexora for 6 months",
    icon: "🏆",
    category: "milestones",
    points: 500,
    unlocked: false,
    requirement: 180
  },
  {
    id: "year-anniversary",
    title: "Annual Achievement",
    description: "Celebrate 1 year with Lexora",
    icon: "🎂",
    category: "milestones",
    points: 1000,
    unlocked: false,
    requirement: 365
  },

  // Expert Level
  {
    id: "help-explorer",
    title: "Help Explorer",
    description: "Use ⌘K help search 10 times",
    icon: "🔍",
    category: "expert",
    points: 40,
    unlocked: false,
    requirement: 10
  },
  {
    id: "video-watcher",
    title: "Video Scholar",
    description: "Watch 5 tutorial videos",
    icon: "📺",
    category: "expert",
    points: 60,
    unlocked: false,
    requirement: 5
  },
  {
    id: "power-user",
    title: "Power User",
    description: "Use 10 different keyboard shortcuts",
    icon: "⌨️",
    category: "expert",
    points: 100,
    unlocked: false,
    requirement: 10
  },
  {
    id: "integration-master",
    title: "Integration Master",
    description: "Connect Gmail/Outlook and sync 100 emails",
    icon: "📧",
    category: "expert",
    points: 120,
    unlocked: false,
    requirement: 100
  },
  {
    id: "report-builder",
    title: "Report Builder",
    description: "Create 5 custom reports",
    icon: "📊",
    category: "expert",
    points: 80,
    unlocked: false,
    requirement: 5
  },
  {
    id: "lexora-legend",
    title: "Lexora Legend",
    description: "Unlock all achievements",
    icon: "👑",
    category: "expert",
    points: 2000,
    unlocked: false,
    requirement: 20 // Total achievements minus this one
  }
]

/**
 * Calculate user level from points
 */
export function calculateLevel(points: number): number {
  // Level = sqrt(points / 100) rounded down
  return Math.floor(Math.sqrt(points / 100))
}

/**
 * Get points needed for next level
 */
export function getNextLevelPoints(currentLevel: number): number {
  const nextLevel = currentLevel + 1
  return Math.pow(nextLevel, 2) * 100
}

/**
 * Get user progress from localStorage
 */
export function getUserProgress(): UserProgress {
  if (typeof window === 'undefined') return getDefaultProgress()

  const stored = localStorage.getItem('lexora-gamification-progress')
  if (!stored) return getDefaultProgress()

  try {
    return JSON.parse(stored) as UserProgress
  } catch {
    return getDefaultProgress()
  }
}

/**
 * Save user progress to localStorage
 */
export function saveUserProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('lexora-gamification-progress', JSON.stringify(progress))
}

/**
 * Get default progress
 */
function getDefaultProgress(): UserProgress {
  return {
    totalPoints: 0,
    level: 0,
    achievementsUnlocked: 0,
    totalAchievements: achievements.length,
    streak: 0,
    lastActiveDate: new Date().toISOString().split('T')[0]
  }
}

/**
 * Unlock achievement
 */
export function unlockAchievement(achievementId: string): {
  success: boolean
  achievement?: Achievement
  newLevel?: boolean
} {
  const progress = getUserProgress()
  const achievement = achievements.find(a => a.id === achievementId)
  
  if (!achievement || achievement.unlocked) {
    return { success: false }
  }

  // Unlock the achievement
  achievement.unlocked = true
  achievement.unlockedAt = new Date()

  // Update progress
  const oldLevel = progress.level
  progress.totalPoints += achievement.points
  progress.achievementsUnlocked += 1
  progress.level = calculateLevel(progress.totalPoints)

  saveUserProgress(progress)

  return {
    success: true,
    achievement,
    newLevel: progress.level > oldLevel
  }
}

/**
 * Update achievement progress
 */
export function updateAchievementProgress(
  achievementId: string,
  current: number
): { unlocked: boolean; achievement?: Achievement } {
  const achievement = achievements.find(a => a.id === achievementId)
  
  if (!achievement || achievement.unlocked) {
    return { unlocked: false }
  }

  achievement.progress = Math.min((current / achievement.requirement) * 100, 100)

  if (current >= achievement.requirement) {
    const result = unlockAchievement(achievementId)
    return { unlocked: true, achievement: result.achievement }
  }

  return { unlocked: false }
}

/**
 * Update daily streak
 */
export function updateStreak(): number {
  const progress = getUserProgress()
  const today = new Date().toISOString().split('T')[0]
  const lastActive = new Date(progress.lastActiveDate)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (progress.lastActiveDate === today) {
    // Already logged today
    return progress.streak
  } else if (progress.lastActiveDate === yesterdayStr) {
    // Streak continues
    progress.streak += 1
  } else {
    // Streak broken
    progress.streak = 1
  }

  progress.lastActiveDate = today
  saveUserProgress(progress)

  return progress.streak
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(
  category: Achievement["category"]
): Achievement[] {
  return achievements.filter(a => a.category === category)
}

/**
 * Get unlocked achievements
 */
export function getUnlockedAchievements(): Achievement[] {
  return achievements.filter(a => a.unlocked)
}

/**
 * Get locked achievements
 */
export function getLockedAchievements(): Achievement[] {
  return achievements.filter(a => !a.unlocked)
}

/**
 * Get completion percentage
 */
export function getCompletionPercentage(): number {
  const unlocked = achievements.filter(a => a.unlocked).length
  return Math.round((unlocked / achievements.length) * 100)
}
