import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { uploadAvatar, removeAvatar } from '../lib/avatar'
import { t } from '../lib/i18n'
import Avatar from './Avatar'

// Profil fotoğrafı seçici. Fotoğraf yoksa dokununca doğrudan galeri açılır;
// varsa küçük bir menü (değiştir / kaldır) çıkar — iki rozetle daire kalabalık olmasın.

function CameraBadge({ busy }) {
  return (
    <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-accent text-black">
      {busy ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          className="block h-3 w-3 rounded-full border-2 border-black/25 border-t-black"
        />
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.1-2h8.4l1.1 2h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.9" />
        </svg>
      )}
    </span>
  )
}

export default function AvatarPicker({ size = 64 }) {
  const { user, profile, refreshProfile } = useAuth()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [menu, setMenu] = useState(false)
  const [error, setError] = useState('')
  const hasPhoto = Boolean(profile?.avatar_url)

  async function run(job) {
    setBusy(true)
    setError('')
    setMenu(false)
    try {
      await job()
      await refreshProfile()
    } catch (err) {
      setError(err?.message === 'too_large' ? t('Fotoğraf çok büyük (en fazla 12 MB).') : t('Fotoğraf yüklenemedi, tekrar dene.'))
    }
    setBusy(false)
  }

  function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // aynı dosya tekrar seçilebilsin
    if (file) run(() => uploadAvatar(user.id, file))
  }

  return (
    <div className="relative shrink-0">
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        disabled={busy}
        onClick={() => (hasPhoto ? setMenu((m) => !m) : inputRef.current?.click())}
        aria-label={hasPhoto ? t('Profil fotoğrafını değiştir') : t('Profil fotoğrafı ekle')}
        className="btn-icon relative block rounded-full"
      >
        <Avatar
          url={profile?.avatar_url}
          name={profile?.name || user?.email}
          size={size}
          color={profile?.preferences?.nameColor}
          className={busy ? 'opacity-50' : ''}
        />
        <CameraBadge busy={busy} />
      </motion.button>

      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-20 mt-2 w-36 overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-xl"
          >
            <button
              type="button"
              onClick={() => {
                setMenu(false)
                inputRef.current?.click()
              }}
              className="block w-full px-3.5 py-2.5 text-left text-[13px] text-text"
            >
              {t('Değiştir')}
            </button>
            <button
              type="button"
              onClick={() => run(() => removeAvatar(user.id))}
              className="block w-full border-t border-white/[0.06] px-3.5 py-2.5 text-left text-[13px] text-[#EF4444]"
            >
              {t('Kaldır')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="absolute left-0 top-full mt-1 w-44 text-[11px] leading-tight text-[#EF4444]">{error}</p>}
    </div>
  )
}
