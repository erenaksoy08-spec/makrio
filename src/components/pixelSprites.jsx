// 8-bit piksel sprite seti — Piksel Tema aktifken kullanılan ikonlar.
// PixelBrain ile aynı yaklaşım: harf ızgarası + palet → crispEdges rect'ler.

export function PixelSprite({ grid, palette, size = 20, className, style }) {
  const cols = grid[0].length
  const rows = grid.length

  return (
    <svg
      width={size}
      height={(size * rows) / cols}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {grid.flatMap((row, y) =>
        [...row].map((ch, x) => {
          const fill = palette[ch]
          if (!fill) return null
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill.color ?? fill} opacity={fill.opacity ?? 1} />
        }),
      )}
    </svg>
  )
}

/* ---------- Alev (streak) ---------- */

const FLAME_GRID = [
  '...R....',
  '...RR...',
  '..RYR...',
  '..RYRR..',
  '.RYYYR..',
  '.RYWYRR.',
  'RYWWWYR.',
  'RYWWWYR.',
  '.RYWYR..',
  '..RRR...',
]

export function PixelFlame({ size = 40, className, mono = false }) {
  return (
    <PixelSprite
      grid={FLAME_GRID}
      palette={
        mono
          ? // gri tonlu varyant — üç ayrı ton, gölge detayı korunur
            {
              R: 'var(--color-text-muted)',
              Y: { color: 'var(--color-text-muted)', opacity: 0.65 },
              W: { color: 'var(--color-text-muted)', opacity: 0.35 },
            }
          : { R: '#FB6340', Y: '#FFB13B', W: '#FFE48A' }
      }
      size={size}
      className={className}
    />
  )
}

/* ---------- Kalkan içinde alev (streak kurtarıcı) ---------- */

const SHIELD_GRID = [
  'AAAAAAAAA',
  'A.......A',
  'A...Y...A',
  'A..YY...A',
  'A..YYY..A',
  'A.YYWY..A',
  '.A.YYY.A.',
  '..A...A..',
  '...AAA...',
]

export function PixelShield({ size = 24, active = true, className }) {
  const a = active ? '#FB923C' : 'var(--color-text-muted)'
  return (
    <PixelSprite
      grid={SHIELD_GRID}
      palette={
        active
          ? { A: a, Y: '#FFB13B', W: '#FFE48A' }
          : { A: a, Y: { color: a, opacity: 0.6 }, W: { color: a, opacity: 0.35 } }
      }
      size={size}
      className={className}
    />
  )
}

/* ---------- Öğün ikonları (sabah / öğle / akşam / gece) ---------- */
// Tek renk (color prop) + opaklıkla gölgelendirme; mevcut MealPeriodIcon API'siyle uyumlu.

const MEAL_GRIDS = {
  morning: [
    '.........',
    '....A....',
    '.A..A..A.',
    '...BBB...',
    '..BBBBB..',
    'AAAAAAAAA',
    '.........',
    '.........',
    '.........',
  ],
  noon: [
    '....A....',
    '.A..A..A.',
    '..AABAA..',
    '..ABBBA..',
    'AAABBBAAA',
    '..ABBBA..',
    '..AABAA..',
    '.A..A..A.',
    '....A....',
  ],
  evening: [
    '.........',
    '.........',
    '...BBB...',
    '..BBBBB..',
    'AAAAAAAAA',
    '.A..A..A.',
    '....A....',
    '.........',
    '.........',
  ],
  night: [
    '....AAA..',
    '...AA....',
    '..AA.....',
    '..AA...B.',
    '..AA.....',
    '...AA....',
    '....AAA..',
  ],
}

export function PixelMealIcon({ type, color, size = 18 }) {
  const grid = MEAL_GRIDS[type] ?? MEAL_GRIDS.night
  return (
    <PixelSprite
      grid={grid}
      palette={{ A: color, B: { color, opacity: 0.55 } }}
      size={size}
      // yatay ızgaralar (sabah/akşam) dikeyde ortalansın diye sabit kutu
      style={{ display: 'block' }}
    />
  )
}

