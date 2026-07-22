import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BottomNav from './BottomNav'
import LogoThemeToast from './LogoThemeToast'
import { useAuth } from '../contexts/AuthContext'
import { logoSVGString } from '../lib/brand'

export default function AppLayout() {
  const location = useLocation()
  const { profile } = useAuth()
  const pref = profile?.preferences?.theme
  const theme = ['light', 'pixel', 'pixel-dark', 'pixel-color', 'pixel-super', 'gym', 'blok'].includes(pref)
    ? pref
    : 'dark'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [theme])

  // Logo her temada değişir: tarayıcı sekmesi favicon'unu da aktif temaya uyarla.
  useEffect(() => {
    const svg = logoSVGString({ variant: 'bars', mode: 'icon', size: 64, theme })
    const href = `data:image/svg+xml,${encodeURIComponent(svg)}`
    let link = document.querySelector("link[rel='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/svg+xml'
    link.href = href
  }, [theme])

  // Tema (dolayısıyla logo) değişince bildirim göster — ilk yüklemede değil,
  // yalnızca kullanıcı temayı değiştirdiğinde.
  const [logoToast, setLogoToast] = useState(null)
  const prevTheme = useRef(undefined)
  useEffect(() => {
    if (prevTheme.current !== undefined && prevTheme.current !== theme) {
      setLogoToast(theme)
    }
    prevTheme.current = theme
  }, [theme])

  // Yazı büyüklüğü tercihi: rem tabanlı tüm metinler kök font boyutuyla ölçeklenir.
  const fontScale = profile?.preferences?.fontScale
  useEffect(() => {
    const map = { kucuk: '93.75%', buyuk: '106.25%' }
    if (map[fontScale]) document.documentElement.style.fontSize = map[fontScale]
    else document.documentElement.style.removeProperty('font-size')
    return () => document.documentElement.style.removeProperty('font-size')
  }, [fontScale])

  // Vitrin: özel zemin rengi temalarla birlikte kullanılamaz — her temanın
  // kendi zemini vardır. Yalnızca varsayılan (koyu) görünümde uygulanır.
  const bgColor = theme === 'dark' ? profile?.preferences?.bgColor : null
  useEffect(() => {
    if (bgColor) document.documentElement.style.setProperty('--color-bg', bgColor)
    else document.documentElement.style.removeProperty('--color-bg')
    return () => document.documentElement.style.removeProperty('--color-bg')
  }, [bgColor])

  return (
    <div className="flex min-h-svh flex-col pb-20">
      <AnimatePresence>
        {logoToast && <LogoThemeToast theme={logoToast} onClose={() => setLogoToast(null)} />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ flex: 1 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </div>
  )
}
