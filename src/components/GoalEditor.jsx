import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  calculateBMR,
  calculateTDEE,
  macrosForCalories,
  carbsForRemaining,
  KCAL_PER_KG,
  maxSafeLossRate,
  calorieFloor,
} from '../lib/nutrition'
import MacroTuner from './MacroTuner'
import PaceWarning, { SafeFloorNote } from './PaceWarning'

const GOAL_OPTIONS = [
  { value: 'lose', label: 'Kilo ver' },
  { value: 'maintain', label: 'Koru' },
  { value: 'gain', label: 'Kilo al' },
]

function fmtDate(d) {
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

function ProjectionChart({ points }) {
  const W = 300
  const H = 90
  const PX = 8
  const PY = 14
  const color = '#A78BFA'
  const kgs = points.map((p) => p.kg)
  const min = Math.min(...kgs)
  const max = Math.max(...kgs)
  const range = max - min || 1
  const xs = (i) => PX + (i / (points.length - 1)) * (W - PX * 2)
  const ys = (kg) => PY + (H - PY * 2) - ((kg - min) / range) * (H - PY * 2)
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)},${ys(p.kg)}`).join(' ')
  const area = `${line} L ${xs(points.length - 1)},${H} L ${xs(0)},${H} Z`
  const last = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="proj-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path key={`a${area}`} d={area} fill="url(#proj-grad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} />
      <motion.path
        key={`l${line}`}
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      <circle cx={xs(0)} cy={ys(points[0].kg)} r="3" fill={color} />
      <circle cx={xs(points.length - 1)} cy={ys(last.kg)} r="4.5" fill={color} />
    </svg>
  )
}

export default function GoalEditor({ currentWeight, onClose }) {
  const { user, profile, refreshProfile } = useAuth()
  const prefs = profile?.preferences ?? {}
  const start = currentWeight || profile?.weight_kg || 0

  const [goal, setGoal] = useState(profile?.goal ?? 'maintain')
  const [rate, setRate] = useState(prefs.goalRate ?? 0.5)
  const [target, setTarget] = useState(() => {
    if (prefs.targetWeight) return prefs.targetWeight
    return profile?.goal === 'gain' ? Math.round(start + 5) : Math.round(start - 5)
  })
  const [manualMacros, setManualMacros] = useState(prefs.manualMacros ?? null)
  // Koru modu ince ayarı: bakım kalorisine çok küçük bir elle kaydırma (±150 kcal).
  const [maintainAdjust, setMaintainAdjust] = useState(prefs.maintainAdjust ?? 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const hasBody = profile?.weight_kg && profile?.height_cm && profile?.age && profile?.gender

  const calc = useMemo(() => {
    if (!hasBody) return null
    const bodyProfile = { ...profile, bodyFat: prefs.bodyFat }
    const bmr = Math.round(calculateBMR(bodyProfile))
    const tdee = Math.round(calculateTDEE(bodyProfile))

    // kalori hedefi hıza göre sabittir; kilo vermede güvenli tabanın altına inmez
    let calories
    if (goal === 'maintain') {
      calories = tdee + Number(maintainAdjust || 0)
    } else {
      const dailyDelta = (rate * KCAL_PER_KG) / 7
      calories = Math.round(goal === 'lose' ? tdee - dailyDelta : tdee + dailyDelta)
      if (goal === 'lose') calories = Math.max(calories, calorieFloor(profile?.gender))
    }
    const autoMacros = macrosForCalories(calories, start)

    // elle ayar sadece protein & yağı değiştirir; karbonhidrat kalanı doldurur, kalori sabit kalır
    const protein_g = manualMacros ? manualMacros.protein_g : autoMacros.protein_g
    const fat_g = manualMacros ? manualMacros.fat_g : autoMacros.fat_g
    const macros = { protein_g, fat_g, carbs_g: carbsForRemaining(calories, protein_g, fat_g) }

    if (goal === 'maintain') {
      return { bmr, tdee, calories, macros, points: [{ kg: start }, { kg: start }], valid: true }
    }

    const diff = goal === 'lose' ? start - target : target - start
    const valid = diff > 0
    const weeks = valid ? diff / rate : 0
    const endDate = valid ? new Date(Date.now() + weeks * 7 * 86400000) : null

    const n = Math.max(1, Math.min(20, Math.round(weeks)))
    const points = []
    for (let i = 0; i <= n; i++) points.push({ kg: Math.round((start + (target - start) * (i / n)) * 10) / 10 })

    return { bmr, tdee, calories, macros, points, valid, weeks, endDate }
  }, [profile, goal, rate, target, start, hasBody, manualMacros, maintainAdjust])

  if (!hasBody) {
    return <p className="py-6 text-center text-sm text-text-muted">Önce profil bilgilerini tamamla.</p>
  }

  const canSave = goal === 'maintain' || calc.valid

  // Kilo vermede hız, kalori tabanına dayandığı noktada durur.
  const rateCap = goal === 'lose' ? 1.4 : 1
  const rateMax = goal === 'lose' && calc ? maxSafeLossRate({ tdee: calc.tdee, gender: profile?.gender }) : rateCap

  async function handleSave() {
    setSaving(true)
    setError('')
    const nextPrefs = { ...prefs }
    if (goal === 'maintain') {
      delete nextPrefs.targetWeight
      delete nextPrefs.goalRate
      if (Number(maintainAdjust)) nextPrefs.maintainAdjust = Number(maintainAdjust)
      else delete nextPrefs.maintainAdjust
    } else {
      nextPrefs.targetWeight = Number(target)
      nextPrefs.goalRate = Math.min(Number(rate), rateMax)
      delete nextPrefs.maintainAdjust
    }
    if (manualMacros) nextPrefs.manualMacros = manualMacros
    else delete nextPrefs.manualMacros
    const { error: pErr } = await supabase.from('profiles').update({ goal }).eq('id', user.id)
    // preferences kolonu RLS nedeniyle doğrudan update edilemiyor; RPC ile yazılır.
    const { error: prefErr } = await supabase.rpc('update_preferences', { p_preferences: nextPrefs })
    const { error: gErr } = await supabase.from('user_goals').upsert(
      { user_id: user.id, calories: calc.calories, protein_g: calc.macros.protein_g, carbs_g: calc.macros.carbs_g, fat_g: calc.macros.fat_g },
      { onConflict: 'user_id' },
    )
    setSaving(false)
    if (pErr || prefErr || gErr) {
      setError('Kaydedilemedi, tekrar dene.')
      return
    }
    await refreshProfile()
    onClose?.(true)
  }

  return (
    <div className="space-y-5">
      {/* goal segmented — calm neutral */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-bg p-1">
        {GOAL_OPTIONS.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => {
              setGoal(g.value)
              setManualMacros(null)
              // 1 kg/hafta üzeri yalnızca kilo vermede seçilebilir.
              if (g.value !== 'lose') setRate((r) => Math.min(r, 1))
            }}
            className={`rounded-lg py-2 text-sm font-medium transition-colors ${
              goal === g.value ? 'bg-white/10 text-text' : 'text-text-muted'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {goal === 'maintain' && (
        <div className="rounded-xl border border-border px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-text-muted">İnce ayar</span>
            <span className="text-sm font-semibold tabular-nums text-text">
              {Number(maintainAdjust) === 0
                ? 'Dengede'
                : `${Number(maintainAdjust) > 0 ? '+' : ''}${maintainAdjust} kcal`}
            </span>
          </div>
          <input
            type="range"
            min="-150"
            max="150"
            step="10"
            value={maintainAdjust}
            onChange={(e) => {
              setMaintainAdjust(Number(e.target.value))
              setManualMacros(null)
            }}
            className="w-full accent-[color:var(--color-accent)]"
          />
          <div className="mt-1 flex justify-between text-[10px] text-text-muted">
            <span>−150</span>
            <span>0</span>
            <span>+150</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
            Koruma kalorisini küçük adımlarla kendine göre kaydır — günlük yakımın çevresinde ufak bir esneklik.
          </p>
        </div>
      )}

      {goal !== 'maintain' && (
        <>
          {/* target weight */}
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <span className="text-sm text-text-muted">Hedef kilo</span>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-16 bg-transparent text-right text-xl font-bold tabular-nums text-text outline-none"
              />
              <span className="text-sm text-text-muted">kg</span>
            </div>
          </div>

          {/* rate slider — manual */}
          <div className="rounded-xl border border-border px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-text-muted">Haftalık hız</span>
              <span className="text-sm font-semibold tabular-nums text-text">
                {Number(rate).toLocaleString('tr-TR')} kg/hf
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max={rateMax}
              step="0.05"
              value={Math.min(Number(rate), rateMax)}
              onChange={(e) => {
                setRate(Number(e.target.value))
                setManualMacros(null)
              }}
              className="w-full accent-[color:var(--color-accent)]"
            />
            <div className="mt-1 flex justify-between text-[10px] text-text-muted">
              <span>yavaş</span>
              <span>hızlı</span>
            </div>
            <PaceWarning show={goal === 'lose' && Math.min(Number(rate), rateMax) >= 1} />
            <SafeFloorNote
              show={goal === 'lose' && rateMax < 1.4 && Number(rate) >= rateMax}
              floor={calorieFloor(profile?.gender)}
            />
          </div>
        </>
      )}

      {/* bmr / tdee */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-wide text-text-muted">Bazal (BMR)</div>
          <div className="text-sm font-semibold tabular-nums text-text">{calc.bmr} kcal</div>
        </div>
        <div className="rounded-xl border border-border px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-wide text-text-muted">Günlük yakım</div>
          <div className="text-sm font-semibold tabular-nums text-text">{calc.tdee} kcal</div>
        </div>
      </div>

      {/* target calories — neutral */}
      <div className="rounded-2xl border border-border bg-bg p-4 text-center">
        <div className="text-xs text-text-muted">Günlük kalori hedefin</div>
        <div className="mt-0.5 text-3xl font-bold tabular-nums text-text">{calc.calories}</div>
        <div className="text-xs text-text-muted">kcal</div>
      </div>

      {/* manuel makro ayarı */}
      <div className="rounded-2xl border border-border p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-sm font-medium text-text">Makrolar</span>
          <span className="text-xs text-text-muted">{manualMacros ? 'Elle ayarlandı' : 'Otomatik'}</span>
        </div>
        <MacroTuner
          calories={calc.calories}
          macros={calc.macros}
          manual={!!manualMacros}
          onSet={(k, v) =>
            setManualMacros({ protein_g: calc.macros.protein_g, fat_g: calc.macros.fat_g, [k]: v })
          }
          onReset={() => setManualMacros(null)}
        />
      </div>

      {/* projection */}
      <div className="rounded-2xl border border-white/5 bg-bg p-4">
        {goal === 'maintain' ? (
          <p className="py-4 text-center text-sm text-text-muted">
            Mevcut kilonu koruyacaksın.
            {Number(maintainAdjust) !== 0 && (
              <span className="mt-1 block text-xs">
                Günlük yakımın {Number(maintainAdjust) > 0 ? '+' : ''}
                {maintainAdjust} kcal ince ayarlı.
              </span>
            )}
          </p>
        ) : !calc.valid ? (
          <p className="py-4 text-center text-sm text-text-muted">
            Hedef kilo, güncel kilonun {goal === 'lose' ? 'altında' : 'üstünde'} olmalı.
          </p>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-text-muted">Tahmini bitiş</span>
              <span className="text-sm font-semibold text-text">{fmtDate(calc.endDate)}</span>
            </div>
            <ProjectionChart points={calc.points} />
            <p className="mt-1 text-center text-xs text-text-muted">
              {start} kg → {target} kg · ~{Math.round(calc.weeks)} hafta
            </p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={saving || !canSave}
        onClick={handleSave}
        className="btn-primary w-full rounded-xl bg-accent py-3 font-semibold text-black disabled:opacity-40"
      >
        {saving ? 'Kaydediliyor...' : 'Hedefi kaydet'}
      </motion.button>
    </div>
  )
}
