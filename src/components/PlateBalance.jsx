import { AnimatePresence, motion } from 'framer-motion'
import PlateIcon from './PlateIcon'

// Oyun HUD'u tarzı bakiye sayacı: plaka ikonu + sayı.
// Sayı değişince eskisi düşer, yenisi zıplayarak gelir.
export default function PlateBalance({ value, size = 'md' }) {
  const sm = size === 'sm'
  return (
    <span
      className={`inline-flex items-center ${sm ? 'gap-1.5 px-2.5 py-1' : 'gap-2 px-3.5 py-1.5'} rounded-full`}
      style={{
        border: '1px solid rgba(242,201,76,0.35)',
        background: 'linear-gradient(180deg, rgba(20,20,22,0.9), rgba(10,10,12,0.9))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 10px rgba(0,0,0,0.4)',
      }}
      title={`${value} Plaka`}
    >
      <PlateIcon size={sm ? 18 : 24} />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -10, opacity: 0, scale: 0.7 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0, scale: 0.7 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className={`${sm ? 'text-[13px]' : 'text-[16px]'} font-black tabular-nums leading-none`}
          style={{ color: '#F6E7B8', display: 'inline-block', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
