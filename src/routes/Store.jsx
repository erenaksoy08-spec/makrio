import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import BackButton from '../components/BackButton'
import PlateIcon from '../components/PlateIcon'
import { STORE_ITEMS, CURRENCY, scoopBalance, ownsItem, GOLD_NAME_STYLE } from '../lib/store'

// Vitrin'in kendi kimliği — uygulama temasından bağımsız gece butiği paleti.
const GOLD = '#E8C15A'
const GOLD_DEEP = '#B8871F'
const IVORY = '#EDE8DB'
const MUTED = '#97907F'
const CASE_BG = 'linear-gradient(165deg, #171320, #0c0a12 70%)'
const HAIRLINE = 'rgba(232,193,90,0.4)'

function rand(min, max) {
  return min + Math.random() * (max - min)
}

// Sergi kasası köşe işlemeleri — mücevher kutusu hissi.
function Corners() {
  const base = 'pointer-events-none absolute h-3 w-3'
  const b = `1px solid ${HAIRLINE}`
  return (
    <>
      <span className={`${base} left-2 top-2`} style={{ borderLeft: b, borderTop: b }} />
      <span className={`${base} right-2 top-2`} style={{ borderRight: b, borderTop: b }} />
      <span className={`${base} bottom-2 left-2`} style={{ borderLeft: b, borderBottom: b }} />
      <span className={`${base} bottom-2 right-2`} style={{ borderRight: b, borderBottom: b }} />
    </>
  )
}

// Uygula düğmesi — çifte altın hatlı, mühür gibi. Butiğe özel; uygulamanın
// başka hiçbir yerinde bu dil kullanılmaz.
function ApplyButton({ applied, disabled, onClick }) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      className="btn-chip relative overflow-hidden rounded-full px-4 py-2 text-[9px] font-bold uppercase tracking-[0.22em] disabled:opacity-50"
      style={
        applied
          ? {
              background: `linear-gradient(135deg, #F6E3A6, ${GOLD} 45%, ${GOLD_DEEP})`,
              color: '#171106',
              border: '1px solid rgba(0,0,0,0.3)',
              boxShadow: `0 4px 16px ${GOLD}45, inset 0 1px 0 rgba(255,255,255,0.45)`,
            }
          : {
              border: `1px solid ${HAIRLINE}`,
              color: GOLD,
              background: 'rgba(232,193,90,0.04)',
            }
      }
    >
      {/* çifte hat — iç çerçeve */}
      <span
        className="pointer-events-none absolute inset-[3px] rounded-full"
        style={{ border: applied ? '1px solid rgba(23,17,6,0.3)' : '1px solid rgba(232,193,90,0.22)' }}
      />
      {!applied && (
        <span
          className="medal-sheen pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(115deg, transparent 40%, rgba(232,193,90,0.28) 50%, transparent 60%)',
          }}
        />
      )}
      <span className="relative flex items-center gap-1.5">
        {applied ? (
          <>
            Uygulandı<span style={{ fontSize: 8, lineHeight: 1 }}>✦</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 6.5, lineHeight: 1 }}>◆</span>
            Uygula
            <span style={{ fontSize: 6.5, lineHeight: 1 }}>◆</span>
          </>
        )}
      </span>
    </motion.button>
  )
}

