import { useState } from 'react'
import { motion } from 'framer-motion'
import WeightChart from './WeightChart'
import { t, getIntlLocale } from '../lib/i18n'

function deltaColorFor(delta, goal) {
  if (delta == null || delta === 0) return 'var(--color-text-muted)'
  const palette =
    goal === 'lose'
      ? { down: '#6FCF97', up: '#EB5757' }
      : goal === 'gain'
        ? { down: '#EB5757', up: '#6FCF97' }
        : null
  if (!palette) return 'var(--color-text-muted)'
  return delta > 0 ? palette.up : palette.down
}

function fmt(n) {
  return (Math.round(n * 10) / 10).toLocaleString(getIntlLocale())
}

export default function WeightTracker({ logs, goal, onAdd }) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const sorted = [...logs].sort((a, b) => (a.logged_at < b.logged_at ? -1 : 1))
  const latest = sorted[sorted.length - 1] ?? null
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null
  const first = sorted[0] ?? null

  const delta = latest && previous ? Math.round((latest.kg - previous.kg) * 10) / 10 : null
  const totalChange = latest && first && sorted.length > 1 ? Math.round((latest.kg - first.kg) * 10) / 10 : null

  async function handleSubmit(e) {
    e.preventDefault()
    const kg = parseFloat(value)
    if (!kg) return
    setSubmitting(true)
    await onAdd(kg)
    setValue('')
    setSubmitting(false)
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/5 bg-surface p-5">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm text-text-muted">{t('Kilo')}</span>
          {latest ? (
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <motion.span
                key={latest.kg}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-4xl font-bold tabular-nums text-text"
              >
                {fmt(latest.kg)}
              </motion.span>
              <span className="text-base text-text-muted">kg</span>
            </div>
          ) : (
            <div className="mt-1 text-sm text-text-muted">{t('Henüz kayıt yok')}</div>
          )}
        </div>

        {delta != null && delta !== 0 && (
          <span
            className="flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
            style={{ color: deltaColorFor(delta, goal), backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            {delta > 0 ? '↑' : '↓'} {fmt(Math.abs(delta))} kg
          </span>
        )}
      </div>

      {/* stats */}
      {sorted.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wide text-text-muted">{t('Başlangıç')}</div>
            <div className="text-sm font-semibold tabular-nums text-text">{fmt(first.kg)} kg</div>
          </div>
          <div className="rounded-xl border border-border px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wide text-text-muted">{t('Toplam değişim')}</div>
            <div className="text-sm font-semibold tabular-nums" style={{ color: deltaColorFor(totalChange, goal) }}>
              {totalChange > 0 ? '+' : ''}
              {fmt(totalChange)} kg
            </div>
          </div>
        </div>
      )}

      <WeightChart logs={sorted} color="#A78BFA" />

      {/* add form — compact & premium */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-bg p-3">
        <div className="mb-2 text-xs text-text-muted">{t('Bugünkü kilon')}</div>
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-baseline justify-center gap-1 rounded-xl bg-surface py-2.5 focus-within:ring-1 focus-within:ring-accent">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder={latest ? String(latest.kg) : '0.0'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-20 bg-transparent text-center text-2xl font-bold tabular-nums text-text outline-none placeholder:text-text-muted/40"
            />
            <span className="text-sm text-text-muted">kg</span>
          </div>
          <motion.button
            type="submit"
            disabled={!value || submitting}
            whileTap={{ scale: 0.9 }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-lg text-black transition-opacity disabled:opacity-30"
          >
            ✓
          </motion.button>
        </div>
      </form>
    </div>
  )
}
