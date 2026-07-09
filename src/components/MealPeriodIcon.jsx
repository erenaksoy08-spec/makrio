import usePixelTheme from '../hooks/usePixelTheme'
import { PixelMealIcon } from './pixelSprites'

export default function MealPeriodIcon({ type, color, size = 18 }) {
  const pixel = usePixelTheme()
  if (pixel) return <PixelMealIcon type={type} color={color} size={size} />

  const stroke = color
  const common = { stroke, strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }

  if (type === 'morning') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 3v3" {...common} />
        <path d="M5.5 7.5l1.6 1.6M18.5 7.5l-1.6 1.6" {...common} />
        <path d="M5 16a7 7 0 0 1 14 0" {...common} />
        <path d="M2.5 16h19" {...common} />
      </svg>
    )
  }

  if (type === 'noon') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" {...common} />
        <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5L17 7M7 17l-1.5 1.5" {...common} />
      </svg>
    )
  }

  if (type === 'evening') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M5 13a7 7 0 0 1 14 0" {...common} />
        <path d="M2.5 13h19" {...common} />
        <path d="M5.5 17.5h13" {...common} />
        <path d="M9 4.5l1.2 1.6M15 4.5l-1.2 1.6" {...common} />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M16.5 14.5a6.5 6.5 0 0 1-8-8 6.5 6.5 0 1 0 8 8z" {...common} />
      <circle cx="17.5" cy="6.5" r="0.8" fill={stroke} stroke="none" />
      <circle cx="14.5" cy="4" r="0.6" fill={stroke} stroke="none" />
    </svg>
  )
}
