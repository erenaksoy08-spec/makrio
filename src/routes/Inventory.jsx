import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { unlockStreakFrom } from '../lib/rewards'
import { buildInventory, CATEGORY_ORDER } from '../lib/inventory'
import { GOLD_NAME_STYLE } from '../lib/store'
import BackButton from '../components/BackButton'

// Envanter — deri sırt çantasının içi: dikişli paneller, çukur eşya yuvaları,
// pirinç perçinler. Uygulamanın geri kalanına benzemez; RPG çantası gibi hissettirir.
const BRASS = '#C9A15A'
const BRASS_SOFT = 'rgba(201,161,90,'
const LEATHER_PANEL = 'linear-gradient(180deg, rgba(44,31,16,0.82), rgba(24,16,8,0.88))'

// Eşyanın yuvadaki görseli — emoji ya da özel mini çizim.
function SlotArt({ item, dim }) {
  const style = dim ? { opacity: 0.22, filter: 'grayscale(1)' } : undefined
  if (item.kind === 'ring-color')
    return (
      <svg width="26" height="26" viewBox="0 0 26 26" style={style}>
        <circle cx="13" cy="13" r="9" fill="none" stroke={item.accent} strokeWidth="4" strokeLinecap="round" strokeDasharray="44 13" transform="rotate(-90 13 13)" />
      </svg>
    )
  if (item.kind === 'ring-square')
    return (
      <svg width="26" height="26" viewBox="0 0 26 26" style={style}>
        <rect x="4" y="4" width="18" height="18" rx="5.5" fill="none" stroke={item.accent} strokeWidth="4" strokeDasharray="56 16" transform="rotate(-90 13 13)" strokeLinecap="round" />
      </svg>
    )
  if (item.kind === 'grass-block')
    return (
      <svg width="26" height="26" viewBox="0 0 40 40" shapeRendering="crispEdges" style={style}>
        <polygon points="20,5 34,12 20,19 6,12" fill="#7CBD4B" />
        <polygon points="6,12 20,19 20,35 6,28" fill="#8A5A32" />
        <polygon points="34,12 20,19 20,35 34,28" fill="#6E4526" />
        <rect x="10" y="21" width="3" height="3" fill="#75492A" />
        <rect x="25" y="24" width="3" height="3" fill="#5C3A20" />
        <rect x="17" y="9" width="4" height="3" fill="#93D45F" />
      </svg>
    )
  if (item.kind === 'swatches')
    return (
      <span className="grid grid-cols-2 gap-[3px]" style={style}>
        {item.variants.map((v) => (
          <span key={v.value} className="h-[11px] w-[11px] rounded-[3px]" style={{ backgroundColor: v.value, border: '1px solid rgba(255,255,255,0.14)' }} />
        ))}
      </span>
    )
  if (item.kind === 'gold-name')
    return (
      <span className="text-[19px] font-black leading-none" style={{ ...GOLD_NAME_STYLE, ...(dim ? { opacity: 0.22, filter: 'grayscale(1)' } : {}) }}>
        Aa
      </span>
    )
  return (
    <span className="text-[23px] leading-none" style={style}>
      {item.icon}
    </span>
  )
}

// Çukur eşya yuvası. Sahipli: eşya + (kuşanılıysa) altın pim. Sahipsiz: loş silüet + kilit.
function Slot({ item, selected, onClick, index }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 320, damping: 22 }}
      whileTap={{ scale: 0.9 }}
      className="relative flex aspect-square items-center justify-center rounded-xl"
      style={{
        background: item.owned
          ? 'linear-gradient(180deg, #100b06 0%, #1b130a 55%, #221809 100%)'
          : 'linear-gradient(180deg, #0c0805, #120d07)',
        border: selected
          ? `1.5px solid ${BRASS}`
          : item.owned
            ? `1px solid ${BRASS_SOFT}0.28)`
            : `1px dashed ${BRASS_SOFT}0.16)`,
        boxShadow: selected
          ? `inset 0 2px 7px rgba(0,0,0,0.6), 0 0 12px ${BRASS_SOFT}0.35)`
          : 'inset 0 2px 7px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <SlotArt item={item} dim={!item.owned} />
      {!item.owned && (
        <span className="absolute bottom-1 right-1.5 text-[9px] opacity-60">🔒</span>
      )}
      {item.owned && item.equipped && (
        <span
          className="absolute -bottom-1 -right-1 flex h-[17px] w-[17px] items-center justify-center rounded-full text-[9px] font-bold text-black"
          style={{ backgroundColor: '#F2C94C', border: '2px solid #14100a', boxShadow: '0 0 8px rgba(242,201,76,0.5)' }}
        >
          ✓
        </span>
      )}
    </motion.button>
  )
}

