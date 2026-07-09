import usePixelTheme from '../hooks/usePixelTheme'
import { PixelBronzeBadge } from './pixelSprites'

export default function BronzeBadge({ size = 40 }) {
  const pixel = usePixelTheme()
  if (pixel) return <PixelBronzeBadge size={size} />

  const uid = 'bronze'
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id={`${uid}-disc`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#F0B47A" />
          <stop offset="45%" stopColor="#C77B3C" />
          <stop offset="100%" stopColor="#8A4F22" />
        </radialGradient>
        <linearGradient id={`${uid}-ribbonL`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E0573E" />
          <stop offset="100%" stopColor="#A8341F" />
        </linearGradient>
        <linearGradient id={`${uid}-ribbonR`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F84D6" />
          <stop offset="100%" stopColor="#2E579C" />
        </linearGradient>
        <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ribbons */}
      <path d="M16 6 L22 26 L15 25 L11.5 18 Z" fill={`url(#${uid}-ribbonL)`} />
      <path d="M32 6 L26 26 L33 25 L36.5 18 Z" fill={`url(#${uid}-ribbonR)`} />

      {/* medal disc */}
      <circle cx="24" cy="31" r="14" fill={`url(#${uid}-disc)`} stroke="#6E3D1A" strokeWidth="1.2" />
      <circle cx="24" cy="31" r="10.5" fill="none" stroke="#F2C79A" strokeWidth="1" strokeOpacity="0.5" />

      {/* star */}
      <path
        d="M24 24.5l1.9 4 4.3.5-3.2 2.9 0.9 4.3L24 34.1l-3.9 2.1 0.9-4.3-3.2-2.9 4.3-0.5z"
        fill="#FCE3C2"
      />

      {/* gloss */}
      <ellipse cx="20" cy="25" rx="9" ry="5" fill={`url(#${uid}-shine)`} opacity="0.7" />
    </svg>
  )
}
