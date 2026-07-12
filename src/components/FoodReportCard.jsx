import { motion } from 'framer-motion'
import { scoreFood } from '../lib/foodScore'

// Besin Karnesi — yemek detayında puan + bilgilendirme kartı.
// Puan küsuratlıdır (3.2/5) ve rengi banda göre değişir; altında 5 dilimli
// gösterge küsuratı da doldurur (3.2 → 3 tam + %20'lik dilim).
export default function FoodReportCard({ food }) {
  const karne = scoreFood(food)

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Besin Karnesi</span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
          style={{ backgroundColor: `${karne.color}1f`, color: karne.color }}
        >
          {karne.verdict}
        </span>
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-3xl font-bold tabular-nums leading-none"
            style={{ color: karne.color }}
          >
            {karne.display}
          </motion.span>
          <span className="text-sm font-medium text-text-muted">/5</span>
        </div>

        <div className="min-w-0 space-y-1 text-right">
          {karne.tags.map((tag) => (
            <div key={tag} className="flex items-center justify-end gap-1.5 text-xs text-text-muted">
              <span className="h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: karne.color }} />
              <span className="truncate">{tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5 dilimli gösterge — küsurat son dilimi kısmen doldurur */}
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
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                />
              )}
            </span>
          )
        })}
      </div>

      <p className="mt-2.5 text-[10px] leading-relaxed text-text-muted opacity-70">
        100 g makro profiline göre otomatik hesaplanır — porsiyon miktarından bağımsızdır.
      </p>
    </div>
  )
}
