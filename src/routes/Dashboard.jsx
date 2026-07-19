import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { todayStr, formatHeaderDate } from '../lib/date'
import { useCountUp } from '../hooks/useCountUp'
import CalorieRing from '../components/CalorieRing'
import MacroBar from '../components/MacroBar'
import WaterTracker from '../components/WaterTracker'
import WeightCard from '../components/WeightCard'
import GoalCard from '../components/GoalCard'
import BronzeBadge from '../components/BronzeBadge'
import ScoreCard from '../components/ScoreCard'
import { scoreDay } from '../lib/dayScore'
import { computeWaterGoal } from '../lib/water'
import { Skeleton } from '../components/SkeletonLoader'
import usePixelTheme from '../hooks/usePixelTheme'
import { PixelFlame, PixelGreetingIcon } from '../components/pixelSprites'
import { badgeTierFrom } from '../lib/rewards'
import { t } from '../lib/i18n'

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const pixelUi = usePixelTheme()
  const today = todayStr()

  const [goals, setGoals] = useState(null)
  const [logs, setLogs] = useState([])
  const [waterLogs, setWaterLogs] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    const [{ data: goalsData }, { data: logsData }, { data: waterData }, { data: weightData }] = await Promise.all([
      supabase.from('user_goals').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1),
      supabase.from('food_logs').select('*').eq('user_id', user.id).eq('date', today),
      supabase.from('water_logs').select('*').eq('user_id', user.id).eq('date', today).order('created_at', { ascending: true }),
      supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(90),
    ])

    setGoals(goalsData?.[0] ?? null)
    setLogs(logsData ?? [])
    setWaterLogs(waterData ?? [])
    setWeightLogs(weightData ?? [])
    setLoading(false)
  }, [user.id, today])

  useEffect(() => {
    loadAll()
    supabase.rpc('check_streak').then(() => refreshProfile())
  }, [loadAll])

  // Kilodan hesaplanan su hedefini user_goals'a yansıt — puanlama ve
  // arkadaş ligi de aynı hedefi görsün.
  useEffect(() => {
    if (!goals) return
    const latest = weightLogs.length
      ? [...weightLogs].sort((a, b) => (a.logged_at < b.logged_at ? -1 : 1))[weightLogs.length - 1].kg
      : profile?.weight_kg
    const computed = computeWaterGoal(latest)
    if (computed && goals.water_ml !== computed) {
      supabase
        .from('user_goals')
        .update({ water_ml: computed })
        .eq('user_id', user.id)
        .then(() => setGoals((g) => (g ? { ...g, water_ml: computed } : g)))
    }
  }, [goals, weightLogs, profile?.weight_kg, user.id])

  // "Dört Vakit" görevi: bu ziyaretin vaktini sessizce işaretle (günlük sıfırlanır).
  useEffect(() => {
    if (!profile?.preferences) return
    const hour = new Date().getHours()
    const period =
      hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : hour >= 17 && hour < 22 ? 'evening' : 'night'
    const q = profile.preferences.quests ?? {}
    const daily = q.daily?.date === today ? q.daily : { date: today, periods: [], collected: {} }
    if ((daily.periods ?? []).includes(period)) return
    const next = { ...q, daily: { ...daily, periods: [...(daily.periods ?? []), period] } }
    supabase
      .rpc('update_preferences', { p_preferences: { ...profile.preferences, quests: next } })
      .then(() => refreshProfile())
  }, [profile, today, refreshProfile])

  async function handleAddWater(amount_ml) {
    await supabase.from('water_logs').insert({ user_id: user.id, date: today, amount_ml })
    loadAll()
  }

  async function handleUndoWater() {
    const last = waterLogs[waterLogs.length - 1]
    if (!last) return
    await supabase.from('water_logs').delete().eq('id', last.id)
    loadAll()
  }

  async function handleAddWeight(kg) {
    const existing = weightLogs.find((w) => w.logged_at === today)
    if (existing) {
      await supabase.from('weight_logs').update({ kg }).eq('id', existing.id)
    } else {
      await supabase.from('weight_logs').insert({ user_id: user.id, kg, logged_at: today })
    }
    loadAll()
  }

  const consumed = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein_g: acc.protein_g + l.protein_g,
      carbs_g: acc.carbs_g + l.carbs_g,
      fat_g: acc.fat_g + l.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )

  const animatedConsumedCalories = useCountUp(Math.round(consumed.calories), 700)

  if (loading) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="mx-auto h-36 w-36 rounded-full" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  const goalCalories = goals?.calories ?? 2000
  const goalProtein = goals?.protein_g ?? 0
  const goalCarbs = goals?.carbs_g ?? 0
  const goalFat = goals?.fat_g ?? 0

  const waterConsumed = waterLogs.reduce((sum, w) => sum + w.amount_ml, 0)

  const latestWeight = weightLogs.length
    ? [...weightLogs].sort((a, b) => (a.logged_at < b.logged_at ? -1 : 1))[weightLogs.length - 1].kg
    : profile?.weight_kg

  // Su hedefi son kilodan hesaplanır (kg × 35 ml); kilo yoksa kayıtlı hedefe düşer.
  const goalWater = computeWaterGoal(latestWeight) ?? goals?.water_ml ?? 2000

  const dayScore = scoreDay(
    {
      calories: consumed.calories,
      protein: consumed.protein_g,
      carbs: consumed.carbs_g,
      fat: consumed.fat_g,
      water_ml: waterConsumed,
    },
    { calories: goalCalories, protein_g: goalProtein, carbs_g: goalCarbs, fat_g: goalFat, water_ml: goalWater },
  )

  // Kuşanılmış halka rengi (Turkuaz vb. ödüller) her temada geçerli;
  // renk kuşanılmamışsa Süper Makrio kendi alev kırmızısını kullanır.
  const ringColor =
    profile?.preferences?.ringColor ||
    (profile?.preferences?.theme === 'pixel-super' ? '#E5342B' : '#3DA5FF')
  const badgeTier = badgeTierFrom(
    profile?.preferences,
    Math.max(profile?.current_streak ?? 0, profile?.longest_streak ?? 0),
  )
  const spiralBars = profile?.preferences?.barStyle === 'spiral'

  const hour = new Date().getHours()
  const greeting =
    hour >= 5 && hour < 12
      ? { text: t('Günaydın'), emoji: '☀️', period: 'morning' }
      : hour >= 12 && hour < 17
        ? { text: t('İyi Günler'), emoji: '🌤️', period: 'afternoon' }
        : hour >= 17 && hour < 22
          ? { text: t('İyi Akşamlar'), emoji: '🌇', period: 'evening' }
          : { text: t('İyi Geceler'), emoji: '🌙', period: 'night' }
  const firstName = profile?.name?.trim().split(/\s+/)[0]

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
            {formatHeaderDate(today)}
          </div>
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-text [overflow-wrap:anywhere]">
            {greeting.text}
            {firstName ? `, ${firstName}` : ''}{' '}
            {pixelUi ? <PixelGreetingIcon period={greeting.period} /> : greeting.emoji}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
          {badgeTier && <BronzeBadge size={18} tier={badgeTier} />}
          {pixelUi ? (
            <span className="pixel-flicker">
              <PixelFlame size={13} />
            </span>
          ) : (
            <span className="text-sm">🔥</span>
          )}
          <span className="text-sm font-semibold tabular-nums text-text">{profile?.current_streak ?? 0}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <CalorieRing
          consumed={consumed.calories}
          goal={goalCalories}
          color={ringColor}
          shape={profile?.preferences?.ringShape === 'square' ? 'square' : 'circle'}
        />
        <div className="text-[15px] tabular-nums text-text-muted">
          <span className="font-semibold text-text">{animatedConsumedCalories}</span> / {goalCalories} kcal
        </div>
      </div>

      <div className="space-y-5 rounded-3xl border border-white/[0.06] bg-surface p-5">
        <MacroBar label={t('Protein')} consumed={consumed.protein_g} goal={goalProtein} color="#FF8A5B" delay={0} spiral={spiralBars} />
        <MacroBar label={t('Yağ')} consumed={consumed.fat_g} goal={goalFat} color="#F2C94C" delay={60} spiral={spiralBars} />
        <MacroBar label={t('Karbonhidrat')} consumed={consumed.carbs_g} goal={goalCarbs} color="#6FCF97" delay={120} spiral={spiralBars} />
      </div>

      <ScoreCard score={dayScore} idle={consumed.calories === 0 && waterConsumed === 0} />

      <WaterTracker
        consumed_ml={waterConsumed}
        goal_ml={goalWater}
        weightKg={latestWeight}
        onAdd={handleAddWater}
        onUndo={handleUndoWater}
        canUndo={waterLogs.length > 0}
        realistic={profile?.preferences?.waterAnim === 'realistic'}
      />

      <div className="grid grid-cols-2 gap-3">
        <WeightCard logs={weightLogs} goal={profile?.goal} onAdd={handleAddWeight} />
        <GoalCard
          goal={profile?.goal}
          calories={goals?.calories}
          currentWeight={latestWeight}
          targetWeight={profile?.preferences?.targetWeight}
          rate={profile?.preferences?.goalRate}
          onSaved={loadAll}
        />
      </div>
    </div>
  )
}
