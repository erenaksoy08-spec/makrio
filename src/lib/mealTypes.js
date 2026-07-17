export const MEAL_TYPES = [
  { value: 'morning', label: 'Sabah', color: '#FDBA74' },
  { value: 'noon', label: 'Öğle', color: '#FACC15' },
  { value: 'evening', label: 'Akşam', color: '#FB7185' },
  { value: 'night', label: 'Gece', color: '#818CF8' },
]

const LEGACY_TO_NEW = { breakfast: 'morning', lunch: 'noon', dinner: 'evening', snack: 'night' }

export function canonicalMealType(value) {
  return MEAL_TYPES.some((m) => m.value === value) ? value : LEGACY_TO_NEW[value] ?? value
}

export function getMealTypeLabel(value) {
  return MEAL_TYPES.find((m) => m.value === canonicalMealType(value))?.label ?? value
}

export function getMealTypeColor(value) {
  return MEAL_TYPES.find((m) => m.value === canonicalMealType(value))?.color ?? '#a3a3a3'
}

export function defaultMealType() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 16) return 'noon'
  if (hour >= 16 && hour < 22) return 'evening'
  return 'night' // 22:00–04:59
}

const MEAL_HOURS = { morning: [5, 12], noon: [12, 16], evening: [16, 22], night: [22, 5] }

// Kayıt kendi öğün dilimi içinde girildiyse gerçek giriş saati; dilim dışında
// (sonradan) eklendiyse dilimin başlangıç saati gösterilir — "sabah yediğimi
// 15.00'te girdim" kaydında 15.00 değil 05.00 yazar.
export function logDisplayTime(mealType, createdAt) {
  const range = MEAL_HOURS[canonicalMealType(mealType)]
  if (!range || !createdAt) return ''
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return ''
  const [start, end] = range
  const h = d.getHours()
  const inPeriod = start < end ? h >= start && h < end : h >= start || h < end
  return inPeriod
    ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : `${String(start).padStart(2, '0')}:00`
}
