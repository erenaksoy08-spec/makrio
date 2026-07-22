import { t } from '../lib/i18n'

const ROWS = [
  { key: 'protein_g', label: 'Protein', color: '#FF8A5B', kcal: 4, editable: true },
  { key: 'carbs_g', label: 'Karbonhidrat', color: '#6FCF97', kcal: 4, editable: false },
  { key: 'fat_g', label: 'Yağ', color: '#F2C94C', kcal: 9, editable: true },
]

// Kalori hedefi sabittir. Protein ve yağ ±1 g ile elle ayarlanır;
// karbonhidrat kalan kaloriyi otomatik doldurur. onSet(key, gram).
export default function MacroTuner({ calories, macros, manual, onSet, onReset }) {
  return (
    <div className="space-y-2">
      {ROWS.map((m) => {
        const g = Math.round(macros?.[m.key] ?? 0)
        const pct = calories ? Math.round(((g * m.kcal) / calories) * 100) : 0
        return (
          <div key={m.key} className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="truncate text-sm text-text">{t(m.label)}</span>
              <span className="shrink-0 text-xs tabular-nums text-text-muted">%{pct}</span>
            </div>

            {m.editable ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSet(m.key, Math.max(0, g - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-lg leading-none text-text-muted"
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={g}
                  onChange={(e) => onSet(m.key, Math.max(0, Math.round(Number(e.target.value) || 0)))}
                  onFocus={(e) => e.target.select()}
                  className="w-12 bg-transparent text-center text-base font-semibold tabular-nums text-text outline-none"
                />
                <span className="text-xs text-text-muted">g</span>
                <button
                  type="button"
                  onClick={() => onSet(m.key, g + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-lg leading-none text-text-muted"
                >
                  +
                </button>
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-text-muted">{t('otomatik')}</span>
                <span className="w-12 text-center text-base font-semibold tabular-nums text-text">{g}</span>
                <span className="text-xs text-text-muted">g</span>
              </div>
            )}
          </div>
        )
      })}

      <div className="flex items-center justify-between px-1 pt-0.5">
        <span className="text-xs text-text-muted">{t('Karbonhidrat kalan kaloriyi doldurur')}</span>
        <span className="text-sm font-semibold tabular-nums text-text">{calories} kcal</span>
      </div>

      {manual && (
        <button
          type="button"
          onClick={onReset}
          className="btn-chip w-full rounded-lg border border-border py-2 text-center text-xs text-text-muted"
        >
          {t('↺ Otomatik hesaba dön')}
        </button>
      )}
    </div>
  )
}
