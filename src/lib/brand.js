// Makrio marka işareti — tek doğruluk kaynağı.
//
// Konsept: 3 dikey makro çubuğu (protein / karbonhidrat / yağ), yuvarlak uçlu,
// üstleri kavisle birleşip küçük "m" harfini andırıyor. Hem bar-chart hem
// "makrio"nun baş harfi olarak okunur.
//
// Renkler UYGULAMADAKİ GERÇEK makro çubuklarından alındı (uydurma palet YOK):
//   Dashboard.jsx <MacroBar> ve HistoryIcon.jsx
//   protein #FF8A5B · karbonhidrat #6FCF97 · yağ #F2C94C
// Çubuk stili de gerçeğiyle aynı: rounded-full (pill) uçlar, düz dolgu.
//
// Tema esnekliği: tüm değerler burada. Koyu/açık tema ya da farklı marka rengi
// için tek yerden değiştir; hem React <Logo> hem app-icon üreteci
// (scripts/gen-icons.mjs) buradan besleniyor, çıktı otomatik senkron kalır.

export const BRAND = {
  macro: {
    protein: '#FF8A5B', // coral
    carb: '#6FCF97', // green  (gramajı en yüksek makro → en uzun çubuk)
    fat: '#F2C94C', // gold
  },
  // App icon zemini — uygulamanın koyu yüzeyiyle uyumlu, dikey degrade.
  // iOS ikonları saydamsız tam kare olmalı: bu zemin tüm kareyi doldurur.
  iconBg: { top: '#1b1e24', bottom: '#0b0c0e' },
  // Açık tema denemek istenirse örnek zemin (config'den geçilebilir):
  iconBgLight: { top: '#ffffff', bottom: '#eef0f2' },
}

// İşaret geometrisi (viewBox 0 0 120 120). Çubuklar tabandan yükselir.
const BW = 22 // çubuk genişliği
const BASE = 98 // taban çizgisi
const R = 11 // köşe yarıçapı = BW/2 → pill uçlar (app'teki rounded-full ile birebir)
const XS = [17, 49, 81] // çubuk sol kenarları (yatayda ortalı, eşit boşluk)
const CX = XS.map((x) => x + BW / 2) // tepe merkez x'leri: 28, 60, 92

// Varyantlar — hepsi aynı gerçek paleti kullanır, kompozisyon farklı.
//  bars: sade, kavissiz — bar-chart okuması öne çıkar (BİRİNCİL işaret)
//  arch: çubuk tepeleri kavisle birleşir → net "m" ligatürü
//  step: soldan sağa yükselen — cesur, dinamik
export const LOGO_VARIANTS = {
  bars: { heights: [58, 76, 46], arch: false },
  arch: { heights: [58, 70, 52], arch: true, peak: 13 },
  step: { heights: [50, 64, 80], arch: false },
}

export const DEFAULT_VARIANT = 'bars'

// Tema görünen adları (logo değişim bildiriminde kullanılır).
export const THEME_NAMES = {
  dark: 'Varsayılan',
  light: 'Açık',
  pixel: 'Piksel',
  'pixel-dark': 'Piksel Koyu',
  'pixel-color': 'Piksel Renkli',
  'pixel-super': 'Süper Makrio',
  gym: 'Gym',
  blok: 'Blok',
}

// Tema başına çubuk karakteri — UYGULAMADAKİ gerçek .bar-fill stiliyle aynı.
//   pixel*/blok : kare köşe + dikey boncuk şeridi (crispEdges)
//   gym         : pill + parlak vinil cila
//   dark/light  : düz pill
// Renkler her temada aynı makro renkleri (app'te de öyle) — sadece doku değişir.
function themeBarStyle(theme = 'dark') {
  const isPixel = typeof theme === 'string' && theme.startsWith('pixel')
  if (isPixel) return { corner: 0, crisp: true, texture: 'pixel' }
  if (theme === 'blok') return { corner: 0, crisp: true, texture: 'blok' }
  if (theme === 'gym') return { corner: 11, crisp: false, texture: 'gym' }
  return { corner: 11, crisp: false, texture: 'flat' }
}