/* ---------- Alt menü ikonları ---------- */

const NAV_GRIDS = {
  home: [
    '....A....',
    '...AAA...',
    '..AAAAA..',
    '.AAAAAAA.',
    'AAAAAAAAA',
    '.AAAAAAA.',
    '.AAA.AAA.',
    '.AAA.AAA.',
  ],
  daily: [
    '..AAAA..',
    '.AAAAAA.',
    '.A....A.',
    '.A.AA.A.',
    '.A....A.',
    '.A.AA.A.',
    '.A....A.',
    '.AAAAAA.',
  ],
  history: [
    '....CC....',
    '....CC....',
    '....CC....',
    '.PP.CC....',
    '.PP.CC....',
    '.PP.CC.FF.',
    '.PP.CC.FF.',
    'AAAAAAAAAA',
  ],
  star: [
    '....A....',
    '....A....',
    '...AAA...',
    'AAAAAAAAA',
    '.AAAAAAA.',
    '..AAAAA..',
    '.AAA.AAA.',
    '.A.....A.',
  ],
  profile: [
    '...AAA...',
    '..AAAAA..',
    '..AAAAA..',
    '...AAA...',
    '.........',
    '..AAAAA..',
    '.AAAAAAA.',
    'AAAAAAAAA',
  ],
  trophy: [
    '.AAAAAAA.',
    'A.AAAAA.A',
    'A.AAAAA.A',
    '.A.AAA.A.',
    '...AAA...',
    '....A....',
    '...AAA...',
    '..AAAAA..',
  ],
}

export function PixelNavIcon({ name, isActive, activeColor = 'var(--color-text)' }) {
  const grid = NAV_GRIDS[name] ?? NAV_GRIDS.home
  const muted = 'var(--color-text-muted)'

  const palette =
    name === 'history'
      ? isActive
        ? { A: muted, P: '#FF8A5B', C: '#6FCF97', F: '#F2C94C' }
        : { A: muted, P: muted, C: muted, F: muted }
      : name === 'star'
        ? { A: isActive ? '#FFD54A' : muted }
        : { A: isActive ? activeColor : muted }

  return (
    <PixelSprite
      key={isActive ? 'on' : 'off'}
      grid={grid}
      palette={palette}
      size={21}
      className={isActive ? 'pixel-pop' : undefined}
    />
  )
}

/* ---------- Bronz rozet (kurdeleli madalya) ---------- */

const BRONZE_GRID = [
  '.LL...UU.',
  '.LL...UU.',
  '..LL.UU..',
  '..AAAAA..',
  '.AAASAAA.',
  '.AASSSAA.',
  '.AAASAAA.',
  '..AAAAA..',
]

const BADGE_TIER_PALETTES = {
  bronze: { L: '#E0573E', U: '#4F84D6', A: '#C77B3C', S: '#FCE3C2' },
  silver: { L: '#E0573E', U: '#4F84D6', A: '#C3CAD4', S: '#FFFFFF' },
  gold: { L: '#E0573E', U: '#4F84D6', A: '#E8B84B', S: '#FFF3C4' },
}

export function PixelBronzeBadge({ size = 18, tier = 'bronze' }) {
  return (
    <PixelSprite
      grid={BRONZE_GRID}
      palette={BADGE_TIER_PALETTES[tier] ?? BADGE_TIER_PALETTES.bronze}
      size={size}
    />
  )
}

/* ---------- Selamlama ikonları (saate göre, ana sayfa başlığı) ---------- */

