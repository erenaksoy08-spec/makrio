import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { REWARDS, isUnlocked, unlockStreakFrom } from '../lib/rewards'
import RewardMedallion from '../components/RewardMedallion'
import RewardCeremony from '../components/RewardCeremony'
import BackButton from '../components/BackButton'
import Laurel from '../components/Laurel'

// Şeref Salonu — seri ödüllerinin sergilendiği madalyon koleksiyonu.
const GOLD = '#F2A93B'

// Koleksiyon karosu — madalyon + gün etiketi. state: 'locked' | 'sealed' | 'open'
function RewardTile({ reward, state, index, active, progress, onClick }) {
  const a = reward.accent
  const sealed = state === 'sealed'
  const open = state === 'open'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.7, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 300, damping: 20 }}
      whileTap={{ scale: 0.92 }}
      className="relative flex flex-col items-center gap-2 rounded-2xl border py-4"
      style={{
        borderColor: open ? `${a}40` : sealed ? '#F2A93B4D' : 'rgba(255,255,255,0.06)',
        background: open
          ? `radial-gradient(90% 70% at 50% 0%, ${a}1c, var(--color-surface) 78%)`
          : sealed
            ? 'radial-gradient(90% 70% at 50% 0%, rgba(242,169,59,0.14), var(--color-surface) 78%)'
            : 'var(--color-surface)',
        boxShadow: open || sealed ? 'inset 0 1px 0 rgba(255,255,255,0.07)' : 'none',
      }}
    >
      {sealed && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.07 + 0.3, type: 'spring', stiffness: 400, damping: 15 }}
          className="absolute -top-1.5 right-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-black"
          style={{ backgroundColor: '#F2A93B' }}
        >
          YENİ
        </motion.span>
      )}

      <div className={`relative ${sealed ? 'medal-pulse rounded-full' : ''}`}>
        <RewardMedallion reward={reward} state={state} size={62} progress={progress} sheenDelay={index * 0.7} />
        {active && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full text-[9px] font-bold text-black"
            style={{ backgroundColor: a, border: '2px solid var(--color-surface)', width: 18, height: 18 }}
          >
            ✓
          </span>
        )}
      </div>

      <span
        className="text-[11px] font-semibold tabular-nums"
        style={{ color: open ? a : sealed ? '#F2A93B' : 'var(--color-text-muted)' }}
      >
        {sealed ? 'Aç!' : `${reward.days} gün`}
      </span>
    </motion.button>
  )
}

