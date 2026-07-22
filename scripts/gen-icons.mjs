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
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { BRAND, LOGO_VARIANTS, DEFAULT_VARIANT, logoSVGString } from '../src/lib/brand.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = resolve(root, 'public/icons')
const logoDir = resolve(root, 'public/logo')
mkdirSync(iconsDir, { recursive: true })
mkdirSync(logoDir, { recursive: true })

function png(svg, size, out) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: BRAND.iconBg.bottom })
  writeFileSync(out, r.render().asPng())
  console.log('✓', out.replace(root + '/', ''), `${size}×${size}`)
}

// App icon (birincil varyant) — çeşitli boyutlar.
const iconSVG = logoSVGString({ variant: DEFAULT_VARIANT, mode: 'icon', size: 1024 })
png(iconSVG, 1024, resolve(iconsDir, 'icon-1024.png'))
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
