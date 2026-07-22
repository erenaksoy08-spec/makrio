import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { isGold } from '../lib/gold'
import GoldGate from '../components/GoldGate'
import BackButton from '../components/BackButton'
import PlateIcon from '../components/PlateIcon'
import PlateBalance from '../components/PlateBalance'
import { STORE_ITEMS, CURRENCY, scoopBalance, ownsItem, GOLD_NAME_STYLE } from '../lib/store'
import { t } from '../lib/i18n'

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

// Vitrin camı önizlemeleri — fanus içinde mini sahneler.
function ItemPreview({ item, firstName }) {
  if (item.id === 'blok-theme') {
    // Çim bloğu — izometrik mini küp, kenarları keskin piksel.
    return (
      <svg width="40" height="40" viewBox="0 0 40 40" shapeRendering="crispEdges">
        <polygon points="20,5 34,12 20,19 6,12" fill="#7CBD4B" />
        <polygon points="20,5 34,12 20,19 6,12" fill="none" stroke="#5E9838" strokeWidth="1" />
        <polygon points="6,12 20,19 20,35 6,28" fill="#8A5A32" />
        <polygon points="34,12 20,19 20,35 34,28" fill="#6E4526" />
        {/* toprak benekleri */}
        <rect x="10" y="20" width="3" height="3" fill="#75492A" />
        <rect x="14" y="26" width="3" height="3" fill="#9C6839" />
        <rect x="24" y="23" width="3" height="3" fill="#5C3A20" />
        <rect x="28" y="28" width="3" height="3" fill="#7D4F2C" />
        {/* çim ışıltısı */}
        <rect x="17" y="9" width="4" height="3" fill="#93D45F" />
      </svg>
    )
  }
  if (item.id === 'super-theme') {
    // Gökyüzü fanusu: bloklu bulut, kum zemin, ortada M sikkesi — yüz yok, karakter yok.
    return (
      <svg width="40" height="40" viewBox="0 0 40 40" shapeRendering="crispEdges">
        <rect x="2" y="2" width="36" height="36" fill="#4A8DE0" />
        {/* bloklu bulut */}
        <rect x="5" y="7" width="12" height="4" fill="#FFFFFF" />
        <rect x="8" y="4" width="7" height="3" fill="#FFFFFF" />
        {/* kum zemin */}
        <rect x="2" y="30" width="36" height="8" fill="#E8C878" />
        <rect x="2" y="30" width="36" height="2" fill="#C98A33" />
        {/* M sikkesi */}
        <rect x="15" y="14" width="10" height="12" fill="#E89A00" />
        <rect x="17" y="12" width="6" height="2" fill="#E89A00" />
        <rect x="17" y="26" width="6" height="2" fill="#E89A00" />
        <rect x="16" y="15" width="2" height="10" fill="#FFD766" />
        <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7A4A00">
          M
        </text>
      </svg>
    )
  }
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

// Vitrin Gold'a özel — free kullanıcı içerik yerine Gold kapısını görür.
export default function Store() {
  const { profile, profileLoading } = useAuth()
  const navigate = useNavigate()
  if (!profileLoading && !isGold(profile)) {
    return <GoldGate feature="store" onClose={() => navigate(-1)} />
  }
  if (profileLoading) return null
  return <StoreContent />
}

function StoreContent() {
  const { profile, refreshProfile } = useAuth()
  const preferences = profile?.preferences ?? {}
  const balance = scoopBalance(preferences)
  const firstName = profile?.name?.trim().split(/\s+/)[0] || t('Sen')

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
    // Yeni alınan ürün seçim bekler: hemen uygula ya da envantere gönder.
    setJustBought(item.id)
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
    <div className="isolate relative mx-auto max-w-md space-y-5 px-4 py-6">
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
        <BackButton to="/ilerleme" label={t('İlerleme')} />
        {/* kasa — oyun HUD'u bakiye sayacı */}
        <PlateBalance value={balance} />
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
          {t('Vitrin')}
        </h1>
        <p className="mt-2 text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
          {t('SEÇKİN PARÇALAR · {c} İLE', { c: t(CURRENCY).toUpperCase() })}
        </p>
        <div className="mx-auto mt-3 flex max-w-[180px] items-center gap-3">
          <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${HAIRLINE})` }} />
          <span style={{ color: GOLD, fontSize: 7 }}>◆</span>
          <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${HAIRLINE}, transparent)` }} />
        </div>
      </motion.div>

      {/* shop rafları — kompakt karolar (yeni ürünlere yer var) */}
      <div className="grid grid-cols-2 gap-3">
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
              transition={{ delay: 0.1 + idx * 0.08, duration: 0.4, ease: 'easeOut' }}
              className="relative flex flex-col items-center overflow-hidden rounded-2xl p-3 pb-3.5 text-center"
              style={{
                background: CASE_BG,
                border: `1px solid ${owned ? `${a}30` : 'rgba(232,193,90,0.18)'}`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 24px rgba(0,0,0,0.4)',
              }}
            >
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

              {/* fırsat etiketi — indirim mührü */}
              {item.deal && !owned && (
                <motion.span
                  initial={{ scale: 0, rotate: -18 }}
                  animate={{ scale: 1, rotate: -10 }}
                  transition={{ delay: 0.35 + idx * 0.08, type: 'spring', stiffness: 380, damping: 14 }}
                  className="absolute left-2 top-2 rounded-[4px] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em]"
                  style={{
                    background: 'linear-gradient(180deg, #8FD95C, #5CA834)',
                    color: '#12240a',
                    border: '1px solid rgba(0,0,0,0.35)',
                    boxShadow: '0 2px 8px rgba(124,189,75,0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
                  }}
                >
                  {t('Fırsat')}
                </motion.span>
              )}

              {/* sahiplik mührü */}
              {owned && (
                <span
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px]"
                  style={{ border: `1.2px dashed ${HAIRLINE}`, color: GOLD, transform: 'rotate(-10deg)' }}
                  title={t('Koleksiyonunda')}
                >
                  ✓
                </span>
              )}

              {/* fanus */}
              <div className="relative flex h-[62px] w-[62px] items-center justify-center">
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
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.5 }}
                >
                  <ItemPreview item={item} firstName={firstName} />
                </motion.span>
              </div>

              <div className="mt-1.5 text-[7.5px] font-bold uppercase tracking-[0.24em]" style={{ color: `${a}CC` }}>
                {t(item.category)}
              </div>
              <h2 className="mt-0.5 min-h-[30px] text-[12px] font-semibold leading-tight" style={{ color: IVORY }}>
                {t(item.title)}
              </h2>

              {/* fiyat — her karoda altta */}
              <div className="mt-1 flex items-center gap-1">
                <PlateIcon size={14} />
                <span className="text-[13px] font-bold tabular-nums" style={{ color: GOLD }}>
                  {item.price}
                </span>
                <span className="text-[8px] uppercase tracking-wide" style={{ color: MUTED }}>
                  {t('Plaka')}
                </span>
              </div>

              {/* aksiyon */}
              <div className="mt-2 w-full">
                {owned ? (
                  justBought === item.id ? (
                    /* yeni alındı — tek seferlik seçim: hemen uygula ya da envantere */
                    <div className="space-y-1.5">
                      {item.variants ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {item.variants.map((v) => (
                            <button
                              key={v.value}
                              type="button"
                              disabled={saving}
                              onClick={async () => {
                                await toggleEquip(item, v.value)
                                setJustBought(null)
                              }}
                              className="btn-chip h-6 w-6 rounded-md disabled:opacity-50"
                              title={t('{label} — hemen uygula', { label: t(v.label) })}
                              style={{
                                backgroundColor: v.value,
                                border: `1px solid ${HAIRLINE}`,
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={async () => {
                            await toggleEquip(item)
                            setJustBought(null)
                          }}
                          className="btn-primary w-full rounded-lg px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] disabled:opacity-50"
                          style={{
                            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
                            color: '#14100a',
                            boxShadow: `0 5px 16px ${GOLD}40`,
                          }}
                        >
                          {t('⚡ Hemen Uygula')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setJustBought(null)}
                        className="btn-chip w-full rounded-lg px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                        style={{ border: `1px solid ${HAIRLINE}`, color: MUTED }}
                      >
                        {t('🎒 Envantere Gönder')}
                      </button>
                    </div>
                  ) : (
                    /* alınmış — kuşanma Envanter'den */
                    <Link
                      to="/envanter"
                      className="btn-chip block w-full rounded-lg px-3 py-1.5 text-center text-[9px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        border: `1px dashed ${HAIRLINE}`,
                        color: equipped ? GOLD : MUTED,
                        background: 'rgba(232,193,90,0.04)',
                      }}
                    >
                      {equipped ? t('✓ Kuşanılı · Envanterde') : t('🎒 Envanterde')}
                    </Link>
                  )
                ) : (
                  <motion.button
                    type="button"
                    disabled={saving}
                    onClick={() => buy(item)}
                    animate={denied ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
                    transition={{ duration: 0.45 }}
                    whileTap={{ scale: 0.94 }}
                    className="btn-primary w-full rounded-lg px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] disabled:opacity-50"
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
                    {denied ? t('Yetersiz') : confirming ? t('Onayla · {price}', { price: item.price }) : t('Satın Al')}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <Link
        to="/gorevler"
        className="btn-chip block px-1 pt-1 text-center text-[10px] tracking-[0.14em]"
        style={{ color: GOLD }}
      >
        {t('{c} KAZANMAK İÇİN GÖREVLER\'E UĞRA 📜', { c: t(CURRENCY).toUpperCase() })}
      </Link>
    </div>
  )
}
