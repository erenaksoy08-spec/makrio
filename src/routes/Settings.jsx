import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Sheet from '../components/Sheet'
import { LEGAL_PAGES } from '../lib/legalInfo'
import { getPushState, subscribePush, unsubscribePush } from '../lib/push'
import { purchasesAvailable } from '../lib/purchases'
import Paywall from '../components/Paywall'
import GoldPricing from '../components/GoldPricing'

/* ---------- ikonlar ---------- */

const I = {
  account: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8.2" r="3.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 19.5c.8-3.2 3.6-5 7-5s6.2 1.8 7 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  subscription: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="m4.5 9 3.4 2.6L12 6.5l4.1 5.1L19.5 9l-1.2 8.5H5.7L4.5 9z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  ),
  integrations: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 14v2a3 3 0 0 0 3 3h1M17 10V8a3 3 0 0 0-3-3h-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  permissions: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3.5 5 6v5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-2.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m9.2 11.8 2 2 3.6-3.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M6 16.5v-5a6 6 0 0 1 12 0v5l1.5 2h-15l1.5-2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 20.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  fontSize: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 18 8.5 6h1L14 18M5.8 14h6.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 18l2.6-7h.8l2.6 7M16 15.8h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="m12 4 2.2 4.9 5.3.5-4 3.6 1.2 5.2L12 15.4l-4.7 2.8 1.2-5.2-4-3.6 5.3-.5L12 4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  ),
  journal: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  weight: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 4v4l2.5-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 15c2-3 4 1 6-2s4 1 6-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  ),
}

/* ---------- ortak parçalar ---------- */

function Section({ title, children, footer }) {
  return (
    <div>
      <h2 className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface">{children}</div>
      {footer && <p className="px-1 pt-2 text-xs leading-relaxed text-text-muted">{footer}</p>}
    </div>
  )
}

function Row({ icon, title, desc, onClick, trailing, first }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`${onClick ? 'btn-row' : ''} flex w-full items-center gap-3 px-4 py-3.5 text-left ${
        first ? '' : 'border-t border-border'
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-text-muted">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text">{title}</span>
        {desc && <span className="block truncate text-xs text-text-muted">{desc}</span>}
      </span>
      {trailing ?? (onClick ? <span className="text-text-muted">›</span> : null)}
    </Tag>
  )
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-white/10'}`}
    >
      <motion.span
        className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow"
        animate={{ left: on ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  )
}

/* ---------- Genel: Hesap ---------- */

const GENDER_LABELS = { female: 'Kadın', male: 'Erkek' }

