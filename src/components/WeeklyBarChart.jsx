import { motion } from 'framer-motion'
import { formatDayLabel, todayStr } from '../lib/date'
import usePixelTheme from '../hooks/usePixelTheme'
import { useAuth } from '../contexts/AuthContext'

const WIDTH = 320
const CHART_HEIGHT = 132
const LABEL_HEIGHT = 22
const TOP_PAD = 18
const GAP = 10
const RADIUS = 7

const PROTEIN_COLOR = '#FF8A5B'
const FAT_COLOR = '#F2C94C'
const CARB_COLOR = '#6FCF97'

export default function WeeklyBarChart({ days, macroTotals, selectedDay, onSelectDay }) {
  const pixel = usePixelTheme()
  const { profile } = useAuth()
  const gym = profile?.preferences?.theme === 'gym'
  const blok = profile?.preferences?.theme === 'blok'
  const superTheme = profile?.preferences?.theme === 'pixel-super'
  const today = todayStr()
  const radius = pixel || blok ? 0 : gym ? 1 : RADIUS
  // 8-bit büyüme: bar yüksekliği kademeli (quantized) dolsun
  const pixelEase = (t) => Math.floor(t * 6) / 6
  // Blok istifi: bloklar teker teker konur — 5 kademeli, daha iri adımlar
  const blokEase = (t) => Math.floor(t * 5) / 5

  const dayData = days.map((d) => {
    const m = macroTotals[d] ?? { protein_g: 0, carbs_g: 0, fat_g: 0 }
    const kcal = Math.round(m.protein_g * 4 + m.carbs_g * 4 + m.fat_g * 9)
    return { day: d, m, kcal }
  })
  const maxKcal = Math.max(...dayData.map((d) => d.kcal), 1)
  const barWidth = (WIDTH - GAP * (days.length - 1)) / days.length
  const usableH = CHART_HEIGHT - TOP_PAD

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${WIDTH} ${CHART_HEIGHT + LABEL_HEIGHT}`}
      shapeRendering={pixel || blok ? 'crispEdges' : 'auto'}
    >
      {blok && (
        <defs>
          {/* blok derzleri — 8px'lik küpler: altta/sağda gölge, üstte ışık */}
          <pattern id="wbar-blok" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="transparent" />
            <rect y="7" width="8" height="1" fill="rgba(0,0,0,0.3)" />
            <rect x="7" width="1" height="8" fill="rgba(0,0,0,0.18)" />
            <rect y="0" width="8" height="1" fill="rgba(255,255,255,0.12)" />
          </pattern>
        </defs>
      )}
      {pixel && (
        <defs>
          {/* piksel boncuk deseni — barların üzerine yatay tarama çizgileri */}
          <pattern id="wbar-scan" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="transparent" />
            <rect y="3" width="4" height="1" fill="rgba(0,0,0,0.16)" />
          </pattern>
        </defs>
      )}
      {superTheme && (
        <defs>
          {/* dikey boru gövdesi — sol ışık şeridi, sağ gölge (silindir) */}
          <linearGradient id="wbar-pipe" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="0.22" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="0.55" stopColor="rgba(0,0,0,0)" />
            <stop offset="0.85" stopColor="rgba(0,0,0,0.18)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.32)" />
          </linearGradient>
        </defs>
      )}
      {gym && (
        <defs>
          {/* dökme demir plaka istifi — yatay oluklar (kabartma groove) */}
          <pattern id="wbar-iron" width="10" height="9" patternUnits="userSpaceOnUse">
            <rect width="10" height="9" fill="transparent" />
            <rect y="0" width="10" height="1.2" fill="rgba(0,0,0,0.20)" />
            <rect y="1.2" width="10" height="1" fill="rgba(255,255,255,0.10)" />
          </pattern>
          {/* mat gölge — tepeden dibe hafif koyulaşma (renkleri boğmadan) */}
          <linearGradient id="wbar-iron-shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="0.5" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.16)" />
          </linearGradient>
        </defs>
      )}
      {dayData.map(({ day, m, kcal }, i) => {
        const x = i * (barWidth + GAP)
        const isSelected = day === selectedDay
        const isToday = day === today
        const active = isSelected || isToday
        const x2 = x + barWidth

        const barHeight = kcal > 0 ? Math.max(8, (kcal / maxKcal) * usableH) : 0
        const topY = CHART_HEIGHT - barHeight
        const clipId = `wbar-${i}`

        const macroSum = m.protein_g + m.fat_g + m.carbs_g || 1
        const segs = [
          { v: m.protein_g, c: PROTEIN_COLOR },
          { v: m.fat_g, c: FAT_COLOR },
          { v: m.carbs_g, c: CARB_COLOR },
        ]
        let yCursor = CHART_HEIGHT
        const rendered = segs.map((s) => {
          const h = (s.v / macroSum) * barHeight
          const segY = yCursor - h
          yCursor = segY
          return { ...s, y: segY, h }
        })

        return (
          <g key={day} onClick={() => onSelectDay(day)} className="bar-row cursor-pointer">
            {/* track */}
            <rect
              x={x}
              y={TOP_PAD}
              width={barWidth}
              height={CHART_HEIGHT - TOP_PAD}
              rx={radius}
              fill="var(--color-track)"
              opacity={gym ? 0.55 : blok ? 0.6 : 0.35}
              stroke={gym || blok ? 'rgba(0,0,0,0.45)' : 'none'}
              strokeWidth={gym || blok ? 1 : 0}
            />

            {barHeight > 0 && (
              <>
                <clipPath id={clipId}>
                  <rect x={x} y={topY} width={barWidth} height={barHeight} rx={radius} />
                </clipPath>
                <motion.g
                  clipPath={`url(#${clipId})`}
                  opacity={active ? 1 : 0.4}
                  style={{ transition: 'opacity 200ms ease', transformBox: 'fill-box', transformOrigin: 'bottom' }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={
                    pixel
                      ? { duration: 0.6, delay: i * 0.06, ease: pixelEase }
                      : blok
                        ? // Blok istifi: küpler kat kat oturur.
                          { duration: 0.7, delay: i * 0.07, ease: blokEase }
                        : // Ağır kalkış: barlar plaka kaldırır gibi güçlükle yükselip oturur.
                          { type: 'spring', stiffness: 60, damping: 14, mass: 1.5, delay: i * 0.1 }
                  }
                >
                  {rendered.map((s, idx) =>
                    s.v > 0 ? <rect key={idx} x={x} y={s.y} width={barWidth} height={s.h} fill={s.c} /> : null
                  )}
                  {superTheme ? (
                    <rect x={x} y={topY} width={barWidth} height={barHeight} fill="url(#wbar-pipe)" />
                  ) : (
                    pixel && <rect x={x} y={topY} width={barWidth} height={barHeight} fill="url(#wbar-scan)" />
                  )}
                  {blok && <rect x={x} y={topY} width={barWidth} height={barHeight} fill="url(#wbar-blok)" />}
                  {gym && (
                    <>
                      {/* plaka olukları + mat gölge */}
                      <rect x={x} y={topY} width={barWidth} height={barHeight} fill="url(#wbar-iron)" />
                      <rect x={x} y={topY} width={barWidth} height={barHeight} fill="url(#wbar-iron-shade)" />
                    </>
                  )}
                </motion.g>
                {/* süper: boru ağzı — barın tepesinde yanlara taşan bilezik */}
                {superTheme &&
                  (() => {
                    const topColor = [...rendered].reverse().find((s) => s.v > 0)?.c ?? CARB_COLOR
                    const rx = x - 2
                    const rw = barWidth + 4
                    return (
                      <g opacity={active ? 1 : 0.4} style={{ transition: 'opacity 200ms ease' }}>
                        <rect x={rx} y={topY} width={rw} height={6} fill={topColor} />
                        <rect x={rx} y={topY} width={rw} height={6} fill="url(#wbar-pipe)" />
                        <rect x={rx} y={topY} width={rw} height={6} fill="rgba(0,0,0,0.14)" />
                        <rect x={rx} y={topY} width={rw} height={1} fill="rgba(255,255,255,0.45)" />
                        <rect x={rx} y={topY + 6} width={rw} height={1} fill="rgba(0,0,0,0.35)" />
                      </g>
                    )
                  })()}
                {/* gym: dökme demir blok kenarı */}
                {gym && (
                  <rect
                    x={x + 0.5}
                    y={topY + 0.5}
                    width={barWidth - 1}
                    height={barHeight - 1}
                    rx={radius}
                    fill="none"
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth="1"
                    opacity={active ? 1 : 0.4}
                  />
                )}
              </>
            )}

            {/* kcal label — bar oturduktan sonra belirir */}
            {kcal > 0 && (
              <motion.text
                x={x + barWidth / 2}
                y={topY - 6}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight={active ? '700' : '500'}
                fill={active ? 'var(--color-text)' : 'var(--color-text-muted)'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: pixel ? i * 0.06 + 0.4 : blok ? i * 0.07 + 0.5 : i * 0.1 + 0.45, duration: 0.35 }}
              >
                {kcal}
              </motion.text>
            )}

            {/* selected underline */}
            {isSelected && (
              <rect x={x + barWidth / 2 - 6} y={CHART_HEIGHT + LABEL_HEIGHT - 3} width="12" height="2.5" rx="1.25" fill="var(--color-accent)" />
            )}

            <text
              x={x + barWidth / 2}
              y={CHART_HEIGHT + 15}
              textAnchor="middle"
              fontSize="10"
              fontWeight={isToday ? '700' : '500'}
              fill={active ? 'var(--color-text)' : 'var(--color-text-muted)'}
            >
              {formatDayLabel(day)}
            </text>
            <rect x={x} y="0" width={barWidth} height={CHART_HEIGHT} fill="transparent" />
          </g>
        )
      })}
    </svg>
  )
}
