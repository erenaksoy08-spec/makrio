// Altın taç — Premium Alt Menü (20 gün) ödülünün logosu.
// Üç sivri uçlu klasik taç; gövde altın degrade, bantta mor mücevherler.
export default function CrownIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="crown-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="0.45" stopColor="#F2C94C" />
          <stop offset="1" stopColor="#C9962E" />
        </linearGradient>
        <radialGradient id="crown-gem" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#E3C4FF" />
          <stop offset="0.55" stopColor="#C084FC" />
          <stop offset="1" stopColor="#8B4FD8" />
        </radialGradient>
      </defs>

      {/* gövde — üç sivri uç */}
      <path
        d="M9 33 L6.5 15.5 L15.5 23.5 L24 10 L32.5 23.5 L41.5 15.5 L39 33 Z"
        fill="url(#crown-gold)"
        stroke="#8A6A1F"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* uç topları */}
      <circle cx="6.5" cy="13.5" r="2" fill="#FFE9A8" stroke="#8A6A1F" strokeWidth="0.9" />
      <circle cx="24" cy="8" r="2.3" fill="#FFE9A8" stroke="#8A6A1F" strokeWidth="0.9" />
      <circle cx="41.5" cy="13.5" r="2" fill="#FFE9A8" stroke="#8A6A1F" strokeWidth="0.9" />

      {/* gövde ortası mücevher */}
      <circle cx="24" cy="26.5" r="3.2" fill="url(#crown-gem)" stroke="#6D3ABF" strokeWidth="0.8" />
      <circle cx="23" cy="25.4" r="0.9" fill="#F3E6FF" opacity="0.9" />

      {/* bant */}
      <rect x="8" y="33" width="32" height="6.5" rx="2" fill="url(#crown-gold)" stroke="#8A6A1F" strokeWidth="1.2" />

      {/* bant mücevherleri */}
      <circle cx="15" cy="36.2" r="1.5" fill="url(#crown-gem)" />
      <circle cx="24" cy="36.2" r="1.5" fill="url(#crown-gem)" />
      <circle cx="33" cy="36.2" r="1.5" fill="url(#crown-gem)" />

      {/* sol ışık vurgusu */}
      <path d="M10.6 30.5 L8.9 19" stroke="#FFF3C9" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
    </svg>
  )
}
