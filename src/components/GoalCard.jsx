import { useState } from 'react'
import Sheet from './Sheet'
import GoalEditor from './GoalEditor'

const GOAL_META = {
  lose: { label: 'Kilo verme', icon: '📉' },
  gain: { label: 'Kilo alma', icon: '📈' },
  maintain: { label: 'Formu koruma', icon: '⚖️' },
}

function fmtShort(d) {
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

export default function GoalCard({ goal, calories, currentWeight, targetWeight, rate, onSaved }) {
  const [open, setOpen] = useState(false)
  const meta = GOAL_META[goal] ?? GOAL_META.maintain
  const isDirectional = goal === 'lose' || goal === 'gain'

  let endDate = null
  if (isDirectional && targetWeight && currentWeight && rate) {
    const diff = goal === 'lose' ? currentWeight - targetWeight : targetWeight - currentWeight
    if (diff > 0) endDate = new Date(Date.now() + (diff / rate) * 7 * 86400000)
  }

  function handleClose(saved) {
    setOpen(false)
    if (saved === true) onSaved?.()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-card flex h-full flex-col rounded-3xl border border-white/[0.06] bg-surface p-4 text-left"
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-sm text-text-muted">Hedef</span>
          <span className="text-base">{meta.icon}</span>
        </div>

        {isDirectional && targetWeight ? (
          <div className="mt-2 flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums text-text">{targetWeight}</span>
              <span className="text-sm text-text-muted">kg</span>
            </div>
            <div className="mt-0.5 text-xs tabular-nums text-text-muted">
              {Number(rate).toLocaleString('tr-TR')} kg/hf
            </div>
            {endDate && <div className="text-xs text-text-muted">🎯 {fmtShort(endDate)}</div>}
          </div>
        ) : (
          <div className="mt-2 flex-1">
            <div className="text-base font-semibold text-text">{meta.label}</div>
            {calories ? <div className="text-xs tabular-nums text-text-muted">{calories} kcal/gün</div> : null}
          </div>
        )}

        <div className="mt-2 text-xs font-medium text-accent">Düzenle ›</div>
      </button>

      <Sheet open={open} onClose={() => handleClose(false)} title="Hedefini Ayarla" variant="center">
        <GoalEditor currentWeight={currentWeight} onClose={handleClose} />
      </Sheet>
    </>
  )
}
