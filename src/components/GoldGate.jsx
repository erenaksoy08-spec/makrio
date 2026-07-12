import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const GOLD = '#F5C84B'
const GOLD_DEEP = '#E0A93B'

const PERKS = [
  { icon: '♾️', text: 'Sınırsız yemek kaydı' },
  { icon: '🏆', text: "Arkadaş Ligi'ne erişim" },
  { icon: '🎁', text: 'Özel ilerleme ödülleri' },
  { icon: '🛍️', text: "Uygulama Tasarım Mağazası'na erişim" },
  { icon: '🚫', text: 'Reklamsız deneyim' },
]

// Ücretsiz limit dolunca çıkan Gold daveti — ceza değil, davet gibi hissettirir.
export default function GoldGate({ onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      {/* dönen altın hüzmeler */}
      <div
        className="reward-rays pointer-events-none absolute h-[560px] w-[560px]"
        style={{
          background: `repeating-conic-gradient(from 0deg, ${GOLD}14 0deg 11deg, transparent 11deg 27deg)`,
          maskImage: 'radial-gradient(circle, black 18%, transparent 62%)',
          WebkitMaskImage: 'radial-gradient(circle, black 18%, transparent 62%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="relative w-full max-w-xs overflow-hidden rounded-3xl border p-5 text-center"
        style={{
          borderColor: `${GOLD}59`,
          background: 'linear-gradient(170deg, #2e2410, #141009 60%)',
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${GOLD}26, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        {/* üst ışık hattı */}
        <span
          className="pointer-events-none absolute inset-x-8 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD}99, transparent)` }}
        />

        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto text-4xl"
          style={{ filter: `drop-shadow(0 0 14px ${GOLD}99)` }}
        >
          👑
        </motion.div>

        <h2
          className="mt-2 text-xl font-bold uppercase tracking-[0.14em]"
          style={{
            backgroundImage: `linear-gradient(92deg, #F8D64B 10%, ${GOLD_DEEP} 45%, #F8E7A0 70%, ${GOLD_DEEP} 95%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Makrio Gold
        </h2>

        <p className="mt-2 text-sm font-semibold" style={{ color: '#F5F1E4' }}>Bugünün ücretsiz kayıtları doldu</p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: '#B7AC93' }}>
          Günde 3 kayıt ücretsiz. Gold ile sınır yok — takibin hiç durmasın.
        </p>

        <ul className="mt-4 space-y-2 text-left">
          {PERKS.map((p, i) => (
            <motion.li
              key={p.text}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="flex items-center gap-2.5 text-[13px]" style={{ color: '#F0EADA' }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs"
                style={{ backgroundColor: `${GOLD}1f`, color: GOLD }}
              >
                {p.icon}
              </span>
              {p.text}
            </motion.li>
          ))}
        </ul>

        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-xl font-bold" style={{ color: '#F5F1E4' }}>₺79,99</span>
          <span className="text-xs" style={{ color: '#B7AC93' }}>/ ay</span>
        </div>

        <Link
          to="/profil"
          className="btn-primary relative mt-3 block w-full overflow-hidden rounded-xl py-3 font-semibold text-black"
          style={{
            background: `linear-gradient(90deg, #F8D64B, ${GOLD_DEEP})`,
            boxShadow: `0 8px 24px ${GOLD}40, inset 0 1px 0 rgba(255,255,255,0.4)`,
          }}
        >
          <span
            className="medal-sheen pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)',
            }}
          />
          <span className="relative">👑 Gold'a Yükselt</span>
        </Link>

        <button type="button" onClick={onClose} className="btn-chip mt-2.5 px-4 py-1.5 text-xs" style={{ color: '#B7AC93' }}>
          Şimdi değil
        </button>
      </motion.div>
    </motion.div>
  )
}
