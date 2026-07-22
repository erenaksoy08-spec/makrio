import { useEffect, useState } from 'react'

// Aktif temayı <html data-theme> özniteliğinden okur ve değişimlerine tepki verir.
// AuthContext'e bağlı değil — Login/splash gibi oturum öncesi ekranlarda da çalışır.
// AppLayout data-theme'i değiştirdiğinde (kullanıcı tema değiştirince) buradan
// beslenen tüm <Logo>'lar otomatik yeni tema dokusuna geçer.
function readTheme() {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme || 'dark'
}

export default function useCurrentTheme() {
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => setTheme(readTheme()))
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    setTheme(readTheme()) // ilk mount sonrası olası kaçırılan değişim
    return () => obs.disconnect()
  }, [])

  return theme
}
