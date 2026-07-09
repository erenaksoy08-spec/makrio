import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import RewardMedallion from './RewardMedallion'

const GOLD = '#F2C94C'

// Piksel Tema'nın seçilebilir stilleri — kart minik bir zemin/mürekkep önizlemesi taşır.
const PIXEL_VARIANTS = [
  { value: 'pixel', label: 'Aydınlık', swatch: '#e9e4d8', ink: '#4c4a47' },
  { value: 'pixel-dark', label: 'Koyu', swatch: '#17161c', ink: '#ecebe6' },
  { value: 'pixel-color', label: 'Retro', swatch: '#d8e2c9', ink: '#3e4938' },
]

function rand(min, max) {
  return min + Math.random() * (max - min)
}

// Tam ekran ödül seremonisi.
// mode: 'reveal' (mühür → patlama → ödül) | 'detail' (açılmış ödül) | 'locked' (ilerleme)
export default function RewardCeremony({
  reward,
  mode,
  streak,
  active,
  activeVariant,
  activeValues = [],
  saving,
  onApply,
  onClose,
}) {
  const [phase, setPhase] = useState(mode === 'reveal' ? 'sealed' : 'open')
  const a = reward.accent
  const revealed = mode === 'reveal' && phase === 'open'

  // Patlama parçacıkları — her seremoni için bir kez üretilir.
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        angle: (i / 16) * Math.PI * 2 + rand(-0.15, 0.15),
        dist: rand(72, 138),
        size: rand(3.5, 8),
        color: [a, GOLD, '#FFFFFF'][i % 3],
        delay: rand(0, 0.08),
      })),
    [a],
  )

  const confetti = useMemo(
    () =>
      Array.from({ length: 12 }, () => ({
        x: rand(-120, 120),
        drift: rand(-30, 30),
        fall: rand(130, 210),
        rot: rand(-260, 260),
        size: rand(5, 9),
        color: [a, GOLD, '#22D3EE', '#C084FC'][Math.floor(rand(0, 4))],
        delay: rand(0, 0.2),
      })),
    [a],
  )

  // Ortamda süzülen altın toz zerreleri.
  const dust = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: rand(6, 94),
        bottom: rand(-10, 30),
        size: rand(2, 4.5),
        dur: rand(4.5, 8),
        delay: rand(0, 6),
        color: i % 3 === 0 ? a : GOLD,
      })),
    [a],
  )

  // Mühür 1.5 sn sonra kendiliğinden kırılır (dokunarak da erkene alınabilir).
  useEffect(() => {
    if (phase !== 'sealed') return undefined
    const t = setTimeout(() => setPhase('open'), 1500)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (revealed) navigator.vibrate?.([18, 50, 28])
  }, [revealed])

  const progressPct = Math.min(100, (streak / reward.days) * 100)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* karartma */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={phase === 'open' ? onClose : undefined}
      />

      {/* dönen ışık hüzmeleri — iki katman, zıt yönlü (derinlik) */}
      <div
        className="reward-rays pointer-events-none absolute h-[560px] w-[560px]"
        style={{
          background: `repeating-conic-gradient(from 0deg, ${a}17 0deg 11deg, transparent 11deg 27deg)`,
          maskImage: 'radial-gradient(circle, black 18%, transparent 62%)',
          WebkitMaskImage: 'radial-gradient(circle, black 18%, transparent 62%)',
          opacity: phase === 'open' && mode !== 'locked' ? 1 : 0.35,
          transition: 'opacity 0.6s',
        }}
      />
      <div
        className="reward-rays-rev pointer-events-none absolute h-[640px] w-[640px]"
        style={{
          background: `repeating-conic-gradient(from 7deg, ${GOLD}0d 0deg 8deg, transparent 8deg 34deg)`,
          maskImage: 'radial-gradient(circle, black 14%, transparent 58%)',
          WebkitMaskImage: 'radial-gradient(circle, black 14%, transparent 58%)',
          opacity: phase === 'open' && mode !== 'locked' ? 0.9 : 0.25,
          transition: 'opacity 0.6s',
        }}
      />

      {/* ışıma — madalyonun arkasındaki yumuşak renk bulutu */}
      {mode !== 'locked' && (
        <motion.div
          className="pointer-events-none absolute h-[340px] w-[340px] rounded-full"
          style={{ background: `radial-gradient(circle, ${a}38, transparent 68%)` }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: phase === 'open' ? 1 : 0.5, scale: phase === 'open' ? 1 : 0.8 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}

      {/* yükselen altın toz zerreleri */}
      {mode !== 'locked' && (
        <div className="pointer-events-none absolute h-[420px] w-full max-w-sm overflow-hidden">
          {dust.map((d, i) => (
            <span
              key={`d${i}`}
              className="absolute rounded-full"
              style={{
                left: `${d.left}%`,
                bottom: `${d.bottom}%`,
                width: d.size,
                height: d.size,
                backgroundColor: d.color,
                boxShadow: `0 0 6px ${d.color}`,
                animation: `dust-float ${d.dur}s linear ${d.delay}s infinite`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* patlama anı — beyaz flaş */}
      {revealed && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.32, 0] }}
          transition={{ duration: 0.55, times: [0, 0.12, 1], ease: 'easeOut' }}
        />
      )}

      <div className="relative flex w-full max-w-xs flex-col items-center text-center">
        {/* madalyon sahnesi */}
        <div className="relative flex h-40 w-full items-center justify-center">
          {phase === 'sealed' ? (
            <motion.button
              type="button"
              onClick={() => setPhase('open')}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: [0, -5, 5, -4, 4, -2, 2, 0] }}
              transition={{
                scale: { type: 'spring', stiffness: 240, damping: 15 },
                opacity: { duration: 0.25 },
                rotate: { delay: 0.4, duration: 0.95, ease: 'easeInOut' },
              }}
              className="medal-pulse rounded-full"
            >
              <RewardMedallion reward={reward} state="sealed" size={124} />
            </motion.button>
          ) : (
            <>
              {/* patlama: flaş halkası + parçacıklar + konfeti */}
              {revealed && (
                <>
                  <motion.span
                    className="pointer-events-none absolute rounded-full"
                    style={{ width: 124, height: 124, border: `4px solid ${a}` }}
                    initial={{ scale: 0.5, opacity: 0.9 }}
                    animate={{ scale: 3.1, opacity: 0 }}
                    transition={{ duration: 0.75, ease: 'easeOut' }}
                  />
                  <motion.span
                    className="pointer-events-none absolute rounded-full"
                    style={{ width: 124, height: 124, border: `1.5px solid ${GOLD}` }}
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 0.95, delay: 0.12, ease: 'easeOut' }}
                  />
                  {particles.map((p, i) => (
                    <motion.span
                      key={`p${i}`}
                      className="pointer-events-none absolute rounded-full"
                      style={{ width: p.size, height: p.size, backgroundColor: p.color }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos(p.angle) * p.dist,
                        y: Math.sin(p.angle) * p.dist,
                        scale: 1,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.85, delay: p.delay, ease: 'easeOut' }}
                    />
                  ))}
                  {confetti.map((c, i) => (
                    <motion.span
                      key={`c${i}`}
                      className="pointer-events-none absolute rounded-[2px]"
                      style={{ width: c.size, height: c.size * 0.55, backgroundColor: c.color }}
                      initial={{ x: c.x * 0.3, y: -10, rotate: 0, opacity: 1 }}
                      animate={{ x: c.x + c.drift, y: c.fall, rotate: c.rot, opacity: 0 }}
                      transition={{ duration: 1.4, delay: 0.12 + c.delay, ease: [0.2, 0.6, 0.4, 1] }}
                    />
                  ))}
                </>
              )}

              <motion.div
                initial={mode === 'reveal' ? { scale: 0.35, opacity: 0 } : { scale: 0.82, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 250, damping: 13 }}
              >
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <RewardMedallion
                    reward={reward}
                    state={mode === 'locked' ? 'locked' : 'open'}
                    size={124}
                    progress={streak / reward.days}
                  />
                </motion.div>
              </motion.div>
            </>
          )}
        </div>

        {/* içerik */}
        {phase === 'sealed' ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-sm font-medium"
            style={{ color: '#F2A93B' }}
          >
            ✨ Yeni bir ödül kazandın
          </motion.p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: mode === 'reveal' ? 0.25 : 0.1, duration: 0.4, ease: 'easeOut' }}
            className="mt-2 flex w-full flex-col items-center"
          >
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] tabular-nums"
              style={{ backgroundColor: `${a}1f`, color: a, border: `1px solid ${a}40` }}
            >
              {reward.days} günlük seri
            </span>
            <h2
              className="mt-3 text-2xl font-bold leading-snug"
              style={{
                backgroundImage: `linear-gradient(180deg, #FFFFFF 40%, ${a})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {reward.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{reward.description}</p>

            {reward.duo && mode !== 'locked' ? (
              <div className="mt-5 w-full">
                <div className="grid grid-cols-2 gap-2.5">
                  {reward.duo.map((item, i) => {
                    const on = activeValues.includes(item.value)
                    return (
                      <motion.button
                        key={item.value}
                        type="button"
                        disabled={saving}
                        onClick={() => onApply(item)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.07, duration: 0.3, ease: 'easeOut' }}
                        whileTap={{ scale: 0.94 }}
                        className="btn-chip relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 disabled:opacity-50"
                        style={{
                          borderColor: on ? item.accent : 'rgba(255,255,255,0.12)',
                          background: on ? `${item.accent}14` : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                          style={{
                            backgroundColor: `${item.accent}1f`,
                            border: `1px solid ${item.accent}40`,
                            boxShadow: on ? `0 0 10px ${item.accent}59` : 'none',
                          }}
                        >
                          {item.icon}
                        </span>
                        <span
                          className="text-[12px] font-semibold"
                          style={{ color: on ? item.accent : 'var(--color-text)' }}
                        >
                          {item.label}
                        </span>
                        <span className="text-[10px] leading-tight text-text-muted">{item.desc}</span>
                        {on && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-black"
                            style={{ backgroundColor: item.accent }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
                <p className="mt-2.5 text-[11px] text-text-muted">
                  {saving
                    ? 'Uygulanıyor...'
                    : activeValues.length > 0
                      ? 'Kapatmak için seçili hediyeye tekrar dokun.'
                      : 'Hediyeni seç — istersen ikisini birden aç.'}
                </p>
              </div>
            ) : reward.id === 'pixel-theme' && mode !== 'locked' ? (
              <div className="mt-5 w-full">
                <div className="grid grid-cols-3 gap-2">
                  {PIXEL_VARIANTS.map((v, i) => {
                    const on = activeVariant === v.value
                    return (
                      <motion.button
                        key={v.value}
                        type="button"
                        disabled={saving}
                        onClick={() => onApply(v.value)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.07, duration: 0.3, ease: 'easeOut' }}
                        whileTap={{ scale: 0.94 }}
                        className="btn-chip relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 disabled:opacity-50"
                        style={{
                          borderColor: on ? a : 'rgba(255,255,255,0.12)',
                          background: on ? `${a}14` : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
                          style={{
                            backgroundColor: v.swatch,
                            color: v.ink,
                            border: '1px solid rgba(255,255,255,0.18)',
                            boxShadow: on ? `0 0 10px ${a}59` : 'none',
                          }}
                        >
                          Aa
                        </span>
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: on ? a : 'var(--color-text-muted)' }}
                        >
                          {v.label}
                        </span>
                        {on && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-black"
                            style={{ backgroundColor: a }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
                <p className="mt-2.5 text-[11px] text-text-muted">
                  {saving
                    ? 'Uygulanıyor...'
                    : activeVariant
                      ? 'Kapatmak için seçili stile tekrar dokun.'
                      : 'Bir stil seç, anında uygulansın.'}
                </p>
              </div>
            ) : mode === 'locked' ? (
              <div className="mt-5 w-full">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-text-muted">
                    {streak}/{reward.days} gün
                  </span>
                  <span className="font-semibold" style={{ color: a }}>
                    {reward.days - streak} gün kaldı
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: a }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: [0.34, 1.1, 0.64, 1] }}
                  />
                </div>
                <p className="mt-3 text-xs text-text-muted">Serini sürdür, bu madalyon seni bekliyor.</p>
              </div>
            ) : (
              <motion.button
                type="button"
                disabled={saving}
                onClick={onApply}
                whileTap={{ scale: 0.96 }}
                className="btn-primary relative mt-5 w-full overflow-hidden rounded-2xl py-3.5 font-semibold disabled:opacity-50"
                style={
                  active
                    ? {
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${a}59`,
                        color: a,
                      }
                    : {
                        background: `linear-gradient(135deg, ${a}, ${a}B3)`,
                        color: '#000',
                        boxShadow: `0 8px 28px ${a}4D, inset 0 1px 0 rgba(255,255,255,0.35)`,
                      }
                }
              >
                {/* buton yüzeyinde süzülen parlama */}
                {!active && (
                  <span
                    className="medal-sheen pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                    }}
                  />
                )}
                <span className="relative">
                  {saving
                    ? 'Uygulanıyor...'
                    : active
                      ? '✓ Etkin'
                      : reward.type === 'badge'
                        ? 'Rozeti Tak'
                        : 'Hemen Uygula'}
                </span>
              </motion.button>
            )}

            <button type="button" onClick={onClose} className="btn-chip mt-3 px-4 py-1.5 text-sm text-text-muted">
              Kapat
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
