// Süper Makrio nav ikonları — güneşli platform dünyasından mini sprite'lar.
// PixelSprite ızgara motorunu kullanır; aktifken oyun renkleri, pasifken tek ton.
// Telif notu: jenerik platformcu dili — karakter/maskot, soru bloğu, bıyık-şapka yok.
import { PixelSprite } from './pixelSprites'

const BRICK = '#C0392B'
const BRICK_DARK = '#8E2418'
const SAND = '#E8C878'
const SAND_DARK = '#C98A33'
const DOOR = '#5C3A20'
const COIN = '#F2B21B'
const COIN_LIGHT = '#FFD766'
const COIN_EDGE = '#8A5A10'
const COIN_INK = '#7A4A00'
const STAR = '#FFD54A'
const STAR_DEEP = '#E8A800'
const SKIN = '#E0AC7E'
const HAIR = '#4A2F1B'
const SHIRT = '#2E86AB'

// Tuğla damlı kum ev — tepesinde bayrak.
const HOME_GRID = [
  '....f....',
  '....p....',
  '..RRRRR..',
  '.RRRRRRR.',
  '.SSSSSSS.',
  '.SSKKSSS.',
  '.SSKKSSS.',
  '.SSKKSSS.',
  '.SSSSSSS.',
]

// M bloğu — soru bloğu değil, Makrio bloğu.
const DAILY_GRID = [
  'EEEEEEEEE',
  'ELLLLLLLE',
  'EGDGGGDGE',
  'EGDDGDDGE',
  'EGDGDGDGE',
  'EGDGGGDGE',
  'EGDGGGDGE',
  'EGGGGGGGE',
  'EEEEEEEEE',
]

// Blok sütun grafiği — zeminin üstünde yükselen makro kuleleri.
const HISTORY_GRID = [
  '.........',
  '...FF....',
  '...FF....',
  '.PPFF....',
  '.PPFF.CC.',
  '.PPFF.CC.',
  '.PPFF.CC.',
  '.PPFF.CC.',
  'ZZZZZZZZZ',
]

// Piksel yıldız — seviye sonu ödülü.
const STAR_GRID = [
  '....A....',
  '....A....',
  '...AAA...',
  'AAAAAAAAA',
  '.AAAAAAA.',
  '..AAAAA..',
  '.AAA.AAA.',
  '.A.....A.',
  '.........',
]

// Oyuncu — jenerik piksel kişi (şapkasız, bıyıksız).
const PROFILE_GRID = [
  '...HHH...',
  '..HHHHH..',
  '..SSSSS..',
  '..SESES..',
  '..SSSSS..',
  '...SSS...',
  '..TTTTT..',
  '.TTTTTTT.',
  '.TT...TT.',
]

const GRIDS = {
  home: HOME_GRID,
  daily: DAILY_GRID,
  history: HISTORY_GRID,
  star: STAR_GRID,
  profile: PROFILE_GRID,
}

export function SuperNavIcon({ name, isActive }) {
  const muted = 'var(--color-text-muted)'
  const dim = (opacity) => ({ color: muted, opacity })

  const palettes = {
    home: isActive
      ? { f: BRICK, p: DOOR, R: BRICK, S: SAND, K: DOOR }
      : { f: dim(0.8), p: dim(0.5), R: muted, S: dim(0.55), K: dim(0.9) },
    daily: isActive
      ? { E: COIN_EDGE, L: COIN_LIGHT, G: COIN, D: COIN_INK }
      : { E: muted, L: dim(0.4), G: dim(0.6), D: dim(0.95) },
    history: isActive
      ? { P: '#FF8A5B', F: STAR, C: '#6FCF97', Z: SAND_DARK }
      : { P: muted, F: dim(0.7), C: dim(0.5), Z: dim(0.85) },
    star: isActive ? { A: STAR } : { A: dim(0.6) },
    profile: isActive
      ? { H: HAIR, S: SKIN, E: '#2A1C10', T: SHIRT }
      : { H: muted, S: dim(0.5), E: dim(0.95), T: dim(0.75) },
  }

  return (
    <PixelSprite
      key={isActive ? 'on' : 'off'}
      grid={GRIDS[name] ?? HOME_GRID}
      palette={palettes[name] ?? palettes.home}
      size={22}
      className={isActive ? 'pixel-bounce' : undefined}
    />
  )
}
