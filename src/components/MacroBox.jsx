import { useEffect, useState } from 'react'

export default function MacroBox({ label, consumed, goal, unit = 'g', color = 'var(--color-accent)', delay = 0 }) {
  const ratio = goal > 0 ? Math.min(1, consumed / goal) : 0
  const [animatedRatio, setAnimatedRatio] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedRatio(ratio), delay)
    return () => clearTimeout(timer)
  }, [ratio, delay])

  return (
    <div
      className="relative flex flex-col items-center gap-1 overflow-hidden rounded-xl border border-border bg-surface px-2 pt-3 pb-4"
    >
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <span className="text-lg font-bold tabular-nums text-text">{Math.round(consumed)}</span>
      <span className="text-[11px] tabular-nums text-text-muted">/ {Math.round(goal)} {unit}</span>

      <div className="bar-track absolute inset-x-2 bottom-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="bar-fill h-full rounded-full"
          style={{
            width: `${animatedRatio * 100}%`,
            backgroundColor: color,
            transition: 'width 700ms cubic-bezier(0.34, 1.1, 0.64, 1)',
          }}
        />
      </div>
    </div>
  )
}
