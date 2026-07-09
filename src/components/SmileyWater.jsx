import { AnimatePresence, motion } from 'framer-motion'

// Su Dostu — su içtikçe alttan dolan yüz (1 gün ödülü).
// Boş halde nötr; doldukça gülümseme yavaş yavaş açılır.
// mood: 'happy' (dolum sürüyor) | 'full' (hedef doldu) | 'sad' (limit aşıldı)
const WATER = '#29B6F6'
const INK_DRY = 'var(--color-text)'
const INK_WET = '#0B364D'

// Yüz genişliğine ölçekli dalga (soldan sağa kayar, .water-wave-a/b animasyonları)
const FACE_WAVE =
  'M -140 0 Q -105 -7 -70 0 Q -35 7 0 0 Q 35 -7 70 0 Q 105 7 140 0 Q 175 -7 210 0 L 210 40 L -140 40 Z'

export default function SmileyWater({ fraction, mood, realistic = false }) {
  const f = Math.max(0, Math.min(1, fraction))
  const size = 156
  const c = size / 2
  const r = 62
  const top = c - r
  const bottom = c + r
  const H = bottom - top
  const fillY = bottom - f * H

  // Su yüz hizasını geçince hatlar koyu mürekkebe döner (su üstünde okunur kalsın).
  const ink = f > 0.42 ? INK_WET : INK_DRY
  const full = mood === 'full'
  const sad = mood === 'sad'
  const outline = full ? WATER : sad ? '#F2994A' : 'var(--color-track)'

  // Gülümseme dolulukla açılır: boşken dümdüz, dolmaya yaklaştıkça geniş.
  const smileDepth = Math.round(22 * Math.pow(f, 0.8))
  // Gözler dolulukla hafif büyür, yanaklar %55'ten sonra belirir.
  const eyeR = 4.2 + 1.6 * f
  const cheekOpacity = Math.max(0, (f - 0.55) * 2) * 0.5

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      animate={sad ? { y: 0 } : { y: [0, -3.5, 0] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ display: 'block' }}
    >
      <defs>
        <clipPath id="smiley-face-clip">
          <circle cx={c} cy={c} r={r - 2} />
        </clipPath>
        {/* su — üstte açık, dipte koyu (derinlik hissi) */}
        <linearGradient id="smiley-water-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5BC9F8" />
          <stop offset="1" stopColor="#1E88C9" />
        </linearGradient>
        {/* cam kürenin dibindeki iç gölge */}
        <radialGradient id="smiley-inner-shade" cx="0.5" cy="0.32" r="0.75">
          <stop offset="0.66" stopColor="rgba(0,0,0,0)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.22)" />
        </radialGradient>
      </defs>

      {/* zemin gölgesi — küre yüzeyde oturuyor hissi */}
      <ellipse cx={c} cy={size - 5} rx={r * 0.62} ry="5" fill="rgba(0,0,0,0.28)" />

      {/* mood değişiminde küçük sahne animasyonu */}
      <motion.g
        key={mood}
        initial={full ? { scale: 0.92 } : false}
        animate={full ? { scale: [0.92, 1.05, 1] } : sad ? { rotate: [0, -2.5, 2.5, -1.5, 0] } : {}}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        style={{ transformOrigin: `${c}px ${c}px` }}
      >
        {/* cam gövde */}
        <circle cx={c} cy={c} r={r - 2} fill="rgba(255,255,255,0.035)" />

        {/* su — alttan yukarı dolar */}
        <g clipPath="url(#smiley-face-clip)">
          <rect
            x={c - r}
            width={r * 2}
            fill="url(#smiley-water-grad)"
            style={{
              y: fillY,
              height: Math.max(0, bottom - fillY),
              transition: 'y 700ms cubic-bezier(0.34, 1.2, 0.64, 1), height 700ms cubic-bezier(0.34, 1.2, 0.64, 1)',
            }}
          />
          {realistic && f > 0 && f < 1 && (
            <g style={{ transform: `translateY(${fillY}px)`, transition: 'transform 700ms cubic-bezier(0.34, 1.2, 0.64, 1)' }}>
              <path d={FACE_WAVE} fill={WATER} opacity="0.6" className="water-wave-a" />
              <path d={FACE_WAVE} fill="#7fd4fb" opacity="0.45" className="water-wave-b" />
            </g>
          )}
          {/* su yüzeyi çizgisi */}
          {f > 0.02 && f < 0.99 && (
            <g style={{ transform: `translateY(${fillY}px)`, transition: 'transform 700ms cubic-bezier(0.34, 1.2, 0.64, 1)' }}>
              <ellipse cx={c} cy="0" rx={r - 10} ry="2.4" fill="#CDEFFF" opacity="0.5" />
            </g>
          )}
          {/* kabarcıklar — gerçekçi animasyon ödülüyle */}
          {realistic && f > 0.3 && (
            <g>
              <circle className="water-bubble" cx={c - 18} cy={bottom - 10} r="2.2" fill="#dff4ff" style={{ animationDelay: '0.2s' }} />
              <circle className="water-bubble" cx={c + 22} cy={bottom - 16} r="1.6" fill="#dff4ff" style={{ animationDelay: '1.1s' }} />
              <circle className="water-bubble" cx={c + 4} cy={bottom - 6} r="1.3" fill="#dff4ff" style={{ animationDelay: '1.8s' }} />
            </g>
          )}
        </g>

        {/* dip iç gölgesi — küreye hacim verir */}
        <circle cx={c} cy={c} r={r - 3} fill="url(#smiley-inner-shade)" />

        {/* cam parlaması — sol üst yay + nokta */}
        <path
          d={`M ${c - 40} ${c - 26} a 48 48 0 0 1 18 -22`}
          stroke="#FFFFFF"
          strokeWidth="5.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.15"
        />
        <circle cx={c - 14} cy={top + 16} r="3" fill="#FFFFFF" opacity="0.18" />

        {/* yüz çerçevesi */}
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={outline}
          strokeWidth="4"
          style={{ transition: 'stroke 400ms ease' }}
        />

        {/* yüz hatları */}
        {sad ? (
          <g>
            {/* üzgün kaşlar */}
            <path d={`M ${c - 32} ${c - 26} q 10 -7 19 -2`} stroke={ink} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d={`M ${c + 32} ${c - 26} q -10 -7 -19 -2`} stroke={ink} strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* gözler */}
            <circle cx={c - 22} cy={c - 10} r="4.5" fill={ink} />
            <circle cx={c + 22} cy={c - 10} r="4.5" fill={ink} />
            {/* üzgün ağız */}
            <path d={`M ${c - 20} ${c + 32} q 20 -18 40 0`} stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* ter damlası */}
            <motion.path
              d={`M ${c + 42} ${c - 34} c 5 7 6 11 0 14 c -6 -3 -5 -7 0 -14 z`}
              fill={WATER}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: [0, 1, 1, 0], y: [0, 3, 6, 9] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeIn' }}
            />
          </g>
        ) : full ? (
          <g>
            {/* mutlu kapalı gözler (^ ^) */}
            <path d={`M ${c - 30} ${c - 8} q 8 -11 16 0`} stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d={`M ${c + 14} ${c - 8} q 8 -11 16 0`} stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* kocaman gülümseme */}
            <path d={`M ${c - 24} ${c + 16} q 24 26 48 0 z`} fill={ink} />
            {/* yanaklar */}
            <circle cx={c - 36} cy={c + 10} r="6" fill="#FF8A5B" opacity="0.55" />
            <circle cx={c + 36} cy={c + 10} r="6" fill="#FF8A5B" opacity="0.55" />
            {/* parıltı */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.6, ease: 'easeInOut' }}
            >
              <path d={`M ${c + 46} ${top + 6} v 8 M ${c + 42} ${top + 10} h 8`} stroke="#FFE48A" strokeWidth="2.5" strokeLinecap="round" />
            </motion.g>
          </g>
        ) : (
          <g>
            {/* gözler — dolulukla hafif büyür, içinde ışık noktası */}
            <circle cx={c - 22} cy={c - 12} r={eyeR} fill={ink} style={{ transition: 'fill 400ms ease' }} />
            <circle cx={c + 22} cy={c - 12} r={eyeR} fill={ink} style={{ transition: 'fill 400ms ease' }} />
            <circle cx={c - 23.5} cy={c - 13.5} r="1.4" fill="var(--color-surface)" opacity="0.85" />
            <circle cx={c + 20.5} cy={c - 13.5} r="1.4" fill="var(--color-surface)" opacity="0.85" />
            {/* ağız — boşken düz, doldukça gülümseme açılır */}
            <path
              d={`M ${c - 22} ${c + 18} q 22 ${smileDepth} 44 0`}
              stroke={ink}
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'stroke 400ms ease, d 500ms ease' }}
            />
            {/* yanaklar — hedefe yaklaştıkça belirir */}
            <circle cx={c - 36} cy={c + 8} r="5.5" fill="#FF8A5B" opacity={cheekOpacity} style={{ transition: 'opacity 500ms ease' }} />
            <circle cx={c + 36} cy={c + 8} r="5.5" fill="#FF8A5B" opacity={cheekOpacity} style={{ transition: 'opacity 500ms ease' }} />
          </g>
        )}
      </motion.g>
    </motion.svg>
  )
}

