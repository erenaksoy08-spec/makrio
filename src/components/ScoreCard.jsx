import { useEffect, useState } from 'react'
import { scoreLabel, scoreColor, fmtScore } from '../lib/dayScore'

const BREAKDOWN = [
  { key: 'cal', label: 'Kalori', max: 3.5 },
  { key: 'pro', label: 'Protein', max: 2.5 },
  { key: 'carbsFat', label: 'Makro', max: 2 },
  { key: 'water', label: 'Su', max: 2 },
]

export default function ScoreCard({ score, idle = false }) {
  const size = 64
  const stroke = 6
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const ratio = Math.min(1, score.total / 10)
  // Gün henüz boşken "Zayıf" damgası vurma — nötr bekleme durumu.
  const color = idle ? 'var(--color-text-muted)' : scoreColor(score.total)

  const [offset, setOffset] = useState(circ)
  useEffect(() => {
    const t = setTimeout(() => setOffset(circ * (1 - ratio)), 80)
    return () => clearTimeout(t)
  }, [circ, ratio])

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/[0.06] bg-surface p-4">
      <div className="relative flex shrink-0 items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-track)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 900ms cubic-bezier(0.34,1.1,0.64,1)' }}
          />
        </svg>
        <div className="absolute flex items-baseline">
          <span className="text-lg font-bold tabular-nums text-text">{fmtScore(score.total)}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Günün Puanı</span>
          <span className="text-sm font-semibold" style={{ color }}>
            {idle ? 'Gün yeni başlıyor' : scoreLabel(score.total)}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {BREAKDOWN.map((b) => {
            const earned = score[b.key]
            const full = earned >= b.max - 0.001
            return (
              <div key={b.key} className="flex flex-col items-center gap-1">
                <div className="bar-track h-1.5 w-full overflow-hidden rounded-full bg-track">
                  <div
                    className="bar-fill h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (earned / b.max) * 100)}%`,
                      backgroundColor: full ? color : 'var(--color-text-muted)',
                      transition: 'width 600ms cubic-bezier(0.34, 1.1, 0.64, 1)',
                    }}
                  />
                </div>
                <span className="text-[10px] text-text-muted">{b.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
