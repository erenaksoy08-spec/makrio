const TOP = 3
const BOTTOM = 25
const HEIGHT = BOTTOM - TOP
const GLASS_POLYGON = '3,3 19,3 16,25 6,25'
const WATER_COLOR = '#29B6F6'
const WAVE_PATH =
  'M -22 0 Q -16.5 -2.2 -11 0 Q -5.5 2.2 0 0 Q 5.5 -2.2 11 0 Q 16.5 2.2 22 0 Q 27.5 -2.2 33 0 L 33 8 L -22 8 Z'

// Piksel bardak — 8-bit kupa. Su tek blok halinde kademeli (steps) yükselir;
// yüzey çizgisi, sol ışık şeridi ve yarıdan sonra yükselen piksel kabarcıkla.
const PX_STEP = 'y 550ms steps(5, end), height 550ms steps(5, end)'

function PixelGlass({ fraction }) {
  const f = Math.max(0, Math.min(1, fraction))
  const levels = Math.round(f * 6)
  const filled = f >= 1
  const outline = filled ? WATER_COLOR : 'var(--color-track)'
  const waterH = levels * 3
  const topY = 24 - waterH

  return (
    <svg
      key={filled ? 'full' : 'partial'}
      viewBox="0 0 22 28"
      className={`h-9 w-full ${filled ? 'pixel-pop' : ''}`}
      shapeRendering="crispEdges"
      style={{ transformOrigin: 'center' }}
    >
      {/* ağız kenarı (rim) */}
      <rect x="3" y="2" width="3" height="1.5" fill={outline} />
      <rect x="16" y="2" width="3" height="1.5" fill={outline} />

      {/* gövde — köşe pikselleri kırpılmış 8-bit kupa */}
      <rect x="4" y="3.5" width="2" height="19" fill={outline} />
      <rect x="16" y="3.5" width="2" height="19" fill={outline} />
      <rect x="5.5" y="22.5" width="2" height="2" fill={outline} />
      <rect x="14.5" y="22.5" width="2" height="2" fill={outline} />
      <rect x="7" y="24" width="8" height="2" fill={outline} />

      {/* su gövdesi — kademeli yükselir */}
      <rect x="6" width="10" fill={WATER_COLOR} style={{ y: topY, height: waterH, transition: PX_STEP }} />

      {/* sol ışık şeridi — cam parlaması */}
      <rect x="7" width="2" fill="#7fd4fb" opacity="0.9" style={{ y: topY, height: waterH, transition: PX_STEP }} />

      {/* su yüzeyi — açık mavi üst çizgi */}
      {levels > 0 && (
        <rect x="6" width="10" height="1.5" fill="#b5e6ff" style={{ y: topY, transition: PX_STEP }} />
      )}

      {/* piksel kabarcık — yarıdan sonra kesik kesik yükselir */}
      {levels >= 3 && (
        <rect
          x="12"
          y={22 - waterH / 2}
          width="1.5"
          height="1.5"
          fill="#dff4ff"
          className="pixel-bubble"
        />
      )}
    </svg>
  )
}

