import { useState } from 'react'
import Sheet from './Sheet'
import WeightTracker from './WeightTracker'

function Sparkline({ values, color }) {
  if (values.length < 2) return <div className="h-7" />
  const W = 120
  const H = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-7 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function WeightCard({ logs, goal, onAdd }) {
  const [open, setOpen] = useState(false)
  const sorted = [...logs].sort((a, b) => (a.logged_at < b.logged_at ? -1 : 1))
  const latest = sorted[sorted.length - 1] ?? null
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null
  const delta = latest && prev ? Math.round((latest.kg - prev.kg) * 10) / 10 : null

  const deltaColor =
    delta == null || delta === 0
      ? 'var(--color-text-muted)'
      : goal === 'lose'
        ? delta < 0
          ? '#6FCF97'
          : '#EB5757'
        : goal === 'gain'
          ? delta > 0
            ? '#6FCF97'
            : '#EB5757'
          : 'var(--color-text-muted)'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-row flex h-full flex-col justify-between rounded-3xl border border-white/[0.06] bg-surface p-4 text-left"
      >
        <div className="flex items-start justify-between">
          <span className="text-sm text-text-muted">Kilo</span>
          {delta != null && delta !== 0 && (
            <span className="text-xs font-semibold tabular-nums" style={{ color: deltaColor }}>
              {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold tabular-nums text-text">{latest ? latest.kg : '–'}</span>
          <span className="text-sm text-text-muted">kg</span>
        </div>
        <div className="mt-2">
          <Sparkline values={sorted.map((l) => l.kg)} color="#A78BFA" />
        </div>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Kilo Takibi">
        <WeightTracker logs={logs} goal={goal} onAdd={onAdd} />
      </Sheet>
    </>
  )
}
