"use client"

import { useState, useEffect } from "react"
import { Trophy, Lock, Star, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  getUserProgress,
  getAchievementsByCategory,
  calculateLevel,
  getNextLevelPoints,
  Achievement
} from "@/lib/gamification"

/**
 * Achievements Panel - Shows user progress and unlocked achievements
 */
export function AchievementsPanel() {
  const [progress, setProgress] = useState(getUserProgress())
  const [filter, setFilter] = useState<"all" | Achievement["category"]>("all")

  useEffect(() => {
    // Refresh progress on mount
    setProgress(getUserProgress())
  }, [])

  const allAchievements = filter === "all"
    ? require("@/lib/gamification").achievements
    : getAchievementsByCategory(filter)

  const nextLevelPoints = getNextLevelPoints(progress.level)
  const currentLevelPoints = progress.level === 0 ? 0 : Math.pow(progress.level, 2) * 100
  const progressToNext = ((progress.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Level */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <span className="font-semibold">Level {progress.level}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {progress.totalPoints} / {nextLevelPoints} XP
              </span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {nextLevelPoints - progress.totalPoints} XP to level {progress.level + 1}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {progress.achievementsUnlocked}
              </div>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {progress.streak} 🔥
              </div>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {Math.round((progress.achievementsUnlocked / progress.totalAchievements) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "onboarding" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("onboarding")}
        >
          Onboarding
        </Button>
        <Button
          variant={filter === "features" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("features")}
        >
          Features
        </Button>
        <Button
          variant={filter === "milestones" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("milestones")}
        >
          Milestones
        </Button>
        <Button
          variant={filter === "expert" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("expert")}
        >
          Expert
        </Button>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allAchievements.map((achievement: Achievement) => (
          <Card
            key={achievement.id}
            className={`relative overflow-hidden transition-all ${
              achievement.unlocked
                ? "border-primary/50 bg-primary/5"
                : "opacity-60"
            }`}
          >
            <CardContent className="p-6">
              {/* Icon */}
              <div className="text-4xl mb-3">{achievement.icon}</div>

              {/* Title & Badge */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{achievement.title}</h3>
                {achievement.unlocked ? (
                  <Badge variant="default" className="ml-2">
                    <Trophy className="h-3 w-3 mr-1" />
                    Unlocked
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-3">
                {achievement.description}
              </p>

              {/* Progress Bar (if in progress) */}
              {!achievement.unlocked && achievement.progress !== undefined && (
                <div className="mb-3">
                  <Progress value={achievement.progress} className="h-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(achievement.progress)}% complete
                  </p>
                </div>
              )}

              {/* Points */}
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                  {achievement.points} XP
                </Badge>
                {achievement.unlockedAt && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>

            {/* Shine effect for unlocked */}
            {achievement.unlocked && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * Achievement Toast Notification
 * Show when user unlocks an achievement
 */
interface AchievementToastProps {
  achievement: Achievement
  onClose: () => void
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-top-4 duration-500">
      <Card className="w-[400px] border-primary/50 bg-primary/5 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-5xl">{achievement.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <p className="text-sm font-medium text-yellow-600">
                  Achievement Unlocked!
                </p>
              </div>
              <h3 className="font-semibold mb-1">{achievement.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {achievement.description}
              </p>
              <Badge variant="default">
                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                +{achievement.points} XP
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
