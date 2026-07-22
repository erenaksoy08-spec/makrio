import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { fileToAiImage, analyzeFoodPhoto } from '../lib/aiFood'
import { t, tc } from '../lib/i18n'

// Fotoğraf + açıklama ile AI yemek girişi.
// Akış: fotoğraf seç → (isteğe bağlı) açıklama yaz → analiz → düzenlenebilir
// onay kartı → öğüne ekle. Kayıttan önce her değer elle düzeltilebilir.
const VIOLET = '#A78BFA'

const CONF_LABEL = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' }
const CONF_COLOR = { low: '#EB5757', medium: '#F2C94C', high: '#6FCF97' }

const MACROS = [
  { key: 'protein_g', label: 'Protein', color: '#FF8A5B' },
  { key: 'fat_g', label: 'Yağ', color: '#F2C94C' },
  { key: 'carbs_g', label: 'Karb', color: '#6FCF97' },
]

function SparkleCamera({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1-1.6A1.5 1.5 0 0 1 10 3.7h4a1.5 1.5 0 0 1 1.3.7l1 1.6h1.2A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.4" r="3.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19.2 2.2l.55 1.45L21.2 4.2l-1.45.55-.55 1.45-.55-1.45L17.2 4.2l1.45-.55.55-1.45Z" fill="currentColor" />
    </svg>
  )
}