const GREETING_SPRITES = {
  morning: {
    grid: [
      '....Y....',
      '.Y..Y..Y.',
      '..YYYYY..',
      '..YWWWY..',
      'YYYWWWYYY',
      '..YWWWY..',
      '..YYYYY..',
      '.Y..Y..Y.',
      '....Y....',
    ],
    palette: { Y: '#F2C94C', W: '#FFE9A8' },
  },
  afternoon: {
    grid: [
      '.Y..Y....',
      '..YYY....',
      '.YYYYY.Y.',
      '..YYY....',
      '.Y..DCC..',
      '...DCCCC.',
      '..CCCCCCC',
      '..CCCCCCC',
    ],
    palette: { Y: '#F2C94C', C: '#dfe6ec', D: '#b9c3cc' },
  },
  evening: {
    grid: [
      '....O....',
      '.O..O..O.',
      '..OOOOO..',
      '.OOWWWOO.',
      'HHHHHHHHH',
      '..HHHHH..',
    ],
    palette: { O: '#F2994A', W: '#FFD9A8', H: '#C9721F' },
  },
  night: {
    grid: [
      '...MMM..S',
      '..MM.....',
      '.MM......',
      '.MM....S.',
      '.MM......',
      '..MM....S',
      '...MMM...',
    ],
    palette: { M: '#B8B5E1', S: '#F2C94C' },
  },
}

export function PixelGreetingIcon({ period, size = 22 }) {
  const sprite = GREETING_SPRITES[period] ?? GREETING_SPRITES.night
  return (
    <span className="inline-flex align-middle">
      <PixelSprite grid={sprite.grid} palette={sprite.palette} size={size} />
    </span>
  )
}

/* ---------- Piksel yemek ikonları (deneme: haşlanmış yumurta) ---------- */
// Sevimli ama gerçekçi: ikiye bölünmüş haşlanmış yumurta — beyaz, ortada sarısı.

const EGG_GRID = [
  '...BBB...',
  '..BEEEB..',
  '.BEEEEEB.',
  '.BEYYYEB.',
  'BEYYYYYEB',
  'BEYYDYYEB',
  '.BEYYYEB.',
  '.BEEEEEB.',
  '..BEEEB..',
  '...BBB...',
]

// Beyaz ekmek dilimi — altın kabuk, krem iç, gözenekler
const BREAD_GRID = [
  '..CCCCC..',
  '.CCCCCCC.',
  '.CEEEEEC.',
  '.CEDEEEC.',
  '.CEEEDEC.',
  '.CEEEEEC.',
  '.CCCCCCC.',
]

// Izgara tavuk göğsü — kızarmış fileto, koyu ızgara izleri
const CHICKEN_GRILLED_GRID = [
  '..HHGGG..',
  '.GGGGGGG.',
  'GGLGGLGGG',
  'GGGLGGLGG',
  '.GGGGGGG.',
  '..GGGGG..',
]

// Çiğ tavuk göğsü — pembe fileto
const CHICKEN_RAW_GRID = [
  '..HHPPP..',
  '.PPPPPPP.',
  'PPSPPPSPP',
  'PPPPSPPPP',
  '.PPPPPPP.',
  '..PPPPP..',
]

// Dana bonfile — kırmızı et, üstte yağ şeridi, mermer desen
const STEAK_GRID = [
  '..FFFFFF.',
  '.RRRRRRF.',
  'RRDRRRDRR',
  'RRRRDRRRR',
  '.RRRRRRR.',
  '..RRRRR..',
]

// Salatalık dilimi — koyu yeşil kabuk, açık iç, çekirdekler
const CUCUMBER_GRID = [
  '..GGGGG..',
  '.GLLLLLG.',
  'GLLSLSLLG',
  'GLLLLLLLG',
  'GLLSLSLLG',
  '.GLLLLLG.',
  '..GGGGG..',
]

// Zeytinyağı — yeşil cam şişe, altın yağ
const OLIVE_OIL_GRID = [
  '....C....',
  '...GG....',
  '...GG....',
  '..GGGG...',
  '..GOOG...',
  '..GOOG...',
  '..GOOG...',
  '..GOOG...',
  '..GGGG...',
]

// Ayçiçek yağı — açık cam şişe, sarı yağ
const SUNFLOWER_OIL_GRID = [
  '....C....',
  '...GG....',
  '...GG....',
  '..GGGG...',
  '..GYYG...',
  '..GYYG...',
  '..GYYG...',
  '..GYYG...',
  '..GGGG...',
]

