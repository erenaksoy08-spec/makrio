// Döküm demir dambıl — Demir Çağı (gym) temasının ödül logosu.
// Ağır, oturaklı; plakalar koyu demir, bar fırçalanmış çelik.
export default function DumbbellIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="db-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4e52" />
          <stop offset="0.5" stopColor="#2c3033" />
          <stop offset="1" stopColor="#191c1e" />
        </linearGradient>
        <linearGradient id="db-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b9095" />
          <stop offset="0.5" stopColor="#5a5f63" />
          <stop offset="1" stopColor="#3a3e42" />
        </linearGradient>
      </defs>

      {/* orta bar */}
      <rect x="16" y="21.5" width="16" height="5" rx="1" fill="url(#db-bar)" />

      {/* sol plakalar */}
      <rect x="4" y="14" width="5" height="20" rx="1.5" fill="url(#db-plate)" stroke="#0e1012" strokeWidth="1" />
      <rect x="10" y="11" width="6" height="26" rx="1.5" fill="url(#db-plate)" stroke="#0e1012" strokeWidth="1" />

      {/* sağ plakalar */}
      <rect x="32" y="11" width="6" height="26" rx="1.5" fill="url(#db-plate)" stroke="#0e1012" strokeWidth="1" />
      <rect x="39" y="14" width="5" height="20" rx="1.5" fill="url(#db-plate)" stroke="#0e1012" strokeWidth="1" />

      {/* plaka üstü ışık vurgusu */}
      <rect x="10.5" y="12" width="5" height="2" rx="1" fill="#ffffff" opacity="0.14" />
      <rect x="32.5" y="12" width="5" height="2" rx="1" fill="#ffffff" opacity="0.14" />
    </svg>
  )
}
