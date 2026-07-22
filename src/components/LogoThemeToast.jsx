import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Logo from './Logo'
import { THEME_NAMES } from '../lib/brand'
import { t } from '../lib/i18n'

// Tema (ve dolayısıyla logo) değişince beliren küçük bildirim şeridi.
// Yeni temanın logosunu canlı gösterir — kullanıcı değişimi anında görür.
// Her temada çalışır; ~3.5 sn sonra kendiliğinden kapanır.
export default function LogoThemeToast({ theme, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [theme, onClose])

  return (
    <motion.div
      className="safe-top fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-3"
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-3 rounded-2xl border border-white/[0.1] px-4 py-2.5 text-left"
        style={{
          background: 'color-mix(in srgb, var(--color-surface) 88%, transparent)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 12px 34px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <motion.span
          key={theme}
          initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 18 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          {/* Bildirimdeki logo yeni temayı sabit gösterir */}
          <Logo mode="mark" size={26} theme={theme} />
        </motion.span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-text">{t('Logo güncellendi')}</span>
          <span className="block text-[11px] text-text-muted">
            {t('{theme} temasına uyarlandı', { theme: t(THEME_NAMES[theme] ?? THEME_NAMES.dark) })}
          </span>
        </span>
      </button>
    </motion.div>
  )
}