// Patates — kahverengi yumru, koyu gözler
const POTATO_GRID = [
  '..PPPP...',
  '.PPPPPP..',
  'PPPDPPPP.',
  'PPPPPPPPP',
  'PPPDPPPPP',
  '.PPPPPPP.',
  '..PPPP...',
]

// Et döner — kızarmış et konisi, mangal izleri
const DONER_GRID = [
  '...MM....',
  '..MLMM...',
  '.MMMLM...',
  '.MLMMMM..',
  'MMMMMLM..',
  'MMLMMMMM.',
  '.MMMMLM..',
  '..MLMM...',
  '...MM....',
]

// Pirinç (pişmiş) — kâsede beyaz pilav
const RICE_GRID = [
  '..WWWWW..',
  '.WWWWWWW.',
  '.WWWWWWW.',
  'BBBBBBBBB',
  '.BBBBBBB.',
  '..BBBBB..',
]

// Hindi füme — pembe şarküteri dilimi
const TURKEY_GRID = [
  '.PPPPPP..',
  'PPRPPPPP.',
  'PPPPPPRP.',
  'PPRPPPPP.',
  '.PPPPPP..',
]

// Makarna (haşlanmış) — kâsede sarı erişte
const PASTA_GRID = [
  '..NNNNN..',
  '.NNoNoNN.',
  '.NNNNNNN.',
  'BBBBBBBBB',
  '.BBBBBBB.',
  '..BBBBB..',
]

// Coca-Cola — kırmızı kutu, beyaz bant
const COLA_GRID = [
  '..RRRRR..',
  '.RRRRRRR.',
  '.RWWWWWR.',
  '.RRRRRRR.',
  '.RRRRRRR.',
  '.RRRRRRR.',
  '.RWWWWWR.',
  '.RRRRRRR.',
  '..RRRRR..',
]

// Yulaf ezmesi — kâsede bej yulaf
const OATMEAL_GRID = [
  '..OOOOO..',
  '.OOoOOoO.',
  '.OOOOOOO.',
  'BBBBBBBBB',
  '.BBBBBBB.',
  '..BBBBB..',
]

// Beyaz peynir — beyaz küp, hafif gölge
const CHEESE_GRID = [
  '.WWWWWWW.',
  'WWWWWWWWW',
  'WWHWWWHWW',
  'WWWWWWWWW',
  'WWWHWWWWW',
  'WWWWWWWWW',
  '.WWWWWWW.',
]

// Domates — kırmızı, yeşil sap
const TOMATO_GRID = [
  '...GG....',
  '..RRRRR..',
  '.RRRRRRR.',
  'RRRRLRRRR',
  'RRRRRRRRR',
  '.RRRRRRR.',
  '..RRRRR..',
]

// Mısır (haşlanmış) — sarı koçan, yeşil yaprak
const CORN_COB_GRID = [
  '..H......',
  '.HYY.....',
  '.YYYY....',
  '.YkYY....',
  '.YYkY....',
  '.YkYY....',
  '.YYkY....',
  '.YYYY....',
  '..YY.....',
]

// Süt mısır — kâsede sarı taneler
const SWEET_CORN_GRID = [
  '.YkYkYk..',
  'kYkYkYkY.',
  '.YkYkYk..',
  'BBBBBBBB.',
  '.BBBBBB..',
]

// Bulgur (pişmiş) — kâsede ten rengi tane
const BULGUR_GRID = [
  '..TTTTT..',
  '.TtTTtT..',
  '.TTTTTT..',
  'BBBBBBBBB',
  '.BBBBBBB.',
  '..BBBBB..',
]

// Tereyağı — sarı blok, açık üst
const BUTTER_GRID = [
  '.LLLLLL..',
  '.YYYYYY..',
  'YYYYYYYY.',
  'YYYYYYYY.',
  'YYYYYYYY.',
  '.YYYYYY..',
]