// Gym shaker/matara — silindirik gövde, vidalı kapak + flip ağız, yan ölçü
// çizgileri. Su mavisi korunur; gövde ve kapak fırçalanmış metal grisi.
function ShakerBottle({ fraction, index }) {
  const clipId = `shaker-clip-${index}`
  const bodyTop = 6
  const bodyBottom = 26
  const H = bodyBottom - bodyTop
  const f = Math.max(0, Math.min(1, fraction))
  const fillHeight = f * H
  const fillY = bodyBottom - fillHeight
  const filled = f >= 1
  const body = filled ? WATER_COLOR : 'var(--color-track)'
  const metal = '#6a6f74'

  return (
    <svg viewBox="0 0 22 28" className="h-9 w-full">
      <defs>
        <clipPath id={clipId}>
          <rect x="4.5" y={bodyTop} width="13" height={H} rx="2.6" />
        </clipPath>
      </defs>

      {/* su gövdesi (gövde içine kırpılı) */}
      <g clipPath={`url(#${clipId})`}>
        <rect
          x="4.5"
          width="13"
          fill={WATER_COLOR}
          style={{
            y: fillY,
            height: fillHeight,
            transition: 'y 600ms cubic-bezier(0.34, 1.2, 0.64, 1), height 600ms cubic-bezier(0.34, 1.2, 0.64, 1)',
          }}
        />
        {/* sol plastik parlaması */}
        <rect x="5.5" y={bodyTop} width="1.6" height={H} fill="#ffffff" opacity="0.14" />
      </g>

      {/* gövde konturu */}
      <rect x="4.5" y={bodyTop} width="13" height={H} rx="2.6" fill="none" stroke={body} strokeWidth="1.5" />

      {/* yan ölçü çizgileri */}
      <g stroke="var(--color-text-muted)" strokeWidth="0.7" opacity="0.6" strokeLinecap="round">
        <line x1="14.5" y1="11" x2="16.2" y2="11" />
        <line x1="14.5" y1="15.5" x2="15.6" y2="15.5" />
        <line x1="14.5" y1="20" x2="16.2" y2="20" />
      </g>

      {/* boyun */}
      <rect x="7.5" y="4.4" width="7" height="2" fill={metal} />
      {/* vidalı kapak */}
      <rect x="6" y="2.4" width="10" height="2.6" rx="0.8" fill={metal} stroke="#3c4044" strokeWidth="0.6" />
      {/* flip ağız */}
      <rect x="9" y="0.8" width="4" height="2" rx="0.7" fill="#7d8288" stroke="#3c4044" strokeWidth="0.5" />
      {/* kapak üstü ışık */}
      <rect x="6.6" y="2.7" width="8.8" height="0.7" rx="0.35" fill="#ffffff" opacity="0.22" />
    </svg>
  )
}

// Litrelik şişe — hedef aşıldıktan sonra fazla su bardak yerine şişeyle gösterilir.
export function WaterBottle({ fraction, index, pixel = false, realistic = false }) {
  const f = Math.max(0, Math.min(1, fraction))
  const filled = f >= 1

  if (pixel) {
    const levels = Math.round(f * 8)
    const waterH = levels * 2.5
    const topY = 29 - waterH
    const outline = filled ? WATER_COLOR : 'var(--color-track)'
    return (
      <svg
        key={filled ? 'full' : 'partial'}
        viewBox="0 0 22 32"
        className={`h-10 w-full ${filled ? 'pixel-pop' : ''}`}
        shapeRendering="crispEdges"
        style={{ transformOrigin: 'center' }}
      >
        {/* kapak */}
        <rect x="8" y="1" width="6" height="3" fill={outline} />
        {/* boyun */}
        <rect x="8.5" y="4" width="1.5" height="3" fill={outline} />
        <rect x="12" y="4" width="1.5" height="3" fill={outline} />
        {/* gövde konturu */}
        <rect x="5" y="7" width="2" height="22" fill={outline} />
        <rect x="15" y="7" width="2" height="22" fill={outline} />
        <rect x="6" y="29" width="10" height="2" fill={outline} />
        {/* su — kademeli yükselir */}
        <rect x="7" width="8" fill={WATER_COLOR} style={{ y: topY, height: waterH, transition: PX_STEP }} />
        {levels > 0 && (
          <rect x="7" width="8" height="1.5" fill="#b5e6ff" style={{ y: topY, transition: PX_STEP }} />
        )}
      </svg>
    )
  }

  const clipId = `water-bottle-clip-${index}`
  const bodyTop = 8
  const bodyBottom = 30
  const H = bodyBottom - bodyTop
  const fillHeight = f * H
  const fillY = bodyBottom - fillHeight
  const outline = filled ? WATER_COLOR : 'var(--color-track)'
  const showWaves = realistic && f > 0
  const showBubbles = realistic && f > 0.25

  return (
    <svg viewBox="0 0 22 32" className="h-10 w-full">
      <defs>
        <clipPath id={clipId}>
          <rect x="5.5" y={bodyTop} width="11" height={H} rx="3" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect
          x="5.5"
          width="11"
          fill={WATER_COLOR}
          style={{
            y: fillY,
            height: fillHeight,
            transition: 'y 600ms cubic-bezier(0.34, 1.2, 0.64, 1), height 600ms cubic-bezier(0.34, 1.2, 0.64, 1)',
          }}
        />
        {showWaves && (
          <g style={{ transform: `translateY(${fillY}px)`, transition: 'transform 600ms cubic-bezier(0.34, 1.2, 0.64, 1)' }}>
            <path d={WAVE_PATH} fill={WATER_COLOR} opacity="0.55" className="water-wave-a" />
            <path d={WAVE_PATH} fill="#7fd4fb" opacity="0.45" className="water-wave-b" />
          </g>
        )}
        {showBubbles && (
          <g style={{ transform: `translateY(${fillY}px)` }}>
            <circle className="water-bubble" cx="9" cy={fillHeight - 2} r="0.8" fill="#dff4ff" style={{ animationDelay: '0.3s' }} />
            <circle className="water-bubble" cx="12.5" cy={fillHeight - 4} r="0.6" fill="#dff4ff" style={{ animationDelay: '1.2s' }} />
          </g>
        )}
        <rect x="6.8" y={bodyTop} width="1.4" height={H} fill="#ffffff" opacity="0.16" />
      </g>
      {/* gövde */}
      <rect x="5.5" y={bodyTop} width="11" height={H} rx="3" fill="none" stroke={outline} strokeWidth="1.5" />
      {/* boyun */}
      <path d="M9 7.5 L9 5.5 M13 7.5 L13 5.5" stroke={outline} strokeWidth="1.4" strokeLinecap="round" />
      {/* kapak */}
      <rect x="8" y="2" width="6" height="3" rx="1" fill={filled ? WATER_COLOR : 'var(--color-track)'} />
    </svg>
  )
}