export default function AiFoodEntry({ mealLabel, onSave, onClose }) {
  const fileRef = useRef(null)
  const [phase, setPhase] = useState('input') // input | analyzing | result
  const [photo, setPhoto] = useState(null) // { base64, mediaType, previewUrl }
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [ai, setAi] = useState(null) // ham AI yanıtı (gram ölçekleme tabanı)
  const [form, setForm] = useState(null) // düzenlenebilir alanlar (string)
  const [saving, setSaving] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    try {
      setPhoto(await fileToAiImage(file))
    } catch {
      setError(t('Fotoğraf okunamadı, tekrar dene.'))
    }
  }

  async function analyze() {
    if (!photo) return
    setPhase('analyzing')
    setError('')
    try {
      const res = await analyzeFoodPhoto({
        base64: photo.base64,
        mediaType: photo.mediaType,
        description: description.trim(),
      })
      setAi(res)
      setForm({
        name: res.name,
        grams: String(res.total_grams),
        calories: String(res.calories),
        protein_g: String(res.protein_g),
        fat_g: String(res.fat_g),
        carbs_g: String(res.carbs_g),
      })
      navigator.vibrate?.([12, 30, 16])
      setPhase('result')
    } catch (e) {
      setError(e.message)
      setPhase('input')
    }
  }

  // Gram değişince makrolar AI tabanından orantılı ölçeklenir;
  // tek tek makro alanları ise doğrudan düzenlenebilir.
  function setGrams(value) {
    const g = Number(value) || 0
    const factor = ai?.total_grams ? g / ai.total_grams : 1
    setForm((f) => ({
      ...f,
      grams: value,
      calories: String(Math.round(ai.calories * factor)),
      protein_g: String(Math.round(ai.protein_g * factor * 10) / 10),
      fat_g: String(Math.round(ai.fat_g * factor * 10) / 10),
      carbs_g: String(Math.round(ai.carbs_g * factor * 10) / 10),
    }))
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError('')
    const ok = await onSave({
      name: form.name.trim() || t('Yemek'),
      grams: Math.max(1, Number(form.grams) || 0),
      calories: Math.max(0, Number(form.calories) || 0),
      protein_g: Math.max(0, Number(form.protein_g) || 0),
      carbs_g: Math.max(0, Number(form.carbs_g) || 0),
      fat_g: Math.max(0, Number(form.fat_g) || 0),
    })
    setSaving(false)
    if (ok === false) setError(t('Eklenemedi, tekrar dene.'))
  }

  const kcal = Math.round(Number(form?.calories) || 0)

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto bg-bg"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto max-w-md space-y-4 px-4 py-6 pb-28">
        {/* üst bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Kapat')}
            className="btn-icon flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-text-muted"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[13px] text-text-muted">
            {mealLabel}
          </span>
        </div>

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-text">
            <span style={{ color: VIOLET }}>
              <SparkleCamera size={24} />
            </span>
            {t('Fotoğrafla Ekle')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t('Fotoğrafı çek, istersen kısaca anlat — makroları AI hesaplasın.')}
          </p>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        {phase === 'input' && (
          <>
            {/* fotoğraf alanı */}
            {photo ? (
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]">
                <img src={photo.previewUrl} alt={t('Yemek fotoğrafı')} className="max-h-72 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn-chip absolute bottom-3 right-3 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ background: 'rgba(10,12,16,0.6)', backdropFilter: 'blur(10px)' }}
                >
                  {t('Fotoğrafı değiştir')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 rounded-3xl border border-dashed px-5 py-12 text-center transition-colors"
                style={{ borderColor: `${VIOLET}4d`, background: `radial-gradient(120% 100% at 50% 0%, ${VIOLET}0f, transparent 70%)` }}
              >
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ border: `1px solid ${VIOLET}40`, color: VIOLET, background: `${VIOLET}14` }}
                >
                  <SparkleCamera size={30} />
                </span>
                <span className="text-[15px] font-semibold text-text">{t('Fotoğraf çek veya seç')}</span>
                <span className="text-xs text-text-muted">{t('Tabağın tamamı karede olsun — porsiyonu daha iyi kestiririz.')}</span>
              </button>
            )}

            {/* açıklama */}
            <div className="rounded-3xl border border-white/[0.06] bg-surface p-4">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                {t('Açıklama (isteğe bağlı)')}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('örn. 200 gram makarna, 175 gram tavuk göğsü')}
                className="mt-2 w-full resize-none bg-transparent text-[15px] leading-relaxed text-text outline-none placeholder:text-text-muted"
              />
              <p className="mt-1.5 text-[11px] text-text-muted opacity-80">
                💡 {t('Ne kadar detaylı yazarsan, o kadar isabetli hesaplarız.')}
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden text-sm text-red-400"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              disabled={!photo}
              onClick={analyze}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full rounded-2xl py-3.5 font-semibold text-black disabled:opacity-40"
              style={{
                background: `linear-gradient(90deg, ${VIOLET}, #8B6CF0)`,
                boxShadow: `0 8px 24px ${VIOLET}40, inset 0 1px 0 rgba(255,255,255,0.35)`,
              }}
            >
              {t('Analiz Et')} ✨
            </motion.button>
          </>
        )}

        {phase === 'analyzing' && (
          <div className="flex flex-col items-center gap-5 py-16">
            <div className="relative">
              {photo && (
                <img
                  src={photo.previewUrl}
                  alt=""
                  className="h-28 w-28 rounded-3xl object-cover"
                  style={{ filter: 'brightness(0.85)' }}
                />
              )}
              {/* tarama hattı */}
              <motion.span
                className="absolute inset-x-1 h-[2.5px] rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}, transparent)`, boxShadow: `0 0 14px ${VIOLET}` }}
                animate={{ top: ['8%', '88%', '8%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.span
                className="absolute -inset-2 rounded-[28px]"
                style={{ border: `1.5px solid ${VIOLET}59` }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-text">{t('Fotoğraf inceleniyor...')}</div>
              <div className="mt-1 text-xs text-text-muted">{t('Porsiyon ve makrolar hesaplanıyor')}</div>
            </div>
          </div>
        )}

        {phase === 'result' && form && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {/* özet şeridi: küçük foto + güven */}
            <div className="flex items-center gap-3">
              {photo && <img src={photo.previewUrl} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                  {t('AI tahmini — düzenleyebilirsin')}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{ backgroundColor: `${CONF_COLOR[ai.confidence]}1f`, color: CONF_COLOR[ai.confidence] }}
                  >
                    {t('Güven')}: {tc('conf', CONF_LABEL[ai.confidence])}
                  </span>
                </div>
              </div>
            </div>

            {/* düzenlenebilir kart */}
            <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-surface">
              <label className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3.5">
                <span className="w-14 shrink-0 text-xs font-medium text-text-muted">{t('İsim')}</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-text outline-none"
                />
              </label>
              <label className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3.5">
                <span className="w-14 shrink-0 text-xs font-medium text-text-muted">{t('Miktar')}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  value={form.grams}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setGrams(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-right text-lg font-semibold tabular-nums text-text outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="shrink-0 text-xs text-text-muted">g</span>
              </label>
              <label className="flex items-center gap-3 px-4 py-3.5">
                <span className="w-14 shrink-0 text-xs font-medium text-text-muted">{t('Kalori')}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={form.calories}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
                  className="min-w-0 flex-1 bg-transparent text-right text-lg font-semibold tabular-nums text-text outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="shrink-0 text-xs text-text-muted">kcal</span>
              </label>
              <div className="grid grid-cols-3 border-t border-white/[0.05]">
                {MACROS.map((m, i) => (
                  <label key={m.key} className={`relative px-3 py-3.5 text-center ${i > 0 ? 'border-l border-white/[0.05]' : ''}`}>
                    <span
                      className="pointer-events-none absolute inset-x-5 top-0 h-[2px] rounded-b-full"
                      style={{ backgroundColor: `${m.color}66` }}
                    />
                    <span className="text-[11px] text-text-muted">{t(m.label)}</span>
                    <div className="mt-1 flex items-baseline justify-center gap-0.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={form[m.key]}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setForm((f) => ({ ...f, [m.key]: e.target.value }))}
                        className="w-12 bg-transparent text-center text-lg font-semibold tabular-nums text-text outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-text-muted">g</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* AI'nin gördüğü kalemler + gerekçe */}
            {(ai.items?.length > 0 || ai.notes) && (
              <div className="rounded-3xl border border-white/[0.06] bg-surface p-4">
                {ai.items?.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                      {t('Tahmini içerik')}
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {ai.items.map((it, i) => (
                        <li key={i} className="flex items-center justify-between text-[13px]">
                          <span className="min-w-0 truncate text-text">
                            {it.name}
                            {it.grams > 0 && <span className="text-text-muted"> · {it.grams}g</span>}
                          </span>
                          <span className="shrink-0 pl-3 tabular-nums text-text-muted">{it.calories} kcal</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {ai.notes && (
                  <p className={`text-xs leading-relaxed text-text-muted ${ai.items?.length > 0 ? 'mt-3 border-t border-white/[0.06] pt-3' : ''}`}>
                    {ai.notes}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setPhase('input')}
              className="btn-chip flex w-full items-center justify-center gap-1.5 rounded-2xl border border-white/[0.1] py-2.5 text-sm text-text-muted"
            >
              ↻ {t('Tekrar Analiz Et')}
            </button>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden text-sm text-red-400"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="safe-bottom fixed inset-x-0 bottom-[68px] z-30 mx-auto max-w-md px-4">
              <motion.button
                type="button"
                disabled={saving || kcal <= 0}
                onClick={handleSave}
                whileTap={{ scale: 0.97 }}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-semibold text-black disabled:opacity-50"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.12)' }}
              >
                {saving ? (
                  t('Ekleniyor...')
                ) : (
                  <>
                    <span>{t('Öğüne Ekle')}</span>
                    <span className="tabular-nums opacity-80">· {kcal} kcal</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