// Ayran — bardakta beyaz içecek
const AYRAN_GRID = [
  '.CCCCCC..',
  '.CWWWWC..',
  '.CWWWWC..',
  '.CWWWWC..',
  '.CWWWWC..',
  '..CWWC...',
  '..CCCC...',
]

// Eşleşme sırası önemli: özel kalıplar (ızgara/çiğ, süt mısır) genel olanlardan önce gelir.
const FOOD_SPRITES = [
  {
    match: /yumurta/i,
    grid: EGG_GRID,
    palette: { B: '#cfc7b6', E: '#fbf8f1', Y: '#F5C445', D: '#E0A32E' },
  },
  {
    match: /ekmek/i,
    grid: BREAD_GRID,
    palette: { C: '#C98F4E', E: '#F5E9D0', D: '#E4D2AE' },
  },
  {
    // "Izgara" büyük I ile de yazılabildiği için [ıiİI] sınıfı kullanılır
    match: /tavuk.*[ıiİI]zgara|[ıiİI]zgara.*tavuk/i,
    grid: CHICKEN_GRILLED_GRID,
    palette: { G: '#C98A4B', L: '#8A5526', H: '#E0A96B' },
  },
  {
    match: /tavuk.*çiğ/i,
    grid: CHICKEN_RAW_GRID,
    palette: { P: '#F3B8AC', S: '#E39A8C', H: '#FAD2C8' },
  },
  {
    match: /bonfile|dana/i,
    grid: STEAK_GRID,
    palette: { R: '#B8434A', D: '#8E2F35', F: '#F2E3D5' },
  },
  {
    match: /salatalık/i,
    grid: CUCUMBER_GRID,
    palette: { G: '#3E7A3A', L: '#D8EFC4', S: '#A8C98E' },
  },
  {
    match: /zeytinyağ/i,
    grid: OLIVE_OIL_GRID,
    palette: { C: '#7a5a3a', G: '#3f6b3a', O: '#c79a2e' },
  },
  {
    match: /ayçiçek/i,
    grid: SUNFLOWER_OIL_GRID,
    palette: { C: '#c7a23a', G: '#d8c88a', Y: '#f0c838' },
  },
  {
    match: /patates/i,
    grid: POTATO_GRID,
    palette: { P: '#b98a52', D: '#8a6238' },
  },
  {
    match: /döner/i,
    grid: DONER_GRID,
    palette: { M: '#8f5330', L: '#bd7a45' },
  },
  {
    match: /pirinç|pilav/i,
    grid: RICE_GRID,
    palette: { W: '#f6f3ec', B: '#9fa6ad' },
  },
  {
    // "hindistan" (cevizi) hariç — sadece hindi (turkey)
    match: /hindi(?!stan)/i,
    grid: TURKEY_GRID,
    palette: { P: '#e2a08f', R: '#b76b5a' },
  },
  {
    match: /makarna/i,
    grid: PASTA_GRID,
    palette: { N: '#e8cf7a', B: '#9fa6ad' },
  },
  {
    // "kola" (k ile) YOK — "çikolata" içindeki "kola"ya takılmasın; "cola" (c ile) güvenli
    match: /coca|cola/i,
    grid: COLA_GRID,
    palette: { R: '#c62b26', W: '#f4f1ea' },
  },
  {
    match: /yulaf/i,
    grid: OATMEAL_GRID,
    palette: { O: '#d8c39a', o: '#c0a878', B: '#9fa6ad' },
  },
  {
    match: /peynir/i,
    grid: CHEESE_GRID,
    palette: { W: '#f6f4ee', H: '#dcd8cc' },
  },
  {
    match: /domates/i,
    grid: TOMATO_GRID,
    palette: { R: '#d63a2f', G: '#5a9a3a', L: '#f08a7a' },
  },
  {
    // "Süt Mısır" genel "mısır"dan önce eşleşmeli
    match: /süt mısır/i,
    grid: SWEET_CORN_GRID,
    palette: { Y: '#f0cc44', k: '#d8a828', B: '#9fa6ad' },
  },
  {
    match: /mısır/i,
    grid: CORN_COB_GRID,
    palette: { Y: '#e8c23a', k: '#c89a1e', H: '#5a9a3a' },
  },
  {
    match: /bulgur/i,
    grid: BULGUR_GRID,
    palette: { T: '#c9a86a', t: '#a98850', B: '#9fa6ad' },
  },
  {
    match: /tereyağ/i,
    grid: BUTTER_GRID,
    palette: { L: '#f6e6a0', Y: '#eccb54' },
  },
  {
    match: /ayran/i,
    grid: AYRAN_GRID,
    palette: { C: '#b9cbd6', W: '#f4f4f0' },
  },
]

