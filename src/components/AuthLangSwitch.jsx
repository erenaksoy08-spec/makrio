import { getLocale, setLocale } from '../lib/i18n'

// Hesap öncesi ekranlarda (giriş / kayıt) dil seçici. Profil yok, bu yüzden
// yalnızca localStorage'a yazıp sayfayı yeniler — AuthContext boş dili ezmez,
// seçim giriş sonrasında da korunur. Etiketler dil-nötr kod (TR/EN), bu yüzden
// çeviriye gerek yok: yabancı kullanıcı "EN" ibaresini doğrudan anlar.
const LANGS = [
  { key: 'tr', label: 'TR', name: 'Türkçe' },
  { key: 'en', label: 'EN', name: 'English' },
]

const GlobeIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

export default function AuthLangSwitch({ className = '' }) {
  const current = getLocale()

  function pick(lang) {
    if (setLocale(lang)) window.location.reload()
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-border bg-white/[0.03] py-0.5 pl-2 pr-0.5 ${className}`}
    >
      <span className="text-text-muted">{GlobeIcon}</span>
      <div className="flex gap-0.5">
        {LANGS.map(({ key, label, name }) => {
          const active = current === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              aria-label={name}
              aria-pressed={active}
              className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
                active ? 'bg-white text-black' : 'text-text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