export default function WaterGlass({ fraction, index, realistic = false, pixel = false, gym = false }) {
  if (pixel) return <PixelGlass fraction={fraction} />
  if (gym) return <ShakerBottle fraction={fraction} index={index} />

  const clipId = `water-glass-clip-${index}`
  const f = Math.max(0, Math.min(1, fraction))
  const fillHeight = f * HEIGHT
  const fillY = BOTTOM - fillHeight
  const filled = f >= 1
  const showWaves = realistic && f > 0
  const showBubbles = realistic && f > 0.25

  return (
    <svg viewBox="0 0 22 28" className="h-9 w-full">
      <defs>
        <clipPath id={clipId}>
          <polygon points={GLASS_POLYGON} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect
          x="3"
          width="16"
          fill={WATER_COLOR}
          style={{
            y: fillY,
            height: fillHeight,
            transition: 'y 600ms cubic-bezier(0.34, 1.2, 0.64, 1), height 600ms cubic-bezier(0.34, 1.2, 0.64, 1)',
          }}
        />
        {showWaves && (
          <g style={{ transform: `translateY(${fillY}px)`, transition: 'transform 600ms cubic-bezier(0.34, 1.2, 0.64, 1)' }}>
            <path d={WAVE_PATH} fill={WATER_COLOR} opacity="0.55" className="water-wave-a" />
            <path d={WAVE_PATH} fill="#7fd4fb" opacity="0.45" className="water-wave-b" />
          </g>
        )}
        {showBubbles && (
          <g style={{ transform: `translateY(${fillY}px)` }}>
            <circle className="water-bubble" cx="9" cy={fillHeight - 2} r="0.9" fill="#dff4ff" style={{ animationDelay: '0s' }} />
            <circle className="water-bubble" cx="13" cy={fillHeight - 4} r="0.7" fill="#dff4ff" style={{ animationDelay: '0.9s' }} />
            <circle className="water-bubble" cx="11" cy={fillHeight - 1} r="0.6" fill="#dff4ff" style={{ animationDelay: '1.6s' }} />
          </g>
        )}
      </g>
      <polygon
        points={GLASS_POLYGON}
        fill="none"
        stroke={filled ? WATER_COLOR : 'var(--color-track)'}
        strokeWidth="1.5"
        style={{ transition: 'stroke 300ms ease' }}
      />
    </svg>
  )
}