export function hasPixelFoodIcon(name) {
  return FOOD_SPRITES.some((s) => s.match.test(name ?? ''))
}

export function PixelFoodIcon({ name, size = 16, className }) {
  const sprite = FOOD_SPRITES.find((s) => s.match.test(name ?? ''))
  if (!sprite) return null
  return (
    <span className={`inline-flex shrink-0 align-[-2px] ${className ?? ''}`}>
      <PixelSprite grid={sprite.grid} palette={sprite.palette} size={size} />
    </span>
  )
}

/* ---------- Sol ok (geri butonu) ---------- */

const ARROW_GRID = [
  '...A....',
  '..AA....',
  '.AAAAAAA',
  'AAAAAAAA',
  '.AAAAAAA',
  '..AA....',
  '...A....',
]

export function PixelArrowLeft({ size = 14, color = 'currentColor' }) {
  return <PixelSprite grid={ARROW_GRID} palette={{ A: color }} size={size} />
}

/* ---------- Ödül ikonları (koleksiyon madalyonları) ---------- */

const REWARD_SPRITES = {
  'premium-nav': {
    grid: [
      'H...H...H',
      'A..AAA..A',
      'AA.AAA.AA',
      'AAAAAAAAA',
      'AGAAGAAGA',
      'AAAAAAAAA',
    ],
    palette: { A: '#F2C94C', H: '#FFE9A8', G: '#C084FC' },
  },
  'light-theme': {
    grid: [
      '....Y....',
      '.Y..Y..Y.',
      '..YYYYY..',
      '..YWWWY..',
      'YYYWWWYYY',
      '..YWWWY..',
      '..YYYYY..',
      '.Y..Y..Y.',
      '....Y....',
    ],
    palette: { Y: '#F2C94C', W: '#FFE9A8' },
  },
  'realistic-water': {
    grid: [
      '....A....',
      '...AA....',
      '...AAA...',
      '..AAAAA..',
      '.AAAAAAA.',
      '.AAAAAB..',
      '.AAAABB..',
      '..AAAAA..',
      '...AAA...',
    ],
    palette: { A: '#3DA5FF', B: '#BFE4FF' },
  },
  'turquoise-ring': {
    grid: [
      '..AAAAA..',
      '.AA...AA.',
      'AA.....AA',
      'AA.....AA',
      'AA.....AA',
      '.AA...AA.',
      '..AAAAA..',
    ],
    palette: { A: '#22D3EE' },
  },
  'bronze-badge': {
    grid: [
      '.RR...RR.',
      '.RR...RR.',
      '..RR.RR..',
      '..AAAAA..',
      '.AAABAAA.',
      '.AABBBAA.',
      '.AAABAAA.',
      '..AAAAA..',
    ],
    palette: { R: '#8C6239', A: '#E0A34E', B: '#F5D9A8' },
  },
}

export function PixelRewardIcon({ rewardId, size = 34 }) {
  const sprite = REWARD_SPRITES[rewardId]
  if (!sprite) return null
  return <PixelSprite grid={sprite.grid} palette={sprite.palette} size={size} />
}

export function hasPixelRewardIcon(rewardId) {
  return rewardId in REWARD_SPRITES
}
