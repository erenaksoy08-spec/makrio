import { motion } from 'framer-motion'

const BARS = [
  { x: 3, activeH: 12, color: '#FF8A5B', delay: 0 },
  { x: 10, activeH: 16, color: '#6FCF97', delay: 0.06 },
  { x: 17, activeH: 6, color: '#F2C94C', delay: 0.12 },
]

export default function HistoryIcon({ isActive }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <line x1="1" y1="24" x2="23" y2="24" stroke="currentColor" strokeWidth="1.5" />
      {BARS.map((bar) => (
        <motion.rect
          key={bar.x}
          x={bar.x}
          width="4"
          rx="1.5"
          fill={isActive ? bar.color : '#a3a3a3'}
          initial={{ height: 2, y: 22 }}
          animate={isActive ? { height: bar.activeH, y: 24 - bar.activeH } : { height: 6, y: 18 }}
          transition={{
            duration: 0.4,
            delay: isActive ? bar.delay : 0,
            type: 'spring',
            stiffness: 380,
            damping: 20,
          }}
        />
      ))}
    </svg>
  )
}
