import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [mode, setMode] = useState('request')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('update')
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  async function handleRequest(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sifre-sifirla`,
    })

    setLoading(false)
    if (resetError) {
      setError('Bir hata oluştu, tekrar dene.')
      return
    }
    setInfo('Şifre sıfırlama bağlantısı e-postana gönderildi.')
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalı.')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (updateError) {
      setError('Şifre güncellenemedi, tekrar dene.')
      return
    }
    setInfo('Şifren güncellendi. Şimdi giriş yapabilirsin.')
  }

  if (mode === 'update') {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <form onSubmit={handleUpdate} className="w-full max-w-sm space-y-4">
          <h1 className="mb-2 text-2xl font-medium text-text">Yeni Şifre Belirle</h1>

          <div className="space-y-1">
            <label htmlFor="newPassword" className="text-sm text-text-muted">
              Yeni şifre
            </label>
            <input
              id="newPassword"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="newPasswordConfirm" className="text-sm text-text-muted">
              Yeni şifre (tekrar)
            </label>
            <input
              id="newPasswordConfirm"
              type="password"
              required
              autoComplete="new-password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {info && <p className="text-sm text-accent">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-lg bg-accent px-3 py-2 font-medium text-black disabled:opacity-50"
          >
            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>

          <div className="text-sm">
            <Link to="/giris" className="text-text-muted hover:text-accent">
              Girişe dön
            </Link>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <form onSubmit={handleRequest} className="w-full max-w-sm space-y-4">
        <h1 className="mb-2 text-2xl font-medium text-text">Şifre Sıfırla</h1>
        <p className="text-sm text-text-muted">E-posta adresine bir sıfırlama bağlantısı göndereceğiz.</p>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-text-muted">
            E-posta
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-accent">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full rounded-lg bg-accent px-3 py-2 font-medium text-black disabled:opacity-50"
        >
          {loading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
        </button>

        <div className="text-sm">
          <Link to="/giris" className="text-text-muted hover:text-accent">
            Girişe dön
          </Link>
        </div>
      </form>
    </div>
  )
}
