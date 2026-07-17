import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.jsx'

// Service worker yalnız web/PWA'da: native kabukta (iOS/Android) dosyalar
// zaten cihazda gömülü — SW araya girerse güncellemeler eski önbelleğe takılır.
if (!Capacitor.isNativePlatform()) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
