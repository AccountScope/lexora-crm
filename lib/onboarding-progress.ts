/**
 * Onboarding progress tracking and analytics
 */

export interface OnboardingProgress {
  completed: boolean
  completedAt?: string
  stepsCompleted: number
  totalSteps: number
  skipped?: boolean
  timeSpent?: number // milliseconds
  lastStep?: number
}

export interface OnboardingAnalytics {
  totalUsers: number
  completionRate: number
  averageTimeSpent: number
  dropoffPoints: Record<number, number>
  skipRate: number
}

/**
 * Get onboarding progress for a specific tour
 */
export function getOnboardingProgress(key: string): OnboardingProgress | null {
  if (typeof window === 'undefined') return null
  
  const progressKey = `${key}-progress`
  const stored = localStorage.getItem(progressKey)
  
  if (!stored) return null
  
  try {
    return JSON.parse(stored) as OnboardingProgress
  } catch {
    return null
  }
}

/**
 * Save onboarding progress
 */
export function saveOnboardingProgress(key: string, progress: OnboardingProgress): void {
  if (typeof window === 'undefined') return
  
  const progressKey = `${key}-progress`
  localStorage.setItem(progressKey, JSON.stringify(progress))
}

/**
 * Check if user has started but not completed onboarding
 */
export function hasPartialProgress(key: string): boolean {
  const progress = getOnboardingProgress(key)
  return progress !== null && !progress.completed && !progress.skipped
}

/**
 * Calculate completion percentage
 */
export function getCompletionPercentage(key: string): number {
  const progress = getOnboardingProgress(key)
  if (!progress) return 0
  
  return Math.round((progress.stepsCompleted / progress.totalSteps) * 100)
}

/**
 * Get all onboarding tours status
 */
export function getAllOnboardingStatus(): Record<string, OnboardingProgress | null> {
  if (typeof window === 'undefined') return {}
  
  const tours = [
    'lexora-onboarding-dashboard',
    'lexora-onboarding-trust-accounting',
    'lexora-onboarding-document-vault',
    'lexora-onboarding-case-management',
    'lexora-onboarding-time-tracking'
  ]
  
  const status: Record<string, OnboardingProgress | null> = {}
  
  tours.forEach(tour => {
    status[tour] = getOnboardingProgress(tour)
  })
  
  return status
}

/**
 * Calculate overall onboarding completion
 */
export function getOverallCompletion(): {
  completed: number
  total: number
  percentage: number
} {
  const status = getAllOnboardingStatus()
  const tours = Object.values(status)
  
  const completed = tours.filter(t => t?.completed).length
  const total = tours.length
  
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  }
}

/**
 * Track onboarding step view
 */
export function trackStepView(tourKey: string, stepIndex: number): void {
  if (typeof window === 'undefined') return
  
  const viewKey = `${tourKey}-step-${stepIndex}-viewed`
  const viewCount = parseInt(localStorage.getItem(viewKey) || '0')
  localStorage.setItem(viewKey, (viewCount + 1).toString())
  
  // Track timestamp
  const timestampKey = `${tourKey}-step-${stepIndex}-timestamp`
  localStorage.setItem(timestampKey, new Date().toISOString())
}

/**
 * Track onboarding completion time
 */
export function trackCompletionTime(tourKey: string, startTime: number): void {
  if (typeof window === 'undefined') return
  
  const timeSpent = Date.now() - startTime
  const timeKey = `${tourKey}-time-spent`
  localStorage.setItem(timeKey, timeSpent.toString())
}

/**
 * Get dropoff analytics (which steps users quit on)
 */
export function getDropoffAnalytics(tourKey: string, totalSteps: number): Record<number, number> {
  if (typeof window === 'undefined') return {}
  
  const dropoffs: Record<number, number> = {}
  
  for (let i = 0; i < totalSteps; i++) {
    const viewKey = `${tourKey}-step-${i}-viewed`
    const views = parseInt(localStorage.getItem(viewKey) || '0')
    
    if (i > 0) {
      const prevViewKey = `${tourKey}-step-${i - 1}-viewed`
      const prevViews = parseInt(localStorage.getItem(prevViewKey) || '0')
      
      if (prevViews > views) {
        dropoffs[i] = prevViews - views
      }
    }
  }
  
  return dropoffs
}

/**
 * Reset onboarding for a specific tour (useful for testing)
 */
export function resetOnboarding(tourKey: string): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(tourKey)
  localStorage.removeItem(`${tourKey}-progress`)
  localStorage.removeItem(`${tourKey}-time-spent`)
  
  // Remove step tracking
  for (let i = 0; i < 20; i++) {
    localStorage.removeItem(`${tourKey}-step-${i}-viewed`)
    localStorage.removeItem(`${tourKey}-step-${i}-timestamp`)
  }
}

/**
 * Should show onboarding reminder?
 * Show if user has partial progress and it's been > 24 hours
 */
export function shouldShowReminder(tourKey: string): boolean {
  if (typeof window === 'undefined') return false
  
  const progress = getOnboardingProgress(tourKey)
  if (!progress || progress.completed || progress.skipped) return false
  
  // Check last viewed timestamp
  const lastStep = progress.lastStep || 0
  const timestampKey = `${tourKey}-step-${lastStep}-timestamp`
  const timestamp = localStorage.getItem(timestampKey)
  
  if (!timestamp) return true
  
  const hoursSince = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60)
  return hoursSince > 24
}

/**
 * Export analytics for admin dashboard
 */
export function exportOnboardingAnalytics(): OnboardingAnalytics {
  const allStatus = getAllOnboardingStatus()
  const tours = Object.values(allStatus).filter(t => t !== null) as OnboardingProgress[]
  
  const completed = tours.filter(t => t.completed).length
  const skipped = tours.filter(t => t.skipped).length
  const total = tours.length
  
  const timeSpent = tours
    .filter(t => t.timeSpent)
    .map(t => t.timeSpent!)
  
  const averageTime = timeSpent.length > 0
    ? timeSpent.reduce((a, b) => a + b, 0) / timeSpent.length
    : 0
  
  return {
    totalUsers: total,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    averageTimeSpent: averageTime,
    dropoffPoints: {},
    skipRate: total > 0 ? (skipped / total) * 100 : 0
  }
}
