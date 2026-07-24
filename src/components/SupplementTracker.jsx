import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { todayStr } from '../lib/date'
import Sheet from './Sheet'
import { SUPPLEMENT_CATALOG, SUPPLEMENT_CATEGORIES, normalizeTr } from '../lib/supplementCatalog'
import { t } from '../lib/i18n'

const SUPP_GREEN = '#6FCF97'

// Kategori kimlik renkleri — listede ve katalogda küçük renk noktası olur.
const CAT_COLORS = {
  Vitaminler: '#F2C94C',
  Mineraller: '#9AA5B4',
  'Magnezyum Formları': '#A78BFA',
  Kolajen: '#FF8A5B',
  Kombinasyonlar: '#22D3EE',
  'Omega & Yağlar': '#6FCF97',
  Aminoasitler: '#F472B6',
  Performans: '#FB923C',
  'Sağlık & Sindirim': '#4ADE80',
  'Protein Ocean': '#38BDF8',
  HIQ: '#F2C94C',
}

// Marka kimlik renkleri — rozet her markada kendi tonunda.
const BRAND_COLORS = {
  'Protein Ocean': '#7DD3FC',
  HIQ: '#F2C94C',
}

function catalogOf(supp) {
  return SUPPLEMENT_CATALOG.find((c) => c.id === supp.catalog_id) ?? null
}

// Yay animasyonlu premium onay kutusu — dolarken tik çizilir.
function CheckOrb({ taken }) {
  return (
    <span
      className="relative flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full transition-all duration-200"
      style={{
        border: taken ? '1px solid rgba(0,0,0,0.25)' : '1.5px solid rgba(255,255,255,0.18)',
        background: taken
          ? `linear-gradient(145deg, #8FE0B0, ${SUPP_GREEN} 55%, #4CA772)`
          : 'rgba(255,255,255,0.03)',
        boxShadow: taken
          ? `0 0 12px ${SUPP_GREEN}59, inset 0 1px 0 rgba(255,255,255,0.5)`
          : 'inset 0 1px 2px rgba(0,0,0,0.3)',
      }}
    >
      {taken && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="#0c2417"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          />
        </svg>
      )}
    </span>
  )
}

// Marka rozeti — Protein Ocean gibi markalı ürünler için.
function BrandChip({ brand, small }) {
  if (!brand) return null
  const c = BRAND_COLORS[brand] ?? '#7DD3FC'
  return (
    <span
      className={`shrink-0 rounded-full border font-semibold uppercase tracking-wide ${
        small ? 'px-1.5 py-px text-[8px]' : 'px-2 py-0.5 text-[9px]'
      }`}
      style={{ borderColor: `${c}59`, backgroundColor: `${c}1a`, color: c }}
    >
      {brand}
    </span>
  )
}