// Vitrin camı önizlemeleri — fanus içinde mini sahneler.
function ItemPreview({ item, firstName }) {
  if (item.id === 'square-ring') {
    return (
      <svg width="40" height="40" viewBox="0 0 64 64">
        <rect x="8" y="8" width="48" height="48" rx="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
        <rect
          x="8"
          y="8"
          width="48"
          height="48"
          rx="14"
          fill="none"
          stroke={item.accent}
          strokeWidth="7"
          pathLength="100"
          strokeDasharray="72 100"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${item.accent}66)` }}
        />
      </svg>
    )
  }
  if (item.id === 'bg-pack') {
    return (
      <div className="grid grid-cols-2 gap-1">
        {item.variants.map((v) => (
          <span
            key={v.value}
            className="h-4 w-4 rounded-[5px]"
            style={{
              backgroundColor: v.value,
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
    )
  }
  if (item.id === 'gold-name') {
    return (
      <span className="px-0.5 text-center text-[13px] font-bold leading-tight" style={GOLD_NAME_STYLE}>
        {firstName}
      </span>
    )
  }
  return null
}

export default function Store() {
  const { profile, refreshProfile } = useAuth()
  const preferences = profile?.preferences ?? {}
  const balance = scoopBalance(preferences)
  const firstName = profile?.name?.trim().split(/\s+/)[0] || 'Sen'

  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState(null) // iki adımlı satın alma onayı
  const [deniedId, setDeniedId] = useState(null) // yetersiz bakiye sarsıntısı
  const [justBought, setJustBought] = useState(null)

  // Salonda süzülen altın toz zerreleri.
  const dust = useMemo(
    () =>
      Array.from({ length: 14 }, () => ({
        left: rand(4, 96),
        bottom: rand(-8, 45),
        size: rand(1.6, 3.6),
        dur: rand(5, 9),
        delay: rand(0, 7),
      })),
    [],
  )

  async function applyPrefs(patch) {
    setSaving(true)
    await supabase.rpc('update_preferences', { p_preferences: { ...preferences, ...patch } })
    await refreshProfile()
    setSaving(false)
  }

  async function buy(item) {
    if (saving) return
    if (balance < item.price) {
      setDeniedId(item.id)
      navigator.vibrate?.([30, 40, 30])
      setTimeout(() => setDeniedId(null), 700)
      return
    }
    if (confirmId !== item.id) {
      setConfirmId(item.id)
      setTimeout(() => setConfirmId((c) => (c === item.id ? null : c)), 3500)
      return
    }
    setConfirmId(null)
    navigator.vibrate?.([14, 40, 20])
    setJustBought(item.id)
    setTimeout(() => setJustBought(null), 1600)
    await applyPrefs({
      scoops: balance - item.price,
      ownedItems: [...new Set([...(preferences.ownedItems ?? []), item.id])],
    })
  }

  async function toggleEquip(item, value) {
    if (saving) return
    const target = value ?? item.prefValue
    const on = preferences[item.prefKey] === target
    if (!on) navigator.vibrate?.([12, 30, 16])
    await applyPrefs({ [item.prefKey]: on ? null : target })
  }

  return (
    <div className="relative mx-auto max-w-md space-y-5 px-4 py-6">
      {/* butik salonu — sayfaya özel gece zemini + altın toz */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: 'radial-gradient(130% 75% at 50% 0%, #1a142e, #0c0a14 55%, #07060c 100%)' }}
      >
        {dust.map((d, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${d.left}%`,
              bottom: `${d.bottom}%`,
              width: d.size,
              height: d.size,
              backgroundColor: GOLD,
              boxShadow: `0 0 6px ${GOLD}`,
              animation: `dust-float ${d.dur}s linear ${d.delay}s infinite`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <BackButton to="/ilerleme" label="İlerleme" />
        {/* kasa — bakiye plakası: sayı, ağırlık damgası gibi ortasında */}
        <AnimatePresence mode="popLayout">
          <motion.span
            key={balance}
            initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            style={{ display: 'inline-flex', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.55))' }}
            title={`${balance} ${CURRENCY}`}
          >
            <PlateIcon size={52} value={balance} />
          </motion.span>
        </AnimatePresence>
      </div>

      {/* butik tabelası */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="pb-1 pt-2 text-center"
      >
        <div className="mx-auto flex max-w-[260px] items-center gap-3">
          <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${HAIRLINE})` }} />
          <span style={{ color: GOLD, fontSize: 9 }}>◆</span>
          <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${HAIRLINE}, transparent)` }} />
        </div>
        <h1
          className="mt-3 text-[30px] font-bold uppercase leading-none tracking-[0.42em]"
          style={{
            backgroundImage: `linear-gradient(180deg, #F6E3A6, ${GOLD} 55%, ${GOLD_DEEP})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textIndent: '0.42em',
            filter: 'drop-shadow(0 2px 10px rgba(232,193,90,0.25))',
          }}
        >
          Vitrin
        </h1>
        <p className="mt-2 text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
          SEÇKİN PARÇALAR · {CURRENCY.toUpperCase()} İLE
        </p>
        <div className="mx-auto mt-3 flex max-w-[180px] items-center gap-3">
          <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${HAIRLINE})` }} />
          <span style={{ color: GOLD, fontSize: 7 }}>◆</span>
          <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${HAIRLINE}, transparent)` }} />
        </div>
      </motion.div>

      {/* sergi kasaları */}
      <div className="space-y-3">
        {STORE_ITEMS.map((item, idx) => {
          const owned = ownsItem(preferences, item.id)
          const denied = deniedId === item.id
          const confirming = confirmId === item.id
          const celebrating = justBought === item.id
          const equippedValue = preferences[item.prefKey]
          const equipped = item.variants
            ? item.variants.some((v) => v.value === equippedValue)
            : equippedValue === item.prefValue
          const a = item.accent

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.1, duration: 0.45, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-2xl p-3"
              style={{
                background: CASE_BG,
                border: '1px solid rgba(232,193,90,0.18)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 28px rgba(0,0,0,0.45)',
              }}
            >
              <Corners />

              {/* camda süzülen ışık */}
              <span
                className="medal-sheen pointer-events-none absolute inset-0"
                style={{
                  background: 'linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.07) 50%, transparent 58%)',
                  animationDelay: `${idx * 1.3}s`,
                }}
              />

              {/* satın alma kutlaması */}
              <AnimatePresence>
                {celebrating && (
                  <motion.div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${GOLD}33, transparent 65%)` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4 }}
                  />
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3.5">
                {/* fanus + kaide */}
                <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center">
                  <span
                    className="absolute inset-1 rounded-full"
                    style={{ background: `radial-gradient(circle at 50% 42%, ${a}26, transparent 70%)` }}
                  />
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: `1px solid ${a}30`,
                      background: 'linear-gradient(170deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01) 55%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                  />
                  <motion.span
                    className="relative flex items-center justify-center"
                    animate={{ y: [0, -2.5, 0] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.5 }}
                  >
                    <ItemPreview item={item} firstName={firstName} />
                  </motion.span>
                  {/* kaide gölgesi */}
                  <span
                    className="absolute -bottom-0.5 h-1 w-8 rounded-full"
                    style={{ background: `${a}40`, filter: 'blur(2px)' }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[8px] font-bold uppercase tracking-[0.26em]" style={{ color: `${a}CC` }}>
                    {item.category}
                  </div>
                  <h2 className="mt-0.5 text-[13.5px] font-semibold leading-snug" style={{ color: IVORY }}>
                    {item.title}
                  </h2>
                  <p className="mt-0.5 text-[10.5px] leading-relaxed" style={{ color: MUTED }}>
                    {item.description}
                  </p>
                </div>

                {/* etiket + aksiyon */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {owned ? (
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[13px]"
                      style={{
                        border: `1.4px dashed ${HAIRLINE}`,
                        color: GOLD,
                        transform: 'rotate(-10deg)',
                      }}
                      title="Koleksiyonunda"
                    >
                      ✓
                    </span>
                  ) : (
                    <span
                      className="flex items-center gap-1 rounded-md px-2 py-1"
                      style={{
                        border: `1px solid ${HAIRLINE}`,
                        background: 'linear-gradient(135deg, rgba(232,193,90,0.14), rgba(232,193,90,0.03))',
                      }}
                    >
                      <PlateIcon size={14} />
                      <span className="text-[11.5px] font-bold tabular-nums" style={{ color: GOLD }}>
                        {item.price}
                      </span>
                    </span>
                  )}

                  {owned ? (
                    !item.variants && (
                      <ApplyButton applied={equipped} disabled={saving} onClick={() => toggleEquip(item)} />
                    )
                  ) : (
                    <motion.button
                      type="button"
                      disabled={saving}
                      onClick={() => buy(item)}
                      animate={denied ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
                      transition={{ duration: 0.45 }}
                      whileTap={{ scale: 0.94 }}
                      className="btn-primary rounded-lg px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] disabled:opacity-50"
                      style={
                        denied
                          ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.55)', color: '#EF6060' }
                          : confirming
                            ? {
                                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
                                color: '#14100a',
                                boxShadow: `0 5px 16px ${GOLD}40`,
                              }
                            : { border: `1px solid ${HAIRLINE}`, color: GOLD, background: 'rgba(232,193,90,0.05)' }
                      }
                    >
                      {denied ? 'Yetersiz' : confirming ? `Onayla · ${item.price}` : 'Satın Al'}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* renk paketi: sahiplikte renk seçici raf */}
              {owned && item.variants && (
                <div
                  className="mt-3 flex items-center gap-2.5 border-t pt-3"
                  style={{ borderColor: 'rgba(232,193,90,0.12)' }}
                >
                  {item.variants.map((v) => {
                    const on = equippedValue === v.value
                    return (
                      <button
                        key={v.value}
                        type="button"
                        disabled={saving}
                        onClick={() => toggleEquip(item, v.value)}
                        className="btn-chip flex flex-col items-center gap-1 disabled:opacity-50"
                        title={v.label}
                      >
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px]"
                          style={{
                            backgroundColor: v.value,
                            border: on ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.16)',
                            boxShadow: on ? `0 0 9px ${GOLD}59` : 'inset 0 1px 0 rgba(255,255,255,0.08)',
                            color: GOLD,
                          }}
                        >
                          {on ? '✓' : ''}
                        </span>
                        <span className="text-[8px] tracking-wide" style={{ color: on ? GOLD : MUTED }}>
                          {v.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <p className="px-1 pt-1 text-center text-[10px] tracking-[0.14em]" style={{ color: MUTED }}>
        YENİ PARÇALAR YOLDA — {CURRENCY.toUpperCase()} KAZANMA YOLLARI ÇOK YAKINDA 🏋️
      </p>
    </div>
  )
}
