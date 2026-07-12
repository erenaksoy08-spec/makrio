import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { REWARDS, isUnlocked, unlockStreakFrom } from '../lib/rewards'
import { PixelFlame } from '../components/pixelSprites'
import { BlokTorch, BlokScroll, BlokMedal, BlokTrophy, BlokChest, BlokPouch } from '../components/blokSprites'
import StreakFreezeCard from '../components/StreakFreezeCard'
import TrophyIcon from '../components/TrophyIcon'
import PlateBalance from '../components/PlateBalance'
import Laurel from '../components/Laurel'
import { scoopBalance } from '../lib/store'
import { readyQuestCount } from '../lib/quests'
import { inventoryCounts } from '../lib/inventory'
import { todayStr } from '../lib/date'

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
  const blokUi = preferences.theme === 'blok'
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

  // Toplanmayı bekleyen görev sayısı (arkadaş görevleri hariç, yerel hesap).
  const questsReady = readyQuestCount(profile, todayStr())

  const bag = inventoryCounts(preferences, unlockStreak)

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">Seri & Ödüller</div>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-text">İlerleme</h1>
      </div>

      {/* Üst sıra — solda seri közü, sağda envanter çantası */}
      <div className="grid grid-cols-2 items-stretch gap-3">
        {/* Seri — sade köz kartı; ince altın hat, ateş közü halkası */}
        <div
          className="relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.07] p-4"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.03), transparent 45%), radial-gradient(110% 85% at 18% 0%, rgba(242,120,40,0.1), var(--color-surface) 62%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 6px 20px rgba(0,0,0,0.25)',
          }}
        >
          <span
            className="pointer-events-none absolute inset-x-5 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(242,169,59,0.5), transparent)' }}
          />
          <div className="flex items-center gap-2.5">
            {/* köz halkası — alev yumuşak bir sıcaklık çemberinde */}
            <span
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{
                border: '1px solid rgba(242,140,60,0.28)',
                background: 'radial-gradient(circle at 50% 38%, rgba(242,120,40,0.16), rgba(242,120,40,0.02) 72%)',
                boxShadow: '0 0 18px rgba(242,110,40,0.16), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {blokUi ? (
                <span className="pixel-flicker" style={{ filter: 'drop-shadow(0 0 8px rgba(242,169,59,0.45))' }}>
                  <BlokTorch size={19} />
                </span>
              ) : pixelUi ? (
                <span className="pixel-flicker" style={{ filter: 'drop-shadow(0 0 8px rgba(242,169,59,0.45))' }}>
                  <PixelFlame size={24} />
                </span>
              ) : (
                <motion.span
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-[21px] leading-none"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(242,169,59,0.45))' }}
                >
                  🔥
                </motion.span>
              )}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[30px] font-bold leading-none tabular-nums tracking-tight text-text">{streak}</span>
              <span className="text-sm text-text-muted">gün</span>
            </div>
          </div>
          <div className="mt-2.5 w-fit rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            En uzun · {longest} gün
          </div>

          {nextReward ? (
            <div className="mt-auto pt-3">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="truncate text-text-muted">Sıradaki ödül</span>
                <span className="shrink-0 font-semibold tabular-nums" style={{ color: GOLD }}>
                  {nextReward.days - streak}g
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
            <div className="mt-auto pt-3">
              <div className="rounded-xl bg-white/[0.04] px-2 py-1.5 text-center text-[10px]" style={{ color: GOLD }}>
                🎉 Tüm ödüller açık
              </div>
            </div>
          )}
        </div>

        {/* Envanter — deri çanta: dikişli pervaz, dikey kese */}
        <Link
          to="/envanter"
          className="btn-row relative block overflow-hidden rounded-3xl p-[3px]"
          style={{
            background: 'linear-gradient(180deg, #2b1d0d, #171007)',
            border: '1px solid rgba(201,161,90,0.32)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 18px rgba(0,0,0,0.3)',
          }}
        >
          <span
            className="flex h-full flex-col items-center justify-center gap-2 rounded-[21px] px-2 py-3 text-center"
            style={{ border: '1.5px dashed rgba(201,161,90,0.32)' }}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
              style={{
                background: 'linear-gradient(180deg, #100b06, #221809)',
                border: '1px solid rgba(201,161,90,0.3)',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
              }}
            >
              {blokUi ? <BlokPouch size={24} /> : '🎒'}
            </span>
            <span
              className="block text-[13px] font-bold uppercase tracking-[0.18em]"
              style={{
                backgroundImage: 'linear-gradient(180deg, #EFD9A8, #C9A15A 58%, #8A6528)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Envanter
            </span>
            <span
              className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold tabular-nums"
              style={{ borderColor: 'rgba(201,161,90,0.4)', backgroundColor: 'rgba(201,161,90,0.08)', color: '#C9A15A' }}
            >
              {bag.owned}/{bag.total} eşya
            </span>
          </span>
        </Link>
      </div>

      {/* Görevler — büyülü gece kapısı: menekşe bulutsu, yıldızlar, süzülen tomar */}
      <Link
        to="/gorevler"
        className="btn-row relative block overflow-hidden rounded-3xl"
        style={{
          border: `1px solid ${questsReady > 0 ? 'rgba(139,92,246,0.55)' : 'rgba(139,92,246,0.35)'}`,
          background:
            'radial-gradient(120% 130% at 85% -10%, rgba(139,92,246,0.3), transparent 55%), radial-gradient(100% 120% at 0% 100%, rgba(242,201,76,0.08), transparent 50%), linear-gradient(180deg, #171028, #0e0a1a)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 24px rgba(20,10,45,0.45)',
        }}
      >
        {/* yıldız serpintisi */}
        {[
          [12, 18, 0], [30, 8, 1.1], [46, 22, 0.4], [62, 10, 1.8], [76, 26, 0.8],
          [88, 14, 1.4], [55, 78, 0.2], [82, 68, 1.0], [38, 85, 1.6], [93, 45, 0.6],
        ].map(([x, y, d], i) => (
          <span
            key={i}
            className="quest-twinkle pointer-events-none absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: i % 3 === 0 ? 2.5 : 1.5,
              height: i % 3 === 0 ? 2.5 : 1.5,
              backgroundColor: i % 4 === 0 ? '#F2C94C' : '#C4B5FD',
              animationDelay: `${d}s`,
            }}
          />
        ))}
        {/* aurora perdesi */}
        <span
          className="pointer-events-none absolute -top-8 left-1/4 h-24 w-2/3 rotate-[8deg]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.22), rgba(242,201,76,0.1), transparent)',
            filter: 'blur(14px)',
          }}
        />
        <span
          className="medal-sheen pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(115deg, transparent 42%, rgba(196,181,253,0.1) 50%, transparent 58%)',
            animationDelay: '0.7s',
          }}
        />

        <span className="relative flex items-center gap-3.5 p-4">
          {/* süzülen tomar — büyülü hale içinde */}
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <span
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(circle at 50% 40%, rgba(139,92,246,0.35), rgba(139,92,246,0.06) 70%)',
                border: '1px solid rgba(139,92,246,0.45)',
                boxShadow: '0 0 18px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            />
            <motion.span
              className="relative text-[22px]"
              animate={{ y: [0, -2.5, 0], rotate: [0, -3, 3, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(242,201,76,0.45))' }}
            >
              {blokUi ? <BlokScroll size={26} /> : '📜'}
            </motion.span>
            <span className="pointer-events-none absolute -right-1 -top-1 text-[10px]" style={{ color: '#F2C94C' }}>
              ✦
            </span>
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span
                className="text-sm font-bold uppercase tracking-[0.18em]"
                style={{
                  backgroundImage: 'linear-gradient(92deg, #DCD3F5, #A78BFA 55%, #F2C94C)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Görevler
              </span>
              {questsReady > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="medal-pulse rounded-full px-1.5 py-0.5 text-[8px] font-bold text-black"
                  style={{ backgroundColor: GOLD }}
                >
                  {questsReady} HAZIR
                </motion.span>
              )}
            </span>
            <span className="block truncate text-xs" style={{ color: '#8E86A3' }}>
              Tamamla, Plaka kazan — günlük ve başarımlar
            </span>
          </span>
          <span className="shrink-0 text-lg" style={{ color: 'rgba(196,181,253,0.6)' }}>
            ›
          </span>
        </span>
      </Link>

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
              style={
                blokUi
                  ? { filter: `drop-shadow(0 0 10px ${GOLD}59)` }
                  : {
                      background: `radial-gradient(circle at 36% 30%, #F8D68A, ${GOLD} 55%, #B8791C)`,
                      border: '1px solid rgba(0,0,0,0.35)',
                      boxShadow: `0 0 16px ${GOLD}4D, inset 0 1px 0 rgba(255,255,255,0.5)`,
                    }
              }
            >
              {blokUi ? (
                <BlokMedal size={26} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path
                    d="M12 3l2.2 5.3 5.8.5-4.4 3.8 1.3 5.6L12 15.2 7.1 18.2l1.3-5.6L4 8.8l5.8-.5z"
                    fill="#5C3D08"
                  />
                </svg>
              )}
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
            <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: '#A08A5F' }}>
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

      {/* Arkadaş Ligi — sade arena kartı: serin çelik ton, mini podyum */}
      <Link
        to="/lig"
        className="btn-row relative flex items-center gap-3.5 overflow-hidden rounded-3xl border p-4"
        style={{
          borderColor: 'rgba(148,180,255,0.16)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.03), transparent 40%), radial-gradient(120% 130% at 100% 0%, rgba(96,140,250,0.09), var(--color-surface) 62%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 20px rgba(0,0,0,0.22)',
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(148,180,255,0.35), transparent)' }}
        />
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{
            border: '1px solid rgba(242,169,59,0.3)',
            background: 'radial-gradient(circle at 50% 38%, rgba(242,169,59,0.14), rgba(242,169,59,0.02) 72%)',
            boxShadow: '0 0 16px rgba(242,169,59,0.12)',
          }}
        >
          {blokUi ? <BlokTrophy size={22} /> : <TrophyIcon isActive />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-text">Arkadaş Ligi</span>
          <span className="block truncate text-xs text-text-muted">Arkadaşlarınla yarış — seri, puan ve rozetler</span>
        </span>
        {/* mini podyum — 2 · 1 · 3 */}
        <span className="flex shrink-0 items-end gap-[3px] pb-0.5" aria-hidden>
          <span className="w-[7px] rounded-t-[3px]" style={{ height: 13, background: 'linear-gradient(180deg, rgba(200,210,225,0.55), rgba(200,210,225,0.15))' }} />
          <span className="w-[7px] rounded-t-[3px]" style={{ height: 20, background: 'linear-gradient(180deg, #F2C94C, rgba(242,169,59,0.25))', boxShadow: '0 0 8px rgba(242,201,76,0.35)' }} />
          <span className="w-[7px] rounded-t-[3px]" style={{ height: 9, background: 'linear-gradient(180deg, rgba(224,163,78,0.55), rgba(224,163,78,0.15))' }} />
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
            {blokUi ? <BlokChest size={24} /> : <span className="text-xl">🛍️</span>}
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
            <span className="block truncate text-xs" style={{ color: '#97907F' }}>Halkalar, zeminler, prestij — Plaka'yla kuşan</span>
          </span>
          <span className="shrink-0">
            <PlateBalance value={scoopBalance(preferences)} size="sm" />
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
