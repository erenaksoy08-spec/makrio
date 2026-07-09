import { AnimatePresence, motion } from 'framer-motion'
import WaterGlass, { WaterBottle } from './WaterGlass'
import SmileyWater, { DropletBuddy } from './SmileyWater'
import usePixelTheme from '../hooks/usePixelTheme'
import { useAuth } from '../contexts/AuthContext'
import { GLASS_ML, BOTTLE_ML, waterLimit } from '../lib/water'

const WATER_BLUE = '#29B6F6'
const SHAKER_ML = 1500

export default function WaterTracker({ consumed_ml, goal_ml, weightKg, onAdd, onUndo, canUndo, realistic = false }) {
  const pixel = usePixelTheme()
  const { profile } = useAuth()
  const gym = profile?.preferences?.theme === 'gym'
  const smiley = profile?.preferences?.waterStyle === 'smiley'

  // Gym teması: her kap 1,5 L matara → hedef 1,5 L'ye bölünür.
  // Diğer temalar: ~250 ml'lik bardaklar (sayı hedefe göre değişir).
  const numGlasses = gym
    ? Math.min(10, Math.max(1, Math.ceil(goal_ml / SHAKER_ML)))
    : Math.min(16, Math.max(4, Math.round(goal_ml / GLASS_ML))) || 8
  const glassSize = gym ? SHAKER_ML : Math.round(goal_ml / numGlasses) || GLASS_ML
  const unitLabel = gym ? 'matara' : 'bardak'
  const inGoal = Math.min(consumed_ml, goal_ml)
  // Son kabın kapasitesi hedefin kalanı kadar (böylece hedefte tam dolu görünür).
  const unitFraction = (i) => {
    const cap = Math.min(glassSize, goal_ml - i * glassSize)
    return cap > 0 ? Math.max(0, Math.min(1, (inGoal - i * glassSize) / cap)) : 0
  }
  // Hedefe ulaşınca tüm kaplar dolu sayılır (yuvarlama artığı sayacı takmasın).
  const glassesConsumed = inGoal >= goal_ml ? numGlasses : Math.min(numGlasses, Math.floor(inGoal / glassSize))

  // Hedef üstü: bardak eklemek yerine litrelik şişeler dolar.
  const overflow = Math.max(0, consumed_ml - goal_ml)
  const bottleCount = overflow > 0 ? Math.min(7, Math.ceil(overflow / BOTTLE_ML)) : 0

  const limit = waterLimit(weightKg)
  const overLimit = limit != null && consumed_ml > limit

  return (
    <div className="space-y-5 rounded-3xl border border-white/[0.06] bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-lg text-text-muted">Su</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="btn-icon flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-muted disabled:opacity-40"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onAdd(glassSize)}
            className="btn-icon flex h-10 w-10 items-center justify-center rounded-full text-black"
            style={{ backgroundColor: WATER_BLUE }}
          >
            +
          </button>
        </div>
      </div>

      <div>
        <div className="text-4xl font-bold tabular-nums text-text">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={smiley ? Math.min(100, Math.round((consumed_ml / goal_ml) * 100)) : glassesConsumed}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.2 }}
              style={{ display: 'inline-block' }}
            >
              {smiley ? `%${Math.min(100, Math.round((consumed_ml / goal_ml) * 100))}` : glassesConsumed}
            </motion.span>
          </AnimatePresence>{' '}
          <span className="text-lg font-normal text-text-muted">
            {smiley
              ? overLimit
                ? 'bugünlük yeter 💙'
                : consumed_ml >= goal_ml
                  ? 'hedef doldu! 🎉'
                  : 'hedef'
              : `/ ${numGlasses} ${unitLabel}`}
          </span>
        </div>
        <div className="text-sm tabular-nums text-text-muted">
          {inGoal} / {goal_ml} ml
          {overflow > 0 && (
            <span className="font-medium" style={{ color: WATER_BLUE }}>
              {' '}
              · hedef üstü +{(overflow / 1000).toFixed(1).replace('.', ',')} L
            </span>
          )}
        </div>
      </div>

      {smiley ? (
        <div className="flex flex-col items-center gap-1">
          <SmileyWater
            fraction={consumed_ml / goal_ml}
            mood={overLimit ? 'sad' : consumed_ml >= goal_ml ? 'full' : 'happy'}
            realistic={realistic}
          />
          {/* hedef üstü — her ekstra litrede bir damla arkadaş katılır */}
          {bottleCount > 0 && (
            <div className="flex items-end gap-1.5 pt-1">
              {Array.from({ length: bottleCount }).map((_, i) => (
                <DropletBuddy
                  key={i}
                  index={i}
                  fraction={Math.max(0, Math.min(1, (overflow - i * BOTTLE_ML) / BOTTLE_ML))}
                />
              ))}
            </div>
          )}
        </div>
      ) : gym ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: numGlasses }).map((_, i) => (
            <div key={i} className="w-11">
              <WaterGlass index={i} fraction={unitFraction(i)} realistic={realistic} pixel={pixel} gym={gym} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: numGlasses }).map((_, i) => (
            <WaterGlass key={i} index={i} fraction={unitFraction(i)} realistic={realistic} pixel={pixel} gym={gym} />
          ))}
        </div>
      )}

      {/* hedef üstü — litrelik şişeler (Su Dostu kendi damlalarını gösterir) */}
      {!smiley && bottleCount > 0 && (
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: bottleCount }).map((_, i) => {
            const fraction = Math.max(0, Math.min(1, (overflow - i * BOTTLE_ML) / BOTTLE_ML))
            return <WaterBottle key={i} index={i} fraction={fraction} pixel={pixel} realistic={realistic} />
          })}
        </div>
      )}

      {/* güvenli sınır uyarısı */}
      <AnimatePresence>
        {overLimit && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="relative overflow-hidden rounded-2xl border border-[#F2994A]/25 p-4"
            style={{
              background:
                'linear-gradient(135deg, rgba(242,153,74,0.13), rgba(239,68,68,0.06) 55%, transparent)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* sol kenar vurgusu */}
            <span
              className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
              style={{ background: 'linear-gradient(180deg, #F2C94C, #F2994A 55%, #EF4444)' }}
            />

            <div className="flex items-start gap-3">
              {/* damla + ünlem rozeti */}
              <motion.span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, rgba(242,153,74,0.35), rgba(242,153,74,0.12))',
                  border: '1px solid rgba(242,153,74,0.4)',
                }}
                animate={{ boxShadow: ['0 0 0px rgba(242,153,74,0)', '0 0 14px rgba(242,153,74,0.35)', '0 0 0px rgba(242,153,74,0)'] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3c3.5 4.2 6 7.4 6 10.4a6 6 0 1 1-12 0C6 10.4 8.5 7.2 12 3z"
                    fill="#F2994A"
                  />
                  <path d="M12 9.2v4.4" stroke="#1B1206" strokeWidth="1.9" strokeLinecap="round" />
                  <circle cx="12" cy="16.6" r="1.1" fill="#1B1206" />
                </svg>
              </motion.span>

              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-text">Güvenli su sınırını aştın</div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Bugün{' '}
                  <span className="font-semibold tabular-nums text-text">
                    {(consumed_ml / 1000).toFixed(1).replace('.', ',')} L
                  </span>{' '}
                  içtin — kilona göre önerilen üst sınır{' '}
                  <span className="font-semibold tabular-nums" style={{ color: '#F2994A' }}>
                    {(limit / 1000).toFixed(1).replace('.', ',')} L
                  </span>
                  . Fazlası sodyum dengeni bozabilir; bugünlük yavaşlamak iyi olur.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* quick-add — farklı miktarları tek dokunuşla ekle */}
      <div className="flex gap-2">
        {[200, 250, 330, 500].map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => onAdd(ml)}
            className="btn-chip flex-1 rounded-xl border border-border py-2 text-center text-xs font-medium tabular-nums text-text-muted"
            style={{ borderColor: 'rgba(41,182,246,0.25)' }}
          >
            <span style={{ color: WATER_BLUE }}>+</span>{ml}
            <span className="text-text-muted"> ml</span>
          </button>
        ))}
      </div>
    </div>
  )
}