// Çerçevesiz SVG string üreteci — React ve Node ikon script'i ortak kullanır.
//  variant : 'bars' | 'arch' | 'step'
//  mode    : 'mark' (saydam zemin, wordmark yanı) | 'icon' (dolu kare zemin)
//  size    : px
//  theme   : aktif tema (çubuk dokusunu belirler)
//  bg      : icon modunda zemin degradesi ({top, bottom}); atlanırsa BRAND.iconBg
export function logoSVGString({ variant = DEFAULT_VARIANT, mode = 'mark', size = 120, theme = 'dark', bg } = {}) {
  const v = LOGO_VARIANTS[variant] ?? LOGO_VARIANTS[DEFAULT_VARIANT]
  const colors = [BRAND.macro.protein, BRAND.macro.carb, BRAND.macro.fat]
  const tops = v.heights.map((h) => BASE - h)
  const st = themeBarStyle(theme)

  let defs = ''

  // Kavisler (arch varyantı) — iki komşu makro rengi arası degrade (yeni renk
  // icat değil). Çubukların ARKASINA çizilir; pill tepeleri birleşimi örter.
  let arches = ''
  if (v.arch) {
    defs +=
      `<linearGradient id="mg0" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient>` +
      `<linearGradient id="mg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient>`
    for (let i = 0; i < 2; i++) {
      const peak = Math.min(tops[i], tops[i + 1]) - (v.peak ?? 13)
      const midx = (CX[i] + CX[i + 1]) / 2
      arches += `<path d="M ${CX[i]} ${tops[i]} Q ${midx} ${peak} ${CX[i + 1]} ${tops[i + 1]}" fill="none" stroke="url(#mg${i})" stroke-width="${BW}" stroke-linecap="round"/>`
    }
  }

  // Tema dokusu için ortak tanımlar (yalnızca gerekince).
  if (st.texture === 'pixel') {
    // Dikey boncuk şeridi — app'teki repeating-linear-gradient(.28, 3/3) eşdeğeri.
    defs += `<pattern id="tx" width="5" height="4" patternUnits="userSpaceOnUse"><rect width="2.5" height="4" fill="#ffffff" opacity="0.28"/></pattern>`
  } else if (st.texture === 'blok') {
    defs += `<pattern id="tx" width="6" height="4" patternUnits="userSpaceOnUse"><rect width="3" height="4" fill="#ffffff" opacity="0.16"/></pattern>`
    // Dikey cila — üst parlaklık → gövde → alt gölge (objectBoundingBox: her çubuğa uyar).
    defs += `<linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.34"/><stop offset="0.3" stop-color="#ffffff" stop-opacity="0.05"/><stop offset="0.62" stop-color="#000000" stop-opacity="0.07"/><stop offset="1" stop-color="#000000" stop-opacity="0.2"/></linearGradient>`
  } else if (st.texture === 'gym') {
    // Parlak vinil cila — üst keskin spekular → şeffaf → alt gölge.
    defs += `<linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/><stop offset="0.22" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.03"/><stop offset="1" stop-color="#000000" stop-opacity="0.22"/></linearGradient>`
  }

  const bars = v.heights
    .map((h, i) => {
      const x = XS[i]
      const y = tops[i]
      const rect = (fill, extra = '') => `<rect x="${x}" y="${y}" width="${BW}" height="${h}" rx="${st.corner}" fill="${fill}"${extra}/>`
      let out = rect(colors[i], st.texture === 'blok' ? ' stroke="#000000" stroke-opacity="0.28" stroke-width="1"' : '')
      if (st.texture === 'pixel' || st.texture === 'blok') out += rect('url(#tx)')
      if (st.texture === 'blok' || st.texture === 'gym') out += rect('url(#gl)')
      return out
    })
    .join('')

  let bgLayer = ''
  if (mode === 'icon') {
    const g = bg ?? BRAND.iconBg
    defs += `<linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.top}"/><stop offset="1" stop-color="${g.bottom}"/></linearGradient>`
    bgLayer = `<rect width="120" height="120" fill="url(#bgg)"/>`
  }

  const crisp = st.crisp ? ' shape-rendering="crispEdges"' : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120"${crisp}>${defs ? `<defs>${defs}</defs>` : ''}${bgLayer}${arches}${bars}</svg>`
}
