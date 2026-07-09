import { motion } from 'framer-motion'

export default function StarIcon({ isActive }) {
  return (
    <motion.svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      initial={false}
      animate={isActive ? { scale: [0.6, 1.2, 1], rotate: [-15, 5, 0] } : { scale: 1, rotate: 0 }}
      transition={{ duration: 0.45, times: [0, 0.65, 1], ease: 'easeOut' }}
      style={{
        filter: isActive
          ? 'drop-shadow(0 0 4px rgba(255,213,74,0.75)) drop-shadow(0 0 9px rgba(255,193,7,0.6))'
          : 'none',
      }}
    >
      <path
        d="M12 2.8l2.1 5.1 5.5.5-4.2 3.6 1.3 5.4L12 14.4l-4.7 2.9 1.3-5.4-4.2-3.6 5.5-.5z"
        fill={isActive ? '#FFD54A' : 'none'}
        stroke={isActive ? '#FFD54A' : 'currentColor'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {isActive && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.5, ease: 'easeInOut' }}
        >
          <path d="M18 4v2.4M16.8 5.2h2.4" stroke="#FFE48A" strokeWidth="1.1" strokeLinecap="round" />
        </motion.g>
      )}
    </motion.svg>
  )
}
