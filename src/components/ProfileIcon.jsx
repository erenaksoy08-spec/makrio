import { motion } from 'framer-motion'

export default function ProfileIcon({ isActive }) {
  if (!isActive) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <motion.circle
        cx="12"
        cy="10"
        r="7"
        stroke="var(--color-text)"
        strokeWidth="1.8"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      <motion.circle
        cx="9.5"
        cy="9"
        r="1"
        fill="var(--color-text)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
      />
      <motion.circle
        cx="14.5"
        cy="9"
        r="1"
        fill="var(--color-text)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 500 }}
      />
      <motion.path
        d="M9 12.5 Q12 15.5 15 12.5"
        stroke="var(--color-text)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.2, duration: 0.35, ease: 'easeOut' }}
      />
      <motion.path
        d="M5 20c0-3.3 3.6-5 7-5s7 1.7 7 5"
        stroke="var(--color-text)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      />
    </svg>
  )
}
