import { useEffect, useState } from 'react'

export default function MacroBar({ label, consumed, goal, unit = 'g', color = 'var(--color-accent)', delay = 0, spiral = false }) {
  const ratio = goal > 0 ? Math.min(1, consumed / goal) : 0
  const [animatedRatio, setAnimatedRatio] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedRatio(ratio), delay)
    return () => clearTimeout(timer)
  }, [ratio, delay])

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className="text-sm tabular-nums">
          <span className="font-semibold text-text">{Math.round(consumed)}</span>
          <span className="text-text-muted"> / {Math.round(goal)} {unit}</span>
        </span>
      </div>
      <div className="bar-track h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`bar-fill h-2.5 rounded-full${spiral ? ' bar-spiral' : ''}`}
          style={{
            width: `${animatedRatio * 100}%`,
            backgroundColor: color,
            // Spiral parlaması makro rengini alır (currentColor).
            color,
            // Ağır dolum: yavaş kalkış, kütleli itiş, ufak taşma ve oturma.
            transition: 'width 1450ms cubic-bezier(0.62, 0.01, 0.06, 1.12)',
          }}
        />
      </div>
    </div>
  )
}
