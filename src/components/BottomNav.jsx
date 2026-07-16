import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import HomeIcon from './HomeIcon'
import DailyIcon from './DailyIcon'
import HistoryIcon from './HistoryIcon'
import ProfileIcon from './ProfileIcon'
import StarIcon from './StarIcon'
import { PixelNavIcon } from './pixelSprites'
import { BlokNavIcon } from './blokSprites'

const ITEMS = [
  { to: '/', label: 'Ana Sayfa', Icon: HomeIcon, pixelName: 'home', end: true, activeColor: 'var(--color-text)' },
  { to: '/gunluk', label: 'Günlük', Icon: DailyIcon, pixelName: 'daily', activeColor: 'var(--color-text)' },
  { to: '/gecmis', label: 'Geçmiş', Icon: HistoryIcon, pixelName: 'history', activeColor: '#fb923c' },
  { to: '/ilerleme', label: 'İlerleme', Icon: StarIcon, pixelName: 'star', activeColor: '#FFD54A' },
  { to: '/profil', label: 'Profil', Icon: ProfileIcon, pixelName: 'profile', activeColor: 'var(--color-text)' },
]

export default function BottomNav() {
  const { profile } = useAuth()
  const { pathname } = useLocation()
  const premium = profile?.preferences?.navStyle === 'premium'
  const pixel = String(profile?.preferences?.theme ?? '').startsWith('pixel')
  const blok = profile?.preferences?.theme === 'blok'

  return (
    <nav
      className={`safe-bottom fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur ${
        premium ? 'border-transparent bg-surface/90' : 'border-border bg-surface/95'
      }`}
    >
      {/* pathname key'i: ışık süpürmesi sekme değişiminde bir kez oynar, sonsuz dönmez */}
      {premium && <span key={pathname} className="nav-lux-edge pointer-events-none absolute inset-x-0 top-0 h-[2px]" />}
      <div className="mx-auto flex max-w-md justify-around">
        {ITEMS.map(({ to, label, Icon, pixelName, end, activeColor: baseColor }) => {
          // Blok Diyarı: İlerleme'nin mücevheri zümrüt — etiket de yeşile döner.
          const activeColor = blok && pixelName === 'star' ? '#4EC94E' : baseColor
          return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="btn-nav flex flex-1 flex-col items-center gap-1 py-2.5 text-xs text-text-muted"
          >
            {({ isActive }) => (
              <>
                <div className="relative flex h-7 w-12 items-center justify-center">
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className={`absolute inset-0 rounded-full ${premium ? 'nav-pill-lux' : ''}`}
                      style={
                        premium
                          ? {
                              boxShadow: `0 0 16px color-mix(in srgb, ${activeColor} 28%, transparent), 0 0 7px rgba(244, 215, 140, 0.28)`,
                            }
                          : { backgroundColor: `color-mix(in srgb, ${activeColor} 12%, transparent)` }
                      }
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <motion.span
                    className="relative"
                    animate={{ y: premium && isActive ? -3 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  >
                    {blok ? (
                      <BlokNavIcon name={pixelName} isActive={isActive} />
                    ) : pixel ? (
                      <PixelNavIcon name={pixelName} isActive={isActive} activeColor={activeColor} />
                    ) : (
                      <Icon key={isActive ? 'active' : 'inactive'} isActive={isActive} />
                    )}
                  </motion.span>
                </div>
                <span
                  className="transition-colors"
                  style={{ color: isActive ? activeColor : 'var(--color-text-muted)' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
