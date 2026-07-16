import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

function BrandMark() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <defs>
        <linearGradient id="mkr-ring" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#FF8A5B" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <circle cx="36" cy="36" r="29" fill="none" stroke="var(--color-track)" strokeWidth="8" />
      <motion.circle
        cx="36"
        cy="36"
        r="29"
        fill="none"
        stroke="url(#mkr-ring)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={2 * Math.PI * 29}
        transform="rotate(-90 36 36)"
        initial={{ strokeDashoffset: 2 * Math.PI * 29 }}
        animate={{ strokeDashoffset: 2 * Math.PI * 29 * 0.22 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.34, 1.1, 0.64, 1] }}
      />
      <text x="36" y="43" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--color-text)">
        M
      </text>
    </svg>
  )
}

function Field({ id, type, label, autoComplete, value, onChange, icon }) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 rounded-2xl border border-border bg-white/[0.03] px-4 transition-colors focus-within:border-accent/60"
    >
      <span className="shrink-0 text-text-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="mt-2 block text-[11px] uppercase tracking-wide text-text-muted">{label}</span>
        <input
          id={id}
          type={type}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className="mb-2 w-full bg-transparent text-base text-text outline-none"
        />
      </span>
    </label>
  )
}

const MailIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.7" />
    <path d="m4.5 7.5 7.5 5.5 7.5-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LockIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="12" cy="15.2" r="1.3" fill="currentColor" />
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (signInError) {
      // Ağ hatasını kimlik hatası gibi etiketleme — kullanıcı şifresinden şüphelenmesin.
      setError(
        signInError.message?.includes('Invalid login credentials')
          ? 'E-posta veya şifre hatalı.'
          : 'Bağlanılamadı — internet bağlantını kontrol edip tekrar dene.',
      )
      return
    }
    navigate('/')
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4">
      {/* ambiyans — yumuşak renk küreleri */}
      <div
        className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.10), transparent 65%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-36 -right-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(61,165,255,0.16), transparent 65%)' }}
      />
      <div
        className="pointer-events-none absolute top-1/3 right-0 h-64 w-64 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.10), transparent 65%)' }}
      />

      <div className="relative w-full max-w-sm">
        {/* marka */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <BrandMark />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-text">Makrio</h1>
          <p className="mt-1 text-sm text-text-muted">Kalori ve makro takibinin akıllı hali</p>
        </motion.div>

        {/* kart */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3 rounded-3xl border border-white/10 bg-surface/80 p-5 backdrop-blur"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}
        >
          <Field
            id="email"
            type="email"
            label="E-posta"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={MailIcon}
          />
          <Field
            id="password"
            type="password"
            label="Şifre"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={LockIcon}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full rounded-2xl bg-white py-3.5 font-semibold text-black disabled:opacity-50"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.12)' }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </motion.button>

          <div className="pt-1 text-center">
            <Link to="/sifre-sifirla" className="text-xs text-text-muted hover:text-accent">
              Şifremi unuttum
            </Link>
          </div>
        </motion.form>

        {/* yeni kullanıcı */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="mt-6 text-center text-sm text-text-muted"
        >
          Makrio&apos;da yeni misin?{' '}
          <Link to="/hosgeldin" className="font-semibold text-accent">
            Hemen başla →
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
