// 8-bit piksel beyin — Piksel Tema ödülünün logosu.
// Görseldeki gibi: pembe beyin gövdesi, koyu pembe kontur + kıvrımlar.
// 16x13'lük ızgarada rect'lerle çizilir; boyut `size` ile ölçeklenir.

const OUTLINE = '#C2547A'
const BODY = '#F2A0B8'
const LIGHT = '#F7BCCD'

// Izgara: her satır bir string; O = kontur, B = gövde, L = açık vurgu, . = boş
const GRID = [
  '....OOOOOO......',
  '..OOBBBBBBOO....',
  '.OBBLLBBBBBBO...',
  '.OBLBBLBBOBBOO..',
  'OBBLBLBBLBBBBBO.',
  'OBBBLBBOOBBOBBO.',
  'OBBBBOOBBOOBBBO.',
  'OBBOBBBBBBBBOBO.',
  '.OBBBOOOOOOBBBO.',
  '.OOBBBBBBOBBBO..',
  '...OOOOOBBOBO...',
  '.......OBBBO....',
  '.......OOOO.....',
]

const FILL = { O: OUTLINE, B: BODY, L: LIGHT }

export default function PixelBrain({ size = 48 }) {
  const cols = GRID[0].length
  const rows = GRID.length
  const cell = 1

  return (
    <svg
      width={size}
      height={(size * rows) / cols}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {GRID.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width={cell} height={cell} fill={FILL[ch]} />,
        ),
      )}
    </svg>
  )
}
