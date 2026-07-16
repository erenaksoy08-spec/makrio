import { AnimatePresence, motion, useDragControls } from 'framer-motion'

export default function Sheet({ open, onClose, title, children, variant = 'bottom' }) {
  const center = variant === 'center'
  const dragControls = useDragControls()

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
              center ? 'rounded-3xl py-5' : 'rounded-t-3xl pb-8 pt-2 safe-bottom'
            }`}
            initial={center ? { opacity: 0, scale: 0.94, y: 12 } : { y: '100%' }}
            animate={center ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={center ? { opacity: 0, scale: 0.94, y: 12 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            drag={center ? false : 'y'}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose?.()
            }}
          >
            {/* tutamaç — gerçek sürükleme yüzeyi: aşağı çekince sheet kapanır */}
            {!center && (
              <div
                className="-mx-5 flex h-8 cursor-grab touch-none items-center px-5"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
              </div>
            )}
            <div className={`mb-4 flex items-center justify-between ${center ? '' : 'mt-1'}`}>
              <h2 className="text-lg font-semibold text-text">{title}</h2>
              {/* görsel 32px, dokunma alanı ~48px (after katmanı) */}
              <button
                type="button"
                onClick={onClose}
                className="btn-icon relative flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted after:absolute after:-inset-2 after:content-['']"
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
