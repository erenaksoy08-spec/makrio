import { logoSVGString, DEFAULT_VARIANT } from '../lib/brand'
import useCurrentTheme from '../hooks/useCurrentTheme'

// Makrio marka işareti — uygulama içi (header, splash, wordmark yanı).
// Renk/geometri src/lib/brand.js'ten gelir. TEMA-TEPKİLİ: çubuklar aktif temanın
// gerçek stiliyle (piksel/gym/blok/düz) render edilir; kullanıcı tema değiştirince
// otomatik güncellenir. `theme` prop verilirse o sabitlenir (önizleme için).
//
//   variant : 'bars' (varsayılan) | 'arch' | 'step'
//   mode    : 'mark' (saydam) | 'icon' (dolu kare zemin)
export default function Logo({ variant = DEFAULT_VARIANT, mode = 'mark', size = 32, theme, className = '', ...rest }) {
  const current = useCurrentTheme()
  const active = theme ?? current
  return (
    <span
      role="img"
      aria-label="Makrio"
      className={`inline-flex shrink-0 ${className}`}
      style={{ width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: logoSVGString({ variant, mode, size, theme: active }) }}
      {...rest}
    />
  )
}

// "makrio" kelime markası — işaret, kelimenin "m"si yerine geçer.
export function Wordmark({ variant = DEFAULT_VARIANT, size = 30, theme, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-extrabold tracking-tight text-text ${className}`} style={{ fontSize: size }}>
      <Logo variant={variant} size={size * 1.02} theme={theme} />
      <span style={{ letterSpacing: '-0.02em' }}>akrio</span>
    </span>
  )
}
