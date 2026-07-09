import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { REWARDS, isUnlocked, unlockStreakFrom } from '../lib/rewards'
import { PixelFlame } from '../components/pixelSprites'
import StreakFreezeCard from '../components/StreakFreezeCard'
import TrophyIcon from '../components/TrophyIcon'
import PlateIcon from '../components/PlateIcon'
import Laurel from '../components/Laurel'
import { scoopBalance } from '../lib/store'

// Ödül sayfasının altın kimliği — global accent beyaza döndü, cafcaf burada yaşıyor.
const GOLD = '#F2A93B'

export default function Progress() {
  const { profile, refreshProfile } = useAuth()

  const streak = profile?.current_streak ?? 0
  const longest = profile?.longest_streak ?? 0
  const unlockStreak = unlockStreakFrom(profile)
  const preferences = profile?.preferences ?? {}
  const claimed = new Set(preferences.claimedRewards ?? [])

  const pixelUi = String(preferences.theme ?? '').startsWith('pixel')
  const unlockedCount = REWARDS.filter((r) => isUnlocked(unlockStreak, r.days)).length
  const nextReward = REWARDS.find((r) => !isUnlocked(unlockStreak, r.days))
  const nextProgress = nextReward ? Math.min(100, (unlockStreak / nextReward.days) * 100) : 100

  function isActive(reward) {
    if (reward.duo) return reward.duo.some((d) => preferences[d.key] === d.value)
    if (reward.id === 'pixel-theme') return String(preferences.theme ?? '').startsWith('pixel')
    return reward.type === 'badge' ? preferences.badge !== false : preferences[reward.type] === reward.value
  }

  // Açılmamış (mühürlü) ödül var mı? Salon kartında "YENİ" rozeti yakar.
  const sealedCount = REWARDS.filter(
    (r) => isUnlocked(unlockStreak, r.days) && !claimed.has(r.id) && !isActive(r),
  ).length

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">Seri & Ödüller</div>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-text">İlerleme</h1>
      </div>

      {/* Hero — streak: nötr kart, tepeden süzülen altın ışık */}
      <div
        className="relative overflow-hidden rounded-3xl border border-white/[0.06] p-5"
        style={{
          background: 'radial-gradient(120% 90% at 50% 0%, rgba(242,169,59,0.11), var(--color-surface) 72%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-4">
          {pixelUi ? (
            <span className="pixel-flicker" style={{ filter: 'drop-shadow(0 0 10px rgba(242,169,59,0.5))' }}>
              <PixelFlame size={42} />
            </span>
          ) : (
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-5xl"
              style={{ filter: 'drop-shadow(0 0 10px rgba(242,169,59,0.5))' }}
            >
              🔥
            </motion.div>
          )}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[40px] font-bold leading-none tabular-nums tracking-tight text-text">{streak}</span>
              <span className="text-base text-text-muted">gün</span>
            </div>
            <div className="mt-1.5 text-xs text-text-muted">üst üste · en uzun {longest} gün</div>
          </div>
        </div>

        {nextReward ? (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-text-muted">Sıradaki: {nextReward.title}</span>
              <span className="font-semibold tabular-nums" style={{ color: GOLD }}>
                {nextReward.days - streak} gün
              </span>
            </div>
            <div className="bar-track h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                className="bar-fill h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #F2A93B, #F2C94C)',
                  boxShadow: '0 0 8px rgba(242,169,59,0.45)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${nextProgress}%` }}
                transition={{ duration: 0.8, ease: [0.34, 1.1, 0.64, 1] }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-white/[0.04] px-3 py-2 text-center text-xs" style={{ color: GOLD }}>
            🎉 Tüm ödülleri açtın!
          </div>
        )}
      </div>

      {/* Şeref Salonu — onur plaketi: defne dalları arasında madalyon */}
      <Link
        to="/salon"
        className="btn-row relative block overflow-hidden rounded-3xl border"
        style={{
          borderColor: 'rgba(242,169,59,0.32)',
          background:
            'radial-gradient(130% 120% at 50% -20%, rgba(242,169,59,0.17), var(--color-surface) 58%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 40%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* pervaz — çifte altın hat */}
        <span className="absolute inset-x-4 top-2 block h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />
        <span className="absolute inset-x-10 top-[11px] block h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}33, transparent)` }} />
        <span className="absolute inset-x-4 bottom-2 block h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />
        <span className="absolute inset-x-10 bottom-[11px] block h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}33, transparent)` }} />

        <span
          className="medal-sheen pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.09) 50%, transparent 58%)',
            animationDelay: '1.4s',
          }}
        />

        <span className="flex items-center gap-3.5 px-4 py-5">
          {/* defne çelengi içinde madalyon */}
          <span className="relative flex h-12 w-14 shrink-0 items-center justify-center">
            <span className="absolute left-0"><Laurel size={30} /></span>
            <span className="absolute right-0"><Laurel size={30} flip /></span>
            <motion.span
              className="relative flex h-8 w-8 items-center justify-center rounded-full"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: `radial-gradient(circle at 36% 30%, #F8D68A, ${GOLD} 55%, #B8791C)`,
                border: '1px solid rgba(0,0,0,0.35)',
                boxShadow: `0 0 16px ${GOLD}4D, inset 0 1px 0 rgba(255,255,255,0.5)`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path
                  d="M12 3l2.2 5.3 5.8.5-4.4 3.8 1.3 5.6L12 15.2 7.1 18.2l1.3-5.6L4 8.8l5.8-.5z"
                  fill="#5C3D08"
                />
              </svg>
            </motion.span>
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span
                className="text-[15px] font-bold uppercase tracking-[0.16em]"
                style={{
                  backgroundImage: `linear-gradient(180deg, #F8DFA3, ${GOLD} 60%, #C98A24)`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))',
                }}
              >
                Şeref Salonu
              </span>
              {sealedCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="medal-pulse rounded-full px-1.5 py-0.5 text-[8px] font-bold text-black"
                  style={{ backgroundColor: GOLD }}
                >
                  YENİ
                </motion.span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
              Seri Ödülleri Koleksiyonu
            </span>
          </span>

          {/* sayaç — çifte halkalı nişan */}
          <span
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums"
            style={{
              border: `1.5px solid ${GOLD}59`,
              background: `radial-gradient(circle at 38% 30%, ${GOLD}26, ${GOLD}0a)`,
              color: GOLD,
            }}
          >
            <span className="absolute inset-[3px] rounded-full" style={{ border: `1px solid ${GOLD}33` }} />
            {unlockedCount}/{REWARDS.length}
          </span>
        </span>
      </Link>

      {/* Arkadaş Ligi — rekabet buradan açılır */}
      <Link
        to="/lig"
        className="btn-row relative flex items-center gap-3.5 overflow-hidden rounded-3xl border p-4"
        style={{
          borderColor: 'rgba(242,169,59,0.28)',
          background: 'radial-gradient(120% 100% at 0% 50%, rgba(242,169,59,0.12), var(--color-surface) 72%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* süzülen ışık taraması */}
        <span
          className="medal-sheen pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.10) 50%, transparent 58%)',
          }}
        />
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: 'rgba(242,169,59,0.13)', border: '1px solid rgba(242,169,59,0.35)' }}
        >
          <TrophyIcon isActive />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-text">Arkadaş Ligi</span>
          <span className="block truncate text-xs text-text-muted">Arkadaşlarınla yarış — seri, puan ve rozetler</span>
        </span>
        <span className="shrink-0 text-lg text-text-muted">›</span>
      </Link>

      {/* Vitrin — mağaza girişi: dönen ışık çerçevesi + mini tente */}
      <Link to="/vitrin" className="vitrin-frame btn-row relative block overflow-hidden rounded-3xl">
        <span className="vitrin-awning block h-[7px]" />
        <span className="vitrin-scallop block h-[7px] opacity-90" />
        <span className="flex items-center gap-3.5 p-4 pt-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(160deg, rgba(242,201,76,0.18), rgba(167,139,250,0.1))',
              border: '1px solid rgba(242,201,76,0.35)',
              boxShadow: '0 0 14px rgba(242,201,76,0.2)',
            }}
          >
            <span className="text-xl">🛍️</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span
                className="text-sm font-bold uppercase tracking-[0.18em]"
                style={{
                  backgroundImage: 'linear-gradient(180deg, #F2C94C, #B8801F)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Vitrin
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em]"
                style={{ backgroundColor: 'rgba(167,139,250,0.18)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.4)' }}
              >
                Yeni
              </span>
            </span>
            <span className="block truncate text-xs text-text-muted">Halkalar, zeminler, prestij — Plaka'yla kuşan</span>
          </span>
          <span
            className="inline-flex shrink-0"
            style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.5))' }}
            title={`${scoopBalance(preferences)} Plaka`}
          >
            <PlateIcon size={40} value={scoopBalance(preferences)} />
          </span>
        </span>
      </Link>

      {/* Streak kurtarıcıları */}
      <div className="px-1 pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          Streak Kurtarıcıları
        </span>
      </div>
      <StreakFreezeCard profile={profile} refreshProfile={refreshProfile} />

      <p className="px-1 pt-1 text-center text-xs text-text-muted">
        Her gün kayıt tutarak serini sürdür, yeni ödüller yolda. ✨
      </p>
    </div>
  )
}
