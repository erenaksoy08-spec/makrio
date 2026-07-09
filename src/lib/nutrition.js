export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Hareketsiz', description: 'Masa başı iş, az ya da hiç egzersiz', multiplier: 1.2 },
  { value: 'light', label: 'Az aktif', description: 'Haftada 1-3 gün hafif egzersiz', multiplier: 1.375 },
  { value: 'moderate', label: 'Orta aktif', description: 'Haftada 3-5 gün egzersiz', multiplier: 1.55 },
  { value: 'active', label: 'Aktif', description: 'Haftada 6-7 gün egzersiz', multiplier: 1.725 },
  { value: 'very_active', label: 'Çok aktif', description: 'Günde 2 kez antrenman veya fiziksel iş', multiplier: 1.9 },
]

export const GOALS = [
  { value: 'lose', label: 'Kilo ver', description: 'Kalori açığı ile yağ kaybı', adjustment: -500 },
  { value: 'maintain', label: 'Kiloyu koru', description: 'Mevcut kiloyu sürdür', adjustment: 0 },
  { value: 'gain', label: 'Kilo al', description: 'Kalori fazlası ile kas/kilo kazanımı', adjustment: 300 },
]

export function getActivityLevel(value) {
  return ACTIVITY_LEVELS.find((a) => a.value === value)
}

export function getGoal(value) {
  return GOALS.find((g) => g.value === value)
}

export const KCAL_PER_KG = 7700

// Bazal metabolizma:
// Vücut yağ oranı biliniyorsa Katch-McArdle (yağsız kütleye dayalı, daha hassas),
// bilinmiyorsa Mifflin-St Jeor.
export function calculateBMR({ gender, weight_kg, height_cm, age, bodyFat }) {
  if (bodyFat && bodyFat > 0 && bodyFat < 70) {
    const leanMass = weight_kg * (1 - bodyFat / 100)
    return 370 + 21.6 * leanMass
  }
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
  return gender === 'female' ? base - 161 : base + 5
}

export function calculateTDEE(p) {
  const bmr = calculateBMR(p)
  const activity = getActivityLevel(p.activity_level)
  return bmr * (activity?.multiplier ?? 1.2)
}

// Hedef ve haftalık hıza göre günlük kalori. rateKgPerWeek: pozitif değişim büyüklüğü.
export function targetCalories({ tdee, goal, rateKgPerWeek = 0.5 }) {
  if (goal === 'maintain') return Math.round(tdee)
  const dailyDelta = (rateKgPerWeek * KCAL_PER_KG) / 7
  return Math.round(goal === 'lose' ? tdee - dailyDelta : tdee + dailyDelta)
}

export function macrosForCalories(calories, weight_kg) {
  const protein_g = Math.round(weight_kg * 2)
  const fat_g = Math.round((calories * 0.25) / 9)
  const carbs_g = Math.round(Math.max(0, calories - protein_g * 4 - fat_g * 9) / 4)
  return { protein_g, carbs_g, fat_g }
}

// Makro gramlarından toplam kalori.
export function caloriesFromMacros({ protein_g = 0, carbs_g = 0, fat_g = 0 }) {
  return Math.round(protein_g * 4 + carbs_g * 4 + fat_g * 9)
}

// Kalori hedefi sabit kalır; protein & yağ elle ayarlanınca karbonhidrat kalanı doldurur.
export function carbsForRemaining(calories, protein_g = 0, fat_g = 0) {
  return Math.max(0, Math.round((calories - protein_g * 4 - fat_g * 9) / 4))
}

// Hedef + haftalık hıza göre günlük plan (BMR, TDEE, kalori, makrolar).
export function computePlan({ gender, weight_kg, height_cm, age, bodyFat, activity_level, goal, rate = 0.5 }) {
  const bmr = calculateBMR({ gender, weight_kg, height_cm, age, bodyFat })
  const tdee = bmr * (getActivityLevel(activity_level)?.multiplier ?? 1.2)
  let calories
  if (goal === 'maintain') {
    calories = Math.round(tdee)
  } else {
    const dailyDelta = (rate * KCAL_PER_KG) / 7
    calories = Math.round(goal === 'lose' ? tdee - dailyDelta : tdee + dailyDelta)
  }
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    macros: macrosForCalories(calories, weight_kg),
  }
}

// Verilen kalori hedefine göre haftalık kilo projeksiyonu.
export function projectWeight({ startKg, tdee, calories, weeks = 12 }) {
  const weeklyChange = ((calories - tdee) * 7) / KCAL_PER_KG
  const points = []
  for (let w = 0; w <= weeks; w++) {
    points.push({ week: w, kg: Math.round((startKg + weeklyChange * w) * 10) / 10 })
  }
  return { points, weeklyChange }
}

export function calculateGoals({ gender, weight_kg, height_cm, age, bodyFat, activity_level, goal }) {
  const bmr = calculateBMR({ gender, weight_kg, height_cm, age, bodyFat })
  const activity = getActivityLevel(activity_level)
  const goalInfo = getGoal(goal)

  const tdee = bmr * (activity?.multiplier ?? 1.2)
  const calories = Math.round(tdee + (goalInfo?.adjustment ?? 0))

  const protein_g = Math.round(weight_kg * 2)
  const fat_g = Math.round((calories * 0.25) / 9)
  const carbs_g = Math.round(Math.max(0, calories - protein_g * 4 - fat_g * 9) / 4)

  return { calories, protein_g, carbs_g, fat_g }
}
