import { AnimatePresence, motion } from 'framer-motion'

// Yüksek tempo uyarısı — kilo verme hızı 1 kg/hafta ve üzerine çıkınca
// hız kaydırıcısının altında yumuşakça belirir. Sessiz ve net: ince altın
// çizgi, tek cümlelik uyarı, panik rengi yok.
const AMBER = '#D9A048'

// Güvenli taban notu — hız kaydırıcısı kalori tabanına dayandığında görünür.
// PaceWarning ile aynı görsel dil; ton bilgilendirici, uyarıcı değil.
export function SafeFloorNote({ show, floor }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="overflow-hidden"
        >
          <p className="mt-2.5 flex items-start gap-2 text-[11.5px] leading-relaxed text-text-muted">
            <span
              className="mt-0.5 w-[2px] shrink-0 self-stretch rounded-full"
              style={{ background: `linear-gradient(180deg, ${AMBER}, color-mix(in srgb, ${AMBER} 25%, transparent))` }}
            />
            <span>
              Hız burada sınırlandı: günlük hedefin güvenli taban olan{' '}
              <span className="font-semibold" style={{ color: `color-mix(in srgb, ${AMBER} 70%, var(--color-text))` }}>
                {floor} kcal
              </span>
              &apos;nin altına inmemesi için.
            </span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function PaceWarning({ show }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="overflow-hidden"
        >
          <div
            className="mt-3 flex gap-3 rounded-xl px-3.5 py-3"
            style={{
              border: `1px solid color-mix(in srgb, ${AMBER} 26%, transparent)`,
              background: `linear-gradient(135deg, color-mix(in srgb, ${AMBER} 9%, transparent), color-mix(in srgb, ${AMBER} 3%, transparent))`,
            }}
          >
            <span
              className="mt-0.5 w-[2px] shrink-0 self-stretch rounded-full"
              style={{ background: `linear-gradient(180deg, ${AMBER}, color-mix(in srgb, ${AMBER} 25%, transparent))` }}
            />
            <div className="min-w-0">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: AMBER }}
              >
                Yüksek Tempo
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-text-muted">
                1 kg/hafta ve üzeri uzun vadede sürdürülebilir değildir. Bu tempoyu{' '}
                <span className="font-semibold" style={{ color: `color-mix(in srgb, ${AMBER} 70%, var(--color-text))` }}>
                  2–6 haftalık
                </span>{' '}
                bir blokla sınırlı tut, sonra yavaşla.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
