// Defne dalı — Şeref Salonu'nun amblemi. flip ile sağ/sol ayna.
export default function Laurel({ size = 26, color = '#F2A93B', flip = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      {/* sap — alttan yukarı kavis */}
      <path d="M16 22 C 10 19, 7.5 13, 9.5 4.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      {/* yapraklar — sapa dizili */}
      <path d="M9.5 4.5 q -4.2 -0.4 -5.8 -3.4 q 4.4 -0.4 5.8 3.4 z" fill={color} opacity="0.9" />
      <path d="M8.6 9 q -4.4 0.6 -6.8 -1.8 q 4.2 -1.4 6.8 1.8 z" fill={color} opacity="0.85" />
      <path d="M9.4 13.5 q -4.2 1.4 -7 -0.4 q 3.8 -2.2 7 0.4 z" fill={color} opacity="0.8" />
      <path d="M11.4 17.5 q -3.8 2 -6.9 0.8 q 3.2 -2.9 6.9 -0.8 z" fill={color} opacity="0.75" />
      <path d="M14.6 20.6 q -3 2.6 -6.2 2.2 q 2.4 -3.4 6.2 -2.2 z" fill={color} opacity="0.7" />
    </svg>
  )
}
