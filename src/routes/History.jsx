import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { lastNDays, todayStr, formatDayLabel, formatHeaderDate } from '../lib/date'
import { getMealTypeLabel, getMealTypeColor, canonicalMealType } from '../lib/mealTypes'
import WeeklyBarChart from '../components/WeeklyBarChart'
import { Skeleton } from '../components/SkeletonLoader'
import MealPeriodIcon from '../components/MealPeriodIcon'
import { scoreDay, scoreColor, fmtScore } from '../lib/dayScore'
import { t } from '../lib/i18n'

export default function History() {
  const { user } = useAuth()
  const [allLogs, setAllLogs] = useState([])
  const [allWater, setAllWater] = useState([])
  const [goals, setGoals] = useState(null)
  const [suppTotal, setSuppTotal] = useState(0)
  const [suppByDay, setSuppByDay] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(todayStr())

  const days = lastNDays(7)
  const today = todayStr()

  useEffect(() => {
    async function load() {
      const [{ data: logs }, { data: water }, { data: goalRows }] = await Promise.all([
        supabase
          .from('food_logs')
          .select('date, calories, food_name, meal_type, amount_g, protein_g, carbs_g, fat_g')
          .eq('user_id', user.id)
          .gte('date', days[0])
          .lte('date', days[days.length - 1]),
        supabase
          .from('water_logs')
          .select('date, amount_ml')
          .eq('user_id', user.id)
          .gte('date', days[0])
          .lte('date', days[days.length - 1]),
        supabase.from('user_goals').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1),
      ])

      setAllLogs(logs ?? [])
      setAllWater(water ?? [])
      setGoals(goalRows?.[0] ?? null)

      const [{ data: suppList }, { data: suppLogs }] = await Promise.all([
        supabase.from('supplements').select('id').eq('user_id', user.id),
        supabase
          .from('supplement_logs')
          .select('supplement_id, date')
          .eq('user_id', user.id)
          .gte('date', days[0])
          .lte('date', days[days.length - 1]),
      ])
      setSuppTotal(suppList?.length ?? 0)
      const byDay = {}
      for (const l of suppLogs ?? []) byDay[l.date] = (byDay[l.date] ?? 0) + 1
      setSuppByDay(byDay)

      setLoading(false)
    }
    load()
  }, [user.id])

  const goalCalories = goals?.calories ?? 2000

  if (loading) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  const totals = {}
  const macroTotals = {}
  const waterTotals = {}
  for (const day of days) {
    totals[day] = 0
    macroTotals[day] = { protein_g: 0, carbs_g: 0, fat_g: 0 }
    waterTotals[day] = 0
  }
  for (const log of allLogs) {
    totals[log.date] = (totals[log.date] ?? 0) + log.calories
    macroTotals[log.date].protein_g += log.protein_g ?? 0
    macroTotals[log.date].carbs_g += log.carbs_g ?? 0
    macroTotals[log.date].fat_g += log.fat_g ?? 0
  }
  for (const w of allWater) {
    if (waterTotals[w.date] != null) waterTotals[w.date] += w.amount_ml
  }

  const scores = {}
  for (const day of days) {
    scores[day] =
      totals[day] > 0 && goals
        ? scoreDay(
            {
              calories: totals[day],
              protein: macroTotals[day].protein_g,
              carbs: macroTotals[day].carbs_g,
              fat: macroTotals[day].fat_g,
              water_ml: waterTotals[day],
            },
            goals,
          )
        : null
  }

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)
  const loggedDays = days.filter((d) => totals[d] > 0).length
  const dailyAvg = loggedDays ? Math.round(grandTotal / loggedDays) : 0
  const selectedLogs = allLogs.filter((l) => l.date === selectedDay)
  const selMacros = macroTotals[selectedDay] ?? { protein_g: 0, carbs_g: 0, fat_g: 0 }
  const selectedTotal = Math.round(totals[selectedDay] ?? 0)
  const goalDiff = selectedTotal - goalCalories

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">{t('Geçmiş')}</h1>
          <div className="text-sm text-text-muted">{t('Son 7 gün')}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tabular-nums text-text">{dailyAvg}</div>
          <div className="text-[11px] text-text-muted">{t('günlük ort. kcal')}</div>
        </div>
      </div>

      {/* chart */}
      <div className="rounded-2xl border border-white/5 bg-surface p-4">
        <WeeklyBarChart
          days={days}
          macroTotals={macroTotals}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
        <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border pt-3">
          {[
            { label: t('Protein'), color: '#FF8A5B', value: selMacros.protein_g },
            { label: t('Yağ'), color: '#F2C94C', value: selMacros.fat_g },
            { label: t('Karb'), color: '#6FCF97', value: selMacros.carbs_g },
          ].map((l) => (
            <div
              key={l.label}
              className="flex flex-col items-center gap-0.5 rounded-xl py-1.5"
              style={{ backgroundColor: `${l.color}14` }}
            >
              <span className="text-sm font-semibold tabular-nums" style={{ color: l.color }}>
                {Math.round(l.value)}g
              </span>
              <span className="text-[10px] text-text-muted">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* day strip */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const isSelected = d === selectedDay
          const isToday = d === today
          const sc = scores[d]
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(d)}
              className={`btn-chip flex flex-col items-center gap-1 rounded-xl py-2 transition-colors ${
                isSelected ? 'bg-white/10 ring-1 ring-white/20' : 'border border-border'
              }`}
            >
              <span className={`text-[10px] uppercase ${isToday ? 'text-accent' : 'text-text-muted'}`}>
                {formatDayLabel(d)}
              </span>
              {sc ? (
                <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sc.total) }}>
                  {fmtScore(sc.total)}
                </span>
              ) : (
                <span className="text-xs text-text-muted opacity-40">–</span>
              )}
            </button>
          )
        })}
      </div>

      {/* selected day detail */}
      <div className="rounded-2xl border border-white/5 bg-surface p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-text">
                {selectedDay === today ? t('Bugün') : formatDayLabel(selectedDay)}
              </span>
              {scores[selectedDay] && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold tabular-nums"
                  style={{ color: scoreColor(scores[selectedDay].total), backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  {fmtScore(scores[selectedDay].total)}/10
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs capitalize text-text-muted">{formatHeaderDate(selectedDay)}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm font-semibold tabular-nums text-text">{selectedTotal} kcal</div>
            {selectedTotal > 0 && (
              <div
                className="text-[11px] tabular-nums"
                style={{ color: goalDiff > 0 ? '#EB5757' : '#6FCF97' }}
              >
                {goalDiff > 0 ? '+' : ''}
                {goalDiff} {t('kcal hedef')}
              </div>
            )}
          </div>
        </div>

        {suppTotal > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
            <span>💊</span>
            <span className="text-sm text-text-muted">{t('Takviyeler')}</span>
            <span className="ml-auto text-sm font-semibold tabular-nums text-text">
              {suppByDay[selectedDay] ?? 0}/{suppTotal}
            </span>
          </div>
        )}

        {selectedLogs.length === 0 ? (
          <p className="mt-4 text-center text-sm text-text-muted">{t('Bu güne ait kayıt yok.')}</p>
        ) : (
          <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
            {selectedLogs.map((log, i) => {
              const mealColor = getMealTypeColor(log.meal_type)
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-2.5 py-2"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${mealColor}1f` }}
                  >
                    <MealPeriodIcon type={canonicalMealType(log.meal_type)} color={mealColor} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-text">{log.food_name}</div>
                    <div className="text-xs text-text-muted">
                      {getMealTypeLabel(log.meal_type)}
                      {log.amount_g ? ` · ${log.amount_g}g` : ''}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-sm font-medium tabular-nums text-text">{Math.round(log.calories)} kcal</div>
                    <div className="text-xs tabular-nums text-text-muted">
                      {Math.round(log.protein_g ?? 0)}{t('P')} {Math.round(log.fat_g ?? 0)}{t('Y')} {Math.round(log.carbs_g ?? 0)}{t('K')}
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        )}
      </div>

      {grandTotal === 0 && (
        <p className="px-1 text-center text-sm text-text-muted">
          {t('Son 7 günde kayıt yok. İlk kaydını ekleyerek başla.')}
        </p>
      )}
    </div>
  )
}
