import { motion } from 'framer-motion'
import BronzeBadge from './BronzeBadge'
import PixelBrain from './PixelBrain'
import DumbbellIcon from './DumbbellIcon'
import CrownIcon from './CrownIcon'
import usePixelTheme from '../hooks/usePixelTheme'
import { PixelRewardIcon, hasPixelRewardIcon } from './pixelSprites'

// Ödül madalyonu — koleksiyon karolarında ve seremoni ekranında kullanılır.
// state: 'locked' (gri, ilerleme halkası) | 'sealed' (mühürlü altın, "?") | 'open' (renkli, ikon)
// Metalik bezel: ton halkası + üzerine beyaz→siyah eğimli ışık halkası bindirilir.
export default function RewardMedallion({ reward, state, size = 62, progress = 0, sheenDelay = 0 }) {
  const pixelUi = usePixelTheme()
  const a = reward.accent
  const gold = '#F2A93B'
  const ring = size >= 100 ? 5.5 : 4
  const r = (size - ring) / 2
  const C = 2 * Math.PI * r
  const isOpen = state === 'open'
  const sealed = state === 'sealed'
  const tone = sealed ? gold : a
  const uid = `${reward.id}-${size}`

  const discBg = isOpen
    ? `radial-gradient(circle at 35% 28%, ${a}E6, ${a}47 55%, ${a}14 100%)`
    : sealed
      ? `radial-gradient(circle at 35% 28%, ${gold}E6, ${gold}47 55%, ${gold}14 100%)`
      : 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.13), rgba(255,255,255,0.04) 60%, rgba(255,255,255,0.02))'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <defs>
          {/* bezel ışığı: sol üstten beyaz vurgu, sağ alttan gölge */}
          <linearGradient id={`mr-bevel-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.65" />
            <stop offset="0.42" stopColor="#FFFFFF" stopOpacity="0.06" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* zemin halkası */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={ring} />

        {isOpen || sealed ? (
          <>
            {/* ton halkası + metalik bindirme */}
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={ring} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#mr-bevel-${uid})`} strokeWidth={ring} />
          </>
        ) : progress > 0 ? (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`${a}B3`}
            strokeWidth={ring}
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - Math.min(1, progress)) }}
            transition={{ duration: 0.9, ease: [0.34, 1.1, 0.64, 1] }}
          />
        ) : null}
      </svg>

      {/* disk */}
      <div
        className="absolute overflow-hidden rounded-full"
        style={{
          inset: ring + 2.5,
          background: discBg,
          border: `1px solid ${isOpen || sealed ? `${tone}59` : 'rgba(255,255,255,0.07)'}`,
          boxShadow:
            isOpen || sealed
              ? `0 0 ${size / 4.5}px ${tone}40, inset 0 1.5px 0 rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.35)`
              : 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* cam parlaması — üst yarıya düşen ışık */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ background: 'linear-gradient(168deg, rgba(255,255,255,0.30), transparent 46%)' }}
        />

        {/* süzülen ışık taraması (yalnızca açılmış/mühürlü) */}
        {(isOpen || sealed) && (
          <span
            className="medal-sheen pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.28) 50%, transparent 62%)',
              animationDelay: `${sheenDelay}s`,
            }}
          />
        )}

        <span className="absolute inset-0 flex items-center justify-center">
          {isOpen ? (
            pixelUi && hasPixelRewardIcon(reward.id) ? (
              <span style={{ filter: `drop-shadow(0 2px 6px ${a}80)` }}>
                <PixelRewardIcon rewardId={reward.id} size={size * 0.5} />
              </span>
            ) : reward.type === 'badge' ? (
              <BronzeBadge size={size * 0.6} tier={reward.value} />
            ) : reward.id === 'pixel-theme' ? (
              <span className="pixel-bounce inline-flex">
                <PixelBrain size={size * 0.56} />
              </span>
            ) : reward.id === 'gym-theme' ? (
              // İlk Gün Paketi — iki hediye birden: dambıl + su dostu yan yana
              <span className="flex items-center" style={{ gap: size * 0.02 }}>
                <DumbbellIcon size={size * 0.46} />
                <span
                  style={{
                    fontSize: size * 0.3,
                    lineHeight: 1,
                    filter: 'drop-shadow(0 2px 5px rgba(41,182,246,0.55))',
                  }}
                >
                  🙂
                </span>
              </span>
            ) : reward.id === 'premium-nav' ? (
              <CrownIcon size={size * 0.6} />
            ) : (
              <span style={{ fontSize: size * 0.34, filter: `drop-shadow(0 2px 6px ${a}80)` }}>{reward.icon}</span>
            )
          ) : sealed ? (
            <span
              className="font-black"
              style={{ fontSize: size * 0.38, color: gold, textShadow: `0 0 14px ${gold}CC, 0 2px 2px rgba(0,0,0,0.4)` }}
            >
              ?
            </span>
          ) : (
            <span style={{ fontSize: size * 0.28, opacity: 0.45 }}>🔒</span>
          )}
        </span>
      </div>
    </div>
  )
}
