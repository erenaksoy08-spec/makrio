import { useEffect, useState } from 'react'
import { mondayOf, formatShortDate } from '../lib/date'

const WIDTH = 320
const HEIGHT = 136
const PADDING_Y = 26
const PADDING_X = 22

function buildSmoothPath(points) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`

  let d = `M ${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

export default function WeightChart({ logs, color = 'var(--color-accent)' }) {
  const [drawn, setDrawn] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setDrawn(false)
    setSelected(null)
    const raf = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(raf)
  }, [logs])

  if (logs.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center text-sm text-text-muted">
        Henüz kilo kaydı yok.
      </div>
    )
  }

  const weekMap = new Map()
  for (const log of logs) {
    const key = mondayOf(log.logged_at)
    if (!weekMap.has(key)) weekMap.set(key, [])
    weekMap.get(key).push(log.kg)
  }
  const weeks = Array.from(weekMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([weekStart, values]) => ({
      weekStart,
      avg: values.reduce((s, v) => s + v, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    }))

  const usableWidth = WIDTH - PADDING_X * 2
  const usableHeight = HEIGHT - PADDING_Y * 2

  if (weeks.length === 1) {
    const week = weeks[0]
    const y = HEIGHT / 2
    const isSelected = selected === 0

    return (
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }}>
        <line
          x1={PADDING_X}
          y1={y}
          x2={WIDTH - PADDING_X}
          y2={y}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          style={{
            strokeDashoffset: drawn ? 0 : 1,
            transition: 'stroke-dashoffset 700ms cubic-bezier(0.34, 1.1, 0.64, 1)',
          }}
        />
        <circle
          cx={WIDTH - PADDING_X}
          cy={y}
          r="5"
          fill={color}
          className="cursor-pointer"
          onClick={() => setSelected(isSelected ? null : 0)}
          opacity={drawn ? 1 : 0}
          style={{ transition: 'opacity 400ms ease 250ms' }}
        />
        {isSelected && (
          <text x={WIDTH - PADDING_X} y={y - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-text)">
            {week.avg.toFixed(1)} kg
          </text>
        )}
      </svg>
    )
  }

  const values = weeks.map((w) => w.avg)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = weeks.map((w, i) => ({
    x: PADDING_X + (i / (weeks.length - 1)) * usableWidth,
    y: PADDING_Y + usableHeight - ((w.avg - min) / range) * usableHeight,
  }))

  const linePath = buildSmoothPath(points)
  const last = points[points.length - 1]
  const baseline = HEIGHT - 2
  const areaPath = `${linePath} L ${last.x},${baseline} L ${points[0].x},${baseline} Z`
  const gradientId = 'weight-gradient'

  const selectedIndex = selected ?? weeks.length - 1
  const sel = points[selectedIndex]
  const selWeek = weeks[selectedIndex]

  const labelStep = Math.ceil(weeks.length / 4)

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
        opacity={drawn ? 1 : 0}
        style={{ transition: 'opacity 900ms ease 250ms' }}
      />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        style={{
          strokeDashoffset: drawn ? 0 : 1,
          transition: 'stroke-dashoffset 900ms cubic-bezier(0.34, 1.1, 0.64, 1)',
        }}
      />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === selectedIndex ? 5 : 3}
          fill={i === selectedIndex ? color : 'var(--color-bg)'}
          stroke={color}
          strokeWidth={i === selectedIndex ? 0 : 1.5}
          className="cursor-pointer"
          onClick={() => setSelected(i)}
          opacity={drawn ? 1 : 0}
          style={{ transition: `opacity 400ms ease ${250 + i * 25}ms` }}
        />
      ))}

      {sel && selWeek && (
        <g>
          <text
            x={Math.min(WIDTH - PADDING_X - 18, Math.max(PADDING_X + 18, sel.x))}
            y={sel.y - 13}
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="700"
            fill="var(--color-text)"
          >
            {selWeek.avg.toFixed(1)} kg
          </text>
          <text
            x={Math.min(WIDTH - PADDING_X - 26, Math.max(PADDING_X + 26, sel.x))}
            y={sel.y + 15}
            textAnchor="middle"
            fontSize="8"
            fill="var(--color-text-muted)"
          >
            ↓{selWeek.min.toFixed(1)} · ↑{selWeek.max.toFixed(1)}
          </text>
        </g>
      )}

      {points.map((p, i) =>
        i % labelStep === 0 || i === points.length - 1 ? (
          <text key={`lbl-${i}`} x={p.x} y={HEIGHT - 4} textAnchor="middle" fontSize="8.5" fill="var(--color-text-muted)">
            {formatShortDate(weeks[i].weekStart)}
          </text>
        ) : null
      )}
    </svg>
  )
}
