import { useEffect } from 'react'
import { motion } from 'framer-motion'
import usePixelTheme from '../hooks/usePixelTheme'
import { PixelFlame } from './pixelSprites'
import { t } from '../lib/i18n'

const GOLD = '#F2A93B'
const SPARKS = Array.from({ length: 10 })

// Günün ilk kaydında serinin arttığını kutlayan tam ekran katman.
// Alev pop yapar, seri sayısı yayla belirir, kıvılcımlar dışa uçar; ~2.6s sonra kapanır.
export default function StreakCelebration({ streak, onClose }) {
  const pixel = usePixelTheme()

  useEffect(() => {
    navigator.vibrate?.([10, 40, 20])
    const t = setTimeout(onClose, 2600)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
    >
      <motion.div
        initial={{ scale: 0.7, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
        className="relative flex flex-col items-center"
      >
        {/* ışıma */}
        <div
          className="pointer-events-none absolute -inset-10 rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle, ${GOLD}55, transparent 70%)` }}
        />

        {/* kıvılcımlar */}
        {SPARKS.map((_, i) => {
          const angle = (i / SPARKS.length) * Math.PI * 2
          const dist = 70 + (i % 3) * 16
          return (
            <motion.span
              key={i}
              className="pointer-events-none absolute left-1/2 top-[46px] h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: i % 2 ? GOLD : '#FFD54A' }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0.4],
              }}
              transition={{ duration: 1, delay: 0.15 + (i % 4) * 0.05, ease: 'easeOut' }}
            />
          )
        })}

        {/* alev */}
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.05 }}
          style={{ filter: `drop-shadow(0 0 14px ${GOLD}88)` }}
          className="relative"
        >
          {pixel ? (
            <span className="pixel-flicker inline-flex">
              <PixelFlame size={76} />
            </span>
          ) : (
            <span className="text-[76px] leading-none">🔥</span>
          )}
        </motion.div>

        {/* seri sayısı */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.22 }}
          className="mt-2 flex items-baseline gap-2"
        >
          <span
            className="text-6xl font-bold tabular-nums tracking-tight"
            style={{ color: '#fff', textShadow: `0 0 20px ${GOLD}` }}
          >
            {streak}
          </span>
          <span className="text-2xl font-semibold text-white/90">{t('gün')}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="mt-2 text-center"
        >
          <div className="text-base font-semibold text-white">{t('Seri sürüyor! 🔥')}</div>
          <div className="mt-0.5 text-sm text-white/70">{t('Bugünün ilk kaydı — devam et.')}</div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
