import { motion } from 'framer-motion'

// Alt menü — Arkadaş Ligi kupası. Aktifken altın dolgu + parlama.
export default function TrophyIcon({ isActive }) {
  const gold = '#F2C94C'
  return (
    <motion.svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      initial={false}
      animate={isActive ? { scale: [0.6, 1.18, 1], y: [2, -2, 0] } : { scale: 1, y: 0 }}
      transition={{ duration: 0.45, times: [0, 0.65, 1], ease: 'easeOut' }}
      style={{
        filter: isActive
          ? 'drop-shadow(0 0 4px rgba(242,201,76,0.75)) drop-shadow(0 0 9px rgba(242,169,59,0.55))'
          : 'none',
      }}
    >
      {/* kulplar */}
      <path
        d="M6.5 6H4c0 2.6 1.4 4.4 3.2 5M17.5 6H20c0 2.6-1.4 4.4-3.2 5"
        stroke={isActive ? gold : 'currentColor'}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* kupa gövdesi */}
      <path
        d="M6.5 4.5h11V10a5.5 5.5 0 0 1-11 0z"
        fill={isActive ? gold : 'none'}
        stroke={isActive ? gold : 'currentColor'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* sap + kaide */}
      <path d="M12 15.5v2.5" stroke={isActive ? gold : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M8.5 20.5h7"
        stroke={isActive ? gold : 'currentColor'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M10 18h4v2.5h-4z" fill={isActive ? gold : 'none'} stroke={isActive ? gold : 'currentColor'} strokeWidth="1.4" strokeLinejoin="round" />
      {isActive && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.5, ease: 'easeInOut' }}
        >
          <path d="M18.5 2.5v2.2M17.4 3.6h2.2" stroke="#FFE48A" strokeWidth="1.1" strokeLinecap="round" />
        </motion.g>
      )}
    </motion.svg>
  )
}
