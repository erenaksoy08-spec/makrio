import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { t } from '../lib/i18n'

const THRESHOLD = 90
const REVEAL = 96

export default function SwipeableLogRow({ id, onDelete, onTap, children }) {
  const x = useMotionValue(0)
  const bgOpacity = useTransform(x, [0, 40], [0, 1])
  const [armed, setArmed] = useState(false)
  const pressTimer = useRef(null)
  const draggingRef = useRef(false)
  const movedRef = useRef(false)

  function remove() {
    animate(x, 460, { duration: 0.22, ease: 'easeOut', onComplete: () => onDelete(id) })
  }

  function open() {
    setArmed(true)
    animate(x, REVEAL, { type: 'spring', stiffness: 500, damping: 38 })
  }

  function close() {
    setArmed(false)
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 38 })
  }

  function handleDragStart() {
    draggingRef.current = true
    movedRef.current = true
    clearTimeout(pressTimer.current)
  }

  function handleDragEnd(_, info) {
    draggingRef.current = false
    if (info.offset.x > THRESHOLD) remove()
    else close()
  }

  function handlePointerDown() {
    movedRef.current = false
    pressTimer.current = setTimeout(() => {
      if (!draggingRef.current) open()
    }, 450)
  }

  function clearPress() {
    clearTimeout(pressTimer.current)
  }

  function handleContentClick() {
    if (armed) {
      close()
      return
    }
    // Sürükleme ya da uzun basış olduysa dokunma sayma.
    if (movedRef.current) return
    onTap?.()
  }

  return (
    <li className="relative overflow-hidden">
      <button
        type="button"
        onClick={remove}
        aria-label={t('Kaydı sil')}
        className="absolute inset-y-0 left-0 flex w-28 items-center gap-1.5 bg-red-500 pl-4 text-sm font-semibold text-white"
      >
        <motion.span style={{ opacity: bgOpacity }} className="flex items-center gap-1.5">
          ✕ {t('Sil')}
        </motion.span>
      </button>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.55 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={clearPress}
        onPointerLeave={clearPress}
        onClick={handleContentClick}
        style={{ x, filter: 'brightness(1)' }}
        // Düzenlemek için dokununca satır parmağın altında yanıt versin
        whileTap={{ scale: 0.98, filter: 'brightness(1.18)' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative cursor-grab bg-surface py-2.5 active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </li>
  )
}
