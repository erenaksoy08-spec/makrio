// App icon + PWA icon + statik logo SVG üreteci.
// Tek kaynak: src/lib/brand.js. Renk/işaret değişince `node scripts/gen-icons.mjs`
// çalıştır, tüm çıktı boyutları yeniden üretilir.
//
// Çıktılar:
//   public/icons/icon-1024.png      App Store / Play Store (saydamsız tam kare)
//   public/icons/icon-512.png       PWA
//   public/icons/icon-512-maskable.png  PWA maskable (güvenli alan içinde)
//   public/icons/icon-192.png       PWA
//   public/icons/apple-touch-icon.png   180×180 (iOS Safari)
//   public/logo/<variant>-mark.svg  saydam işaret (in-app/wordmark)
//   public/logo/<variant>-icon.svg  dolu kare (splash vb.)
//   public/favicon.svg              arch işareti (dolu kare, dark)

import { Resvg } from '@resvg/resvg-js'
import { PNG } from 'pngjs'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { BRAND, LOGO_VARIANTS, DEFAULT_VARIANT, logoSVGString } from '../src/lib/brand.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = resolve(root, 'public/icons')
const logoDir = resolve(root, 'public/logo')
mkdirSync(iconsDir, { recursive: true })
mkdirSync(logoDir, { recursive: true })

// Opak (dolu zemin) PNG — app icon'lar için.
function png(svg, size, out) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: BRAND.iconBg.bottom })
  writeFileSync(out, r.render().asPng())
  console.log('✓', out.replace(root + '/', ''), `${size}×${size}`)
}

// Alpha kanalı OLMAYAN opak PNG — iOS AppIcon + App Store 1024 için zorunlu
// (Xcode/App Store alpha'lı ikonu reddeder). resvg hep RGBA verir; pngjs ile
// RGB'ye (colorType 2) yeniden kodlanır.
function pngNoAlpha(svg, size, out) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: BRAND.iconBg.bottom })
  const decoded = PNG.sync.read(r.render().asPng())
  writeFileSync(out, PNG.sync.write(decoded, { colorType: 2, inputColorType: 6 }))
  console.log('✓', out.replace(root + '/', ''), `${size}×${size} (opak, alpha yok)`)
}

// Saydam PNG — Android adaptive foreground katmanı için.
function pngT(svg, size, out) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  writeFileSync(out, r.render().asPng())
  console.log('✓', out.replace(root + '/', ''), `${size}×${size}`)
}

// App icon (birincil varyant) — çeşitli boyutlar.
const iconSVG = logoSVGString({ variant: DEFAULT_VARIANT, mode: 'icon', size: 1024 })
pngNoAlpha(iconSVG, 1024, resolve(iconsDir, 'icon-1024.png')) // App Store yüklemesi — opak
png(iconSVG, 512, resolve(iconsDir, 'icon-512.png'))
png(iconSVG, 512, resolve(iconsDir, 'icon-512-maskable.png')) // işaret zaten %80 güvenli alanda
png(iconSVG, 192, resolve(iconsDir, 'icon-192.png'))
png(iconSVG, 180, resolve(iconsDir, 'apple-touch-icon.png'))

// Statik SVG'ler — her varyant için mark (saydam) + icon (dolu kare).
for (const variant of Object.keys(LOGO_VARIANTS)) {
  writeFileSync(resolve(logoDir, `${variant}-mark.svg`), logoSVGString({ variant, mode: 'mark', size: 120 }))
  writeFileSync(resolve(logoDir, `${variant}-icon.svg`), logoSVGString({ variant, mode: 'icon', size: 120 }))
  console.log('✓', `public/logo/${variant}-mark.svg + ${variant}-icon.svg`)
}

// Favicon — birincil işaret, dolu kare (tarayıcı sekmesinde koyu zemin okunur).
writeFileSync(resolve(root, 'public/favicon.svg'), logoSVGString({ variant: DEFAULT_VARIANT, mode: 'icon', size: 64 }))
console.log('✓ public/favicon.svg')

// ── Native app icon'lar (Capacitor iOS + Android) ─────────────────────────
// Uygulama içi logo temayla değişir; OS ikonu birincil (bars, koyu) sabittir.

// iOS: tek 1024×1024 (saydamsız kare) — Contents.json bunu referans alır.
const iosDir = resolve(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset')
if (existsSync(iosDir)) {
  pngNoAlpha(iconSVG, 1024, resolve(iosDir, 'AppIcon-512@2x.png')) // alpha yok — zorunlu
}

// Android: adaptive icon.
//  ic_launcher.png        legacy kare (bg + bars), 48dp
//  ic_launcher_round.png  legacy daire, 48dp
//  ic_launcher_foreground.png  adaptive ön katman (yalnız işaret, saydam), 108dp
//  arka plan @color/ic_launcher_background → koyu (ikon zeminiyle uyumlu)
const androidRes = resolve(root, 'android/app/src/main/res')
if (existsSync(androidRes)) {
  const roundSVG = logoSVGString({ variant: DEFAULT_VARIANT, mode: 'icon', size: 1024, shape: 'circle' })
  // Adaptive foreground: işareti güvenli alana (merkez ~%66) ortalayarak göm.
  // Mark bbox merkezi (60,57) → 156'lık pedli tuvalin merkezine (78,78) taşınır.
  const fgInner = logoSVGString({ variant: DEFAULT_VARIANT, mode: 'mark', theme: 'dark', bare: true })
  const fgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 156 156"><g transform="translate(18,21)">${fgInner}</g></svg>`

  const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
  for (const [d, m] of Object.entries(densities)) {
    const dir = resolve(androidRes, `mipmap-${d}`)
    if (!existsSync(dir)) continue
    png(iconSVG, Math.round(48 * m), resolve(dir, 'ic_launcher.png'))
    png(roundSVG, Math.round(48 * m), resolve(dir, 'ic_launcher_round.png'))
    pngT(fgSVG, Math.round(108 * m), resolve(dir, 'ic_launcher_foreground.png'))
  }

  // Adaptive arka plan rengi — ikon zeminiyle uyumlu koyu (beyaz placeholder yerine).
  const bgXml = resolve(androidRes, 'values/ic_launcher_background.xml')
  if (existsSync(bgXml)) {
    writeFileSync(
      bgXml,
      `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#101216</color>\n</resources>\n`,
    )
    console.log('✓ values/ic_launcher_background.xml → #101216')
  }
}
