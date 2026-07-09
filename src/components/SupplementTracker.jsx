import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { todayStr } from '../lib/date'

const SUPP_GREEN = '#6FCF97'

export default function SupplementTracker() {
  const { user } = useAuth()
  const today = todayStr()

  const [supps, setSupps] = useState([])
  const [takenIds, setTakenIds] = useState(new Set())
  const [takenAt, setTakenAt] = useState({})
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const [{ data: list, error: listErr }, { data: logs }] = await Promise.all([
      supabase.from('supplements').select('id, name, dose, sort_order').eq('user_id', user.id).order('sort_order').order('created_at'),
      supabase.from('supplement_logs').select('supplement_id, created_at').eq('user_id', user.id).eq('date', today),
    ])
    if (listErr) {
      // Tablolar henüz oluşturulmadıysa bölmeyi sessizce gizle.
      setUnavailable(true)
      setLoading(false)
      return
    }
    setSupps(list ?? [])
    setTakenIds(new Set((logs ?? []).map((l) => l.supplement_id)))
    setTakenAt(Object.fromEntries((logs ?? []).map((l) => [l.supplement_id, l.created_at])))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [user.id])

  async function toggle(id) {
    const next = new Set(takenIds)
    if (next.has(id)) {
      next.delete(id)
      setTakenIds(next)
      setTakenAt((prev) => {
        const { [id]: _, ...rest } = prev
        return rest
      })
      await supabase.from('supplement_logs').delete().eq('user_id', user.id).eq('supplement_id', id).eq('date', today)
    } else {
      next.add(id)
      setTakenIds(next)
      setTakenAt((prev) => ({ ...prev, [id]: new Date().toISOString() }))
      navigator.vibrate?.(8)
      const { data } = await supabase
        .from('supplement_logs')
        .insert({ user_id: user.id, supplement_id: id, date: today })
        .select('created_at')
        .single()
      if (data?.created_at) setTakenAt((prev) => ({ ...prev, [id]: data.created_at }))
    }
  }

  function fmtTime(ts) {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  async function addSupp(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('supplements')
      .insert({ user_id: user.id, name: name.trim(), dose: dose.trim() || null, sort_order: supps.length })
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setSupps((p) => [...p, data])
      setName('')
      setDose('')
      setAdding(false)
    }
  }

  async function removeSupp(id) {
    setSupps((p) => p.filter((s) => s.id !== id))
    await supabase.from('supplements').delete().eq('id', id)
  }

  if (unavailable) return null

  const takenCount = supps.filter((s) => takenIds.has(s.id)).length

  return (
    <div className="rounded-2xl border border-white/5 bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💊</span>
          <span className="text-base font-medium text-text">Takviyeler</span>
        </div>
        {supps.length > 0 && (
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium tabular-nums text-text-muted">
            {takenCount}/{supps.length} alındı
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-3 h-4 w-24 animate-pulse rounded bg-track" />
      ) : (
        <>
          {supps.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              <AnimatePresence initial={false}>
                {supps.map((s) => {
                  const taken = takenIds.has(s.id)
                  return (
                    <motion.li
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="group flex items-center gap-3 rounded-xl bg-white/[0.03] px-2.5 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        className="btn-icon flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                          style={{
                            borderColor: taken ? SUPP_GREEN : 'var(--color-track)',
                            backgroundColor: taken ? SUPP_GREEN : 'transparent',
                          }}
                        >
                          {taken && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13l4 4L19 7" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm ${taken ? 'text-text-muted line-through' : 'text-text'}`}>
                            {s.name}
                            {s.dose && <span className="text-text-muted"> · {s.dose}</span>}
                          </span>
                          {taken && takenAt[s.id] && (
                            <span className="block truncate text-xs" style={{ color: SUPP_GREEN }}>
                              ✓ {fmtTime(takenAt[s.id])}'te alındı
                            </span>
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSupp(s.id)}
                        className="btn-icon shrink-0 px-1 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Sil"
                      >
                        ✕
                      </button>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          )}

          {adding ? (
            <form onSubmit={addSupp} className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Takviye adı (örn. D Vitamini)"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-white/25"
                />
                <input
                  type="text"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="Doz"
                  className="w-20 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-white/25"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="btn-chip flex-1 rounded-xl border border-border py-2 text-sm text-text-muted"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="btn-primary flex-1 rounded-xl py-2 text-sm font-medium text-black disabled:opacity-50"
                  style={{ backgroundColor: SUPP_GREEN }}
                >
                  {saving ? '...' : 'Ekle'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="btn-chip mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-sm text-text-muted hover:border-white/25 hover:text-text"
            >
              + Takviye ekle
            </button>
          )}
        </>
      )}
    </div>
  )
}
