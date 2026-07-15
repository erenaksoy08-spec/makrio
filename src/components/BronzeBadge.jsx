import usePixelTheme from '../hooks/usePixelTheme'
import useBlokTheme from '../hooks/useBlokTheme'
import { PixelBronzeBadge } from './pixelSprites'

// Seri rütbe nişanı — kademeye göre kalkan: bronz (30g), gümüş (60g), altın (90g).
// Rütbe hissi: metal rengi + kalkan altındaki şerit sayısı kademeyle artar.
// Yeni kademeler (platin, elmas...) TIERS'a satır eklenerek açılır.
const TIERS = {
  bronze: {
    rim: ['#F2BE8A', '#C77B3C', '#7A431C'],
    face: ['#B96F30', '#8A4F22', '#5E3413'],
    edge: '#3E2109',
    liner: '#F2C79A',
    star: ['#FFEECF', '#EFAF6E'],
    starEdge: '#5E3413',
    glow: 'rgba(224,163,78,0.5)',
    chevrons: 0,
  },
  silver: {
    rim: ['#FFFFFF', '#C3CAD4', '#79828F'],
    face: ['#AEB6C2', '#8B94A1', '#636C79'],
    edge: '#39404A',
    liner: '#EDF1F7',
    star: ['#FFFFFF', '#C9D1DC'],
    starEdge: '#636C79',
    glow: 'rgba(199,204,214,0.5)',
    chevrons: 1,
  },
  gold: {
    rim: ['#FFF0B8', '#E8B84B', '#A87A1C'],
    face: ['#DCA92F', '#B08117', '#7E5A12'],
    edge: '#4E3708',
    liner: '#FBE9A6',
    star: ['#FFF9DC', '#F5D66E'],
    starEdge: '#7E5A12',
    glow: 'rgba(245,200,75,0.55)',
    chevrons: 2,
  },
}

// Blok Diyarı sürümü — kademe madeninden izometrik cevher bloğu.
const BLOK_TIERS = {
  bronze: { top: '#E09A55', left: '#B06A2C', right: '#8A4F22', spark: '#FFDFAE' },
  silver: { top: '#E8EDF4', left: '#B9C1CC', right: '#8B94A1', spark: '#FFFFFF' },
  gold: { top: '#F6D96B', left: '#D9A928', right: '#A87A1C', spark: '#FFF3C4' },
}

function BlokBadge({ size, tier }) {
  const t = BLOK_TIERS[tier] ?? BLOK_TIERS.bronze
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" shapeRendering="crispEdges" aria-hidden="true">
      <polygon points="20,3 36,11 20,19 4,11" fill={t.top} />
      <polygon points="4,11 20,19 20,37 4,29" fill={t.left} />
      <polygon points="36,11 20,19 20,37 36,29" fill={t.right} />
      {/* cevher parıltıları */}
      <rect x="17" y="8" width="4" height="3" fill={t.spark} />
      <rect x="27" y="11" width="3" height="2" fill={t.spark} opacity="0.7" />
      <rect x="9" y="17" width="3" height="3" fill={t.spark} opacity="0.85" />
      <rect x="13" y="26" width="3" height="3" fill={t.spark} opacity="0.55" />
      <rect x="26" y="21" width="3" height="3" fill={t.spark} opacity="0.8" />
      <rect x="29" y="29" width="3" height="3" fill={t.spark} opacity="0.5" />
    </svg>
  )
}

export default function BronzeBadge({ size = 40, tier = 'bronze' }) {
  const pixel = usePixelTheme()
  const blok = useBlokTheme()
  if (pixel) return <PixelBronzeBadge size={size} tier={tier} />
  if (blok) return <BlokBadge size={size} tier={tier} />

  const t = TIERS[tier] ?? TIERS.bronze
  const uid = `rank-${tier}`
  const star =
    'M24 14 L26.06 19.67 L32.08 19.87 L27.33 23.58 L29 29.38 L24 26 L19 29.38 L20.67 23.58 L15.92 19.87 L21.94 19.67 Z'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={{ filter: `drop-shadow(0 1px 3px ${t.glow})` }}
    >
      <defs>
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.rim[0]} />
          <stop offset="52%" stopColor={t.rim[1]} />
          <stop offset="100%" stopColor={t.rim[2]} />
        </linearGradient>
        <linearGradient id={`${uid}-face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.face[0]} />
          <stop offset="55%" stopColor={t.face[1]} />
          <stop offset="100%" stopColor={t.face[2]} />
        </linearGradient>
        <linearGradient id={`${uid}-star`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={t.star[0]} />
          <stop offset="100%" stopColor={t.star[1]} />
        </linearGradient>
        <linearGradient id={`${uid}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* dış kalkan — metal jant */}
      <path
        d="M24 2.5 L42 9 V25 C42 35.6 34.6 42.9 24 45.8 C13.4 42.9 6 35.6 6 25 V9 Z"
        fill={`url(#${uid}-rim)`}
        stroke={t.edge}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* iç yüz */}
      <path
        d="M24 6.6 L38.4 11.8 V24.8 C38.4 33.4 32.5 39.3 24 41.9 C15.5 39.3 9.6 33.4 9.6 24.8 V11.8 Z"
        fill={`url(#${uid}-face)`}
        stroke={t.edge}
        strokeOpacity="0.55"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {/* iç astar çizgisi */}
      <path
        d="M24 8.8 L36.6 13.3 V24.6 C36.6 32.2 31.4 37.5 24 39.9 C16.6 37.5 11.4 32.2 11.4 24.6 V13.3 Z"
        fill="none"
        stroke={t.liner}
        strokeOpacity="0.4"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* üst cam parlaması */}
      <path
        d="M24 6.6 L38.4 11.8 V15 C29.2 11.7 18.8 11.7 9.6 15 V11.8 Z"
        fill={`url(#${uid}-gloss)`}
        opacity="0.55"
      />

      {/* yıldız — gölge kopya + fasetli ana gövde */}
      <path d={star} transform="translate(0 1)" fill={t.starEdge} opacity="0.55" />
      <path d={star} fill={`url(#${uid}-star)`} stroke={t.starEdge} strokeWidth="0.9" strokeLinejoin="round" />

      {/* rütbe şeritleri — kademe yükseldikçe artar */}
      {Array.from({ length: t.chevrons }).map((_, i) => {
        const y = 31.8 + i * 3.3
        return (
          <path
            key={i}
            d={`M19.6 ${y} L24 ${y + 2.6} L28.4 ${y} L28.4 ${y + 2.1} L24 ${y + 4.7} L19.6 ${y + 2.1} Z`}
            fill={`url(#${uid}-star)`}
            stroke={t.starEdge}
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        )
      })}
    </svg>
  )
}
