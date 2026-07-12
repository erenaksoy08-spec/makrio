import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { scoreFood } from '../lib/foodScore'
import KarneSheet from './KarneSheet'

// Besin Karnesi şeridi — yemek detayında tek satır: puan + durum + ⓘ.
// Ayrıntı (etiketler, neden bu puan) dokununca açılan sayfada.
export default function FoodReportCard({ food }) {
  const [open, setOpen] = useState(false)
  const karne = scoreFood(food)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-row flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-surface px-4 py-3 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Besin Karnesi</span>
        <span className="flex items-center gap-2.5">
          <span className="flex items-baseline gap-0.5">
            <span className="text-lg font-bold tabular-nums leading-none" style={{ color: karne.color }}>
              {karne.display}
            </span>
            <span className="text-xs font-medium text-text-muted">/5</span>
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
            style={{ backgroundColor: `${karne.color}1f`, color: karne.color }}
          >
            {karne.verdict}
          </span>
          <span
            className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white/[0.14] font-serif text-[11px] italic text-text-muted"
            aria-label="Karne ayrıntısı"
          >
            i
          </span>
        </span>
      </button>

      <AnimatePresence>{open && <KarneSheet food={food} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  )
}