// Takviye takibi — food log gibi: katalogdan seç, listen her gün aynen yenilenir,
// aldıkça işaretle. Saat ve not opsiyonel; not kalıcıdır (miktar/detay için).
export default function SupplementTracker() {
  const { user } = useAuth()
  const today = todayStr()

  const [supps, setSupps] = useState([])
  const [takenIds, setTakenIds] = useState(new Set())
  const [takenAt, setTakenAt] = useState({})
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  // Seçici: liste adımı (picked=null) → detay adımı (picked=katalog öğesi ya da düzenlenen satır)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState(null) // { catalog, editing? }
  const [formTime, setFormTime] = useState('')
  const [formNote, setFormNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const [{ data: list, error: listErr }, { data: logs }] = await Promise.all([
      supabase.from('supplements').select('*').eq('user_id', user.id).order('sort_order').order('created_at'),
      supabase.from('supplement_logs').select('supplement_id, created_at').eq('user_id', user.id).eq('date', today),
    ])
    if (listErr) {
      // Tablolar henüz oluşturulmadıysa bölmeyi sessizce gizle.
      setUnavailable(true)
      setLoading(false)
      return
    }
    setSupps(list ?? [])
    setTakenIds(new Set((logs ?? []).map((l) => l.supplement_id)))
    setTakenAt(Object.fromEntries((logs ?? []).map((l) => [l.supplement_id, l.created_at])))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [user.id])

  async function toggle(id) {
    const next = new Set(takenIds)
    if (next.has(id)) {
      next.delete(id)
      setTakenIds(next)
      setTakenAt((prev) => {
        const { [id]: _, ...rest } = prev
        return rest
      })
      await supabase.from('supplement_logs').delete().eq('user_id', user.id).eq('supplement_id', id).eq('date', today)
    } else {
      next.add(id)
      setTakenIds(next)
      setTakenAt((prev) => ({ ...prev, [id]: new Date().toISOString() }))
      navigator.vibrate?.(8)
      const { data } = await supabase
        .from('supplement_logs')
        .insert({ user_id: user.id, supplement_id: id, date: today })
        .select('created_at')
        .single()
      if (data?.created_at) setTakenAt((prev) => ({ ...prev, [id]: data.created_at }))
    }
  }

  function fmtTime(ts) {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  function openPicker() {
    setQuery('')
    setPicked(null)
    setPickerOpen(true)
  }

  function pickCatalog(item) {
    setPicked({ catalog: item })
    setFormTime('')
    setFormNote('')
  }

  function startEdit(supp) {
    const catalog = catalogOf(supp) ?? { name: supp.name, brand: null }
    setPicked({ catalog, editing: supp })
    setFormTime(supp.take_time ?? '')
    setFormNote(supp.note ?? '')
    setPickerOpen(true)
  }

  async function saveDetail() {
    if (!picked || saving) return
    setSaving(true)
    const fields = { take_time: formTime || null, note: formNote.trim() || null }

    if (picked.editing) {
      const { error } = await supabase.from('supplements').update(fields).eq('id', picked.editing.id)
      if (!error) setSupps((p) => p.map((s) => (s.id === picked.editing.id ? { ...s, ...fields } : s)))
    } else {
      const base = { user_id: user.id, name: picked.catalog.name, sort_order: supps.length }
      let { data, error } = await supabase
        .from('supplements')
        .insert({ ...base, catalog_id: picked.catalog.id, ...fields })
        .select()
        .single()
      if (error) {
        // Yeni kolonlar yoksa çekirdek alanlarla ekle (migration öncesi geriye uyum).
        const retry = await supabase.from('supplements').insert(base).select().single()
        data = retry.data
        error = retry.error
      }
      if (!error && data) setSupps((p) => [...p, data])
    }

    setSaving(false)
    setPickerOpen(false)
    setPicked(null)
  }

  async function removeSupp(id) {
    setSupps((p) => p.filter((s) => s.id !== id))
    setPickerOpen(false)
    setPicked(null)
    await supabase.from('supplements').delete().eq('id', id)
  }

  // Arama: Türkçe karakter duyarsız; sonuçlar kategori başlıklarıyla gruplanır.
  const grouped = useMemo(() => {
    const q = normalizeTr(query.trim())
    const items = q
      ? SUPPLEMENT_CATALOG.filter((c) => normalizeTr(`${c.name} ${c.brand ?? ''} ${c.desc ?? ''}`).includes(q))
      : SUPPLEMENT_CATALOG
    return SUPPLEMENT_CATEGORIES.map((cat) => ({ cat, items: items.filter((c) => c.cat === cat) })).filter(
      (g) => g.items.length > 0,
    )
  }, [query])

  const addedCatalogIds = useMemo(() => new Set(supps.map((s) => s.catalog_id).filter(Boolean)), [supps])

  if (unavailable) return null

  const takenCount = supps.filter((s) => takenIds.has(s.id)).length
  const allDone = supps.length > 0 && takenCount === supps.length

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-surface p-4"
      style={{
        backgroundImage: 'radial-gradient(110% 90% at 12% 0%, rgba(111,207,151,0.07), transparent 55%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* üst ince yeşil ışık hattı */}
      <span
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${SUPP_GREEN}66, transparent)` }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-base"
            style={{
              border: `1px solid ${SUPP_GREEN}40`,
              background: `radial-gradient(circle at 50% 38%, ${SUPP_GREEN}1f, transparent 75%)`,
            }}
          >
            💊
          </span>
          <div>
            <div className="text-[15px] font-semibold text-text">{t('Takviyeler')}</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted">{t('Günlük rutin')}</div>
          </div>
        </div>
        {supps.length > 0 && (
          <span
            className="rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums"
            style={
              allDone
                ? { borderColor: `${SUPP_GREEN}59`, backgroundColor: `${SUPP_GREEN}1a`, color: SUPP_GREEN }
                : { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--color-text-muted)' }
            }
          >
            {allDone ? t('✓ Tamamlandı') : `${takenCount}/${supps.length}`}
          </span>
        )}
      </div>

      {/* günlük ilerleme — ince nabız çizgisi */}
      {supps.length > 0 && (
        <div className="bar-track mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="bar-fill h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${SUPP_GREEN}, #A7E8C3)`,
              boxShadow: `0 0 8px ${SUPP_GREEN}66`,
            }}
            initial={false}
            animate={{ width: `${(takenCount / supps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.34, 1.1, 0.64, 1] }}
          />
        </div>
      )}

      {loading ? (
        <div className="mt-3 h-4 w-24 animate-pulse rounded bg-track" />
      ) : (
        <>
          {supps.length > 0 && (
            <ul className="mt-3 space-y-2">
              <AnimatePresence initial={false}>
                {supps.map((s) => {
                  const taken = takenIds.has(s.id)
                  const cat = catalogOf(s)
                  const dot = CAT_COLORS[cat?.cat] ?? SUPP_GREEN
                  return (
                    <motion.li
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative overflow-hidden rounded-2xl border transition-colors duration-200"
                      style={{
                        borderColor: taken ? `${SUPP_GREEN}33` : 'rgba(255,255,255,0.06)',
                        background: taken
                          ? `linear-gradient(90deg, ${SUPP_GREEN}0f, rgba(255,255,255,0.02))`
                          : 'rgba(255,255,255,0.025)',
                      }}
                    >
                      {/* kategori kimlik şeridi */}
                      <span
                        className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full transition-opacity"
                        style={{ backgroundColor: dot, opacity: taken ? 0.35 : 0.8 }}
                      />
                      <div className="flex items-center gap-3 py-2.5 pl-4 pr-2.5">
                        <button
                          type="button"
                          onClick={() => toggle(s.id)}
                          className="btn-icon flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <CheckOrb taken={taken} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span
                                className={`truncate text-sm font-medium transition-colors ${
                                  taken ? 'text-text-muted' : 'text-text'
                                }`}
                              >
                                {t(s.name)}
                              </span>
                              <BrandChip brand={cat?.brand} small />
                            </span>
                            {(s.note || (taken && takenAt[s.id])) && (
                              <span className="mt-0.5 flex items-center gap-2">
                                {taken && takenAt[s.id] ? (
                                  <span className="truncate text-[11px]" style={{ color: SUPP_GREEN }}>
                                    {t('{time} itibarıyla alındı', { time: fmtTime(takenAt[s.id]) })}
                                  </span>
                                ) : (
                                  <span className="truncate text-[11px] text-text-muted">{s.note}</span>
                                )}
                              </span>
                            )}
                          </span>
                        </button>

                        {s.take_time && (
                          <span
                            className="flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold tabular-nums"
                            style={{
                              borderColor: 'rgba(255,255,255,0.09)',
                              backgroundColor: 'rgba(255,255,255,0.03)',
                              color: taken ? 'var(--color-text-muted)' : 'var(--color-text)',
                            }}
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                              <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            {s.take_time}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          className="btn-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.07] text-[11px] text-text-muted"
                          aria-label={t('Düzenle')}
                        >
                          ✎
                        </button>
                      </div>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          )}

          <button
            type="button"
            onClick={openPicker}
            className="btn-chip mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed py-2.5 text-sm text-text-muted transition-colors hover:text-text"
            style={{ borderColor: `${SUPP_GREEN}30` }}
          >
            <span style={{ color: SUPP_GREEN }}>+</span> {t('Takviye ekle')}
          </button>
        </>
      )}

      {/* Katalog seçici / detay */}
      <Sheet
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false)
          setPicked(null)
        }}
        title={picked ? (picked.editing ? t('Takviyeyi Düzenle') : t('Detaylar')) : t('Takviye Seç')}
      >
        {picked ? (
          <div className="space-y-4">
            {/* seçilen ürün vitrini */}
            <div
              className="relative overflow-hidden rounded-2xl border p-4"
              style={{
                borderColor: `${CAT_COLORS[picked.catalog.cat] ?? SUPP_GREEN}33`,
                background: `radial-gradient(120% 100% at 0% 0%, ${CAT_COLORS[picked.catalog.cat] ?? SUPP_GREEN}14, rgba(255,255,255,0.02) 60%)`,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{
                    border: `1px solid ${CAT_COLORS[picked.catalog.cat] ?? SUPP_GREEN}40`,
                    background: `radial-gradient(circle at 50% 38%, ${CAT_COLORS[picked.catalog.cat] ?? SUPP_GREEN}22, transparent 75%)`,
                  }}
                >
                  💊
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-semibold text-text">{t(picked.catalog.name)}</span>
                    <BrandChip brand={picked.catalog.brand} />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
                    {t(picked.catalog.cat ?? 'Takviye')}
                  </div>
                </div>
              </div>
              {picked.catalog.desc && (
                <p className="mt-2.5 text-xs leading-relaxed text-text-muted">{t(picked.catalog.desc)}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <div>
                <div className="text-sm font-medium text-text">{t('Alma saati')}</div>
                <div className="text-[11px] text-text-muted">{t('Opsiyonel — rutinin için')}</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="rounded-xl border border-white/[0.09] bg-bg px-2.5 py-1.5 text-sm tabular-nums text-text outline-none focus:border-white/25"
                />
                {formTime && (
                  <button type="button" onClick={() => setFormTime('')} className="btn-icon text-xs text-text-muted">
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <div className="text-sm font-medium text-text">{t('Günlük not')}</div>
              <div className="text-[11px] text-text-muted">{t('Miktar ve detaylar — her gün aynı görünür')}</div>
              <textarea
                rows={2}
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder={t('örn. 2 kapsül, yemekten sonra')}
                className="mt-2 w-full resize-none rounded-xl border border-white/[0.09] bg-bg px-3 py-2 text-sm text-text outline-none placeholder:text-text-muted focus:border-white/25"
              />
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              disabled={saving}
              onClick={saveDetail}
              className="btn-primary relative w-full overflow-hidden rounded-2xl py-3 font-semibold text-black disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, #A7E8C3, ${SUPP_GREEN} 55%, #4CA772)`,
                boxShadow: `0 8px 24px ${SUPP_GREEN}40, inset 0 1px 0 rgba(255,255,255,0.4)`,
              }}
            >
              <span
                className="medal-sheen pointer-events-none absolute inset-0"
                style={{
                  background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                }}
              />
              <span className="relative">{saving ? t('Kaydediliyor...') : picked.editing ? t('Kaydet') : t('Listeme ekle')}</span>
            </motion.button>

            <div className="flex items-center justify-center">
              {!picked.editing ? (
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="btn-chip px-3 py-1.5 text-sm text-text-muted"
                >
                  ‹ {t('Kataloğa dön')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => removeSupp(picked.editing.id)}
                  className="btn-chip px-3 py-1.5 text-sm text-red-400"
                >
                  {t('Listeden çıkar')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* arama — cam çubuk */}
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="11" cy="11" r="7" stroke="var(--color-text-muted)" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('Takviye ara... (örn. magnezyum)')}
                className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.04] py-3 pl-10 pr-3.5 text-[15px] text-text outline-none transition-colors placeholder:text-text-muted focus:border-white/25"
              />
            </div>
            <p className="px-1 text-[11px] text-text-muted">
              {t('Listeye eklediklerin her gün aynen yenilenir — aldıkça işaretle.')}
            </p>
            <div className="max-h-[52svh] space-y-4 overflow-y-auto pr-1">
              {grouped.map((g) => (
                <div key={g.cat}>
                  <div className="mb-1.5 flex items-center gap-2 px-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CAT_COLORS[g.cat] }} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                      {t(g.cat)}
                    </span>
                    <span
                      className="h-px flex-1"
                      style={{ background: `linear-gradient(90deg, ${CAT_COLORS[g.cat]}26, transparent)` }}
                    />
                  </div>
                  <div className="space-y-1">
                    {g.items.map((item) => {
                      const added = addedCatalogIds.has(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={added}
                          onClick={() => pickCatalog(item)}
                          className="btn-row flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/[0.03] px-3 py-2.5 text-left transition-colors disabled:opacity-45"
                          style={added ? {} : { borderColor: 'rgba(255,255,255,0.04)' }}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm text-text">{t(item.name)}</span>
                              <BrandChip brand={item.brand} small />
                            </span>
                            {item.desc && <span className="block truncate text-[11px] text-text-muted">{t(item.desc)}</span>}
                          </span>
                          {added ? (
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                              style={{ backgroundColor: `${SUPP_GREEN}1a`, color: SUPP_GREEN }}
                            >
                              ✓ Listende
                            </span>
                          ) : (
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm"
                              style={{ borderColor: `${SUPP_GREEN}40`, color: SUPP_GREEN }}
                            >
                              +
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {grouped.length === 0 && (
                <p className="py-6 text-center text-sm text-text-muted">{t('Katalogda bulunamadı.')}</p>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
