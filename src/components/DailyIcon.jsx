import { motion } from 'framer-motion'

export default function DailyIcon({ isActive }) {
  return (
    <motion.svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      initial={false}
      animate={isActive ? { scale: [0.85, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.35, times: [0, 0.6, 1], ease: 'easeOut' }}
      style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(242, 169, 59, 0.45))' : 'none' }}
    >
      <rect
        x="4.5"
        y="3.5"
        width="15"
        height="17"
        rx="2.5"
        stroke={isActive ? 'var(--color-text)' : 'currentColor'}
        strokeWidth="1.7"
      />
      <motion.path
        d="M8 9h8"
        stroke={isActive ? 'var(--color-text)' : 'currentColor'}
        strokeWidth="1.7"
        strokeLinecap="round"
        initial={false}
        animate={isActive ? { pathLength: [0, 1] } : { pathLength: 1 }}
        transition={{ duration: 0.3, delay: isActive ? 0.05 : 0 }}
      />
      <motion.path
        d="M8 13h8"
        stroke={isActive ? 'var(--color-text)' : 'currentColor'}
        strokeWidth="1.7"
        strokeLinecap="round"
        initial={false}
        animate={isActive ? { pathLength: [0, 1] } : { pathLength: 1 }}
        transition={{ duration: 0.3, delay: isActive ? 0.12 : 0 }}
      />
      <motion.path
        d="M8 17l1.8 1.8L13.5 15.2"
        stroke={isActive ? 'var(--color-text)' : 'currentColor'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={false}
        animate={isActive ? { pathLength: [0, 1] } : { pathLength: 0 }}
        transition={{ duration: 0.3, delay: isActive ? 0.22 : 0 }}
      />
    </motion.svg>
  )
}