// Panel köşe perçini.
function Rivet({ className }) {
  return (
    <span
      className={`pointer-events-none absolute h-[7px] w-[7px] rounded-full ${className}`}
      style={{
        background: `radial-gradient(circle at 35% 30%, #E8CD96, ${BRASS} 55%, #6B4E1F)`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.7), inset 0 -1px 1px rgba(0,0,0,0.4)',
      }}
    />
  )
}

export default function Inventory() {
  const { profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [selId, setSelId] = useState(null)

  const preferences = profile?.preferences ?? {}
  const unlockStreak = unlockStreakFrom(profile)
  const items = useMemo(() => buildInventory(preferences, unlockStreak), [preferences, unlockStreak])
  const selected = items.find((i) => i.id === selId) ?? null
  const ownedCount = items.filter((i) => i.owned).length

  const sections = CATEGORY_ORDER.map((cat) => ({ cat, list: items.filter((i) => i.cat === cat) })).filter(
    (s) => s.list.length > 0,
  )

  async function applyPrefs(patch) {
    setSaving(true)
    await supabase.rpc('update_preferences', { p_preferences: { ...preferences, ...patch } })
    await refreshProfile()
    setSaving(false)
  }

  // Kuşan / çıkar — Salon ve Vitrin'dekiyle aynı tercih anahtarlarına yazar.
  async function equip(item, variantValue) {
    if (!item.owned || saving) return
    const patch = {}
    if (item.source === 'salon')
      patch.claimedRewards = [...new Set([...(preferences.claimedRewards ?? []), item.claimId])]
    let turnedOn = false
    if (item.special === 'badge') {
      turnedOn = preferences.badge === false
      patch.badge = turnedOn
    } else if (item.variants) {
      const turnOff = preferences[item.prefKey] === variantValue
      patch[item.prefKey] = turnOff ? null : variantValue
      turnedOn = !turnOff
    } else {
      const turnOff = preferences[item.prefKey] === item.value
      patch[item.prefKey] = turnOff ? null : item.value
      turnedOn = !turnOff
    }
    if (turnedOn) navigator.vibrate?.([12, 30, 16])
    await applyPrefs(patch)
  }

  return (
    <div className="relative mx-auto max-w-md space-y-5 px-4 py-6 pb-44">
      {/* çanta içi — koyu deri, çapraz dokuma, vinyet */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(130% 85% at 50% 0%, #221507, #130c05 55%, #0a0603 100%)',
        }}
      >
        <span
          className="absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.014) 0 2px, transparent 2px 7px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 7px)',
          }}
        />
        <span
          className="absolute inset-0"
          style={{ background: 'radial-gradient(90% 65% at 50% 105%, rgba(0,0,0,0.55), transparent 60%)' }}
        />
      </div>

      <BackButton to="/ilerleme" label="İlerleme" />

      {/* çanta ağzı — dikiş hatları arasında yazıt */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="pb-1 pt-1 text-center"
      >
        <div className="flex items-center gap-3">
          <span className="h-0 flex-1" style={{ borderTop: `2px dashed ${BRASS_SOFT}0.4)` }} />
          <h1
            className="text-[21px] font-bold uppercase leading-none tracking-[0.3em]"
            style={{
              backgroundImage: `linear-gradient(180deg, #EFD9A8, ${BRASS} 58%, #8A6528)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textIndent: '0.3em',
              filter: 'drop-shadow(0 2px 6px rgba(201,161,90,0.28))',
            }}
          >
            Envanter
          </h1>
          <span className="h-0 flex-1" style={{ borderTop: `2px dashed ${BRASS_SOFT}0.4)` }} />
        </div>
        <p className="mt-2 text-[10px] tracking-[0.22em] text-text-muted">KAZANDIĞIN HER ŞEY TEK ÇANTADA</p>
        <div
          className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tabular-nums"
          style={{ borderColor: `${BRASS_SOFT}0.4)`, backgroundColor: `${BRASS_SOFT}0.08)`, color: BRASS }}
        >
          🎒 {ownedCount}/{items.length} EŞYA
        </div>
      </motion.div>

      {/* bölmeler — eşya tarzına göre dikişli deri panel + perçinler */}
      {sections.map((section, si) => (
        <motion.div
          key={section.cat}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + si * 0.06, duration: 0.4, ease: 'easeOut' }}
          className="relative rounded-2xl p-3"
          style={{
            background: LEATHER_PANEL,
            border: `1px solid ${BRASS_SOFT}0.18)`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 6px 18px rgba(0,0,0,0.35)',
          }}
        >
          <Rivet className="left-1.5 top-1.5" />
          <Rivet className="right-1.5 top-1.5" />
          <Rivet className="bottom-1.5 left-1.5" />
          <Rivet className="bottom-1.5 right-1.5" />

          <div className="mb-2.5 flex items-center gap-2 px-1">
            <span
              className="rounded-[5px] border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ borderColor: `${BRASS_SOFT}0.35)`, color: BRASS, backgroundColor: 'rgba(0,0,0,0.25)' }}
            >
              {section.cat}
            </span>
            <span className="h-0 flex-1" style={{ borderTop: `1px dashed ${BRASS_SOFT}0.22)` }} />
            <span className="text-[9px] font-semibold tabular-nums" style={{ color: `${BRASS_SOFT}0.75)` }}>
              {section.list.filter((i) => i.owned).length}/{section.list.length}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {section.list.map((item, i) => (
              <Slot
                key={item.id}
                item={item}
                index={i}
                selected={selId === item.id}
                onClick={() => setSelId(selId === item.id ? null : item.id)}
              />
            ))}
          </div>
        </motion.div>
      ))}

      <p className="px-1 pt-1 text-center text-[11px] leading-relaxed text-text-muted">
        Yeni eşyalar <Link to="/salon" className="font-semibold" style={{ color: BRASS }}>Şeref Salonu</Link>
        {"'nda seriyle açılır, "}
        <Link to="/vitrin" className="font-semibold" style={{ color: BRASS }}>Vitrin</Link>
        {"'den Plaka ile alınır."}
      </p>

      {/* eşya kartı — seçilen yuvanın detayı, dikişli deri yama */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md rounded-2xl p-[3px]"
            style={{
              background: 'linear-gradient(180deg, #2b1d0d, #171007)',
              border: `1px solid ${BRASS_SOFT}0.35)`,
              boxShadow: '0 -8px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="rounded-[13px] p-3.5" style={{ border: `1.5px dashed ${BRASS_SOFT}0.3)` }}>
              <div className="flex items-start gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: 'linear-gradient(180deg, #100b06, #221809)',
                    border: `1px solid ${BRASS_SOFT}0.3)`,
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
                  }}
                >
                  <SlotArt item={selected} dim={!selected.owned} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-text">{selected.name}</span>
                    {selected.owned && selected.equipped && (
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-black"
                        style={{ backgroundColor: '#F2C94C' }}
                      >
                        Kuşanıldı
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: `${BRASS_SOFT}0.8)` }}>
                    {selected.source === 'salon' ? `Şeref Salonu · ${selected.days} gün serisi` : `Vitrin · ${selected.price} Plaka`}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-text-muted">{selected.desc}</p>
                  {selected.note && (
                    <p className="mt-1 text-[10px] italic leading-relaxed" style={{ color: `${BRASS_SOFT}0.65)` }}>
                      {selected.note}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelId(null)}
                  className="shrink-0 text-sm text-text-muted"
                  aria-label="Kapat"
                >
                  ✕
                </button>
              </div>

              {/* aksiyon — sahipli: kuşan/çıkar; sahipsiz: kaynağa git */}
              {!selected.owned ? (
                <Link
                  to={selected.source === 'salon' ? '/salon' : '/vitrin'}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ borderColor: `${BRASS_SOFT}0.35)`, color: BRASS, backgroundColor: 'rgba(0,0,0,0.25)' }}
                >
                  🔒 {selected.source === 'salon' ? `${selected.days} gün seriyle açılır — Salona git` : `${selected.price} Plaka — Vitrine git`}
                </Link>
              ) : selected.variants ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.variants.map((v) => {
                    const active = selected.activeVariant === v.value
                    return (
                      <button
                        key={v.value}
                        type="button"
                        disabled={saving}
                        onClick={() => equip(selected, v.value)}
                        className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold disabled:opacity-50"
                        style={{
                          borderColor: active ? BRASS : `${BRASS_SOFT}0.25)`,
                          backgroundColor: active ? `${BRASS_SOFT}0.16)` : 'rgba(0,0,0,0.25)',
                          color: active ? '#EFD9A8' : 'var(--color-text-muted)',
                          boxShadow: active ? `0 0 10px ${BRASS_SOFT}0.3)` : 'none',
                        }}
                      >
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: v.swatch ?? v.value, border: '1px solid rgba(255,255,255,0.2)' }} />
                        {v.label}
                        {active && ' ✓'}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => equip(selected)}
                  className="mt-3 w-full rounded-xl border py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] disabled:opacity-50"
                  style={
                    selected.equipped
                      ? { borderColor: 'rgba(255,255,255,0.14)', color: 'var(--color-text-muted)', backgroundColor: 'rgba(0,0,0,0.25)' }
                      : {
                          border: '1px solid rgba(0,0,0,0.4)',
                          background: `linear-gradient(180deg, #EFD9A8, ${BRASS} 60%, #8A6528)`,
                          color: '#241703',
                          boxShadow: `0 3px 12px ${BRASS_SOFT}0.35), inset 0 1px 0 rgba(255,255,255,0.5)`,
                        }
                  }
                >
                  {saving ? '· · ·' : selected.equipped ? 'Çıkar' : '⚔ Kuşan'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
