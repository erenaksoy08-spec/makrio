import usePixelTheme from '../hooks/usePixelTheme'
import useBlokTheme from '../hooks/useBlokTheme'
import { PixelShield } from './pixelSprites'
import { BlokShield } from './blokSprites'

// Streak kurtarıcı logosu — seriyi (ateşi) koruyan bir kalkan içinde alev.
export default function StreakSaverIcon({ size = 24, active = true }) {
  const pixel = usePixelTheme()
  const blok = useBlokTheme()
  if (blok) return <BlokShield size={size} active={active} />
  if (pixel) return <PixelShield size={size} active={active} />

  const uid = `saver-${Math.round(size)}-${active ? 'on' : 'off'}`
  const shield = active ? '#FB923C' : 'var(--color-text-muted)'

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`${uid}-flame`} x1="12" y1="8" x2="12" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFD54A" />
          <stop offset="1" stopColor="#FB6340" />
        </linearGradient>
        <linearGradient id={`${uid}-fill`} x1="12" y1="2.5" x2="12" y2="21.5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={active ? '#FB923C' : '#4b4b4b'} stopOpacity="0.22" />
          <stop offset="1" stopColor={active ? '#FB923C' : '#4b4b4b'} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* kalkan */}
      <path
        d="M12 2.6 19.4 5.3 A0.9 0.9 0 0 1 20 6.1 V11.4 C20 16.1 16.6 19.7 12 21.4 C7.4 19.7 4 16.1 4 11.4 V6.1 A0.9 0.9 0 0 1 4.6 5.3 Z"
        fill={`url(#${uid}-fill)`}
        stroke={shield}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* alev */}
      {active ? (
        <path
          d="M12 7.4 C12.3 9.6 15 10.2 15 13.1 A3 3 0 0 1 9 13.2 C9 11.9 9.7 11.1 10.4 10.6 C10.5 11.5 11 11.9 11.5 12.05 C10.6 10.8 11 8.9 12 7.4 Z"
          fill={`url(#${uid}-flame)`}
        />
      ) : (
        <path
          d="M12 8 C12.3 9.9 14.5 10.5 14.5 12.9 A2.5 2.5 0 0 1 9.5 13 C9.5 11.9 10.1 11.3 10.7 10.9 C10.8 11.6 11.2 11.9 11.6 12 C10.8 11 11.1 9.3 12 8 Z"
          fill="var(--color-text-muted)"
          opacity="0.6"
        />
      )}
    </svg>
  )
}
