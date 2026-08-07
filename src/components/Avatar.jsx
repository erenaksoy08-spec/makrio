import { useState } from 'react'

// Yuvarlak profil fotoğrafı. Foto yoksa/yüklenemezse baş harfe düşer —
// lig listesi hiçbir durumda boş daire göstermez.
// Altın/bronz isim rengi olanlarda ince bir halka aynı kimliği taşır.

const RING = { gold: '#E0A93B', bronze: '#C96F33' }

export default function Avatar({ url, name, size = 36, color, className = '' }) {
  const [broken, setBroken] = useState(false)
  const letter = (name ?? '?').trim().charAt(0).toUpperCase() || '?'
  const ring = RING[color]
  const box = {
    width: size,
    height: size,
    ...(ring ? { boxShadow: `0 0 0 1.5px ${ring}` } : {}),
  }

  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        style={box}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      style={{ ...box, fontSize: Math.max(9, Math.round(size * 0.42)) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white/[0.08] font-bold uppercase text-text-muted ${className}`}
    >
      {letter}
    </span>
  )
}
