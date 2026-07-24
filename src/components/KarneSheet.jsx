import { motion } from 'framer-motion'
import { scoreFood } from '../lib/foodScore'
import { t, foodName } from '../lib/i18n'

// Besin Karnesi açıklama sayfası — arama satırındaki / detaydaki ⓘ ile açılır.
// Puanın nedenlerini artı-eksi satırlarıyla döker.
export default function KarneSheet({ food, onClose }) {
  const karne = scoreFood(food)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="relative w-full max-w-md rounded-t-3xl border-t border-white/[0.08] bg-surface px-5 pb-8 pt-3"
      >
        <span className="mx-auto block h-1 w-10 rounded-full bg-white/15" />

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{t('Besin Karnesi')}</div>
            <div className="mt-0.5 truncate text-base font-semibold text-text">{foodName(food)}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Kapat')}
            className="btn-icon relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.1] text-text-muted after:absolute after:-inset-2 after:content-['']"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* puan + gösterge */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tabular-nums leading-none" style={{ color: karne.color }}>
              {karne.display}
            </span>
            <span className="text-sm font-medium text-text-muted">/5</span>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: `${karne.color}1f`, color: karne.color }}
          >
            {t(karne.verdict)}
          </span>
        </div>

        <div className="mt-3 flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => {
            const fill = Math.max(0, Math.min(1, karne.score - i))
            return (
              <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
                {fill > 0 && (
                  <motion.span
                    className="block h-full rounded-full"
                    style={{ backgroundColor: karne.color, width: `${fill * 100}%`, transformOrigin: 'left' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.07, ease: 'easeOut' }}
                  />
                )}
              </span>
            )
          })}
        </div>

        {/* etiketler */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {karne.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-text-muted"
            >
              {t(tag)}
            </span>
          ))}
        </div>

        {/* neden bu puan? */}
        {karne.reasons.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{t('Neden bu puan?')}</div>
            <ul className="mt-2 space-y-2">
              {karne.reasons.map((r, i) => (
                <motion.li
                  key={r.text}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + i * 0.05 }}
                  className="flex items-start gap-2.5 text-[13px] leading-snug text-text"
                >
                  <span
                    className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={
                      r.good
                        ? { backgroundColor: '#6FCF971f', color: '#6FCF97' }
                        : { backgroundColor: '#F26B6B1f', color: '#F26B6B' }
                    }
                  >
                    {r.good ? '+' : '−'}
                  </span>
                  {t(r.text)}
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-text-muted opacity-70">
          {t('Makro profili ve besin türüne göre otomatik hesaplanır — porsiyon miktarından bağımsızdır, tıbbi öneri değildir.')}
        </p>
      </motion.div>
    </motion.div>
  )
}
