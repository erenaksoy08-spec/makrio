import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { t } from '../lib/i18n'

// Barkod tarayıcı — hız öncelikli:
//  * Destekleyen cihazlarda native BarcodeDetector (donanım hızında, anında okur)
//  * Yoksa ZXing (TRY_HARDER + 60ms deneme aralığı)
//  * 1080p arka kamera + sürekli odak — bulanık/kalitesiz görüntü sorunu biter.
// Vizör: çevresi karartılmış pencere, zarif köşe braketleri, nefes alan çerçeve.
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']

const VIDEO_CONSTRAINTS = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
}

export default function BarcodeScanner({ onDetect, onClose }) {
  const videoRef = useRef(null)
  const torchRef = useRef(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  useEffect(() => {
    let stopped = false
    let stream = null
    let zxingControls = null
    let timer = null

    const cleanup = () => {
      clearInterval(timer)
      try {
        zxingControls?.stop()
      } catch {
        /* zaten durmuş */
      }
      stream?.getTracks().forEach((t) => t.stop())
    }

    const finish = (text) => {
      if (stopped || !text) return
      stopped = true
      cleanup()
      navigator.vibrate?.([16, 30, 16])
      onDetect(text)
    }

    async function start() {
      try {
        // 1) Native BarcodeDetector — Android Chrome'da donanım hızında.
        if ('BarcodeDetector' in window) {
          try {
            const supported = await window.BarcodeDetector.getSupportedFormats()
            const fmts = FORMATS.filter((f) => supported.includes(f))
            if (fmts.length > 0) {
              stream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS, audio: false })
              if (stopped) return cleanup()
              const video = videoRef.current
              video.srcObject = stream
              await video.play()
              setReady(true)

              const track = stream.getVideoTracks()[0]
              try {
                await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] })
              } catch {
                /* odak desteği yoksa sorun değil */
              }
              const caps = track.getCapabilities?.()
              if (caps?.torch) {
                setTorchAvailable(true)
                torchRef.current = (on) => track.applyConstraints({ advanced: [{ torch: on }] })
              }

              const detector = new window.BarcodeDetector({ formats: fmts })
              timer = setInterval(async () => {
                if (stopped || !video || video.readyState < 2) return
                try {
                  const codes = await detector.detect(video)
                  if (codes?.[0]?.rawValue) finish(codes[0].rawValue)
                } catch {
                  /* tek kare hatası — sıradaki karede devam */
                }
              }, 70)
              return
            }
          } catch {
            /* native yol başarısız — ZXing'e düş */
          }
        }

        // 2) ZXing fallback — iOS Safari ve diğerleri.
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const { BarcodeFormat, DecodeHintType } = await import('@zxing/library')
        if (stopped) return

        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ])
        hints.set(DecodeHintType.TRY_HARDER, true)
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 60 })

        zxingControls = await reader.decodeFromConstraints(
          { video: VIDEO_CONSTRAINTS, audio: false },
          videoRef.current,
          (result) => {
            if (result) finish(result.getText())
          },
        )
        if (stopped) return cleanup()
        setReady(true)
        if (typeof zxingControls?.switchTorch === 'function') {
          setTorchAvailable(true)
          torchRef.current = (on) => zxingControls.switchTorch(on)
        }
      } catch (e) {
        if (!stopped) {
          setError(
            e?.name === 'NotAllowedError'
              ? t('Kamera izni gerekli — tarayıcı ayarlarından izin ver.')
              : t('Kamera açılamadı. Cihazında kamera olduğundan emin ol.'),
          )
        }
      }
    }
    start()

    return () => {
      stopped = true
      cleanup()
    }
  }, [onDetect])

  async function toggleTorch() {
    try {
      await torchRef.current?.(!torchOn)
      setTorchOn((v) => !v)
    } catch {
      /* desteklenmiyorsa sessizce geç */
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

      {/* vizör penceresi — çevresi karartılır, içi berrak kalır */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative h-[180px] w-[320px] max-w-[82vw] rounded-2xl"
          style={{ boxShadow: '0 0 0 200vmax rgba(4,6,10,0.62)' }}
          animate={{ scale: ready ? 1 : 0.97 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* nefes alan ince çerçeve */}
          <motion.span
            className="absolute inset-0 rounded-2xl"
            animate={{ borderColor: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.18)'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ border: '1.5px solid rgba(255,255,255,0.3)' }}
          />
          {/* köşe braketleri */}
          {[
            '-left-[3px] -top-[3px] border-l-[3.5px] border-t-[3.5px] rounded-tl-[18px]',
            '-right-[3px] -top-[3px] border-r-[3.5px] border-t-[3.5px] rounded-tr-[18px]',
            '-bottom-[3px] -left-[3px] border-b-[3.5px] border-l-[3.5px] rounded-bl-[18px]',
            '-bottom-[3px] -right-[3px] border-b-[3.5px] border-r-[3.5px] rounded-br-[18px]',
          ].map((pos) => (
            <span key={pos} className={`absolute h-9 w-9 border-white ${pos}`} style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }} />
          ))}
        </motion.div>
      </div>

      {/* üst bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 pt-7">
        <button
          type="button"
          onClick={onClose}
          className="btn-icon flex h-10 w-10 items-center justify-center rounded-full text-white"
          style={{ background: 'rgba(10,12,16,0.55)', backdropFilter: 'blur(12px)' }}
          aria-label={t('Kapat')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
        <span
          className="rounded-full px-4 py-2 text-[13px] font-semibold text-white"
          style={{ background: 'rgba(10,12,16,0.55)', backdropFilter: 'blur(12px)' }}
        >
          {t('Barkod Tara')}
        </span>
        {torchAvailable ? (
          <button
            type="button"
            onClick={toggleTorch}
            className="btn-icon flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: torchOn ? '#F2C94C' : 'rgba(10,12,16,0.55)',
              color: torchOn ? '#1b1206' : '#fff',
              backdropFilter: 'blur(12px)',
            }}
            aria-label={t('Fener')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M13 2 5 13h5l-1 9 8-11h-5l1-9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill={torchOn ? 'currentColor' : 'none'} />
            </svg>
          </button>
        ) : (
          <span className="h-10 w-10" />
        )}
      </div>

      {/* alt yönerge */}
      <div className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-2 px-6">
        <span
          className="rounded-full px-4 py-2 text-center text-[13px] text-white/85"
          style={{ background: 'rgba(10,12,16,0.55)', backdropFilter: 'blur(12px)' }}
        >
          {error || (ready ? t('Barkodu pencereye getir — otomatik okunur') : t('Kamera açılıyor...'))}
        </span>
      </div>
    </motion.div>
  )
}
