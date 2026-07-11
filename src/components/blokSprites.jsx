// Blok Diyarı nav ikonları — voxel dünyasından mini sprite'lar.
// PixelSprite ızgara motorunu kullanır; aktifken oyun renkleri, pasifken tek ton.
import { PixelSprite } from './pixelSprites'

const GRASS = '#7CBD4B'
const GRASS_DARK = '#5E9838'
const DIRT = '#8A5A32'
const DIRT_DARK = '#5C3A20'
const PLANK = '#B08850'
const PAGE = '#EFE7CF'
const SKIN = '#C89B6B'
const HAIR = '#4A2F1B'
const EMERALD = '#4EC94E'
const EMERALD_LIGHT = '#8FE08F'

// Çim damlı toprak ev — kapısı loş, damı yemyeşil.
const HOME_GRID = [
  '....G....',
  '...GGG...',
  '..GGGGG..',
  '.GGGGGGG.',
  'GGGGGGGGG',
  '.DDDDDDD.',
  '.DDKKDDD.',
  '.DDKKDDD.',
  '.DDKKDDD.',
]

// Deri kapaklı günlük — sayfalar ve satırlar.
const DAILY_GRID = [
  '.........',
  '.BBBBBBB.',
  '.BPPPPPB.',
  '.BPLLLPB.',
  '.BPPPPPB.',
  '.BPLLLPB.',
  '.BPPPPPB.',
  '.BBBBBBB.',
  '.........',
]

// Üst üste konmuş blok sütunları — makro renkleri.
const HISTORY_GRID = [
  '.........',
  '...FF....',
  '...FF....',
  '.PPFF....',
  '.PPFF.CC.',
  '.PPFF.CC.',
  '.PPFF.CC.',
  '.PPFF.CC.',
  '.........',
]

// Kesme zümrüt — ilerlemenin mücevheri.
const STAR_GRID = [
  '....A....',
  '...ALA...',
  '..ALLLA..',
  '.ALLLLLA.',
  'AALLLLLAA',
  '.ALLLLLA.',
  '..ALLLA..',
  '...ALA...',
  '....A....',
]

// Oyuncu kafası — kare surat, blok saç.
const PROFILE_GRID = [
  '.HHHHHHH.',
  'HHHHHHHHH',
  'HSSSSSSSH',
  'SSSSSSSSS',
  'SEESSSEES',
  'SSSSSSSSS',
  'SSMMMMMSS',
  '.SSSSSSS.',
  '.........',
]

const GRIDS = {
  home: HOME_GRID,
  daily: DAILY_GRID,
  history: HISTORY_GRID,
  star: STAR_GRID,
  profile: PROFILE_GRID,
}

/* ---------- Piksel çentik (onay tiki) ---------- */

const CHECK_GRID = [
  '.......AA',
  '......AAA',
  '.....AAA.',
  'AA..AAA..',
  'AAAAAA...',
  '.AAAA....',
  '..AA.....',
]

export function BlokCheck({ size = 12, color = '#7CBD4B' }) {
  return <PixelSprite grid={CHECK_GRID} palette={{ A: color }} size={size} />
}

/* ---------- Meşale (streak alevi) ---------- */

const TORCH_GRID = [
  '..YYY..',
  '.YWWWY.',
  '.YWWWY.',
  '..YYY..',
  '..OOO..',
  '...S...',
  '...S...',
  '...S...',
  '...S...',
  '...S...',
]

export function BlokTorch({ size = 34, className }) {
  return (
    <PixelSprite
      grid={TORCH_GRID}
      palette={{ Y: '#FFB13B', W: '#FFE48A', O: '#C46A1E', S: '#8A5A32' }}
      size={size}
      className={className}
    />
  )
}

/* ---------- Demir kalkan içinde alev (streak kurtarıcı) ---------- */

const BLOK_SHIELD_GRID = [
  'AAAAAAAAA',
  'A.......A',
  'A...F...A',
  'A..FF...A',
  'A..FFF..A',
  'A.FFWF..A',
  '.A.FFF.A.',
  '..A...A..',
  '...AAA...',
]

export function BlokShield({ size = 24, active = true, className }) {
  const muted = 'var(--color-text-muted)'
  return (
    <PixelSprite
      grid={BLOK_SHIELD_GRID}
      palette={
        active
          ? { A: '#9AA0A8', F: '#FB923C', W: '#FFD54A' }
          : { A: muted, F: { color: muted, opacity: 0.55 }, W: { color: muted, opacity: 0.3 } }
      }
      size={size}
      className={className}
    />
  )
}

/* ---------- Öğün ikonları — voxel sofrası ---------- */
// PixelMealIcon API'siyle aynı: tek renk + opaklıkla ikinci ton.
// sabah: sahanda yumurta · öğle: pişmiş et · akşam: çorba kasesi · gece: yatak