function AccountSheet({ open, onClose }) {
  const { user, profile, refreshProfile } = useAuth()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState(null) // { text, ok }
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(profile?.name ?? '')
    setAge(profile?.age ?? '')
    setHeight(profile?.height_cm ?? '')
    setEmail('')
    setPw('')
    setPw2('')
    setMsg(null)
  }, [open, profile])

  async function saveInfo() {
    setBusy(true)
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() || null, age: Number(age) || null, height_cm: Number(height) || null })
      .eq('id', user.id)
    setBusy(false)
    setMsg(error ? { text: 'Kaydedilemedi — tekrar dene.', ok: false } : { text: 'Bilgilerin güncellendi.', ok: true })
    if (!error) refreshProfile()
  }

  async function changeEmail() {
    if (!email.trim()) return
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ email: email.trim() })
    setBusy(false)
    setMsg(
      error
        ? { text: 'E-posta değiştirilemedi — tekrar dene.', ok: false }
        : { text: 'Doğrulama bağlantısı iki adrese de gönderildi.', ok: true },
    )
  }

  async function changePassword() {
    if (pw.length < 6) return setMsg({ text: 'Şifre en az 6 karakter olmalı.', ok: false })
    if (pw !== pw2) return setMsg({ text: 'Şifreler eşleşmiyor.', ok: false })
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (!error) {
      setPw('')
      setPw2('')
    }
    setMsg(error ? { text: 'Şifre değiştirilemedi — tekrar dene.', ok: false } : { text: 'Şifren güncellendi.', ok: true })
  }

  const inputCls =
    'w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent/60'

  return (
    <Sheet open={open} onClose={onClose} title="Hesap">
      <div className="space-y-5 pb-1">
        {/* kişisel bilgiler */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Kişisel bilgiler</div>
          <label className="block text-xs text-text-muted">
            Ad
            <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 ${inputCls}`} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-text-muted">
              Yaş
              <input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="block text-xs text-text-muted">
              Boy (cm)
              <input
                type="number"
                inputMode="numeric"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className={`mt-1 ${inputCls}`}
              />
            </label>
          </div>
          {profile?.gender && (
            <p className="text-xs text-text-muted">
              Cinsiyet: <span className="text-text">{GENDER_LABELS[profile.gender] ?? profile.gender}</span> — kalori
              hesabının temeli olduğu için buradan değiştirilemez.
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={saveInfo}
            className="btn-chip w-full rounded-xl border border-border py-2.5 text-sm font-medium text-text disabled:opacity-40"
          >
            Bilgileri kaydet
          </button>
        </div>

        {/* e-posta */}
        <div className="space-y-2 border-t border-border pt-4">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">E-posta</div>
          <p className="text-xs text-text-muted">
            Mevcut: <span className="text-text">{user.email}</span>
          </p>
          <input
            type="email"
            placeholder="Yeni e-posta adresi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
          <button
            type="button"
            disabled={busy || !email.trim()}
            onClick={changeEmail}
            className="btn-chip w-full rounded-xl border border-border py-2.5 text-sm font-medium text-text disabled:opacity-40"
          >
            E-postayı değiştir
          </button>
        </div>

        {/* şifre */}
        <div className="space-y-2 border-t border-border pt-4">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Şifre değiştir</div>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Yeni şifre"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className={inputCls}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Yeni şifre (tekrar)"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className={inputCls}
          />
          <button
            type="button"
            disabled={busy || !pw}
            onClick={changePassword}
            className="btn-chip w-full rounded-xl border border-border py-2.5 text-sm font-medium text-text disabled:opacity-40"
          >
            Şifreyi güncelle
          </button>
        </div>

        {msg && (
          <p className={`text-center text-sm ${msg.ok ? 'text-accent' : 'text-red-400'}`}>{msg.text}</p>
        )}
      </div>
    </Sheet>
  )
}

/* ---------- Genel: Abonelik ---------- */

function SubscriptionSheet({ open, onClose }) {
  const { profile } = useAuth()
  const isGold = ['gold', 'active'].includes(profile?.subscription_status)
  const [paywall, setPaywall] = useState(false)

  return (
    <Sheet open={open} onClose={onClose} title="Abonelik">
      <div className="space-y-4 pb-1">
        <div className="rounded-2xl border border-[#E8B84B]/40 bg-gradient-to-br from-[#3a2e12] to-surface p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <span className="font-bold text-[#F5C84B]">Makrio Gold</span>
            <span
              className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isGold ? 'bg-[#F5C84B]/20 text-[#F5C84B]' : 'bg-white/10 text-text-muted'
              }`}
            >
              {isGold ? 'Aktif ✓' : 'Pasif'}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            {isGold
              ? 'Tüm Gold ayrıcalıkların açık: sınırsız kayıt, raporlar, Arkadaş Ligi, mağaza ve reklamsız deneyim.'
              : "Sınırsız kayıt, detaylı raporlar, Arkadaş Ligi ve Tasarım Mağazası için Gold'a geç."}
          </p>
        </div>
        {!isGold && <GoldPricing />}
        {!isGold && purchasesAvailable() && (
          <button
            type="button"
            onClick={() => setPaywall(true)}
            className="btn-primary w-full rounded-xl bg-gradient-to-r from-[#F5C84B] to-[#E0A93B] py-3 font-semibold text-black"
          >
            Gold'a Yükselt
          </button>
        )}
        <p className="text-center text-xs text-text-muted">
          {isGold
            ? 'Abonelik yönetimi (iptal / plan değişikliği) App Store / Play Store abonelik ayarlarından yapılır.'
            : purchasesAvailable()
              ? 'Abonelik App Store / Play Store hesabına bağlanır; istediğin an iptal edebilirsin.'
              : '🚀 Ödeme altyapısı çok yakında aktifleşecek!'}
        </p>
        <Paywall open={paywall} onClose={() => setPaywall(false)} />
      </div>
    </Sheet>
  )
}

/* ---------- Genel: Entegrasyonlar ---------- */

function IntegrationsSheet({ open, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title="Entegrasyonlar">
      <div className="space-y-3 pb-1">
        <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] text-xl">
            ❤️
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-text">Apple Health</div>
            <div className="text-xs text-text-muted">Adım, kilo ve egzersiz verilerini eşitle</div>
          </div>
          <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-text-muted">
            Yakında
          </span>
        </div>
        <p className="text-center text-xs text-text-muted">Yeni entegrasyonlar geldikçe burada listelenecek.</p>
      </div>
    </Sheet>
  )
}

