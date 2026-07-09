import { AnimatePresence, motion } from 'framer-motion'

export default function Sheet({ open, onClose, title, children, variant = 'bottom' }) {
  const center = variant === 'center'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex justify-center ${center ? 'items-center p-4' : 'items-end'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className={`relative max-h-[88svh] w-full max-w-md overflow-y-auto border border-border bg-surface px-5 ${
              center ? 'rounded-3xl py-5' : 'rounded-t-3xl pb-8 pt-3 safe-bottom'
            }`}
            initial={center ? { opacity: 0, scale: 0.94, y: 12 } : { y: '100%' }}
            animate={center ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={center ? { opacity: 0, scale: 0.94, y: 12 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            {!center && <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="btn-icon flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
