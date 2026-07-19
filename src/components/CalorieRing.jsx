import { useEffect, useState } from 'react'
import { useCountUp } from '../hooks/useCountUp'
import usePixelTheme from '../hooks/usePixelTheme'
import useBlokTheme from '../hooks/useBlokTheme'
import { useAuth } from '../contexts/AuthContext'
import { t } from '../lib/i18n'

export default function CalorieRing({ consumed, goal, color = '#3DA5FF', shape = 'circle' }) {
  const pixelTheme = usePixelTheme()
  const blok = useBlokTheme()
  // Süper Makrio: halka dairesel bir boru gibi çizilir (gövde ışığı + uç bileziği).
  const superTheme = useAuth().profile?.preferences?.theme === 'pixel-super'
  // Blok Diyarı da piksel halka dilini kullanır: kademeli dolum, keskin uçlar.
  const pixel = pixelTheme || blok
  const square = shape === 'square'
  const size = 172
  const stroke = 16
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  // Kare halka pathLength=100 ölçeğinde çalışır; daire piksel cinsinden.
  const total = square ? 100 : circumference
  const ratio = goal > 0 ? Math.min(1, consumed / goal) : 0
  const offset = total * (1 - ratio)
  const over = Math.max(0, Math.round(consumed - goal))
  const remaining = Math.max(0, goal - consumed)

  const [animatedOffset, setAnimatedOffset] = useState(total)

  useEffect(() => {
    setAnimatedOffset(offset)
  }, [offset])

  const animatedRemaining = useCountUp(over > 0 ? over : remaining, 800)

  const innerDiameter = size - stroke * 2
  const numberFontSize = innerDiameter * 0.28
  const captionFontSize = innerDiameter * 0.085

  const rectProps = {
    x: stroke / 2 + 1,
    y: stroke / 2 + 1,
    width: size - stroke - 2,
    height: size - stroke - 2,
    rx: 30,
    fill: 'none',
    strokeWidth: stroke,
  }

  return (
    <div className="relative flex items-center justify-center">
      {square ? (
        // Kare halka (Vitrin) — yumuşak köşeli çerçeve, üstten dolar
        <svg width={size} height={size}>
          <rect {...rectProps} stroke="var(--color-track)" />
          <rect
            {...rectProps}
            stroke={color}
            pathLength="100"
            strokeDasharray="100"
            strokeLinecap={pixel ? 'butt' : 'round'}
            style={{
              strokeDashoffset: animatedOffset,
              transition: pixel
                ? 'stroke-dashoffset 900ms steps(9, end)'
                : 'stroke-dashoffset 900ms cubic-bezier(0.34, 1.1, 0.64, 1)',
              filter: pixel ? 'none' : `drop-shadow(0 0 7px ${color}4D)`,
            }}
          />
          {pixel && (
            <rect {...rectProps} stroke="rgba(255,255,255,0.32)" pathLength="100" strokeDasharray="1.3 2.9" />
          )}
        </svg>
      ) : pixel ? (
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-track)"
            strokeWidth={stroke}
          />
          {/* dolum — makro barlar gibi kesintisiz ama kademeli (steps) dolar */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeLinecap="butt"
            style={{
              strokeDashoffset: animatedOffset,
              transition: 'stroke-dashoffset 900ms steps(9, end)',
            }}
          />
          {superTheme ? (
            <>
              {/* boru gövdesi — dış kenarda ışık şeridi, iç kenarda gölge (yalnız dolu yay) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius + stroke / 2 - 2.5}
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={3}
                pathLength="100"
                strokeDasharray="100"
                style={{
                  strokeDashoffset: (animatedOffset / circumference) * 100,
                  transition: 'stroke-dashoffset 900ms steps(9, end)',
                }}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius - stroke / 2 + 2.5}
                fill="none"
                stroke="rgba(0,0,0,0.24)"
                strokeWidth={3.5}
                pathLength="100"
                strokeDasharray="100"
                style={{
                  strokeDashoffset: (animatedOffset / circumference) * 100,
                  transition: 'stroke-dashoffset 900ms steps(9, end)',
                }}
              />
              {/* boru ağzı — dolumun ucunda iki yana taşan bilezik, dolumla birlikte döner */}
              {ratio > 0.02 && (
                <g
                  style={{
                    transform: `rotate(${360 * (1 - animatedOffset / circumference)}deg)`,
                    transformOrigin: '50% 50%',
                    transition: 'transform 900ms steps(9, end)',
                  }}
                >
                  <rect
                    x={size / 2 + radius - stroke / 2 - 2.5}
                    y={size / 2 - 3.5}
                    width={stroke + 5}
                    height={7}
                    fill={color}
                    stroke="rgba(0,0,0,0.42)"
                    strokeWidth="1"
                  />
                  <rect
                    x={size / 2 + radius - stroke / 2 - 2.5}
                    y={size / 2 - 3.5}
                    width={stroke + 5}
                    height={7}
                    fill="rgba(0,0,0,0.16)"
                  />
                  <rect
                    x={size / 2 + radius - stroke / 2 - 2.5}
                    y={size / 2 - 3.5}
                    width={3.5}
                    height={7}
                    fill="rgba(255,255,255,0.4)"
                  />
                </g>
              )}
            </>
          ) : (
            /* boncuk deseni — bar-fill'deki açık çizgilerin dairesel karşılığı */
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.32)"
              strokeWidth={stroke}
              strokeDasharray="2 4.5"
            />
          )}
        </svg>
      ) : (
        <svg width={size} height={size} className="-rotate-90">
          {/* boş halka — gömme kanal hissi veren rafine track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-track)"
            strokeWidth={stroke}
            opacity="0.5"
          />
          {/* dış kenar ince gölge çizgisi */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + stroke / 2 - 0.75}
            fill="none"
            stroke="rgba(0,0,0,0.28)"
            strokeWidth="1.5"
          />
          {/* iç kenar ince ışık çizgisi */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - stroke / 2 + 0.75}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1.5"
          />
          {/* dolum */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeLinecap="round"
            style={{
              strokeDashoffset: animatedOffset,
              transition: 'stroke-dashoffset 900ms cubic-bezier(0.34, 1.1, 0.64, 1)',
              filter: `drop-shadow(0 0 7px ${color}4D)`,
            }}
          />
        </svg>
      )}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: innerDiameter * 0.85, height: innerDiameter * 0.85 }}
      >
        <span
          className="font-bold tabular-nums text-text"
          style={{ fontSize: numberFontSize, lineHeight: 1 }}
        >
          {animatedRemaining}
        </span>
        <span
          className="uppercase text-text-muted"
          style={{ fontSize: captionFontSize * 0.92, lineHeight: 1.4, marginTop: 5, letterSpacing: '0.14em' }}
        >
          {over > 0 ? t('kcal aşıldı') : t('kcal kaldı')}
        </span>
      </div>
    </div>
  )
}