/* ---------- Seçenekler: İzinler ---------- */

const PERM_LABELS = { granted: 'Verildi', denied: 'Reddedildi', prompt: 'Henüz sorulmadı' }

function PermissionsSheet({ open, onClose }) {
  const [cam, setCam] = useState(null)
  const [notif, setNotif] = useState(null)

  useEffect(() => {
    if (!open) return
    if (typeof Notification !== 'undefined')
      setNotif(Notification.permission === 'default' ? 'prompt' : Notification.permission)
    navigator.permissions
      ?.query({ name: 'camera' })
      .then((s) => setCam(s.state))
      .catch(() => setCam(null))
  }, [open])

  const rows = [
    { label: 'Kamera', desc: 'Barkod taramak için kullanılır', state: cam },
    { label: 'Bildirimler', desc: 'Sabah günaydın mesajı için kullanılır', state: notif },
  ]

  return (
    <Sheet open={open} onClose={onClose} title="İzinler">
      <div className="space-y-3 pb-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-2xl border border-border p-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-text">{r.label}</div>
              <div className="text-xs text-text-muted">{r.desc}</div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                r.state === 'granted'
                  ? 'bg-accent/15 text-accent'
                  : r.state === 'denied'
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-white/[0.06] text-text-muted'
              }`}
            >
              {PERM_LABELS[r.state] ?? 'Bilinmiyor'}
            </span>
          </div>
        ))}
        <p className="text-center text-xs leading-relaxed text-text-muted">
          İzinler ilgili özelliği ilk kullandığında sorulur. Reddettiysen tarayıcı/işletim sistemi ayarlarından
          açabilirsin.
        </p>
      </div>
    </Sheet>
  )
}

/* ---------- Seçenekler: Bildirimler ---------- */

function NotificationsSheet({ open, onClose }) {
  const { user } = useAuth()
  const [state, setState] = useState('loading') // loading | unsupported | denied | on | off
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    getPushState().then(setState)
  }, [open])

  async function toggle() {
    setBusy(true)
    setError('')
    try {
      setState(state === 'on' ? await unsubscribePush() : await subscribePush(user.id))
    } catch {
      setError('Ayarlanamadı — internet bağlantını kontrol edip tekrar dene.')
    }
    setBusy(false)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Bildirimler">
      <div className="space-y-4 pb-1">
        <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
          <span className="text-xl">☀️</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-text">Günaydın mesajı</div>
            <div className="text-xs leading-relaxed text-text-muted">
              Her sabah 05.00'te, uygulamadaki selamlama "Günaydın"a dönerken tek bir güne başlama mesajı.
            </div>
          </div>
          {state === 'unsupported' ? (
            <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-text-muted">
              Desteklenmiyor
            </span>
          ) : state === 'denied' ? (
            <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-400">
              İzin kapalı
            </span>
          ) : (
            <span className={busy || state === 'loading' ? 'pointer-events-none opacity-50' : ''}>
              <Toggle on={state === 'on'} label="Günaydın bildirimi" onChange={toggle} />
            </span>
          )}
        </div>

        {state === 'denied' && (
          <p className="text-center text-xs text-text-muted">
            Bildirim izni reddedilmiş — tarayıcı/işletim sistemi ayarlarından Makrio'ya izin verip tekrar dene.
          </p>
        )}
        {error && <p className="text-center text-xs text-red-400">{error}</p>}

        <p className="text-center text-xs text-text-muted">
          Hepsi bu kadar — seni bildirime boğmayacağız. Başka bildirim yok.
        </p>
      </div>
    </Sheet>
  )
}

/* ---------- Veri Yönetimi (sıfırlama) ---------- */

const RESET_CATEGORIES = [
  {
    key: 'gunluk',
    title: 'Günlük Geçmişi',
    desc: 'Yemek, su ve takviye kayıtların',
    icon: I.journal,
    tables: [
      { name: 'food_logs', col: 'date' },
      { name: 'water_logs', col: 'date' },
      { name: 'supplement_logs', col: 'date' },
    ],
  },
  {
    key: 'kilo',
    title: 'Kilo Geçmişi',
    desc: 'Tartı kayıtların ve kilo grafiğin',
    icon: I.weight,
    tables: [{ name: 'weight_logs', col: 'logged_at' }],
  },
  {
    key: 'hedef',
    title: 'Hedef Geçmişi',
    desc: 'Kalori ve makro hedef kayıtların',
    warn: 'Aktif hedefin de seçtiğin aralıktaysa silinir; sonrasında hedefini yeniden ayarlaman gerekir.',
    icon: I.target,
    tables: [{ name: 'user_goals', col: 'updated_at' }],
  },
]

const PERIODS = [
  { key: '1ay', label: 'Son 1 ay', months: 1 },
  { key: '3ay', label: 'Son 3 ay', months: 3 },
  { key: '6ay', label: 'Son 6 ay', months: 6 },
  { key: 'tum', label: 'Tümü', months: null },
]

function cutoffFor(months) {
  if (months == null) return null
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().slice(0, 10)
}

function ResetSheet({ category, onClose, userId }) {
  const [period, setPeriod] = useState(null)
  const [count, setCount] = useState(null)
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const [error, setError] = useState('')

  // Dönem seçilince kaç kaydın etkileneceğini say — kullanıcı körü körüne silmesin.
  useEffect(() => {
    if (!category || !period) return
    setCount(null)
    setArmed(false)
    setError('')
    const cutoff = cutoffFor(period.months)
    Promise.all(
      category.tables.map((t) => {
        let q = supabase.from(t.name).select('id', { count: 'exact', head: true }).eq('user_id', userId)
        if (cutoff) q = q.gte(t.col, cutoff)
        return q
      }),
    ).then((results) => {
      const err = results.find((r) => r.error)
      if (err) setError('Kayıt sayısı alınamadı — tekrar dene.')
      else setCount(results.reduce((sum, r) => sum + (r.count ?? 0), 0))
    })
  }, [category, period, userId])

  async function handleDelete() {
    if (!armed) {
      setArmed(true)
      return
    }
    setBusy(true)
    setError('')
    const cutoff = cutoffFor(period.months)
    const results = await Promise.all(
      category.tables.map((t) => {
        let q = supabase.from(t.name).delete().eq('user_id', userId)
        if (cutoff) q = q.gte(t.col, cutoff)
        return q
      }),
    )
    setBusy(false)
    if (results.some((r) => r.error)) {
      setError('Silme tamamlanamadı — internet bağlantını kontrol edip tekrar dene.')
      setArmed(false)
      return
    }
    setDone(count)
  }

  function close() {
    setPeriod(null)
    setCount(null)
    setArmed(false)
    setDone(null)
    setError('')
    onClose()
  }

  return (
    <Sheet open={!!category} onClose={close} title={category?.title ?? ''}>
      {category &&
        (done != null ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-xl text-accent">
              ✓
            </div>
            <p className="mt-3 font-medium text-text">{done} kayıt silindi</p>
            <p className="mt-1 text-sm text-text-muted">Bu işlem geri alınamaz; yeni kayıtların etkilenmez.</p>
            <button
              type="button"
              onClick={close}
              className="btn-chip mt-5 w-full rounded-xl border border-border py-3 font-medium text-text"
            >
              Tamam
            </button>
          </div>
        ) : (
          <div className="space-y-4 pb-1">
            <p className="text-sm text-text-muted">
              Hangi aralıktaki kayıtlar silinsin? Bu işlem{' '}
              <span className="font-semibold text-text">geri alınamaz</span>.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`btn-chip rounded-xl border py-3 text-sm font-medium ${
                    period?.key === p.key
                      ? 'border-red-400/60 bg-red-500/10 text-red-400'
                      : 'border-border text-text-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {category.warn && period && (
              <p className="rounded-xl border border-border bg-bg px-3 py-2.5 text-xs leading-relaxed text-text-muted">
                {category.warn}
              </p>
            )}

            {period && (
              <div className="rounded-xl border border-border bg-bg px-4 py-3 text-center text-sm tabular-nums text-text-muted">
                {count == null && !error ? (
                  'Kayıtlar sayılıyor…'
                ) : error ? (
                  <span className="text-red-400">{error}</span>
                ) : count === 0 ? (
                  'Bu aralıkta silinecek kayıt yok.'
                ) : (
                  <>
                    <span className="font-semibold text-text">{count} kayıt</span> kalıcı olarak silinecek
                  </>
                )}
              </div>
            )}

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              disabled={!period || busy || count == null || count === 0}
              onClick={handleDelete}
              className={`w-full rounded-xl py-3 font-semibold transition-colors disabled:opacity-40 ${
                armed ? 'bg-red-500 text-white' : 'border border-red-500/40 bg-red-500/10 text-red-400'
              }`}
            >
              {busy ? 'Siliniyor…' : armed ? 'Eminim — kalıcı olarak sil' : 'Sil'}
            </motion.button>
            {armed && !busy && (
              <p className="text-center text-xs text-text-muted">Onaylamak için tekrar dokun. Vazgeçmek için kapat.</p>
            )}
          </div>
        ))}
    </Sheet>
  )
}

