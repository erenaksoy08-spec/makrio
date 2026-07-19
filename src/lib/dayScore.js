import { t } from './i18n'

// Günlük puan: 10 üzerinden.
// Kalori 3.5 · Protein 2.5 · Karb+Yağ 2 · Su 2

function calorieScore(consumed, goal) {
  if (!goal) return 0
  const pct = (Math.abs(consumed - goal) / goal) * 100
  if (pct <= 5) return 3.5
  if (pct <= 10) return 3
  if (pct <= 15) return 2
  if (pct <= 20) return 1
  return 0
}

function proteinScore(consumed, goal) {
  if (!goal) return 0
  const deficitPct = Math.max(0, ((goal - consumed) / goal) * 100)
  if (deficitPct <= 5) return 2.5
  if (deficitPct <= 10) return 2
  if (deficitPct <= 20) return 1
  return 0
}

// Karb veya Yağ — her biri en fazla 1 puan (ikisi toplam 2).
function singleMacroScore(consumed, goal) {
  if (!goal) return 0
  const pct = (Math.abs(consumed - goal) / goal) * 100
  if (pct <= 10) return 1
  if (pct <= 15) return 0.5
  if (pct <= 20) return 0.25
  return 0
}

function waterScore(consumed_ml, goal_ml) {
  if (!goal_ml) return 0
  if (consumed_ml >= goal_ml) return 2
  const shortPct = ((goal_ml - consumed_ml) / goal_ml) * 100
  if (shortPct <= 10) return 1
  return 0
}

export function scoreDay(intake, goals) {
  const cal = calorieScore(intake.calories ?? 0, goals.calories)
  const pro = proteinScore(intake.protein ?? 0, goals.protein_g)
  const carbsFat = singleMacroScore(intake.carbs ?? 0, goals.carbs_g) + singleMacroScore(intake.fat ?? 0, goals.fat_g)
  const water = waterScore(intake.water_ml ?? 0, goals.water_ml)
  const total = Math.round((cal + pro + carbsFat + water) * 10) / 10
  return { total, cal, pro, carbsFat, water }
}

export function scoreLabel(total) {
  if (total >= 9) return t('Mükemmel')
  if (total >= 7) return t('Harika')
  if (total >= 5) return t('İyi')
  if (total >= 3) return t('Orta')
  return t('Zayıf')
}

export function scoreColor(t) {
  if (t >= 10) return '#4FC3F7' // açık mavi
  if (t >= 9) return '#2E8B57' // koyu yeşil
  if (t >= 8) return '#57C97E' // normal yeşil
  if (t >= 6.5) return '#9BE881' // açık yeşil
  if (t >= 5) return '#F2C94C' // sarı
  if (t >= 4) return '#F2994A' // turuncu
  if (t > 0) return '#EF4444' // kırmızı
  return 'var(--color-text-muted)'
}

export function fmtScore(t) {
  return Number.isInteger(t) ? String(t) : t.toFixed(1)
}