const BLOK_MEAL_GRIDS = {
  morning: [
    '.........',
    '..AAAA...',
    '.AAAAAA..',
    'AAABBAAA.',
    'AABBBBAA.',
    'AAABBAAA.',
    '.AAAAAA..',
    '..AAAA...',
    '.........',
  ],
  noon: [
    '.........',
    '..AAAAA..',
    '.AAAABAA.',
    'AAABBAAA.',
    'AABBAAAAA',
    '.ABAAAAA.',
    '..AAAAA..',
    '.........',
    '.........',
  ],
  evening: [
    '.........',
    '.........',
    '.BBBBBBB.',
    'ABBBBBBBA',
    'AAAAAAAAA',
    '.AAAAAAA.',
    '..AAAAA..',
    '.........',
    '.........',
  ],
  night: [
    '.........',
    '.........',
    '.B.......',
    '.BBAAAAA.',
    '.BBAAAAA.',
    '.AAAAAAA.',
    '.A.....A.',
    '.A.....A.',
    '.........',
  ],
}

export function BlokMealIcon({ type, color, size = 18 }) {
  const grid = BLOK_MEAL_GRIDS[type] ?? BLOK_MEAL_GRIDS.night
  return (
    <PixelSprite
      grid={grid}
      palette={{ A: color, B: { color, opacity: 0.55 } }}
      size={size}
      style={{ display: 'block' }}
    />
  )
}

/* ---------- Macera haritası (Görevler) ---------- */

const SCROLL_GRID = [
  'DDDDDDDDD',
  'DPPPPPPPD',
  'DPGGPPPPD',
  'DPPGGPPPD',
  'DPPPGGPXD',
  'DPPPPPPPD',
  'DDDDDDDDD',
]

export function BlokScroll({ size = 26 }) {
  return (
    <PixelSprite
      grid={SCROLL_GRID}
      palette={{ D: '#8A5A32', P: '#EFE7CF', G: '#7CBD4B', X: '#C0392B' }}
      size={size}
    />
  )
}

/* ---------- Altın madalya (Şeref Salonu) ---------- */

const MEDAL_GRID = [
  '.RR...RR.',
  '.RR...RR.',
  '..RR.RR..',
  '..GGGGG..',
  '.GGGSGGG.',
  '.GGSSSGG.',
  '.GGGSGGG.',
  '..GGGGG..',
]

export function BlokMedal({ size = 26 }) {
  return (
    <PixelSprite
      grid={MEDAL_GRID}
      palette={{ R: '#C0392B', G: '#F2C94C', S: '#8A5A0A' }}
      size={size}
    />
  )
}

/* ---------- Altın kupa (Arkadaş Ligi) ---------- */

const TROPHY_GRID = [
  '.GGGGGGG.',
  'G.GGGGG.G',
  'G.GGGGG.G',
  '.G.GGG.G.',
  '...GGG...',
  '....G....',
  '...BBB...',
  '..BBBBB..',
]

export function BlokTrophy({ size = 24 }) {
  return (
    <PixelSprite grid={TROPHY_GRID} palette={{ G: '#F2C94C', B: '#8A5A32' }} size={size} />
  )
}

/* ---------- Sandık (Vitrin) ---------- */

const CHEST_GRID = [
  'DDDDDDDDD',
  'DWWWWWWWD',
  'DWWWWWWWD',
  'DDDDDDDDD',
  'DWWWLWWWD',
  'DWWWLWWWD',
  'DWWWWWWWD',
  'DDDDDDDDD',
]

export function BlokChest({ size = 26 }) {
  return (
    <PixelSprite
      grid={CHEST_GRID}
      palette={{ D: '#5C3A20', W: '#B08850', L: '#F2C94C' }}
      size={size}
    />
  )
}

/* ---------- Kese (Envanter) ---------- */

const POUCH_GRID = [
  '...TT....',
  '..DTTD...',
  '..DSSD...',
  '.DSSSSD..',
  '.SSSSSS..',
  '.SSSSSS..',
  '.DSSSSD..',
  '..DDDD...',
]

export function BlokPouch({ size = 26 }) {
  return (
    <PixelSprite
      grid={POUCH_GRID}
      palette={{ T: '#D9B25F', S: '#8A5A32', D: '#5C3A20' }}
      size={size}
    />
  )
}

export function BlokNavIcon({ name, isActive }) {
  const muted = 'var(--color-text-muted)'
  const dim = (opacity) => ({ color: muted, opacity })

  const palettes = {
    home: isActive
      ? { G: GRASS, D: DIRT, K: DIRT_DARK }
      : { G: muted, D: dim(0.6), K: dim(0.3) },
    daily: isActive
      ? { B: PLANK, P: PAGE, L: DIRT_DARK }
      : { B: muted, P: dim(0.45), L: dim(0.8) },
    history: isActive
      ? { P: '#FF8A5B', F: '#F2C94C', C: '#6FCF97' }
      : { P: muted, F: dim(0.7), C: dim(0.5) },
    star: isActive
      ? { A: EMERALD_LIGHT, L: EMERALD }
      : { A: dim(0.55), L: muted },
    profile: isActive
      ? { H: HAIR, S: SKIN, E: '#2A1C10', M: '#8A5A32' }
      : { H: muted, S: dim(0.5), E: dim(0.95), M: dim(0.75) },
  }

  return (
    <PixelSprite
      key={isActive ? 'on' : 'off'}
      grid={GRIDS[name] ?? HOME_GRID}
      palette={palettes[name] ?? palettes.home}
      size={21}
      className={isActive ? 'pixel-pop' : undefined}
    />
  )
}
