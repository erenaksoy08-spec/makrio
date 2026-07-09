import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message === 'User already registered' ? 'Bu e-posta zaten kayıtlı.' : 'Kayıt sırasında bir hata oluştu.')
      return
    }

    if (!data.session) {
      setInfo('Hesabını onaylamak için e-postanı kontrol et.')
      return
    }

    navigate('/onboarding')
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="mb-2 text-2xl font-medium text-text">Kayıt Ol</h1>

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

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-text-muted">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="passwordConfirm" className="text-sm text-text-muted">
            Şifre (tekrar)
          </label>
          <input
            id="passwordConfirm"
            type="password"
            required
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
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
          {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
        </button>

        <div className="text-sm">
          <Link to="/giris" className="text-text-muted hover:text-accent">
            Zaten hesabın var mı? Giriş yap
          </Link>
        </div>
      </form>
    </div>
  )
}
