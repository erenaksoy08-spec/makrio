import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
  FREEZE_MILESTONES,
  RESTORE_WINDOW_MS,
  peakStreak,
  earnedFreezes,
  availableFreezes,
  totalEarnedFreezes,
} from '../lib/streakFreezes'
import StreakSaverIcon from './StreakSaverIcon'

const SAVER = '#FB923C'

export default function StreakFreezeCard({ profile, refreshProfile }) {
  const [restoring, setRestoring] = useState(false)
  const syncedRef = useRef(false)

  const prefs = profile?.preferences ?? {}
  const peak = peakStreak(profile)
  const current = profile?.current_streak ?? 0
  const available = availableFreezes(profile)
  const totalEarned = totalEarnedFreezes(profile)

  const brokenAt = prefs.streakBrokenAt ? new Date(prefs.streakBrokenAt).getTime() : null
  const withinWindow = brokenAt != null && Date.now() - brokenAt < RESTORE_WINDOW_MS
  const canRestore = withinWindow && available > 0

  // Seri zirvesini ve kırılma anını preferences'ta takip et.
  useEffect(() => {
    if (syncedRef.current) return
    const storedPeak = prefs.streakPeak ?? 0
    let next = null

    if (current > storedPeak) {
      // Seri büyüyor/sağlıklı → zirveyi güncelle, kırılmayı temizle.
      next = { ...prefs, streakPeak: current, streakBrokenAt: null }
    } else if (current <= 1 && storedPeak >= 2 && !prefs.streakBrokenAt) {
      // Seri yeni bozuldu → kırılma zamanını işaretle.
      next = { ...prefs, streakBrokenAt: new Date().toISOString() }
    }

    if (next) {
      syncedRef.current = true
      supabase.rpc('update_preferences', { p_preferences: next }).then(() => refreshProfile())
    }
  }, [current, prefs, refreshProfile])

  async function handleRestore() {
    setRestoring(true)
    const { data } = await supabase.rpc('use_streak_freeze')
    if (data?.ok) {
      const cleared = { ...prefs, streakPeak: data.restored, streakBrokenAt: null }
      await supabase.rpc('update_preferences', { p_preferences: cleared })
      navigator.vibrate?.(20)
    }
    await refreshProfile()
    setRestoring(false)
  }

  const nextMilestone = FREEZE_MILESTONES.find((m) => peak < m.days)

  return (
    <div className="space-y-3">
      {/* Kırılma uyarısı + kurtarma */}
      {canRestore && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-4"
          style={{ borderColor: `${SAVER}66`, backgroundColor: `${SAVER}12` }}
        >
          <div className="flex items-center gap-2">
            <StreakSaverIcon size={20} />
            <span className="text-sm font-semibold text-text">Serin bozuldu</span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            24 saat içinde bir kurtarıcı harcayarak <b className="text-text">{peak} günlük</b> serini kurtarabilirsin.
          </p>
          <button
            type="button"
            onClick={handleRestore}
            disabled={restoring}
            className="btn-primary mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            style={{ backgroundColor: SAVER }}
          >
            {restoring ? 'Kurtarılıyor...' : `Serini kurtar (${available} kurtarıcı)`}
          </button>
        </motion.div>
      )}

      {/* Kompakt bakiye + yatay kazanım şeridi — tek kart */}
      <div className="rounded-3xl border border-white/[0.06] bg-surface p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${SAVER}1f` }}
          >
            <StreakSaverIcon size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular-nums text-text">{available}</span>
              <span className="text-sm text-text-muted">kurtarıcı hazır</span>
            </div>
            <div className="text-xs text-text-muted">Seri bozulursa 24 saat içinde kullanılabilir</div>
          </div>
          {nextMilestone && (
            <span className="shrink-0 text-right text-[11px] text-text-muted">
              <span className="block font-semibold" style={{ color: SAVER }}>
                {nextMilestone.days - peak}g
              </span>
              sonraki
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FREEZE_MILESTONES.map((m) => {
            const reached = peak >= m.days
            const isNext = nextMilestone?.days === m.days
            return (
              <div
                key={m.days}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5"
                style={{
                  borderColor: reached ? `${SAVER}55` : isNext ? 'rgba(255,255,255,0.18)' : 'var(--color-border)',
                  backgroundColor: reached ? `${SAVER}14` : 'transparent',
                }}
              >
                {reached ? <StreakSaverIcon size={15} /> : <span className="text-[11px] opacity-70">🔒</span>}
                <span className={`text-xs tabular-nums ${reached ? 'text-text' : 'text-text-muted'}`}>{m.days}g</span>
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ color: reached ? SAVER : 'var(--color-text-muted)' }}
                >
                  +{m.freezes}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
