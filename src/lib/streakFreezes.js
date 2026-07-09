// Streak koruma (freeze) sistemi.
// Kullanıcı belirli seri kilometre taşlarına ulaşınca koruma kazanır.
// Streak bozulduktan sonra 24 saat içinde 1 koruma harcayıp serisini kurtarabilir.

export const FREEZE_MILESTONES = [
  { days: 21, freezes: 1 },
  { days: 75, freezes: 1 },
  { days: 90, freezes: 1 },
  { days: 120, freezes: 1 },
  { days: 180, freezes: 3 },
  { days: 240, freezes: 2 },
  { days: 300, freezes: 2 },
  { days: 365, freezes: 4 },
]

export const RESTORE_WINDOW_MS = 24 * 60 * 60 * 1000

// En uzun seri baz alınır (kazanılan koruma geri alınmaz).
export function peakStreak(profile) {
  return Math.max(profile?.current_streak ?? 0, profile?.longest_streak ?? 0)
}

export function earnedFreezes(peak) {
  return FREEZE_MILESTONES.reduce((sum, m) => sum + ((peak ?? 0) >= m.days ? m.freezes : 0), 0)
}

export function usedFreezes(profile) {
  return profile?.preferences?.streakFreezesUsed ?? 0
}

export function availableFreezes(profile) {
  return Math.max(0, earnedFreezes(peakStreak(profile)) - usedFreezes(profile))
}

export function totalEarnedFreezes(profile) {
  return earnedFreezes(peakStreak(profile))
}
