import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { t, foodName } from '../lib/i18n'

// Barkod sonucu — tarayıcı kapanınca sahneye girer.
// 'lookup'   : ürün aranıyor (nabız animasyonlu barkod)
// 'found'    : çizilen onay halkası + fırlayan ürün kartı, otomatik devam
// 'notfound' : premium "ilk sen tanımla" kartı
const GREEN = '#6FCF97'
const AMBER = '#F2C94C'
const IVORY = '#F2EFE6'
const MUTED = '#ADA79C'

function BarcodeGlyph({ size = 26, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 8v8M10.5 8v8M13.5 8v8M17 8v8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function ScanResult({ result, onUse, onDefine, onRescan, onClose }) {
  const { phase, code, food } = result

  // Bulunan ürün kısa bir kutlamanın ardından kendiliğinden gram ekranına akar.
  useEffect(() => {
    if (phase !== 'found') return undefined
    const t = setTimeout(() => onUse(food), 1250)
    return () => clearTimeout(t)
  }, [phase, food, onUse])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={phase === 'notfound' ? onClose : undefined} />

      {phase === 'lookup' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative flex flex-col items-center gap-4"
        >
          <motion.span
            className="flex h-20 w-20 items-center justify-center rounded-3xl text-white"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BarcodeGlyph size={34} />
          </motion.span>
          <div className="text-center">
            <div className="text-sm font-semibold" style={{ color: IVORY }}>
              {t('Ürün aranıyor')}
            </div>
            <div className="mt-1 text-xs tabular-nums" style={{ color: MUTED }}>
              {code}
            </div>
          </div>
        </motion.div>
      )}

      {phase === 'found' && food && (
        <div className="relative flex w-full max-w-xs flex-col items-center">
          {/* çizilen onay halkası */}
          <div className="relative flex h-24 w-24 items-center justify-center">
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: `${GREEN}1f` }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            />
            <motion.span
              className="absolute rounded-full"
              style={{ inset: -10, border: `2px solid ${GREEN}` }}
              initial={{ scale: 0.6, opacity: 0.9 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            />
            <svg width="52" height="52" viewBox="0 0 52 52">
              <motion.circle
                cx="26"
                cy="26"
                r="23"
                fill="none"
                stroke={GREEN}
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
              <motion.path
                d="M16 27l7 7 14-15"
                fill="none"
                stroke={GREEN}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.4, ease: 'easeOut' }}
              />
            </svg>
          </div>

          {/* fırlayan ürün kartı */}
          <motion.button
            type="button"
            onClick={() => onUse(food)}
            initial={{ opacity: 0, y: 34, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24, delay: 0.3 }}
            className="mt-5 w-full rounded-3xl border p-4 text-center"
            style={{
              borderColor: `${GREEN}40`,
              background: 'linear-gradient(170deg, #182219, #101512 60%)',
              boxShadow: `0 18px 50px rgba(0,0,0,0.55), 0 0 30px ${GREEN}1f, inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            {food.brand && (
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: MUTED }}>
                {food.brand}
              </div>
            )}
            <div className="mt-0.5 text-lg font-bold leading-snug" style={{ color: IVORY }}>
              {foodName(food)}
            </div>
            <div className="mt-2 flex items-center justify-center gap-3 text-xs tabular-nums" style={{ color: MUTED }}>
              <span className="font-bold" style={{ color: GREEN }}>
                {food.calories_per_100g} kcal
              </span>
              <span>{Math.round(food.protein_per_100g ?? 0)}{t('P')}</span>
              <span>{Math.round(food.fat_per_100g ?? 0)}{t('Y')}</span>
              <span>{Math.round(food.carbs_per_100g ?? 0)}{t('K')}</span>
              <span>/ 100g</span>
            </div>
          </motion.button>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-3 text-[11px]"
            style={{ color: MUTED }}
          >
            {t('Gram ekranı açılıyor...')}
          </motion.p>
        </div>
      )}

      {phase === 'notfound' && (
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="relative w-full max-w-xs overflow-hidden rounded-3xl border p-5 text-center"
          style={{
            borderColor: `${AMBER}40`,
            background: 'linear-gradient(170deg, #262014, #14110a 60%)',
            boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 36px ${AMBER}1f, inset 0 1px 0 rgba(255,255,255,0.09)`,
          }}
        >
          <span
            className="pointer-events-none absolute inset-x-8 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${AMBER}80, transparent)` }}
          />

          <motion.span
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              border: `1px solid ${AMBER}40`,
              background: `radial-gradient(circle at 50% 38%, ${AMBER}1f, transparent 75%)`,
              color: AMBER,
            }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BarcodeGlyph size={28} color={AMBER} />
          </motion.span>

          <h2 className="mt-3 text-lg font-bold" style={{ color: IVORY }}>
            {t('Ürün henüz kayıtlı değil')}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: MUTED }}>
            {t('Bu barkod veritabanımızda ve açık gıda veritabanında yok. Etiketinden 30 saniyede tanımla — ')}
            <span style={{ color: AMBER }}>{t('ilk ekleyen sen ol.')}</span>
          </p>

          <span
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs tabular-nums"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: MUTED }}
          >
            <BarcodeGlyph size={12} color={MUTED} />
            {code}
          </span>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onDefine}
            className="btn-primary relative mt-4 w-full overflow-hidden rounded-xl py-3 font-semibold text-black"
            style={{
              background: `linear-gradient(90deg, #F8D64B, #E0A93B)`,
              boxShadow: `0 8px 24px ${AMBER}40, inset 0 1px 0 rgba(255,255,255,0.4)`,
            }}
          >
            <span
              className="medal-sheen pointer-events-none absolute inset-0"
              style={{ background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)' }}
            />
            <span className="relative">{t('Etiketten Tanımla')}</span>
          </motion.button>

          <div className="mt-2.5 flex items-center justify-center gap-4">
            <button type="button" onClick={onRescan} className="btn-chip px-3 py-1.5 text-sm" style={{ color: IVORY }}>
              {t('↻ Tekrar Tara')}
            </button>
            <button type="button" onClick={onClose} className="btn-chip px-3 py-1.5 text-sm" style={{ color: MUTED }}>
              {t('Vazgeç')}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