export default function Hall() {
  const { profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [ceremony, setCeremony] = useState(null) // { reward, mode }

  const unlockStreak = unlockStreakFrom(profile)
  const preferences = profile?.preferences ?? {}
  const claimed = new Set(preferences.claimedRewards ?? [])
  const unlockedCount = REWARDS.filter((r) => isUnlocked(unlockStreak, r.days)).length

  function isActive(reward) {
    if (reward.duo) return reward.duo.some((d) => preferences[d.key] === d.value)
    if (reward.id === 'pixel-theme') return String(preferences.theme ?? '').startsWith('pixel')
    return reward.type === 'badge' ? preferences.badge !== false : preferences[reward.type] === reward.value
  }

  // 'locked' → henüz kazanılmadı; 'sealed' → kazanıldı ama hiç açılmadı; 'open' → koleksiyonda.
  function stateOf(reward) {
    if (!isUnlocked(unlockStreak, reward.days)) return 'locked'
    return claimed.has(reward.id) || isActive(reward) ? 'open' : 'sealed'
  }

  async function applyPrefs(patch, { silent = false } = {}) {
    if (!silent) setSaving(true)
    await supabase.rpc('update_preferences', { p_preferences: { ...preferences, ...patch } })
    await refreshProfile()
    if (!silent) setSaving(false)
  }

  function withClaim(id) {
    return [...new Set([...(preferences.claimedRewards ?? []), id])]
  }

  function openCeremony(reward) {
    const state = stateOf(reward)
    setCeremony({ reward, mode: state === 'locked' ? 'locked' : state === 'sealed' ? 'reveal' : 'detail' })
    if (state === 'sealed') {
      navigator.vibrate?.(10)
      // Mühür kırıldı: bir daha "yeni" gösterme (arka planda sessizce kaydet).
      applyPrefs({ claimedRewards: withClaim(reward.id) }, { silent: true })
    }
  }

  async function handleApply(reward, variant) {
    const patch = { claimedRewards: withClaim(reward.id) }
    if (reward.duo && variant && typeof variant === 'object') {
      // Paket içi hediye: seçiliyse kapat, değilse aç.
      const turnOff = preferences[variant.key] === variant.value
      patch[variant.key] = turnOff ? null : variant.value
      if (!turnOff) navigator.vibrate?.([12, 30, 16])
      await applyPrefs(patch)
      return
    }
    if (reward.id === 'pixel-theme' && variant) {
      // Varyant seçimi: seçili olana tekrar dokununca tema kapanır.
      const turnOff = preferences.theme === variant
      patch.theme = turnOff ? null : variant
      if (!turnOff) navigator.vibrate?.([12, 30, 16])
    } else {
      const active = isActive(reward)
      if (reward.type === 'badge') patch.badge = active ? false : true
      else patch[reward.type] = active ? null : reward.value
      if (!active) navigator.vibrate?.([12, 30, 16])
    }
    await applyPrefs(patch)
  }

  return (
    <div className="relative mx-auto max-w-md space-y-5 px-4 py-6">
      {/* salon zemini — tepeden vuran onur ışığı, bronz karanlık */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 65% at 50% 0%, #241a0e, #100c07 55%, #090705 100%)',
        }}
      >
        {/* tepe spot huzmesi */}
        <span
          className="absolute inset-x-0 top-0 h-[45%]"
          style={{
            background: 'radial-gradient(60% 100% at 50% 0%, rgba(242,169,59,0.12), transparent 70%)',
          }}
        />
      </div>

      <BackButton to="/ilerleme" label="İlerleme" />

      {/* salon girişi — defne çelengi arasında yazıt */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="pb-1 pt-1 text-center"
      >
        <div className="flex items-center justify-center gap-2.5">
          <Laurel size={34} />
          <div>
            <h1
              className="text-[21px] font-bold uppercase leading-none tracking-[0.24em]"
              style={{
                backgroundImage: `linear-gradient(180deg, #F8DFA3, ${GOLD} 60%, #C98A24)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textIndent: '0.24em',
                filter: 'drop-shadow(0 2px 8px rgba(242,169,59,0.3))',
              }}
            >
              Şeref Salonu
            </h1>
            <p className="mt-1.5 text-[10px] tracking-[0.22em] text-text-muted">SERİ ÖDÜLLERİ KOLEKSİYONU</p>
          </div>
          <Laurel size={34} flip />
        </div>
        <div
          className="mx-auto mt-3.5 flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tabular-nums"
          style={{ borderColor: `${GOLD}40`, backgroundColor: `${GOLD}10`, color: GOLD }}
        >
          {unlockedCount}/{REWARDS.length} MADALYON AÇIK
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {REWARDS.map((reward, i) => {
          const state = stateOf(reward)
          return (
            <RewardTile
              key={reward.id}
              reward={reward}
              state={state}
              index={i}
              active={state === 'open' && isActive(reward)}
              progress={unlockStreak / reward.days}
              onClick={() => openCeremony(reward)}
            />
          )
        })}
      </div>

      {/* açıklama — bu madalyonların ne olduğu */}
      <div
        className="mt-1 rounded-2xl border px-4 py-3 text-center"
        style={{ borderColor: `${GOLD}26`, background: `${GOLD}0a` }}
      >
        <p className="text-xs leading-relaxed text-text">
          Her madalyon bir <span className="font-semibold" style={{ color: GOLD }}>seri ödülü</span>.
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
          Üst üste kayıt tuttukça serin uzar, yeni günlük eşiklerinde madalyonlar açılır. Her birine dokunup temanı,
          rengini ya da rozetini kuşan.
        </p>
      </div>

      {/* Seremoni — ödül açma / etkinleştirme */}
      <AnimatePresence>
        {ceremony && (
          <RewardCeremony
            key={ceremony.reward.id}
            reward={ceremony.reward}
            mode={ceremony.mode}
            streak={unlockStreak}
            active={isActive(ceremony.reward)}
            activeVariant={String(preferences.theme ?? '').startsWith('pixel') ? preferences.theme : null}
            activeValues={(ceremony.reward.duo ?? [])
              .filter((d) => preferences[d.key] === d.value)
              .map((d) => d.value)}
            saving={saving}
            onApply={(variant) => handleApply(ceremony.reward, variant)}
            onClose={() => setCeremony(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
