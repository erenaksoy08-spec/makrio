import { useEffect, useRef, useState } from 'react'

export function useSmoothNumber(target, duration = 350) {
  const [value, setValue] = useState(target)
  const raf = useRef(null)
  const fromRef = useRef(target)
  const startRef = useRef(null)

  useEffect(() => {
    fromRef.current = value
    startRef.current = null
    const from = fromRef.current

    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return value
}
