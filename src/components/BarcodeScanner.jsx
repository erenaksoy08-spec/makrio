import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Barkod tarayıcı — tam ekran kamera + hedef çerçevesi.
// ZXing dinamik yüklenir (bundle şişmez); arka kamera tercih edilir.
export default function BarcodeScanner({ onDetect, onClose }) {
  const videoRef = useRef(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    let controls = null
    let cancelled = false

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const { BarcodeFormat, DecodeHintType } = await import('@zxing/library')
        if (cancelled) return

        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ])
        const reader = new BrowserMultiFormatReader(hints)

        controls = await reader.decodeFromVideoDevice(
          undefined, // varsayılan: environment (arka) kamera
          videoRef.current,
          (result) => {
            if (result && !cancelled) {
              cancelled = true
              navigator.vibrate?.([18, 40, 18])
              controls?.stop()
              onDetect(result.getText())
            }
          },
        )
        if (!cancelled) setStarting(false)
      } catch (e) {
        if (!cancelled) {
          setStarting(false)
          setError(
            e?.name === 'NotAllowedError'
              ? 'Kamera izni gerekli — tarayıcı ayarlarından izin ver.'
              : 'Kamera açılamadı. Cihazında kamera olduğundan emin ol.',
          )
        }
      }
    }
    start()

    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [onDetect])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

      {/* hedef çerçevesi */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-40 w-72 max-w-[80vw]">
          {[
            'left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-lg',
            'right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-lg',
            'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg',
            'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg',
          ].map((pos) => (
            <span key={pos} className={`absolute h-7 w-7 border-white/90 ${pos}`} />
          ))}
          {/* tarama çizgisi */}
          {!error && (
            <motion.span
              className="absolute inset-x-3 h-[2px] rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, #6FCF97, transparent)', boxShadow: '0 0 12px #6FCF97' }}
              animate={{ top: ['12%', '85%', '12%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      </div>

      {/* üst bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-6">
        <span className="rounded-full bg-black/50 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
          Barkodu çerçeveye hizala
        </span>
        <button
          type="button"
          onClick={onClose}
          className="btn-icon flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
          aria-label="Kapat"
        >
          ✕
        </button>
      </div>

      {/* durum */}
      {(starting || error) && (
        <div className="absolute inset-x-0 bottom-16 flex justify-center px-6">
          <span className="rounded-2xl bg-black/60 px-4 py-2.5 text-center text-sm text-white backdrop-blur">
            {error || 'Kamera açılıyor...'}
          </span>
        </div>
      )}
    </motion.div>
  )
}
