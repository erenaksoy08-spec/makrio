import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BottomNav from './BottomNav'
import { useAuth } from '../contexts/AuthContext'

export default function AppLayout() {
  const location = useLocation()
  const { profile } = useAuth()
  const pref = profile?.preferences?.theme
  const theme = ['light', 'pixel', 'pixel-dark', 'pixel-color', 'gym'].includes(pref) ? pref : 'dark'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [theme])

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
