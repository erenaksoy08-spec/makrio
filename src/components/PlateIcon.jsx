// Plaka — Vitrin'in para birimi. Gerçek tri-grip kauçuk olimpik plakadan
// modellenmiştir: siyah kauçuk gövde, üç tutma yuvası, yuvarlatılmış üçgen
// yüz paneli, çelik bar deliği. Sahip olunan sayı plakanın üstüne büyük ve
// net beyaz damgayla basılır (gerçek plakalardaki "15" gibi).
export default function PlateIcon({ size = 40, value }) {
  const str = value != null ? String(value) : null
  const fs = str ? (str.length >= 5 ? 17 : str.length === 4 ? 21 : str.length === 3 ? 26 : 30) : 0

  // tutma yuvası yayları — üst-sol, üst-sağ, alt (fotoğraftaki yerleşim)
  const grip = (centerDeg) => {
    const r = 35
    const span = 26
    const a1 = ((centerDeg - span) * Math.PI) / 180
    const a2 = ((centerDeg + span) * Math.PI) / 180
    const x1 = 48 + r * Math.cos(a1)
    const y1 = 48 + r * Math.sin(a1)
    const x2 = 48 + r * Math.cos(a2)
    const y2 = 48 + r * Math.sin(a2)
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }

  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <defs>
        <radialGradient id="pl-rubber" cx="0.38" cy="0.3" r="1">
          <stop offset="0" stopColor="#3d3d3f" />
          <stop offset="0.55" stopColor="#222224" />
          <stop offset="1" stopColor="#131315" />
        </radialGradient>
        <linearGradient id="pl-tri" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2c2e" />
          <stop offset="1" stopColor="#1a1a1c" />
        </linearGradient>
        <linearGradient id="pl-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8e8ea" />
          <stop offset="0.5" stopColor="#a9abaf" />
          <stop offset="1" stopColor="#7c7e83" />
        </linearGradient>
      </defs>

      {/* kauçuk gövde */}
      <circle cx="48" cy="48" r="46" fill="url(#pl-rubber)" stroke="#000" strokeWidth="1.2" />
      {/* dış kenar ışığı */}
      <circle cx="48" cy="48" r="44.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

      {/* yuvarlatılmış üçgen yüz paneli */}
      <path
        d="M 41 20 Q 48 12 55 20 L 78 57 Q 84 68 71 70 L 25 70 Q 12 68 18 57 Z"
        fill="url(#pl-tri)"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="1"
      />
      {/* panel iç olukları — fotoğraftaki çifte çizgi */}
      <path
        d="M 42 26 Q 48 19.5 54 26 L 73 57 Q 78 66 67.5 67.5 L 28.5 67.5 Q 18 66 23 57 Z"
        fill="none"
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="1.1"
      />
      <path
        d="M 43 30 Q 48 24.5 53 30 L 70 57.5 Q 74 65 65.5 66 L 30.5 66 Q 22 65 26 57.5 Z"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />

      {/* tutma yuvaları */}
      {[210, 330, 90].map((deg) => (
        <path key={deg} d={grip(deg)} stroke="#09090a" strokeWidth="12" strokeLinecap="round" fill="none" />
      ))}
      {/* yuva iç kenar ışıkları */}
      {[210, 330, 90].map((deg) => (
        <path key={`h${deg}`} d={grip(deg)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeLinecap="round" fill="none" />
      ))}

      {/* çelik bar deliği */}
      <circle cx="48" cy="48" r="10.5" fill="url(#pl-steel)" />
      <circle cx="48" cy="48" r="10.5" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.8" />
      <circle cx="48" cy="48" r="6.8" fill="#151517" />
      <path d="M 43.5 45 A 5.8 5.8 0 0 1 52.5 45" stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="none" />

      {/* sahip olunan sayı — büyük, net, beyaz damga (yüzeyin üst-orta boşluğuna) */}
      {str && (
        <text
          x="48"
          y="33"
          textAnchor="middle"
          dominantBaseline="central"
          fontWeight="800"
          fontSize={fs}
          fill="#FBFBFB"
          style={{
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
            paintOrder: 'stroke',
            stroke: 'rgba(0,0,0,0.45)',
            strokeWidth: 1.2,
          }}
        >
          {str}
        </text>
      )}

      {/* kauçuk üst parlaması */}
      <path d="M 18 26 A 38 38 0 0 1 34 12" stroke="rgba(255,255,255,0.14)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}