// Hedef üstü — her ekstra litre için beliren minik gülen damla arkadaş.
// Dolan litre büyüyerek doğar; tamamlanınca gülümser.
export function DropletBuddy({ fraction, index }) {
  const f = Math.max(0, Math.min(1, fraction))
  const born = f >= 1
  return (
    <AnimatePresence>
      <motion.svg
        key={born ? 'full' : 'growing'}
        width="34"
        height="40"
        viewBox="0 0 34 40"
        initial={{ scale: 0, y: 8 }}
        animate={{
          scale: 0.55 + 0.45 * f,
          y: 0,
          rotate: born ? [0, -6, 6, 0] : 0,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 300, damping: 16 },
          rotate: { delay: 0.15 + index * 0.1, duration: 0.7, ease: 'easeInOut' },
        }}
        style={{ transformOrigin: 'bottom center', display: 'block' }}
      >
        {/* damla gövdesi */}
        <path
          d="M17 2 C 24 12, 30 19, 30 26 a 13 13 0 1 1 -26 0 C 4 19, 10 12, 17 2 z"
          fill={WATER}
          opacity={0.35 + 0.65 * f}
        />
        {/* ışık vurgusu */}
        <circle cx="11.5" cy="22" r="2.6" fill="#ffffff" opacity="0.4" />
        {born ? (
          <g>
            {/* gülen minik yüz */}
            <circle cx="12.5" cy="26" r="1.7" fill={INK_WET} />
            <circle cx="21.5" cy="26" r="1.7" fill={INK_WET} />
            <path d="M 12.5 30.5 q 4.5 4 9 0" stroke={INK_WET} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </g>
        ) : (
          <g>
            {/* dolarken: şaşkın minik yüz */}
            <circle cx="12.5" cy="26" r="1.5" fill={INK_WET} opacity="0.75" />
            <circle cx="21.5" cy="26" r="1.5" fill={INK_WET} opacity="0.75" />
            <circle cx="17" cy="31" r="1.8" fill="none" stroke={INK_WET} strokeWidth="1.6" opacity="0.75" />
          </g>
        )}
      </motion.svg>
    </AnimatePresence>
  )
}
