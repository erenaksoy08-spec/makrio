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

// ── @capacitor/assets kaynak görselleri (assets/) ─────────────────────────
// Bunlardan iOS + Android native ikon/splash setleri şu komutla üretilir:
//   npx capacitor-assets generate --ios --android
// (Uygulama içi logo temayla değişir; OS ikonu birincil bars/koyu ile sabittir.)
const assetsDir = resolve(root, 'assets')
mkdirSync(assetsDir, { recursive: true })

// icon-only: dolu ikon (iOS + Android legacy).
png(iconSVG, 1024, resolve(assetsDir, 'icon-only.png'))

// icon-background: adaptive arka plan (koyu degrade zemin — bars'sız).
const bgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 120 120"><defs><linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BRAND.iconBg.top}"/><stop offset="1" stop-color="${BRAND.iconBg.bottom}"/></linearGradient></defs><rect width="120" height="120" fill="url(#bgg)"/></svg>`
png(bgSVG, 1024, resolve(assetsDir, 'icon-background.png'))

// icon-foreground: yalnız işaret (saydam), tuvali dolduracak şekilde (mark ~%80).
// capacitor-assets kendi %16.7 güvenli-alan inset'ini uygular; bu yüzden kaynak
// DOLU verilir (mark merkezi 60,57 → viewBox merkezine oturur).
const fgInner = logoSVGString({ variant: DEFAULT_VARIANT, mode: 'mark', theme: 'dark', bare: true })
const fgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="6 3 108 108">${fgInner}</svg>`
pngT(fgSVG, 1024, resolve(assetsDir, 'icon-foreground.png'))

// splash / splash-dark: 2732×2732, işaret ortada. Açık ve koyu mod.
const markBare = logoSVGString({ variant: DEFAULT_VARIANT, mode: 'mark', theme: 'dark', bare: true })
function splashSVG(bgColor, markW = 760) {
  const s = markW / 120
  const tx = 1366 - 60 * s // mark bbox merkezi (60,57) → tuval merkezi (1366,1366)
  const ty = 1366 - 57 * s
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732"><rect width="2732" height="2732" fill="${bgColor}"/><g transform="translate(${tx},${ty}) scale(${s})">${markBare}</g></svg>`
}
png(splashSVG('#f4f2ee'), 2732, resolve(assetsDir, 'splash.png'))
png(splashSVG(BRAND.iconBg.bottom), 2732, resolve(assetsDir, 'splash-dark.png'))
console.log('✓ assets/ kaynakları hazır → çalıştır: npx capacitor-assets generate --ios --android')
