import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Sheet from '../components/Sheet'

// Her kategori bir/birkaç tabloyu ve tarih kolonunu kapsar.
const CATEGORIES = [
  {
    key: 'gunluk',
    title: 'Günlük Geçmişi',
    desc: 'Yemek, su ve takviye kayıtların',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
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
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 4v4l2.5-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 15c2-3 4 1 6-2s4 1 6-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    tables: [{ name: 'weight_logs', col: 'logged_at' }],
  },
  {
    key: 'hedef',
    title: 'Hedef Geçmişi',
    desc: 'Kalori ve makro hedef kayıtların',
    warn: 'Aktif hedefin de seçtiğin aralıktaysa silinir; sonrasında hedefini yeniden ayarlaman gerekir.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      </svg>
    ),
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
  return d.toISOString().slice(0, 10) // date kolonlarıyla da timestamptz ile de karşılaştırılabilir
}

function ResetSheet({ category, onClose, userId }) {
  const [period, setPeriod] = useState(null)
  const [count, setCount] = useState(null)
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null) // silinen kayıt sayısı
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
              Hangi aralıktaki kayıtlar silinsin? Bu işlem <span className="font-semibold text-text">geri alınamaz</span>.
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

export default function Settings() {
  const { user } = useAuth()
  const [active, setActive] = useState(null)

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
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

      <div>
        <h2 className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Veri Sıfırlama
        </h2>
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setActive(c)}
              className={`btn-row flex w-full items-center gap-3 px-4 py-3.5 text-left ${
                i > 0 ? 'border-t border-border' : ''
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-text-muted">
                {c.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-text">{c.title}</span>
                <span className="block truncate text-xs text-text-muted">{c.desc}</span>
              </span>
              <span className="text-text-muted">›</span>
            </button>
          ))}
        </div>
        <p className="px-1 pt-2 text-xs leading-relaxed text-text-muted">
          Silme işlemleri yalnızca senin hesabındaki kayıtları etkiler ve geri alınamaz.
        </p>
      </div>

      <ResetSheet category={active} onClose={() => setActive(null)} userId={user.id} />
    </div>
  )
}