/* ---------- sayfa ---------- */

const FONT_SIZES = [
  { key: 'kucuk', label: 'Küçük' },
  { key: 'normal', label: 'Normal' },
  { key: 'buyuk', label: 'Büyük' },
]

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const [sheet, setSheet] = useState(null) // 'hesap' | 'abonelik' | 'entegrasyon' | 'izinler' | 'bildirimler'
  const [resetCategory, setResetCategory] = useState(null)

  const prefs = profile?.preferences ?? {}
  const fontScale = prefs.fontScale ?? 'normal'
  const progressOff = prefs.progressTab === 'off'
  const isGold = ['gold', 'active'].includes(profile?.subscription_status)

  async function savePref(patch) {
    await supabase.rpc('update_preferences', { p_preferences: { ...prefs, ...patch } })
    refreshProfile()
  }

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          to="/profil"
          aria-label="Profile dön"
          className="btn-icon flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted"
        >
          ‹
        </Link>
        <h1 className="text-2xl font-semibold text-text">Ayarlar</h1>
      </div>

      <Section title="Genel">
        <Row first icon={I.account} title="Hesap" desc="Kişisel bilgiler, e-posta, şifre" onClick={() => setSheet('hesap')} />
        <Row
          icon={I.subscription}
          title="Abonelik"
          desc={isGold ? 'Makrio Gold — aktif' : 'Makrio Gold'}
          onClick={() => setSheet('abonelik')}
        />
        <Row icon={I.integrations} title="Entegrasyonlar" desc="Apple Health yakında" onClick={() => setSheet('entegrasyon')} />
      </Section>

      <Section title="Seçenekler">
        <Row first icon={I.permissions} title="İzinler" desc="Kamera ve bildirim izinleri" onClick={() => setSheet('izinler')} />
        <Row icon={I.bell} title="Bildirimler" desc="Sadece günaydın mesajı" onClick={() => setSheet('bildirimler')} />
        <div className="flex items-center gap-3 border-t border-border px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-text-muted">
            {I.fontSize}
          </span>
          <span className="min-w-0 flex-1 text-sm font-medium text-text">Yazı Büyüklüğü</span>
          <div className="flex gap-1 rounded-full border border-border p-0.5">
            {FONT_SIZES.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => savePref({ fontScale: f.key })}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  fontScale === f.key ? 'bg-accent text-black' : 'text-text-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <Row
          icon={I.star}
          title="İlerleme Sayfası"
          desc={progressOff ? 'Kapalı — yalnızca takibe odaklan' : 'Açık — seri, görevler ve ödüller'}
          trailing={
            <Toggle
              on={!progressOff}
              label="İlerleme sayfasını aç/kapat"
              onChange={() => savePref({ progressTab: progressOff ? 'on' : 'off' })}
            />
          }
        />
      </Section>

      <Section
        title="Veri Yönetimi"
        footer="Silme işlemleri yalnızca senin hesabındaki kayıtları etkiler ve geri alınamaz."
      >
        {RESET_CATEGORIES.map((c, i) => (
          <Row
            key={c.key}
            first={i === 0}
            icon={c.icon}
            title={c.title}
            desc={c.desc}
            onClick={() => setResetCategory(c)}
          />
        ))}
      </Section>

      <Section title="Diğer">
        {Object.entries(LEGAL_PAGES).map(([slug, page], i) => (
          <Link
            key={slug}
            to={`/yasal/${slug}`}
            className={`btn-row flex items-center justify-between px-4 py-3.5 text-sm text-text-muted ${
              i > 0 ? 'border-t border-border' : ''
            }`}
          >
            {page.title}
            <span>›</span>
          </Link>
        ))}
      </Section>

      <AccountSheet open={sheet === 'hesap'} onClose={() => setSheet(null)} />
      <SubscriptionSheet open={sheet === 'abonelik'} onClose={() => setSheet(null)} />
      <IntegrationsSheet open={sheet === 'entegrasyon'} onClose={() => setSheet(null)} />
      <PermissionsSheet open={sheet === 'izinler'} onClose={() => setSheet(null)} />
      <NotificationsSheet open={sheet === 'bildirimler'} onClose={() => setSheet(null)} />
      <ResetSheet category={resetCategory} onClose={() => setResetCategory(null)} userId={user.id} />
    </div>
  )
}
