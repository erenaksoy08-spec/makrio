import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { t } from '../lib/i18n'

// Apple + Google girişi (giriş ve kayıt ekranları). signInWithOAuth doğrudan
// yönlendirir; sağlayıcı Supabase'de kapalıysa kullanıcı çıplak JSON hata
// sayfasına düşer. Bu yüzden önce authorize ucunu yoklarız (CORS açık):
// 400 dönerse dostça hata gösterilir, yönlendirme (opaqueredirect) ise gidilir.
const PROVIDERS = [
  {
    key: 'apple',
    label: 'Apple ile devam et',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.365 12.789c.024 2.605 2.29 3.472 2.315 3.483-.019.061-.362 1.235-1.193 2.447-.719 1.048-1.465 2.092-2.64 2.114-1.155.021-1.526-.684-2.847-.684-1.32 0-1.732.663-2.825.705-1.134.043-1.997-1.133-2.722-2.177-1.481-2.135-2.613-6.033-1.093-8.664.755-1.307 2.105-2.135 3.57-2.156 1.114-.021 2.166.748 2.847.748.68 0 1.958-.925 3.302-.789.562.023 2.141.227 3.155 1.708-.081.05-1.884 1.098-1.869 3.265M14.19 5.891c.602-.727 1.007-1.739.897-2.746-.868.035-1.917.577-2.539 1.303-.558.643-1.046 1.673-.914 2.66.967.075 1.955-.49 2.556-1.217" />
      </svg>
    ),
  },
  {
    key: 'google',
    label: 'Google ile devam et',
    icon: (
      <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    ),
  },
]

export default function OAuthButtons({ className = '' }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function start(provider) {
    if (busy) return
    setBusy(provider)
    setError('')

    // Yönlendirmeden URL al — önce sağlayıcının açık olduğunu doğrula.
    const { data, error: buildError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin, skipBrowserRedirect: true },
    })
    if (buildError || !data?.url) {
      setBusy('')
      setError(t('Giriş başlatılamadı, tekrar dene.'))
      return
    }

    try {
      const probe = await fetch(data.url, { redirect: 'manual' })
      // Okunabilir 400 = sağlayıcı kapalı; opaqueredirect/302 = akış hazır.
      if (probe.status === 400) {
        setBusy('')
        setError(t('Bu giriş yöntemi henüz aktif değil — e-posta ile devam edebilirsin.'))
        return
      }
    } catch {
      /* ağ/CORS belirsizse normal akışa bırak — sağlayıcı sayfası karar versin */
    }

    window.location.assign(data.url)
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {PROVIDERS.map(({ key, label, icon }) => (
        <motion.button
          key={key}
          type="button"
          onClick={() => start(key)}
          disabled={Boolean(busy)}
          whileTap={{ scale: 0.97 }}
          className="btn-row flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/[0.1] bg-white/[0.04] py-3 text-[15px] font-semibold text-text disabled:opacity-50"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
        >
          {icon}
          {busy === key ? t('Yönlendiriliyor...') : t(label)}
        </motion.button>
      ))}
      {error && <p className="text-center text-xs text-red-400">{error}</p>}
    </div>
  )
}
