import { motion } from 'framer-motion'

export default function HomeIcon({ isActive }) {
  return (
    <motion.svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      initial={false}
      animate={isActive ? { scale: [0.85, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.35, times: [0, 0.6, 1], ease: 'easeOut' }}
      style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))' : 'none' }}
    >
      <path
        d="M3 10.6 12 3.2l9 7.4M5.2 9.6V19a1.4 1.4 0 0 0 1.4 1.4h3.2V15a1 1 0 0 1 1-1h2.4a1 1 0 0 1 1 1v5.4h3.2A1.4 1.4 0 0 0 18.8 19V9.6"
        fill="none"
        stroke={isActive ? 'var(--color-text)' : 'currentColor'}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  )
}
